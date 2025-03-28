import request from '@/utils/request';

/**
 * 分配车辆给员工
 * @param {Object} data - 分配信息 
 * @returns 
 */
export const assignVehicleToDriver = (data) => {
  return request({
    url: '/vehicleDriver/assign',
    method: 'post',
    data
  });
};

/**
 * 取消分配车辆给员工
 * @param {Object} data - 分配信息
 * @returns 
 */
export const unassignVehicleFromDriver = (data) => {
  return request({
    url: '/vehicleDriver/unassign',
    method: 'post',
    data
  });
};

/**
 * 获取车辆的所有驾驶员
 * @param {Long} vehicleId - 车辆ID
 * @returns 
 */
export const getDriversByVehicleId = (vehicleId) => {
  return request({
    url: `/vehicleDriver/drivers/${vehicleId}`,
    method: 'get'
  });
};

/**
 * 获取员工分配的所有车辆
 * @param {Long} employeeId - 员工ID
 * @returns 
 */
export const getVehiclesByEmployeeId = (employeeId) => {
  return request({
    url: `/vehicleDriver/vehicles/${employeeId}`,
    method: 'get'
  });
}; 