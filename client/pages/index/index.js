const config = require('../../config')
const util = require('../../utils/util')
const index_util = require('util')
const ble_util = require('bleutil')

var sliderWidth = 96; // 需要设置slider的宽度，用于计算中间位置

let navigateUrl = '../config/config'
let open_id
let index = 0      // 记录下要连接的设备在# available_device # 中的位置

Page({
  data: {
    tabs: ["连接设备", "断开设备"],
    activeIndex: 0,
    sliderOffset: 0,
    sliderLeft: 0,

    isLogin: false,

    connected_device: [],
    available_device: [],     // 即用户拥有权限的设备，包含的字段有：auth_id, mac_id, name

  },

  onLoad: function() {
    var that = this;
    wx.getSystemInfo({
      success: function(res) {
        that.setData({
          sliderLeft: (res.windowWidth / that.data.tabs.length - sliderWidth) / 2,
          sliderOffset: res.windowWidth / that.data.tabs.length * that.data.activeIndex
        });
      }
    });
    // 初始化蓝牙适配器
    ble_util.openBluetoothAdapter()
  },

  tabClick: function(e) {
    this.setData({
      sliderOffset: e.currentTarget.offsetLeft,
      activeIndex: e.currentTarget.id
    });
  },

  onShow: function() {
    open_id = util.isLogin()
    if (open_id !== '') {
      this.setData({
        isLogin: true
      })
      this.doRequest("query_innerJoin", {
        param: {
          open_id: open_id
        }
      }, 'onShow')
    } else
      this.setData({
        isLogin: false
      })
  },

  toLogin: function() {
    wx.switchTab({
      url: '../user/user'
    })
  },

  /** 在可连接设备列表中选择设备进行安全连接 */
  ConnRadioChange: function(e) {
    const that = this;
    let radioItems = this.data.available_device;

    for (let i = 0; i < radioItems.length; ++i) {
      radioItems[i].checked = radioItems[i].mac_id == e.detail.value    // e.detail.value ======> mac_id
      if (radioItems[i].checked ) index = i   
    }

    this.setData({
      available_device: radioItems
    });

    wx.showModal({
      title: '提 示',
      content: `是否要与${radioItems[index].name}进行安全连接？`,
      success: res => {
        if (res.confirm) {
          ble_util.getBluetoothAdapterState(radioItems[index].mac_id, open_id, res => {
            if (!res.available) {   // 手机蓝牙不可用
              radioItems[index].checked = false
              that.setData({ available_device: radioItems });
            }
            if (res.conn) {   // 安全连接已建立
              let connected_device = this.data.connected_device
              connected_device.push({
                deviceId: radioItems[index].mac_id,
                name: radioItems[index].name,
                url: `${navigateUrl}?deviceId=${radioItems[index].mac_id}&name=${radioItems[index].name}`
              })
              that.setData({ connected_device: connected_device })
            }
          })
        } else {
          radioItems[index].checked = false
          that.setData({
            available_device: radioItems
          });
        }
      }
    })
  },

  // 扫描设备
  scanDevice: function() {
    wx.scanCode({
      success: (res) => {
        //index_util.handleScan(res.result, open_id)
        index_util.handleScan('89:23:33:99', open_id)   // 测试用
      }
    })
  },

  doRequest: function(crud, data, action) {
    const that = this
    util.showBusy('加载中')
    wx.request({
      url: `${config.service.host}/weapp/${crud}`,
      method: "POST",
      data: data,
      complete(result) {
        result = result.data.data
        switch (action) {
          case 'onShow':
            {
              that.setData({ available_device: result })
              util.showSuccess('加载完成')
              break;
            } // 加载可连接设备
          
          default:
            break;
        }
      }
    })
  },

})