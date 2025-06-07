import request from "@/utils/request";

/**
 * 旅游团导游车辆分配管理API
 */

/**
 * 创建分配记录
 * @param {Object} data 分配数据
 * @returns {Promise} 创建结果
 */
export const createAssignment = (data) => {
  return request({
    url: '/admin/tour-assignments',
    method: 'POST',
    data
  });
};

/**
 * 批量创建分配记录
 * @param {Array} data 分配数据列表
 * @returns {Promise} 批量创建结果
 */
export const batchCreateAssignment = (data) => {
  return request({
    url: '/admin/tour-assignments/batch',
    method: 'POST',
    data
  });
};

/**
 * 根据ID查询分配记录
 * @param {number} id 分配ID
 * @returns {Promise} 分配记录
 */
export const getAssignmentById = (id) => {
  return request({
    url: `/admin/tour-assignments/${id}`,
    method: 'GET'
  });
};

/**
 * 根据日期查询分配记录
 * @param {string} date 日期 (YYYY-MM-DD格式)
 * @returns {Promise} 分配记录列表
 */
export const getAssignmentsByDate = (date) => {
  return request({
    url: `/admin/tour-assignments/date/${date}`,
    method: 'GET'
  });
};

/**
 * 根据日期范围查询分配记录
 * @param {string} startDate 开始日期
 * @param {string} endDate 结束日期
 * @returns {Promise} 分配记录列表
 */
export const getAssignmentsByDateRange = (startDate, endDate) => {
  return request({
    url: '/admin/tour-assignments/date-range',
    method: 'GET',
    params: { startDate, endDate }
  });
};

/**
 * 根据目的地查询分配记录
 * @param {string} destination 目的地
 * @param {string} date 日期(可选)
 * @returns {Promise} 分配记录列表
 */
export const getAssignmentsByDestination = (destination, date) => {
  return request({
    url: `/admin/tour-assignments/destination/${destination}`,
    method: 'GET',
    params: date ? { date } : {}
  });
};

/**
 * 根据导游ID查询分配记录
 * @param {number} guideId 导游ID
 * @param {string} date 日期(可选)
 * @returns {Promise} 分配记录列表
 */
export const getAssignmentsByGuideId = (guideId, date) => {
  return request({
    url: `/admin/tour-assignments/guide/${guideId}`,
    method: 'GET',
    params: date ? { date } : {}
  });
};

/**
 * 根据车辆ID查询分配记录
 * @param {number} vehicleId 车辆ID
 * @param {string} date 日期(可选)
 * @returns {Promise} 分配记录列表
 */
export const getAssignmentsByVehicleId = (vehicleId, date) => {
  return request({
    url: `/admin/tour-assignments/vehicle/${vehicleId}`,
    method: 'GET',
    params: date ? { date } : {}
  });
};

/**
 * 分页查询分配记录
 * @param {Object} params 查询参数
 * @returns {Promise} 分页结果
 */
export const getAssignmentsPage = (params) => {
  return request({
    url: '/admin/tour-assignments/page',
    method: 'GET',
    params
  });
};

/**
 * 更新分配记录
 * @param {number} id 分配ID
 * @param {Object} data 分配数据
 * @returns {Promise} 更新结果
 */
export const updateAssignment = (id, data) => {
  return request({
    url: `/admin/tour-assignments/${id}`,
    method: 'PUT',
    data
  });
};

/**
 * 取消分配记录
 * @param {number} id 分配ID
 * @returns {Promise} 取消结果
 */
export const cancelAssignment = (id) => {
  return request({
    url: `/admin/tour-assignments/${id}/cancel`,
    method: 'PUT'
  });
};

/**
 * 删除分配记录
 * @param {number} id 分配ID
 * @returns {Promise} 删除结果
 */
export const deleteAssignment = (id) => {
  return request({
    url: `/admin/tour-assignments/${id}`,
    method: 'DELETE'
  });
};

/**
 * 根据订单ID列表查询分配记录
 * @param {Array} bookingIds 订单ID列表
 * @returns {Promise} 分配记录列表
 */
export const getAssignmentsByBookingIds = (bookingIds) => {
  return request({
    url: '/admin/tour-assignments/booking-ids',
    method: 'POST',
    data: bookingIds
  });
};

/**
 * 统计指定日期的分配数量
 * @param {string} date 日期
 * @returns {Promise} 分配数量
 */
export const getAssignmentCount = (date) => {
  return request({
    url: `/admin/tour-assignments/count/${date}`,
    method: 'GET'
  });
};

/**
 * 检查导游在指定日期是否已有分配
 * @param {number} guideId 导游ID
 * @param {string} date 日期
 * @returns {Promise} 是否已分配
 */
export const checkGuideAssigned = (guideId, date) => {
  return request({
    url: `/admin/tour-assignments/check/guide/${guideId}/${date}`,
    method: 'GET'
  });
};

/**
 * 检查车辆在指定日期是否已有分配
 * @param {number} vehicleId 车辆ID
 * @param {string} date 日期
 * @returns {Promise} 是否已分配
 */
export const checkVehicleAssigned = (vehicleId, date) => {
  return request({
    url: `/admin/tour-assignments/check/vehicle/${vehicleId}/${date}`,
    method: 'GET'
  });
};

/**
 * 获取指定日期的分配统计信息
 * @param {string} date 日期
 * @returns {Promise} 统计信息
 */
export const getAssignmentStatistics = (date) => {
  return request({
    url: `/admin/tour-assignments/statistics/${date}`,
    method: 'GET'
  });
};

/**
 * 获取今日分配概览
 * @returns {Promise} 今日分配列表
 */
export const getTodayAssignments = () => {
  return request({
    url: '/admin/tour-assignments/today',
    method: 'GET'
  });
};

/**
 * 获取本周分配概览
 * @returns {Promise} 本周分配列表
 */
export const getThisWeekAssignments = () => {
  return request({
    url: '/admin/tour-assignments/this-week',
    method: 'GET'
  });
};

/**
 * 导出分配记录
 * @param {Object} params 导出参数
 * @returns {Promise} 导出数据
 */
export const exportAssignments = (params) => {
  return request({
    url: '/admin/tour-assignments/export',
    method: 'GET',
    params
  });
}; 