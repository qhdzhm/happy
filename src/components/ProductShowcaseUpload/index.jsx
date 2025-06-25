import React, { useState, useEffect } from 'react';
import { Upload, Button, Card, Modal, message, Spin, Typography, Popconfirm } from 'antd';
import { UploadOutlined, DeleteOutlined, PictureOutlined, InfoCircleOutlined } from '@ant-design/icons';
import { 
  uploadDayTourShowcaseImage, 
  deleteDayTourShowcaseImage,
  uploadGroupTourShowcaseImage,
  deleteGroupTourShowcaseImage 
} from '@/apis/image';
import './style.scss';

const { Title, Text } = Typography;

/**
 * 产品展示图片上传组件
 * @param {Object} props
 * @param {string} props.type 产品类型 ('day_tour' | 'group_tour')
 * @param {number} props.productId 产品ID
 * @param {string} props.initialImage 初始图片URL
 * @param {Function} props.onChange 图片变化时的回调
 */
const ProductShowcaseUpload = ({ type, productId, initialImage, onChange }) => {
  const [imageUrl, setImageUrl] = useState(initialImage || '');
  const [loading, setLoading] = useState(false);
  const [previewVisible, setPreviewVisible] = useState(false);

  // 监听初始图片变化
  useEffect(() => {
    if (initialImage !== imageUrl) {
      setImageUrl(initialImage || '');
    }
  }, [initialImage]);

  // 处理上传前的验证
  const beforeUpload = (file) => {
    const isImage = file.type.startsWith('image/');
    if (!isImage) {
      message.error('只能上传图片文件!');
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
    if (!productId) {
      message.error('缺少产品ID');
      onError(new Error('缺少产品ID'));
      return;
    }

    try {
      setLoading(true);
      const formData = new FormData();
      formData.append('file', file);
      
      let response;
      if (type === 'day_tour') {
        response = await uploadDayTourShowcaseImage(productId, formData);
      } else if (type === 'group_tour') {
        response = await uploadGroupTourShowcaseImage(productId, formData);
      } else {
        throw new Error('未知的产品类型');
      }
      
      if (response && response.data) {
        setImageUrl(response.data);
        message.success('产品展示图片上传成功');
        
        // 通知父组件图片已更新
        if (onChange) {
          onChange(response.data);
        }
        
        onSuccess(response, file);
      } else {
        throw new Error('上传失败');
      }
    } catch (error) {
      console.error('上传产品展示图片出错:', error);
      message.error(`上传产品展示图片失败: ${error.message || '未知错误'}`);
      onError(error);
    } finally {
      setLoading(false);
    }
  };

  // 删除图片
  const handleDelete = async () => {
    if (!productId) {
      message.error('缺少产品ID');
      return;
    }

    try {
      setLoading(true);
      
      if (type === 'day_tour') {
        await deleteDayTourShowcaseImage(productId);
      } else if (type === 'group_tour') {
        await deleteGroupTourShowcaseImage(productId);
      } else {
        throw new Error('未知的产品类型');
      }
      
      setImageUrl('');
      message.success('产品展示图片删除成功');
      
      // 通知父组件图片已删除
      if (onChange) {
        onChange('');
      }
    } catch (error) {
      console.error('删除产品展示图片失败:', error);
      message.error(`删除产品展示图片失败: ${error.message || '未知错误'}`);
    } finally {
      setLoading(false);
    }
  };

  // 预览图片
  const handlePreview = () => {
    setPreviewVisible(true);
  };

  return (
    <div className="product-showcase-upload">
      <Spin spinning={loading}>
        <div className="upload-header">
          <Title level={4}>
            <PictureOutlined /> 产品展示图片
          </Title>
          <div className="upload-description">
            <Text type="secondary">
              <InfoCircleOutlined /> 该图片将显示在产品详情页面的图片轮播下方，作为产品的主要展示图片
            </Text>
          </div>
        </div>

        <div className="upload-content">
          {imageUrl ? (
            <div className="image-preview">
              <Card
                hoverable
                className="showcase-image-card"
                cover={
                  <img 
                    alt="产品展示图片" 
                    src={imageUrl}
                    onClick={handlePreview}
                    style={{ 
                      width: '100%', 
                      height: '300px', 
                      objectFit: 'cover',
                      cursor: 'pointer'
                    }}
                  />
                }
                actions={[
                  <Button 
                    key="preview" 
                    type="link" 
                    onClick={handlePreview}
                  >
                    预览
                  </Button>,
                  <Popconfirm
                    key="delete"
                    title="确定要删除产品展示图片吗?"
                    onConfirm={handleDelete}
                    okText="确定"
                    cancelText="取消"
                  >
                    <Button 
                      type="link" 
                      danger 
                      icon={<DeleteOutlined />}
                    >
                      删除
                    </Button>
                  </Popconfirm>
                ]}
              >
                <Card.Meta 
                  title="产品展示图片" 
                  description="点击图片可以预览大图" 
                />
              </Card>
            </div>
          ) : (
            <div className="upload-placeholder">
              <Upload
                name="file"
                listType="picture-card"
                className="showcase-uploader"
                beforeUpload={beforeUpload}
                customRequest={customUpload}
                showUploadList={false}
              >
                <div className="upload-button">
                  <UploadOutlined style={{ fontSize: '24px', marginBottom: '8px' }} />
                  <div>上传产品展示图片</div>
                  <div style={{ fontSize: '12px', color: '#999', marginTop: '4px' }}>
                    建议尺寸: 800x600像素
                  </div>
                </div>
              </Upload>
              <div className="upload-tips">
                <Text type="secondary">
                  支持 JPG、PNG、GIF 格式，文件大小不超过 5MB
                </Text>
              </div>
            </div>
          )}
        </div>

        {/* 图片预览Modal */}
        <Modal
          open={previewVisible}
          title="产品展示图片预览"
          footer={null}
          onCancel={() => setPreviewVisible(false)}
          centered
          width="80%"
          style={{ maxWidth: '800px' }}
        >
          {imageUrl && (
            <img 
              alt="产品展示图片" 
              src={imageUrl}
              style={{ 
                width: '100%', 
                height: 'auto',
                maxHeight: '70vh',
                objectFit: 'contain'
              }}
            />
          )}
        </Modal>
      </Spin>
    </div>
  );
};

export default ProductShowcaseUpload; 