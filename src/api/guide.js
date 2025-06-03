import request from "@/utils/request";

/**
 * 通过员工ID获取导游信息
 * @param {number} employeeId 员工ID
 * @returns {Promise} 导游信息
 */
export const getGuideByEmployeeId = (employeeId) => {
  return request({
    url: `/admin/guides/by-employee/${employeeId}`,
    method: 'GET'
  });
};

/**
 * 修复导游和员工的关联关系
 * @returns {Promise} 修复结果
 */
export const fixEmployeeRelation = () => {
  return request({
    url: '/admin/guides/fix-employee-relation',
    method: 'POST'
  });
};

/**
 * 同步导游表数据到员工表
 * @returns {Promise} 同步结果
 */
export const syncGuidesToEmployees = () => {
  return request({
    url: '/admin/guides/sync-to-employees',
    method: 'POST'
  });
};

/**
 * 获取所有导游列表
 * @param {Object} params 查询参数
 * @returns {Promise} 导游列表
 */
export const getGuideList = (params) => {
  return request({
    url: '/admin/guides',
    method: 'GET',
    params
  });
};

/**
 * 根据ID获取导游信息
 * @param {number} guideId 导游ID
 * @returns {Promise} 导游信息
 */
export const getGuideById = (guideId) => {
  return request({
    url: `/admin/guides/${guideId}`,
    method: 'GET'
  });
};

/**
 * 创建导游
 * @param {Object} data 导游数据
 * @returns {Promise} 创建结果
 */
export const createGuide = (data) => {
  return request({
    url: '/admin/guides',
    method: 'POST',
    data
  });
};

/**
 * 更新导游信息
 * @param {number} guideId 导游ID
 * @param {Object} data 导游数据
 * @returns {Promise} 更新结果
 */
export const updateGuide = (guideId, data) => {
  return request({
    url: `/admin/guides/${guideId}`,
    method: 'PUT',
    data
  });
};

/**
 * 删除导游
 * @param {number} guideId 导游ID
 * @returns {Promise} 删除结果
 */
export const deleteGuide = (guideId) => {
  return request({
    url: `/admin/guides/${guideId}`,
    method: 'DELETE'
  });
}; 