import request from '../utils/request';

/**
 * 订单管理相关接口
 */

/**
 * 分页查询订单
 * @param {Object} params 查询参数
 * @returns {Promise}
 */
export function getOrderList(params) {
  return request({
    url: '/admin/orders/list',
    method: 'get',
    params
  });
}

/**
 * 按用户类型和ID查询订单
 * @param {string} userType 用户类型 (user-普通用户, agent-代理商)
 * @param {number} userId 用户ID
 * @param {Object} params 查询参数
 * @returns {Promise}
 */
export function getOrdersByUserType(userType, userId, params) {
  return request({
    url: `/admin/orders/user/${userType}/${userId}`,
    method: 'get',
    params
  });
}

/**
 * 根据ID查询订单详情
 * @param {number} bookingId 订单ID
 * @returns {Promise}
 */
export function getOrderById(bookingId) {
  return request({
    url: `/admin/orders/${bookingId}`,
    method: 'get'
  });
}

/**
 * 根据订单号查询订单详情
 * @param {string} orderNumber 订单号
 * @returns {Promise}
 */
export function getOrderByNumber(orderNumber) {
  return request({
    url: `/admin/orders/number/${orderNumber}`,
    method: 'get'
  });
}

/**
 * 更新订单信息
 * @param {number} bookingId 订单ID
 * @param {Object} data 订单更新数据
 * @returns {Promise}
 */
export function updateOrder(bookingId, data) {
  return request({
    url: `/admin/orders/${bookingId}`,
    method: 'put',
    data
  });
}

/**
 * 确认订单
 * @param {number} bookingId 订单ID
 * @returns {Promise}
 */
export function confirmOrder(bookingId) {
  return request({
    url: `/admin/orders/${bookingId}/confirm`,
    method: 'put'
  });
}

/**
 * 取消订单
 * @param {number} bookingId 订单ID
 * @returns {Promise}
 */
export function cancelOrder(bookingId) {
  return request({
    url: `/admin/orders/${bookingId}/cancel`,
    method: 'put'
  });
}

/**
 * 完成订单
 * @param {number} bookingId 订单ID
 * @returns {Promise}
 */
export function completeOrder(bookingId) {
  return request({
    url: `/admin/orders/${bookingId}/complete`,
    method: 'put'
  });
}

/**
 * 更新订单状态
 * @param {number} bookingId 订单ID
 * @param {Object} data 状态更新数据
 * @returns {Promise}
 */
export function updateOrderStatus(bookingId, data) {
  return request({
    url: `/admin/orders/${bookingId}/status`,
    method: 'put',
    data
  });
}

/**
 * 获取用户列表（支持名称模糊搜索）
 * @param {Object} params 查询参数，包含 name 用于模糊搜索
 * @returns {Promise}
 */
export function getUserOptions(params) {
  return request({
    url: '/admin/users/options',
    method: 'get',
    params
  });
}

/**
 * 获取代理商列表（支持名称模糊搜索）
 * @param {Object} params 查询参数，包含 name 用于模糊搜索
 * @returns {Promise}
 */
export function getAgentOptions(params) {
  return request({
    url: '/admin/agent/options',
    method: 'get',
    params
  });
}

/**
 * 获取订单的乘客信息
 * @param {number} bookingId 订单ID
 * @returns {Promise}
 */
export function getOrderPassengers(bookingId) {
  return request({
    url: `/admin/orders/${bookingId}/passengers`,
    method: 'get'
  });
}

/**
 * 更新订单的乘客信息
 * @param {number} bookingId 订单ID
 * @param {Array} passengers 乘客信息列表
 * @returns {Promise}
 */
export function updateOrderPassengers(bookingId, passengers) {
  return request({
    url: `/admin/orders/${bookingId}/passengers`,
    method: 'put',
    data: passengers
  });
}

/**
 * 删除已取消的订单
 * @param {number} bookingId 订单ID
 * @returns {Promise}
 */
export function deleteOrder(bookingId) {
  return request({
    url: `/admin/orders/${bookingId}`,
    method: 'delete'
  });
}

/**
 * 管理员确认订单（支持价格调整）
 * @param {number} bookingId 订单ID
 * @param {number} adjustedPrice 调整后的价格（可选）
 * @param {string} adjustmentReason 价格调整原因（可选）
 * @returns {Promise}
 */
export function confirmOrderByAdmin(bookingId, adjustedPrice, adjustmentReason) {
  const params = {};
  if (adjustedPrice !== undefined && adjustedPrice !== null) {
    params.adjustedPrice = adjustedPrice;
  }
  if (adjustmentReason) {
    params.adjustmentReason = adjustmentReason;
  }
  
  return request({
    url: `/admin/orders/confirm/${bookingId}`,
    method: 'put',
    params
  });
} 

/**
 * 发送确认单
 * @param {number} bookingId 订单ID
 * @returns {Promise}
 */
export function sendConfirmationEmail(bookingId) {
  return request({
    url: `/admin/orders/${bookingId}/send-confirmation`,
    method: 'post'
  });
} 