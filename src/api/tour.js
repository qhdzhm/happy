import request from '@/utils/request';

/**
 * 通过订单ID获取行程排序
 * @param {number} bookingId 订单ID
 * @returns {Promise} 行程排序数据
 */
export function getSchedulesByBookingId(bookingId) {
  return request({
    url: `/admin/tour/schedule/booking/${bookingId}`,
    method: 'get'
  });
}

/**
 * 通过日期范围获取行程排序
 * @param {string} startDate 开始日期
 * @param {string} endDate 结束日期
 * @returns {Promise} 行程排序数据
 */
export function getSchedulesByDateRange(startDate, endDate) {
  return request({
    url: '/admin/tour/schedule/date',
    method: 'get',
    params: { startDate, endDate }
  });
}

/**
 * 保存单个行程排序
 * @param {object} data 行程排序数据
 * @returns {Promise} 保存结果
 */
export function saveSchedule(data) {
  return request({
    url: '/admin/tour/schedule',
    method: 'post',
    data
  });
}

/**
 * 批量保存行程排序
 * @param {object} data 批量行程排序数据
 * @returns {Promise} 保存结果
 */
export function saveBatchSchedules(data) {
  return request({
    url: '/admin/tour/schedule/batch',
    method: 'post',
    data
  });
}

/**
 * 初始化订单的行程排序
 * @param {number} bookingId 订单ID
 * @returns {Promise} 初始化结果
 */
export function initOrderSchedules(bookingId) {
  return request({
    url: `/admin/tour/schedule/init/${bookingId}`,
    method: 'post'
  });
} 