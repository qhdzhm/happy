import request from '@/utils/request';

// 客服管理相关API
export const customerServiceApi = {
  // 获取客服列表
  getServiceList: (params) => {
    return request({
      url: '/admin/customer-service/list',
      method: 'GET',
      params
    });
  },

  // 获取统计数据
  getStatistics: () => {
    return request({
      url: '/admin/customer-service/statistics',
      method: 'GET'
    });
  },

  // 创建客服
  createService: (data) => {
    return request({
      url: '/admin/customer-service',
      method: 'POST',
      data
    });
  },

  // 更新客服信息
  updateService: (id, data) => {
    return request({
      url: `/admin/customer-service/${id}`,
      method: 'PUT',
      data
    });
  },

  // 更新在线状态
  updateOnlineStatus: (id, status) => {
    return request({
      url: `/admin/customer-service/${id}/online-status`,
      method: 'PUT',
      data: { onlineStatus: status }
    });
  },

  // 获取客服详情
  getServiceDetail: (id) => {
    return request({
      url: `/admin/customer-service/${id}`,
      method: 'GET'
    });
  },

  // 删除客服（禁用）
  disableService: (id) => {
    return request({
      url: `/admin/customer-service/${id}/disable`,
      method: 'PUT'
    });
  },

  // 客服登录
  serviceLogin: (data) => {
    return request({
      url: '/admin/customer-service/login',
      method: 'POST',
      data
    });
  },

  // 客服登出
  serviceLogout: () => {
    return request({
      url: '/admin/customer-service/logout',
      method: 'POST'
    });
  }
};

// 客服会话管理相关API
export const serviceSessionApi = {
  // 获取会话列表
  getSessionList: (params) => {
    return request({
      url: '/admin/service-sessions',
      method: 'GET',
      params
    });
  },

  // 获取客服的活跃会话
  getActiveSessionsByService: (serviceId) => {
    return request({
      url: `/admin/service-sessions/service/${serviceId}/active`,
      method: 'GET'
    });
  },

  // 强制结束会话
  endSession: (sessionId, data) => {
    return request({
      url: `/admin/service-sessions/${sessionId}/end`,
      method: 'PUT',
      data
    });
  },

  // 分配会话给客服
  assignSession: (sessionId, serviceId) => {
    return request({
      url: `/admin/service-sessions/${sessionId}/assign`,
      method: 'PUT',
      data: { serviceId }
    });
  },

  // 获取会话详情
  getSessionDetail: (sessionId) => {
    return request({
      url: `/admin/service-sessions/${sessionId}`,
      method: 'GET'
    });
  },

  // 获取会话消息
  getSessionMessages: (sessionId, params) => {
    return request({
      url: `/admin/service-sessions/${sessionId}/messages`,
      method: 'GET',
      params
    });
  },

  // 发送消息
  sendMessage: (data) => {
    return request({
      url: '/admin/service-sessions/message/send',
      method: 'POST',
      data
    });
  },

  // 接受会话
  acceptSession: (sessionId) => {
    return request({
      url: `/admin/service-sessions/${sessionId}/accept`,
      method: 'PUT'
    });
  },

  // 标记消息已读
  markMessagesRead: (sessionId) => {
    return request({
      url: `/admin/service-sessions/${sessionId}/read`,
      method: 'PUT'
    });
  },

  // 获取等待队列
  getWaitingQueue: () => {
    return request({
      url: '/admin/service-sessions/waiting-queue',
      method: 'GET'
    });
  },

  // 获取客服工作台数据
  getWorkbenchData: (serviceId) => {
    return request({
      url: `/admin/service-sessions/workbench/${serviceId}`,
      method: 'GET'
    });
  },

  // 获取会话统计数据
  getStatistics: () => {
    return request({
      url: '/admin/service-sessions/statistics',
      method: 'GET'
    });
  }
};

export default {
  customerServiceApi,
  serviceSessionApi
}; 