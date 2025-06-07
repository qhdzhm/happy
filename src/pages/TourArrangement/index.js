import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Card, DatePicker, Button, message, Space, Select, Empty, Spin, Tooltip } from 'antd';
import { ReloadOutlined, FilterOutlined, SaveOutlined, InfoCircleOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import TourScheduleTable from './components/TourScheduleTable';
import { getOrderList } from '@/apis/orderApi';
import { getSchedulesByDateRange, getSchedulesByBookingId, saveBatchSchedules } from '@/api/tourSchedule';
import request from '@/utils/request';
import './index.scss';

const { RangePicker } = DatePicker;
const { Option } = Select;

// 添加公共的颜色生成函数
const getLocationColor = (locationName) => {
  // 常见地点固定颜色映射
  const locationColors = {
    '霍巴特': '#13c2c2',
    '朗塞斯顿': '#722ed1',
    '摇篮山': '#7b68ee',
    '酒杯湾': '#ff9c6e',
    '亚瑟港': '#dc3545',
    '布鲁尼岛': '#87d068',
    '惠灵顿山': '#f56a00',
    '塔斯马尼亚': '#1890ff',
    '菲欣纳': '#3f8600',
    '菲欣纳国家公园': '#3f8600',
    '一日游': '#108ee9',
    '跟团游': '#fa8c16',
    '待安排': '#bfbfbf',
    '亚瑟港': '#ff4d4f',
    '塔斯曼半岛': '#ff4d4f',
    '玛丽亚岛': '#ffaa00',
    '摩恩谷': '#9254de',
    '菲尔德山': '#237804',
    '非常湾': '#5cdbd3',
    '卡尔德': '#096dd9'
  };
  
  // 查找包含关键词的地点名称
  for (const key in locationColors) {
    if (locationName.includes(key)) {
      return locationColors[key];
    }
  }
  
  // 如果没有匹配的固定颜色，使用哈希算法生成一致的颜色
  const hashCode = locationName.split('').reduce((acc, char) => {
    return char.charCodeAt(0) + ((acc << 5) - acc);
  }, 0);
  
  const h = Math.abs(hashCode) % 360;
  const s = 70 + Math.abs(hashCode % 20); // 70-90%饱和度
  const l = 55 + Math.abs((hashCode >> 4) % 15); // 55-70%亮度
  
  return `hsl(${h}, ${s}%, ${l}%)`;
};

// 将颜色函数设置为全局可访问
window.getLocationColor = getLocationColor;

const TourArrangement = () => {
  // 使用完全隔离的日期范围状态管理
  const createSafeDateRange = useCallback(() => {
    // 每次都创建全新的dayjs实例，避免引用问题
    const today = dayjs().startOf('day'); // 确保时间为00:00:00
    const startDate = dayjs().startOf('month'); // 当月1日
    const endDate = dayjs().add(6, 'month').endOf('month'); // 6个月后的月末，给更长的默认范围
    
    console.log('创建安全日期范围:', {
      start: startDate.format('YYYY-MM-DD'),
      end: endDate.format('YYYY-MM-DD'),
      today: today.format('YYYY-MM-DD')
    });
    
    return [startDate, endDate];
  }, []);

  const [dateRange, setDateRange] = useState(() => {
    try {
      return createSafeDateRange();
    } catch (error) {
      console.error('日期初始化失败:', error);
      return null;
    }
  });
  const [loading, setLoading] = useState(false);
  const [scheduleData, setScheduleData] = useState([]);
  const [viewMode, setViewMode] = useState('all'); // 'all', 'day_tour', 'group_tour'
  const [refreshKey, setRefreshKey] = useState(0); // 用于强制刷新数据


  // 重置日期到当前月份附近
  const resetDateRange = useCallback(() => {
    try {
      const newDateRange = createSafeDateRange();
      
      // 验证生成的日期是否有效
      if (!newDateRange || !Array.isArray(newDateRange) || newDateRange.length !== 2 ||
          !newDateRange[0].isValid() || !newDateRange[1].isValid()) {
        console.error('重置时生成的日期无效');
        message.error('日期重置失败');
        return;
      }
      
      console.log('重置日期范围到:', {
        start: newDateRange[0].format('YYYY-MM-DD'),
        end: newDateRange[1].format('YYYY-MM-DD')
      });
      
      setDateRange(newDateRange);
      message.success('日期范围已重置到当前月份');
    } catch (error) {
      console.error('重置日期范围失败:', error);
      message.error('日期重置失败，请刷新页面');
    }
  }, [createSafeDateRange]);

  // 组件挂载时清除本地存储中的行程数据
  useEffect(() => {
    try {
      localStorage.removeItem('tourSchedule_draft');
      localStorage.removeItem('tourSchedule_draftTimestamp');
      
      // 验证并修复异常的日期范围
      if (dateRange && Array.isArray(dateRange) && dateRange.length === 2) {
        try {
          const startDate = dateRange[0];
          const endDate = dateRange[1];
          
          // 确保日期对象有效
          if (!startDate || !endDate || !startDate.isValid() || !endDate.isValid()) {
            console.warn('检测到无效日期对象，正在重置...');
            resetDateRange();
            return;
          }
          
          const currentYear = dayjs().year();
          
          // 如果日期范围异常（比如跳到了2048年），重置为正常范围
          if (startDate.year() > currentYear + 5 || endDate.year() > currentYear + 5 ||
              startDate.year() < currentYear - 2 || endDate.year() < currentYear - 2) {
            console.warn('检测到异常日期范围，正在重置...', {
              start: startDate.format('YYYY-MM-DD'),
              end: endDate.format('YYYY-MM-DD'),
              currentYear: currentYear
            });
            resetDateRange();
          }
        } catch (error) {
          console.error('验证日期范围时出错:', error);
          resetDateRange();
        }
      } else if (dateRange !== null) {
        // 如果dateRange不是预期的格式，重置它
        console.warn('日期范围格式异常，正在重置...', dateRange);
        resetDateRange();
      }
    } catch (e) {
      console.error('清除本地存储失败:', e);
    }
  }, [resetDateRange]);

  useEffect(() => {
    fetchScheduleData();
  }, [dateRange, viewMode, refreshKey]);

  // 格式化日期
  const formatDate = (date) => {
    return date.format('YYYY-MM-DD');
  };
  
  // 手动刷新数据
  const handleRefresh = useCallback(() => {
    setRefreshKey(prev => prev + 1);
  }, []);
  
  // 获取排团表数据（只从排团表获取，不再从订单表获取）
  const fetchScheduleData = async () => {
    
    setLoading(true);
    try {
      // 准备日期范围参数
      const startDate = formatDate(dateRange[0]);
      const endDate = formatDate(dateRange[1]);
      
      console.log('🔄 只从排团表获取行程数据:', startDate, '至', endDate);
      
      // 只获取排团表的行程数据
      const scheduleResponse = await getSchedulesByDateRange(startDate, endDate);
      
      if (scheduleResponse?.code === 1) {
        const scheduleList = scheduleResponse.data || [];
        
        // 根据viewMode筛选数据
        let filteredSchedules = scheduleList;
        if (viewMode !== 'all') {
          filteredSchedules = scheduleList.filter(item => item.tourType === viewMode);
        }
        
        if (filteredSchedules.length > 0) {
          console.log(`✅ 找到${filteredSchedules.length}条排团表行程数据`);
          
          // 转换为组件需要的格式
          const formattedData = await formatScheduleDataForDisplay(filteredSchedules);
          setScheduleData(formattedData);
          
          if (formattedData.length === 0) {
            message.info('排团表数据处理后为空，请检查数据格式');
          }
        } else {
          console.log('📭 排团表中没有找到符合条件的行程数据');
          message.info(`没有找到${viewMode === 'day_tour' ? '一日游' : (viewMode === 'group_tour' ? '跟团游' : '')}类型的行程数据`);
          setScheduleData([]);
        }
      } else {
        console.log('⚠️ 排团表API调用失败或返回空数据');
        message.warning('无法获取排团表数据，请检查后端服务');
        setScheduleData([]);
      }

    } catch (error) {
      console.error('❌ 获取排团表数据失败:', error);
      message.error('获取数据失败: ' + (error.message || '未知错误'));
      setScheduleData([]);
    } finally {
      setLoading(false);
    }
  };
  


  // 格式化行程排序数据为显示格式
  const formatScheduleDataForDisplay = async (scheduleList) => {
    if (!scheduleList || !Array.isArray(scheduleList) || scheduleList.length === 0) {
      return [];
    }
    
    // 🔍 排团表数据调试 - 检查原始API响应（包括酒店字段）
    console.log('🔍 [排团表数据调试] 收到的原始数据:', {
      数据条数: scheduleList.length,
      前3条数据样例: scheduleList.slice(0, 3).map(item => ({
        订单ID: item.bookingId,
        订单号: item.orderNumber,
        联系人: item.contactPerson,
        电话: item.contactPhone,
        成人数: item.adultCount,
        儿童数: item.childCount,
        接客地点: item.pickupLocation,
        送客地点: item.dropoffLocation,
        航班号: item.flightNumber,
        返程航班: item.returnFlightNumber,
        第几天: item.dayNumber,
        行程标题: item.title,
        特殊要求: item.specialRequests,
        // 🏨 酒店信息
        酒店星级: item.hotelLevel,
        房型: item.roomType,
        房间数: item.hotelRoomCount,
        入住日期: item.hotelCheckInDate,
        退房日期: item.hotelCheckOutDate,
        房间详情: item.roomDetails
      })),
      所有接客地点数据: scheduleList.map(item => item.pickupLocation).filter(Boolean),
      所有送客地点数据: scheduleList.map(item => item.dropoffLocation).filter(Boolean),
      联系人数据: scheduleList.map(item => item.contactPerson).filter(Boolean),
      电话数据: scheduleList.map(item => item.contactPhone).filter(Boolean),
      // 🏨 酒店数据统计
      有酒店星级的记录: scheduleList.filter(item => item.hotelLevel).length,
      有房型的记录: scheduleList.filter(item => item.roomType).length,
      有房间数的记录: scheduleList.filter(item => item.hotelRoomCount > 0).length
    });
    
    // 获取随机颜色，但对相同名称生成相同颜色
    const getRandomColor = (name) => {
      const hash = name.split('').reduce((acc, char) => {
        return char.charCodeAt(0) + ((acc << 5) - acc);
      }, 0);
      
      const h = Math.abs(hash) % 360;
      const s = 70 + Math.abs(hash % 20); // 70-90%饱和度
      const l = 55 + Math.abs((hash >> 4) % 15); // 55-70%亮度
      
      return `hsl(${h}, ${s}%, ${l}%)`;
    };
    
    // 按照订单ID分组
    const orderMap = new Map();
    
    scheduleList.forEach(schedule => {
      const bookingId = schedule.bookingId.toString();
      
      if (!orderMap.has(bookingId)) {
        // 创建新订单项
        orderMap.set(bookingId, {
          id: bookingId, // 使用bookingId作为id，与formatApiDataForSchedule保持一致
          customer: {
            id: schedule.userId ? schedule.userId.toString() : 'unknown',
            name: schedule.contactPerson || '未知客户',
            phone: schedule.contactPhone || '',
            pax: (schedule.adultCount || 0) + (schedule.childCount || 0),
            bookingId: bookingId,
            orderNumber: schedule.orderNumber || '',
            hotel: schedule.pickupLocation || '',
            shortName: schedule.tourName ? schedule.tourName.substring(0, 2) : ''
          },
          startDate: null,
          endDate: null,
          type: schedule.tourType,
          dates: {},
          orderNumber: schedule.orderNumber || '',
          specialRequests: schedule.specialRequests || ''
        });
      }
      
      // 获取当前订单对象
      const order = orderMap.get(bookingId);
      
      // 更新日期信息
      const dateStr = schedule.tourDate;
      const locationName = schedule.title || '待安排';
      
      // 优先使用数据库中保存的颜色，如果没有则使用统一的颜色生成函数
      const locationColor = schedule.color || getLocationColor(locationName);
      
      // 更新日期内容
      order.dates[dateStr] = {
        id: `loc-${schedule.id}`,
        name: locationName,
        color: locationColor,
        description: schedule.description || '',
        tourId: schedule.tourId,
        tourType: schedule.tourType,
        scheduleId: schedule.id, // 添加scheduleId用于更新
        dayNumber: schedule.dayNumber || 0, // 添加天数信息
        // 🎯 确保所有排团表字段都正确传递到前端（包括酒店字段）
        pickupLocation: schedule.pickupLocation,
        dropoffLocation: schedule.dropoffLocation,
        contactPerson: schedule.contactPerson,
        contactPhone: schedule.contactPhone,
        adultCount: schedule.adultCount,
        childCount: schedule.childCount,
        flightNumber: schedule.flightNumber,
        returnFlightNumber: schedule.returnFlightNumber,
        arrivalLandingTime: schedule.arrivalLandingTime,
        arrivalDepartureTime: schedule.arrivalDepartureTime,
        departureDepartureTime: schedule.departureDepartureTime,
        departureLandingTime: schedule.departureLandingTime,
        specialRequests: schedule.specialRequests,
        // 🏨 酒店信息字段
        hotelLevel: schedule.hotelLevel,
        roomType: schedule.roomType,
        hotelRoomCount: schedule.hotelRoomCount,
        hotelCheckInDate: schedule.hotelCheckInDate,
        hotelCheckOutDate: schedule.hotelCheckOutDate,
        roomDetails: schedule.roomDetails,
        order: {
          bookingId: schedule.bookingId,
          tourId: schedule.tourId,
          tourType: schedule.tourType,
          tourName: schedule.tourName || locationName,
          adultCount: schedule.adultCount,
          childCount: schedule.childCount,
          contactPerson: schedule.contactPerson,
          contactPhone: schedule.contactPhone,
          pickupLocation: schedule.pickupLocation,
          dropoffLocation: schedule.dropoffLocation,
          orderNumber: schedule.orderNumber || '',
          specialRequests: schedule.specialRequests || '',
          dayNumber: schedule.dayNumber || 0, // 在order对象中也添加天数信息
          // 🏨 在order对象中也添加酒店信息
          hotelLevel: schedule.hotelLevel,
          roomType: schedule.roomType,
          hotelRoomCount: schedule.hotelRoomCount,
          hotelCheckInDate: schedule.hotelCheckInDate,
          hotelCheckOutDate: schedule.hotelCheckOutDate,
          roomDetails: schedule.roomDetails
        }
      };
      
      // 更新开始和结束日期
      if (!order.startDate || dayjs(dateStr).isBefore(order.startDate)) {
        order.startDate = dayjs(dateStr);
      }
      if (!order.endDate || dayjs(dateStr).isAfter(order.endDate)) {
        order.endDate = dayjs(dateStr);
      }
    });
    
    // 转换为数组并按开始日期排序
    const finalData = Array.from(orderMap.values())
      .filter(order => Object.keys(order.dates).length > 0)
      .sort((a, b) => a.startDate - b.startDate);
    
    // 🔍 最终数据格式调试
    console.log('🔍 [最终数据格式] 转换后的显示数据:', {
      订单总数: finalData.length,
      详细数据: finalData.map(order => ({
        订单ID: order.id,
        客户姓名: order.customer.name,
        客户电话: order.customer.phone,
        接送地点: order.customer.hotel,
        日期数据: Object.keys(order.dates).map(date => ({
          日期: date,
          地点: order.dates[date].name,
          接客地点: order.dates[date].pickupLocation,
          送客地点: order.dates[date].dropoffLocation,
          联系人: order.dates[date].contactPerson,
          电话: order.dates[date].contactPhone,
          成人数: order.dates[date].adultCount,
          儿童数: order.dates[date].childCount
        }))
      }))
    });
    
    return finalData;
  };



  // 新增：按时间线排列订单
  const arrangeOrdersByTimeline = (orders) => {
    if (!orders || orders.length === 0) return [];
    
    // 先按照开始日期排序
    const sortedOrders = [...orders].sort((a, b) => {
      const aFirstDate = Object.keys(a.dates).sort()[0];
      const bFirstDate = Object.keys(b.dates).sort()[0];
      return dayjs(aFirstDate).valueOf() - dayjs(bFirstDate).valueOf();
    });
    
    // 创建日期范围到订单的映射
    const dateRangeMap = new Map();
    
    // 标记所有订单的时间范围
    sortedOrders.forEach(order => {
      const orderDates = Object.keys(order.dates).sort();
      if (orderDates.length === 0) return;
      
      const startDate = orderDates[0];
      const endDate = orderDates[orderDates.length - 1];
      
      // 存储订单的时间范围信息
      dateRangeMap.set(order.id, { startDate, endDate, order });
    });
    
    // 创建列占用信息
    const columnOccupations = [];
    
    // 为每个订单分配列号
    sortedOrders.forEach(order => {
      const orderInfo = dateRangeMap.get(order.id);
      if (!orderInfo) return;
      
      const { startDate, endDate } = orderInfo;
      
      // 寻找可用的列号
      let assignedColumn = -1;
      
      for (let col = 0; col < 100; col++) { // 假设最多100列
        // 检查该列是否可用
        let columnAvailable = true;
        
        if (!columnOccupations[col]) {
          columnOccupations[col] = [];
        }
        
        // 检查与该列中的每个订单是否有重叠
        for (const occupiedRange of columnOccupations[col]) {
          // 如果有任何重叠，则该列不可用
          if (!(endDate < occupiedRange.startDate || startDate > occupiedRange.endDate)) {
            columnAvailable = false;
            break;
          }
        }
        
        // 如果该列可用，将订单分配到该列
        if (columnAvailable) {
          columnOccupations[col].push({ startDate, endDate, orderId: order.id });
          assignedColumn = col;
          break;
        }
      }
      
      // 设置订单的列号
      order.columnIndex = assignedColumn;
    });
    
    // 排序：首先按列号，然后按开始日期
    sortedOrders.sort((a, b) => {
      // 首先按列号排序
      if (a.columnIndex !== b.columnIndex) {
        return a.columnIndex - b.columnIndex;
      }
      
      // 如果列号相同，按开始日期排序
      const aFirstDate = Object.keys(a.dates).sort()[0];
      const bFirstDate = Object.keys(b.dates).sort()[0];
      return dayjs(aFirstDate).valueOf() - dayjs(bFirstDate).valueOf();
    });
    
    console.log(`订单排列完成，共${sortedOrders.length}个订单，使用了${Math.max(...sortedOrders.map(o => o.columnIndex)) + 1}列`);
    
    return sortedOrders;
  };

  const handleDateChange = (dates) => {
    console.log('DatePicker onChange 触发:', dates);
    
    // 如果dates为null或undefined，清空选择
    if (!dates) {
      console.log('日期被清空');
      setDateRange(null);
      return;
    }
    
    if (!Array.isArray(dates) || dates.length !== 2) {
      console.log('日期数据格式无效，忽略更改');
      return;
    }
    
    // 检查每个日期是否有效
    if (!dates[0] || !dates[1]) {
      console.log('日期数组包含无效值');
      return;
    }
    
    try {
      // 确保dates是dayjs对象
      const startDate = dayjs.isDayjs(dates[0]) ? dates[0] : dayjs(dates[0]);
      const endDate = dayjs.isDayjs(dates[1]) ? dates[1] : dayjs(dates[1]);
      
      // 验证dayjs对象是否有效
      if (!startDate.isValid() || !endDate.isValid()) {
        console.error('无效的日期对象');
        message.error('选择的日期无效，请重新选择');
        return;
      }
      
      console.log('解析后的日期:', {
        start: startDate.format('YYYY-MM-DD'),
        end: endDate.format('YYYY-MM-DD')
      });
      
      // 检查年份范围（限制在合理范围内）
      const currentYear = dayjs().year();
      const minYear = currentYear - 2; // 允许过去2年
      const maxYear = currentYear + 5;  // 允许未来5年
      
      if (startDate.year() < minYear || startDate.year() > maxYear ||
          endDate.year() < minYear || endDate.year() > maxYear) {
        console.warn('日期年份超出合理范围:', {
          startYear: startDate.year(),
          endYear: endDate.year(),
          allowedRange: `${minYear}-${maxYear}`
        });
        message.warning('请选择合理的日期范围（支持过去2年至未来5年）');
        return;
      }
      
      // 检查日期范围不超过1年
      const diffDays = endDate.diff(startDate, 'days');
      if (diffDays > 365) {
        message.warning('日期范围不能超过1年');
        return;
      }
      
      if (diffDays < 0) {
        message.warning('结束日期不能早于开始日期');
        return;
      }
      
      // 确保设置的是全新的dayjs对象副本
      setDateRange([startDate.clone(), endDate.clone()]);
    } catch (error) {
      console.error('处理日期变更时出错:', error);
      message.error('日期处理失败，请重新选择');
    }
  };

  const handleViewModeChange = (value) => {
    setViewMode(value);
  };

  // 保存行程安排
  const handleSaveArrangement = async (data) => {
    if (!data || !data.updatedData) {
      message.error('没有更改需要保存');
      return;
    }
    
    const tourGroups = data.updatedData;
    setLoading(true);
    
    try {
      // 将前端格式转换为API需要的格式
      const batchSaveRequests = [];
      
      tourGroups.forEach(group => {
        if (!group || !group.id) return; // 跳过无效的组
        
        const bookingId = parseInt(group.id);
        const schedules = [];
        
        // 添加空值检查，确保 locationsByDate 存在
        if (group.locationsByDate && typeof group.locationsByDate === 'object') {
          // 处理每个日期的位置信息
          let displayOrderCounter = 1; // 用于跟踪显示顺序
          
          // 先按日期排序，确保顺序正确
          const sortedDates = Object.keys(group.locationsByDate).sort();
          
          sortedDates.forEach(dateStr => {
            const location = group.locationsByDate[dateStr];
            if (!location) return; // 跳过空位置
            
            // 提取位置和订单信息
            const locationInfo = location.location || {};
            const orderInfo = location.order || locationInfo.order || {};
            
            // 提取原始scheduleId（如果存在）
            const scheduleId = location.scheduleId || locationInfo.scheduleId || null;
            
            // 获取tourId
            const tourId = location.tourId || locationInfo.tourId || orderInfo.tourId || 1;
            
            // 获取tourType
            const tourType = group.type || location.tourType || locationInfo.tourType || orderInfo.tourType || 'group_tour';
            
            // 获取颜色 - 优先使用已有颜色，如果没有则生成新颜色
            const locationName = location.name || locationInfo.name || '待安排';
            const color = location.color || locationInfo.color || getLocationColor(locationName);
            
            // 计算基于行程起始日期的相对天数
            const tourStartDate = sortedDates[0]; // 行程第一天
            const tourEndDate = sortedDates[sortedDates.length - 1]; // 行程最后一天
            const currentDate = dateStr;
            const daysDiff = dayjs(currentDate).diff(dayjs(tourStartDate), 'day');
            const dayNumber = daysDiff + 1; // 第一天为1，第二天为2，以此类推
            
            // 拖拽保存时只传递核心调整信息，让后端保持原有的业务逻辑
            const schedule = {
              id: scheduleId, // 排团表记录ID（用于更新已有记录）
              bookingId: bookingId, // 订单ID
              tourDate: dateStr, // 调整后的日期
              dayNumber: dayNumber, // 调整后的天数
              title: locationName, // 调整后的行程标题
              displayOrder: displayOrderCounter // 显示顺序
            };
            
            schedules.push(schedule);
            
            // 增加显示顺序计数器
            displayOrderCounter++;
          });
        } else {
          console.warn(`订单 ${bookingId} 缺少有效的位置数据`);
        }
        
        // 仅当有行程数据时才添加到批处理请求中
        if (schedules.length > 0) {
          batchSaveRequests.push({
            bookingId: bookingId,
            schedules: schedules
          });
        }
      });
      
      // 发送批量保存请求
      if (batchSaveRequests.length > 0) {
        console.log('准备保存的行程数据:', JSON.stringify(batchSaveRequests));
        
        for (const batchRequest of batchSaveRequests) {
          const response = await saveBatchSchedules(batchRequest);
          
          if (!response || response.code !== 1) {
            throw new Error(response?.msg || '保存行程排序失败');
          }
        }
        
        message.success('行程安排已成功保存');
        
        // 保存成功后刷新数据
        setTimeout(() => {
          handleRefresh();
        }, 500);
      } else {
        message.warning('没有行程数据需要保存');
      }
    } catch (error) {
      console.error('保存行程安排失败:', error);
      message.error('保存行程安排失败: ' + (error.message || '未知错误'));
    } finally {
      setLoading(false);
    }
  };



  return (
    <div className="tour-arrangement-container">
      <Card
        title={
          <div style={{ display: 'flex', alignItems: 'center' }}>
            旅游行程安排表
            <Tooltip title="显示所有订单的行程安排，可根据日期查看不同时间范围的订单">
              <InfoCircleOutlined style={{ marginLeft: 8, color: '#1890ff' }} />
            </Tooltip>
          </div>
        }
        extra={
          <Space>
            <RangePicker
              value={dateRange && dateRange.length === 2 ? dateRange : null}
              onChange={handleDateChange}
              onOpenChange={(open) => {
                console.log('DatePicker onOpenChange:', open);
                
                if (open && dateRange) {
                  console.log('当前dateRange值:', dateRange?.map(d => d?.format?.('YYYY-MM-DD')));
                  
                  // 强制检查并立即修复异常的日期
                  if (Array.isArray(dateRange) && dateRange.length === 2) {
                    const startDate = dateRange[0];
                    const endDate = dateRange[1];
                    const currentYear = dayjs().year();
                    
                    // 更严格的检查
                    if (startDate && startDate.year && 
                        (startDate.year() > currentYear + 5 || 
                         startDate.year() < currentYear - 2 ||
                         endDate.year() > currentYear + 5 || 
                         endDate.year() < currentYear - 2)) {
                      
                      console.error('检测到异常日期，强制重置:', {
                        startYear: startDate.year(),
                        endYear: endDate.year(),
                        currentYear: currentYear
                      });
                      
                      // 立即重置，不等待下次渲染
                      setTimeout(() => resetDateRange(), 0);
                      return;
                    }
                  }
                }
              }}
              allowClear={false}
              format="YYYY-MM-DD"
              disabledDate={(current) => {
                // 禁用超出合理范围的日期
                if (!current) return false;
                
                const today = dayjs();
                const currentYear = today.year();
                
                // 合理的年份限制：过去2年到未来5年
                if (current.year() < currentYear - 2 || current.year() > currentYear + 5) {
                  return true;
                }
                
                return false;
              }}
              showTime={false}
              allowEmpty={[false, false]}
              placeholder={['开始日期', '结束日期']}
              popupClassName="tour-arrangement-datepicker"
              inputReadOnly={true}
            />
            <Select 
              defaultValue="all" 
              style={{ width: 120 }} 
              onChange={handleViewModeChange}
              popupMatchSelectWidth={false}
            >
              <Option value="all">全部行程</Option>
              <Option value="day_tour">一日游</Option>
              <Option value="group_tour">跟团游</Option>
            </Select>

            <Button 
              icon={<ReloadOutlined />} 
              onClick={handleRefresh}
              loading={loading}
            >
              刷新数据
            </Button>
            <Button 
              onClick={resetDateRange}
              type="dashed"
            >
              重置日期
            </Button>
            <Button
              icon={<SaveOutlined />}
              type="primary"
              onClick={() => {
                if (scheduleData && scheduleData.length > 0) {
                  handleSaveArrangement({ updatedData: scheduleData });
                } else {
                  message.error('没有行程数据可保存');
                }
              }}
              loading={loading}
            >
              保存排序
            </Button>
          </Space>
        }
        className="tour-card"
      >
        {loading ? (
          <div className="loading-container" style={{ textAlign: 'center', padding: '50px 0' }}>
            <Spin size="large" />
            <div style={{ marginTop: 16 }}>加载行程数据中，请稍候...</div>
          </div>
        ) : scheduleData.length === 0 ? (
          <Empty
            description="暂无行程排序数据" 
            image={Empty.PRESENTED_IMAGE_SIMPLE} 
          />
        ) : (
          <TourScheduleTable 
            data={scheduleData}
            loading={loading}
            dateRange={dateRange}
            onUpdate={handleSaveArrangement}
          />
        )}
      </Card>
    </div>
  );
};

export default TourArrangement; 