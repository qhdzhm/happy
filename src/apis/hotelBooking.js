import request from '@/utils/request'

// 更新预订状态
export const updateHotelBookingStatus = (id, status) => {
  return request({
    url: `/admin/hotel-bookings/${id}/status`,
    method: 'PUT',
    data: { status }
  })
}

// 发送邮件
export const sendHotelBookingEmail = (data) => {
  return request({
    url: '/admin/hotel-bookings/send-email',
    method: 'POST',
    data
  })
} 