import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { 
  Card, 
  Table, 
  Button, 
  Typography, 
  Space, 
  Tag, 
  Row, 
  Col, 
  Divider, 
  message,
  Spin,
  Empty
} from 'antd';
import { 
  ArrowLeftOutlined, 
  UserOutlined, 
  PhoneOutlined, 
  HomeOutlined,
  CalendarOutlined,
  TeamOutlined,
  IdcardOutlined,
  PrinterOutlined,
  EnvironmentOutlined,
  CarOutlined,
  UserSwitchOutlined
} from '@ant-design/icons';
import { getSchedulesByDateRange, getAssignmentByDateAndLocation } from '@/api/tourSchedule';
import dayjs from 'dayjs';
import './index.scss';

const { Title, Text } = Typography;

const TourItinerary = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [itineraryData, setItineraryData] = useState([]);
  const [guideInfo, setGuideInfo] = useState({});
  const [vehicleInfo, setVehicleInfo] = useState({});
  const [locationInfo, setLocationInfo] = useState({});

  const selectedDate = searchParams.get('date');
  const selectedLocation = searchParams.get('location');

  useEffect(() => {
    if (selectedDate && selectedLocation) {
      fetchAssignmentData();
    }
  }, [selectedDate, selectedLocation]);

  const fetchAssignmentData = async () => {
    setLoading(true);
    try {
      console.log('获取分配数据 - 日期:', selectedDate, '地点:', selectedLocation);
      
      // 1. 先尝试获取导游车辆分配信息（用于获取导游和车辆基本信息）
      const assignmentResponse = await getAssignmentByDateAndLocation(selectedDate, selectedLocation);
      console.log('分配信息响应:', assignmentResponse);
      
      // 2. 同时获取该日期该地点的所有订单详细信息（散拼团的关键数据）
      const scheduleResponse = await getSchedulesByDateRange(selectedDate, selectedDate);
      console.log('行程数据响应:', scheduleResponse);
      
      let hasScheduleData = false;
      let locationSchedules = [];
      
      if (scheduleResponse && scheduleResponse.code === 1 && scheduleResponse.data) {
        const allSchedules = scheduleResponse.data;
        
        // 筛选出该地点的行程数据 - 更灵活的匹配逻辑
        locationSchedules = allSchedules.filter(schedule => {
          const scheduleTitle = schedule.title || '';
          const scheduleLocation = schedule.location || schedule.destinationName || '';
          
          // 多种匹配方式：
          // 1. 标题中包含地点名称
          // 2. location字段匹配
          // 3. destinationName字段匹配
          return scheduleTitle.includes(selectedLocation) || 
                 scheduleLocation === selectedLocation ||
                 scheduleLocation.includes(selectedLocation);
        });
        
        console.log('筛选后的地点行程数据:', locationSchedules);
        hasScheduleData = locationSchedules.length > 0;
      }
      
      // 3. 设置导游和车辆信息（优先使用分配表数据）
      if (assignmentResponse && assignmentResponse.code === 1 && assignmentResponse.data && assignmentResponse.data.length > 0) {
        const assignment = assignmentResponse.data[0];
        console.log('分配数据详情:', assignment);
        
        // 设置导游信息 - 优先使用分配表中的基本信息
        setGuideInfo({
          guideName: assignment.guideName || assignment.guide?.guideName || 'Tom',
          guidePhone: assignment.contactPhone || assignment.guide?.phone || '未提供',
          guideId: assignment.guideId || assignment.guide?.guideId || ''
        });
        
        // 设置车辆信息 - 优先使用分配表中的基本信息
        setVehicleInfo({
          vehicleType: assignment.vehicleType || assignment.vehicle?.vehicleType || 'XT50AT Rosa 25座',
          licensePlate: assignment.licensePlate || assignment.vehicle?.licensePlate || '霍桑L',
          capacity: assignment.vehicle?.seatCount || assignment.totalPeople || '25',
          driverName: assignment.driverName || assignment.vehicle?.driverName || 'Tolmans'
        });
      } else if (hasScheduleData) {
        // 如果没有分配数据，从第一个行程记录中获取导游车辆信息
        const firstSchedule = locationSchedules[0];
        
        setGuideInfo({
          guideName: firstSchedule.guideName || 'Tom',
          guidePhone: firstSchedule.guidePhone || '未提供',
          guideId: firstSchedule.guideId || ''
        });
        
        setVehicleInfo({
          vehicleType: firstSchedule.vehicleType || 'XT50AT Rosa 25座',
          licensePlate: firstSchedule.licensePlate || '霍桑L',
          capacity: firstSchedule.vehicleCapacity || '25',
          driverName: firstSchedule.driverName || 'Tolmans'
        });
      }
      
      // 4. 处理客人数据 - 重点：从排团表获取所有订单的详细客人信息
      if (hasScheduleData) {
        // 设置地点信息
        setLocationInfo({
          location: selectedLocation,
          tourDate: selectedDate,
          totalPeople: locationSchedules.reduce((sum, schedule) => 
            sum + (schedule.adultCount || 0) + (schedule.childCount || 0), 0)
        });
        
        // 处理每个订单的客人数据 - 每个订单一行，显示完整的联系信息
        const customerData = locationSchedules.map((schedule, index) => ({
          key: schedule.id || index,
          suggestedTime: schedule.suggestedTime || '待确认',
          orderNumber: schedule.orderNumber || `ORD${index + 1}`,
          customerName: schedule.contactPerson || '客户姓名',
          totalPeople: (schedule.adultCount || 0) + (schedule.childCount || 0),
          contactInfo: schedule.contactPhone || '联系电话',
          hotelInfo: schedule.pickupLocation || '酒店信息',
          pickupLocation: schedule.pickupLocation || '',
          dropoffLocation: schedule.dropoffLocation || '',
          remarks: schedule.specialRequests || '无特殊要求',
          nextStation: schedule.nextLocation || '下一站',
          adultCount: schedule.adultCount || 0,
          childCount: schedule.childCount || 0,
          flightNumber: schedule.flightNumber || '',
          returnFlightNumber: schedule.returnFlightNumber || '',
          // 添加更多订单详细信息
          bookingId: schedule.bookingId || schedule.id,
          passengerContact: schedule.passengerContact || schedule.contactPhone,
          luggageCount: schedule.luggageCount || 0,
          hotelCheckInDate: schedule.hotelCheckInDate,
          hotelCheckOutDate: schedule.hotelCheckOutDate,
          roomDetails: schedule.roomDetails,
          arrivalLandingTime: schedule.arrivalLandingTime,
          departureDepartureTime: schedule.departureDepartureTime
        }));
        
        console.log('处理后的客人数据:', customerData);
        
        // 更新统计信息
        const totalOrders = customerData.length;
        const totalAdults = customerData.reduce((sum, item) => sum + item.adultCount, 0);
        const totalChildren = customerData.reduce((sum, item) => sum + item.childCount, 0);
        const totalLuggage = customerData.reduce((sum, item) => sum + item.luggageCount, 0);
        
        // 设置地点信息（包含统计）
        setLocationInfo({
          location: selectedLocation,
          tourDate: selectedDate,
          totalPeople: totalAdults + totalChildren,
          totalOrders: totalOrders,
          totalAdults: totalAdults,
          totalChildren: totalChildren,
          totalLuggage: totalLuggage
        });
        
        setItineraryData(customerData);
      } else if (assignmentResponse && assignmentResponse.code === 1 && assignmentResponse.data && assignmentResponse.data.length > 0) {
        // 如果有分配数据但没有行程数据，显示分配数据的基本信息
        const assignment = assignmentResponse.data[0];
        console.log('仅有分配数据，创建基本显示');
        
        setLocationInfo({
          location: selectedLocation,
          tourDate: selectedDate,
          totalPeople: assignment.totalPeople || 0
        });
        
        // 创建一个基本的显示行
        const basicData = [{
          key: 1,
          suggestedTime: '待确认',
          orderNumber: '分配已确认',
          customerName: assignment.contactPerson || '待更新',
          totalPeople: assignment.totalPeople || 0,
          contactInfo: assignment.contactPhone || '待更新',
          hotelInfo: '待更新',
          pickupLocation: assignment.pickupLocation || '待确认',
          dropoffLocation: assignment.dropoffLocation || '待确认',
          remarks: assignment.remarks || '无',
          nextStation: assignment.nextDestination || '待确认',
          adultCount: assignment.adultCount || 0,
          childCount: assignment.childCount || 0,
          flightNumber: '',
          returnFlightNumber: '',
          bookingId: assignment.bookingIds?.[0] || 'N/A',
          passengerContact: assignment.contactPhone || '',
          luggageCount: 0,
          hotelCheckInDate: null,
          hotelCheckOutDate: null,
          roomDetails: '',
          arrivalLandingTime: null,
          departureDepartureTime: null
        }];
        
        setItineraryData(basicData);
        message.info('已找到分配信息，详细订单数据正在同步中');
      } else {
        // 如果没有任何数据
        setLocationInfo({
          location: selectedLocation,
          tourDate: selectedDate,
          totalPeople: 0
        });
        setItineraryData([]);
        message.warning('该日期该地点暂无订单数据');
      }
    } catch (error) {
      console.error('获取分配数据失败:', error);
      message.error('获取分配数据失败');
      setItineraryData([]);
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      title: '建议时间',
      dataIndex: 'suggestedTime',
      key: 'suggestedTime',
      width: 90,
      render: (time) => time || '建议时间'
    },
    {
      title: '订单号',
      dataIndex: 'orderNumber',
      key: 'orderNumber',
      width: 120,
      render: (orderNumber, record) => (
        <div>
          <div style={{ color: '#1890ff', fontWeight: 'bold' }}>{orderNumber}</div>
          <div style={{ fontSize: '11px', color: '#999' }}>
            订单ID: {record.bookingId || 'N/A'}
          </div>
        </div>
      )
    },
    {
      title: '客人信息',
      dataIndex: 'customerName',
      key: 'customerName',
      width: 150,
      render: (name, record) => (
        <div>
          <div style={{ fontWeight: 'bold', fontSize: '14px' }}>{name}</div>
          <div style={{ fontSize: '12px', color: '#666' }}>
            {record.hotelInfo}
          </div>
          {record.roomDetails && (
            <div style={{ fontSize: '11px', color: '#999' }}>
              房间: {record.roomDetails}
            </div>
          )}
        </div>
      )
    },
    {
      title: '人数详情',
      dataIndex: 'totalPeople',
      key: 'totalPeople',
      width: 80,
      align: 'center',
      render: (total, record) => (
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontWeight: 'bold', color: '#ff4d4f', fontSize: '16px' }}>
            {total}人
          </div>
          <div style={{ fontSize: '11px', color: '#666' }}>
            成人{record.adultCount} 儿童{record.childCount}
          </div>
          {record.luggageCount > 0 && (
            <div style={{ fontSize: '11px', color: '#999' }}>
              行李{record.luggageCount}件
            </div>
          )}
        </div>
      )
    },
    {
      title: '联系方式',
      dataIndex: 'contactInfo',
      key: 'contactInfo',
      width: 130,
      render: (contact, record) => (
        <div>
          <div style={{ fontWeight: 'bold' }}>{contact}</div>
          {record.passengerContact && record.passengerContact !== contact && (
            <div style={{ fontSize: '11px', color: '#666' }}>
              备用: {record.passengerContact}
            </div>
          )}
        </div>
      )
    },
    {
      title: '航班信息',
      key: 'flightInfo',
      width: 120,
      render: (_, record) => (
        <div style={{ fontSize: '11px' }}>
          {record.flightNumber && (
            <div>到达: {record.flightNumber}</div>
          )}
          {record.arrivalLandingTime && (
            <div style={{ color: '#1890ff' }}>
              {dayjs(record.arrivalLandingTime).format('MM-DD HH:mm')}
            </div>
          )}
          {record.returnFlightNumber && (
            <div style={{ marginTop: '2px' }}>返程: {record.returnFlightNumber}</div>
          )}
          {record.departureDepartureTime && (
            <div style={{ color: '#ff4d4f' }}>
              {dayjs(record.departureDepartureTime).format('MM-DD HH:mm')}
            </div>
          )}
        </div>
      )
    },
    {
      title: '接客信息',
      dataIndex: 'pickupLocation',
      key: 'pickupLocation',
      width: 150,
      render: (pickup, record) => (
        <div>
          <div style={{ fontWeight: 'bold' }}>接: {pickup}</div>
          {record.hotelCheckInDate && (
            <div style={{ fontSize: '11px', color: '#666' }}>
              入住: {dayjs(record.hotelCheckInDate).format('MM-DD')}
            </div>
          )}
        </div>
      )
    },
    {
      title: '送客信息',
      dataIndex: 'dropoffLocation',
      key: 'dropoffLocation',
      width: 150,
      render: (dropoff, record) => (
        <div>
          <div style={{ fontWeight: 'bold' }}>送: {dropoff}</div>
          {record.hotelCheckOutDate && (
            <div style={{ fontSize: '11px', color: '#666' }}>
              退房: {dayjs(record.hotelCheckOutDate).format('MM-DD')}
            </div>
          )}
        </div>
      )
    },
    {
      title: '特殊要求',
      dataIndex: 'remarks',
      key: 'remarks',
      width: 180,
      render: (remarks) => (
        <div style={{ 
          color: remarks?.includes('建议') || remarks?.includes('注意') ? '#ff4d4f' : '#000',
          fontSize: '12px',
          lineHeight: '1.4'
        }}>
          {remarks}
        </div>
      )
    },
    {
      title: '下一站',
      dataIndex: 'nextStation',
      key: 'nextStation',
      width: 100,
      render: (nextStation) => (
        <span style={{ color: '#52c41a', fontWeight: 'bold' }}>{nextStation}</span>
      )
    }
  ];

  const handleBack = () => {
    navigate(-1);
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="tour-itinerary-loading">
        <Spin size="large" />
      </div>
    );
  }

  // 参数验证
  if (!selectedDate || !selectedLocation) {
    return (
      <div className="tour-itinerary-container">
        <Card>
          <div className="header-section">
            <Button 
              type="text" 
              icon={<ArrowLeftOutlined />} 
              onClick={handleBack}
              className="back-btn"
            >
              返回
            </Button>
            <Title level={3}>导游用车分配表</Title>
          </div>
          <Empty description="缺少必要参数，请从行程分配管理页面进入" />
        </Card>
      </div>
    );
  }

  if (!itineraryData || itineraryData.length === 0) {
    return (
      <div className="tour-itinerary-container">
        <Card>
          <div className="header-section">
            <Button 
              type="text" 
              icon={<ArrowLeftOutlined />} 
              onClick={handleBack}
              className="back-btn"
            >
              返回
            </Button>
            <Title level={3}>导游用车分配表</Title>
          </div>
          <Empty description="暂无分配数据" />
        </Card>
      </div>
    );
  }

  return (
    <div className="tour-itinerary-container">
      <Card className="itinerary-card">
        {/* 页面头部 */}
        <div className="header-section no-print">
          <Button 
            type="text" 
            icon={<ArrowLeftOutlined />} 
            onClick={handleBack}
            className="back-btn"
          >
            返回
          </Button>
          <div className="header-actions">
            <Button 
              type="primary" 
              icon={<PrinterOutlined />} 
              onClick={handlePrint}
            >
              打印分配表
            </Button>
          </div>
        </div>

        {/* 导游用车信息头部 */}
        <div className="assignment-header">
          <Row gutter={16} style={{ marginBottom: 16 }}>
            <Col span={6}>
              <div className="info-item">
                <Text strong style={{ color: '#1890ff' }}>日期</Text>
                <div style={{ fontSize: '16px', fontWeight: 'bold' }}>
                  {dayjs(locationInfo.tourDate).format('YYYY/M/D')}
                </div>
              </div>
            </Col>
            <Col span={6}>
              <div className="info-item">
                <Text strong style={{ color: '#1890ff' }}>地点</Text>
                <div style={{ fontSize: '16px', fontWeight: 'bold' }}>
                  <EnvironmentOutlined style={{ marginRight: 4 }} />
                  {locationInfo.location}
                </div>
              </div>
            </Col>
            <Col span={6}>
              <div className="info-item">
                <Text strong style={{ color: '#1890ff' }}>导游</Text>
                <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#52c41a' }}>
                  <UserSwitchOutlined style={{ marginRight: 4 }} />
                  {guideInfo.guideName}
                </div>
              </div>
            </Col>
            <Col span={6}>
              <div className="info-item">
                <Text strong style={{ color: '#1890ff' }}>总人数</Text>
                <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#ff4d4f' }}>
                  <TeamOutlined style={{ marginRight: 4 }} />
                  {locationInfo.totalPeople}
                </div>
              </div>
            </Col>
          </Row>
          
          {/* 车辆信息 */}
          <div className="vehicle-info" style={{ 
            background: '#f6ffed', 
            border: '1px solid #b7eb8f',
            borderRadius: '6px',
            padding: '12px',
            marginBottom: '16px'
          }}>
            <Text strong style={{ color: '#1890ff' }}>
              <CarOutlined style={{ marginRight: 8 }} />
              车辆信息: 
            </Text>
            <Text style={{ fontSize: '14px', fontWeight: 'bold', marginLeft: 8 }}>
              {vehicleInfo.vehicleType} {vehicleInfo.licensePlate} {vehicleInfo.capacity} {vehicleInfo.driverName}
            </Text>
          </div>
        </div>

        {/* 订单统计信息 */}
        <div className="order-summary" style={{
          background: '#fff7e6',
          border: '1px solid #ffd591',
          borderRadius: '6px',
          padding: '12px',
          marginBottom: '16px'
        }}>
          <Row gutter={16}>
            <Col span={6}>
              <Text strong style={{ color: '#fa8c16' }}>订单总数: </Text>
              <Text style={{ fontSize: '16px', fontWeight: 'bold' }}>
                {locationInfo.totalOrders || itineraryData.length}单
              </Text>
            </Col>
            <Col span={6}>
              <Text strong style={{ color: '#fa8c16' }}>成人总数: </Text>
              <Text style={{ fontSize: '16px', fontWeight: 'bold' }}>
                {locationInfo.totalAdults || itineraryData.reduce((sum, item) => sum + (item.adultCount || 0), 0)}人
              </Text>
            </Col>
            <Col span={6}>
              <Text strong style={{ color: '#fa8c16' }}>儿童总数: </Text>
              <Text style={{ fontSize: '16px', fontWeight: 'bold' }}>
                {locationInfo.totalChildren || itineraryData.reduce((sum, item) => sum + (item.childCount || 0), 0)}人
              </Text>
            </Col>
            <Col span={6}>
              <Text strong style={{ color: '#fa8c16' }}>行李总数: </Text>
              <Text style={{ fontSize: '16px', fontWeight: 'bold' }}>
                {locationInfo.totalLuggage || itineraryData.reduce((sum, item) => sum + (item.luggageCount || 0), 0)}件
              </Text>
            </Col>
          </Row>
        </div>

        <Divider style={{ margin: '16px 0' }} />

        {/* 客人详细信息表格 */}
        <div className="customer-table-section">
          <Title level={4} style={{ marginBottom: '12px', color: '#1890ff' }}>
            <IdcardOutlined style={{ marginRight: 8 }} />
            散拼团客人详细信息 ({itineraryData.length}个订单)
          </Title>
          <Table 
            columns={columns}
            dataSource={itineraryData}
            rowKey="key"
            pagination={false}
            size="small"
            className="customer-assignment-table"
            scroll={{ x: 1200 }}
            bordered
            rowClassName={(record, index) => index % 2 === 0 ? 'table-row-light' : 'table-row-dark'}
          />
        </div>

        {/* 底部标注 */}
        <div className="footer-note" style={{ 
          marginTop: '20px', 
          textAlign: 'center',
          color: '#ff4d4f',
          fontWeight: 'bold'
        }}>
          线上到Ironcreak
        </div>

        {/* 页脚信息 */}
        <div className="footer-section">
          <Divider />
          <div className="footer-content">
            <Text type="secondary">
              Happy Tassie Travel | 导游用车分配表
            </Text>
            <br />
            <Text type="secondary" style={{ fontSize: '12px' }}>
              打印时间: {dayjs().format('YYYY-MM-DD HH:mm:ss')}
            </Text>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default TourItinerary; 