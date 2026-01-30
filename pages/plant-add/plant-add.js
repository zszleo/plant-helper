// pages/plant-add/plant-add.js
const storage = require('../../utils/storage.js')
const timeUtils = require('../../utils/time.js')

Page({
  data: {
    isEdit: false,
    plantId: '',
    imageUrl: '',
    submitting: false,
    today: '',
    plantTypes: ['花卉', '蔬菜', '果树', '多肉', '草本', '木本', '其他'],
    typeIndex: 0,
    statusOptions: [
      { value: 'healthy', label: '健康' },
      { value: 'growing', label: '生长中' },
      { value: 'need-care', label: '需照料' },
      { value: 'diseased', label: '生病' }
    ],
    statusIndex: 0,
    statusLabel: '健康',
    formData: {
      name: '',
      type: '',
      plantDate: '',
      status: 'healthy',
      description: ''
    }
  },

  onLoad(options) {
    // 设置今天的日期
    const today = new Date()
    const year = today.getFullYear()
    const month = String(today.getMonth() + 1).padStart(2, '0')
    const day = String(today.getDate()).padStart(2, '0')
    const todayStr = `${year}-${month}-${day}`
    
    this.setData({
      today: todayStr
    })

    // 如果是编辑模式，加载植物信息
    if (options.id) {
      this.setData({
        isEdit: true,
        plantId: options.id
      })
      this.loadPlant(options.id)
    } else {
      // 新增模式，设置默认值
      this.setData({
        typeIndex: 4, // 默认选择"草本"
        'formData.type': '草本',
        'formData.plantDate': todayStr, // 默认种植日期为当天
        'formData.status': 'healthy',
        statusIndex: 0,
        statusLabel: '健康'
      })
    }
  },

  /**
   * 加载植物信息
   */
  loadPlant(plantId) {
    const plant = storage.getPlant(plantId)
    if (plant) {
      const typeIndex = this.data.plantTypes.indexOf(plant.type)
      const statusIndex = this.data.statusOptions.findIndex(s => s.value === plant.status)
      
       this.setData({
         formData: {
           name: plant.name,
           type: plant.type,
            plantDate: timeUtils.formatDate(timeUtils.parseToTimestamp(plant.plantDate)),
           status: plant.status,
           description: plant.description || ''
         },
        imageUrl: plant.imageUrl || '',
        typeIndex: typeIndex >= 0 ? typeIndex : 0,
        statusIndex: statusIndex >= 0 ? statusIndex : 0,
        statusLabel: this.getStatusLabel(plant.status)
      })

      wx.setNavigationBarTitle({
        title: '编辑植物'
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
   * 植物类型变化
   */
  onTypeChange(e) {
    const index = e.detail.value
    this.setData({
      typeIndex: index,
      'formData.type': this.data.plantTypes[index]
    })
  },

  /**
   * 日期变化
   */
  onDateChange(e) {
    this.setData({
      'formData.plantDate': e.detail.value
    })
  },

  /**
   * 状态变化
   */
  onStatusChange(e) {
    const index = e.detail.value
    const selectedStatus = this.data.statusOptions[index]
    this.setData({
      statusIndex: index,
      'formData.status': selectedStatus.value,
      statusLabel: selectedStatus.label
    })
  },

  /**
   * 表单验证
   */
  validateForm() {
    const { name, type, plantDate } = this.data.formData

    if (!name.trim()) {
      wx.showToast({
        title: '请输入植物名称',
        icon: 'none'
      })
      return false
    }

    if (!type) {
      wx.showToast({
        title: '请选择植物类型',
        icon: 'none'
      })
      return false
    }

    if (!plantDate) {
      wx.showToast({
        title: '请选择种植日期',
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

    const plantData = {
      ...this.data.formData,
      imageUrl: this.data.imageUrl
    }

    // 模拟保存延迟
    setTimeout(() => {
      let success = false

      if (this.data.isEdit) {
        // 更新植物
        success = storage.updatePlant(this.data.plantId, plantData)
      } else {
        // 添加植物
        success = storage.addPlant(plantData)
      }

      this.setData({
        submitting: false
      })

      if (success) {
        wx.showToast({
          title: this.data.isEdit ? '保存成功' : '添加成功',
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
   * 获取状态标签
   */
  getStatusLabel(status) {
    const statusMap = {
      'healthy': '健康',
      'growing': '生长中',
      'need-care': '需照料',
      'diseased': '生病'
    }
    return statusMap[status] || '未知'
  }
})
