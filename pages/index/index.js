// pages/index/index.js
const storage = require('../../utils/storage.js')
const timeUtils = require('../../utils/time.js')

Page({
  data: {
    plants: [],
    filteredPlants: [],
    searchKeyword: '',
    syncState: {
      lastSyncTime: null,
      pendingCount: 0,
      isSyncing: false
    },
    // 触摸滑动相关
    touchStartX: 0,
    touchStartY: 0,
    // 页面动画类
    pageAnimationClass: '',
    // 分页相关
    currentPage: 1,
    pageSize: 10,
    hasMore: true,
    isLoading: false
  },

  onLoad() {
    this.loadPlants()
    this.loadSyncState()
  },

  onShow() {
    this.loadPlants()
    this.loadSyncState()
    this.scrollToTop()
    // 重置动画类
    this.setData({
      pageAnimationClass: ''
    })
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({
        selected: 0
      })
    }
  },

  /**
   * 下拉刷新
   */
  onPullDownRefresh() {
    this.loadPlants()
    this.loadSyncState()
    setTimeout(() => {
      wx.stopPullDownRefresh()
    }, 1000)
  },

  /**
   * 加载植物列表
   */
  loadPlants(reset = true) {
    const plants = storage.getPlants()
    
    // 为每个植物添加记录数量
    const plantsWithCount = plants.map(plant => {
      const recordCount = this.getRecordCount(plant._id)
      const plantWithCount = { ...plant, recordCount: recordCount || 0 }
      return plantWithCount
    })
    
    if (reset) {
      this.setData({
        plants: plantsWithCount,
        filteredPlants: [],  // 清空，等待加载第一页
        currentPage: 1,
        hasMore: plantsWithCount.length > this.data.pageSize
      })
      
      // 如果有数据，直接加载第一页
      if (plantsWithCount.length > 0) {
        this.loadMorePlants()
      } else {
        // 没有数据时，保持 filteredPlants 为空
        this.setData({
          filteredPlants: []
        })
      }
    } else {
      this.setData({
        plants: plantsWithCount
      })
      this.filterPlants(this.data.searchKeyword)
    }
  },

  /**
   * 加载更多植物
   */
  loadMorePlants() {
    // 如果正在加载，跳过
    if (this.data.isLoading) {
      return
    }

    // 如果已经加载了所有数据，跳过
    if (this.data.filteredPlants.length >= this.data.plants.length) {
      return
    }

    this.setData({ isLoading: true })

    const startIndex = (this.data.currentPage - 1) * this.data.pageSize
    const endIndex = this.data.currentPage * this.data.pageSize
    const morePlants = this.data.plants.slice(startIndex, endIndex)

    const newFilteredPlants = [...this.data.filteredPlants, ...morePlants]
    const newCurrentPage = this.data.currentPage + 1
    const newHasMore = endIndex < this.data.plants.length

    this.setData({
      filteredPlants: newFilteredPlants,
      currentPage: newCurrentPage,
      hasMore: newHasMore,
      isLoading: false
    })
  },

  /**
   * 触底加载更多
   */
  onReachBottom() {
    this.loadMorePlants()
  },

  /**
   * 加载同步状态
   */
  loadSyncState() {
    const syncState = storage.getSyncState()
    this.setData({
      syncState: syncState
    })
  },

  /**
   * 搜索输入
   */
  onSearchInput(e) {
    const keyword = e.detail.value.trim()
    this.setData({
      searchKeyword: keyword
    })
    this.filterPlants(keyword)
  },

  /**
   * 搜索确认
   */
  onSearch() {
    this.filterPlants(this.data.searchKeyword)
  },

  /**
   * 筛选植物
   */
  filterPlants(keyword) {
    let filtered = this.data.plants
    
    if (!keyword) {
      filtered = this.data.plants
    } else {
      filtered = this.data.plants.filter(plant =>
        plant.name.toLowerCase().includes(keyword.toLowerCase()) ||
        plant.type.toLowerCase().includes(keyword.toLowerCase())
      )
    }

    // 重置分页状态
    this.setData({
      currentPage: 1,
      hasMore: filtered.length > this.data.pageSize
    })

    // 加载第一页数据
    const firstPage = filtered.slice(0, this.data.pageSize)
    this.setData({
      filteredPlants: firstPage
    })
  },

  /**
   * 同步按钮点击（预留功能）
   */
  onSync() {
    if (this.data.syncState.isSyncing) {
      wx.showToast({
        title: '正在同步中...',
        icon: 'none'
      })
      return
    }

    wx.showModal({
      title: '同步数据',
      content: '此功能为预留功能，暂不支持云端同步。当前数据仅存储在本地。',
      showCancel: false,
      confirmText: '我知道了'
    })
  },

  /**
   * 添加植物
   */
  onAddPlant() {
    wx.navigateTo({
      url: '/pages/plant-add/plant-add'
    })
  },

  /**
   * 植物详情
   */
  onPlantDetail(e) {
    const plantId = e.currentTarget.dataset.id
    wx.navigateTo({
      url: `/pages/plant-detail/plant-detail?id=${plantId}`
    })
  },

  /**
   * 编辑植物
   */
  onEditPlant(e) {
    const plantId = e.currentTarget.dataset.id
    wx.navigateTo({
      url: `/pages/plant-add/plant-add?id=${plantId}`
    })
  },

  /**
   * 删除植物
   */
  onDeletePlant(e) {
    const plantId = e.currentTarget.dataset.id
    const plant = storage.getPlant(plantId)

    wx.showModal({
      title: '确认删除',
      content: `确定要删除"${plant.name}"吗？此操作不可恢复。`,
      confirmColor: '#F44336',
      success: (res) => {
        if (res.confirm) {
          const success = storage.deletePlant(plantId)
          if (success) {
            wx.showToast({
              title: '删除成功',
              icon: 'success'
            })
            this.loadPlants(true)
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
         * 获取记录数量
         */
        getRecordCount(plantId) {
          const records = storage.getRecords()
          const plantRecords = records.filter(record => record.plantId === plantId)
          const count = plantRecords.length
          return count
        },
      
        /**
         * 滚动到顶部
         */
        scrollToTop() {
          this.setData({
            scrollTop: 0
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
          // 添加向左滑动的动画
          this.setData({
            pageAnimationClass: 'page-slide-left'
          })
          
          // 延迟切换页面，让动画播放
          setTimeout(() => {
            wx.switchTab({
              url: '/pages/records/records'
            })
          }, 500)
        },

        /**
         * 切换到上一个tab
         */
        switchToPrevTab() {
          // 首页是第一个tab，没有上一个
          wx.showToast({
            title: '已经划到底了哟',
            icon: 'none',
            duration: 1000,
            position: 'bottom'
          })
        }
      })
