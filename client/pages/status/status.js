const config = require('../../config')
const util = require('../../utils/util')
const ble_util = require('../index/bleutil')

let open_id

let interval
let work = true

Page({
  data: {
    workList: [],
    downTime: ''
  },

  onShow: function() {
    clearInterval(interval)
    open_id = util.isLogin()
    if (open_id) 
      this.queryList('on')
  },

  reset: function (e) {
    let configId = e.target.dataset.configid
    let deviceId = e.target.dataset.deviceid
    let status = e.target.dataset.status
    let name = e.target.dataset.devicename

    if (status === 'work') {
      return util.showModal('操作失败', '请先暂停设备再进行重新设置！')
    }

    work = true
    wx.navigateTo({
      url: `../config/config?configId=${configId}&deviceId=${deviceId}&name=${name}`
    })
  },

  doAction: function(e) {
    const that = this
    let config_id = e.target.dataset.configid
    let deviceId = e.target.dataset.deviceid
    let status = e.target.dataset.status
    let downTime = e.target.dataset.downtime

    let array = new Int8Array(12)

    if (status === 'work') { // 点击##暂停##按钮
      work = false
      util.showBusy('正在停止')
      // 停止倒计时
      clearInterval(interval)
      // 发送 停止 指令、更新数据库记录状态
      array[0] = 0
      this.sendData(array[0], deviceId, array, config_id, () => {
        that.queryList('off')
      })
    } else if (downTime === '00min 00s') { // 点击 删除任务 按钮
      util.showBusy('正在请求')

      // 更新数据库记录
      this.sendData('off', deviceId, array,config_id, res => {
        if (res)
          that.queryList('off')
      })
    } else { //  点击 重新启动 按钮
      work = true
      util.showBusy('正在重启')
      // 发送 重启 指令
      array[0] = 2
      this.sendData(array[0], deviceId, array, config_id, res => {
        if (res) 
          that.queryList('on')
      })
    }
  },

  setDownTime: function () {
    const that = this
    ble_util.sendTime(timeArray => {
      if (typeof timeArray !== 'undefined') {
        timeArray[0] = timeArray[0] - 48
        timeArray[1] = timeArray[1] - 48
        timeArray[2] = timeArray[2] - 48
        timeArray[3] = timeArray[3] - 48
        that.setData({
          downTime: `${timeArray[0]}${timeArray[1]}min ${timeArray[2]}${timeArray[3]}s`
        })

        if (!timeArray[0] && !timeArray[1] && !timeArray[2] && !timeArray[3]) { // 设备完成工作
          work = false
          clearInterval(interval)
          that.doneWork()
        } 
      }
    })
  },

  sendData: function(value, deviceId, array, config_id, callback) {
    const that = this
    for (let i = 1; i < 12; i++) array[i] = 0

    ble_util.sendFrame(deviceId, array, res => {
      if (res) {
        that.update(value, config_id, succes => {
          if (succes) {
            util.showSuccess('操作成功')
            callback && callback(true)
          }
        })
      }
    })
  },

  queryList: function (status) {
    // 从#configuration#表中读取所有状态为#work/standby#的记录
    this.doRequest('query_whereIn', {
      table: 'configuration',
      value: 'status',
      array: ['work', 'standby'],
      params: { open_id: open_id }
    }, res => {
      if (res) {
        if ((status === 'on') && work) 
          interval = setInterval(this.setDownTime, 1000)
        this.setData({
          workList: res
        })
      }
    })
  },

  update: function (value, config_id, callback) {
    this.doRequest('update', {
      table: 'configuration',
      values: {
        status: (value === 'off') ? 'off' : ((value) ? 'work' : 'standby')
      },
      params: {
        config_id: config_id
      }
    }, () => {
      callback && callback(true)
    })
  },

  doneWork: function () {
    util.showModal('提 示', '设备已完成工作！')
    const that = this
    // 更新记录状态
    this.update(0, this.data.workList[0].config_id, succes => {
      if (succes) {
        that.queryList('off')
      }
    })
  },

  doRequest: function(crud, data, callback) {
    wx.request({
      url: `${config.service.host}/weapp/${crud}`,
      method: "POST",
      data: data,
      complete(result) {
        console.log(result)
        result = result.data.data
        callback(result)
      }
    })
  }
})