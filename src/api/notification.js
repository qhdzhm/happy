import request from '@/utils/request';

// 通知相关API
export const notificationApi = {
  // 获取未读通知数量
  getUnreadCount: () => {
    return request({
      url: '/admin/notifications/unread-count',
      method: 'GET'
    });
  },

  // 获取通知列表
  getNotifications: (limit = 20) => {
    return request({
      url: '/admin/notifications/list',
      method: 'GET',
      params: { limit }
    });
  },

  // 标记通知为已读
  markAsRead: (id) => {
    return request({
      url: `/admin/notifications/${id}/read`,
      method: 'PUT'
    });
  },

  // 标记所有通知为已读
  markAllAsRead: () => {
    return request({
      url: '/admin/notifications/read-all',
      method: 'PUT'
    });
  },

  // 测试创建通知
  createTestNotification: () => {
    return request({
      url: '/admin/notifications/test',
      method: 'POST'
    });
  }
}; 