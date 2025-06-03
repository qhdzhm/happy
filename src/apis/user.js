import request from '@/utils/request'

// 分页查询普通用户列表
export const getUserList = (params) => {
  return request({
    url: '/admin/users/page',
    method: 'get',
    params
  })
}

// 创建普通用户
export const createUser = (data) => {
  return request({
    url: '/admin/users',
    method: 'post',
    data
  })
}

// 修改普通用户信息
export const updateUser = (data) => {
  return request({
    url: '/admin/users',
    method: 'put',
    data
  })
}

// 删除普通用户
export const deleteUser = (id) => {
  return request({
    url: `/admin/users/${id}`,
    method: 'delete'
  })
}

// 启用/禁用普通用户账号
export const updateUserStatus = (data) => {
  return request({
    url: '/admin/users/status',
    method: 'put',
    data
  })
}

// 根据ID获取普通用户详情
export const getUserById = (id) => {
  return request({
    url: `/admin/users/${id}`,
    method: 'get'
  })
}

// 重置普通用户密码
export const resetUserPassword = (data) => {
  return request({
    url: '/admin/users/password',
    method: 'put',
    data
  })
}
