import React from 'react';
import { Modal, List, Typography, Tag, Card, Space, Divider, Empty } from 'antd';
import { CalendarOutlined, UserOutlined, PhoneOutlined, EnvironmentOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

const SearchResultModal = ({ visible, onCancel, searchResults, searchType, searchKeyword }) => {
  // 按订单分组数据
  const groupDataByOrder = (data) => {
    const orderMap = new Map();
    
    data.forEach(item => {
      const orderId = item.bookingId;
      if (!orderMap.has(orderId)) {
        orderMap.set(orderId, {
          bookingId: orderId,
          orderNumber: item.orderNumber,
          contactPerson: item.contactPerson,
          contactPhone: item.contactPhone,
          adultCount: item.adultCount,
          childCount: item.childCount,
          schedules: []
        });
      }
      orderMap.get(orderId).schedules.push(item);
    });
    
    // 按订单号排序
    return Array.from(orderMap.values()).sort((a, b) => 
      (a.orderNumber || '').localeCompare(b.orderNumber || '')
    );
  };

  // 按日期排序行程
  const sortSchedulesByDate = (schedules) => {
    return schedules.sort((a, b) => {
      const dateA = dayjs(a.tourDate);
      const dateB = dayjs(b.tourDate);
      return dateA.isBefore(dateB) ? -1 : (dateA.isAfter(dateB) ? 1 : 0);
    });
  };

  const groupedData = groupDataByOrder(searchResults);

  return (
    <Modal
      title={
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <CalendarOutlined style={{ marginRight: 8, color: '#1890ff' }} />
          行程搜索结果
          <Tag color="blue" style={{ marginLeft: 12 }}>
            {searchType === 'orderNumber' ? '订单号' : '联系人'}搜索: {searchKeyword}
          </Tag>
        </div>
      }
      open={visible}
      onCancel={onCancel}
      footer={null}
      width={800}
      style={{ top: 20 }}
      bodyStyle={{ maxHeight: '70vh', overflow: 'auto' }}
    >
      {groupedData.length === 0 ? (
        <Empty 
          description={`未找到与"${searchKeyword}"相关的行程安排`}
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        />
      ) : (
        <div>
          <div style={{ marginBottom: 16, color: '#666' }}>
            共找到 {groupedData.length} 个订单，{searchResults.length} 条行程记录
          </div>
          
          {groupedData.map((order, orderIndex) => (
            <Card
              key={order.bookingId}
              size="small"
              style={{ marginBottom: 16 }}
              title={
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <Text strong>订单号: {order.orderNumber || '未知'}</Text>
                  </div>
                  <Space>
                    <Tag color="green">
                      <UserOutlined /> {order.contactPerson || '未知联系人'}
                    </Tag>
                    <Tag color="blue">
                      <PhoneOutlined /> {order.contactPhone || '未知电话'}
                    </Tag>
                    <Tag color="orange">
                      {(order.adultCount || 0) + (order.childCount || 0)} 人
                    </Tag>
                  </Space>
                </div>
              }
            >
              <List
                dataSource={sortSchedulesByDate(order.schedules)}
                renderItem={(schedule, index) => (
                  <List.Item key={`${schedule.id}-${index}`}>
                    <List.Item.Meta
                      avatar={
                        <div 
                          style={{
                            width: 40,
                            height: 40,
                            borderRadius: '50%',
                            background: schedule.color || '#1890ff',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#fff',
                            fontWeight: 'bold',
                            fontSize: '12px'
                          }}
                        >
                          第{schedule.dayNumber || '?'}天
                        </div>
                      }
                      title={
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <Text strong>{dayjs(schedule.tourDate).format('YYYY-MM-DD')}</Text>
                          <Text style={{ color: '#666' }}>({dayjs(schedule.tourDate).format('dddd')})</Text>
                        </div>
                      }
                      description={
                        <div>
                          <div style={{ marginBottom: 4 }}>
                            <EnvironmentOutlined style={{ marginRight: 4, color: '#1890ff' }} />
                            <Text strong>{schedule.title || '待安排'}</Text>
                          </div>
                          {schedule.description && (
                            <div style={{ color: '#666', fontSize: '12px' }}>
                              {schedule.description}
                            </div>
                          )}
                          {(schedule.pickupLocation || schedule.dropoffLocation) && (
                            <div style={{ marginTop: 4, fontSize: '12px', color: '#666' }}>
                              {schedule.pickupLocation && `接: ${schedule.pickupLocation}`}
                              {schedule.pickupLocation && schedule.dropoffLocation && ' | '}
                              {schedule.dropoffLocation && `送: ${schedule.dropoffLocation}`}
                            </div>
                          )}
                        </div>
                      }
                    />
                  </List.Item>
                )}
              />
            </Card>
          ))}
        </div>
      )}
    </Modal>
  );
};

export default SearchResultModal; 