import request from '@/utils/request'

// ===================== 折扣等级管理 =====================

// 获取所有折扣等级
export const getAllDiscountLevels = () => {
  return request({
    url: '/admin/discount/levels',
    method: 'get'
  })
}

// 获取活跃的折扣等级
export const getActiveDiscountLevels = () => {
  return request({
    url: '/admin/discount/levels/active',
    method: 'get'
  })
}

// 根据ID获取折扣等级
export const getDiscountLevelById = (id) => {
  return request({
    url: `/admin/discount/levels/${id}`,
    method: 'get'
  })
}

// 创建折扣等级
export const createDiscountLevel = (data) => {
  return request({
    url: '/admin/discount/levels',
    method: 'post',
    data
  })
}

// 更新折扣等级
export const updateDiscountLevel = (data) => {
  return request({
    url: '/admin/discount/levels',
    method: 'put',
    data
  })
}

// 删除折扣等级
export const deleteDiscountLevel = (id) => {
  return request({
    url: `/admin/discount/levels/${id}`,
    method: 'delete'
  })
}

// ===================== 产品折扣配置管理 =====================

// 获取产品的所有折扣配置
export const getProductDiscountConfigs = (productType, productId) => {
  return request({
    url: '/admin/discount/products',
    method: 'get',
    params: { productType, productId }
  })
}

// 根据等级ID获取所有折扣配置
export const getDiscountConfigsByLevel = (levelId) => {
  return request({
    url: `/admin/discount/levels/${levelId}/products`,
    method: 'get'
  })
}

// 创建产品折扣配置
export const createProductDiscount = (data) => {
  return request({
    url: '/admin/discount/products',
    method: 'post',
    data
  })
}

// 更新产品折扣配置
export const updateProductDiscount = (data) => {
  return request({
    url: '/admin/discount/products',
    method: 'put',
    data
  })
}

// 删除产品折扣配置
export const deleteProductDiscount = (id) => {
  return request({
    url: `/admin/discount/products/${id}`,
    method: 'delete'
  })
}

// 批量更新某个等级的产品折扣率
export const batchUpdateDiscountRate = (levelId, productType, discountRate) => {
  return request({
    url: `/admin/discount/levels/${levelId}/batch-update`,
    method: 'put',
    params: { productType, discountRate }
  })
}

// 批量创建产品折扣配置
export const batchCreateProductDiscounts = (data) => {
  return request({
    url: '/admin/discount/products/batch',
    method: 'post',
    data
  })
}

// ===================== 折扣统计和日志 =====================

// 查询代理商的折扣使用记录
export const getAgentDiscountLogs = (agentId, startTime, endTime) => {
  return request({
    url: `/admin/discount/stats/agent/${agentId}`,
    method: 'get',
    params: { startTime, endTime }
  })
}

// 查询产品的折扣使用统计
export const getProductDiscountStats = (productType, productId, startTime, endTime) => {
  return request({
    url: '/admin/discount/stats/product',
    method: 'get',
    params: { productType, productId, startTime, endTime }
  })
}

// 查询折扣使用总体统计
export const getDiscountStats = (startTime, endTime) => {
  return request({
    url: '/admin/discount/stats',
    method: 'get',
    params: { startTime, endTime }
  })
}

// ===================== 辅助API =====================

// 获取一日游列表（用于选择产品）
export const getDayTourList = () => {
  return request({
    url: '/admin/daytour/page',
    method: 'get',
    params: {
      page: 1,
      pageSize: 1000 // 获取大量数据用于下拉选择
    }
  })
}

// 获取跟团游列表（用于选择产品）
export const getGroupTourList = () => {
  return request({
    url: '/admin/grouptour/page',
    method: 'get',
    params: {
      page: 1,
      pageSize: 1000 // 获取大量数据用于下拉选择
    }
  })
} 