import request from '@/utils/request'

// 获取预订订单列表
export const getBookingList = (params) => {
  return request({
    url: '/admin/booking/page',
    method: 'get',
    params
  })
}

// 根据ID获取预订详情
export const getBookingById = (id) => {
  return request({
    url: `/admin/booking/${id}`,
    method: 'get'
  })
}

// 修改预订状态
export const updateBookingStatus = (id, status) => {
  return request({
    url: '/admin/booking/status',
    method: 'put',
    data: { id, status }
  })
}

// 修改支付状态
export const updatePaymentStatus = (id, paymentStatus) => {
  return request({
    url: '/admin/booking/payment',
    method: 'put',
    data: { id, paymentStatus }
  })
}

// 添加支付记录
export const addPaymentRecord = (data) => {
  return request({
    url: '/admin/booking/payment',
    method: 'post',
    data
  })
}

// 取消预订
export const cancelBooking = (id, reason) => {
  return request({
    url: '/admin/booking/cancel',
    method: 'put',
    data: { id, reason }
  })
}

// 获取今日预订统计
export const getTodayBookingStatistics = () => {
  return request({
    url: '/admin/booking/statistics/today',
    method: 'get'
  })
}

// 获取预订统计（按日期范围）
export const getBookingStatisticsByDate = (begin, end) => {
  return request({
    url: '/admin/booking/statistics',
    method: 'get',
    params: { begin, end }
  })
} 