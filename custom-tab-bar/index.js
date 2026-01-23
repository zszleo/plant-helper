// custom-tab-bar/index.js
Component({
  data: {
    selected: 0,
    color: "#999999",
    selectedColor: "#4CAF50",
    list: [
      {
        pagePath: "/pages/index/index",
        text: "首页",
        iconPath: "/images/home.png",
        selectedIconPath: "/images/home-active.png"
      },
      {
        pagePath: "/pages/records/records",
        text: "记录",
        iconPath: "/images/record.png",
        selectedIconPath: "/images/record-active.png"
      },
      {
        pagePath: "/pages/reminders/reminders",
        text: "提醒",
        iconPath: "/images/reminder.png",
        selectedIconPath: "/images/reminder-active.png"
      },
      {
        pagePath: "/pages/statistics/statistics",
        text: "统计",
        iconPath: "/images/statistics.png",
        selectedIconPath: "/images/statistics-active.png"
      }
    ]
  },
  
  methods: {
    switchTab(e) {
      const data = e.currentTarget.dataset
      const url = data.path
      wx.switchTab({ url })
      this.setData({
        selected: data.index
      })
    }
  }
})
