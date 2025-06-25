import request from '@/utils/request'

// 团队游列表
export const getGroupTourList = (params) => {
  return request({
    url: '/admin/grouptour/page',
    method: 'get',
    params
  })
}

// 创建团队游
export const createGroupTour = (data) => {
  return request({
    url: '/admin/grouptour',
    method: 'post',
    data
  })
}

// 修改团队游信息
export const updateGroupTour = (data) => {
  return request({
    url: '/admin/grouptour',
    method: 'put',
    data
  })
}

// 删除团队游
export const deleteGroupTour = (id) => {
  return request({
    url: `/admin/grouptour/${id}`,
    method: 'delete'
  })
}

// 根据ID获取团队游详情
export const getGroupTourById = (id) => {
  return request({
    url: `/admin/grouptour/${id}`,
    method: 'get'
  })
}

// 上传团队游图片
export const uploadGroupTourImage = (data) => {
  return request({
    url: '/admin/images/upload',
    method: 'post',
    data
  })
}

// 团队游上架/下架
export const enableOrDisableGroupTour = (status, id) => {
  return request({
    url: `/admin/grouptour/status/${status}`,
    method: 'post',
    params: { id }
  })
}

// 获取团队游可用日期和价格
export const getGroupTourAvailableDates = (tourId, params = {}) => {
  return request({
    url: `/admin/grouptour/dates/${tourId}`,
    method: 'get',
    params
  })
}

// 添加团队游可用日期和价格
export const addGroupTourAvailableDate = (data) => {
  return request({
    url: '/admin/grouptour/date',
    method: 'post',
    data
  })
}

// 删除团队游可用日期
export const deleteGroupTourAvailableDate = (dateId) => {
  return request({
    url: `/admin/grouptour/date/${dateId}`,
    method: 'delete'
  })
}

// 获取团队游行程
export const getGroupTourItinerary = (tourId) => {
  return request({
    url: `/admin/grouptour/itinerary/${tourId}`,
    method: 'get'
  })
}

// 添加团队游行程
export const addGroupTourItinerary = (data) => {
  // 注意：这个API可能需要后端支持，如果后端没有提供POST方法的行程添加接口，需要添加
  // 临时解决方案：使用HTTP请求发送数据到自定义URL
  return request({
    url: `/admin/grouptour/itinerary-add`,
    method: 'post',
    data
  })
}

// 修改团队游行程
export const updateGroupTourItinerary = (data) => {
  // 同样，如果后端没有提供相应的PUT方法，需要添加
  // 临时解决方案：使用HTTP请求发送数据到自定义URL 
  return request({
    url: `/admin/grouptour/itinerary-update`,
    method: 'post',
    data
  })
}

// 删除团队游行程
export const deleteGroupTourItinerary = (id) => {
  return request({
    url: `/admin/grouptour/itinerary/${id}`,
    method: 'delete'
  })
}

// 获取团队游主题列表
export const getGroupTourThemes = () => {
  return request({
    url: '/admin/grouptour/themes',
    method: 'get'
  })
}

// 获取团队游适合人群列表
export const getGroupTourSuitables = () => {
  return request({
    url: '/admin/grouptour/suitables',
    method: 'get'
  })
}

/**
 * 获取团队游关联的一日游
 * @param {Number} id - 团队游ID
 * @returns {Promise} - 返回API响应
 */
export function getGroupTourDayTours(id) {
  return request({
    url: `/admin/grouptour/day-tours/${id}`,
    method: 'get'
  })
}

/**
 * 保存团队游关联的一日游
 * @param {Object} data - 包含groupTourId和dayTours的对象
 * @param {Number} data.groupTourId - 团队游ID
 * @param {Array} data.dayTours - 一日游列表
 * @returns {Promise} - 返回API响应
 */
export function saveGroupTourDayTours(data) {
  return request({
    url: `/admin/grouptour/day-tours/${data.groupTourId}`,
    method: 'post',
    data: data.dayTours
  })
}

/**
 * 获取所有可用的一日游
 * @returns {Promise} - 返回API响应
 */
export function getAvailableDayTours() {
  return request({
    url: '/admin/grouptour/available-daytours',
    method: 'get'
  })
}

/**
 * 获取团队游亮点
 * @param {Number} id - 团队游ID
 * @returns {Promise} - 返回API响应
 */
export function getGroupTourHighlights(id) {
  return request({
    url: `/admin/grouptour/highlights/${id}`,
    method: 'get'
  })
}

/**
 * 获取团队游包含项目
 * @param {Number} id - 团队游ID
 * @returns {Promise} - 返回API响应
 */
export function getGroupTourInclusions(id) {
  return request({
    url: `/admin/grouptour/inclusions/${id}`,
    method: 'get'
  })
}

/**
 * 获取团队游不包含项目
 * @param {Number} id - 团队游ID
 * @returns {Promise} - 返回API响应
 */
export function getGroupTourExclusions(id) {
  return request({
    url: `/admin/grouptour/exclusions/${id}`,
    method: 'get'
  })
}

/**
 * 获取团队游常见问题
 * @param {Number} id - 团队游ID
 * @returns {Promise} - 返回API响应
 */
export function getGroupTourFaqs(id) {
  return request({
    url: `/admin/grouptour/faqs/${id}`,
    method: 'get'
  })
}

/**
 * 获取团队游贴士
 * @param {Number} id - 团队游ID
 * @returns {Promise} - 返回API响应
 */
export function getGroupTourTips(id) {
  return request({
    url: `/admin/grouptour/tips/${id}`,
    method: 'get'
  })
}

/**
 * 添加新主题
 * @param {Object} data - 主题数据，包含name字段
 * @returns {Promise} - 返回API响应
 */
export function addTheme(data) {
  return request({
    url: '/admin/grouptour/theme',
    method: 'post',
    data
  })
}

/**
 * 添加新的适合人群
 * @param {Object} data - 适合人群数据，包含name字段
 * @returns {Promise} - 返回API响应
 */
export function addSuitable(data) {
  return request({
    url: '/admin/grouptour/suitable',
    method: 'post',
    data
  })
}

/**
 * 保存团队游的所有行程
 * @param {Object} data - 行程数据，包含groupTourId和itineraries数组
 * @returns {Promise} - 返回API响应
 */
export function saveGroupTourItineraries(data) {
  // 处理每个行程项，使用现有的API逐个保存
  const promises = data.itineraries.map(item => {
    return addGroupTourItinerary({
      ...item,
      groupTourId: data.groupTourId
    });
  });
  
  // 返回Promise.all的结果
  return Promise.all(promises).then(results => {
    // 检查是否所有请求都成功
    const allSuccess = results.every(res => res.code === 1);
    
    if (allSuccess) {
      // 构造成功响应
      return {
        code: 1,
        msg: '保存行程成功',
        data: null
      };
    } else {
      // 构造失败响应
      return {
        code: 0,
        msg: '部分行程保存失败',
        data: null
      };
    }
  }).catch(error => {
    console.error('保存行程失败:', error);
    return {
      code: 0,
      msg: '保存行程失败',
      data: null
    };
  });
}