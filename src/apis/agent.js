import request from '@/utils/request'

// 代理商列表
export const getAgentList = (params) => {
  return request({
    url: '/admin/agent/page',
    method: 'get',
    params
  })
}

// 创建代理商
export const createAgent = (data) => {
  return request({
    url: '/admin/agent',
    method: 'post',
    data
  })
}

// 修改代理商
export const updateAgent = (data) => {
  return request({
    url: '/admin/agent',
    method: 'put',
    data
  })
}

// 删除代理商
export const deleteAgent = (id) => {
  return request({
    url: `/admin/agent/${id}`,
    method: 'delete'
  })
}

// 启用/禁用代理商账号
export const enableOrDisableAgent = (status, id) => {
  return request({
    url: `/admin/agent/status/${status}`,
    method: 'post',
    data: { id }
  })
}

// 根据ID获取代理商详情
export const getAgentById = (id) => {
  return request({
    url: `/admin/agent/${id}`,
    method: 'get'
  })
}

// 更新代理商折扣率
export const updateAgentDiscountRate = (id, discountRate) => {
  return request({
    url: `/admin/agent`,
    method: 'put',
    data: { id, discountRate }
  })
}

// 重置代理商密码
export const resetAgentPassword = (id, password) => {
  return request({
    url: `/admin/agent/resetPassword`,
    method: 'put',
    data: { id, password }
  })
}

// 更新代理商折扣等级
export const updateAgentDiscountLevel = (agentId, discountLevelId) => {
  return request({
    url: `/admin/agent/${agentId}/discount-level/${discountLevelId}`,
    method: 'put'
  })
} 