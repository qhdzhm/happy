import request from '@/utils/request'

// 用户列表
export const getUserList = (params) => {
  return request({
    url: '/admin/employee/page',
    method: 'get',
    params
  })
}

// 创建用户
export const createUser = (data) => {
  return request({
    url: '/admin/employee',
    method: 'post',
    data
  })
}

// 修改用户
export const updateUser = (data) => {
  return request({
    url: '/admin/employee',
    method: 'put',
    data
  })
}

// 删除用户
export const deleteUser = (id) => {
  return request({
    url: `/admin/employee/${id}`,
    method: 'delete'
  })
}

// 启用/禁用用户账号
export const enableOrDisableUser = (status, id) => {
  return request({
    url: `/admin/employee/status/${id}`,
    method: 'put',
    params: { status }
  })
}

// 根据ID获取用户详情
export const getUserById = (id) => {
  return request({
    url: `/admin/employee/${id}`,
    method: 'get'
  })
}
