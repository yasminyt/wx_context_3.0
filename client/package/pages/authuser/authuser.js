import {
  Base64
} from '../../../vendor/js-base64-2.4.8/base64'

var config = require('../../../config')
var util = require('../../../utils/util')

let authDevce_list = [],
  user_openId = '',            // 授权用户的openId
  authUser_openId = '';   // 被授权用户的openId

Page({
  data: {
    device: [],
    index: 0,
    nickName: "",
    showTopTips: false
  },

  onShow: function() {
    user_openId = util.isLogin()
    if (user_openId)
      this.doRequest("query_device", {
        openId: user_openId
      }, 'onShow')
  },

  bindPickerChange: function(e) {
    this.setData({
      index: e.detail.value
    })
  },

  scanUser: function() {
    const that = this
    wx.scanCode({
      onlyFromCamera: false,
      success: function(res) {
        authUser_openId = Base64.decode(res.result) //根据密文解出对应的openId
        that.doRequest("query_select", {
          table: 'cSessionInfo',
          param: {
            open_id: authUser_openId
          },
          value: 'user_info'
        }, "scanUser")
      }
    })
  },

  showPicker: function(data) {
    authDevce_list = data
    if (authDevce_list.length !== 0) {
      let device = []
      authDevce_list.forEach((element, index) => {
        device[index] = `${element.mac_id} ---------- ${element.name}`
      });
      this.setData({
        device: device
      })
      wx.hideToast()
    } else 
      this.showModal("请求失败，您没有可以授权的设备", "showPicker")
  },

  showNickName: function(data) {
    data = JSON.parse(data[0].user_info)
    this.setData({
      nickName: data.nickName,
      showTopTips: false
    })
    wx.hideToast()
  },

  submit: function() {
    if (authUser_openId === '') return this.setData({
      showTopTips: true
    })
    //先判断该授权是否已存在
    const authMac_id = authDevce_list[this.data(index)]
    this.doRequest("query", {
      table: "authorization",
      values: {
        mac_id: authMac_id,
        open_id: authUser_openId
      }
    }, "submit", authMac_id)
  },

  resSubmit: function(data, mac_id) {
    if (data.length === 0)  // 可以授权
      this.doRequest("create", {
        table: "authorization",
        values: {
          auth_id: 0,
          mac_id: mac_id,
          open_id: authUser_openId,
          auth_time: util.formatTime(new Date()),
          auth_open_id: user_openId
        }
      })
    // else 
    //   this.showModal(`${this}用户已拥有${}设备的使用权，不可再进行授权`)
  },

  doRequest: function(url, data, fromFun, mac_id) {
    const that = this
    util.showBusy('加载中……')
    wx.request({
      url: `${config.service.host}/weapp/${url}`,
      method: "POST",
      data: data,
      success(result) {
        result = result.data.data
        switch (fromFun) {
          case "onShow":
            {
              that.showPicker(result);
              break;
            }
          case "scanUser":
            {
              that.showNickName(result);
              break;
            }
          case "submit":
            {
              that.resSubmit(result, mac_id)
            }
          default:
            break;
        }
      },
      fail(result) {
        console.log('fail-------')
        console.log(result)
      }
    })
  },

  showModal: function (content, action) {
    wx.hideToast()
    wx.showModal({
      title: '提 示',
      content: content,
      showCancel: false,
      success: function(res) {
        if (action === 'showPicker')
        wx.navigateBack({
          delta: 1,
        })
      }
    })
  }
})