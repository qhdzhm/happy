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
  Alert,
  List,
  Popconfirm,
  Timeline,
  Typography
} from 'antd';
import {
  SaveOutlined,
  DeleteOutlined,
  PlusOutlined,
  HomeOutlined,
  CalendarOutlined,
  UserOutlined,
  PhoneOutlined,
  InfoCircleOutlined,
  EnvironmentOutlined,
  ClockCircleOutlined
} from '@ant-design/icons';
import { getHotels, getHotelRoomTypes, addHotelBooking, updateHotelBooking, getHotelBookingsByTourBookingId, deleteHotelBooking } from '@/apis/hotel';
import { saveBatchSchedules, getSchedulesByBookingId } from '@/api/tourSchedule';
import dayjs from 'dayjs';

const { Option } = Select;
const { TextArea } = Input;
const { Text } = Typography;

const MultiHotelBookingModal = ({ 
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
  const [roomTypes, setRoomTypes] = useState({});
  const [hotelBookings, setHotelBookings] = useState([]);
  const [editingIndex, setEditingIndex] = useState(-1);
  const [currentHotelId, setCurrentHotelId] = useState(null);
  const [previewTransfers, setPreviewTransfers] = useState([]);

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
        console.log('🏨 [调试] 获取的酒店列表:', response.data);
        setHotels(response.data || []);
      }
    } catch (error) {
      console.error('获取酒店列表失败:', error);
      message.error('获取酒店列表失败');
    }
  };

  // 获取房型列表
  const fetchRoomTypes = async (hotelId) => {
    if (!hotelId) return;

    try {
      const response = await getHotelRoomTypes(hotelId);
      if (response.code === 1) {
        console.log(`🏠 [调试] 酒店ID ${hotelId} 的房型列表:`, response.data);
        setRoomTypes(prev => ({
          ...prev,
          [hotelId]: response.data || []
        }));
      }
    } catch (error) {
      console.error('获取房型列表失败:', error);
    }
  };

  // 获取现有酒店预订
  const fetchExistingBookings = async () => {
    if (!orderInfo?.bookingId) return;

    try {
      const response = await getHotelBookingsByTourBookingId(orderInfo.bookingId);
      if (response.code === 1 && response.data) {
        // 新API直接返回数组
        const bookings = Array.isArray(response.data) ? response.data : [];
        console.log('🏨 [调试] 获取现有酒店预订:', bookings);
        setHotelBookings(bookings.map(booking => ({
          ...booking,
          checkInDate: dayjs(booking.checkInDate),
          checkOutDate: dayjs(booking.checkOutDate)
        })));
      }
    } catch (error) {
      console.error('获取现有酒店预订失败:', error);
    }
  };

  // 添加新酒店预订
  const handleAddHotel = async (values) => {
    try {
      // 验证日期不冲突
      const newCheckIn = values.checkInDate;
      const newCheckOut = values.checkOutDate;
      
      const hasConflict = hotelBookings.some(booking => {
        if (editingIndex >= 0 && hotelBookings.indexOf(booking) === editingIndex) {
          return false; // 跳过正在编辑的预订
        }
        return newCheckIn.isBefore(booking.checkOutDate) && newCheckOut.isAfter(booking.checkInDate);
      });

      if (hasConflict) {
        message.error('酒店入住日期与现有预订冲突！');
        return;
      }

      const selectedHotel = hotels.find(h => h.id === values.hotelId);
      const selectedRoomType = roomTypes[values.hotelId]?.find(rt => rt.id === values.roomTypeId);

      const newBooking = {
        ...values,
        id: editingIndex >= 0 ? hotelBookings[editingIndex].id : null,
        hotelName: selectedHotel?.hotelName || selectedHotel?.name,
        hotelAddress: selectedHotel?.address || selectedHotel?.hotelAddress || selectedHotel?.hotelName || selectedHotel?.name,
        roomTypeName: selectedRoomType?.roomType || selectedRoomType?.name,
        roomRate: selectedRoomType?.basePrice || selectedRoomType?.price,
        checkInDate: values.checkInDate,
        checkOutDate: values.checkOutDate,
        nights: values.checkOutDate.diff(values.checkInDate, 'day'),
        tourBookingId: orderInfo.bookingId,
        guestName: values.guestName || orderInfo.name,
        guestPhone: values.guestPhone || orderInfo.phone
      };

      console.log('🏨 [调试] 选中的酒店信息:', selectedHotel);
      console.log('🏨 [调试] 新预订对象:', newBooking);

      let updatedBookings;
      if (editingIndex >= 0) {
        // 编辑现有预订
        updatedBookings = [...hotelBookings];
        updatedBookings[editingIndex] = newBooking;
        setHotelBookings(updatedBookings);
        setEditingIndex(-1);
      } else {
        // 添加新预订
        updatedBookings = [...hotelBookings, newBooking];
        setHotelBookings(updatedBookings);
      }

      // 重置表单并预填充客人基本信息和默认日期
      form.resetFields();
      fetchTourDatesAndSetDefaults();
      setCurrentHotelId(null);
      generateTransferPreview(updatedBookings);
      message.success(editingIndex >= 0 ? '酒店预订已更新' : '酒店预订已添加');
    } catch (error) {
      console.error('添加酒店预订失败:', error);
      message.error('操作失败');
    }
  };

  // 编辑酒店预订
  const handleEditHotel = (index) => {
    const booking = hotelBookings[index];
    setEditingIndex(index);
    setCurrentHotelId(booking.hotelId);
    
    form.setFieldsValue({
      hotelId: booking.hotelId,
      roomTypeId: booking.roomTypeId,
      checkInDate: booking.checkInDate,
      checkOutDate: booking.checkOutDate,
      roomCount: booking.roomCount,
      adultCount: booking.adultCount,
      childCount: booking.childCount,
      guestName: booking.guestName,
      guestPhone: booking.guestPhone,
      bookingStatus: booking.bookingStatus,
      specialRequests: booking.specialRequests
    });

    fetchRoomTypes(booking.hotelId);
  };

  // 删除酒店预订（同时删除后端真实记录）
  const handleDeleteHotel = async (index) => {
    console.log('🗑️ [删除酒店] 开始删除索引:', index, '当前预订数量:', hotelBookings.length);
    
    const bookingToDelete = hotelBookings[index];
    console.log('🗑️ [删除酒店] 要删除的预订:', bookingToDelete);
    
    try {
      // 如果该预订已经保存到数据库（有ID），先删除后端记录
      if (bookingToDelete.id) {
        console.log('🗑️ [删除酒店] 检测到已保存的预订，删除后端记录，ID:', bookingToDelete.id);
        try {
          const deleteResponse = await deleteHotelBooking(bookingToDelete.id);
          if (deleteResponse.code === 1) {
            console.log('🗑️ [删除酒店] 后端记录删除成功');
          } else {
            console.warn('🗑️ [删除酒店] 后端记录删除失败:', deleteResponse.msg);
            message.warning('后端记录删除失败，但前端记录将被移除：' + deleteResponse.msg);
          }
        } catch (backendError) {
          console.error('🗑️ [删除酒店] 后端删除API调用失败:', backendError);
          message.warning('无法删除后端记录，但前端记录将被移除：' + backendError.message);
        }
      } else {
        console.log('🗑️ [删除酒店] 未保存的预订，只删除前端记录');
      }
      
      // 无论后端删除是否成功，都删除前端记录
      const updatedBookings = hotelBookings.filter((_, i) => i !== index);
      console.log('🗑️ [删除酒店] 删除后预订数量:', updatedBookings.length);
      
      setHotelBookings(updatedBookings);
      
      // 如果删除的是正在编辑的预订，重置编辑状态
      if (editingIndex === index) {
        console.log('🗑️ [删除酒店] 删除的是正在编辑的预订，重置编辑状态');
        setEditingIndex(-1);
        form.resetFields();
        fetchTourDatesAndSetDefaults();
        setCurrentHotelId(null);
      } else if (editingIndex > index) {
        // 如果删除的预订在当前编辑预订之前，调整编辑索引
        console.log('🗑️ [删除酒店] 调整编辑索引:', editingIndex, '->', editingIndex - 1);
        setEditingIndex(editingIndex - 1);
      }
      
      // 重新生成接送预览
      if (updatedBookings.length > 0) {
        console.log('🗑️ [删除酒店] 重新生成接送预览');
        generateTransferPreview(updatedBookings);
      } else {
        console.log('🗑️ [删除酒店] 清空接送预览');
        setPreviewTransfers([]);
      }
      
      message.success('酒店预订已删除' + (bookingToDelete.id ? '（包括后端记录）' : ''));
      console.log('🗑️ [删除酒店] 删除成功');
    } catch (error) {
      console.error('🗑️ [删除酒店] 删除失败:', error);
      message.error('删除酒店预订失败：' + error.message);
    }
  };

  // 生成接送预览
  const generateTransferPreview = async (bookings = hotelBookings) => {
    if (!orderInfo?.bookingId || bookings.length === 0) {
      setPreviewTransfers([]);
      return;
    }

    try {
      const scheduleResponse = await getSchedulesByBookingId(orderInfo.bookingId);
      if (scheduleResponse?.code === 1 && scheduleResponse?.data?.length > 0) {
        const schedules = scheduleResponse.data.sort((a, b) => dayjs(a.tourDate).diff(dayjs(b.tourDate)));
        
        // 按日期排序酒店预订
        const sortedBookings = [...bookings].sort((a, b) => a.checkInDate.diff(b.checkInDate));
        
        console.log('🏨 [接送预览] 排序后的酒店预订:', sortedBookings.map(b => ({
          name: b.hotelName,
          checkIn: b.checkInDate.format('MM-DD'),
          checkOut: b.checkOutDate.format('MM-DD'),
          address: b.hotelAddress
        })));
        
        const transfers = schedules.map(schedule => {
          const scheduleDate = dayjs(schedule.tourDate);
          const isFirstDay = scheduleDate.isSame(schedules[0].tourDate);
          const isLastDay = scheduleDate.isSame(schedules[schedules.length - 1].tourDate);
          
          // 保持原有的接送安排，只预览酒店相关的变化
          let pickup = schedule.pickupLocation || '未指定';
          let dropoff = schedule.dropoffLocation || '未指定';
          let currentHotelName = '无';

          if (isFirstDay) {
            // 第一天：保持原有接机安排，预览送到酒店的变化
            // pickup 保持原值（不改变接机安排）
            const firstHotel = sortedBookings.find(booking => 
              scheduleDate.isSame(booking.checkInDate) || scheduleDate.isAfter(booking.checkInDate)
            );
            // 预览送客地点为酒店
            if (firstHotel) {
              dropoff = firstHotel.hotelName || firstHotel.hotelAddress;
            }
            currentHotelName = firstHotel ? firstHotel.hotelName : '无';
          } else if (isLastDay) {
            // 最后一天：预览从酒店接的变化，保持原有送机安排
            const lastHotel = sortedBookings.find(booking => 
              (scheduleDate.isSame(booking.checkOutDate) || scheduleDate.isBefore(booking.checkOutDate)) && 
              scheduleDate.isAfter(booking.checkInDate)
            ) || sortedBookings[sortedBookings.length - 1]; // 兜底取最后一个酒店
            
            // 预览接客地点为酒店
            if (lastHotel) {
              pickup = lastHotel.hotelName || lastHotel.hotelAddress;
            }
            // dropoff 保持原值（不改变送机安排）
            currentHotelName = '退房';
          } else {
            // 中间天：预览酒店间的接送变化
            
            // 找到昨晚住的酒店（接的地点）
            const prevDay = scheduleDate.subtract(1, 'day');
            const prevHotel = sortedBookings.find(booking => 
              (prevDay.isSame(booking.checkInDate) || prevDay.isAfter(booking.checkInDate)) && 
              prevDay.isBefore(booking.checkOutDate)
            );
            
            // 找到今晚要住的酒店（送的地点）
            const tonightHotel = sortedBookings.find(booking => 
              (scheduleDate.isSame(booking.checkInDate) || scheduleDate.isAfter(booking.checkInDate)) && 
              scheduleDate.isBefore(booking.checkOutDate)
            );
            
            pickup = prevHotel ? (prevHotel.hotelName || prevHotel.hotelAddress) : '酒店';
            dropoff = tonightHotel ? (tonightHotel.hotelName || tonightHotel.hotelAddress) : '酒店';
            currentHotelName = tonightHotel ? tonightHotel.hotelName : '无';
          }

          console.log(`🚐 [接送调试] ${scheduleDate.format('MM-DD')} - 接: ${pickup}, 送: ${dropoff}, 住宿: ${currentHotelName}`);

          return {
            date: scheduleDate.format('YYYY-MM-DD'),
            dayNumber: schedule.dayNumber,
            title: schedule.title,
            pickup,
            dropoff,
            hotel: currentHotelName,
            isTransferDay: pickup !== dropoff && !isFirstDay && !isLastDay
          };
        });

        setPreviewTransfers(transfers);
      }
    } catch (error) {
      console.error('生成接送预览失败:', error);
    }
  };

  // 保存所有酒店预订
  const handleSaveAllBookings = async () => {
    if (hotelBookings.length === 0) {
      message.error('请至少添加一个酒店预订');
      return;
    }

    setSubmitting(true);
    try {
      // 保存或更新所有酒店预订
      for (const booking of hotelBookings) {
        const bookingData = {
          ...booking,
          checkInDate: booking.checkInDate.format('YYYY-MM-DD'),
          checkOutDate: booking.checkOutDate.format('YYYY-MM-DD'),
          tourBookingId: orderInfo.bookingId,
          bookingSource: 'system'
        };

        console.log(`💾 [保存酒店] ${booking.id ? '更新' : '新增'} 酒店预订:`, bookingData);

        if (booking.id) {
          const updateResult = await updateHotelBooking(bookingData);
          console.log('✅ 更新酒店预订结果:', updateResult);
        } else {
          const addResult = await addHotelBooking(bookingData);
          console.log('✅ 新增酒店预订结果:', addResult);
        }
      }

      // 始终更新排团表的接送信息（函数内部会只处理已确认的预订）
      await updateScheduleTransfers();

      message.success('酒店预订保存成功！');
      onSuccess && onSuccess();
    } catch (error) {
      console.error('保存酒店预订失败:', error);
      message.error('保存失败：' + (error.message || '未知错误'));
    } finally {
      setSubmitting(false);
    }
  };

  // 更新排团表的接送信息（只基于已确认的酒店预订）
  const updateScheduleTransfers = async () => {
    try {
      const scheduleResponse = await getSchedulesByBookingId(orderInfo.bookingId);
      if (scheduleResponse?.code === 1 && scheduleResponse?.data?.length > 0) {
        const schedules = scheduleResponse.data.sort((a, b) => dayjs(a.tourDate).diff(dayjs(b.tourDate)));
        
        // 只使用已确认的酒店预订
        const confirmedBookings = hotelBookings.filter(b => b.bookingStatus === 'confirmed');
        
        if (confirmedBookings.length === 0) {
          console.log('📝 [更新排团表] 没有已确认的酒店预订，跳过接送信息更新');
          return;
        }

        // 按日期排序已确认的酒店预订
        const sortedBookings = [...confirmedBookings].sort((a, b) => a.checkInDate.diff(b.checkInDate));
        
        console.log('🏨 [更新排团表] 已确认的酒店预订:', sortedBookings.map(b => ({
          name: b.hotelName,
          checkIn: b.checkInDate.format('MM-DD'),
          checkOut: b.checkOutDate.format('MM-DD'),
          address: b.hotelAddress
        })));

        const updatedSchedules = [];

        schedules.forEach(schedule => {
          const scheduleDate = dayjs(schedule.tourDate);
          const isFirstDay = scheduleDate.isSame(schedules[0].tourDate);
          const isLastDay = scheduleDate.isSame(schedules[schedules.length - 1].tourDate);
          
          // 保持原有的接送地点，只更新酒店相关部分
          let pickup = schedule.pickupLocation || '未指定';
          let dropoff = schedule.dropoffLocation || '未指定';

          if (isFirstDay) {
            // 第一天：保持原有接机安排，只更新送到酒店
            // pickup 保持不变（不覆盖原有的接机安排）
            const firstHotel = sortedBookings.find(booking => 
              (scheduleDate.isSame(booking.checkInDate) || scheduleDate.isAfter(booking.checkInDate))
            );
            // 只更新送客地点为酒店
            if (firstHotel) {
              dropoff = firstHotel.hotelName || firstHotel.hotelAddress;
            }
            console.log(`📝 [第一天] 保持接机: ${pickup}, 更新送客: ${dropoff}`);
          } else if (isLastDay) {
            // 最后一天：只更新从酒店接，保持原有送机安排
            const lastHotel = sortedBookings.find(booking => 
              (scheduleDate.isSame(booking.checkOutDate) || scheduleDate.isBefore(booking.checkOutDate)) && 
              scheduleDate.isAfter(booking.checkInDate)
            ) || sortedBookings[sortedBookings.length - 1]; // 兜底取最后一个酒店
            
            // 只更新接客地点为酒店
            if (lastHotel) {
              pickup = lastHotel.hotelName || lastHotel.hotelAddress;
            }
            // dropoff 保持不变（不覆盖原有的送机安排）
            console.log(`📝 [最后一天] 更新接客: ${pickup}, 保持送机: ${dropoff}`);
          } else {
            // 中间天：正常更新酒店间的接送
            
            // 找到昨晚住的酒店（接的地点）
            const prevDay = scheduleDate.subtract(1, 'day');
            const prevHotel = sortedBookings.find(booking => 
              (prevDay.isSame(booking.checkInDate) || prevDay.isAfter(booking.checkInDate)) && 
              prevDay.isBefore(booking.checkOutDate)
            );
            
            // 找到今晚要住的酒店（送的地点）
            const tonightHotel = sortedBookings.find(booking => 
              (scheduleDate.isSame(booking.checkInDate) || scheduleDate.isAfter(booking.checkInDate)) && 
              scheduleDate.isBefore(booking.checkOutDate)
            );
            
            pickup = prevHotel ? (prevHotel.hotelName || prevHotel.hotelAddress) : '酒店';
            dropoff = tonightHotel ? (tonightHotel.hotelName || tonightHotel.hotelAddress) : '酒店';
            console.log(`📝 [中间天] 酒店接送: ${pickup} → ${dropoff}`);
          }

          updatedSchedules.push({
            ...schedule,
            pickupLocation: pickup,
            dropoffLocation: dropoff
          });
          
          console.log(`📝 [更新排团表] ${scheduleDate.format('MM-DD')} - 接: ${pickup}, 送: ${dropoff}`);
        });

        if (updatedSchedules.length > 0) {
          await saveBatchSchedules({
            bookingId: orderInfo.bookingId,
            schedules: updatedSchedules
          });
          console.log('✅ [更新排团表] 接送信息更新成功');
        }
      }
    } catch (error) {
      console.error('更新排团表接送信息失败:', error);
    }
  };

  // 处理酒店选择变化
  const handleHotelChange = (hotelId) => {
    setCurrentHotelId(hotelId);
    form.setFieldsValue({ roomTypeId: undefined });
    fetchRoomTypes(hotelId);
  };

  // 获取行程日期范围并设置默认入住退房日期
  const fetchTourDatesAndSetDefaults = async () => {
    if (!orderInfo?.bookingId) return;

    try {
      const scheduleResponse = await getSchedulesByBookingId(orderInfo.bookingId);
      if (scheduleResponse?.code === 1 && scheduleResponse?.data?.length > 0) {
        const schedules = scheduleResponse.data.sort((a, b) => dayjs(a.tourDate).diff(dayjs(b.tourDate)));
        
        // 获取行程的第一天和最后一天
        const firstTourDate = dayjs(schedules[0].tourDate);
        const lastTourDate = dayjs(schedules[schedules.length - 1].tourDate);
        
        console.log('🗓️ [行程日期] 第一天:', firstTourDate.format('YYYY-MM-DD'), '最后一天:', lastTourDate.format('YYYY-MM-DD'));
        
        // 设置表单默认值，包括根据行程日期计算的入住和退房日期
        if (orderInfo) {
          form.setFieldsValue({
            guestName: orderInfo.name,
            guestPhone: orderInfo.phone,
            adultCount: orderInfo.adultCount || 1,
            childCount: orderInfo.childCount || 0,
            roomCount: 1,
            bookingStatus: 'pending',
            // 默认入住日期为行程第一天，退房日期为行程最后一天（最后一天退房，不住宿）
            checkInDate: firstTourDate,
            checkOutDate: lastTourDate
          });
          
          console.log('🏨 [默认日期] 入住:', firstTourDate.format('YYYY-MM-DD'), '退房:', lastTourDate.format('YYYY-MM-DD'));
        }
      }
    } catch (error) {
      console.error('获取行程日期失败:', error);
      
      // 如果获取行程日期失败，使用基本的客人信息预填充
      if (orderInfo) {
        form.setFieldsValue({
          guestName: orderInfo.name,
          guestPhone: orderInfo.phone,
          adultCount: orderInfo.adultCount || 1,
          childCount: orderInfo.childCount || 0,
          roomCount: 1,
          bookingStatus: 'pending'
        });
      }
    }
  };

  // 初始化
  useEffect(() => {
    if (visible) {
      fetchHotels();
      fetchExistingBookings();
      fetchTourDatesAndSetDefaults();
    } else {
      form.resetFields();
      setHotelBookings([]);
      setEditingIndex(-1);
      setCurrentHotelId(null);
      setPreviewTransfers([]);
    }
  }, [visible, orderInfo]);

  // 生成接送预览
  useEffect(() => {
    if (visible && hotelBookings.length > 0) {
      generateTransferPreview();
    }
  }, [hotelBookings, visible]);

  return (
    <Modal
      title={
        <Space>
          <HomeOutlined />
          多酒店预订管理 - {orderInfo?.name || '客户'}
        </Space>
      }
      visible={visible}
      onCancel={onCancel}
      width={1200}
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
            <Descriptions.Item label="订单状态">{orderInfo?.status || '进行中'}</Descriptions.Item>
            <Descriptions.Item label="成人数量">{orderInfo?.adultCount}人</Descriptions.Item>
            <Descriptions.Item label="儿童数量">{orderInfo?.childCount}人</Descriptions.Item>
          </Descriptions>
        </Card>

        <Row gutter={16}>
          {/* 左侧：酒店预订表单 */}
          <Col span={12}>
            <Card 
              title={
                <Space>
                  <PlusOutlined />
                  {editingIndex >= 0 ? '编辑酒店预订' : '添加酒店预订'}
                </Space>
              }
              size="small"
            >
              <Form
                form={form}
                layout="vertical"
                onFinish={handleAddHotel}
              >
                <Row gutter={8}>
                  <Col span={12}>
                    <Form.Item
                      label="选择酒店"
                      name="hotelId"
                      rules={[{ required: true, message: '请选择酒店' }]}
                    >
                      <Select
                        placeholder="选择酒店"
                        onChange={handleHotelChange}
                        showSearch
                        filterOption={(input, option) =>
                          option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
                        }
                      >
                        {hotels.map(hotel => (
                          <Option key={hotel.id} value={hotel.id}>
                            {hotel.hotelName || hotel.name} - {hotel.hotelLevel}
                            {hotel.address && ` (${hotel.address})`}
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
                      <Select placeholder="选择房型">
                        {(roomTypes[currentHotelId] || []).map(roomType => (
                          <Option key={roomType.id} value={roomType.id}>
                            {roomType.roomType || roomType.name} - ${roomType.basePrice || roomType.price}/晚
                          </Option>
                        ))}
                      </Select>
                    </Form.Item>
                  </Col>
                </Row>

                <Row gutter={8}>
                  <Col span={12}>
                    <Form.Item
                      label="入住日期"
                      name="checkInDate"
                      rules={[{ required: true, message: '请选择入住日期' }]}
                    >
                      <DatePicker style={{ width: '100%' }} />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item
                      label="退房日期"
                      name="checkOutDate"
                      rules={[{ required: true, message: '请选择退房日期' }]}
                    >
                      <DatePicker style={{ width: '100%' }} />
                    </Form.Item>
                  </Col>
                </Row>

                <Row gutter={8}>
                  <Col span={8}>
                    <Form.Item label="房间数" name="roomCount">
                      <InputNumber min={1} style={{ width: '100%' }} />
                    </Form.Item>
                  </Col>
                  <Col span={8}>
                    <Form.Item label="成人数" name="adultCount">
                      <InputNumber min={1} style={{ width: '100%' }} />
                    </Form.Item>
                  </Col>
                  <Col span={8}>
                    <Form.Item label="儿童数" name="childCount">
                      <InputNumber min={0} style={{ width: '100%' }} />
                    </Form.Item>
                  </Col>
                </Row>

                <Row gutter={8}>
                  <Col span={12}>
                    <Form.Item label="客人姓名" name="guestName">
                      <Input />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item label="客人电话" name="guestPhone">
                      <Input />
                    </Form.Item>
                  </Col>
                </Row>

                <Form.Item label="预订状态" name="bookingStatus">
                  <Select>
                    {statusOptions.map(option => (
                      <Option key={option.value} value={option.value}>
                        <Tag color={option.color}>{option.label}</Tag>
                      </Option>
                    ))}
                  </Select>
                </Form.Item>

                <Form.Item label="特殊要求" name="specialRequests">
                  <TextArea rows={2} />
                </Form.Item>

                <Form.Item>
                  <Space>
                    <Button type="primary" htmlType="submit" icon={<SaveOutlined />}>
                      {editingIndex >= 0 ? '更新预订' : '添加预订'}
                    </Button>
                    {editingIndex >= 0 && (
                      <Button 
                        onClick={() => {
                          setEditingIndex(-1);
                          form.resetFields();
                          fetchTourDatesAndSetDefaults();
                          setCurrentHotelId(null);
                        }}
                      >
                        取消编辑
                      </Button>
                    )}
                  </Space>
                </Form.Item>
              </Form>
            </Card>
          </Col>

          {/* 右侧：酒店预订列表和接送预览 */}
          <Col span={12}>
            {/* 酒店预订列表 */}
            <Card 
              title={
                <Space>
                  <HomeOutlined />
                  酒店预订列表 ({hotelBookings.length})
                </Space>
              }
              size="small"
              style={{ marginBottom: 16 }}
            >
              <List
                size="small"
                dataSource={hotelBookings}
                renderItem={(booking, index) => (
                  <List.Item
                    actions={[
                      <Button size="small" onClick={() => handleEditHotel(index)}>
                        编辑
                      </Button>,
                      <Popconfirm
                        title="确定删除这个酒店预订吗？"
                        description={booking.id ? "将同时删除后端酒店预订记录" : "仅删除前端临时记录"}
                        okText="确定"
                        cancelText="取消"
                        onConfirm={async () => {
                          await handleDeleteHotel(index);
                        }}
                        onCancel={() => console.log('🗑️ [删除酒店] 用户取消删除')}
                      >
                        <Button size="small" danger icon={<DeleteOutlined />}>
                          删除
                        </Button>
                      </Popconfirm>
                    ]}
                  >
                    <List.Item.Meta
                      title={
                        <Space>
                          <Text strong>{booking.hotelName}</Text>
                          <Tag color={statusOptions.find(s => s.value === booking.bookingStatus)?.color}>
                            {statusOptions.find(s => s.value === booking.bookingStatus)?.label}
                          </Tag>
                        </Space>
                      }
                      description={
                        <div>
                          <div>{booking.checkInDate.format('MM-DD')} ~ {booking.checkOutDate.format('MM-DD')} ({booking.nights}晚)</div>
                          <div>{booking.roomTypeName} × {booking.roomCount}间</div>
                        </div>
                      }
                    />
                  </List.Item>
                )}
              />
            </Card>

            {/* 接送预览 */}
            {previewTransfers.length > 0 && (
              <Card 
                title={
                  <Space>
                    <EnvironmentOutlined />
                    接送地点预览
                  </Space>
                }
                size="small"
              >
                <Alert
                  message="根据酒店预订自动生成的接送安排"
                  description="只有已确认的酒店预订才会更新到排团表"
                  type="info"
                  showIcon
                  style={{ marginBottom: 12 }}
                />
                <Timeline size="small">
                  {previewTransfers.map((transfer, index) => (
                    <Timeline.Item
                      key={transfer.date}
                      color={transfer.isTransferDay ? 'orange' : 'green'}
                      dot={transfer.isTransferDay ? <EnvironmentOutlined /> : <ClockCircleOutlined />}
                    >
                      <div>
                        <Text strong>{transfer.date} 第{transfer.dayNumber}天</Text>
                        <div style={{ color: '#666', fontSize: '12px' }}>{transfer.title}</div>
                        <div style={{ marginTop: 4 }}>
                          <Space>
                            <Tag color="blue">接: {transfer.pickup}</Tag>
                            <Tag color="orange">送: {transfer.dropoff}</Tag>
                          </Space>
                        </div>
                        {transfer.hotel !== '无' && (
                          <div style={{ color: '#999', fontSize: '11px' }}>
                            🏨 住宿: {transfer.hotel}
                          </div>
                        )}
                      </div>
                    </Timeline.Item>
                  ))}
                </Timeline>
              </Card>
            )}
          </Col>
        </Row>

        <Divider />

        <div style={{ textAlign: 'right' }}>
          <Space>
            <Button onClick={onCancel}>取消</Button>
            <Button 
              type="primary" 
              onClick={handleSaveAllBookings}
              loading={submitting}
              disabled={hotelBookings.length === 0}
              icon={<SaveOutlined />}
            >
              保存所有酒店预订
            </Button>
          </Space>
        </div>
      </Spin>
    </Modal>
  );
};

export default MultiHotelBookingModal; 