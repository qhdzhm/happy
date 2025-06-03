import request from '@/utils/request'

// 获取预订订单列表
export const getBookingList = (params) => {
  return request({
    url: '/admin/orders/list',
    method: 'get',
    params
  });
}

// 根据ID获取预订详情
export const getBookingById = (id) => {
  return request({
    url: `/admin/orders/${id}`,
    method: 'get'
  })
}

// 修改预订状态
export const updateBookingStatus = (id, status) => {
  return request({
    url: `/admin/orders/${id}/status`,
    method: 'put',
    data: { status }
  })
}

// 修改支付状态
export const updatePaymentStatus = (id, paymentStatus) => {
  return request({
    url: `/admin/orders/${id}/status`,
    method: 'put',
    data: { paymentStatus }
  })
}

// 添加支付记录
export const addPaymentRecord = (data) => {
  return request({
    url: '/admin/orders/payment',
    method: 'post',
    data
  })
}

// 取消预订
export const cancelBooking = (id, reason) => {
  return request({
    url: `/admin/orders/${id}/cancel`,
    method: 'put',
    data: { remark: reason }
  })
}

// 获取今日预订统计
export const getTodayBookingStatistics = () => {
  return request({
    url: '/admin/orders/statistics/today',
    method: 'get'
  })
}

// 获取预订统计（按日期范围）
export const getBookingStatisticsByDate = (begin, end) => {
  return request({
    url: '/admin/orders/statistics',
    method: 'get',
    params: { startDate: begin, endDate: end }
  })
} 