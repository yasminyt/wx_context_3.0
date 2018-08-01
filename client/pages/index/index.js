const qclund = require('../../vendor/wafer2-client-sdk/index')
const config = require('../../config')
const util = require('../../utils/util')
const index_util = require('util')

//index.js
const app = getApp()
var sliderWidth = 96; // 需要设置slider的宽度，用于计算中间位置

let navigateUrl = '../config/config'
let discovering = false
let open_id, scan_macId

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
    const connRadio = e.detail.value;

    let radioItems = this.data.available_device;

    let i = 0;
    for (; i < radioItems.length; ++i)
      if (radioItems[i].deviceId === connRadio) {
        radioItems[i].checked = true;
        break;
      }

    this.setData({
      available_device: radioItems
    });

    wx.showModal({
      title: '提示',
      content: '是否确定要与该设备进行连接配对',
      showCancel: true,
      cancelText: '取消',
      confirmText: '确定',
      success: function(res) {
        if (res.confirm) {
          wx.showLoading({
            title: '正在安全连接',
          });
          //todo security connecting device

        } else { //取消被选中
          radioItems[i].checked = false;
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
        //index_util(res.result, open_id)
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