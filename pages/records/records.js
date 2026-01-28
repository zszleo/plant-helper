// pages/records/records.js
const storage = require('../../utils/storage.js')

Page({
  data: {
    records: [],
    plants: [],
    filteredRecords: [],
    groupedRecords: [],
    selectedType: ''
  },

  onLoad() {
    this.loadPlants()
    this.loadRecords()
  },

  onShow() {
    console.log('记录页面 onShow，重新加载数据')
    this.loadPlants()
    this.loadRecords()
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({
        selected: 1
      })
    }
  },

  /**
   * 下拉刷新
   */
  onPullDownRefresh() {
    this.loadPlants()
    this.loadRecords()
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
   * 加载记录列表
   */
  loadRecords() {
    const records = storage.getRecords()
    const plants = this.data.plants

    // 过滤掉没有对应植物的记录，并为每条记录添加植物名称
    const recordsWithPlantName = records
      .filter(record => {
        const plant = plants.find(p => p._id === record.plantId)
        return plant !== undefined
      })
      .map(record => {
        const plant = plants.find(p => p._id === record.plantId)
        return {
          ...record,
          plantName: plant ? plant.name : '未知植物',
          plantImage: plant && plant.imageUrl ? plant.imageUrl : ''
        }
      })

    // 按时间倒序排列
    recordsWithPlantName.sort((a, b) => new Date(b.recordTime) - new Date(a.recordTime))

    this.setData({
      records: recordsWithPlantName
    })

    this.filterRecords()
  },

  /**
   * 筛选记录
   */
  filterRecords() {
    let filtered = this.data.records

    if (this.data.selectedType) {
      filtered = filtered.filter(record => record.type === this.data.selectedType)
    }

    this.setData({
      filteredRecords: filtered
    })

    this.groupRecordsByDate()
  },

  /**
   * 按日期分组记录
   */
  groupRecordsByDate() {
    const grouped = {}
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    this.data.filteredRecords.forEach(record => {
      const recordDate = new Date(record.recordTime)
      recordDate.setHours(0, 0, 0, 0)
      
      const diffDays = Math.floor((today - recordDate) / (1000 * 60 * 60 * 24))
      
      let dateKey
      if (diffDays === 0) {
        dateKey = '今天'
      } else if (diffDays === 1) {
        dateKey = '昨天'
      } else if (diffDays < 7) {
        const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
        dateKey = weekdays[recordDate.getDay()]
      } else {
        const month = String(recordDate.getMonth() + 1).padStart(2, '0')
        const day = String(recordDate.getDate()).padStart(2, '0')
        dateKey = `${month}-${day}`
      }

      if (!grouped[dateKey]) {
        grouped[dateKey] = []
      }
      // 为每条记录添加标题和格式化时间
      grouped[dateKey].push({
        ...record,
        recordTitle: this.getRecordTitle(record.type),
        formattedTime: this.formatTime(record.recordTime)
      })
    })

    // 转换为数组格式
    const groupedArray = Object.keys(grouped).map(date => ({
      date: date,
      records: grouped[date]
    }))

    this.setData({
      groupedRecords: groupedArray
    })
  },

  /**
   * 筛选器变化
   */
  onFilterChange(e) {
    const type = e.currentTarget.dataset.type
    this.setData({
      selectedType: type
    })
    this.filterRecords()
  },

  /**
   * 添加记录
   */
  onAddRecord() {
    if (this.data.plants.length === 0) {
      wx.showToast({
        title: '请先添加植物',
        icon: 'none'
      })
      return
    }

    // 如果只有一个植物，直接跳转到添加记录页面
    if (this.data.plants.length === 1) {
      wx.navigateTo({
        url: `/pages/record-add/record-add?plantId=${this.data.plants[0]._id}`
      })
      return
    }

    // 多个植物，显示选择器
    const plantNames = this.data.plants.map(p => p.name)
    wx.showActionSheet({
      itemList: plantNames,
      success: (res) => {
        const plantId = this.data.plants[res.tapIndex]._id
        wx.navigateTo({
          url: `/pages/record-add/record-add?plantId=${plantId}`
        })
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
   * 记录详情
   */
  onRecordDetail(e) {
    const recordId = e.currentTarget.dataset.id
    wx.navigateTo({
      url: `/pages/record-detail/record-detail?id=${recordId}`
    })
  },

   /**
    * 格式化时间
    */
   formatTime(timeStr) {
     if (!timeStr) return ''
     const date = new Date(timeStr)
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
