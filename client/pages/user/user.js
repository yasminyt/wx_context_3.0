var qcloud = require('../../vendor/wafer2-client-sdk/index')
var config = require('../../config')
var util = require('../../utils/util')

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
    const session = qcloud.Session.get();
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

  // 切换是否带有登录态
  /**
   * swichRequestMode: function (e) {
    this.setData({  takeSession: e.detail.value })
    this.doRequest()
  },

  doRequest: function () {
    util.showBusy('请求中...')
    const that = this
    const options = {
      url: config.service.requestUrl,
      login: true,
      success (result) {
        util.showSuccess('请求成功完成')
        console.log('request success', result)
        that.setData({
          requestResult: JSON.stringify(result.data)
        })
      },
      fail (error) {
        util.showModal('请求失败', error)
        console.log('request fail', error)
      }
    }
    if (this.data.takeSession) {   // 使用 qcloud.request 带登录态登录
      qcloud.request(options)
    } else    // 使用 wx.request 则不带登录态
      wx.request(options)
  }
   * 
   * 
   */
  
  
})
