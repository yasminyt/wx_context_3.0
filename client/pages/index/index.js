const config = require('../../config')
const util = require('../../utils/util')
const index_util = require('util')
const ble_util = require('bleutil')

var sliderWidth = 96; // 需要设置slider的宽度，用于计算中间位置

let navigateUrl = '../config/config'
let open_id
let index = 0      // 记录下要连接的设备在# available_device # 中的位置
let unIndex = -1    // 记录下要卸载的设备在 connected_device 中的位置
let disConnInterval

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
    const that = this
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
    open_id = util.isLogin('index')
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
    })

    for (let i = 0; i < this.data.connected_device.length; i++) 
      if (e.detail.value === this.data.connected_device[i].deviceId) {
        radioItems[index].checked = false
        this.setData({ available_device: radioItems })
        return util.showModal('操作失败', '该设备已连接，请不要重复连接！')
      }

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
              radioItems[index].checked = false
              that.setData({ 
                connected_device: connected_device,
                available_device: radioItems
              })

              disConnInterval = setInterval(that.isDisConn, 1000)
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

  // 卸载网络设备项
  unConnChange: function (e) {
    let radioItems = this.data.connected_device;
    for (let i = 0; i < radioItems.length; ++i) {
      radioItems[i].checked = radioItems[i].deviceId == e.detail.value    // e.detail.value ======> deviceId
      if (radioItems[i].checked ) unIndex = i   
    }
    this.setData({
      connected_device: radioItems
    })
  },

  // 扫描设备
  scanDevice: function() {
    wx.scanCode({
      success: (res) => {
        index_util.handleScan(res.result, open_id)
        //index_util.handleScan('89:23:33:99', open_id)   // 测试用
      }
    })
  },

  // 卸载网络
  uninstall: function () {
    if (unIndex === -1 ) 
      return util.showModal('操作失败', '请选择一项进行操作')

    const that = this
    let connected_device = this.data.connected_device
    wx.showModal({
      title: '提 示',
      content: `是否要取消与 ${connected_device[unIndex].name} 设备的安全连接？`,
      showCancel: true,
      success: res => {
        if (res.confirm) {
          util.showBusy('正在取消连接')
          ble_util.uninstallNetwork(connected_device[unIndex].deviceId, res => {
            if (res) {
              util.showSuccess('已断开连接')
              connected_device.splice(unIndex)
              that.setData({
                connected_device: connected_device
              })
            }
          })
        } else {
          connected_device[unIndex].checked = false
          unIndex = -1
          that.setData({ connected_device: connected_device })
        }
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

  isDisConn: function () {
    ble_util.sendState(res => {
      if (!res) {
        clearInterval(disConnInterval)
        util.showModal('提示', '当前设备已失去连接，请稍后重新连接！')
        this.setData({
          connected_device: []
        })
      }
    })
  }

})