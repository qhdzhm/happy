import React from 'react';
import { Card, Button, Alert } from 'antd';
import { useNavigate } from 'react-router-dom';
import './index.scss';

const ScheduleManagement = () => {
  const navigate = useNavigate();

  const handleBack = () => {
    navigate('/daytour');
  };

  return (
    <div className="schedule-management">
      <Card title="日程安排管理">
        <Alert
          message="功能已禁用"
          description="日程安排功能已被移除，请返回一日游管理页面。"
          type="warning"
          showIcon
          style={{ marginBottom: '20px' }}
        />
        <Button type="primary" onClick={handleBack}>
          返回一日游管理
        </Button>
      </Card>
    </div>
  );
};

export default ScheduleManagement; 