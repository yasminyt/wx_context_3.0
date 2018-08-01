const config = require('../../../config')
const util = require('../../../utils/util')

let open_id = '',
  authDevice_list = [],   // 包含的字段 ## auth_id, mac_id, name ##
  index = -1

Page({
  data: {
    device: [],
    showTopTips: false
  },

  radioChange: function(e) {
    for (let i = 0; i < authDevice_list.length; ++i) {
      authDevice_list[i].checked = authDevice_list[i].mac_id == e.detail.value;
      if (authDevice_list[i].checked) index = i;
    }

    this.setData({
      device: authDevice_list,
      showTopTips: false
    });
  },

  onShow: function() {
    open_id = util.isLogin()
    if (open_id)
      this.doRequest("query_innerJoin", {
        param: { open_id: open_id }
      }, 'onShow')
  },

  showItems: function(data) {
    authDevice_list = data
    if (authDevice_list.length !== 0) {
      this.setData({
        device: authDevice_list
      })
      wx.hideToast()
    } else {
      util.showModal("提示", "请求失败，您还没有绑定任何电针治疗仪设备")
      this.setData({
        device: []
      })
      index = -1
    }
  },

  submit: function() {
    if (index === -1)
      return this.setData({
        showTopTips: true
      })
    const that = this
    wx.showModal({
      title: '提示',
      content: `是否确定要与${authDevice_list[index].name}设备解除绑定，解除后您不可以再操作设备`,
      showCancel: true,
      cancelText: '取消',
      confirmText: '确定',
      success: function(res) {
        if (res.confirm)
          that.doRequest('update', {
            table: 'authorization',
            values: {
              dis_auth_open_id: open_id,
              dis_auth_time: util.formatTime(new Date())
            },
            params: {
              auth_id: authDevice_list[index].auth_id
            }
          }, 'submit')
      }
    })
  },

  resSubmit: function(data) {
    if (data) {
      wx.hideToast()
      util.showSuccess('解绑成功')
      setTimeout(() => {
        this.doRequest("query_innerJoin", {
          param: { open_id: open_id }
        }, 'onShow')
      }, 1500);
    }
  },

  doRequest: function(url, data, fromFun) {
    const that = this
    util.showBusy('加载中')
    wx.request({
      url: `${config.service.host}/weapp/${url}`,
      method: "POST",
      data: data,
      success(result) {
        console.log(result)
        result = result.data.data
        switch (fromFun) {
          case "onShow":
            {
              that.showItems(result)
              break
            }
          case "submit":
            {
              that.resSubmit(result)
              break
            }
          default:
            break
        }
      },
      fail(result) {
        console.log('fail-------')
        console.log(result)
      }
    })
  },
})