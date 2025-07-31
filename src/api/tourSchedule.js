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
 * 为行程分配导游和车辆
 * @param {object} data 分配数据，包含日期、地点、导游ID、车辆ID等
 * @returns {Promise} 分配结果
 */
export function assignGuideAndVehicle(data) {
  return request({
    url: '/admin/tour/schedule/assign',
    method: 'post',
    data
  });
}

/**
 * 根据日期和地点获取导游车辆分配信息
 * @param {string} date 日期
 * @param {string} location 地点
 * @returns {Promise} 分配信息
 */
export function getAssignmentByDateAndLocation(date, location) {
  return request({
    url: '/admin/tour/schedule/assignment',
    method: 'get',
    params: { date, location }
  });
}

/**
 * 根据订单号搜索行程排序
 * @param {string} orderNumber 订单号
 * @returns {Promise} 行程排序数据
 */
export function getSchedulesByOrderNumber(orderNumber) {
  return request({
    url: '/admin/tour/schedule/search',
    method: 'get',
    params: { orderNumber }
  });
}

/**
 * 根据联系人姓名搜索行程排序
 * @param {string} contactPerson 联系人姓名
 * @returns {Promise} 行程排序数据
 */
export function getSchedulesByContactPerson(contactPerson) {
  return request({
    url: '/admin/tour/schedule/search/contact',
    method: 'get',
    params: { contactPerson }
  });
}

/**
 * 获取可选的一日游产品列表（用于额外行程）
 * @returns {Promise}
 */
export const getAvailableDayTours = () => {
  return request({
    url: '/admin/tour/schedule/day-tours',
    method: 'get'
  });
};

/**
 * 删除行程排序
 * @param {number} scheduleId 行程排序ID
 * @returns {Promise} 删除结果
 */
export function deleteSchedule(scheduleId) {
  return request({
    url: `/admin/tour/schedule/${scheduleId}`,
    method: 'delete'
  });
}

/**
 * 更新导游备注
 * @param {number} scheduleId 行程排序ID
 * @param {string} guideRemarks 导游备注
 * @returns {Promise} 更新结果
 */
export function updateGuideRemarks(scheduleId, guideRemarks) {
  return request({
    url: `/admin/tour/schedule/${scheduleId}/guide-remarks`,
    method: 'put',
    data: guideRemarks,
    headers: {
      'Content-Type': 'text/plain'
    }
  });
}

/**
 * 根据订单ID获取乘客信息
 * @param {number} bookingId 订单ID
 * @returns {Promise} 乘客信息列表
 */
export function getPassengersByBookingId(bookingId) {
  return request({
    url: `/admin/passengers/booking/${bookingId}`,
    method: 'get'
  });
}

/**
 * 根据酒店名称和日期统计住在该酒店的所有客人
 * @param {string} hotelName 酒店名称
 * @param {string} tourDate 旅游日期 (YYYY-MM-DD格式)
 * @returns {Promise} 酒店客人统计信息
 */
export function getHotelCustomerStatistics(hotelName, tourDate) {
  return request({
    url: '/admin/tour/schedule/hotel-statistics',
    method: 'get',
    params: { hotelName, tourDate }
  });
}

