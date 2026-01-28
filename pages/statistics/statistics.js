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
    showFullTrend: false,
    calendarData: [],
    totalRecords: 0,
    activeCell: null,
    currentYear: new Date().getFullYear(),
    currentMonth: new Date().getMonth() + 1,
    // 触摸滑动相关
    touchStartX: 0,
    touchStartY: 0
  },

  onLoad() {
    this.loadStatistics()
  },

  onShow() {
    console.log('统计页面 onShow，重新加载数据')
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
      const allRecords = storage.getRecords()
      const allReminders = storage.getReminders()
  
      // 过滤掉没有对应植物的记录和提醒
      const validRecords = allRecords.filter(record => {
        return plants.some(plant => plant._id === record.plantId)
      })
  
      const validReminders = allReminders.filter(reminder => {
        return plants.some(plant => plant._id === reminder.plantId)
      })
  
      // 基础统计
      this.setData({
        plantCount: plants.length,
        recordCount: validRecords.length,
        reminderCount: validReminders.length
      })
  
      // 记录统计
      this.loadRecordStats(validRecords)
      
      // 植物状态统计
      this.loadPlantStatus(plants)
      
      // 活跃植物排行
      this.loadActivePlants(plants, validRecords)
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

    // 每月记录趋势（GitHub风格热力图）
    this.loadHeatmapDataForMonth(this.data.currentYear, this.data.currentMonth)
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
   * 加载日历热力图数据（GitHub风格）
   */
  loadHeatmapData(records) {
    const now = new Date()
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    
    // 创建日期到记录数的映射
    const dateCountMap = {}
    records.forEach(record => {
      const recordDate = new Date(record.recordTime)
      const year = recordDate.getFullYear()
      const month = String(recordDate.getMonth() + 1).padStart(2, '0')
      const day = String(recordDate.getDate()).padStart(2, '0')
      const dateStr = `${year}-${month}-${day}`
      dateCountMap[dateStr] = (dateCountMap[dateStr] || 0) + 1
    })

    // 计算最大记录数用于颜色分级
    const maxCount = Math.max(...Object.values(dateCountMap), 1)
    
    // GitHub风格的5级颜色算法
    const getLevel = (count) => {
      if (count === 0) return 0
      if (count <= maxCount * 0.25) return 1
      if (count <= maxCount * 0.5) return 2
      if (count <= maxCount * 0.75) return 3
      return 4
    }

    // 生成本月的所有日期
    const monthDates = []
    const currentDate = new Date(firstDayOfMonth)
    
    while (currentDate <= lastDayOfMonth) {
      monthDates.push(new Date(currentDate))
      currentDate.setDate(currentDate.getDate() + 1)
    }

    // 按周分组，每周起始为星期一
    const calendarData = []
    let currentWeek = []
    let weekIndex = 0
    
    // 计算第一周需要补全的天数（从周一开始）
    const firstDayOfWeek = firstDayOfMonth.getDay()
    const daysToAddBefore = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1
    
    // 在前面补全空单元格（非本月日期，level设为-1表示不显示颜色）
    for (let i = 0; i < daysToAddBefore; i++) {
      const prevDate = new Date(firstDayOfMonth)
      prevDate.setDate(prevDate.getDate() - (daysToAddBefore - i))
      const year = prevDate.getFullYear()
      const month = String(prevDate.getMonth() + 1).padStart(2, '0')
      const day = String(prevDate.getDate()).padStart(2, '0')
      currentWeek.push({
        date: `${year}-${month}-${day}`,
        day: prevDate.getDate(),
        count: 0,
        level: -1
      })
    }
    
    // 添加本月的日期
    for (let i = 0; i < monthDates.length; i++) {
      const date = monthDates[i]
      const dayOfWeek = date.getDay()
      
      // 将日期转换为热力图单元格数据
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      const dateStr = `${year}-${month}-${day}`
      const count = dateCountMap[dateStr] || 0
      const level = getLevel(count)
      
      currentWeek.push({
        date: dateStr,
        day: date.getDate(),
        count: count,
        level: level
      })
      
      // 如果是周日或者最后一天，结束当前周
      if (dayOfWeek === 0 || i === monthDates.length - 1) {
        // 如果不是完整的一周，在后面补全空单元格（非本月日期，level设为-1表示不显示颜色）
        if (currentWeek.length < 7) {
          const daysToAddAfter = 7 - currentWeek.length
          for (let j = 0; j < daysToAddAfter; j++) {
            const nextDate = new Date(lastDayOfMonth)
            nextDate.setDate(nextDate.getDate() + (j + 1))
            const year = nextDate.getFullYear()
            const month = String(nextDate.getMonth() + 1).padStart(2, '0')
            const day = String(nextDate.getDate()).padStart(2, '0')
            currentWeek.push({
              date: `${year}-${month}-${day}`,
              day: nextDate.getDate(),
              count: 0,
              level: -1
            })
          }
        }
        calendarData.push({
          weekIndex: weekIndex++,
          cells: currentWeek
        })
        currentWeek = []
      }
    }

    // 计算本月总记录数
    const monthRecords = records.filter(record => {
      const recordTime = new Date(record.recordTime)
      return recordTime >= firstDayOfMonth && recordTime <= lastDayOfMonth
    })

    this.setData({
      calendarData: calendarData,
      totalRecords: monthRecords.length
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
         * 热力图单元格点击事件
         */
        onCellTap(e) {
          const { date } = e.currentTarget.dataset
          if (!date) return
          
          // 如果点击的是当前已激活的单元格，则取消激活
          if (this.data.activeCell === date) {
            this.setData({
              activeCell: null
            })
          } else {
            // 否则激活当前点击的单元格
            this.setData({
              activeCell: date
            })
          }
        },
      
        /**
         * 区块点击事件（点击其他地方隐藏提示）
         */
        onSectionTap(e) {
          // 点击区块其他地方时隐藏提示
          this.setData({
            activeCell: null
          })
        },

  /**
   * 点击总植物数跳转到首页
   */
  onTotalPlantsClick() {
    wx.switchTab({
      url: '/pages/index/index'
    })
  },

  /**
   * 上一个月
   */
  onPrevMonth(e) {
    let { currentYear, currentMonth } = this.data
    
    if (currentMonth === 1) {
      currentYear -= 1
      currentMonth = 12
    } else {
      currentMonth -= 1
    }
    
    this.setData({
      currentYear,
      currentMonth
    })
    
    this.loadHeatmapDataForMonth(currentYear, currentMonth)
  },

  /**
   * 下一个月
   */
  onNextMonth(e) {
    let { currentYear, currentMonth } = this.data
    
    if (currentMonth === 12) {
      currentYear += 1
      currentMonth = 1
    } else {
      currentMonth += 1
    }
    
    this.setData({
      currentYear,
      currentMonth
    })
    
    this.loadHeatmapDataForMonth(currentYear, currentMonth)
  },

  /**
   * 加载指定月份的热力图数据
   */
  loadHeatmapDataForMonth(year, month) {
    const plants = storage.getPlants()
    const allRecords = storage.getRecords()
    
    // 过滤掉没有对应植物的记录
    const validRecords = allRecords.filter(record => {
      return plants.some(plant => plant._id === record.plantId)
    })
    
    const firstDayOfMonth = new Date(year, month - 1, 1)
    const lastDayOfMonth = new Date(year, month, 0)
    
    // 创建日期到记录数的映射
    const dateCountMap = {}
    validRecords.forEach(record => {
      const recordDate = new Date(record.recordTime)
      const recordYear = recordDate.getFullYear()
      const recordMonth = recordDate.getMonth() + 1
      
      // 只统计指定月份的记录
      if (recordYear === year && recordMonth === month) {
        const day = String(recordDate.getDate()).padStart(2, '0')
        const dateStr = `${year}-${String(month).padStart(2, '0')}-${day}`
        dateCountMap[dateStr] = (dateCountMap[dateStr] || 0) + 1
      }
    })

    // 计算最大记录数用于颜色分级
    const maxCount = Math.max(...Object.values(dateCountMap), 1)
    
    // GitHub风格的5级颜色算法
    const getLevel = (count) => {
      if (count === 0) return 0
      if (count <= maxCount * 0.25) return 1
      if (count <= maxCount * 0.5) return 2
      if (count <= maxCount * 0.75) return 3
      return 4
    }

    // 生成本月的所有日期
    const monthDates = []
    const currentDate = new Date(firstDayOfMonth)
    
    while (currentDate <= lastDayOfMonth) {
      monthDates.push(new Date(currentDate))
      currentDate.setDate(currentDate.getDate() + 1)
    }

    // 按周分组，每周起始为星期一
    const calendarData = []
    let currentWeek = []
    let weekIndex = 0
    
    // 计算第一周需要补全的天数（从周一开始）
    const firstDayOfWeek = firstDayOfMonth.getDay()
    const daysToAddBefore = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1
    
    // 在前面补全空单元格（非本月日期，level设为-1表示不显示颜色）
    for (let i = 0; i < daysToAddBefore; i++) {
      const prevDate = new Date(firstDayOfMonth)
      prevDate.setDate(prevDate.getDate() - (daysToAddBefore - i))
      const prevYear = prevDate.getFullYear()
      const prevMonth = String(prevDate.getMonth() + 1).padStart(2, '0')
      const day = String(prevDate.getDate()).padStart(2, '0')
      currentWeek.push({
        date: `${prevYear}-${prevMonth}-${day}`,
        day: prevDate.getDate(),
        count: 0,
        level: -1
      })
    }
    
    // 添加本月的日期
    for (let i = 0; i < monthDates.length; i++) {
      const date = monthDates[i]
      const dayOfWeek = date.getDay()
      
      // 将日期转换为热力图单元格数据
      const day = String(date.getDate()).padStart(2, '0')
      const dateStr = `${year}-${String(month).padStart(2, '0')}-${day}`
      const count = dateCountMap[dateStr] || 0
      const level = getLevel(count)
      
      currentWeek.push({
        date: dateStr,
        day: date.getDate(),
        count: count,
        level: level
      })
      
      // 如果是周日或者最后一天，结束当前周
      if (dayOfWeek === 0 || i === monthDates.length - 1) {
        // 如果不是完整的一周，在后面补全空单元格（非本月日期，level设为-1表示不显示颜色）
        if (currentWeek.length < 7) {
          const daysToAddAfter = 7 - currentWeek.length
          for (let j = 0; j < daysToAddAfter; j++) {
            const nextDate = new Date(lastDayOfMonth)
            nextDate.setDate(nextDate.getDate() + (j + 1))
            const nextYear = nextDate.getFullYear()
            const nextMonth = String(nextDate.getMonth() + 1).padStart(2, '0')
            const day = String(nextDate.getDate()).padStart(2, '0')
            currentWeek.push({
              date: `${nextYear}-${nextMonth}-${day}`,
              day: nextDate.getDate(),
              count: 0,
              level: -1
            })
          }
        }
        calendarData.push({
          weekIndex: weekIndex++,
          cells: currentWeek
        })
        currentWeek = []
      }
    }

    // 计算本月总记录数
    const monthRecords = validRecords.filter(record => {
      const recordTime = new Date(record.recordTime)
      return recordTime >= firstDayOfMonth && recordTime <= lastDayOfMonth
    })

    this.setData({
      calendarData: calendarData,
      totalRecords: monthRecords.length
    })
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
    // 统计页面是最后一个tab，没有下一个
    return
  },

  /**
   * 切换到上一个tab
   */
  switchToPrevTab() {
    wx.switchTab({
      url: '/pages/reminders/reminders'
    })
  }
})
