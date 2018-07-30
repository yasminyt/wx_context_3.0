Page({
  data: {
    content: ''
  },
  onLoad: function (options) {
    this.setData({
      content: options.content
    })
  },
  reback: () => {
    wx.navigateBack({
      delta: 1,
    })
  }
});