const config = require('../../../config')
const util = require('../../../utils/util')

let open_id

Page({

  data: {
    record: {},
    hasData: false
  },

  onShow: function () {
    open_id = util.isLogin('package')
    if (open_id) {
      const that = this
      util.showBusy('加载中')
      wx.request({
        url: `${config.service.host}/weapp/query_orderBy`,
        method: "POST",
        data: {
          params: {open_id: open_id}
        },
        success(result) {
          result = result.data.data   // 得到的是一个对象
          if (Object.keys(result).length) {   // 有记录
            result.create_time = util.formatTime(new Date(result.create_time))
            that.setData({
              record: result,
              hasData: true
            })
          } else
            that.setData({
              record: {},
              hasData: false
            })
          util.showSuccess('加载完成')
        },
        fail(result) {
          console.log('fail-------')
          console.log(result)
        }
      })
    }
  },
})