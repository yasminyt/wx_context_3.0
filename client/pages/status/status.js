let x = 0, y = 0, x_base = x, y_base = 100;
let arrPoint = [], step = 10, width, height = 150;

Page({
  data: {
    workList: [{ deviceId: '12:23:34:45', name: 'demo1', status: '工作中', mode: 0, intensity: '78', freq: '90', setTime: '30', downTime: '25min30s', action: '暂停'}]
  },

  onReady: function() {
    const res = wx.getSystemInfoSync();
    width = res.windowWidth - 20;
    this.drawWave();
    this.interval = setInterval(this.drawWave, 100);
  },

  drawWave: function () {
    const context = wx.createCanvasContext('12:23:34:45');

    context.setStrokeStyle('rgb(255,0,0)');
    context.setFillStyle('rgb(255,0,0)');

    context.clearRect(0, 0, x_base - step, height);
    if (x_base > width) 
      context.translate(step*-1, 0);
    
    let obj = {};
    obj.x = x_base;
    obj.y = y_base;
    if (arrPoint.length > (width/step)) {
      console.log(arrPoint);
      arrPoint.splice(0, 1);
    }
      
    arrPoint.push(obj);

    context.beginPath();
    for (let i = 0; i < arrPoint.length; i++)
      context.lineTo(arrPoint[i].x, arrPoint[i].y);

    context.stroke();

    context.closePath();

    context.draw();
    

    /*
    **wx.drawCanvas({
      canvasId: '12:23:34:45',
      actions: context.getActions()
    })
    */

    x_base += step;
    y_base = 100 + Math.random() * 20;
  }
})