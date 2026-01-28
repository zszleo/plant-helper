// pages/reminders/reminders.js
const storage = require('../../utils/storage.js')

Page({
  data: {
    plants: [],
    reminders: [],
    activeCount: 0,
    totalCount: 0,
    // 触摸滑动相关
    touchStartX: 0,
    touchStartY: 0
  },

  onLoad() {
    this.loadPlants()
    this.loadReminders()
  },

  onShow() {
    this.loadPlants()
    this.loadReminders()
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({
        selected: 2
      })
    }
  },

  /**
   * 下拉刷新
   */
  onPullDownRefresh() {
    this.loadPlants()
    this.loadReminders()
    setTimeout(() => {
      wx.stopPullDownRefresh()
    }, 1000)
  },

  /**
   * 加载植物列表
   */
  loadPlants() {
    const plants = storage.getPlants()
    this.setData({
      plants: plants
    })
  },

  /**
   * 加载提醒列表
   */
  loadReminders() {
    const reminders = storage.getReminders()
    const plants = this.data.plants

    // 为每条提醒添加植物名称
    const remindersWithPlantName = reminders.map(reminder => {
      const plant = plants.find(p => p._id === reminder.plantId)
      return {
        ...reminder,
        plantName: plant ? plant.name : '未知植物'
      }
    })

    // 按下次提醒时间排序
    remindersWithPlantName.sort((a, b) => {
      if (!a.nextRemindTime) return 1
      if (!b.nextRemindTime) return -1
      return new Date(a.nextRemindTime) - new Date(b.nextRemindTime)
    })

    // 统计数量
    const activeCount = remindersWithPlantName.filter(r => r.isEnabled).length
    const totalCount = remindersWithPlantName.length

    this.setData({
      reminders: remindersWithPlantName,
      activeCount: activeCount,
      totalCount: totalCount
    })
  },

  /**
   * 切换提醒开关
   */
  onToggleReminder(e) {
    const reminderId = e.currentTarget.dataset.id
    const reminder = this.data.reminders.find(r => r._id === reminderId)
    
    if (reminder) {
      const success = storage.updateReminder(reminderId, {
        isEnabled: !reminder.isEnabled
      })

      if (success) {
        this.loadReminders()
        wx.showToast({
          title: reminder.isEnabled ? '已关闭' : '已开启',
          icon: 'success'
        })
      } else {
        wx.showToast({
          title: '操作失败',
          icon: 'none'
        })
      }
    }
  },

  /**
   * 添加提醒
   */
  onAddReminder() {
    if (this.data.plants.length === 0) {
      wx.showToast({
        title: '请先添加植物',
        icon: 'none'
      })
      return
    }

    // TODO: 跳转到添加提醒页面
    wx.showToast({
      title: '添加提醒功能开发中',
      icon: 'none'
    })
  },

  /**
   * 编辑提醒
   */
  onEditReminder(e) {
    const reminderId = e.currentTarget.dataset.id
    // TODO: 跳转到编辑提醒页面
    wx.showToast({
      title: '编辑提醒功能开发中',
      icon: 'none'
    })
  },

  /**
   * 删除提醒
   */
  onDeleteReminder(e) {
    const reminderId = e.currentTarget.dataset.id
    const reminder = this.data.reminders.find(r => r._id === reminderId)

    wx.showModal({
      title: '确认删除',
      content: `确定要删除这个提醒吗？`,
      confirmColor: '#F44336',
      success: (res) => {
        if (res.confirm) {
          const success = storage.deleteReminder(reminderId)
          if (success) {
            wx.showToast({
              title: '删除成功',
              icon: 'success'
            })
            this.loadReminders()
          } else {
            wx.showToast({
              title: '删除失败',
              icon: 'none'
            })
          }
        }
      }
    })
  },

  /**
   * 添加植物
   */
  onAddPlant() {
    wx.switchTab({
      url: '/pages/index/index'
    })
  },

  /**
   * 格式化频率
   */
  formatFrequency(frequency) {
    if (!frequency) return '未设置'
    
    const num = parseInt(frequency)
    if (num === 1) {
      return '每天'
    } else if (num === 7) {
      return '每周'
    } else if (num === 30) {
      return '每月'
    } else {
      return `每${num}天`
    }
  },

  /**
   * 格式化下次提醒时间
   */
  formatNextTime(timeStr) {
    if (!timeStr) return '未设置'
    
    const date = new Date(timeStr)
    const now = new Date()
    const diff = date - now

    if (diff < 0) {
      return '已过期'
    } else if (diff < 86400000) {
      const hours = Math.floor(diff / 3600000)
      if (hours < 1) {
        const minutes = Math.floor(diff / 60000)
        return `${minutes}分钟后`
      }
      return `${hours}小时后`
    } else if (diff < 604800000) {
      const days = Math.floor(diff / 86400000)
      return `${days}天后`
    } else {
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      const hours = String(date.getHours()).padStart(2, '0')
      const minutes = String(date.getMinutes()).padStart(2, '0')
      return `${month}-${day} ${hours}:${minutes}`
    }
  },

  /**
   * 获取提醒图标
   */
  getReminderIcon(type) {
    const iconMap = {
      'watering': '/images/water.svg',
      'fertilizing': '/images/fertilizer.svg'
    }
    return iconMap[type] || '/images/reminder.svg'
  },

  /**
   * 获取提醒标题
   */
  getReminderTitle(type) {
    const titleMap = {
      'watering': '浇水提醒',
      'fertilizing': '施肥提醒'
    }
    return titleMap[type] || '提醒'
  },

  /**
   * 获取频率文本
   */
  getFrequencyText(frequency) {
    if (!frequency) return '未设置'
    
    const num = parseInt(frequency)
    if (num === 1) {
      return '每天'
    } else if (num === 7) {
      return '每周'
    } else if (num === 30) {
      return '每月'
    } else {
      return `每${num}天`
    }
  },

  /**
   * 触摸开始
   */
  onTouchStart(e) {
    this.setData({
      touchStartX: e.touches[0].clientX,
      touchStartY: e.touches[0].clientY
    })
  },

  /**
   * 触摸结束
   */
  onTouchEnd(e) {
    const touchEndX = e.changedTouches[0].clientX
    const touchEndY = e.changedTouches[0].clientY
    const touchStartX = this.data.touchStartX
    const touchStartY = this.data.touchStartY

    // 计算滑动距离
    const diffX = touchEndX - touchStartX
    const diffY = touchEndY - touchStartY

    // 判断是否为水平滑动（水平滑动距离大于垂直滑动距离，且水平滑动距离超过50）
    if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 50) {
      // 向左滑动，切换到下一个页面
      if (diffX < 0) {
        this.switchToNextTab()
      }
      // 向右滑动，切换到上一个页面
      else if (diffX > 0) {
        this.switchToPrevTab()
      }
    }
  },

  /**
   * 切换到下一个tab
   */
  switchToNextTab() {
    wx.switchTab({
      url: '/pages/statistics/statistics'
    })
  },

  /**
   * 切换到上一个tab
   */
  switchToPrevTab() {
    wx.switchTab({
      url: '/pages/records/records'
    })
  }
})
