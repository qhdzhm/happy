import request from '../utils/request';

// 获取可用导游列表
export const getAvailableGuides = (date, startTime, endTime, location) => {
  return request({
    url: '/admin/guide-assignment/available-guides',
    method: 'get',
    params: {
      date,
      startTime,
      endTime,
      location
    }
  });
};

// 获取可用车辆列表
export const getAvailableVehicles = (date, startTime, endTime, peopleCount) => {
  return request({
    url: '/admin/guide-assignment/available-vehicles',
    method: 'get',
    params: {
      date,
      startTime,
      endTime,
      peopleCount
    }
  });
};

// 自动分配导游和车辆
export const autoAssignGuideVehicle = (data) => {
  return request({
    url: '/admin/guide-assignment/auto-assign',
    method: 'post',
    data
  });
};

// 手动分配导游和车辆
export const manualAssignGuideVehicle = (data) => {
  return request({
    url: '/admin/guide-assignment/manual-assign',
    method: 'post',
    data
  });
};

// 分页查询导游分配记录
export const getGuideAssignmentPage = (params) => {
  return request({
    url: '/admin/guide-assignment/page',
    method: 'get',
    params
  });
};

// 根据ID获取分配详情
export const getGuideAssignmentById = (id) => {
  return request({
    url: `/admin/guide-assignment/${id}`,
    method: 'get'
  });
};

// 根据日期获取分配列表
export const getGuideAssignmentByDate = (date) => {
  return request({
    url: '/admin/guide-assignment/by-date',
    method: 'get',
    params: { date }
  });
};

// 更新分配信息
export const updateGuideAssignment = (id, data) => {
  return request({
    url: `/admin/guide-assignment/${id}`,
    method: 'put',
    data
  });
};

// 检查指定日期和地点的分配状态
export const checkAssignmentStatus = (date, location) => {
  return request({
    url: '/admin/guide-assignment/status',
    method: 'get',
    params: {
      date,
      location
    }
  });
};

// 根据日期和地点获取分配详情（包含分配ID）
export const getAssignmentByDateAndLocation = (date, location) => {
  return request({
    url: '/admin/guide-assignment/by-date-location',
    method: 'get',
    params: {
      date,
      location
    }
  });
};

// 取消分配
export const cancelAssignment = (assignmentId, reason) => {
  return request({
    url: `/admin/guide-assignment/${assignmentId}`,
    method: 'delete',
    params: { reason }
  });
};

// 批量分配
export const batchAssignGuideVehicle = (data) => {
  return request({
    url: '/admin/guide-assignment/batch-assign',
    method: 'post',
    data
  });
};

// 更新分配
export const updateGuideVehicleAssignment = (assignmentId, data) => {
  return request({
    url: `/admin/guide-assignment/${assignmentId}`,
    method: 'put',
    data
  });
}; 