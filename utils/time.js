// 时间戳转显示字符串
function formatDateTime(timestamp) {
  const date = new Date(timestamp);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

function formatDate(timestamp) {
  const date = new Date(timestamp);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// 兼容现有字符串格式，转为时间戳
function parseToTimestamp(timeStr) {
  // 处理null或undefined
  if (timeStr == null) return Date.now();
  
  // 如果是数字类型，直接返回
  if (typeof timeStr === 'number') {
    return timeStr;
  }
  
  // 如果是字符串类型
  if (typeof timeStr === 'string') {
    // 尝试转换为数字，如果是纯数字字符串，可能已经是时间戳
    const num = Number(timeStr);
    if (!isNaN(num) && isFinite(num) && /^\d+$/.test(timeStr)) {
      return num;
    }
    
    // 处理简单日期 "YYYY-MM-DD"，添加时间部分使其按本地时区解析
    if (/^\d{4}-\d{2}-\d{2}$/.test(timeStr)) {
      timeStr = timeStr + 'T00:00:00';
    }
    
    // 使用Date对象解析，自动处理时区
    const timestamp = new Date(timeStr).getTime();
    if (!isNaN(timestamp)) {
      return timestamp;
    }
  }
  
  // 其他类型或解析失败，返回当前时间
  return Date.now();
}

module.exports = { formatDateTime, formatDate, parseToTimestamp };