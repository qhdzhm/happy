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
  Empty,
  Input
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
import { getSchedulesByDateRange, getAssignmentByDateAndLocation, updateGuideRemarks, getPassengersByBookingId } from '@/api/tourSchedule';
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
  const [editingRemarks, setEditingRemarks] = useState({});
  const [tempRemarks, setTempRemarks] = useState({});
  const [nextStationData, setNextStationData] = useState({}); // 存储下一站数据

  const selectedDate = searchParams.get('date');
  const selectedLocation = searchParams.get('location');

  // 提取地点名称的辅助函数
  const extractLocationName = (title) => {
    if (!title) return '';
    
    // 处理亚瑟港的特殊情况
    if (title.includes('亚瑟港')) {
      if (title.includes('不含门票')) {
        return '亚(不)';
      } else if (title.includes('迅游') || title.includes('1.5小时')) {
        return '亚(迅)';
      } else {
        return '亚'; // Default for "含门票"
      }
    }
    
    // 其他地点的简化映射
    const simplifiedNames = {
      '霍巴特市游': '霍', '霍巴特市区': '霍', '霍巴特周边经典': '霍', '霍巴特': '霍',
      '布鲁尼岛美食生态': '布', '布鲁尼岛': '布',
      '摇篮山': '摇', '朗塞斯顿': '朗', '玛丽亚岛': '玛', '菲尔德山': '菲尔德',
      '菲欣纳国家公园': '菲', '菲欣纳': '菲', '塔斯曼半岛': '塔', '非常湾': '非常',
      '摩恩谷': '摩恩', '卡尔德': '卡尔德', '珊瑚湾': '珊瑚',
      '德文波特': '德', '比奇诺': '比', '斯旺西': '斯', '里奇蒙': '里',
      '惠灵顿山': '惠', '萨拉曼卡': '萨', '塔斯马尼亚恶魔公园': '恶魔', '薰衣草庄园': '薰衣草',
      '酒杯湾': '酒'
    };
    
    // 尝试从标题中提取地点
    for (const [fullName, shortName] of Object.entries(simplifiedNames)) {
      if (title.includes(fullName)) {
        return shortName;
      }
    }
    
    // 如果没有匹配，尝试提取冒号后的内容
    const colonSplit = title.split(/[:：]\s*/);
    if (colonSplit.length > 1) {
      const extracted = colonSplit[1].replace('一日游', '').trim();
      // 再次尝试简化
      for (const [fullName, shortName] of Object.entries(simplifiedNames)) {
        if (extracted.includes(fullName)) {
          return shortName;
        }
      }
      return extracted.substring(0, 2); // 取前两个字符作为简称
    }
    
    return title;
  };

  // 根据地点确定颜色的辅助函数
  const getLocationColor = (location) => {
    const colorMap = {
      '亚': '#1890ff',      // 蓝色 - 亚瑟港含门票
      '亚(迅)': '#52c41a',  // 绿色 - 亚瑟港迅游
      '亚(不)': '#fa8c16',  // 橙色 - 亚瑟港不含门票
      '布': '#722ed1',      // 紫色 - 布鲁尼岛
      '霍': '#eb2f96',      // 粉色 - 霍巴特
      '摇': '#13c2c2',      // 青色 - 摇篮山
      '朗': '#fa541c',      // 红橙 - 朗塞斯顿
      '玛': '#2f54eb',      // 深蓝 - 玛丽亚岛
      '酒': '#a0d911',      // 黄绿 - 酒杯湾
      '菲': '#f759ab',      // 粉红 - 菲欣纳
      '德': '#40a9ff',      // 浅蓝 - 德文波特
      '比': '#95e1d3'       // 薄荷绿 - 比奇诺
    };
    return colorMap[location] || '#666';
  };

  useEffect(() => {
    if (selectedDate && selectedLocation) {
      fetchAssignmentData();
    }
  }, [selectedDate, selectedLocation]);

  // 为客户数据添加乘客信息
  const enrichWithPassengerData = async (customerData) => {
    if (!customerData || customerData.length === 0) return customerData;
    
    try {
      // 批量获取所有订单的乘客信息
      const passengerPromises = customerData.map(async (customer) => {
        try {
          if (!customer.bookingId || customer.bookingId === 'N/A' || customer.bookingId === null) {
            console.log(`客户 ${customer.customerName} 没有有效的订单ID，跳过乘客信息获取`);
            return { ...customer, passengers: [] };
          }
          
          console.log(`获取订单 ${customer.bookingId} 的乘客信息`);
          const response = await getPassengersByBookingId(customer.bookingId);
          
          if (response && response.code === 1 && response.data) {
            console.log(`订单 ${customer.bookingId} 获取到 ${response.data.length} 个乘客`);
            return { ...customer, passengers: response.data || [] };
          } else {
            console.log(`订单 ${customer.bookingId} 获取乘客信息失败:`, response);
            return { ...customer, passengers: [] };
          }
        } catch (error) {
          console.error(`获取订单 ${customer.bookingId} 乘客信息失败:`, error);
          return { ...customer, passengers: [] };
        }
      });
      
      const enrichedData = await Promise.all(passengerPromises);
      console.log('乘客信息获取完成:', enrichedData);
      return enrichedData;
    } catch (error) {
      console.error('批量获取乘客信息失败:', error);
      return customerData.map(customer => ({ ...customer, passengers: [] }));
    }
  };

  // 获取客户下一站信息
  const fetchNextStationData = async (customerData) => {
    if (!customerData || customerData.length === 0) return;
    
    try {
      // 计算下一天日期
      const nextDay = dayjs(selectedDate).add(1, 'day').format('YYYY-MM-DD');
      console.log('查询下一天行程:', nextDay);
      
      // 获取下一天的所有行程数据
      const nextDayResponse = await getSchedulesByDateRange(nextDay, nextDay);
      
      if (nextDayResponse && nextDayResponse.code === 1 && nextDayResponse.data) {
        const nextDaySchedules = nextDayResponse.data;
        const nextStationMap = {};
        
        // 为每个客户查找下一天的行程
        customerData.forEach(customer => {
          const customerContact = customer.contactPerson || customer.customerName;
          const customerPhone = customer.contactInfo || customer.contactPhone;
          const customerOrderNumber = customer.orderNumber;
          
          // 通过多种方式匹配下一天的行程
          const nextDaySchedule = nextDaySchedules.find(schedule => {
            // 1. 联系人姓名完全匹配
            if (schedule.contactPerson && customerContact && 
                schedule.contactPerson.trim() === customerContact.trim()) {
              return true;
            }
            
            // 2. 联系电话匹配
            if (schedule.contactPhone && customerPhone && 
                schedule.contactPhone.replace(/\s+/g, '') === customerPhone.replace(/\s+/g, '')) {
              return true;
            }
            
            // 3. 订单号匹配（如果都是HT开头，比较完整订单号）
            if (schedule.orderNumber && customerOrderNumber) {
              if (schedule.orderNumber === customerOrderNumber) {
                return true;
              }
              // 或者比较订单号的核心部分（去掉前缀后的数字部分）
              const scheduleCore = schedule.orderNumber.replace(/^HT/, '').split(/[A-Z]/)[0];
              const customerCore = customerOrderNumber.replace(/^HT/, '').split(/[A-Z]/)[0];
              if (scheduleCore && customerCore && scheduleCore === customerCore) {
                return true;
              }
            }
            
            return false;
          });
          
          if (nextDaySchedule) {
            const nextLocation = extractLocationName(nextDaySchedule.title || nextDaySchedule.tourLocation || '');
            nextStationMap[customer.key] = nextLocation || nextDaySchedule.tourLocation || '待定';
            console.log(`客户 ${customerContact} 下一站: ${nextStationMap[customer.key]}`);
          } else {
            // 如果没有找到下一天行程，说明可能是最后一天
            const tourEndDate = customer.tourEndDate || customer.hotelCheckOutDate;
            const currentDate = selectedDate;
            
            console.log(`客户 ${customerContact} 行程检查:`, {
              currentDate,
              tourEndDate,
              orderNumber: customer.orderNumber
            });
            
            // 更精确的日期判断
            if (tourEndDate) {
              const current = dayjs(currentDate);
              const endDate = dayjs(tourEndDate);
              
              if (current.isSame(endDate, 'day') || current.isAfter(endDate, 'day')) {
                nextStationMap[customer.key] = '行程结束';
              } else {
                // 如果当前日期在行程结束日期之前，但找不到下一天行程
                // 可能是数据不完整，也设置为行程结束
                nextStationMap[customer.key] = '行程结束';
              }
            } else {
              // 如果没有行程结束日期，检查是否能从订单号判断
              // 订单号通常包含日期信息，可以用来判断
              const orderDate = customer.orderNumber ? customer.orderNumber.match(/(\d{8})/)?.[1] : null;
              if (orderDate) {
                // 从订单号提取日期（格式：YYYYMMDD）
                const orderDateFormatted = `${orderDate.slice(0,4)}-${orderDate.slice(4,6)}-${orderDate.slice(6,8)}`;
                const current = dayjs(currentDate);
                const order = dayjs(orderDateFormatted);
                
                console.log(`从订单号提取的日期: ${orderDateFormatted}, 当前日期: ${currentDate}, 差值: ${current.diff(order, 'day')}天`);
                
                // 如果当前日期距离订单日期超过3天，很可能是行程结束
                // 因为一般一日游或短途游不会超过3-5天
                if (current.diff(order, 'day') >= 3) {
                  nextStationMap[customer.key] = '行程结束';
                } else {
                  nextStationMap[customer.key] = '待安排';
                }
              } else {
                // 完全没有日期信息，但没有下一天行程，设为行程结束
                nextStationMap[customer.key] = '行程结束';
              }
            }
            console.log(`客户 ${customerContact} 未找到下一天行程，设置为: ${nextStationMap[customer.key]}`);
          }
        });
        
        console.log('下一站数据映射:', nextStationMap);
        setNextStationData(nextStationMap);
      }
    } catch (error) {
      console.error('获取下一站数据失败:', error);
      // 如果获取失败，设置默认值
      const defaultMap = {};
      customerData.forEach(customer => {
        defaultMap[customer.key] = '-';
      });
      setNextStationData(defaultMap);
    }
  };

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
        const customerData = locationSchedules.map((schedule, index) => {
          // 提取原始地点信息
          const originalLocation = extractLocationName(schedule.title || schedule.destinationName || '');
          const fullTitle = schedule.title || schedule.destinationName || '';
          
          return {
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
            guideRemarks: schedule.guideRemarks || '', // 导游专用备注
          adultCount: schedule.adultCount || 0,
          childCount: schedule.childCount || 0,
          flightNumber: schedule.flightNumber || '',
          returnFlightNumber: schedule.returnFlightNumber || '',
          // 添加更多订单详细信息
          bookingId: schedule.bookingId || schedule.id,
          passengerContact: schedule.passengerContact || schedule.contactPhone,
          contactPerson: schedule.contactPerson, // 确保有联系人字段
          contactPhone: schedule.contactPhone, // 确保有联系电话字段
          luggageCount: schedule.luggageCount || 0,
          hotelCheckInDate: schedule.hotelCheckInDate,
          hotelCheckOutDate: schedule.hotelCheckOutDate,
          tourStartDate: schedule.tourStartDate, // 行程开始日期
          tourEndDate: schedule.tourEndDate, // 行程结束日期
          roomDetails: schedule.roomDetails,
          arrivalLandingTime: schedule.arrivalLandingTime,
            departureDepartureTime: schedule.departureDepartureTime,
            // 添加原始地点信息
            originalLocation: originalLocation,
            fullTitle: fullTitle,
            isFromMerged: false // 这里可以根据实际需要判断是否来自合并
          };
        });
        
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
        
        // 批量获取每个订单的乘客信息
        const enrichedCustomerData = await enrichWithPassengerData(customerData);
        
        setItineraryData(enrichedCustomerData);
        
        // 获取下一站信息
        await fetchNextStationData(enrichedCustomerData);
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
          guideRemarks: '', // 导游专用备注
          nextStation: assignment.nextDestination || '待确认',
          adultCount: assignment.adultCount || 0,
          childCount: assignment.childCount || 0,
          flightNumber: '',
          returnFlightNumber: '',
          bookingId: assignment.bookingIds?.[0] || assignment.bookingId || null,
          passengerContact: assignment.contactPhone || '',
          contactPerson: assignment.contactPerson, // 联系人
          contactPhone: assignment.contactPhone, // 联系电话
          luggageCount: 0,
          hotelCheckInDate: null,
          hotelCheckOutDate: null,
          tourStartDate: null, // 行程开始日期
          tourEndDate: null, // 行程结束日期
          roomDetails: '',
          arrivalLandingTime: null,
          departureDepartureTime: null,
          originalLocation: selectedLocation,
          fullTitle: selectedLocation + '一日游'
        }];
        
        // 批量获取每个订单的乘客信息
        const enrichedBasicData = await enrichWithPassengerData(basicData);
        
        setItineraryData(enrichedBasicData);
        
        // 获取下一站信息
        await fetchNextStationData(enrichedBasicData);
        
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
      width: 80,
      align: 'center',
      render: (time) => (
        <div style={{ fontSize: '11px', textAlign: 'center' }}>
          {time || '待定'}
        </div>
      )
    },
    {
      title: '订单号',
      dataIndex: 'orderNumber',
      key: 'orderNumber',
      width: 100,
      align: 'center',
      render: (orderNumber, record) => (
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontWeight: 'bold', fontSize: '11px' }}>{orderNumber}</div>
        </div>
      )
    },
    {
      title: '姓名',
      dataIndex: 'customerName',
      key: 'customerName',
      width: 80,
      align: 'center',
      render: (name, record) => {
        // 只显示所有乘客的姓名，每个姓名占一行，不显示电话号码
        const passengers = record.passengers || [];
        
        // 清理姓名显示，去掉"乘客-"前缀
        const cleanName = (name) => {
          if (!name) return name;
          // 去掉"乘客-"前缀
          return name.replace(/^乘客-/, '');
        };
        
        return (
          <div style={{ textAlign: 'center', lineHeight: '1.2' }}>
            {passengers.length > 0 ? (
              passengers.map((passenger, index) => (
                <div key={index} style={{ fontSize: '10px', marginBottom: '1px', fontWeight: 'bold' }}>
                  {cleanName(passenger.fullName)}
                </div>
              ))
            ) : (
              // 如果没有乘客信息，显示联系人信息
        <div>
                <div style={{ fontWeight: 'bold', fontSize: '10px' }}>
                  {cleanName(name || record.contactPerson) || '未知'}
          </div>
                {/* 显示人数组成 */}
                {(record.adultCount > 0 || record.childCount > 0) && (
                  <div style={{ fontSize: '8px', color: '#999', marginTop: '1px' }}>
                    成{record.adultCount || 0} 儿{record.childCount || 0}
            </div>
          )}
        </div>
            )}
          </div>
        );
      }
    },
    {
      title: '人数',
      dataIndex: 'totalPeople',
      key: 'totalPeople',
      width: 50,
      align: 'center',
      render: (total, record) => (
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontWeight: 'bold', fontSize: '14px', color: '#ff4d4f' }}>
            {total}
          </div>
        </div>
      )
    },
    {
      title: '联系方式',
      dataIndex: 'contactInfo',
      key: 'contactInfo',
      width: 100,
      align: 'center',
      render: (contact, record) => {
        // 显示所有乘客的电话号码，不做格式验证
        const passengers = record.passengers || [];
        const phones = [];
        
        // 从乘客信息中收集所有电话号码
        passengers.forEach(passenger => {
          if (passenger.phone && !phones.includes(passenger.phone)) {
            phones.push(passenger.phone);
          }
        });
        
        // 如果乘客中没有电话号码，使用原始联系方式
        if (phones.length === 0 && contact) {
          phones.push(contact);
        }
        
        // 如果还是没有电话，尝试从record中获取其他联系方式
        if (phones.length === 0) {
          const fallbackPhone = record.contactPhone || record.passengerContact;
          if (fallbackPhone) {
            phones.push(fallbackPhone);
          }
        }
        
        return (
          <div style={{ fontSize: '10px', textAlign: 'center', lineHeight: '1.3' }}>
            {phones.length > 0 ? (
              phones.map((phone, index) => (
                <div key={index} style={{ marginBottom: index < phones.length - 1 ? '1px' : 0 }}>
                  {phone}
            </div>
              ))
            ) : (
              <div style={{ color: '#999' }}>无</div>
          )}
        </div>
        );
      }
    },
    {
      title: '接',
      dataIndex: 'pickupLocation',
      key: 'pickupLocation',
      width: 120,
      align: 'center',
      render: (pickup, record) => (
        <div style={{ fontSize: '11px', textAlign: 'center' }}>
          {pickup || '待定'}
        </div>
      )
    },
    {
      title: '送',
      dataIndex: 'dropoffLocation',
      key: 'dropoffLocation',
      width: 120,
      align: 'center',
      render: (dropoff, record) => (
        <div style={{ fontSize: '11px', textAlign: 'center' }}>
          {dropoff || '待定'}
        </div>
      )
    },
    {
      title: '特殊要求',
      dataIndex: 'remarks',
      key: 'remarks',
      width: 120,
      className: 'special-requirements-column', // 打印时隐藏此列
      render: (remarks, record) => (
        <div style={{ fontSize: '10px', lineHeight: '1.2' }}>
          {remarks || '无'}
        </div>
      )
    },
    {
      title: '备注',
      dataIndex: 'guideRemarks',
      key: 'guideRemarks',
      width: 150,
      render: (guideRemarks, record) => {
        const isEditing = editingRemarks[record.key];
        const currentValue = tempRemarks[record.key] !== undefined ? tempRemarks[record.key] : guideRemarks;
        
        return (
          <div className="guide-remarks-cell">
            {isEditing ? (
              <div>
                <Input.TextArea
                  value={currentValue}
                  onChange={(e) => setTempRemarks({...tempRemarks, [record.key]: e.target.value})}
                  placeholder="添加导游备注..."
                  rows={2}
                  style={{ fontSize: '10px', marginBottom: '2px' }}
                />
                <div style={{ display: 'flex', gap: '2px' }}>
                  <Button 
                    type="primary" 
                    size="small"
                    onClick={() => handleSaveRemarks(record)}
                    style={{ fontSize: '9px', height: '18px', padding: '0 6px' }}
                  >
                    保存
                  </Button>
                  <Button 
                    size="small"
                    onClick={() => handleCancelEdit(record.key)}
                    style={{ fontSize: '9px', height: '18px', padding: '0 6px' }}
                  >
                    取消
                  </Button>
                </div>
              </div>
            ) : (
              <div>
                <div 
                  style={{ 
                    fontSize: '10px',
                    lineHeight: '1.2',
                    minHeight: '25px',
                    padding: '2px',
                    backgroundColor: currentValue ? '#f6ffed' : '#fafafa',
                    border: '1px dashed #d9d9d9',
                    borderRadius: '2px',
                    cursor: 'pointer'
                  }}
                  onClick={() => handleEditRemarks(record.key)}
                >
                  {currentValue || (
                    <span style={{ color: '#999', fontStyle: 'italic' }}>
                      点击添加...
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        );
      }
    },
    {
      title: '下一站',
      dataIndex: 'nextDestination',
      key: 'nextDestination',
      width: 100,
      align: 'center',
      render: (next, record) => {
        // 优先使用从下一天查询到的数据
        const nextStationFromQuery = nextStationData[record.key];
        let nextStation = nextStationFromQuery || next || '';
        
        // 如果查询结果没有或为'-'，则使用备用逻辑
        if (!nextStation || nextStation === '-') {
          nextStation = record.dropoffLocation || record.originalLocation || '-';
        }
        
        return (
          <div style={{ fontSize: '11px', textAlign: 'center' }}>
            {nextStation}
          </div>
        );
      }
    },

  ];

  const handleBack = () => {
    navigate(-1);
  };

  const handlePrint = () => {
    window.print();
  };

  // 处理编辑备注
  const handleEditRemarks = (recordKey) => {
    setEditingRemarks({...editingRemarks, [recordKey]: true});
  };

  // 处理取消编辑
  const handleCancelEdit = (recordKey) => {
    setEditingRemarks({...editingRemarks, [recordKey]: false});
    // 清除临时备注
    const newTempRemarks = {...tempRemarks};
    delete newTempRemarks[recordKey];
    setTempRemarks(newTempRemarks);
  };

  // 处理保存备注
  const handleSaveRemarks = async (record) => {
    const newRemarks = tempRemarks[record.key] || '';
    
    try {
      console.log('保存导游备注:', {
        scheduleId: record.key,
        guideRemarks: newRemarks
      });
      
      // 调用后端API保存导游备注 - 使用表的ID字段
      const response = await updateGuideRemarks(record.key, newRemarks);
      
      if (response.code === 1) {
        // 更新本地数据 - 只更新guideRemarks字段
        const updatedData = itineraryData.map(item => 
          item.key === record.key 
            ? {...item, guideRemarks: newRemarks}
            : item
        );
        setItineraryData(updatedData);
        
        // 清除编辑状态
        setEditingRemarks({...editingRemarks, [record.key]: false});
        const newTempRemarks = {...tempRemarks};
        delete newTempRemarks[record.key];
        setTempRemarks(newTempRemarks);
        
        message.success('导游备注保存成功');
      } else {
        message.error(response.msg || '导游备注保存失败');
      }
    } catch (error) {
      console.error('保存导游备注失败:', error);
      message.error('保存导游备注失败: ' + (error.message || '未知错误'));
    }
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

        {/* 导游用车信息头部 - 类似样例的单行布局 */}
        <div className="assignment-header">
          <table style={{ width: '100%', border: '1px solid #000', borderCollapse: 'collapse' }}>
            <tr>
              <td style={{ 
                border: '1px solid #000', 
                padding: '8px', 
                background: '#f5f5f5', 
                fontWeight: 'bold',
                textAlign: 'center',
                width: '10%'
              }}>
                日期
              </td>
              <td style={{ 
                border: '1px solid #000', 
                padding: '8px', 
                background: '#f5f5f5', 
                fontWeight: 'bold',
                textAlign: 'center',
                width: '15%'
              }}>
                地点
              </td>
              <td style={{ 
                border: '1px solid #000', 
                padding: '8px', 
                background: '#f5f5f5', 
                fontWeight: 'bold',
                textAlign: 'center',
                width: '10%'
              }}>
                导游
              </td>
              <td style={{ 
                border: '1px solid #000', 
                padding: '8px', 
                background: '#f5f5f5', 
                fontWeight: 'bold',
                textAlign: 'center',
                width: '10%'
              }}>
                总人数
              </td>
              <td style={{ 
                border: '1px solid #000', 
                padding: '8px', 
                background: '#f5f5f5', 
                fontWeight: 'bold',
                textAlign: 'center',
                width: '35%'
              }}>
                车牌
              </td>
              <td style={{ 
                border: '1px solid #000', 
                padding: '8px', 
                background: '#f5f5f5', 
                fontWeight: 'bold',
                textAlign: 'center',
                width: '20%'
              }}>
                当天行程
              </td>
            </tr>
            <tr>
              <td style={{ 
                border: '1px solid #000', 
                padding: '8px',
                textAlign: 'center',
                fontWeight: 'bold',
                color: '#ff4d4f'
              }}>
                  {dayjs(locationInfo.tourDate).format('YYYY/M/D')}
              </td>
              <td style={{ 
                border: '1px solid #000', 
                padding: '8px',
                textAlign: 'center',
                fontWeight: 'bold'
              }}>
                  {locationInfo.location}
              </td>
              <td style={{ 
                border: '1px solid #000', 
                padding: '8px',
                textAlign: 'center',
                fontWeight: 'bold',
                background: '#d4edda'
              }}>
                  {guideInfo.guideName}
              </td>
              <td style={{ 
                border: '1px solid #000', 
                padding: '8px',
                textAlign: 'center',
                fontWeight: 'bold',
                color: '#ff4d4f',
                fontSize: '16px'
              }}>
                  {locationInfo.totalPeople}
              </td>
              <td style={{ 
                border: '1px solid #000', 
                padding: '8px',
                textAlign: 'center',
                fontWeight: 'bold'
              }}>
                {vehicleInfo.licensePlate} {vehicleInfo.capacity} {vehicleInfo.driverName}
              </td>
              <td style={{ 
                border: '1px solid #000', 
                padding: '8px',
                textAlign: 'center',
                fontSize: '12px'
              }}>
                {/* 显示当天行程的主要目的地 */}
                {itineraryData && itineraryData.length > 0 && itineraryData[0].fullTitle ? 
                  itineraryData[0].fullTitle.length > 20 ? 
                    itineraryData[0].fullTitle.substring(0, 20) + '...' : 
                    itineraryData[0].fullTitle
                  : locationInfo.location + '一日游'
                }
              </td>
            </tr>
          </table>
        </div>



        {/* 客人详细信息表格 */}
        <div className="customer-table-section">
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


      </Card>
    </div>
  );
};

export default TourItinerary; 