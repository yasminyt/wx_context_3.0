let choices = [];

Page({
  data: {
    showTopTips: false,
    checkboxItems: [
      { name: 'demo1 *************** T o T', value: '0'},
      { name: 'demo1 *************** T v T', value: '1' }
    ]
  },

  checkboxChange: function (e) {
    console.log('checkbox发生change事件，携带value值为：', e.detail.value);

    var checkboxItems = this.data.checkboxItems;
    choices = e.detail.value;
    for (var i = 0, lenI = checkboxItems.length; i < lenI; ++i) {
      checkboxItems[i].checked = false;
      for (var j = 0, lenJ = choices.length; j < lenJ; ++j) {
        if (checkboxItems[i].value == choices[j]) {
          checkboxItems[i].checked = true;
          break;
        }
      }
    }
    this.setData({
      checkboxItems: checkboxItems
    });
  },

  submit: function () {
    const that = this
    if (choices.length === 0) 
      this.setData({
        showTopTips: true
      });
  }
})