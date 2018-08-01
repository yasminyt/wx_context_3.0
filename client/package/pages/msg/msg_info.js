const config = require('../../../config')
const util = require('../../../utils/util')

let mac_id = '', open_id = ''

Page({
  data: {
    content: ''
  },
  onLoad: function (options) {
    this.setData({
      content: options.content
    })
    mac_id = options.mac_id
    open_id = options.open_id
  },

  submit: function() {
    util.showBusy('处理中')
    this.doRequest('update', { table: 'device', values: {anivation: 1}, params: {mac_id: mac_id}})
    this.doRequest('create', { table: 'authorization', values: {auth_id: 0, mac_id: mac_id, open_id: open_id, auth_time: util.formatTime(new Date()), auth_open_id: open_id}})
  },

  reback: () => {
    wx.navigateBack({});
  },

  doRequest: function (crud, data) {
    wx.request({
      url: `${config.service.host}/weapp/${crud}`,
      method: "POST",
      data: data,
      complete(result) {
        if (crud === 'create') {
          result = result.data.data
          if (result) {
            util.showSuccess('添加成功')
            setTimeout(() => {
              wx.navigateBack({});
            }, 1500);
          } else 
            console.log('fail: ---------', result)
        }
      }
    })
  }
});