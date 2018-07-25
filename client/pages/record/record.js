import initCalendar, { getSelectedDay, jumpToToday } from '../../template/calendar/index';

const config = require('../../config')
const util = require('../../utils/util')

let day = util.formatTime(new Date()).split(' ')[0];    //当天的日期

Page({
  data: {
    recordList: []
  },

  showList: function (openId) {
    util.showBusy('加载中')
    const that = this

    wx.request({
      url: `${config.service.host}/weapp/query`,
      method: "POST",
      data: {
        table: 'configuration',
        values: {open_id: openId, create_day: day}
      },
      success (result) {
        result = result.data.data
        result.forEach(item => {
          item.create_time = util.formatTime(new Date(item.create_time))
        });
        that.setData({
          recordList: result
        })
        wx.hideToast();
      },
      fail (result) {
        console.log('fail-----')
        console.log(result)
      }
    })
  },

  onShow: function () {
    const open_id = util.isLogin()
    if (open_id) 
      this.showList(open_id)
    initCalendar({
      // multi: true, // 是否开启多选,
      // disablePastDay: true, // 是否禁选过去日期
      /**
       * 选择日期后执行的事件
       * @param { object } currentSelect 当前点击的日期
       * @param { array } allSelectedDays 选择的所有日期（当mulit为true时，才有allSelectedDays参数）
       */
      afterTapDay: (currentSelect, allSelectedDays) => {
        day = util.formatDay(currentSelect.year, currentSelect.month, currentSelect.day);   //用户选择日期后的日期
        this.showList(open_id)

        console.log('当前点击的日期', currentSelect);
        allSelectedDays && console.log('选择的所有日期', allSelectedDays);
        console.log('getSelectedDay方法', getSelectedDay());
      },
      /**
       * 日期点击 事件（此事件会完全接管点击事件）
       * @param { object } currentSelect 当前点击的日期
       * @param { object } event 日期点击事件对象
       */
      // onTapDay(currentSelect, event) {
      //   console.log(currentSelect);
      //   console.log(event);
      // },
    });
  },

  /**
   * 跳转至今天
   */
  jump() {
    jumpToToday();
  }
})
