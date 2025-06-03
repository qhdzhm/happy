import request from '../utils/request';

// 员工-导游管理API

/**
 * 分页查询员工-导游信息
 */
export const getEmployeeGuideList = (params) => {
  return request({
    url: '/admin/employee-guide/page',
    method: 'get',
    params
  });
};

/**
 * 将员工设置为导游
 */
export const setEmployeeAsGuide = (data) => {
  return request({
    url: '/admin/employee-guide/set-guide',
    method: 'post',
    data
  });
};

/**
 * 取消员工的导游身份
 */
export const removeGuideRole = (employeeId) => {
  return request({
    url: `/admin/employee-guide/remove-guide/${employeeId}`,
    method: 'delete'
  });
};

/**
 * 更新导游信息
 */
export const updateGuideInfo = (data) => {
  return request({
    url: '/admin/employee-guide/update-guide',
    method: 'put',
    data
  });
};

/**
 * 根据员工ID获取导游信息
 */
export const getGuideByEmployeeId = (employeeId) => {
  return request({
    url: `/admin/employee-guide/guide/${employeeId}`,
    method: 'get'
  });
};

/**
 * 获取所有导游员工列表
 */
export const getAllGuideEmployees = () => {
  return request({
    url: '/admin/employee-guide/guides',
    method: 'get'
  });
};

/**
 * 批量设置导游可用性
 */
export const batchSetGuideAvailability = (params) => {
  return request({
    url: '/admin/employee-guide/availability/batch',
    method: 'post',
    params
  });
};

/**
 * 获取导游可用性统计
 */
export const getGuideAvailabilityStats = (date) => {
  return request({
    url: '/admin/employee-guide/availability/stats',
    method: 'get',
    params: { date }
  });
}; 