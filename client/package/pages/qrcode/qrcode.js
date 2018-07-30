// pages/qrcode/qrcode.js

import QRCode from '../../../utils/weapp-qrcode'
import { Base64 } from '../../../vendor/js-base64-2.4.8/base64'

Page({
  data: {
    nickName: '',
    avatarUrl: ''
  },

  onLoad: function (options) {
    this.setData({
      nickName: options.nickName,
      avatarUrl: options.avatarUrl
    })
    const qrcode = new QRCode('qrcode', {
      width: 150,
      height: 150,
      text: Base64.encode(options.openId)
    })

    wx.setNavigationBarColor({
      frontColor: '#ffffff',
      backgroundColor: '#666'
    })
  },
  
})