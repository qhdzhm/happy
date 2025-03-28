import React, { useState, useEffect } from 'react';
import { Card, Descriptions, Tag, List, Badge, Alert, Tooltip } from 'antd';
import { getVehicleWithDrivers } from '@/apis/vehicle';
import dayjs from 'dayjs';
import { ClockCircleOutlined, WarningOutlined, CheckCircleOutlined } from '@ant-design/icons';

const VehicleDetail = ({ vehicleId }) => {
  const [vehicle, setVehicle] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (vehicleId) {
      loadVehicleData();
    }
  }, [vehicleId]);

  const loadVehicleData = async () => {
    setLoading(true);
    try {
      const result = await getVehicleWithDrivers(vehicleId);
      setVehicle(result.data);
    } catch (error) {
      console.error('加载车辆详情失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // 获取状态标签
  const getStatusTag = (status) => {
    const statusMap = {
      0: { color: 'default', text: '送修中' },
      1: { color: 'success', text: '可用' },
      2: { color: 'processing', text: '已占用' },
      3: { color: 'warning', text: '已满' },
      4: { color: 'error', text: '注册过期' },
      5: { color: 'error', text: '车检过期' },
    };

    const { color, text } = statusMap[status] || { color: 'default', text: '未知状态' };
    return <Tag color={color}>{text}</Tag>;
  };

  // 计算日期是否临近（30天内）
  const isDateApproaching = (date) => {
    if (!date) return false;
    const targetDate = dayjs(date);
    const now = dayjs();
    const daysLeft = targetDate.diff(now, 'day');
    return daysLeft >= 0 && daysLeft <= 30;
  };

  // 计算日期是否已过期
  const isDateExpired = (date) => {
    if (!date) return false;
    const targetDate = dayjs(date);
    const now = dayjs();
    return now.isAfter(targetDate);
  };

  // 获取日期标签
  const getDateTag = (date, type) => {
    if (!date) return '未设置';
    
    const formattedDate = dayjs(date).format('YYYY-MM-DD');
    
    if (isDateExpired(date)) {
      return (
        <Tooltip title={`${type}已过期，请尽快处理`}>
          <Tag color="red" icon={<WarningOutlined />}>
            {formattedDate} (已过期)
          </Tag>
        </Tooltip>
      );
    }
    
    if (isDateApproaching(date)) {
      const daysLeft = dayjs(date).diff(dayjs(), 'day');
      return (
        <Tooltip title={`${type}即将到期，剩余${daysLeft}天`}>
          <Tag color="orange" icon={<ClockCircleOutlined />}>
            {formattedDate} (剩余{daysLeft}天)
          </Tag>
        </Tooltip>
      );
    }
    
    return (
      <Tooltip title={`${type}状态正常`}>
        <Tag color="green" icon={<CheckCircleOutlined />}>
          {formattedDate}
        </Tag>
      </Tooltip>
    );
  };

  if (!vehicle) {
    return <Card loading={loading}>加载中...</Card>;
  }

  return (
    <Card 
      title="车辆详情" 
      loading={loading}
      extra={getStatusTag(vehicle.status)}
    >
      {(vehicle.isRegoExpired || vehicle.isInspectionExpired) && (
        <Alert
          message="车辆文件过期警告"
          description={
            <>
              {vehicle.isRegoExpired && <div>车辆注册已过期，请尽快续期。</div>}
              {vehicle.isInspectionExpired && <div>车辆检查已过期，请尽快安排检查。</div>}
            </>
          }
          type="error"
          showIcon
          style={{ marginBottom: 16 }}
        />
      )}
      
      <Descriptions bordered column={2}>
        <Descriptions.Item label="车辆ID">{vehicle.vehicleId}</Descriptions.Item>
        <Descriptions.Item label="车牌号">{vehicle.licensePlate}</Descriptions.Item>
        <Descriptions.Item label="车辆类型">{vehicle.vehicleType}</Descriptions.Item>
        <Descriptions.Item label="座位数">{vehicle.seatCount}</Descriptions.Item>
        <Descriptions.Item label="注册到期日期">{getDateTag(vehicle.regoExpiryDate, '注册')}</Descriptions.Item>
        <Descriptions.Item label="检查到期日期">{getDateTag(vehicle.inspectionDueDate, '车检')}</Descriptions.Item>
        <Descriptions.Item label="车辆地址">{vehicle.location || '未设置'}</Descriptions.Item>
        <Descriptions.Item label="驾驶员分配">
          <Tag color={vehicle.isFull ? 'orange' : 'blue'}>
            {vehicle.allocation}
          </Tag>
        </Descriptions.Item>
        <Descriptions.Item label="备注" span={2}>{vehicle.notes || '无'}</Descriptions.Item>
      </Descriptions>
      
      <Card
        title="驾驶员信息"
        style={{ marginTop: 16 }}
        type="inner"
      >
        {vehicle.drivers && vehicle.drivers.length > 0 ? (
          <>
            <Alert
              message={
                <span>
                  当前驾驶员分配情况: <Tag color="blue">{vehicle.drivers.length}/{vehicle.maxDrivers || 3}名</Tag>
                  <span style={{ marginLeft: 10 }}>
                    {vehicle.status === 3 ? 
                      <Tag color="orange">已满</Tag> : 
                      <Tag color="green">可继续分配</Tag>
                    }
                  </span>
                </span>
              }
              type="info"
              showIcon
              style={{ marginBottom: 10 }}
            />
            <List
              itemLayout="horizontal"
              dataSource={vehicle.drivers}
              renderItem={(driver, index) => (
                <List.Item key={`driver-${driver.id || index}`}>
                  <List.Item.Meta
                    avatar={
                      <Badge 
                        status={driver.isPrimary === 1 ? 'success' : 'default'} 
                        text={driver.isPrimary === 1 ? '主驾' : '副驾'} 
                      />
                    }
                    title={driver.name}
                    description={
                      <>
                        <div>工号: {driver.username}</div>
                        <div>联系电话: {driver.phone}</div>
                        <div>
                          工作状态: 
                          {getWorkStatusTag(driver.workStatus)}
                        </div>
                      </>
                    }
                  />
                </List.Item>
              )}
            />
          </>
        ) : (
          <div style={{ textAlign: 'center', padding: 20, color: '#999' }}>
            暂无驾驶员分配
          </div>
        )}
      </Card>
    </Card>
  );
};

// 获取工作状态标签
const getWorkStatusTag = (status) => {
  const statusMap = {
    0: { color: 'green', text: '空闲' },
    1: { color: 'blue', text: '忙碌' },
    2: { color: 'orange', text: '休假' },
    3: { color: 'purple', text: '出团' },
    4: { color: 'cyan', text: '待命' },
  };

  const { color, text } = statusMap[status] || { color: 'default', text: '未知' };
  return <Tag color={color}>{text}</Tag>;
};

export default VehicleDetail; 