import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Card, Descriptions, Button, Tag, Divider, 
  Spin, Row, Col, Table, message, Modal, Space, Input 
} from 'antd';
import {
  getOrderById, confirmOrder, 
  cancelOrder, completeOrder, updateOrder
} from '../../apis/orderApi';
import { formatDateValue } from '../../utils/dateTimeFormat';
import OrderStatusUpdate from './OrderStatusUpdate';

// 订单状态标签颜色映射
const statusColors = {
  pending: 'orange',
  confirmed: 'blue',
  cancelled: 'red',
  completed: 'green'
};

// 支付状态标签颜色映射
const paymentStatusColors = {
  unpaid: 'red',
  partial: 'orange',
  paid: 'green'
};

const OrderDetail = () => {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [orderData, setOrderData] = useState(null);
  const [statusModalVisible, setStatusModalVisible] = useState(false);
  const [statusUpdateData, setStatusUpdateData] = useState({
    status: '',
    remark: ''
  });
  const [paymentModalVisible, setPaymentModalVisible] = useState(false);
  const [paymentUpdateData, setPaymentUpdateData] = useState({
    paymentStatus: '',
    remark: ''
  });

  // 初始加载
  useEffect(() => {
    if (bookingId) {
      fetchOrderDetail();
    }
  }, [bookingId]);

  // 获取订单详情
  const fetchOrderDetail = async () => {
    try {
      setLoading(true);
      console.log('===== 发送请求获取订单详情 =====', bookingId);
      
      const response = await getOrderById(bookingId);
      
      console.log('===== 接收到的完整响应 =====', JSON.stringify(response));
      
      if (response.code === 1) {
        // 添加日志，查看接收到的数据
        console.log('===== 订单详情数据 =====', response.data);
        
        // 检查乘客数据
        if (response.data && response.data.passengers) {
          console.log('===== 乘客数据 =====', response.data.passengers);
          console.log('===== 乘客数量 =====', response.data.passengers.length);
          console.log('===== 订单显示成人数量 =====', response.data.adultCount);
          console.log('===== 订单显示儿童数量 =====', response.data.childCount);
          
          response.data.passengers.forEach((passenger, index) => {
            console.log(`乘客 ${index + 1} (ID:${passenger.passengerId}):`, {
              fullName: passenger.fullName,
              phone: passenger.phone, 
              phoneNumber: passenger.phoneNumber,
              wechatId: passenger.wechatId,
              wechat: passenger.wechat,
              wechat_id: passenger.wechat_id,
              // 输出所有属性以查看具体结构
              allProps: Object.keys(passenger).map(key => `${key}: ${passenger[key]}`)
            });
          });
          
          // 检查是否有明显问题
          if (response.data.passengers.length < (response.data.adultCount + response.data.childCount)) {
            console.warn('警告: 乘客数据不完整 - 数据库记录显示应有更多乘客');
          }
        } else {
          console.log('没有乘客数据或数据格式不正确');
        }
        
        setOrderData(response.data);
      } else {
        message.error(response.msg || '获取订单详情失败');
      }
    } catch (error) {
      console.error('获取订单详情出错:', error);
      message.error('获取订单详情失败');
    } finally {
      setLoading(false);
    }
  };

  // 打印订单
  const handlePrint = () => {
    window.print();
  };

  // 打开订单状态更新弹窗
  const showStatusModal = (status) => {
    // 直接打开状态更新组件，不需要单独设置statusUpdateData
    setStatusModalVisible(true);
  };

  // 打开支付状态更新弹窗
  const showPaymentModal = (paymentStatus) => {
    setPaymentUpdateData({ paymentStatus, remark: '' });
    setPaymentModalVisible(true);
  };

  // 更新订单状态
  const updateOrderStatus = async () => {
    try {
      const response = await updateOrder(bookingId, {
        status: statusUpdateData.status,
        remark: statusUpdateData.remark
      });
      
      if (response.code === 1) {
        message.success('订单状态更新成功');
        setStatusModalVisible(false);
        fetchOrderDetail();
      } else {
        message.error(response.msg || '订单状态更新失败');
      }
    } catch (error) {
      console.error('更新订单状态出错:', error);
      message.error('订单状态更新失败');
    }
  };

  // 更新支付状态
  const updatePaymentStatus = async () => {
    try {
      const response = await updateOrder(bookingId, {
        paymentStatus: paymentUpdateData.paymentStatus,
        remark: paymentUpdateData.remark
      });
      
      if (response.code === 1) {
        message.success('支付状态更新成功');
        setPaymentModalVisible(false);
        fetchOrderDetail();
      } else {
        message.error(response.msg || '支付状态更新失败');
      }
    } catch (error) {
      console.error('更新支付状态出错:', error);
      message.error('支付状态更新失败');
    }
  };

  // 查看用户/代理商所有订单
  const viewUserOrders = (userType, id) => {
    if (!id) return;
    
    // 生成一个包含用户筛选参数的URL
    const params = new URLSearchParams();
    if (userType === 'agent') {
      params.append('agentId', id);
    } else {
      params.append('userId', id);
    }
    
    // 导航到订单列表并传递筛选参数
    navigate(`/orders?${params.toString()}`);
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Spin size="large" tip="加载订单详情..." spinning={loading} />
      </div>
    );
  }

  if (!orderData) {
    return (
      <Card variant="bordered" title="订单详情">
        <div style={{ textAlign: 'center', padding: '50px' }}>
          订单不存在或已被删除
          <Button 
            type="primary" 
            style={{ marginLeft: 16 }}
            onClick={() => navigate('/orders')}
          >
            返回订单列表
          </Button>
        </div>
      </Card>
    );
  }

  // 订单状态和支付状态中文映射
  const statusMap = {
    pending: '待确认',
    confirmed: '已确认',
    cancelled: '已取消',
    completed: '已完成'
  };

  const paymentStatusMap = {
    unpaid: '未支付',
    partial: '部分支付',
    paid: '已支付'
  };

  // 旅行类型中文映射
  const tourTypeMap = {
    day_tour: '日游',
    group_tour: '团体游'
  };

  // 判断可执行的操作按钮
  const isPending = orderData.status === 'pending';
  const isConfirmed = orderData.status === 'confirmed';
  const isPaid = orderData.paymentStatus === 'paid';

  // 乘客列表的列定义
  const passengerColumns = [
    {
      title: '姓名',
      dataIndex: 'fullName',
      key: 'fullName',
    },
    {
      title: '性别',
      dataIndex: 'gender',
      key: 'gender',
      render: (text) => {
        const genderMap = {
          male: '男',
          female: '女',
          other: '其他'
        };
        return genderMap[text] || text;
      }
    },
    {
      title: '出生日期',
      dataIndex: 'dateOfBirth',
      key: 'dateOfBirth',
      render: (text) => formatDateValue(text) || '-'
    },
    {
      title: '类型',
      dataIndex: 'isChild',
      key: 'isChild',
      render: (isChild) => isChild ? '儿童' : '成人'
    },
    {
      title: '护照号',
      dataIndex: 'passportNumber',
      key: 'passportNumber',
      render: (text) => text || '-'
    },
    {
      title: '联系电话',
      dataIndex: 'phone',
      key: 'phone',
      render: (text, record) => {
        // 尝试从多个可能的字段获取联系电话信息
        const phone = record.phone || record.phoneNumber || record.contactPhone || (orderData && orderData.contactPhone) || '-';
        return phone;
      }
    },
    {
      title: '微信ID',
      dataIndex: 'wechatId',
      key: 'wechatId',
      render: (text, record) => {
        // 尝试从多个可能的字段获取微信ID
        const wechatId = record.wechatId || record.wechat_id || record.wechat || '-';
        return wechatId;
      }
    }
  ];

  return (
    <div className="order-detail-container">
      <Card 
        title="订单详情" 
        variant="bordered"
        extra={
          <Button type="primary" onClick={() => navigate('/orders')}>
            返回订单列表
          </Button>
        }
      >
        {/* 订单基本信息 */}
        <Descriptions 
          title="基本信息" 
          bordered 
          column={{ xxl: 4, xl: 3, lg: 3, md: 2, sm: 1, xs: 1 }}
        >
          <Descriptions.Item label="订单号">{orderData.orderNumber}</Descriptions.Item>
          <Descriptions.Item label="订单状态">
            <Tag color={statusColors[orderData.status] || 'default'}>
              {statusMap[orderData.status] || orderData.status}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="支付状态">
            <Tag color={paymentStatusColors[orderData.paymentStatus] || 'default'}>
              {paymentStatusMap[orderData.paymentStatus] || orderData.paymentStatus}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="总价格">¥{orderData.totalPrice}</Descriptions.Item>
          <Descriptions.Item label="旅行类型">
            {tourTypeMap[orderData.tourType] || orderData.tourType}
          </Descriptions.Item>
          <Descriptions.Item label="旅行名称" span={2}>
            {orderData.tourName}
          </Descriptions.Item>
          
          <Descriptions.Item label="用户信息">
            {orderData.agentId 
              ? (
                <Button 
                  type="link" 
                  onClick={() => viewUserOrders('agent', orderData.agentId)}
                  style={{ padding: 0 }}
                >
                  代理商: {orderData.agentName || orderData.agentId}
                </Button>
              ) 
              : (
                <Button 
                  type="link" 
                  onClick={() => viewUserOrders('user', orderData.userId)}
                  style={{ padding: 0 }}
                >
                  用户: {orderData.userName || orderData.userId}
                </Button>
              )}
          </Descriptions.Item>
          
          <Descriptions.Item label="预订日期">
            {formatDateValue(orderData.bookingDate)}
          </Descriptions.Item>
          <Descriptions.Item label="开始日期">
            {formatDateValue(orderData.tourStartDate)}
          </Descriptions.Item>
          <Descriptions.Item label="结束日期">
            {formatDateValue(orderData.tourEndDate)}
          </Descriptions.Item>
        </Descriptions>

        <Divider />

        {/* 联系人信息 */}
        <Descriptions 
          title="联系人信息" 
          bordered 
          column={{ xxl: 4, xl: 3, lg: 3, md: 2, sm: 1, xs: 1 }}
        >
          <Descriptions.Item label="联系人">{orderData.contactPerson}</Descriptions.Item>
          <Descriptions.Item label="联系电话">{orderData.contactPhone}</Descriptions.Item>
          <Descriptions.Item label="团队人数">{orderData.groupSize || '-'}</Descriptions.Item>
          <Descriptions.Item label="行李数量">{orderData.luggageCount || '-'}</Descriptions.Item>
          <Descriptions.Item label="成人数量">{orderData.adultCount || '-'}</Descriptions.Item>
          <Descriptions.Item label="儿童数量">{orderData.childCount || '-'}</Descriptions.Item>
        </Descriptions>

        <Divider />

        {/* 乘客信息 */}
        {orderData.passengers && orderData.passengers.length > 0 && (
          <>
            <h3>乘客信息</h3>
            {orderData.passengers.length < (orderData.adultCount + orderData.childCount) && (
              <div style={{ marginBottom: 16, color: '#ff4d4f' }}>
                注意：系统中只有{orderData.passengers.length}个乘客信息，而订单显示共有{orderData.adultCount + orderData.childCount}位乘客（{orderData.adultCount}位成人，{orderData.childCount}位儿童）。部分乘客信息可能缺失。
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
              <div></div>
              <Button
                type="primary"
                onClick={() => {
                  // 打开状态更新弹窗，默认切换到乘客选项卡
                  setStatusModalVisible(true);
                  // 提示用户如何编辑乘客信息
                  message.info('请切换到"乘客信息"选项卡编辑乘客信息');
                }}
              >
                编辑乘客信息
              </Button>
            </div>
            <Table 
              dataSource={orderData.passengers}
              columns={passengerColumns}
              rowKey="passengerId"
              pagination={false}
              style={{ marginBottom: 24 }}
            />
            <Divider />
          </>
        )}

        {/* 服务信息 */}
        <Descriptions 
          title="服务信息" 
          bordered 
          column={{ xxl: 4, xl: 3, lg: 3, md: 2, sm: 1, xs: 1 }}
        >
          <Descriptions.Item label="航班号">{orderData.flightNumber || '-'}</Descriptions.Item>
          <Descriptions.Item label="返程航班号">{orderData.returnFlightNumber || '-'}</Descriptions.Item>
          <Descriptions.Item label="接机日期">
            {formatDateValue(orderData.pickupDate)}
          </Descriptions.Item>
          <Descriptions.Item label="送机日期">
            {formatDateValue(orderData.dropoffDate)}
          </Descriptions.Item>
          <Descriptions.Item label="接机地点">{orderData.pickupLocation || '-'}</Descriptions.Item>
          <Descriptions.Item label="送机地点">{orderData.dropoffLocation || '-'}</Descriptions.Item>
          <Descriptions.Item label="服务类型" span={2}>{orderData.serviceType || '-'}</Descriptions.Item>
        </Descriptions>

        <Divider />

        {/* 住宿信息 */}
        <Descriptions 
          title="住宿信息" 
          bordered 
          column={{ xxl: 4, xl: 3, lg: 3, md: 2, sm: 1, xs: 1 }}
        >
          <Descriptions.Item label="酒店级别">{orderData.hotelLevel || '-'}</Descriptions.Item>
          <Descriptions.Item label="房间类型">{orderData.roomType || '-'}</Descriptions.Item>
          <Descriptions.Item label="房间数量">{orderData.hotelRoomCount || '-'}</Descriptions.Item>
          <Descriptions.Item label="房间详情" span={3}>{orderData.roomDetails || '-'}</Descriptions.Item>
        </Descriptions>

        <Divider />

        {/* 其他信息 */}
        <Descriptions 
          title="其他信息" 
          bordered 
          column={{ xxl: 4, xl: 3, lg: 3, md: 2, sm: 1, xs: 1 }}
        >
          <Descriptions.Item label="特殊要求" span={4}>{orderData.specialRequests || '-'}</Descriptions.Item>
          <Descriptions.Item label="创建时间">
            {formatDateValue(orderData.createdAt, 'YYYY-MM-DD HH:mm:ss')}
          </Descriptions.Item>
          <Descriptions.Item label="更新时间">
            {formatDateValue(orderData.updatedAt, 'YYYY-MM-DD HH:mm:ss')}
          </Descriptions.Item>
        </Descriptions>

        {/* 操作按钮 */}
        <Row justify="center" style={{ marginTop: 24 }}>
          <Col>
            <Space size="middle">
              {isPending && (
                <Button type="primary" onClick={() => showStatusModal('confirmed')}>
                  确认订单
                </Button>
              )}
              {(isPending || isConfirmed) && (
                <Button danger onClick={() => showStatusModal('cancelled')}>
                  取消订单
                </Button>
              )}
              {isConfirmed && isPaid && (
                <Button type="primary" onClick={() => showStatusModal('completed')}>
                  完成订单
                </Button>
              )}
              <Button onClick={() => navigate(`/orders/edit/${bookingId}`)}>
                编辑订单
              </Button>
              <Button onClick={handlePrint}>
                打印订单
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* 订单状态更新弹窗 */}
      <OrderStatusUpdate
        visible={statusModalVisible}
        onCancel={() => setStatusModalVisible(false)}
        onSuccess={() => {
          setStatusModalVisible(false);
          fetchOrderDetail(); // 重新加载订单数据
        }}
        bookingId={bookingId}
        currentStatus={orderData?.status}
        currentPaymentStatus={orderData?.paymentStatus}
        className="order-status-modal"
      />

      {/* 支付状态更新弹窗 */}
      <Modal
        title="更新支付状态"
        open={paymentModalVisible}
        onOk={updatePaymentStatus}
        onCancel={() => setPaymentModalVisible(false)}
      >
        <div style={{ marginBottom: 16 }}>
          <p>订单号: {orderData?.orderNumber}</p>
          <p>
            支付状态将从 
            <Tag color={paymentStatusColors[orderData?.paymentStatus] || 'default'} style={{ margin: '0 8px' }}>
              {paymentStatusMap[orderData?.paymentStatus] || orderData?.paymentStatus}
            </Tag> 
            更新为 
            <Tag color={paymentStatusColors[paymentUpdateData.paymentStatus] || 'default'} style={{ margin: '0 8px' }}>
              {paymentStatusMap[paymentUpdateData.paymentStatus] || paymentUpdateData.paymentStatus}
            </Tag>
          </p>
        </div>
        <Input.TextArea
          placeholder="添加支付备注"
          value={paymentUpdateData.remark}
          onChange={(e) => setPaymentUpdateData({ ...paymentUpdateData, remark: e.target.value })}
          rows={4}
        />
      </Modal>
    </div>
  );
};

export default OrderDetail; 