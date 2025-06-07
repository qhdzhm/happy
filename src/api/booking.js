import request from '../utils/request';

// 根据ID获取旅游订单详情
export const getTourBookingById = (bookingId) => {
  return request({
    url: `/admin/bookings/${bookingId}`,
    method: 'get'
  });
};

// 根据订单号获取旅游订单详情
export const getTourBookingByOrderNumber = (orderNumber) => {
  return request({
    url: `/admin/bookings/order-number/${orderNumber}`,
    method: 'get'
  });
};

// 批量获取多个订单详情
export const getBatchTourBookings = (bookingIds) => {
  return request({
    url: '/admin/bookings/batch',
    method: 'post',
    data: { bookingIds }
  });
};

// 获取订单的真实行程安排
export const getTourScheduleByBookingId = (bookingId) => {
  return request({
    url: `/admin/bookings/${bookingId}/schedule`,
    method: 'get'
  });
};

// 获取订单的乘客信息
export const getPassengersByBookingId = (bookingId) => {
  return request({
    url: `/admin/bookings/${bookingId}/passengers`,
    method: 'get'
  });
};

// 根据分配ID获取相关的所有订单详情
export const getBookingsByAssignmentId = (assignmentId) => {
  return request({
    url: `/admin/bookings/by-assignment/${assignmentId}`,
    method: 'get'
  });
};

// 根据日期和地点获取真实的行程安排
export const getTourScheduleByDateAndLocation = (date, location) => {
  return request({
    url: '/admin/tour-schedule/by-date-location',
    method: 'get',
    params: {
      date,
      location
    }
  });
};

// 根据订单号获取完整的行程安排
export const getTourScheduleByOrderNumber = (orderNumber) => {
  return request({
    url: `/admin/tour-schedule/by-order/${orderNumber}`,
    method: 'get'
  });
}; 