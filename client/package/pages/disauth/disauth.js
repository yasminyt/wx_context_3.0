const config = require('../../../config')
const util = require('../../../utils/util')

let open_id = '',
    auth_list = [],   // 包含的字段 ## auth_id, mac_id, name ##
    index = -1

Page({
  data: {
    showTopTips: false,
    authList: []
  },

  radioChange: function(e) {
    for (let i = 0; i < auth_list.length; ++i) {
      auth_list[i].checked = auth_list[i].auth_id == e.detail.value
      if (auth_list[i].checked) index = i
    }

    this.setData({
      authList: auth_list,
      showTopTips: false
    });
  },

  onShow: function() {
    open_id = util.isLogin('package')
    if (open_id)
      this.loadData()
  },

  submit: function () {
    if (index === -1)
      return this.setData({
        showTopTips: true
      })
    const that = this
    wx.showModal({
      title: '提示',
      content: `是否确定要取消 ${auth_list[index].nickName} 用户使用${auth_list[index].name}设备的权限，取消后该用户不可再操作设备`,
      showCancel: true,
      cancelText: '取消',
      confirmText: '确定',
      success: res => {
        if (res.confirm)
          that.doRequest('update', {
            table: 'authorization',
            values: {
              dis_auth_open_id: open_id,
              dis_auth_time: util.formatTime(new Date())
            },
            params: {
              auth_id: auth_list[index].auth_id
            }
          }, result => {
            if (result) {
              util.showSuccess('已取消授权')
              setTimeout(() => {
                this.loadData()
              }, 1500);
            }
          })
      }
    })
  },

  loadData: function () {
    const that = this
    this.doRequest("query_multi_leftJoin", {   // 获取是自己授权的授权记录
      param: { auth_open_id: open_id }
    }, res => {
      for (let i = 0; i < res.length; i++) {
        let user_info = JSON.parse(res[i].user_info)
        res[i].nickName = user_info.nickName
      }
      auth_list = res
      that.setData({ authList: auth_list })
      util.showSuccess('加载完成')
    })
  },

  doRequest: function (url, data, callback) {
    util.showBusy('加载中')
    wx.request({
      url: `${config.service.host}/weapp/${url}`,
      method: "POST",
      data: data,
      success(result) {
        result = result.data.data
        callback(result)
      },
      fail(result) {
        console.log('fail-------')
        console.log(result)
      }
    })
  }
})