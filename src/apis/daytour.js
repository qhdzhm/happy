import request from '@/utils/request'

/**
 * 获取一日游列表
 */
export function getDayTourList(params) {
  return request({
    url: '/admin/daytour/page',
    method: 'get',
    params
  });
}

// 创建一日游
export const createDayTour = (data) => {
  return request({
    url: '/admin/daytour',
    method: 'post',
    data
  })
}

// 修改一日游信息
export const updateDayTour = (data) => {
  return request({
    url: '/admin/daytour',
    method: 'put',
    data
  })
}

// 删除一日游
export const deleteDayTour = (id) => {
  return request({
    url: `/admin/daytour/${id}`,
    method: 'delete'
  })
}

// 根据ID获取一日游详情
export const getDayTourById = (id) => {
  return request({
    url: `/admin/daytour/${id}`,
    method: 'get'
  })
}

// 上传一日游图片
export const uploadDayTourImage = (data) => {
  return request({
    url: '/admin/common/upload',
    method: 'post',
    data
  })
}

// 一日游上架/下架
export const enableOrDisableDayTour = (status, id) => {
  return request({
    url: `/admin/daytour/status/${status}`,
    method: 'post',
    params: { id }
  })
}

// 获取一日游可用日期和价格
export const getDayTourSchedules = (tourId) => {
  return request({
    url: `/admin/daytour/schedules/${tourId}`,
    method: 'get'
  })
}

// 添加一日游可用日期和价格
export const addDayTourSchedule = (data) => {
  return request({
    url: '/admin/daytour/schedule',
    method: 'post',
    data
  })
}

// 删除一日游可用日期
export const deleteDayTourSchedule = (scheduleId) => {
  return request({
    url: `/admin/daytour/schedule/${scheduleId}`,
    method: 'delete'
  })
}

// 获取一日游亮点
export const getDayTourHighlights = (tourId) => {
  return request({
    url: `/admin/daytour/highlights/${tourId}`,
    method: 'get'
  })
}

// 添加一日游亮点
export const addDayTourHighlight = (data) => {
  return request({
    url: '/admin/daytour/highlight',
    method: 'post',
    data
  })
}

// 删除一日游亮点
export const deleteDayTourHighlight = (id) => {
  return request({
    url: `/admin/daytour/highlight/${id}`,
    method: 'delete'
  })
}

// 获取一日游包含项目
export const getDayTourInclusions = (tourId) => {
  return request({
    url: `/admin/daytour/inclusions/${tourId}`,
    method: 'get'
  })
}

// 添加一日游包含项目
export const addDayTourInclusion = (data) => {
  return request({
    url: '/admin/daytour/inclusion',
    method: 'post',
    data
  })
}

// 删除一日游包含项目
export const deleteDayTourInclusion = (id) => {
  return request({
    url: `/admin/daytour/inclusion/${id}`,
    method: 'delete'
  })
}

// 获取一日游不包含项目
export const getDayTourExclusions = (tourId) => {
  return request({
    url: `/admin/daytour/exclusions/${tourId}`,
    method: 'get'
  })
}

// 添加一日游不包含项目
export const addDayTourExclusion = (data) => {
  return request({
    url: '/admin/daytour/exclusion',
    method: 'post',
    data
  })
}

// 删除一日游不包含项目
export const deleteDayTourExclusion = (id) => {
  return request({
    url: `/admin/daytour/exclusion/${id}`,
    method: 'delete'
  })
}

// 获取一日游行程安排
export const getDayTourItineraries = (tourId) => {
  return request({
    url: `/admin/daytour/itineraries/${tourId}`,
    method: 'get'
  })
}

// 添加一日游行程安排
export const addDayTourItinerary = (data) => {
  return request({
    url: '/admin/daytour/itinerary',
    method: 'post',
    data
  })
}

// 删除一日游行程安排
export const deleteDayTourItinerary = (id) => {
  return request({
    url: `/admin/daytour/itinerary/${id}`,
    method: 'delete'
  })
}

// 获取一日游常见问题
export const getDayTourFaqs = (tourId) => {
  return request({
    url: `/admin/daytour/faqs/${tourId}`,
    method: 'get'
  })
}

// 添加一日游常见问题
export const addDayTourFaq = (data) => {
  return request({
    url: '/admin/daytour/faq',
    method: 'post',
    data
  })
}

// 删除一日游常见问题
export const deleteDayTourFaq = (id) => {
  return request({
    url: `/admin/daytour/faq/${id}`,
    method: 'delete'
  })
}

// 获取一日游旅行提示
export const getDayTourTips = (tourId) => {
  return request({
    url: `/admin/daytour/tips/${tourId}`,
    method: 'get'
  })
}

// 添加一日游旅行提示
export const addDayTourTip = (data) => {
  return request({
    url: '/admin/daytour/tip',
    method: 'post',
    data
  })
}

// 删除一日游旅行提示
export const deleteDayTourTip = (id) => {
  return request({
    url: `/admin/daytour/tip/${id}`,
    method: 'delete'
  })
}

// 获取一日游图片列表
export const getDayTourImages = (tourId) => {
  return request({
    url: `/admin/daytour/images/${tourId}`,
    method: 'get'
  })
}

// 上传图片到图片库
export const handleImageUploadToGallery = async (file, tourId) => {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('tourId', tourId)
  
  return request({
    url: '/admin/daytour/image',
    method: 'post',
    data: formData
  })
}

// 设置主图
export const handleSetPrimaryImage = (imageId) => {
  return request({
    url: `/admin/daytour/image/primary/${imageId}`,
    method: 'post'
  })
}

// 删除图片
export const handleDeleteImage = (imageId) => {
  return request({
    url: `/admin/daytour/image/${imageId}`,
    method: 'delete'
  })
}

// 更新图片描述
export const handleUpdateImageDescription = (imageId, description) => {
  return request({
    url: `/admin/daytour/image/description`,
    method: 'put',
    data: {
      imageId,
      description
    }
  })
}

// 保存图片描述
export const handleSaveImageDescription = (imageId) => {
  return request({
    url: `/admin/daytour/image/save-description/${imageId}`,
    method: 'post'
  })
}

// 获取所有主题
export const getDayTourThemes = () => {
  return request({
    url: '/admin/daytour/theme/list',
    method: 'get'
  })
}

// 获取所有适合人群
export const getDayTourSuitableFor = () => {
  return request({
    url: '/admin/daytour/suitable/list',
    method: 'get'
  })
}

// 获取与一日游相关联的主题
export const getDayTourRelatedThemes = (tourId) => {
  return request({
    url: `/admin/daytour/theme/listByDayTourId/${tourId}`,
    method: 'get'
  })
}

// 获取与一日游相关联的适合人群
export const getDayTourRelatedSuitableFor = (tourId) => {
  return request({
    url: `/admin/daytour/suitable/listByDayTourId/${tourId}`,
    method: 'get'
  })
}

// 更新一日游关联的主题
export const updateDayTourRelatedThemes = (tourId, themeIds) => {
  return request({
    url: '/admin/daytour/theme/associate',
    method: 'post',
    params: { 
      dayTourId: tourId
    },
    data: themeIds
  })
}

// 更新一日游关联的适合人群
export const updateDayTourRelatedSuitableFor = (tourId, suitableIds) => {
  return request({
    url: '/admin/daytour/suitable/associate',
    method: 'post',
    params: { 
      dayTourId: tourId
    },
    data: suitableIds
  })
}

// 创建一日游主题
export const createDayTourTheme = (data) => {
  return request({
    url: '/admin/daytour/theme',
    method: 'post',
    data
  })
}

// 更新一日游主题
export const updateDayTourTheme = (data) => {
  return request({
    url: '/admin/daytour/theme',
    method: 'put',
    data
  })
}

// 删除一日游主题
export const deleteDayTourTheme = (themeId) => {
  return request({
    url: `/admin/daytour/theme/${themeId}`,
    method: 'delete'
  })
}

// 创建一日游适合人群
export const createDayTourSuitableFor = (data) => {
  return request({
    url: '/admin/daytour/suitable',
    method: 'post',
    data
  })
}

// 更新一日游适合人群
export const updateDayTourSuitableFor = (data) => {
  return request({
    url: '/admin/daytour/suitable',
    method: 'put',
    data
  })
}

// 删除一日游适合人群
export const deleteDayTourSuitableFor = (id) => {
  return request({
    url: `/admin/daytour/suitable/${id}`,
    method: 'delete'
  })
}

// 获取指定一日游的所有日程安排
export const getDayTourSchedulesByDayTourId = (dayTourId) => {
  return request({
    url: `/admin/daytour/schedules/${dayTourId}`,
    method: 'get'
  })
}

// 保存一日游日程安排
export const saveDayTourSchedule = (data) => {
  return request({
    url: '/admin/daytour/schedule',
    method: 'post',
    data
  })
}

// 删除一日游日程安排
export const deleteDayTourScheduleById = (scheduleId) => {
  return request({
    url: `/admin/daytour/schedule/${scheduleId}`,
    method: 'delete'
  })
}

// 删除一日游的所有日程安排 (使用DayTourServiceImpl中的方法)
export const deleteDayTourSchedulesByDayTourId = (dayTourId) => {
  return request({
    url: `/admin/daytour/schedule/deleteByDayTourId/${dayTourId}`,
    method: 'delete'
  })
}

// 获取指定日期范围内的日程安排 (使用DayTourScheduleController中的方法)
export const getDayTourSchedulesInDateRange = (dayTourId, startDate, endDate) => {
  return request({
    url: `/admin/daytour/schedule/dateRange/${dayTourId}`,
    method: 'get',
    params: {
      startDate,
      endDate
    }
  })
}

// 根据ID获取日程安排详情 (使用DayTourScheduleController中的方法)
export const getDayTourScheduleById = (scheduleId) => {
  return request({
    url: `/admin/daytour/schedule/${scheduleId}`,
    method: 'get'
  })
}

// 根据一日游ID获取关联的主题
export const getDayTourThemesByDayTourId = (dayTourId) => {
  return request({
    url: `/admin/daytour/theme/listByDayTourId/${dayTourId}`,
    method: 'get'
  })
}

// 添加一日游与主题关联
export const addDayTourThemeRelation = (dayTourId, themeId) => {
  return request({
    url: '/admin/daytour/theme/relation',
    method: 'post',
    data: {
      dayTourId,
      themeId
    }
  })
}

// 删除一日游与主题关联
export const deleteDayTourThemeRelation = (dayTourId, themeId) => {
  return request({
    url: '/admin/daytour/theme/relation',
    method: 'delete',
    params: {
      dayTourId,
      themeId
    }
  })
}

/**
 * 获取所有适合人群列表
 */
export function getDayTourSuitables() {
  return request({
    url: '/admin/daytour/suitable/list',
    method: 'get'
  })
}

/**
 * 根据一日游ID获取适合人群列表
 * @param {number} dayTourId - 一日游ID
 */
export function getDayTourSuitablesByDayTourId(dayTourId) {
  return request({
    url: `/admin/daytour/suitable/listByDayTourId/${dayTourId}`,
    method: 'get'
  })
}

/**
 * 为一日游关联适合人群
 * @param {number} dayTourId - 一日游ID
 * @param {Array<number>} suitableIds - 适合人群ID列表
 */
export function associateDayTourSuitables(dayTourId, suitableIds) {
  return request({
    url: '/admin/daytour/suitable/associate',
    method: 'post',
    params: {
      dayTourId,
      suitableIds
    }
  })
} 