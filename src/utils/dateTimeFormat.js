// dateUtils.js
export function formatDate() {
  const now = new Date();
  let hour = now.getHours();
  let minute = now.getMinutes();
  let second = now.getSeconds();

  if (hour < 10) hour = `0${hour}`;
  if (minute < 10) minute = `0${minute}`;
  if (second < 10) second = `0${second}`;

  return `${hour}:${minute}:${second}`;
}

export function dateFormat(fmt, time) {
  const date = new Date(time);
  let ret;
  const opt = {

    "Y+": date.getFullYear().toString(),

    "m+": (date.getMonth() + 1).toString(),

    "d+": date.getDate().toString()

  };

  for (const k in opt) {
    ret = new RegExp(`(${k})`).exec(fmt);
    if (ret) {
      fmt = fmt.replace(
        ret[1],
        ret[1].length === 1? opt[k] : opt[k].padStart(ret[1].length, '0')
      );
    }
  }

  return fmt;
}

export function get1stAndToday() {
  const toData = new Date(new Date().toLocaleDateString()).getTime();
  const yesterdayStart = toData - 3600 * 24 * 1000;
  const yesterdayEnd = yesterdayStart + 24 * 60 * 60 * 1000 - 1;

  const startDay1 = dateFormat('YYYY-mm-dd', yesterdayStart);
  const endDay1 = dateFormat('YYYY-mm-dd', yesterdayEnd);

  return [startDay1, endDay1];
}

export function getDay() {
  const toData = new Date(new Date().toLocaleDateString()).getTime();
  const yesterdays = toData - 3600 * 24 * 1000;

  const yesterday = dateFormat('YYYY.mm.dd', yesterdays);
  const today = dateFormat('YYYY.mm.dd', toData);

  return [yesterday, today];
}

export function past7Day() {
  const toData = new Date(new Date().toLocaleDateString()).getTime();
  const past7daysStart = toData - 7 * 3600 * 24 * 1000;
  const past7daysEnd = toData - 1;

  const days7Start = dateFormat('YYYY-mm-dd', past7daysStart);
  const days7End = dateFormat('YYYY-mm-dd', past7daysEnd);

  return [days7Start, days7End];
}

export function past30Day() {
  const toData = new Date(new Date().toLocaleDateString()).getTime();
  const past30daysStart = toData - 30 * 3600 * 24 * 1000;
  const past30daysEnd = toData - 1;

  const days30Start = dateFormat('YYYY-mm-dd', past30daysStart);
  const days30End = dateFormat('YYYY-mm-dd', past30daysEnd);

  return [days30Start, days30End];
}

export function pastWeek() {
  const toData = new Date(new Date().toLocaleDateString()).getTime();
  const nowDayOfWeek = new Date().getDay();
  const weekStartData = toData - (nowDayOfWeek - 1) * 24 * 60 * 60 * 1000;
  const weekEndData = toData + (7 - nowDayOfWeek) * 24 * 60 * 60 * 1000;

  const weekStart = dateFormat('YYYY-mm-dd', weekStartData);
  const weekEnd = dateFormat('YYYY-mm-dd', weekEndData);

  return [weekStart, weekEnd];
}

export function pastMonth() {
  const year = new Date().getFullYear();
  const month = new Date().getMonth();
  const monthStartData = new Date(year, month, 1).getTime();
  const monthEndData = new Date(year, month + 1, 0).getTime() + 24 * 60 * 60 * 1000 - 1;

  const monthStart = dateFormat('YYYY-mm-dd', monthStartData);
  const monthEnd = dateFormat('YYYY-mm-dd', monthEndData);

  return [monthStart, monthEnd];
}

/**
 * 通用日期格式化函数，处理不同类型的日期值
 * @param {Date|string|number} dateValue - 日期值
 * @param {string} format - 格式化模式，默认为 'YYYY-MM-DD'
 * @returns {string} 格式化后的日期字符串
 */
export function formatDateValue(dateValue, format = 'YYYY-MM-DD') {
  if (!dateValue) return '';
  
  // 处理时间戳
  if (typeof dateValue === 'number') {
    // 对于时间戳，直接使用本地时间格式化，避免时区转换
    const date = new Date(dateValue);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    
    if (format === 'YYYY-MM-DD') {
      return `${year}-${month}-${day}`;
    }
    else if (format === 'YYYY-MM-DD HH:mm:ss') {
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      const seconds = String(date.getSeconds()).padStart(2, '0');
      return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
    }
  }
  // 处理字符串
  else if (typeof dateValue === 'string') {
    // 如果只需要日期部分，直接返回前10个字符，不进行时区转换
    if (format === 'YYYY-MM-DD' && dateValue.length >= 10) {
      return dateValue.substring(0, 10);
    }
    
    // 对于其他格式，尝试解析后格式化
    const date = new Date(dateValue);
    if (!isNaN(date.getTime())) {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      
      if (format === 'YYYY-MM-DD') {
        return `${year}-${month}-${day}`;
      }
      else if (format === 'YYYY-MM-DD HH:mm:ss') {
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        const seconds = String(date.getSeconds()).padStart(2, '0');
        return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
      }
    }
  }
  // 处理Date对象
  else if (dateValue instanceof Date) {
    if (isNaN(dateValue.getTime())) {
      return '';
    }
    
    const year = dateValue.getFullYear();
    const month = String(dateValue.getMonth() + 1).padStart(2, '0');
    const day = String(dateValue.getDate()).padStart(2, '0');
    
    if (format === 'YYYY-MM-DD') {
      return `${year}-${month}-${day}`;
    }
    else if (format === 'YYYY-MM-DD HH:mm:ss') {
      const hours = String(dateValue.getHours()).padStart(2, '0');
      const minutes = String(dateValue.getMinutes()).padStart(2, '0');
      const seconds = String(dateValue.getSeconds()).padStart(2, '0');
      return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
    }
  }
  
  return '';
}