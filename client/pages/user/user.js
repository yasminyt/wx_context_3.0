var qcloud = require('../../vendor/wafer2-client-sdk/index')
var util = require('../../utils/util')

let session;

Page({
  data: {
    userInfo: {},
    logged: false,
    takeSession: false,
    requestResult: '',

    total_days: 433,
    total_times: '201小时71分'
  },
  onLoad: function () {
    session = qcloud.Session.get();
    if (session) {
      util.showBusy('更新中')
      // 第二次登录
      // 或者本地已经有登录态
      // 使用本函数更新登录态
      qcloud.loginWithCode({
        success: res => {
          this.setData({ userInfo: res, logged: true })
          util.showSuccess('登录状态已更新')
        },
        fail: err => {
          console.error(err)
        }
      })
    } else {
      this.setData({ userInfo: {}, logged: false })
    }
  },

  onShow: function () {
    session = qcloud.Session.get();
    if (!session)  this.setData({ userInfo: {}, logged: false })
  },

  // 用户登录
  bindGetUserInfo: function () {
    if (this.data.logged) return

    util.showBusy('正在登录');

    // 首次登录
    qcloud.login({
      success: res => {
        this.setData({ userInfo: res, logged: true })
        util.showSuccess('登录成功')
      },
      fail: err => {
        console.error(err)
        util.showModal('登录错误', err.message)
      }
    })
  },
  
  toQrcode: function () {
    if (Object.keys(this.data.userInfo).length) 
      wx.navigateTo({
        url: `../../package/pages/qrcode/qrcode?openId=${this.data.userInfo.openId}&nickName=${this.data.userInfo.nickName}&avatarUrl=${this.data.userInfo.avatarUrl}`,
        success: function(res) {},
        fail: function(res) {},
        complete: function(res) {},
      })
    else
      util.showModal('请求失败', '请先登录再进行操作！')
  }
})
