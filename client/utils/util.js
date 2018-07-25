const qclund = require('../vendor/wafer2-client-sdk/index')

const formatTime = date => {
  const year = date.getFullYear()
  const month = date.getMonth() + 1
  const day = date.getDate()
  const hour = date.getHours()
  const minute = date.getMinutes()
  const second = date.getSeconds()

  return [year, month, day].map(formatNumber).join('/') + ' ' + [hour, minute, second].map(formatNumber).join(':')
}

const formatNumber = n => {
  n = n.toString()
  return n[1] ? n : '0' + n
}

const formatDay = (year, month, day) => {
  return [year, month, day].map(formatNumber).join('/');
};

const isLogin = () => {
  const session = qclund.Session.get()

  if (!session)
    wx.showModal({
      title: '请求失败',
      content: '请先登录再进行操作',
      showCancel: false,
      success: function(res) {
        wx.switchTab({
          url: '../user/user',
        })
      }
    })
  else
    return session.userinfo.openId
};


// 显示繁忙提示
var showBusy = text => wx.showToast({
  title: text,
  icon: 'loading',
  duration: 10000
})

// 显示成功提示
var showSuccess = text => wx.showToast({
  title: text,
  icon: 'success'
})

// 显示失败提示
var showModal = (title, content) => {
  wx.hideToast();

  wx.showModal({
    title,
    content: content,
    showCancel: false
  })
}

module.exports = {
  formatTime,
  formatDay,
  isLogin,
  showBusy,
  showSuccess,
  showModal
}