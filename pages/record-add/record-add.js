// pages/record-add/record-add.js
const storage = require('../../utils/storage.js')

Page({
  data: {
    plants: [],
    plantOptions: [],
    plantIndex: 0,
    selectedPlant: null,
    submitting: false,
    dateRange: [],
    dateIndex: [0, 0],
    recordTimeDisplay: '请选择时间',
    formData: {
      plantId: '',
      type: 'watering',
      recordTime: '',
      notes: ''
    }
  },

  onLoad(options) {
    this.loadPlants()
    this.initDateTime()

    // 如果有预设的植物ID和类型
    if (options.plantId) {
      const plants = storage.getPlants()
      const plantIndex = plants.findIndex(p => p._id === options.plantId)
      if (plantIndex >= 0) {
        this.setData({
          plantIndex: plantIndex,
          'formData.plantId': options.plantId
        })
      }
    }

    if (options.type) {
      this.setData({
        'formData.type': options.type
      })
    }

    // 设置默认时间为当前时间
    this.setCurrentTime()
  },

  /**
   * 加载植物列表
   */
  loadPlants() {
    const plants = storage.getPlants()
    this.setData({
      plants: plants,
      plantOptions: plants
    })

    // 如果有植物且未选择，默认选择第一个
    if (plants.length > 0 && !this.data.formData.plantId) {
      this.setData({
        plantIndex: 0,
        selectedPlant: plants[0],
        'formData.plantId': plants[0]._id
      })
    }
  },

  /**
   * 初始化日期时间选择器
   */
  initDateTime() {
    const dateRange = []
    const timeRange = []

    // 生成最近30天的日期
    for (let i = 0; i < 30; i++) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      const label = i === 0 ? '今天' : `${month}-${day}`
      dateRange.push({
        label: label,
        value: date.toISOString().split('T')[0]
      })
    }

    // 生成时间选项（每30分钟一个）
    for (let i = 0; i < 48; i++) {
      const hours = Math.floor(i / 2)
      const minutes = (i % 2) * 30
      const label = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`
      timeRange.push({
        label: label,
        value: label
      })
    }

    this.setData({
      dateRange: [dateRange, timeRange]
    })
  },

  /**
   * 设置当前时间
   */
  setCurrentTime() {
    const now = new Date()
    const dateStr = now.toISOString().split('T')[0]
    const hours = String(now.getHours()).padStart(2, '0')
    const minutes = String(now.getMinutes()).padStart(2, '0')
    const timeStr = `${hours}:${minutes}`

    // 找到对应的索引
    const dateIndex = this.data.dateRange[0].findIndex(d => d.value === dateStr)
    const timeIndex = this.data.dateRange[1].findIndex(t => t.value === timeStr)

    // 格式化显示时间
    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, '0')
    const day = String(now.getDate()).padStart(2, '0')
    const displayTime = `${year}-${month}-${day} ${timeStr}:00`

    this.setData({
      dateIndex: [dateIndex >= 0 ? dateIndex : 0, timeIndex >= 0 ? timeIndex : 0],
      'formData.recordTime': `${dateStr}T${timeStr}:00`,
      recordTimeDisplay: displayTime
    })
  },

  /**
   * 植物选择变化
   */
  onPlantChange(e) {
    const index = e.detail.value
    this.setData({
      plantIndex: index,
      selectedPlant: this.data.plants[index],
      'formData.plantId': this.data.plants[index]._id
    })
  },

  /**
   * 类型选择变化
   */
  onTypeSelect(e) {
    const type = e.currentTarget.dataset.type
    this.setData({
      'formData.type': type
    })
  },

  /**
   * 时间选择变化
   */
    onDateChange(e) {
      const [dateIndex, timeIndex] = e.detail.value
      const dateValue = this.data.dateRange[0][dateIndex].value
      const timeValue = this.data.dateRange[1][timeIndex].value
  
       // 格式化显示时间
     const date = new Date(dateValue)
     const year = date.getFullYear()
     const month = String(date.getMonth() + 1).padStart(2, '0')
     const day = String(date.getDate()).padStart(2, '0')
     const displayTime = `${year}-${month}-${day} ${timeValue}:00`
  
      this.setData({
        dateIndex: [dateIndex, timeIndex],
        'formData.recordTime': `${dateValue}T${timeValue}:00`,
        recordTimeDisplay: displayTime
      })
    },

  /**
   * 输入框变化
   */
  onInputChange(e) {
    const field = e.currentTarget.dataset.field
    const value = e.detail.value
    this.setData({
      [`formData.${field}`]: value
    })
  },

  /**
   * 选择图片
   */
  onChooseImage() {
    wx.chooseImage({
      count: 1,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        const tempFilePath = res.tempFilePaths[0]
        this.setData({
          imageUrl: tempFilePath
        })
      },
      fail: (err) => {
        console.error('选择图片失败:', err)
      }
    })
  },

  /**
   * 移除图片
   */
  onRemoveImage() {
    wx.showModal({
      title: '确认删除',
      content: '确定要删除这张图片吗？',
      success: (res) => {
        if (res.confirm) {
          this.setData({
            imageUrl: ''
          })
        }
      }
    })
  },

  /**
   * 表单验证
   */
  validateForm() {
    const { plantId, type, recordTime } = this.data.formData

    if (!plantId) {
      wx.showToast({
        title: '请选择植物',
        icon: 'none'
      })
      return false
    }

    if (!type) {
      wx.showToast({
        title: '请选择记录类型',
        icon: 'none'
      })
      return false
    }

    if (!recordTime) {
      wx.showToast({
        title: '请选择记录时间',
        icon: 'none'
      })
      return false
    }

    return true
  },

  /**
   * 提交表单
   */
  onSubmit() {
    if (!this.validateForm()) {
      return
    }

    if (this.data.submitting) {
      return
    }

    this.setData({
      submitting: true
    })

    const recordData = {
      plantId: this.data.formData.plantId,
      type: this.data.formData.type,
      recordTime: this.data.formData.recordTime,
      notes: this.data.formData.notes
    }

    // 模拟保存延迟
    setTimeout(() => {
      const success = storage.addRecord(recordData)

      this.setData({
        submitting: false
      })

      if (success) {
        wx.showToast({
          title: '保存成功',
          icon: 'success'
        })
        setTimeout(() => {
          wx.navigateBack()
        }, 1500)
      } else {
        wx.showToast({
          title: '保存失败',
          icon: 'none'
        })
      }
    }, 500)
  },

  /**
   * 取消
   */
  onCancel() {
    wx.showModal({
      title: '确认取消',
      content: '确定要取消吗？未保存的内容将丢失。',
      success: (res) => {
        if (res.confirm) {
          wx.navigateBack()
        }
      }
    })
  },

  /**
   * 格式化记录时间
   */
  formatDateDisplay() {
    if (!this.data.formData.recordTime) return '请选择时间'
    
    const date = new Date(this.data.formData.recordTime)
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const hours = String(date.getHours()).padStart(2, '0')
    const minutes = String(date.getMinutes()).padStart(2, '0')
    return `${month}-${day} ${hours}:${minutes}`
  }
})
