import React, { useState, useEffect } from 'react';
import { 
  Upload, Button, Card, Modal, Input, message, Spin, 
  Row, Col, Tooltip, Popconfirm, Divider, Typography 
} from 'antd';
import { 
  UploadOutlined, DeleteOutlined, StarOutlined, 
  StarFilled, EditOutlined, PictureOutlined 
} from '@ant-design/icons';
import { 
  uploadImage, saveImage, getImagesByTypeAndId, 
  setPrimaryImage, deleteImage, updateImageDescription 
} from '@/apis/image';
import './style.less';

const { TextArea } = Input;
const { Title } = Typography;

/**
 * 图片上传组件
 * @param {Object} props
 * @param {string} props.type 图片类型 (例如: 'day_tour', 'group_tour', 等)
 * @param {string|number} props.relatedId 关联的ID
 * @param {Function} props.onChange 当图片列表变化时的回调
 * @param {Function} props.onBannerImageChange 当Banner图片变化时的回调
 * @param {string} props.initialBannerImage 初始Banner图片URL
 */
const ImageUpload = ({ type, relatedId, onChange, onBannerImageChange, initialBannerImage }) => {
  const [imageList, setImageList] = useState([]);
  const [bannerImageUrl, setBannerImageUrl] = useState(initialBannerImage || '');
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [currentImage, setCurrentImage] = useState(null);
  const [description, setDescription] = useState('');

  // 获取图片列表
  const fetchImages = async () => {
    if (!type || !relatedId) return;
    
    try {
      setLoading(true);
      const response = await getImagesByTypeAndId(type, relatedId);
      if (response && response.data) {
        setImageList(response.data);
        if (onChange) {
          onChange(response.data);
        }
      }
    } catch (error) {
      console.error('获取图片列表失败:', error);
      message.error('获取图片列表失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (type && relatedId) {
      fetchImages();
    }
  }, [type, relatedId]);

  // 处理上传前的操作
  const beforeUpload = (file) => {
    const isImage = file.type.startsWith('image/');
    if (!isImage) {
      message.error('您只能上传图片文件!');
      return false;
    }
    
    const isLt5M = file.size / 1024 / 1024 < 5;
    if (!isLt5M) {
      message.error('图片必须小于5MB!');
      return false;
    }
    
    return true;
  };

  // 自定义上传方法
  const customUpload = async ({ file, onSuccess, onError }) => {
    if (!type || !relatedId) {
      message.error('缺少必要的类型或关联ID');
      onError(new Error('缺少必要的类型或关联ID'));
      return;
    }

    try {
      setLoading(true);
      message.loading('正在上传图片，请稍候...', 0);
      
      // 整合为一个步骤：直接上传文件并保存关联信息
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', type);
      formData.append('relatedId', relatedId);
      formData.append('description', '');
      
      const saveResponse = await saveImage(formData);
      
      message.destroy(); // 清除loading消息
      
      if (saveResponse && saveResponse.data) {
        message.success('图片上传成功');
        fetchImages(); // 重新获取图片列表
        onSuccess(saveResponse, file);
      } else {
        throw new Error('图片上传失败');
      }
    } catch (error) {
      message.destroy(); // 清除loading消息
      console.error('上传图片出错:', error);
      
      // 更友好的错误提示
      if (error.message && error.message.includes('timeout')) {
        message.error('图片上传超时，请检查网络连接或稍后重试', 5);
      } else if (error.message && error.message.includes('Network Error')) {
        message.error('网络连接失败，请检查网络后重试', 5);
      } else {
        message.error(`上传图片失败: ${error.msg || error.message || '未知错误'}`, 5);
      }
      
      onError(error);
    } finally {
      setLoading(false);
    }
  };

  // Banner图片上传方法
  const customBannerUpload = async ({ file, onSuccess, onError }) => {
    try {
      setLoading(true);
      message.loading('正在上传Banner图片，请稍候...', 0);
      
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await uploadImage(formData);
      
      message.destroy(); // 清除loading消息
      
      if (response && response.data) {
        setBannerImageUrl(response.data);
        message.success('Banner图片上传成功');
        
        // 通知父组件Banner图片已更新
        if (onBannerImageChange) {
          onBannerImageChange(response.data);
        }
        
        onSuccess(response, file);
      } else {
        throw new Error('Banner图片上传失败');
      }
    } catch (error) {
      message.destroy(); // 清除loading消息
      console.error('上传Banner图片出错:', error);
      
      // 更友好的错误提示
      if (error.message && error.message.includes('timeout')) {
        message.error('图片上传超时，请检查网络连接或稍后重试', 5);
      } else if (error.message && error.message.includes('Network Error')) {
        message.error('网络连接失败，请检查网络后重试', 5);
      } else {
        message.error(`上传Banner图片失败: ${error.msg || error.message || '未知错误'}`, 5);
      }
      
      onError(error);
    } finally {
      setLoading(false);
    }
  };

  // 删除Banner图片
  const handleDeleteBannerImage = () => {
    setBannerImageUrl('');
    if (onBannerImageChange) {
      onBannerImageChange('');
    }
    message.success('Banner图片已删除');
  };

  // 设置主图
  const handleSetPrimary = async (id) => {
    if (!type || !relatedId) return;
    
    try {
      setLoading(true);
      await setPrimaryImage(id, type, relatedId);
      message.success('设置主图成功');
      fetchImages();
    } catch (error) {
      console.error('设置主图失败:', error);
      message.error('设置主图失败');
    } finally {
      setLoading(false);
    }
  };

  // 删除图片
  const handleDelete = async (id) => {
    try {
      setLoading(true);
      await deleteImage(id);
      message.success('删除图片成功');
      fetchImages();
    } catch (error) {
      console.error('删除图片失败:', error);
      message.error('删除图片失败');
    } finally {
      setLoading(false);
    }
  };

  // 打开编辑描述弹窗
  const openDescriptionModal = (image) => {
    setCurrentImage(image);
    setDescription(image.description || '');
    setModalVisible(true);
  };

  // 保存描述
  const saveDescription = async () => {
    if (!currentImage) return;
    
    try {
      setLoading(true);
      await updateImageDescription(currentImage.id, description);
      message.success('更新描述成功');
      fetchImages();
      setModalVisible(false);
    } catch (error) {
      console.error('更新描述失败:', error);
      message.error('更新描述失败');
    } finally {
      setLoading(false);
    }
  };

  // 设置Banner图片URL（用于从父组件初始化）
  useEffect(() => {
    if (initialBannerImage && initialBannerImage !== bannerImageUrl) {
      setBannerImageUrl(initialBannerImage);
    }
  }, [initialBannerImage]);

  return (
    <div className="image-upload-container">
      <Spin spinning={loading}>
        {/* Banner图片管理区域 */}
        <div className="banner-image-section">
          <Title level={4}>
            <PictureOutlined /> Banner背景图片
          </Title>
          <div className="banner-upload-area">
            {bannerImageUrl ? (
              <div className="banner-preview">
                <img 
                  src={bannerImageUrl} 
                  alt="Banner背景图" 
                  style={{ 
                    width: '100%', 
                    maxWidth: '600px', 
                    height: '200px', 
                    objectFit: 'cover',
                    borderRadius: '8px'
                  }} 
                />
                <div className="banner-actions">
                  <Popconfirm
                    title="确定要删除Banner图片吗?"
                    onConfirm={handleDeleteBannerImage}
                    okText="确定"
                    cancelText="取消"
                  >
                    <Button danger icon={<DeleteOutlined />}>
                      删除Banner图片
                    </Button>
                  </Popconfirm>
                </div>
              </div>
            ) : (
              <div className="banner-placeholder">
                <Upload
                  listType="picture"
                  beforeUpload={beforeUpload}
                  customRequest={customBannerUpload}
                  showUploadList={false}
                >
                  <Button icon={<UploadOutlined />} size="large">
                    上传Banner背景图片
                  </Button>
                </Upload>
                <p style={{ marginTop: 8, color: '#666' }}>
                  建议尺寸: 1200x400像素，用作页面顶部背景图<br/>
                  <span style={{ color: '#1890ff' }}>💡 图片上传可能需要1-2分钟，请耐心等待</span>
                </p>
              </div>
            )}
          </div>
        </div>

        <Divider />

        {/* 常规图片管理区域 */}
        <div className="gallery-section">
          <Title level={4}>
            <PictureOutlined /> 图片画廊
          </Title>
          <Upload
            listType="picture"
            beforeUpload={beforeUpload}
            customRequest={customUpload}
            showUploadList={false}
          >
            <Button icon={<UploadOutlined />}>上传图片到画廊</Button>
          </Upload>
          <p style={{ marginTop: 8, color: '#666', fontSize: '12px' }}>
            <span style={{ color: '#1890ff' }}>💡 图片上传可能需要1-2分钟，请耐心等待</span>
          </p>
          
          <div className="image-list">
            <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
              {imageList.length > 0 ? (
                imageList.map(image => (
                  <Col xs={24} sm={12} md={8} lg={6} key={image.id}>
                    <Card
                      hoverable
                      cover={<img alt={image.description || '图片'} src={image.imageUrl} />}
                      className={image.isPrimary ? 'primary-image' : ''}
                      actions={[
                        image.isPrimary ? (
                          <Tooltip title="主图">
                            <StarFilled style={{ color: '#faad14' }} />
                          </Tooltip>
                        ) : (
                          <Tooltip title="设为主图">
                            <StarOutlined onClick={() => handleSetPrimary(image.id)} />
                          </Tooltip>
                        ),
                        <Tooltip title="编辑描述">
                          <EditOutlined onClick={() => openDescriptionModal(image)} />
                        </Tooltip>,
                        <Popconfirm
                          title="确定要删除这张图片吗?"
                          onConfirm={() => handleDelete(image.id)}
                          okText="确定"
                          cancelText="取消"
                        >
                          <Tooltip title="删除">
                            <DeleteOutlined />
                          </Tooltip>
                        </Popconfirm>
                      ]}
                    >
                      <Card.Meta
                        title={image.isPrimary ? '主图' : `图片 ${image.position || ''}`}
                        description={image.description || '无描述'}
                      />
                    </Card>
                  </Col>
                ))
              ) : (
                <Col span={24}>
                  <div className="no-image">
                    <p>暂无图片</p>
                  </div>
                </Col>
              )}
            </Row>
          </div>
        </div>
        
        <Modal
          title="编辑图片描述"
          open={modalVisible}
          onOk={saveDescription}
          onCancel={() => setModalVisible(false)}
          okText="保存"
          cancelText="取消"
        >
          <TextArea
            rows={4}
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="请输入图片描述"
            maxLength={200}
            showCount
          />
        </Modal>
      </Spin>
    </div>
  );
};

export default ImageUpload; 