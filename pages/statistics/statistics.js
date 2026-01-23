// pages/statistics/statistics.js
const storage = require('../../utils/storage.js')

Page({
  data: {
    plantCount: 0,
    recordCount: 0,
    reminderCount: 0,
    selectedPeriod: 'month',
    recordStats: [],
    dailyTrend: [],
    plantStatus: [],
    activePlants: [],
    showFullTrend: false
  },

  onLoad() {
    this.loadStatistics()
  },

  onShow() {
    this.loadStatistics()
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({
        selected: 3
      })
    }
  },

  /**
   * 下拉刷新
   */
  onPullDownRefresh() {
    this.loadStatistics()
    setTimeout(() => {
      wx.stopPullDownRefresh()
    }, 1000)
  },

  /**
   * 加载统计数据
   */
  loadStatistics() {
    const plants = storage.getPlants()
    const records = storage.getRecords()
    const reminders = storage.getReminders()

    // 基础统计
    this.setData({
      plantCount: plants.length,
      recordCount: records.length,
      reminderCount: reminders.length
    })

    // 记录统计
    this.loadRecordStats(records)
    
    // 植物状态统计
    this.loadPlantStatus(plants)
    
    // 活跃植物排行
    this.loadActivePlants(plants, records)
  },

  /**
   * 加载记录统计
   */
  loadRecordStats(records) {
    const now = new Date()
    // 本月
    const startDate = new Date(now.getFullYear(), now.getMonth(), 1)

    // 筛选时间范围内的记录
    const filteredRecords = records.filter(record => {
      const recordTime = new Date(record.recordTime)
      return recordTime >= startDate && recordTime <= now
    })

    // 记录类型分布
    const typeCount = {
      'watering': 0,
      'fertilizing': 0,
      'growth': 0,
      'photo': 0
    }

    filteredRecords.forEach(record => {
      if (typeCount[record.type] !== undefined) {
        typeCount[record.type]++
      }
    })

    const total = filteredRecords.length
    const recordStats = [
      { type: 'watering', name: '浇水', icon: '💧', count: typeCount.watering, percent: total ? (typeCount.watering / total * 100).toFixed(1) : 0, color: '#2196F3' },
      { type: 'fertilizing', name: '施肥', icon: '🌱', count: typeCount.fertilizing, percent: total ? (typeCount.fertilizing / total * 100).toFixed(1) : 0, color: '#FF9800' },
      { type: 'growth', name: '生长', icon: '🌿', count: typeCount.growth, percent: total ? (typeCount.growth / total * 100).toFixed(1) : 0, color: '#4CAF50' },
      { type: 'photo', name: '拍照', icon: '📷', count: typeCount.photo, percent: total ? (typeCount.photo / total * 100).toFixed(1) : 0, color: '#E91E63' }
    ]

    this.setData({
      recordStats: recordStats
    })

    // 每日记录趋势（默认显示最近7天的记录）
    const thirtyDaysAgo = new Date(now)
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    const allRecentRecords = records.filter(record => {
      const recordTime = new Date(record.recordTime)
      return recordTime >= thirtyDaysAgo && recordTime <= now
    })
    this.loadDailyTrend(allRecentRecords, 7)
  },

  /**
   * 加载每日趋势
   */
  loadDailyTrend(records, days = 7) {
    const dailyTrend = []
    const now = new Date()
    
    // 将结束日期设置为今天的0点
    const today = new Date(now)
    today.setHours(0, 0, 0, 0)

    // 从今天开始往前推指定天数，按日期倒序排列（最新的在前）
    for (let i = 0; i < days; i++) {
      const date = new Date(today)
      date.setDate(date.getDate() - i)

      const nextDate = new Date(date)
      nextDate.setDate(nextDate.getDate() + 1)

      const dayRecords = records.filter(record => {
        const recordTime = new Date(record.recordTime)
        return recordTime >= date && recordTime < nextDate
      })

      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      const label = `${month}-${day}`

      dailyTrend.push({
        date: date.toISOString().split('T')[0],
        label: label,
        count: dayRecords.length,
        percent: 0
      })
    }

    // 计算百分比
    const maxCount = Math.max(...dailyTrend.map(d => d.count), 1)
    dailyTrend.forEach(item => {
      item.percent = (item.count / maxCount * 100).toFixed(1)
    })

    this.setData({
      dailyTrend: dailyTrend
    })
  },

  /**
   * 加载植物状态
   */
  loadPlantStatus(plants) {
    const statusCount = {
      'healthy': 0,
      'growing': 0,
      'need-care': 0,
      'diseased': 0
    }

    plants.forEach(plant => {
      if (statusCount[plant.status] !== undefined) {
        statusCount[plant.status]++
      }
    })

    const total = plants.length
    
    const plantStatus = {
      total: total,
      healthy: {
        count: statusCount.healthy,
        percent: total ? (statusCount.healthy / total * 100).toFixed(1) : 0,
        label: '健康',
        color: '#4CAF50',
        icon: '🌿'
      },
      growing: {
        count: statusCount.growing,
        percent: total ? (statusCount.growing / total * 100).toFixed(1) : 0,
        label: '生长中',
        color: '#8BC34A',
        icon: '🌱'
      },
      'need-care': {
        count: statusCount['need-care'],
        percent: total ? (statusCount['need-care'] / total * 100).toFixed(1) : 0,
        label: '需照料',
        color: '#FF9800',
        icon: '⚠️'
      },
      diseased: {
        count: statusCount.diseased,
        percent: total ? (statusCount.diseased / total * 100).toFixed(1) : 0,
        label: '生病',
        color: '#F44336',
        icon: '🚨'
      }
    }

    this.setData({
      plantStatus: plantStatus
    })
  },

  /**
   * 加载活跃植物
   */
  loadActivePlants(plants, records) {
    const plantRecordCount = {}

    records.forEach(record => {
      if (plantRecordCount[record.plantId]) {
        plantRecordCount[record.plantId]++
      } else {
        plantRecordCount[record.plantId] = 1
      }
    })

    const activePlants = plants.map(plant => ({
      ...plant,
      recordCount: plantRecordCount[plant._id] || 0
    }))

    // 按记录数排序
    activePlants.sort((a, b) => b.recordCount - a.recordCount)

    this.setData({
      activePlants: activePlants
    })
  },

  /**
   * 切换每日趋势显示
   */
  onToggleTrend() {
    const showFullTrend = !this.data.showFullTrend
    
    // 重新加载趋势数据
    const records = require('../../utils/storage.js').getRecords()
    const now = new Date()
    const thirtyDaysAgo = new Date(now)
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    const allRecentRecords = records.filter(record => {
      const recordTime = new Date(record.recordTime)
      return recordTime >= thirtyDaysAgo && recordTime <= now
    })
    
    // 根据展开状态加载不同天数的数据
    if (showFullTrend) {
      this.loadDailyTrend(allRecentRecords, 30)
    } else {
      this.loadDailyTrend(allRecentRecords, 7)
    }
    
    this.setData({
      showFullTrend: showFullTrend
    })
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
   * 获取记录标题
   */
  getRecordTitle(type) {
    const titleMap = {
      'watering': '浇水',
      'fertilizing': '施肥',
      'growth': '生长',
      'photo': '拍照'
    }
    return titleMap[type] || '其他'
  },

  /**
   * 点击总植物数跳转到首页
   */
  onTotalPlantsClick() {
    wx.switchTab({
      url: '/pages/index/index'
    })
  }
})
