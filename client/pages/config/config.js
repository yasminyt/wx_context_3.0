const config = require('../../config')
const util = require('../../utils/util')
const ble_util = require('../index/bleutil')

let deviceId, deviceName, configId, open_id;

Page({
  data: {
    device: ''
  },
  onLoad: function(options) {
    deviceId = options.deviceId
    deviceName = options.name
    configId = options.configId

    console.log(configId)

    this.setData({
      device: `${deviceId}-----------${deviceName}`
    })
  },

  onShow: function() {
    open_id = util.isLogin()
  },

  // 提交配置参数
  formSubmit: function(e) {
    const that = this
    wx.showModal({
      title: '提示',
      content: '是否确认提交该配置参数？',
      showCancel: true,
      cancelText: '取消',
      confirmText: '确定',
      success: function(res) {
        if (res.confirm) {
          util.showBusy('数据发送中')
          let values = {
            mode: parseInt(e.detail.value.mode),
            intensity: parseInt(e.detail.value.intensity),
            freq: parseInt(e.detail.value.freq),
            set_time: parseInt(e.detail.value.time)
          }

          let array = new Int8Array(12)
          array[0] = 1;
          array[1] = values.mode;
          array[2] = values.intensity;
          array[3] = values.freq;
          array[4] = values.set_time;
          array[5] = 1 + array[1] + array[2] + array[3] + array[4];
          for (let i = 6; i < 12; i++) array[i] = 0;
          ble_util.sendFrame(deviceId, array, res => {
            if (res) {
              util.showBusy('正在保存配置')
              that.setStorage(values)
              if (configId)
                that.doRequest('update', {
                  table: 'configuration',
                  values: {
                    status: 'off'
                  },
                  params: {
                    config_id: configId
                  }
                })
            }
          })
        }
      }
    })
  },

  setStorage: function(values) {
    values.config_id = 0
    values.mac_id = deviceId
    values.mac_name = deviceName
    values.open_id = open_id
    values.create_time = util.formatTime(new Date())
    values.create_day = values.create_time.split(' ')[0]
    values.status = 'work'

    this.doRequest('create', {
      table: 'configuration',
      values: values
    })
  },

  doRequest: function(crud, data) {
    wx.request({
      url: `${config.service.host}/weapp/${crud}`,
      method: "POST",
      data: data,
      success(result) {
        console.log(result)
        if (crud === 'create') {
          util.showModal('提  示', '数据发送成功，并已将配置信息进行保存！')
          wx.switchTab({
            url: '../status/status'
          })
        }
      },
      fail(result) {
        console.log('fail-------')
        console.log(result)
      }
    })
  },

  // 转到说明界面
  toStatement: () => {
    wx.navigateTo({
      url: '../../package/pages/statement/statement'
    })
  },

})