const qclund = require('../../vendor/wafer2-client-sdk/index')
const config = require('../../config')
const util = require('../../utils/util')

Page({
  data: {
    //workList: [{ config_id: 1, mac_id: '12:23:34:45', mac_name: 'demo1', status: 'work', mode: 0, intensity: '78', freq: '90', setTime: '30', downTime: '25min30s'}]
    workList: []
  },

  onReady: function() {
    
  },

  onShow: function () {
    // 从#configuration#表中读取所有状态为#work/standby#的记录
    //this.doRequest('whereInquery', {table: 'configuration', value: 'status', array: ['work', 'standby']}, "showRecord")
  },

  // 显示从数据库中读出的##正在工作##的设备
  showRecord: function (res) {
    console.log(res)
    if (res) {
      // todo 这里还需要处理倒计时和波形图输出
      this.setData({ workList: res })
    }
  },

  doAction: function (e) {
    const deviceId = e.target.dataset.deviceId
    const status = e.target.dataset.status
    const downTime = e.target.dataset.downTime

    // 点击##暂停##按钮
    if (status === 'work') {

    }
  },

  doRequest: function (crud, data, action) {
    const that = this
    wx.request({
      url: `${config.service.host}/weapp/${crud}`,
      method: "POST",
      data: data,
      complete (result) {
        result = result.data.data
        switch (action) {
          case 'showRecord': {  that.showRecord(result);  break;  }     //显示正在工作的记录
          case 'addDevice': { that.addDevice(result); break;  }         //添加设备到可用列表
          default: break;
        }
      }
    })
  }
})