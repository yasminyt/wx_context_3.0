const config = require('../../config')
const util = require('../../utils/util')
const ble_util = require('../index/bleutil')

let interval;

Page({
  data: {
    //workList: [{ config_id: 1, mac_id: '12:23:34:45', mac_name: 'demo1', status: 'work', mode: 0, intensity: '78', freq: '90', setTime: '30', downTime: '25min30s'}]
    workList: [],
    downTime: ''
  },

  onReady: function() {

  },

  onShow: function() {
    const open_id = util.isLogin()
    if (open_id)
      // 从#configuration#表中读取所有状态为#work/standby#的记录
      this.doRequest('query_whereIn', {
        table: 'configuration',
        value: 'status',
        array: ['work', 'standby']
      }, res => {
        if (res) {
          // interval = setInterval(ble_util.sendTime(res => {
          //   let time = res
          //   console.log('getTime --- ', time)
          // }), 1000)
          this.setData({
            workList: res
          })
        }
      })
  },

  reset: function (e) {
    let configId = e.target.dataset.configId
    let deviceId = e.target.dataset.deviceId
    let status = e.target.dataset.status
    let name = e.target.dataset.deviceName

    if (status === 'work') {
      return util.showModal('操作失败', '请先暂停设备再进行重新设置！')
    }

    wx.redirectTo({
      url: `../config/config?configId=${configId}&deviceId=${deviceId}&name=${name}`
    })
  },

  doAction: function(e) {
    let config_id = e.target.dataset.configId
    let deviceId = e.target.dataset.deviceId
    let status = e.target.dataset.status
    let downTime = e.target.dataset.downTime

    let array = new Int8Array(12)

    if (status === 'work') { // 点击##暂停##按钮
      util.showBusy('正在停止')
      // 停止倒计时

      // 发送 停止 指令、更新数据库记录状态
      array[0] = 0
      this.sendData(deviceId, array, config_id, () => {})
    } else if (downTime === '00min00s') { // 点击 删除任务 按钮
      util.showBusy('正在请求')

      // 更新数据库记录
    } else { //  点击 重新启动 按钮
      util.showBusy('正在重启')
      // 发送 重启 指令
      array[0] = 2
      this.sendData(deviceId, array, config_id, res => {
        // 重新倒计时
        if (res) {

        }
      })
    }
  },

  setDownTime: function () {

  },

  sendData: function(deviceId, array, config_id, callback) {
    const that = this
    for (let i = 1; i < 12; i++) array[i] = 0

    ble_util.sendFrame(deviceId, array, res => {
      if (res) {
        // 更新数据库记录
        that.doRequest('update', {
          table: 'configuration',
          values: {
            status: array[0] ? 'work' : 'standby'
          },
          params: {
            config_id: config_id
          }
        }, () => {
          util.showSuccess('操作成功')
          callback && callback(true)
        })
      }
    })
  },

  doRequest: function(crud, data, callback) {
    const that = this
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