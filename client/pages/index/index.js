//index.js
const app = getApp()
var sliderWidth = 96; // 需要设置slider的宽度，用于计算中间位置

let navigateUrl = '../config/config'
let discovering = false;

Page({
  data: {
    tabs: ["连接设备", "断开设备"],
    activeIndex: 0,
    sliderOffset: 0,
    sliderLeft: 0,

    isFirstAdd: true,

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

  //该事件绑定了“去添加”和“扫描设备”按钮，用于对设备执行扫一扫功能
  /**
   * 
   * 
   */
  addDevice: function () {
    this.setData({ 
      isFirstAdd: false,
      connected_device: [{deviceId: '34:45:23:12', name: 'demooo', url: "../config/config?deviceId=34:45:23:12&name=demooo"}]
    })

    

    //调用微信的扫码功能，以此添加设备
    /**
     * wx.scanCode({
      success: (res) => {
        console.log(res)

      }
    })
     */
    /**
         * todo
         * 根据扫码得到的设备的mac地址对数据库进行查找，看是否已被激活
         * 若已被激活，则告诉用户不可使用，返回失败页面
         * 若还未被激活，弹框提醒用户是否要与其进行绑定
         * 若是则向数据表添加纪录，并返回成功界面，否则返回失败界面
         */
  },

})
