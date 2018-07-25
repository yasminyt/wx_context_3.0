const qclund = require('../../vendor/wafer2-client-sdk/index')
const config = require('../../config')
const util = require('../../utils/util')

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
    available_device: [],

  },

  onLoad: function () {
    var that = this;
    wx.getSystemInfo({
      success: function (res) {
        that.setData({
          sliderLeft: (res.windowWidth / that.data.tabs.length - sliderWidth) / 2,
          sliderOffset: res.windowWidth / that.data.tabs.length * that.data.activeIndex
        });
      }
    });
  },

  onShow: function () {
    const session = qclund.Session.get()
    if (session) {
      open_id = session.userinfo.openId
      this.setData({isLogin: true})
    } else {
      open_id = ''
      this.setData({isLogin: false})
    }
  },

  toLogin: function () {
    wx.switchTab({
      url: '../user/user'
    })
  },

  tabClick: function (e) {
    this.setData({
      sliderOffset: e.currentTarget.offsetLeft,
      activeIndex: e.currentTarget.id
    });
  },

  /** 在可连接设备列表中选择设备进行安全连接 */
  ConnRadioChange: function (e) {
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

        } else {  //取消被选中
          radioItems[i].checked = false;
          that.setData({
            available_device: radioItems
          });
        }
      }
    })
  },

  // 扫描设备 按钮事件
  addDevice: function () {
    this.setData({
      isFirstAdd: false,
      connected_device: [{ deviceId: '34:45:23:12', name: 'demooo', url: "../config/config?deviceId=34:45:23:12&name=demooo" }],
      available_device: [{ deviceId: '34:45:23:34', name: 'demooo' }, { deviceId: '34:45:23:12', name: 'demo' }]
    })

    //调用微信的扫码功能，以此添加设备
    /**
     * 
     */
    /**
         * todo
         * 根据扫码得到的设备的mac地址对数据库进行查找，看是否已被激活
         * 若已被激活，则告诉用户不可使用，返回失败页面
         * 若还未被激活，弹框提醒用户是否要与其进行绑定
         * 若是则向数据表添加纪录，并返回成功界面，否则返回失败界面
         */
  },
  
  scanCode: function () {
    const that = this
    wx.scanCode({
      success: (res) => {
        console.log(res)
        scan_macId = res.mac_id
        scan_macName = res.mac_name
        util.showBusy('加载中')
        // 查询 device 表中对应的设备是否已被激活
        that.doRequest('query', { table: 'device', values: { mac_id: scan_macId }}, 'scanResult')
      }
    })
  },

  doRequest: function (crud, data, action) {
    const that = this
    wx.request({
      url: `${config.service.host}/weapp/${crud}`,
      method: "POST",
      data: data,
      complete (result) {
        result = result.data.data
        switch (action) {
          case 'scanResult': {  that.anivateDevice(result);  break;  }  //激活设备
          case 'addDevice': { that.addDevice(result); break;  }         //添加设备到可用列表
          default: break;
        }
      }
    })
  },

  // 激活设备
  anivateDevice: function (res) {
    const that = this
    if (res.anivation) {  //已被激活
      wx.redirectTo({
        url: '../msg/msg_fail?content=该设备已被激活，您没有权限使用，可通过他人进行授权！'
      })
    } else {
      wx.showModal({
        title: '提  示',
        content: '是否将该设备进行激活？激活后该设备将添加到您的可用设备列表中',
        showCancel: true,
        cancelText: '取消',
        confirmText: '确定',
        success: function (res) {
          if (res.confirm) {
            // 更新设备的激活状态为已激活
            that.doRequest('update', {table: 'device', values: {anivation: 1}, where: {mac_id: scan_macId}}, 'none')
            const authorization = {
              auth_id: 0,
              mac_id: scan_macId,
              open_id: open_id,
              auth_time: util.formatTime(new Date()),
              auth_open_id: open_id
            }
            // 添加设备的授权信息
            that.doRequest('create', {table: 'authorization', values: authorization}, 'addDevice')
          }
        }
      })
    }
  },

  // 更新可用设备列表
  addDevice: function (res) {
    if (res) {  // 授权成功
      wx.redirectTo({
        url: '../msg/msg_success?content=该电针治疗仪设备已激活，您现在可以操作设备，您也可以将设备的使用授权给他人'
      })
      let available_device = this.data.available_device;
      available_device.push({deviceId: scan_macId, name: scan_macName})
      this.setData({available_device: available_device})
    }
  },
})
