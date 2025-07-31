import React, { useState, useEffect } from 'react';
import { Modal, Form, Select, DatePicker, TimePicker, Input, Radio, Row, Col, message, Divider, Card, Space, Tag } from 'antd';
import { CarOutlined, HomeOutlined, EnvironmentOutlined, ClockCircleOutlined, UserOutlined, PhoneOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { getAvailableDayTours } from '../../../api/tourSchedule';

const { Option } = Select;
const { TextArea } = Input;

const AddExtraScheduleModal = ({ visible, onCancel, onConfirm, orderInfo, loading }) => {
  const [form] = Form.useForm();
  const [scheduleType, setScheduleType] = useState('pickup'); // pickup, dropoff, extra_day
  const [dayTours, setDayTours] = useState([]);
  const [loadingDayTours, setLoadingDayTours] = useState(false);

  // 初始化表单数据
  useEffect(() => {
    if (visible && orderInfo) {
      // 根据订单信息预填表单
      form.setFieldsValue({
        contactPerson: orderInfo.name || orderInfo.contactPerson,
        contactPhone: orderInfo.phone || orderInfo.contactPhone,
        adultCount: orderInfo.adultCount || 1,
        childCount: orderInfo.childCount || 0,
        scheduleType: 'pickup',
        // 默认时间设置
        pickupTime: dayjs('08:00', 'HH:mm'),
        dropoffTime: dayjs('18:00', 'HH:mm')
      });
      setScheduleType('pickup');
    }
  }, [visible, orderInfo, form]);

  // 加载一日游产品列表
  const loadDayTours = async () => {
    if (dayTours.length > 0) return; // 如果已经加载过，不重复加载
    
    try {
      setLoadingDayTours(true);
      const response = await getAvailableDayTours();
      if (response.code === 1) {
        setDayTours(response.data || []);
      } else {
        message.error('获取一日游产品列表失败');
      }
    } catch (error) {
      console.error('获取一日游产品列表失败:', error);
      message.error('获取一日游产品列表失败');
    } finally {
      setLoadingDayTours(false);
    }
  };

  // 处理行程类型变化
  const handleScheduleTypeChange = (e) => {
    const newType = e.target.value;
    setScheduleType(newType);
    
    // 如果选择了额外一日游，加载一日游产品列表
    if (newType === 'extra_day') {
      loadDayTours();
    }
  };

  // 处理确认
  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      
      // 如果是额外一日游，获取选中的一日游产品信息
      let selectedTourInfo = null;
      if (scheduleType === 'extra_day' && values.tourId) {
        selectedTourInfo = dayTours.find(tour => tour.id === values.tourId);
        console.log('🎯 选中的一日游产品:', selectedTourInfo);
      }
      
      // 组装数据
      const scheduleData = {
        ...values,
        orderInfo,
        bookingId: orderInfo.bookingId || orderInfo.id,
        orderNumber: orderInfo.orderNumber,
        scheduleType: scheduleType,
        selectedTourInfo: selectedTourInfo, // 传递选中的一日游产品信息
        // 格式化时间
        pickupTime: values.pickupTime?.format('HH:mm'),
        dropoffTime: values.dropoffTime?.format('HH:mm'),
        scheduleDate: values.scheduleDate?.format('YYYY-MM-DD')
      };
      
      console.log('准备保存额外行程:', scheduleData);
      
      // 调用父组件的确认回调
      if (onConfirm) {
        await onConfirm(scheduleData);
      }
      
    } catch (error) {
      console.error('表单验证失败:', error);
    }
  };

  // 处理取消
  const handleCancel = () => {
    form.resetFields();
    setScheduleType('pickup');
    onCancel();
  };

  // 根据行程类型渲染不同的表单项
  const renderScheduleTypeFields = () => {
    switch (scheduleType) {
      case 'pickup':
        return (
          <>
            <Form.Item
              name="pickupLocation"
              label="接机地点"
              rules={[{ required: true, message: '请输入接机地点' }]}
            >
              <Input 
                prefix={<EnvironmentOutlined />}
                placeholder="如：机场、酒店名称等"
              />
            </Form.Item>
            <Form.Item
              name="pickupTime"
              label="接机时间"
              rules={[{ required: true, message: '请选择接机时间' }]}
            >
              <TimePicker 
                format="HH:mm"
                placeholder="选择时间"
                style={{ width: '100%' }}
              />
            </Form.Item>
            <Form.Item
              name="dropoffLocation"
              label="送至地点"
              rules={[{ required: true, message: '请输入送至地点' }]}
            >
              <Input 
                prefix={<HomeOutlined />}
                placeholder="如：酒店名称、景点等"
              />
            </Form.Item>
          </>
        );
      case 'dropoff':
        return (
          <>
            <Form.Item
              name="pickupLocation"
              label="接送地点"
              rules={[{ required: true, message: '请输入接送地点' }]}
            >
              <Input 
                prefix={<HomeOutlined />}
                placeholder="如：酒店名称、景点等"
              />
            </Form.Item>
            <Form.Item
              name="dropoffLocation"
              label="送机地点"
              rules={[{ required: true, message: '请输入送机地点' }]}
            >
              <Input 
                prefix={<EnvironmentOutlined />}
                placeholder="如：机场等"
              />
            </Form.Item>
            <Form.Item
              name="dropoffTime"
              label="送机时间"
              rules={[{ required: true, message: '请选择送机时间' }]}
            >
              <TimePicker 
                format="HH:mm"
                placeholder="选择时间"
                style={{ width: '100%' }}
              />
            </Form.Item>
          </>
        );
      case 'extra_day':
        return (
          <>
            <Form.Item
              name="tourId"
              label="选择一日游产品"
              rules={[{ required: true, message: '请选择一日游产品' }]}
            >
              <Select 
                placeholder="请选择一日游产品"
                loading={loadingDayTours}
                showSearch
                filterOption={(input, option) =>
                  option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
                }
              >
                {dayTours.map(tour => (
                  <Option key={tour.id} value={tour.id}>
                    {tour.name} - {tour.location} (${tour.price})
                  </Option>
                ))}
              </Select>
            </Form.Item>
            <Form.Item
              name="pickupLocation"
              label="出发地点"
              rules={[{ required: true, message: '请输入出发地点' }]}
            >
              <Input 
                prefix={<HomeOutlined />}
                placeholder="如：酒店等"
              />
            </Form.Item>
            <Form.Item
              name="pickupTime"
              label="出发时间"
              rules={[{ required: true, message: '请选择出发时间' }]}
            >
              <TimePicker 
                format="HH:mm"
                placeholder="选择时间"
                style={{ width: '100%' }}
              />
            </Form.Item>
            <Form.Item
              name="dropoffLocation"
              label="目的地点"
              rules={[{ required: true, message: '请输入目的地点' }]}
            >
              <Input 
                prefix={<EnvironmentOutlined />}
                placeholder="如：景点、酒店等"
              />
            </Form.Item>
            <Form.Item
              name="dropoffTime"
              label="结束时间"
              rules={[{ required: true, message: '请选择结束时间' }]}
            >
              <TimePicker 
                format="HH:mm"
                placeholder="选择时间"
                style={{ width: '100%' }}
              />
            </Form.Item>
          </>
        );
      default:
        return null;
    }
  };

  return (
    <Modal
      title={
        <Space>
          <CarOutlined />
          为订单添加额外行程
        </Space>
      }
      open={visible}
      onOk={handleOk}
      onCancel={handleCancel}
      confirmLoading={loading}
      width={700}
      okText="确认添加"
      cancelText="取消"
      destroyOnClose
    >
      {/* 订单信息展示 */}
      {orderInfo && (
        <Card size="small" style={{ marginBottom: 16, backgroundColor: '#f6ffed' }}>
          <Row gutter={16}>
            <Col span={12}>
              <Space>
                <UserOutlined />
                <strong>客户：</strong>{orderInfo.name || orderInfo.contactPerson}
              </Space>
            </Col>
            <Col span={12}>
              <Space>
                <PhoneOutlined />
                <strong>电话：</strong>{orderInfo.phone || orderInfo.contactPhone}
              </Space>
            </Col>
          </Row>
          <Row gutter={16} style={{ marginTop: 8 }}>
            <Col span={12}>
              <strong>订单号：</strong>{orderInfo.orderNumber}
            </Col>
            <Col span={12}>
              <strong>人数：</strong>
              <Tag color="blue">成人 {orderInfo.adultCount || 0}</Tag>
              <Tag color="green">儿童 {orderInfo.childCount || 0}</Tag>
            </Col>
          </Row>
        </Card>
      )}

      <Form
        form={form}
        layout="vertical"
        size="middle"
      >
        {/* 行程类型选择 */}
        <Form.Item
          name="scheduleType"
          label="行程类型"
          rules={[{ required: true, message: '请选择行程类型' }]}
        >
          <Radio.Group 
            onChange={handleScheduleTypeChange}
            buttonStyle="solid"
            size="large"
          >
            <Radio.Button value="pickup">
              <CarOutlined /> 提前接机
            </Radio.Button>
            <Radio.Button value="dropoff">
              <EnvironmentOutlined /> 延后送机
            </Radio.Button>
            <Radio.Button value="extra_day">
              <ClockCircleOutlined /> 额外一日游
            </Radio.Button>
          </Radio.Group>
        </Form.Item>

        {/* 行程日期 */}
        <Form.Item
          name="scheduleDate"
          label="行程日期"
          rules={[{ required: true, message: '请选择行程日期' }]}
        >
          <DatePicker 
            style={{ width: '100%' }}
            placeholder="选择日期"
            disabledDate={(current) => current && current < dayjs().startOf('day')}
          />
        </Form.Item>

        <Divider orientation="left">行程详情</Divider>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="contactPerson"
              label="联系人"
              rules={[{ required: true, message: '请输入联系人' }]}
            >
              <Input prefix={<UserOutlined />} placeholder="联系人姓名" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="contactPhone"
              label="联系电话"
              rules={[{ required: true, message: '请输入联系电话' }]}
            >
              <Input prefix={<PhoneOutlined />} placeholder="联系电话" />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="adultCount"
              label="成人数量"
              rules={[{ required: true, message: '请输入成人数量' }]}
            >
              <Select placeholder="选择成人数量">
                {[...Array(10).keys()].map(i => (
                  <Option key={i} value={i}>{i} 人</Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="childCount"
              label="儿童数量"
              rules={[{ required: true, message: '请输入儿童数量' }]}
            >
              <Select placeholder="选择儿童数量">
                {[...Array(10).keys()].map(i => (
                  <Option key={i} value={i}>{i} 人</Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
        </Row>

        {/* 根据行程类型渲染不同的字段 */}
        {renderScheduleTypeFields()}

        {/* 特殊要求 */}
        <Form.Item
          name="specialRequests"
          label="特殊要求"
        >
          <TextArea
            rows={3}
            placeholder="请输入特殊要求或备注（选填）"
            maxLength={500}
            showCount
          />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default AddExtraScheduleModal; 