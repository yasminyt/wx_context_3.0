let configDeviceId;

Page({
  data: {
    device: ''
  },
  onLoad: function (options) {
    //configDeviceId = options.deviceId;

    this.setData({device: `${options.deviceId}-----------${options.name}`})
  },

  // 提交配置参数
  submit: () => {

  },

  // 转到说明界面
  toStatement: () => {
    wx.navigateTo({
      url: '../statement/statement'
    })
  },
  
})