const config = require('../../config')
const util = require('../../utils/util')

let deviceId, deviceName, open_id;

Page({
  data: {
    device: ''
  },
  onLoad: function (options) {
    deviceId = options.deviceId
    deviceName = options.name

    this.setData({device: `${deviceId}-----------${deviceName}`})
  },

  onShow: function () {
    open_id = util.isLogin()
  },

  // 提交配置参数
  formSubmit: function (e) {
    const that = this
    wx.showModal({
      title: '提示',
      content: '是否确认提交该配置参数？',
      showCancel: true,
      cancelText: '取消',
      confirmText: '确定',
      success: function(res) {
        if (res.confirm) {
          util.showBusy('发送中')
          let values = {
            mode: parseInt(e.detail.value.mode),
            intensity: parseInt(e.detail.value.intensity),
            freq: parseInt(e.detail.value.freq),
            set_time: parseInt(e.detail.value.time)
          }
          
          that.setStorage(values)          
        }
      }
    })

  },

  setStorage: function (values) {
    values.config_id = 0
    values.mac_id = deviceId
    values.mac_name = deviceName
    values.open_id = open_id
    values.create_time = util.formatTime(new Date())
    values.create_day = values.create_time.split(' ')[0]

    wx.request({
      url: `${config.service.host}/weapp/create`,
      method: "POST",
      data: {
        table: 'configuration',
        values: values
      },
      success (result) {
        console.log(result)
        util.showModal('提  示', '请求发送成功，并已将配置信息进行保存！')
        wx.switchTab({
          url: '../status/status'
        })
      },
      fail (result) {
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