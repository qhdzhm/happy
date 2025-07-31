import request from '../utils/request';

// 员工相关API

/**
 * 更新当前管理员的个人信息
 * @param {Object} profileData - 个人信息数据
 * @returns {Promise}
 */
export const updateAdminProfile = (profileData) => {
  return request({
    url: '/admin/employee/profile',
    method: 'put',
    data: profileData
  });
};

/**
 * 获取当前管理员信息
 * @returns {Promise}
 */
export const getCurrentAdminInfo = () => {
  return request({
    url: '/admin/employee/current',
    method: 'get'
  });
};

/**
 * 修改管理员密码
 * @param {Object} passwordData - 密码数据
 * @returns {Promise}
 */
export const changeAdminPassword = (passwordData) => {
  return request({
    url: '/admin/employee/password',
    method: 'put',
    data: passwordData
  });
};