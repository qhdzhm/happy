import React from 'react';
import { Row, Col, Card, Tag, Descriptions, Divider } from 'antd';
import dayjs from 'dayjs';
import {
  UserOutlined,
  CarOutlined,
  EnvironmentOutlined,
  PhoneOutlined,
  CalendarOutlined,
  TeamOutlined
} from '@ant-design/icons';

const AssignmentDetail = ({ assignment }) => {
  if (!assignment) return null;

  // 状态配置
  const statusConfig = {
    confirmed: { color: 'green', text: '已确认' },
    in_progress: { color: 'blue', text: '进行中' },
    completed: { color: 'purple', text: '已完成' },
    cancelled: { color: 'red', text: '已取消' }
  };

  const statusInfo = statusConfig[assignment.status] || { color: 'default', text: assignment.status };

  // 接送方式映射
  const pickupMethodMap = {
    hotel_pickup: '酒店接送',
    meeting_point: '集合点接送',
    self_drive: '自驾',
    other: '其他'
  };

  // 语言偏好映射
  const languageMap = {
    chinese: '中文',
    english: 'English',
    both: '中英文'
  };

  return (
    <div className="assignment-detail">
      {/* 基本信息卡片 */}
      <Card 
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CalendarOutlined />
            <span>基本信息</span>
            <Tag color={statusInfo.color} style={{ marginLeft: 'auto' }}>
              {statusInfo.text}
            </Tag>
          </div>
        }
        style={{ marginBottom: 16 }}
      >
        <Row gutter={[16, 16]}>
          <Col span={12}>
            <Descriptions column={1} size="small">
              <Descriptions.Item label="分配日期">
                {dayjs(assignment.assignmentDate).format('YYYY年MM月DD日')}
              </Descriptions.Item>
              <Descriptions.Item label="目的地">
                <EnvironmentOutlined style={{ marginRight: 4 }} />
                {assignment.destination}
              </Descriptions.Item>
              <Descriptions.Item label="下一个目的地">
                {assignment.nextDestination || '无'}
              </Descriptions.Item>
            </Descriptions>
          </Col>
          <Col span={12}>
            <Descriptions column={1} size="small">
              <Descriptions.Item label="创建时间">
                {dayjs(assignment.createdTime).format('YYYY-MM-DD HH:mm:ss')}
              </Descriptions.Item>
              <Descriptions.Item label="更新时间">
                {dayjs(assignment.updatedTime).format('YYYY-MM-DD HH:mm:ss')}
              </Descriptions.Item>
              <Descriptions.Item label="语言偏好">
                {languageMap[assignment.languagePreference] || assignment.languagePreference || '未指定'}
              </Descriptions.Item>
            </Descriptions>
          </Col>
        </Row>
      </Card>

      {/* 导游和车辆信息 */}
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={12}>
          <Card 
            title={
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <UserOutlined />
                <span>导游信息</span>
              </div>
            }
          >
            <Descriptions column={1} size="small">
              <Descriptions.Item label="导游姓名">
                {assignment.guide?.guideName}
              </Descriptions.Item>
              <Descriptions.Item label="联系电话">
                <PhoneOutlined style={{ marginRight: 4 }} />
                {assignment.guide?.phone}
              </Descriptions.Item>
              <Descriptions.Item label="邮箱">
                {assignment.guide?.email || '未提供'}
              </Descriptions.Item>
              <Descriptions.Item label="语言能力">
                {assignment.guide?.languages || '未提供'}
              </Descriptions.Item>
              <Descriptions.Item label="从业经验">
                {assignment.guide?.experienceYears ? `${assignment.guide.experienceYears}年` : '未提供'}
              </Descriptions.Item>
            </Descriptions>
          </Card>
        </Col>
        <Col span={12}>
          <Card 
            title={
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CarOutlined />
                <span>车辆信息</span>
              </div>
            }
          >
            <Descriptions column={1} size="small">
              <Descriptions.Item label="车牌号">
                {assignment.vehicle?.licensePlate}
              </Descriptions.Item>
              <Descriptions.Item label="车辆类型">
                {assignment.vehicle?.vehicleType}
              </Descriptions.Item>
              <Descriptions.Item label="座位数">
                {assignment.vehicle?.seatCount}座
              </Descriptions.Item>
              <Descriptions.Item label="当前位置">
                {assignment.vehicle?.location || '未提供'}
              </Descriptions.Item>
              <Descriptions.Item label="车辆备注">
                {assignment.vehicle?.notes || '无'}
              </Descriptions.Item>
            </Descriptions>
          </Card>
        </Col>
      </Row>

      {/* 游客信息 */}
      <Card 
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <TeamOutlined />
            <span>游客信息</span>
          </div>
        }
        style={{ marginBottom: 16 }}
      >
        <Row gutter={[16, 16]}>
          <Col span={12}>
            <Descriptions column={1} size="small">
              <Descriptions.Item label="总人数">
                <Tag color="blue">{assignment.totalPeople}人</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="成人数量">
                {assignment.adultCount}人
              </Descriptions.Item>
              <Descriptions.Item label="儿童数量">
                {assignment.childCount}人
              </Descriptions.Item>
            </Descriptions>
          </Col>
          <Col span={12}>
            <Descriptions column={1} size="small">
              <Descriptions.Item label="联系人">
                {assignment.contactPerson}
              </Descriptions.Item>
              <Descriptions.Item label="联系电话">
                <PhoneOutlined style={{ marginRight: 4 }} />
                {assignment.contactPhone}
              </Descriptions.Item>
              <Descriptions.Item label="紧急联系人">
                {assignment.emergencyContact || '无'}
              </Descriptions.Item>
            </Descriptions>
          </Col>
        </Row>
      </Card>

      {/* 行程信息 */}
      <Card 
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <EnvironmentOutlined />
            <span>行程信息</span>
          </div>
        }
        style={{ marginBottom: 16 }}
      >
        <Descriptions column={2} size="small">
          <Descriptions.Item label="接送方式">
            {pickupMethodMap[assignment.pickupMethod] || assignment.pickupMethod || '未指定'}
          </Descriptions.Item>
          <Descriptions.Item label="接送地点">
            {assignment.pickupLocation || '无'}
          </Descriptions.Item>
          <Descriptions.Item label="结束地点">
            {assignment.dropoffLocation || '无'}
          </Descriptions.Item>
          <Descriptions.Item label="行李信息">
            {assignment.luggageInfo || '无特殊要求'}
          </Descriptions.Item>
        </Descriptions>
      </Card>

      {/* 特殊需求 */}
      <Card 
        title="特殊需求"
        style={{ marginBottom: 16 }}
      >
        <Descriptions column={1} size="small">
          <Descriptions.Item label="特殊要求">
            <div style={{ whiteSpace: 'pre-wrap' }}>
              {assignment.specialRequirements || '无'}
            </div>
          </Descriptions.Item>
          <Descriptions.Item label="饮食限制">
            <div style={{ whiteSpace: 'pre-wrap' }}>
              {assignment.dietaryRestrictions || '无'}
            </div>
          </Descriptions.Item>
          <Descriptions.Item label="备注">
            <div style={{ whiteSpace: 'pre-wrap' }}>
              {assignment.remarks || '无'}
            </div>
          </Descriptions.Item>
        </Descriptions>
      </Card>

      {/* 订单和乘客详情 */}
      {(assignment.bookingIds?.length > 0 || assignment.passengerDetails?.length > 0) && (
        <Card title="订单和乘客详情">
          <Row gutter={16}>
            {assignment.bookingIds?.length > 0 && (
              <Col span={12}>
                <Descriptions column={1} size="small">
                  <Descriptions.Item label="关联订单ID">
                    {assignment.bookingIds.map(id => (
                      <Tag key={id} color="geekblue" style={{ margin: '2px' }}>
                        {id}
                      </Tag>
                    ))}
                  </Descriptions.Item>
                </Descriptions>
              </Col>
            )}
            {assignment.tourScheduleOrderIds?.length > 0 && (
              <Col span={12}>
                <Descriptions column={1} size="small">
                  <Descriptions.Item label="行程订单ID">
                    {assignment.tourScheduleOrderIds.map(id => (
                      <Tag key={id} color="purple" style={{ margin: '2px' }}>
                        {id}
                      </Tag>
                    ))}
                  </Descriptions.Item>
                </Descriptions>
              </Col>
            )}
          </Row>
          
          {assignment.passengerDetails?.length > 0 && (
            <>
              <Divider orientation="left">乘客详情</Divider>
              <div style={{ background: '#fafafa', padding: '12px', borderRadius: '6px' }}>
                <pre style={{ margin: 0, whiteSpace: 'pre-wrap', fontFamily: 'inherit' }}>
                  {JSON.stringify(assignment.passengerDetails, null, 2)}
                </pre>
              </div>
            </>
          )}
        </Card>
      )}
    </div>
  );
};

export default AssignmentDetail; 