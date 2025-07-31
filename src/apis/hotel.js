import request from '@/utils/request'

// 酒店预订相关API

// 分页查询酒店预订
export const getHotelBookings = (params) => {
  return request({
    url: '/admin/hotel-bookings/page',
    method: 'get',
    params
  })
}

// 根据ID获取酒店预订详情
export const getHotelBookingById = (id) => {
  return request({
    url: `/admin/hotel-bookings/${id}`,
    method: 'get'
  })
}

// 根据预订参考号获取酒店预订
export const getHotelBookingByReference = (reference) => {
  return request({
    url: `/admin/hotel-bookings/reference/${reference}`,
    method: 'get'
  })
}

// 根据排团订单ID获取酒店预订
export const getHotelBookingByScheduleOrderId = (scheduleOrderId) => {
  return request({
    url: `/admin/hotel-bookings/schedule-order/${scheduleOrderId}`,
    method: 'get'
  })
}

// 根据旅游订单ID获取所有酒店预订（多酒店支持）
export const getHotelBookingsByTourBookingId = (tourBookingId) => {
  return request({
    url: `/admin/hotel-bookings/tour-booking/${tourBookingId}`,
    method: 'get'
  })
}

// 新增酒店预订
export const addHotelBooking = (data) => {
  return request({
    url: '/admin/hotel-bookings',
    method: 'post',
    data
  })
}

// 修改酒店预订
export const updateHotelBooking = (data) => {
  return request({
    url: '/admin/hotel-bookings',
    method: 'put',
    data
  })
}

// 更新预订状态
export const updateHotelBookingStatus = (id, status) => {
  return request({
    url: `/admin/hotel-bookings/${id}/status`,
    method: 'put',
    data: { status }
  })
}

// 批量更新预订状态
export const batchUpdateHotelBookingStatus = (ids, status) => {
  return request({
    url: '/admin/hotel-bookings/status/batch',
    method: 'put',
    data: { ids, status }
  })
}

// 删除酒店预订
export const deleteHotelBooking = (id) => {
  return request({
    url: `/admin/hotel-bookings/${id}`,
    method: 'delete'
  })
}

// 批量删除酒店预订
export const batchDeleteHotelBookings = (ids) => {
  return request({
    url: '/admin/hotel-bookings/batch',
    method: 'delete',
    data: { ids }
  })
}

// 从排团订单创建酒店预订
export const createFromScheduleOrder = (scheduleOrderId, hotelId, roomTypeId) => {
  return request({
    url: `/admin/hotel-bookings/from-schedule`,
    method: 'post',
    params: { scheduleOrderId, hotelId, roomTypeId }
  })
}

// 从导游车辆分配批量创建酒店预订
export const createFromAssignments = (assignmentIds, data) => {
  return request({
    url: '/admin/hotel-bookings/from-assignments',
    method: 'post',
    data: { assignmentIds, ...data }
  })
}

// 发送酒店预订邮件
export const sendHotelBookingEmail = (data) => {
  return request({
    url: '/admin/hotel-bookings/send-email',
    method: 'post',
    data
  })
}

// 统计相关API
export const getHotelBookingStats = (params) => {
  return request({
    url: '/admin/hotel-bookings/stats',
    method: 'get',
    params
  })
}

// 酒店管理相关API

// 获取所有酒店列表
export const getHotels = (params) => {
  return request({
    url: '/admin/hotels',
    method: 'get',
    params
  })
}

// 根据ID获取酒店详情
export const getHotelById = (id) => {
  return request({
    url: `/admin/hotels/${id}`,
    method: 'get'
  })
}

// 新增酒店
export const addHotel = (data) => {
  return request({
    url: '/admin/hotels',
    method: 'post',
    data
  })
}

// 修改酒店
export const updateHotel = (data) => {
  return request({
    url: '/admin/hotels',
    method: 'put',
    data
  })
}

// 删除酒店
export const deleteHotel = (id) => {
  return request({
    url: `/admin/hotels/${id}`,
    method: 'delete'
  })
}

// 获取酒店房型列表
export const getHotelRoomTypes = (hotelId) => {
  return request({
    url: `/admin/hotels/${hotelId}/room-types`,
    method: 'get'
  })
}

// 新增酒店房型
export const addHotelRoomType = (data) => {
  return request({
    url: '/admin/hotel-room-types',
    method: 'post',
    data
  })
}

// 修改酒店房型
export const updateHotelRoomType = (data) => {
  return request({
    url: '/admin/hotel-room-types',
    method: 'put',
    data
  })
}

// 删除酒店房型
export const deleteHotelRoomType = (id) => {
  return request({
    url: `/admin/hotel-room-types/${id}`,
    method: 'delete'
  })
}

// 获取酒店供应商列表
export const getHotelSuppliers = () => {
  return request({
    url: '/admin/hotel-suppliers',
    method: 'get'
  })
}

// 新增酒店供应商
export const addHotelSupplier = (data) => {
  return request({
    url: '/admin/hotel-suppliers',
    method: 'post',
    data
  })
}

// 修改酒店供应商
export const updateHotelSupplier = (data) => {
  return request({
    url: '/admin/hotel-suppliers',
    method: 'put',
    data
  })
}

// 删除酒店供应商
export const deleteHotelSupplier = (id) => {
  return request({
    url: `/admin/hotel-suppliers/${id}`,
    method: 'delete'
  })
} 