// utils/storage.js - 本地存储服务
const STORAGE_KEYS = {
  USER_INFO: 'user_info',
  PLANTS: 'plants',
  RECORDS: 'records',
  REMINDERS: 'reminders',
  SYNC_STATE: 'sync_state',
  OFFLINE_QUEUE: 'offline_queue'
}

class StorageService {
  /**
   * 获取数据
   * @param {string} key 存储键
   * @param {any} defaultValue 默认值
   * @returns {any} 存储的数据
   */
  get(key, defaultValue = null) {
    try {
      const data = wx.getStorageSync(key)
      return data !== '' ? data : defaultValue
    } catch (error) {
      console.error('Storage get error:', error)
      return defaultValue
    }
  }

  /**
   * 设置数据
   * @param {string} key 存储键
   * @param {any} value 存储值
   * @returns {boolean} 是否成功
   */
  set(key, value) {
    try {
      wx.setStorageSync(key, value)
      return true
    } catch (error) {
      console.error('Storage set error:', error)
      wx.showToast({
        title: '存储失败',
        icon: 'none'
      })
      return false
    }
  }

  /**
   * 删除数据
   * @param {string} key 存储键
   * @returns {boolean} 是否成功
   */
  remove(key) {
    try {
      wx.removeStorageSync(key)
      return true
    } catch (error) {
      console.error('Storage remove error:', error)
      return false
    }
  }

  /**
   * 清空所有数据
   * @returns {boolean} 是否成功
   */
  clear() {
    try {
      wx.clearStorageSync()
      return true
    } catch (error) {
      console.error('Storage clear error:', error)
      return false
    }
  }

  /**
   * 获取用户信息
   * @returns {object} 用户信息
   */
  getUserInfo() {
    return this.get(STORAGE_KEYS.USER_INFO, {
      openid: '',
      nickname: '未登录',
      avatarUrl: '',
      lastSyncTime: null
    })
  }

  /**
   * 设置用户信息
   * @param {object} userInfo 用户信息
   * @returns {boolean} 是否成功
   */
  setUserInfo(userInfo) {
    return this.set(STORAGE_KEYS.USER_INFO, userInfo)
  }

  /**
   * 获取植物列表
   * @returns {array} 植物列表
   */
  getPlants() {
    return this.get(STORAGE_KEYS.PLANTS, [])
  }

  /**
   * 设置植物列表
   * @param {array} plants 植物列表
   * @returns {boolean} 是否成功
   */
  setPlants(plants) {
    return this.set(STORAGE_KEYS.PLANTS, plants)
  }

  /**
   * 添加植物
   * @param {object} plant 植物信息
   * @returns {boolean} 是否成功
   */
  addPlant(plant) {
    const plants = this.getPlants()
    plant._id = this.generateId()
    plant.createTime = new Date().toISOString()
    plant.localModified = true
    plant.syncStatus = 'pending'
    plants.push(plant)
    return this.setPlants(plants)
  }

  /**
   * 更新植物
   * @param {string} plantId 植物ID
   * @param {object} updates 更新内容
   * @returns {boolean} 是否成功
   */
  updatePlant(plantId, updates) {
    const plants = this.getPlants()
    const index = plants.findIndex(p => p._id === plantId)
    if (index !== -1) {
      plants[index] = { ...plants[index], ...updates, localModified: true, syncStatus: 'pending' }
      return this.setPlants(plants)
    }
    return false
  }

  /**
   * 删除植物
   * @param {string} plantId 植物ID
   * @returns {boolean} 是否成功
   */
  deletePlant(plantId) {
    const plants = this.getPlants()
    const filteredPlants = plants.filter(p => p._id !== plantId)
    if (filteredPlants.length !== plants.length) {
      return this.setPlants(filteredPlants)
    }
    return false
  }

  /**
   * 获取单个植物
   * @param {string} plantId 植物ID
   * @returns {object|null} 植物信息
   */
  getPlant(plantId) {
    const plants = this.getPlants()
    return plants.find(p => p._id === plantId) || null
  }

  /**
   * 获取生长记录列表
   * @returns {array} 记录列表
   */
  getRecords() {
    return this.get(STORAGE_KEYS.RECORDS, [])
  }

  /**
   * 设置生长记录列表
   * @param {array} records 记录列表
   * @returns {boolean} 是否成功
   */
  setRecords(records) {
    return this.set(STORAGE_KEYS.RECORDS, records)
  }

  /**
   * 添加生长记录
   * @param {object} record 记录信息
   * @returns {boolean} 是否成功
   */
  addRecord(record) {
    const records = this.getRecords()
    record._id = this.generateId()
    record.createTime = new Date().toISOString()
    record.localCreated = true
    records.push(record)
    return this.setRecords(records)
  }

  /**
   * 更新生长记录
   * @param {string} recordId 记录ID
   * @param {object} updates 更新内容
   * @returns {boolean} 是否成功
   */
  updateRecord(recordId, updates) {
    const records = this.getRecords()
    const index = records.findIndex(r => r._id === recordId)
    if (index !== -1) {
      records[index] = { ...records[index], ...updates }
      return this.setRecords(records)
    }
    return false
  }

  /**
   * 删除生长记录
   * @param {string} recordId 记录ID
   * @returns {boolean} 是否成功
   */
  deleteRecord(recordId) {
    const records = this.getRecords()
    const filteredRecords = records.filter(r => r._id !== recordId)
    if (filteredRecords.length !== records.length) {
      return this.setRecords(filteredRecords)
    }
    return false
  }

  /**
   * 获取指定植物的生长记录
   * @param {string} plantId 植物ID
   * @returns {array} 记录列表
   */
  getPlantRecords(plantId) {
    const records = this.getRecords()
    return records.filter(r => r.plantId === plantId)
  }

  /**
   * 获取提醒列表
   * @returns {array} 提醒列表
   */
  getReminders() {
    return this.get(STORAGE_KEYS.REMINDERS, [])
  }

  /**
   * 设置提醒列表
   * @param {array} reminders 提醒列表
   * @returns {boolean} 是否成功
   */
  setReminders(reminders) {
    return this.set(STORAGE_KEYS.REMINDERS, reminders)
  }

  /**
   * 添加提醒
   * @param {object} reminder 提醒信息
   * @returns {boolean} 是否成功
   */
  addReminder(reminder) {
    const reminders = this.getReminders()
    reminder._id = this.generateId()
    reminder.createTime = new Date().toISOString()
    reminder.isEnabled = true
    reminders.push(reminder)
    return this.setReminders(reminders)
  }

  /**
   * 更新提醒
   * @param {string} reminderId 提醒ID
   * @param {object} updates 更新内容
   * @returns {boolean} 是否成功
   */
  updateReminder(reminderId, updates) {
    const reminders = this.getReminders()
    const index = reminders.findIndex(r => r._id === reminderId)
    if (index !== -1) {
      reminders[index] = { ...reminders[index], ...updates }
      return this.setReminders(reminders)
    }
    return false
  }

  /**
   * 删除提醒
   * @param {string} reminderId 提醒ID
   * @returns {boolean} 是否成功
   */
  deleteReminder(reminderId) {
    const reminders = this.getReminders()
    const filteredReminders = reminders.filter(r => r._id !== reminderId)
    if (filteredReminders.length !== reminders.length) {
      return this.setReminders(filteredReminders)
    }
    return false
  }

  /**
   * 获取同步状态
   * @returns {object} 同步状态
   */
  getSyncState() {
    return this.get(STORAGE_KEYS.SYNC_STATE, {
      lastSyncTime: null,
      pendingCount: 0,
      isSyncing: false
    })
  }

  /**
   * 设置同步状态
   * @param {object} syncState 同步状态
   * @returns {boolean} 是否成功
   */
  setSyncState(syncState) {
    return this.set(STORAGE_KEYS.SYNC_STATE, syncState)
  }

  /**
   * 获取离线操作队列
   * @returns {array} 操作队列
   */
  getOfflineQueue() {
    return this.get(STORAGE_KEYS.OFFLINE_QUEUE, [])
  }

  /**
   * 添加离线操作
   * @param {object} operation 操作信息
   * @returns {boolean} 是否成功
   */
  addOfflineOperation(operation) {
    const queue = this.getOfflineQueue()
    operation.id = this.generateId()
    operation.timestamp = new Date().toISOString()
    queue.push(operation)
    return this.set(STORAGE_KEYS.OFFLINE_QUEUE, queue)
  }

  /**
   * 清空离线操作队列
   * @returns {boolean} 是否成功
   */
  clearOfflineQueue() {
    return this.set(STORAGE_KEYS.OFFLINE_QUEUE, [])
  }

  /**
   * 生成唯一ID
   * @returns {string} 唯一ID
   */
  generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2)
  }

  /**
   * 获取存储使用情况
   * @returns {object} 存储信息
   */
  getStorageInfo() {
    try {
      const info = wx.getStorageInfoSync()
      return {
        keys: info.keys,
        currentSize: info.currentSize,
        limitSize: info.limitSize,
        usagePercent: ((info.currentSize / info.limitSize) * 100).toFixed(2)
      }
    } catch (error) {
      console.error('Get storage info error:', error)
      return null
    }
  }
}

// 导出单例
const storageService = new StorageService()
module.exports = storageService