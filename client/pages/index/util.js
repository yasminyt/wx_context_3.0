const config = require('../../config')
const util = require('../../utils/util')

let openId = ''

export function handleScan(data, open_id) {
  openId = open_id
  doRequest('query', { // 根据扫描结果查找#device#表，看设备是否已激活
    table: 'device',
    values: {
      mac_id: data
    }
  }, 'handleScan')
}

function resScan(res) {
  res = res[0]
  wx.hideToast()
  if (res.anivation) // 已被激活
    wx.navigateTo({
      url: '../../package/pages/msg/msg_fail?content=该设备已被激活，您没有权限使用，可通过他人进行授权！'
    })
  else
    wx.navigateTo({
      url: `../../package/pages/msg/msg_info?content=是否将** ${res.name} **设备进行激活？激活后该设备将添加到您的可用设备列表中&mac_id=${res.mac_id}&open_id=${openId}`
    })
}

function doRequest(url, data, fromFun) {
  util.showBusy('加载中')
  wx.request({
    url: `${config.service.host}/weapp/${url}`,
    method: "POST",
    data: data,
    complete(result) {
      result = result.data.data
      switch (fromFun) {
        case 'handleScan':
          {
            resScan(result)
            break;
          } // 加载可连接设备
        default:
          break;
      }
    }
  })
}