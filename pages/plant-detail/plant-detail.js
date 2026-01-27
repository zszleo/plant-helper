// pages/plant-detail/plant-detail.js
const storage = require('../../utils/storage.js')

Page({
  data: {
    plantId: '',
    plant: null,
    growthDays: 0,
    plantDays: 0,
    recordCount: 0,
    recentRecords: []
  },

  onLoad(options) {
    if (options.id) {
      this.setData({
        plantId: options.id
      })
      this.loadPlant()
      this.loadRecentRecords()
    } else {
      wx.showToast({
        title: '参数错误',
        icon: 'none'
      })
      setTimeout(() => {
        wx.navigateBack()
      }, 1500)
    }
  },

  onShow() {
    if (this.data.plantId) {
      this.loadPlant()
      this.loadRecentRecords()
    }
  },

  /**
   * 加载植物信息
   */
  loadPlant() {
    const plant = storage.getPlant(this.data.plantId)
    if (plant) {
      // 计算生长天数
      let growthDays = 0
      if (plant.plantDate) {
        const plantDate = new Date(plant.plantDate)
        if (!isNaN(plantDate.getTime())) {
          const now = new Date()
          const diffDays = Math.floor((now - plantDate) / (1000 * 60 * 60 * 24))
          // 种植当天算作第1天
          growthDays = diffDays >= 0 ? diffDays + 1 : 0
        }
      }

      // 获取记录数量
      const records = storage.getPlantRecords(this.data.plantId)
      const recordCount = records.length

      this.setData({
        plant: plant,
        growthDays: growthDays,
        plantDays: growthDays,
        recordCount: recordCount
      })

      wx.setNavigationBarTitle({
        title: plant.name
      })
    } else {
      wx.showToast({
        title: '植物不存在',
        icon: 'none'
      })
      setTimeout(() => {
        wx.navigateBack()
      }, 1500)
    }
  },

  /**
   * 加载最近的记录
   */
  loadRecentRecords() {
    const records = storage.getPlantRecords(this.data.plantId)
    // 按时间倒序排列，取前5条
    const sortedRecords = records
      .sort((a, b) => new Date(b.recordTime) - new Date(a.recordTime))
      .slice(0, 5)

    this.setData({
      recentRecords: sortedRecords
    })
  },

  /**
   * 添加记录
   */
  onAddRecord(e) {
    const type = e.currentTarget.dataset.type
    wx.navigateTo({
      url: `/pages/record-add/record-add?plantId=${this.data.plantId}&type=${type}`
    })
  },

  /**
   * 查看全部记录
   */
  onViewAllRecords() {
    wx.switchTab({
      url: '/pages/records/records'
    })
  },

  /**
   * 记录详情
   */
  onRecordDetail(e) {
    const recordId = e.currentTarget.dataset.id
    // TODO: 跳转到记录详情页
    wx.showToast({
      title: '记录详情功能开发中',
      icon: 'none'
    })
  },

  /**
   * 浮动按钮添加记录
   */
  onFloatAddRecord() {
    if (!this.data.plant) return
    
    // 直接跳转到记录新增页面，不传递type参数，让用户在记录新增页面选择类型
    wx.navigateTo({
      url: `/pages/record-add/record-add?plantId=${this.data.plantId}`
    })
  },

  /**
   * 编辑植物
   */
  onEdit() {
    wx.navigateTo({
      url: `/pages/plant-add/plant-add?id=${this.data.plantId}`
    })
  },

  /**
   * 删除植物
   */
  onDelete() {
    console.log('准备删除植物，plantId:', this.data.plantId)
    wx.showModal({
      title: '确认删除',
      content: `确定要删除"${this.data.plant.name}"吗？此操作不可恢复，相关的生长记录也将被删除。`,
      confirmColor: '#F44336',
      success: (res) => {
        if (res.confirm) {
          console.log('用户确认删除')
          const success = storage.deletePlant(this.data.plantId)
          console.log('删除结果:', success)
          if (success) {
            wx.showToast({
              title: '删除成功',
              icon: 'success'
            })
            setTimeout(() => {
              wx.navigateBack()
            }, 1500)
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
   * 格式化日期
   */
  formatDate(dateStr) {
    if (!dateStr) return '未设置'
    const date = new Date(dateStr)
    if (isNaN(date.getTime())) return '日期无效'
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  },

  /**
   * 格式化状态
   */
  formatStatus(status) {
    const statusMap = {
      'healthy': '健康',
      'growing': '生长中',
      'need-care': '需照料',
      'diseased': '生病'
    }
    return statusMap[status] || '未知'
  },

  /**
   * 格式化记录时间
   */
  formatTime(timeStr) {
    if (!timeStr) return ''
    const date = new Date(timeStr)
    if (isNaN(date.getTime())) return ''
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const hours = String(date.getHours()).padStart(2, '0')
    const minutes = String(date.getMinutes()).padStart(2, '0')
    const seconds = String(date.getSeconds()).padStart(2, '0')
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
  },

  /**
   * 获取记录图标
   */
  getRecordIcon(type) {
    const iconMap = {
      'watering': '/images/water.svg',
      'fertilizing': '/images/fertilizer.svg',
      'growth': '/images/growth.svg',
      'photo': '/images/photo.svg'
    }
    return iconMap[type] || '/images/record.svg'
  },

  /**
   * 获取记录标题
   */
  getRecordTitle(type) {
    const titleMap = {
      'watering': '浇水',
      'fertilizing': '施肥',
      'growth': '生长记录',
      'photo': '拍照记录'
    }
    return titleMap[type] || '记录'
  }
})
