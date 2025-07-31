import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Card, Button, Descriptions, Form, InputNumber, Input, 
  message, Spin, Alert, Modal, Divider, Tag
} from 'antd';
import { CheckCircleOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import { getOrderById, confirmOrderByAdmin } from '../../apis/orderApi';
import { formatDateValue } from '../../utils/dateTimeFormat';

const { TextArea } = Input;

const OrderConfirm = () => {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState(false);
  const [orderData, setOrderData] = useState(null);
  const [showPriceAdjustment, setShowPriceAdjustment] = useState(false);

  // 获取订单详情
  useEffect(() => {
    fetchOrderDetail();
  }, [bookingId]);

  const fetchOrderDetail = async () => {
    try {
      setLoading(true);
      const response = await getOrderById(bookingId);
      if (response.code === 1) {
        setOrderData(response.data);
        
        // 检查订单状态
        if (response.data.status !== 'pending') {
          message.warning('该订单已经确认过了');
        }
        
        // 检查特殊要求中是否包含"提前到达"等需要额外处理的内容
        if (response.data.specialRequests && 
            (response.data.specialRequests.includes('提前') || 
             response.data.specialRequests.includes('额外') ||
             response.data.specialRequests.includes('住宿'))) {
          setShowPriceAdjustment(true);
        }
      } else {
        message.error(response.msg || '获取订单详情失败');
        navigate('/orders');
      }
    } catch (error) {
      console.error('获取订单详情失败:', error);
      message.error('获取订单详情失败');
    } finally {
      setLoading(false);
    }
  };

  // 确认订单
  const handleConfirm = async (values) => {
    try {
      setConfirming(true);
      
      const { adjustedPrice, adjustmentReason } = values;
      
      const response = await confirmOrderByAdmin(
        bookingId, 
        adjustedPrice, 
        adjustmentReason
      );
      
      if (response.code === 1) {
        message.success('订单确认成功！确认单已发送给客户');
        navigate('/orders');
      } else {
        message.error(response.msg || '订单确认失败');
      }
    } catch (error) {
      console.error('确认订单失败:', error);
      message.error('确认订单失败');
    } finally {
      setConfirming(false);
    }
  };

  // 取消确认
  const handleCancel = () => {
    navigate('/orders');
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!orderData) {
    return (
      <Alert 
        message="订单不存在" 
        type="error" 
        style={{ margin: '20px' }}
      />
    );
  }

  const isAlreadyConfirmed = orderData.status !== 'pending';

  return (
    <div style={{ padding: '20px' }}>
      {/* 页面标题 */}
      <Card
        title={
          <div>
            <CheckCircleOutlined style={{ color: '#52c41a', marginRight: 8 }} />
            确认订单 - {orderData.orderNumber}
          </div>
        }
        extra={
          <Button onClick={handleCancel}>
            返回订单列表
          </Button>
        }
      >
        {/* 状态提示 */}
        {isAlreadyConfirmed && (
          <Alert
            message="该订单已经确认过了"
            description="此订单状态已经是确认状态，无需重复确认"
            type="info"
            showIcon
            style={{ marginBottom: 16 }}
          />
        )}

        {/* 订单基本信息 */}
        <Descriptions title="订单基本信息" bordered column={2}>
          <Descriptions.Item label="订单号">
            {orderData.orderNumber}
          </Descriptions.Item>
          <Descriptions.Item label="当前状态">
            <Tag color={orderData.status === 'pending' ? 'orange' : 'green'}>
              {orderData.status === 'pending' ? '待确认' : '已确认'}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="旅游产品">
            {orderData.tourName || `${orderData.tourType} (ID: ${orderData.tourId})`}
          </Descriptions.Item>
          <Descriptions.Item label="预订日期">
            {formatDateValue(orderData.bookingDate)}
          </Descriptions.Item>
          <Descriptions.Item label="出行日期">
            {formatDateValue(orderData.tourStartDate)} 至 {formatDateValue(orderData.tourEndDate)}
          </Descriptions.Item>
          <Descriptions.Item label="人数">
            成人 {orderData.adultCount || 0} 人，儿童 {orderData.childCount || 0} 人
          </Descriptions.Item>
          <Descriptions.Item label="联系人">
            {orderData.contactPerson}
          </Descriptions.Item>
          <Descriptions.Item label="联系电话">
            {orderData.contactPhone}
          </Descriptions.Item>
          <Descriptions.Item label="当前总价" span={2}>
            <span style={{ fontSize: 18, fontWeight: 'bold', color: '#1890ff' }}>
              ${orderData.totalPrice}
            </span>
          </Descriptions.Item>
        </Descriptions>

        {/* 特殊要求 */}
        {orderData.specialRequests && (
          <>
            <Divider orientation="left">特殊要求</Divider>
            <Alert
              message="客户特殊要求"
              description={orderData.specialRequests}
              type="warning"
              showIcon
              style={{ marginBottom: 16 }}
            />
          </>
        )}

        {/* 确认表单 */}
        {!isAlreadyConfirmed && (
          <>
            <Divider orientation="left">订单确认</Divider>
            
            <Form
              form={form}
              layout="vertical"
              onFinish={handleConfirm}
            >
              {/* 价格调整 */}
              <Card 
                title="价格调整 (可选)" 
                type="inner"
                style={{ marginBottom: 16 }}
                extra={
                  <Button 
                    type="link" 
                    onClick={() => setShowPriceAdjustment(!showPriceAdjustment)}
                  >
                    {showPriceAdjustment ? '隐藏' : '显示'}价格调整
                  </Button>
                }
              >
                {showPriceAdjustment && (
                  <>
                    <Form.Item
                      label="调整后价格"
                      name="adjustedPrice"
                      rules={[
                        {
                          type: 'number',
                          min: 0,
                          message: '调整后价格必须大于等于0'
                        }
                      ]}
                    >
                      <InputNumber
                        style={{ width: '100%' }}
                        placeholder={`当前价格: $${orderData.totalPrice}`}
                        prefix="$"
                        precision={2}
                        step={0.01}
                      />
                    </Form.Item>

                    <Form.Item
                      label="价格调整原因"
                      name="adjustmentReason"
                    >
                      <TextArea
                        rows={3}
                        placeholder="请输入价格调整的原因，如：提前到达需要额外住宿一晚，增加$120"
                      />
                    </Form.Item>
                  </>
                )}
              </Card>

              {/* 确认按钮 */}
              <Form.Item>
                <div style={{ textAlign: 'center' }}>
                  <Button 
                    type="primary" 
                    htmlType="submit" 
                    size="large"
                    loading={confirming}
                    icon={<CheckCircleOutlined />}
                    style={{ marginRight: 16 }}
                  >
                    确认订单并发送确认单
                  </Button>
                  
                  <Button 
                    size="large" 
                    onClick={handleCancel}
                  >
                    取消
                  </Button>
                </div>
              </Form.Item>
            </Form>
          </>
        )}
      </Card>
    </div>
  );
};

export default OrderConfirm; 