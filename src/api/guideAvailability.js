import request from '@/utils/request';

// 获取导游可用性列表
export const getGuideAvailability = (params) => {
  return request({
    url: '/admin/guide-availability',
    method: 'GET',
    params
  });
};

// 设置导游可用性
export const setGuideAvailability = (data) => {
  return request({
    url: '/admin/guide-availability',
    method: 'POST',
    data
  });
};

// 批量设置导游可用性
export const batchSetGuideAvailability = (data) => {
  return request({
    url: '/admin/guide-availability/batch',
    method: 'POST',
    data
  });
};

// 删除导游可用性设置
export const deleteGuideAvailability = (params) => {
  return request({
    url: '/admin/guide-availability',
    method: 'DELETE',
    params
  });
};

// 获取导游可用性统计
export const getGuideAvailabilityStats = (params) => {
  return request({
    url: '/admin/guide-availability/stats',
    method: 'GET',
    params
  });
}; 