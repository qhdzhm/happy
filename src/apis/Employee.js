import request from "@/utils/request";

/**
 * 登录
 * @param {*} data 
 * @returns 
 */
export const login = (data) => {
  return request({
    'url': '/admin/employee/login',
    'method': 'post',
    data
  });
};

/**
 * 退出
 * @returns 
 */
export const logout = () => {
  return request({
    'url': '/admin/employee/logout',
    'method': 'post'
  });
};

/**
 * 修改密码
 * @param {*} data 
 * @returns 
 */
export const editPassword = (data) => {
  return request({
    'url': '/admin/employee/editPassword',
    'method': 'put',
    data
  });
};

/**
 * 获取员工列表
 */
export const getEmpList = (params) => {
  console.log("发送获取员工列表请求，参数:", params);
  return request({
    url: "/admin/employee/page",
    method: "get",
    params,
  }).then(response => {
    console.log("员工列表API原始响应:", response);
    return response;
  }).catch(error => {
    console.error("员工列表API错误:", error);
    throw error;
  });
};

/**
 * 员工启用禁用
 * @param {*} data 
 * @returns 
 */
export const enableOrDisableEmp = (params) => {
  return request({
    'url': `/admin/employee/status/${params.id}`,
    'method': 'put',
    params: {
      status: params.status
    }
  });
};

/**
 * 新增员工
 */
export const addEmp = (data) => {
  return request({
    url: "/admin/employee",
    method: "post",
    data,
  });
};

/**
 * 根据ID查询员工
 */
export const getEmpById = (id) => {
  return request({
    url: `/admin/employee/${id}`,
    method: "get",
  });
};

/**
 * 更新员工信息
 */
export const updateEmp = (data) => {
  return request({
    url: "/admin/employee",
    method: "put",
    data,
  });
};

/**
 * 为员工分配车辆
 * @param {*} data 包含员工ID和车牌号
 * @returns Promise
 */
export const assignVehicleToEmployee = (data) => {
  return request({
    'url': '/admin/vehicleDriver/assign',
    'method': 'post',
    data
  });
};

/**
 * 移除员工分配的车辆
 * @param {*} data 包含employeeId和vehicleId的对象
 * @returns Promise
 */
export const removeVehicleFromEmployee = (data) => {
  return request({
    'url': `/admin/vehicleDriver/unassign`,
    'method': 'post',
    data
  });
};

/**
 * 获取员工列表（分页）
 * @param {Object} params - 分页和筛选参数
 * @returns {Promise} - 返回员工分页数据
 */
export const getEmployeesByPage = (params) => {
  return request({
    url: "/admin/employee/page",
    method: "get",
    params, // 查询参数，包括分页和筛选条件
  });
};

/**
 * 删除员工
 * @param {Number} id - 员工ID
 * @returns {Promise} - 返回操作结果
 */
export const deleteEmployee = (id) => {
  return request({
    url: `/admin/employee/${id}`,
    method: "delete",
  });
};

/**
 * 为员工分配车辆
 * @param {Object} data - 包含员工ID、车辆ID和是否为主驾驶
 * @returns {Promise} - 返回操作结果
 */
export const allocateVehicle = (data) => {
  return request({
    url: "/admin/employee/assignVehicleDriver",
    method: "post",
    data,
  });
};

/**
 * 取消员工的车辆分配
 * @param {Number} employeeId - 员工ID
 * @returns {Promise} - 返回操作结果
 */
export const deallocateVehicle = (employeeId) => {
  return request({
    url: `/admin/employee/removeVehicleDriver/${employeeId}`,
    method: "post",
  });
};

/**
 * 获取员工分配的车辆
 * @param {Number} employeeId - 员工ID
 * @returns {Promise} - 返回员工分配的车辆
 */
export const getEmployeeAssignedVehicle = (employeeId) => {
  return request({
    url: `/admin/vehicleDriver/vehicles/${employeeId}`,
    method: "get",
  });
};