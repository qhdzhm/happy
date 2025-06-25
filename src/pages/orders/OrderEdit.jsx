import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Card, Form, Input, Select, DatePicker, 
  Button, Spin, InputNumber, message, Row, Col, Space 
} from 'antd';
import moment from 'moment';
import { getOrderById, updateOrder } from '../../apis/orderApi';

const { Option } = Select;
const { TextArea } = Input;
const { RangePicker } = DatePicker;

const OrderEdit = () => {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // 获取订单详情
  useEffect(() => {
    const fetchOrderDetail = async () => {
      try {
        setLoading(true);
        const response = await getOrderById(bookingId);
        
        if (response.code === 1) {
          // 处理日期格式
          const orderData = response.data;
          const formattedData = {
            ...orderData,
            bookingDate: orderData.bookingDate ? moment(orderData.bookingDate) : null,
            tourStartDate: orderData.tourStartDate ? moment(orderData.tourStartDate) : null,
            tourEndDate: orderData.tourEndDate ? moment(orderData.tourEndDate) : null,
            pickupDate: orderData.pickupDate ? moment(orderData.pickupDate) : null,
            dropoffDate: orderData.dropoffDate ? moment(orderData.dropoffDate) : null,
          };
          form.setFieldsValue(formattedData);
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

    if (bookingId) {
      fetchOrderDetail();
    }
  }, [bookingId, form]);

  // 提交表单
  const handleSubmit = async (values) => {
    try {
      setSubmitting(true);
      
      // 处理日期字段格式
      const submitData = {
        ...values,
        bookingDate: values.bookingDate ? values.bookingDate.format('YYYY-MM-DD') : null,
        tourStartDate: values.tourStartDate ? values.tourStartDate.format('YYYY-MM-DD') : null,
        tourEndDate: values.tourEndDate ? values.tourEndDate.format('YYYY-MM-DD') : null,
        pickupDate: values.pickupDate ? values.pickupDate.format('YYYY-MM-DD') : null,
        dropoffDate: values.dropoffDate ? values.dropoffDate.format('YYYY-MM-DD') : null,
      };
      
      const response = await updateOrder(bookingId, submitData);
      
      if (response.code === 1) {
        message.success('订单更新成功');
        navigate(`/orders/detail/${bookingId}`);
      } else {
        message.error(response.msg || '订单更新失败');
      }
    } catch (error) {
      console.error('更新订单出错:', error);
      message.error('订单更新失败');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Spin size="large" tip="加载订单数据..." />
      </div>
    );
  }

  return (
    <Card 
      title="编辑订单" 
      variant="bordered"
      extra={
        <Button type="primary" onClick={() => navigate(`/orders/detail/${bookingId}`)}>
          返回订单详情
        </Button>
      }
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        initialValues={{
          status: 'pending',
          paymentStatus: 'unpaid',
          tourType: 'day_tour'
        }}
      >
        <Row gutter={24}>
          <Col span={8}>
            <Form.Item
              name="orderNumber"
              label="订单号"
              rules={[{ required: true, message: '请输入订单号' }]}
            >
              <Input disabled />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              name="status"
              label="订单状态"
              rules={[{ required: true, message: '请选择订单状态' }]}
            >
              <Select>
                <Option value="pending">待确认</Option>
                <Option value="confirmed">已确认</Option>
                <Option value="cancelled">已取消</Option>
                <Option value="completed">已完成</Option>
              </Select>
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              name="paymentStatus"
              label="支付状态"
              rules={[{ required: true, message: '请选择支付状态' }]}
            >
              <Select>
                <Option value="unpaid">未支付</Option>
                <Option value="partial">部分支付</Option>
                <Option value="paid">已支付</Option>
              </Select>
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={24}>
          <Col span={8}>
            <Form.Item
              name="tourType"
              label="旅行类型"
              rules={[{ required: true, message: '请选择旅行类型' }]}
            >
              <Select>
                <Option value="day_tour">日游</Option>
                <Option value="group_tour">团体游</Option>
              </Select>
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              name="tourId"
              label="旅行ID"
              rules={[{ required: true, message: '请输入旅行ID' }]}
            >
              <InputNumber style={{ width: '100%' }} min={1} disabled />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              name="bookingDate"
              label="预订日期"
              rules={[{ required: true, message: '请选择预订日期' }]}
            >
              <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={24}>
          <Col span={12}>
            <Form.Item
              name="tourStartDate"
              label="开始日期"
              rules={[{ required: true, message: '请选择开始日期' }]}
            >
              <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="tourEndDate"
              label="结束日期"
              rules={[{ required: true, message: '请选择结束日期' }]}
            >
              <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" />
            </Form.Item>
          </Col>
        </Row>

        <h3>联系人信息</h3>
        <Row gutter={24}>
          <Col span={8}>
            <Form.Item
              name="contactPerson"
              label="联系人"
              rules={[{ required: true, message: '请输入联系人' }]}
            >
              <Input />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              name="contactPhone"
              label="联系电话"
              rules={[{ required: true, message: '请输入联系电话' }]}
            >
              <Input />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              name="passengerContact"
              label="乘客联系方式"
            >
              <Input />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={24}>
          <Col span={8}>
            <Form.Item
              name="groupSize"
              label="团队人数"
              rules={[{ required: true, message: '请输入团队人数' }]}
            >
              <InputNumber style={{ width: '100%' }} min={1} />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              name="luggageCount"
              label="行李数量"
            >
              <InputNumber style={{ width: '100%' }} min={0} />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              name="totalPrice"
              label="总价格"
              rules={[{ required: true, message: '请输入总价格' }]}
            >
              <InputNumber 
                style={{ width: '100%' }} 
                min={0} 
                precision={2}
                            formatter={value => `$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
            parser={value => value.replace(/\$\s?|(,*)/g, '')}
              />
            </Form.Item>
          </Col>
        </Row>

        <h3>交通信息</h3>
        <Row gutter={24}>
          <Col span={12}>
            <Form.Item
              name="flightNumber"
              label="航班号"
            >
              <Input />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="returnFlightNumber"
              label="返程航班号"
            >
              <Input />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={24}>
          <Col span={12}>
            <Form.Item
              name="pickupDate"
              label="接机日期"
            >
              <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="dropoffDate"
              label="送机日期"
            >
              <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={24}>
          <Col span={12}>
            <Form.Item
              name="pickupLocation"
              label="接机地点"
            >
              <Input />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="dropoffLocation"
              label="送机地点"
            >
              <Input />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item
          name="serviceType"
          label="服务类型"
        >
          <Input />
        </Form.Item>

        <h3>住宿信息</h3>
        <Row gutter={24}>
          <Col span={8}>
            <Form.Item
              name="hotelLevel"
              label="酒店级别"
            >
              <Input />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              name="roomType"
              label="房间类型"
            >
              <Input />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              name="hotelRoomCount"
              label="房间数量"
            >
              <InputNumber style={{ width: '100%' }} min={0} />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item
          name="roomDetails"
          label="房间详情"
        >
          <TextArea rows={3} />
        </Form.Item>

        <h3>其他信息</h3>
        <Form.Item
          name="specialRequests"
          label="特殊要求"
        >
          <TextArea rows={3} />
        </Form.Item>

        <Form.Item
          name="itineraryDetails"
          label="行程详情"
        >
          <TextArea rows={3} />
        </Form.Item>

        <Form.Item>
          <Space>
            <Button type="primary" htmlType="submit" loading={submitting}>
              保存
            </Button>
            <Button onClick={() => navigate(`/orders/detail/${bookingId}`)}>
              取消
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </Card>
  );
};

export default OrderEdit; 