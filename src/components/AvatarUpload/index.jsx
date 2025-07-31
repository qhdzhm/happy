import React, { useState, useEffect } from 'react';
import { Upload, message, Avatar, Spin } from 'antd';
import { UploadOutlined, UserOutlined } from '@ant-design/icons';
import axios from 'axios';
import './style.css';

/**
 * 头像上传组件
 * @param {Object} props
 * @param {string} props.avatarUrl 当前头像URL
 * @param {Function} props.onAvatarChange 头像变化回调
 * @param {number} props.size 头像大小，默认100
 * @param {boolean} props.editable 是否可编辑，默认true
 */
const AvatarUpload = ({ 
  avatarUrl, 
  onAvatarChange, 
  size = 100, 
  editable = true 
}) => {
  const [loading, setLoading] = useState(false);
  const [currentAvatarUrl, setCurrentAvatarUrl] = useState(avatarUrl);

  // 同步外部传入的avatarUrl到内部状态
  useEffect(() => {
    console.log('🔄 AvatarUpload同步外部avatarUrl:', avatarUrl);
    setCurrentAvatarUrl(avatarUrl);
  }, [avatarUrl]);

  // 验证文件类型和大小
  const beforeUpload = (file) => {
    const isJpgOrPng = file.type === 'image/jpeg' || 
                       file.type === 'image/jpg' || 
                       file.type === 'image/png' || 
                       file.type === 'image/gif' ||
                       file.type === 'image/webp';
    
    if (!isJpgOrPng) {
      message.error('只能上传 JPG/PNG/GIF/WEBP 格式的图片!');
      return false;
    }
    
    const isLt2M = file.size / 1024 / 1024 < 2;
    if (!isLt2M) {
      message.error('头像文件大小不能超过 2MB!');
      return false;
    }
    
    return true;
  };

  // 自定义上传方法
  const customUpload = async ({ file, onSuccess, onError }) => {
    try {
      setLoading(true);
      
      const formData = new FormData();
      formData.append('file', file);
      
      // 获取当前token
      const token = localStorage.getItem('admin_token') || localStorage.getItem('token');
      
      const response = await axios.post('/admin/avatar/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': token ? `Bearer ${token}` : '',
        },
      });
      
      if (response.data && response.data.code === 1) {
        const newAvatarUrl = response.data.data;
        setCurrentAvatarUrl(newAvatarUrl);
        
        // 通知父组件头像已更新
        if (onAvatarChange) {
          onAvatarChange(newAvatarUrl);
        }
        
        message.success('头像上传成功');
        onSuccess(response.data, file);
      } else {
        throw new Error(response.data.msg || '上传失败');
      }
    } catch (error) {
      console.error('头像上传失败:', error);
      let errorMsg = '头像上传失败';
      
      if (error.response) {
        if (error.response.status === 413) {
          errorMsg = '文件太大，请选择小于2MB的图片';
        } else if (error.response.data && error.response.data.msg) {
          errorMsg = error.response.data.msg;
        }
      } else if (error.message) {
        errorMsg = error.message;
      }
      
      message.error(errorMsg);
      onError(error);
    } finally {
      setLoading(false);
    }
  };

  // 渲染上传区域
  const uploadButton = (
    <div className="avatar-upload-content">
      {loading ? <Spin /> : <UploadOutlined />}
      <div style={{ marginTop: 8 }}>
        {loading ? '上传中...' : '点击上传'}
      </div>
    </div>
  );

  return (
    <div className="avatar-upload-container">
      {editable ? (
        <Upload
          name="file"
          listType="picture-card"
          className="avatar-uploader"
          showUploadList={false}
          beforeUpload={beforeUpload}
          customRequest={customUpload}
        >
          {currentAvatarUrl ? (
            <div className="avatar-preview">
              <Avatar 
                src={currentAvatarUrl} 
                size={size} 
                icon={<UserOutlined />}
              />
              <div className="avatar-upload-overlay">
                <UploadOutlined />
              </div>
            </div>
          ) : (
            uploadButton
          )}
        </Upload>
      ) : (
        <Avatar 
          src={currentAvatarUrl} 
          size={size} 
          icon={<UserOutlined />}
        />
      )}
      
      {editable && (
        <div className="avatar-upload-tips">
          <p>建议尺寸: {size}x{size}像素</p>
          <p>支持格式: JPG, PNG, GIF, WEBP</p>
          <p>文件大小: 不超过2MB</p>
        </div>
      )}
    </div>
  );
};

export default AvatarUpload;