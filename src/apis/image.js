import request from '@/utils/request'

/**
 * 上传图片
 * @param {FormData} formData 包含图片的FormData对象
 * @returns {Promise}
 */
export function uploadImage(formData) {
  return request({
    url: '/admin/images/upload',
    method: 'post',
    data: formData,
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
}

/**
 * 保存图片信息
 * @param {FormData} formData 包含图片信息的FormData对象
 * @returns {Promise}
 */
export function saveImage(formData) {
  return request({
    url: '/admin/images/save',
    method: 'post',
    data: formData,
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
}

/**
 * 根据类型和关联ID获取图片列表
 * @param {string} type 图片类型 
 * @param {string|number} relatedId 关联ID
 * @returns {Promise}
 */
export function getImagesByTypeAndId(type, relatedId) {
  return request({
    url: `/admin/images/list`,
    method: 'get',
    params: { type, relatedId }
  });
}

/**
 * 设置主图
 * @param {string|number} id 图片ID
 * @param {string} type 图片类型
 * @param {string|number} relatedId 关联ID
 * @returns {Promise}
 */
export function setPrimaryImage(id, type, relatedId) {
  return request({
    url: `/admin/images/primary/${id}`,
    method: 'put',
    data: { type, relatedId }
  });
}

/**
 * 删除图片
 * @param {string|number} id 图片ID
 * @returns {Promise}
 */
export function deleteImage(id) {
  return request({
    url: `/admin/images/${id}`,
    method: 'delete'
  });
}

/**
 * 更新图片位置
 * @param {string|number} id 图片ID
 * @param {number} position 新位置
 * @returns {Promise}
 */
export function updateImagePosition(id, position) {
  return request({
    url: `/admin/images/position/${id}`,
    method: 'put',
    data: { position }
  });
}

/**
 * 更新图片描述
 * @param {string|number} id 图片ID
 * @param {string} description 新描述
 * @returns {Promise}
 */
export function updateImageDescription(id, description) {
  return request({
    url: `/admin/images/description/${id}`,
    method: 'put',
    data: { description }
  });
} 