import request from '@/utils/request';

// 获取车辆可用性列表
export const getVehicleAvailability = (params) => {
  return request({
    url: '/admin/vehicle-availability',
    method: 'GET',
    params
  });
};

// 设置车辆可用性
export const setVehicleAvailability = (data) => {
  return request({
    url: '/admin/vehicle-availability',
    method: 'POST',
    data
  });
};

// 批量设置车辆可用性
export const batchSetVehicleAvailability = (data) => {
  return request({
    url: '/admin/vehicle-availability/batch',
    method: 'POST',
    data
  });
};

// 删除车辆可用性设置
export const deleteVehicleAvailability = (params) => {
  return request({
    url: '/admin/vehicle-availability',
    method: 'DELETE',
    params
  });
};

// 获取车辆可用性统计
export const getVehicleAvailabilityStats = (params) => {
  return request({
    url: '/admin/vehicle-availability/stats',
    method: 'GET',
    params
  });
}; 