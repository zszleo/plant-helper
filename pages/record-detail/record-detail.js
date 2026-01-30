// pages/record-detail/record-detail.js
const storage = require('../../utils/storage.js')
const timeUtils = require('../../utils/time.js')

Page({
  data: {
    recordId: '',
    record: null,
    recordIcon: '',
    recordTitle: '',
    formattedTime: '',
    showNoteModal: false,
    noteText: ''
  },

  onLoad(options) {
    if (options.id) {
      this.setData({
        recordId: options.id
      })
      this.loadRecord()
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

  /**
   * 加载记录信息
   */
  loadRecord() {
    const record = storage.getRecord(this.data.recordId)
    if (record) {
      // 获取植物名称
      const plant = storage.getPlant(record.plantId)
      const recordWithPlantName = {
        ...record,
        plantName: plant ? plant.name : '未知植物'
      }

      // 计算显示数据
      const recordIcon = this.getRecordIcon(record.type)
      const recordTitle = this.getRecordTitle(record.type)
      const formattedTime = timeUtils.formatDateTime(timeUtils.parseToTimestamp(record.recordTime))

      this.setData({
        record: recordWithPlantName,
        recordIcon: recordIcon,
        recordTitle: recordTitle,
        formattedTime: formattedTime
      })

      wx.setNavigationBarTitle({
        title: '记录详情'
      })
    } else {
      wx.showToast({
        title: '记录不存在',
        icon: 'none'
      })
      setTimeout(() => {
        wx.navigateBack()
      }, 1500)
    }
  },

  /**
   * 修改备注
   */
  onEditNote() {
    this.setData({
      showNoteModal: true,
      noteText: this.data.record.notes || ''
    })
  },

  /**
   * 备注输入
   */
  onNoteInput(e) {
    this.setData({
      noteText: e.detail.value
    })
  },

  /**
   * 保存备注
   */
  onSaveNote() {
    const noteText = this.data.noteText.trim()
    
    // 更新记录
    const updatedRecord = {
      ...this.data.record,
      notes: noteText || ''
    }
    
    const success = storage.updateRecord(this.data.recordId, updatedRecord)
    
    if (success) {
      wx.showToast({
        title: '保存成功',
        icon: 'success'
      })
      
      // 重新加载记录数据
      this.loadRecord()
      
      // 关闭弹窗
      this.setData({
        showNoteModal: false,
        noteText: ''
      })
    } else {
      wx.showToast({
        title: '保存失败',
        icon: 'none'
      })
    }
  },

  /**
   * 取消修改备注
   */
  onCancelEditNote() {
    this.setData({
      showNoteModal: false,
      noteText: ''
    })
  },

  /**
   * 阻止事件冒泡
   */
  stopPropagation() {
    // 阻止点击弹窗内容时关闭弹窗
  },

  /**
   * 删除记录
   */
  onDelete() {
    wx.showModal({
      title: '确认删除',
      content: '确定要删除这条记录吗？此操作不可恢复。',
      confirmColor: '#F44336',
      success: (res) => {
        if (res.confirm) {
          const success = storage.deleteRecord(this.data.recordId)
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
