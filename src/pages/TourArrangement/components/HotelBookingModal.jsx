import React, { useState, useEffect } from 'react';
import {
  Modal,
  Form,
  Input,
  Select,
  DatePicker,
  InputNumber,
  Button,
  Space,
  message,
  Row,
  Col,
  Divider,
  Card,
  Tag,
  Descriptions,
  Spin,
  Alert
} from 'antd';
import {
  SaveOutlined,
  ReloadOutlined,
  HomeOutlined,
  CalendarOutlined,
  UserOutlined,
  PhoneOutlined,
  InfoCircleOutlined
} from '@ant-design/icons';
import { getHotels, getHotelRoomTypes, addHotelBooking } from '@/apis/hotel';
import { saveBatchSchedules, getSchedulesByBookingId } from '@/api/tourSchedule';
import dayjs from 'dayjs';

const { Option } = Select;
const { TextArea } = Input;

const HotelBookingModal = ({ 
  visible, 
  onCancel, 
  onSuccess,
  locationData, 
  orderInfo 
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [hotels, setHotels] = useState([]);
  const [roomTypes, setRoomTypes] = useState([]);
  const [selectedHotelId, setSelectedHotelId] = useState(null);
  const [selectedHotel, setSelectedHotel] = useState(null);
  const [selectedRoomType, setSelectedRoomType] = useState(null);
  const [existingHotelInfo, setExistingHotelInfo] = useState(null);

  // 预订状态选项
  const statusOptions = [
    { label: '待确认', value: 'pending', color: 'orange' },
    { label: '已确认', value: 'confirmed', color: 'green' },
    { label: '已入住', value: 'checked_in', color: 'blue' },
    { label: '已退房', value: 'checked_out', color: 'purple' },
    { label: '已取消', value: 'cancelled', color: 'red' }
  ];

  // 获取酒店列表
  const fetchHotels = async () => {
    try {
      const response = await getHotels();
      if (response.code === 1) {
        setHotels(response.data || []);
      }
    } catch (error) {
      console.error('获取酒店列表失败:', error);
      message.error('获取酒店列表失败');
    }
  };

  // 获取房型列表
  const fetchRoomTypes = async (hotelId) => {
    if (!hotelId) {
      setRoomTypes([]);
      return;
    }

    try {
      const response = await getHotelRoomTypes(hotelId);
      if (response.code === 1) {
        setRoomTypes(response.data || []);
      }
    } catch (error) {
      console.error('获取房型列表失败:', error);
      setRoomTypes([]);
    }
  };

  // 处理酒店选择变化
  const handleHotelChange = (hotelId) => {
    setSelectedHotelId(hotelId);
    const hotel = hotels.find(h => h.id === hotelId);
    setSelectedHotel(hotel);
    form.setFieldsValue({ roomTypeId: undefined });
    setSelectedRoomType(null);
    fetchRoomTypes(hotelId);
  };

  // 处理房型选择变化
  const handleRoomTypeChange = (roomTypeId) => {
    const roomType = roomTypes.find(rt => rt.id === roomTypeId);
    setSelectedRoomType(roomType);
    
    if (roomType) {
      // 使用房型价格自动计算总金额
      calculateBookingDetails(roomType.basePrice);
    }
  };

  // 计算住宿天数和总金额
  const calculateBookingDetails = (roomRate = null) => {
    const checkInDate = form.getFieldValue('checkInDate');
    const checkOutDate = form.getFieldValue('checkOutDate');
    const roomCount = form.getFieldValue('roomCount') || 1;
    
    // 使用房型价格，如果没有传入则尝试从选中的房型获取
    const finalRoomRate = roomRate || (selectedRoomType ? selectedRoomType.basePrice : 0);

    if (checkInDate && checkOutDate && finalRoomRate) {
      const nights = checkOutDate.diff(checkInDate, 'day');
      if (nights > 0) {
        const totalAmount = nights * finalRoomRate * roomCount;

        form.setFieldsValue({
          nights: nights,
          totalAmount: totalAmount.toFixed(2)
        });
      }
    }
  };

  // 处理日期变化
  const handleDateChange = () => {
    setTimeout(() => calculateBookingDetails(), 100);
  };

  // 处理房间数变化
  const handleRoomCountChange = () => {
    setTimeout(() => calculateBookingDetails(), 100);
  };

  // 根据酒店入住逻辑生成接送信息
  const generatePickupDropoffByDate = (hotelInfo, checkInDate, checkOutDate, allSchedules) => {
    const updates = [];
    const hotelName = hotelInfo.hotelName || '所选酒店';
    const hotelAddress = hotelInfo.address || hotelName;
    
    allSchedules.forEach(schedule => {
      const scheduleDate = dayjs(schedule.tourDate);
      const checkIn = dayjs(checkInDate);
      const checkOut = dayjs(checkOutDate);
      
      // 入住日：送客人到酒店（dropoff_location）
      if (scheduleDate.isSame(checkIn, 'day')) {
        updates.push({
          ...schedule,
          dropoffLocation: hotelAddress,
          // 更新备注信息，表明这是酒店入住日
          specialRequests: schedule.specialRequests ? 
            `${schedule.specialRequests} | 送至酒店：${hotelName}` : 
            `送至酒店：${hotelName}`
        });
      }
      // 退房日：从酒店接客人（pickup_location）  
      else if (scheduleDate.isSame(checkOut, 'day')) {
        updates.push({
          ...schedule,
          pickupLocation: hotelAddress,
          // 更新备注信息，表明这是酒店退房日
          specialRequests: schedule.specialRequests ? 
            `${schedule.specialRequests} | 从酒店接客：${hotelName}` : 
            `从酒店接客：${hotelName}`
        });
      }
      // 中间日期：从酒店接客，送回酒店
      else if (scheduleDate.isAfter(checkIn, 'day') && scheduleDate.isBefore(checkOut, 'day')) {
        updates.push({
          ...schedule,
          pickupLocation: hotelAddress,
          dropoffLocation: hotelAddress,
          // 更新备注信息
          specialRequests: schedule.specialRequests ? 
            `${schedule.specialRequests} | 酒店接送：${hotelName}` : 
            `酒店接送：${hotelName}`
        });
      }
      else {
        // 其他日期不更新接送信息，但要包含在批量更新中
        updates.push(schedule);
      }
    });
    
    return updates;
  };

  // 提交表单
  const handleSubmit = async (values) => {
    setSubmitting(true);
    try {
      // 验证必要字段
      if (!selectedHotel || !selectedRoomType) {
        throw new Error('请选择酒店和房型');
      }

      // 1. 创建酒店预订记录
      const hotelBookingData = {
        ...values,
        checkInDate: values.checkInDate.format('YYYY-MM-DD'),
        checkOutDate: values.checkOutDate.format('YYYY-MM-DD'),
        tourBookingId: orderInfo.bookingId,
        scheduleOrderId: locationData.scheduleId,
        guestName: values.guestName || orderInfo.name,
        guestPhone: values.guestPhone || orderInfo.phone,
        roomRate: selectedRoomType.basePrice, // 使用房型价格
        bookingSource: 'system'
      };

      const hotelBookingResponse = await addHotelBooking(hotelBookingData);
      
      if (hotelBookingResponse.code !== 1) {
        throw new Error(hotelBookingResponse.msg || '创建酒店预订失败');
      }

      // 2. 只有在状态为"已确认"时才同步到排团表
      if (values.bookingStatus === 'confirmed') {
        const bookingId = orderInfo.bookingId;
        const allSchedulesResponse = await getSchedulesByBookingId(bookingId);
        
        if (allSchedulesResponse?.code === 1 && allSchedulesResponse?.data?.length > 0) {
          // 根据入住日期生成接送信息
          const updatedSchedules = generatePickupDropoffByDate(
            selectedHotel,
            values.checkInDate,
            values.checkOutDate,
            allSchedulesResponse.data
          );

          // 更新所有天数的酒店信息
          const finalSchedules = updatedSchedules.map(schedule => ({
            ...schedule,
            hotelLevel: selectedHotel?.hotelLevel || '4星',
            roomType: selectedRoomType?.roomType || '标准房',
            hotelRoomCount: values.roomCount,
            hotelCheckInDate: values.checkInDate.format('YYYY-MM-DD'),
            hotelCheckOutDate: values.checkOutDate.format('YYYY-MM-DD'),
            roomDetails: `${selectedHotel?.hotelName || ''} - ${selectedRoomType?.roomType || ''}`
          }));

          // 批量更新排团表
          await saveBatchSchedules({
            bookingId: bookingId,
            schedules: finalSchedules
          });

          message.success('酒店预订创建成功，已同步更新排团表的接送信息');
        }
      } else {
        // 如果状态不是已确认，则只更新酒店信息，不更新接送地点
        const bookingId = orderInfo.bookingId;
        const allSchedulesResponse = await getSchedulesByBookingId(bookingId);
        
        if (allSchedulesResponse?.code === 1 && allSchedulesResponse?.data?.length > 0) {
          const updatedSchedules = allSchedulesResponse.data.map(schedule => ({
            ...schedule,
            hotelLevel: selectedHotel?.hotelLevel || '4星',
            roomType: selectedRoomType?.roomType || '标准房',
            hotelRoomCount: values.roomCount,
            hotelCheckInDate: values.checkInDate.format('YYYY-MM-DD'),
            hotelCheckOutDate: values.checkOutDate.format('YYYY-MM-DD'),
            roomDetails: `${selectedHotel?.hotelName || ''} - ${selectedRoomType?.roomType || ''}`
          }));

          await saveBatchSchedules({
            bookingId: bookingId,
            schedules: updatedSchedules
          });
        }

        message.success('酒店预订创建成功，待确认后将同步接送信息到排团表');
      }

      onSuccess && onSuccess();
      handleReset();
      
    } catch (error) {
      console.error('提交失败:', error);
      message.error(error.message || '提交失败');
    } finally {
      setSubmitting(false);
    }
  };

  // 重置表单
  const handleReset = () => {
    form.resetFields();
    setSelectedHotelId(null);
    setSelectedHotel(null);
    setSelectedRoomType(null);
    setRoomTypes([]);
  };

  // 获取现有酒店信息
  const fetchExistingHotelInfo = () => {
    if (orderInfo && (orderInfo.hotelLevel || orderInfo.roomType || orderInfo.roomDetails)) {
      setExistingHotelInfo({
        hotelLevel: orderInfo.hotelLevel,
        roomType: orderInfo.roomType,
        roomDetails: orderInfo.roomDetails,
        checkInDate: orderInfo.hotelCheckInDate,
        checkOutDate: orderInfo.hotelCheckOutDate,
        roomCount: orderInfo.hotelRoomCount
      });
    }
  };

  // 初始化数据
  useEffect(() => {
    if (visible) {
      fetchHotels();
      fetchExistingHotelInfo();
      
      // 自动填入订单信息
      if (orderInfo && locationData) {
        const checkInDate = dayjs(locationData.date);
        const checkOutDate = checkInDate.add(1, 'day'); // 默认住1晚
        
        form.setFieldsValue({
          guestName: orderInfo.name,
          guestPhone: orderInfo.phone,
          guestEmail: orderInfo.email || '',
          checkInDate: checkInDate,
          checkOutDate: checkOutDate,
          roomCount: orderInfo.hotelRoomCount || 1,
          adultCount: orderInfo.adultCount || 1,
          childCount: orderInfo.childCount || 0,
          specialRequests: orderInfo.specialRequests || '',
          bookingStatus: 'pending'
        });
      }
    } else {
      handleReset();
      setExistingHotelInfo(null);
    }
  }, [visible, orderInfo, locationData]);

  return (
    <Modal
      title={
        <Space>
          <HomeOutlined />
          酒店预订 - {orderInfo?.name || '客户'}
        </Space>
      }
      visible={visible}
      onCancel={onCancel}
      width={1000}
      footer={null}
      destroyOnClose
    >
      <Spin spinning={loading}>
        {/* 订单信息卡片 */}
        <Card size="small" style={{ marginBottom: 16 }}>
          <Descriptions title="订单信息" size="small" column={3}>
            <Descriptions.Item label="订单号">{orderInfo?.orderNumber}</Descriptions.Item>
            <Descriptions.Item label="客户姓名">{orderInfo?.name}</Descriptions.Item>
            <Descriptions.Item label="联系电话">{orderInfo?.phone}</Descriptions.Item>
            <Descriptions.Item label="行程日期">{locationData?.date}</Descriptions.Item>
            <Descriptions.Item label="成人数量">{orderInfo?.adultCount}人</Descriptions.Item>
            <Descriptions.Item label="儿童数量">{orderInfo?.childCount}人</Descriptions.Item>
          </Descriptions>
        </Card>

        {/* 现有酒店信息展示 */}
        {existingHotelInfo && (
          <Card size="small" style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: 12 }}>
              <InfoCircleOutlined style={{ color: '#1890ff', marginRight: 8 }} />
              <span style={{ fontWeight: 'bold' }}>当前酒店信息</span>
            </div>
            <Descriptions size="small" column={3}>
              <Descriptions.Item label="酒店等级">{existingHotelInfo.hotelLevel}</Descriptions.Item>
              <Descriptions.Item label="房型">{existingHotelInfo.roomType}</Descriptions.Item>
              <Descriptions.Item label="房间数">{existingHotelInfo.roomCount}间</Descriptions.Item>
              <Descriptions.Item label="入住日期">{existingHotelInfo.checkInDate}</Descriptions.Item>
              <Descriptions.Item label="退房日期">{existingHotelInfo.checkOutDate}</Descriptions.Item>
              <Descriptions.Item label="酒店详情" span={2}>{existingHotelInfo.roomDetails}</Descriptions.Item>
            </Descriptions>
          </Card>
        )}

        {/* 酒店确认状态提示 */}
        <Alert
          message="重要提示"
          description="只有当预订状态设为已确认时，系统才会自动将酒店地址同步到排团表的接送地点。根据入住和退房日期，系统会智能填充pickup和dropoff信息。"
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
        />

        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="客人姓名"
                name="guestName"
                rules={[{ required: true, message: '请输入客人姓名' }]}
              >
                <Input prefix={<UserOutlined />} placeholder="客人姓名" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="客人电话"
                name="guestPhone"
                rules={[{ required: true, message: '请输入客人电话' }]}
              >
                <Input prefix={<PhoneOutlined />} placeholder="客人电话" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            label="客人邮箱"
            name="guestEmail"
          >
            <Input placeholder="客人邮箱（可选）" />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="选择酒店"
                name="hotelId"
                rules={[{ required: true, message: '请选择酒店' }]}
              >
                <Select
                  placeholder="请选择酒店"
                  onChange={handleHotelChange}
                  showSearch
                  filterOption={(input, option) =>
                    option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
                  }
                >
                  {hotels.map(hotel => (
                    <Option key={hotel.id} value={hotel.id}>
                      {hotel.hotelName} - {hotel.hotelLevel} - {hotel.address}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="房型"
                name="roomTypeId"
                rules={[{ required: true, message: '请选择房型' }]}
              >
                <Select 
                  placeholder="请先选择酒店"
                  onChange={handleRoomTypeChange}
                >
                  {roomTypes.map(roomType => (
                    <Option key={roomType.id} value={roomType.id}>
                      {roomType.roomType} - ${roomType.basePrice}/晚
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                label="入住日期"
                name="checkInDate"
                rules={[{ required: true, message: '请选择入住日期' }]}
              >
                <DatePicker 
                  style={{ width: '100%' }} 
                  onChange={handleDateChange}
                  placeholder="选择入住日期"
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                label="退房日期"
                name="checkOutDate"
                rules={[{ required: true, message: '请选择退房日期' }]}
              >
                <DatePicker 
                  style={{ width: '100%' }} 
                  onChange={handleDateChange}
                  placeholder="选择退房日期"
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                label="房间数量"
                name="roomCount"
                rules={[{ required: true, message: '请输入房间数量' }]}
              >
                <InputNumber 
                  min={1} 
                  style={{ width: '100%' }} 
                  onChange={handleRoomCountChange}
                  placeholder="房间数量"
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                label="成人数量"
                name="adultCount"
                rules={[{ required: true, message: '请输入成人数量' }]}
              >
                <InputNumber min={1} style={{ width: '100%' }} placeholder="成人数量" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                label="儿童数量"
                name="childCount"
              >
                <InputNumber min={0} style={{ width: '100%' }} placeholder="儿童数量（可选）" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                label="预订状态"
                name="bookingStatus"
                rules={[{ required: true, message: '请选择预订状态' }]}
              >
                <Select placeholder="选择预订状态">
                  {statusOptions.map(option => (
                    <Option key={option.value} value={option.value}>
                      <Tag color={option.color}>{option.label}</Tag>
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                label="住宿天数"
                name="nights"
              >
                <InputNumber style={{ width: '100%' }} disabled placeholder="自动计算" />
              </Form.Item>
            </Col>
            <Col span={16}>
              <Form.Item
                label="总金额 (AUD)"
                name="totalAmount"
              >
                <InputNumber
                  style={{ width: '100%' }}
                  disabled
                  placeholder="根据房型价格自动计算"
                  formatter={value => `$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  parser={value => value.replace(/\$\s?|(,*)/g, '')}
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            label="特殊要求"
            name="specialRequests"
          >
            <TextArea rows={3} placeholder="请输入特殊要求（可选）" />
          </Form.Item>

          <Divider />

          <div style={{ textAlign: 'right' }}>
            <Space>
              <Button onClick={onCancel}>取消</Button>
              <Button icon={<ReloadOutlined />} onClick={handleReset}>重置</Button>
              <Button 
                type="primary" 
                htmlType="submit" 
                loading={submitting}
                icon={<SaveOutlined />}
              >
                创建预订
              </Button>
            </Space>
          </div>
        </Form>
      </Spin>
    </Modal>
  );
};

export default HotelBookingModal; 