const qclund = require('../../vendor/wafer2-client-sdk/index')
const config = require('../../config')
const util = require('../../utils/util')

const freq = 50, intensity = 1, n = 2000/freq, height = 150/2
let x = 0, y = 0, x_base = x, y_base = 75
let arrPoint = [], step = 10, translateStep = 0, width

Page({
  data: {
    workList: [{ config_id: 1, mac_id: '12:23:34:45', mac_name: 'demo1', status: 'work', mode: 0, intensity: '78', freq: '90', setTime: '30', downTime: '25min30s'}]
  },

  onReady: function() {
    const res = wx.getSystemInfoSync();
    width = res.windowWidth - 20;
    this.drawWave();
    this.interval = setInterval(this.drawWave, 100);
  },

  onShow: function () {
    // 从#configuration#表中读取所有状态为#work/standby#的记录
    //this.doRequest('whereInquery', {table: 'configuration', value: 'status', array: ['work', 'standby']}, "showRecord")
  },

  // 显示从数据库中读出的##正在工作##的设备
  showRecord: function (res) {
    console.log(res)
    if (res) {
      // todo 这里还需要处理倒计时和波形图输出
      this.setData({ workList: res })
    }
  },

  drawWave: function () {
    const context = wx.createCanvasContext('12:23:34:45')

    context.setStrokeStyle('rgb(255,0,0)');     // 设置画笔的颜色
    context.setFillStyle('rgb(255,0,0)');       // 设置填充颜色
    context.setLineWidth(4)                     // 设置线条的粗细

    context.clearRect(0, 0, x_base - step, height);   // 清除一个区域
     if (x_base > width) {
       context.translate(step, 0)     // 将画布沿着x轴方向移动step个单位
       translateStep += 10
     }  
    
    let obj = {};
    obj.x = x_base;
    obj.y = y_base;
    if (arrPoint.length > (width/step))   // 超出画布的宽度之后，将最前面的一个点移除
      arrPoint.splice(0, 1);  
    
    arrPoint.push(obj);
    console.log(arrPoint)

    context.beginPath();
    for (let i = 0; i < arrPoint.length; i++)
      context.lineTo(arrPoint[i].x - translateStep, arrPoint[i].y);   // 将各个点连接起来

    context.stroke();
    context.closePath();
    context.draw();
  
    x_base += step;
    if (x_base <= 250)    y_base = Math.sin(2 * Math.PI * (1/n)) * height * intensity + 75
    else if (x_base <= 500)   y_base = -Math.sin(2 * Math.PI * (1/n)) * height * intensity + 75
    else if (x_base <= 750)   y_base = Math.sin(2 * Math.PI * (2/n)) * height * intensity + 75
    else if(x_base <= 1000)   y_base = -Math.sin(2 * Math.PI * (2/n)) * height * intensity + 75
    else  {
      // x_base = 0
      // y_base = Math.sin(2 * Math.PI * (1/n)) * height * intensity
      // translateStep = 0
      clearInterval(this.interval)
    }
    //y_base = 100 + Math.random() * 20;
  },

  doAction: function (e) {
    const deviceId = e.target.dataset.deviceId
    const status = e.target.dataset.status
    const downTime = e.target.dataset.downTime

    // 点击##暂停##按钮
    if (status === 'work') {

    }
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
          case 'showRecord': {  that.showRecord(result);  break;  }     //显示正在工作的记录
          case 'addDevice': { that.addDevice(result); break;  }         //添加设备到可用列表
          default: break;
        }
      }
    })
  }
})