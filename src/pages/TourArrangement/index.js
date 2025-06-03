import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Card, DatePicker, Button, message, Space, Select, Empty, Spin, Tooltip } from 'antd';
import { ReloadOutlined, FilterOutlined, SaveOutlined, InfoCircleOutlined } from '@ant-design/icons';
import moment from 'moment';
import TourScheduleTable from './components/TourScheduleTable';
import { getOrderList } from '@/apis/orderApi';
import { getSchedulesByDateRange, getSchedulesByBookingId, saveBatchSchedules, initOrderSchedules } from '@/api/tourSchedule';
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
  const [dateRange, setDateRange] = useState([
    moment().subtract(2, 'month').startOf('day'),
    moment().add(3, 'month').endOf('day')
  ]);
  const [loading, setLoading] = useState(false);
  const [scheduleData, setScheduleData] = useState([]);
  const [viewMode, setViewMode] = useState('all'); // 'all', 'day_tour', 'group_tour'
  const [refreshKey, setRefreshKey] = useState(0); // 用于强制刷新数据
  const [ordersWithoutSchedule, setOrdersWithoutSchedule] = useState([]); // 存储没有行程排序的订单
  const isInitializing = useRef(false); // 添加标记，防止初始化递归

  // 组件挂载时清除本地存储中的行程数据
  useEffect(() => {
    try {
      localStorage.removeItem('tourSchedule_draft');
      localStorage.removeItem('tourSchedule_draftTimestamp');
    } catch (e) {
      console.error('清除本地存储失败:', e);
    }
  }, []);

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
  
  // 获取订单数据
  const fetchScheduleData = async () => {
    if (isInitializing.current) return; // 如果正在初始化，直接返回，防止递归
    
    setLoading(true);
    try {
      // 准备日期范围参数
      const startDate = formatDate(dateRange[0]);
      const endDate = formatDate(dateRange[1]);
      
      console.log('获取日期范围内的行程排序数据:', startDate, '至', endDate);
      
      // 首先获取自定义排序的行程数据
      const scheduleResponse = await getSchedulesByDateRange(startDate, endDate);
      
      // 同时获取原始订单数据
      const orderParams = {
        pageSize: 100,
        page: 1
      };
      
      if (viewMode !== 'all') {
        orderParams.tourType = viewMode;
      }
      
      const orderResponse = await getOrderList(orderParams);
      
      // 处理行程排序数据
      let scheduleData = [];
      if (scheduleResponse?.code === 1) {
        const scheduleList = scheduleResponse.data || [];
        
        // 根据viewMode筛选数据
        let filteredSchedules = scheduleList;
        if (viewMode !== 'all') {
          filteredSchedules = scheduleList.filter(item => item.tourType === viewMode);
        }
        
        // 如果有行程排序数据，处理这些数据
        if (filteredSchedules.length > 0) {
          console.log(`找到${filteredSchedules.length}条自定义排序的行程数据`);
          
          // 转换API数据为组件需要的格式
          scheduleData = await formatScheduleDataForDisplay(filteredSchedules);
        }
      }
      
      // 处理原始订单数据
      let orderData = [];
      if (orderResponse?.code === 1 && orderResponse.data?.records?.length > 0) {
        const orderList = orderResponse.data.records;
        console.log(`找到${orderList.length}条原始订单数据`);
        
        // 转换API数据为组件需要的格式
        orderData = await formatApiDataForSchedule(orderList);
      }
      
      // 合并两种数据，但避免重复
      const mergedData = [...scheduleData];
      
      // 创建一个已存在订单ID的集合
      const existingBookingIds = new Set(scheduleData.map(item => item.id));
      
      // 添加不重复的订单数据
      orderData.forEach(order => {
        if (!existingBookingIds.has(order.id)) {
          mergedData.push(order);
        }
      });
      
      // 如果合并后仍然没有数据，显示提示
      if (mergedData.length === 0) {
        message.info(`没有找到${viewMode === 'day_tour' ? '一日游' : (viewMode === 'group_tour' ? '跟团游' : '')}类型的行程数据`);
      }
      
      // 设置数据
      setScheduleData(mergedData);
      
      // 检查哪些订单需要初始化
      if (orderResponse?.code === 1 && orderResponse.data?.records?.length > 0) {
        await checkOrdersForInit(orderResponse.data.records);
      }
    } catch (error) {
      console.error('获取行程排序数据失败:', error);
      message.error('获取数据失败: ' + (error.message || '未知错误'));
      setScheduleData([]);
    } finally {
      setLoading(false);
    }
  };
  
  // 仅用于检查哪些订单需要初始化 - 不影响当前显示
  const fetchOrdersForInitCheck = async () => {
    try {
      const params = {
        pageSize: 100,
        page: 1
      };
      
      if (viewMode !== 'all') {
        params.tourType = viewMode;
      }
      
      // 获取订单列表但不显示加载状态
      const response = await getOrderList(params);
      
      if (response?.code === 1 && response.data?.records?.length > 0) {
        // 检查哪些订单需要初始化
        await checkOrdersForInit(response.data.records);
      }
    } catch (error) {
      console.error('检查订单初始化状态失败:', error);
    }
  };
  
  // 检查哪些订单需要初始化，但不自动初始化
  const checkOrdersForInit = async (orders) => {
    if (!orders || orders.length === 0) return;
    
    // 记录需要初始化的订单
    const ordersToInit = [];
    const scheduledOrderIds = new Set();
    
    // 批量获取订单ID列表，减少API请求次数
    const orderIds = orders.map(order => parseInt(order.id)).filter(id => id);
    
    try {
      // 分批处理，每次处理10个订单
      const batchSize = 10;
      for (let i = 0; i < orderIds.length; i += batchSize) {
        const batchIds = orderIds.slice(i, i + batchSize);
        
        // 并行处理每批订单
        await Promise.all(batchIds.map(async (bookingId) => {
          try {
            const response = await getSchedulesByBookingId(bookingId);
            if (response && response.code === 1 && response.data && response.data.length > 0) {
              // 已有行程排序数据
              scheduledOrderIds.add(bookingId);
            } else {
              // 没有行程排序数据，需要初始化
              const order = orders.find(o => parseInt(o.id) === bookingId);
              if (order) {
                ordersToInit.push(order);
              }
            }
          } catch (error) {
            console.error(`检查订单 ${bookingId} 行程排序数据失败:`, error);
            // 发生错误时，也标记为需要初始化
            const order = orders.find(o => parseInt(o.id) === bookingId);
            if (order) {
              ordersToInit.push(order);
            }
          }
        }));
      }
    } catch (error) {
      console.error('批量检查订单行程排序数据失败:', error);
    }
    
    // 如果有需要初始化的订单，提示用户
    if (ordersToInit.length > 0) {
      setOrdersWithoutSchedule(ordersToInit);
      message.info(`检测到 ${ordersToInit.length} 个订单没有行程排序数据，点击"初始化行程"按钮可自动创建`);
    } else {
      // 清空需要初始化的订单列表
      setOrdersWithoutSchedule([]);
    }
  };
  
  // 批量初始化所有未排序订单
  const batchInitOrderSchedules = async () => {
    if (ordersWithoutSchedule.length === 0) {
      message.info('没有需要初始化的订单');
          return;
        }
        
    setLoading(true);
    try {
      let successCount = 0;
      let failCount = 0;
      let successfulOrderIds = []; // 跟踪成功初始化的订单ID
      
      // 分批处理，每次处理5个订单
      const batchSize = 5;
      const totalOrders = ordersWithoutSchedule.length;
      
      for (let i = 0; i < totalOrders; i += batchSize) {
        const batchOrders = ordersWithoutSchedule.slice(i, i + batchSize);
        
        // 创建一个进度提示
        if (totalOrders > 10) {
          message.loading(`正在初始化订单 ${i+1}-${Math.min(i+batchSize, totalOrders)}/${totalOrders}...`, 1);
        }
        
        // 并行处理每批订单
        const results = await Promise.allSettled(
          batchOrders.map(order => {
            const bookingId = parseInt(order.id);
            if (!bookingId) return Promise.reject(new Error('无效的订单ID'));
            
            return initOrderSchedules(bookingId);
          })
        );
        
        // 处理结果
        results.forEach((result, index) => {
          if (result.status === 'fulfilled' && result.value?.code === 1) {
            successCount++;
            // 记录成功的订单ID
            const bookingId = parseInt(batchOrders[index].id);
            if (bookingId) {
              successfulOrderIds.push(bookingId);
            }
          } else {
            failCount++;
          }
        });
      }
      
      if (successCount > 0) {
        message.success(`成功初始化 ${successCount} 个订单的行程排序`);
        
        // 直接更新UI，移除已成功初始化的订单
        if (successfulOrderIds.length > 0) {
          setOrdersWithoutSchedule(prev => 
            prev.filter(order => !successfulOrderIds.includes(parseInt(order.id)))
          );
        }
        
        // 刷新数据以显示新初始化的行程
        handleRefresh();
      }
      
      if (failCount > 0) {
        message.error(`${failCount} 个订单初始化失败`);
      }
    } catch (error) {
      console.error('批量初始化订单失败:', error);
      message.error('批量初始化失败: ' + (error.message || '未知错误'));
    } finally {
      setLoading(false);
    }
  };

  // 格式化行程排序数据为显示格式
  const formatScheduleDataForDisplay = async (scheduleList) => {
    if (!scheduleList || !Array.isArray(scheduleList) || scheduleList.length === 0) {
      return [];
    }
    
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
          specialRequests: schedule.specialRequests || ''
        }
      };
      
      // 更新开始和结束日期
      if (!order.startDate || moment(dateStr).isBefore(order.startDate)) {
        order.startDate = moment(dateStr);
      }
      if (!order.endDate || moment(dateStr).isAfter(order.endDate)) {
        order.endDate = moment(dateStr);
      }
    });
    
    // 转换为数组并按开始日期排序
    return Array.from(orderMap.values())
      .filter(order => Object.keys(order.dates).length > 0)
      .sort((a, b) => a.startDate - b.startDate);
  };

  // 格式化原API数据为组件需要的格式（保留原来的方法作为备用）
  const formatApiDataForSchedule = async (apiData) => {
    if (!apiData || !Array.isArray(apiData) || apiData.length === 0) {
      return [];
    }

    // 首先处理所有订单，提取日期信息
    const processedOrders = await Promise.all(apiData.map(async order => {
      let itinerary = [];

      // 直接从订单的itineraryDetails解析行程详情
      if (order.itineraryDetails) {
        try {
          const parsedItinerary = JSON.parse(order.itineraryDetails);
          itinerary = parsedItinerary.map(day => {
            return {
              day: day.day_number || 1,
              location: day.title || day.activity || day.location || '待安排',
              description: day.description || ''
            };
          });
          console.log(`已解析订单[${order.bookingId}]的行程数据，共${itinerary.length}天`);
        } catch (e) {
          console.error('解析行程详情失败:', e);
          itinerary = [];
        }
      }

      // 如果仍然没有行程数据，使用开始和结束日期创建默认行程
      if (itinerary.length === 0) {
        if (order.tourStartDate && order.tourEndDate) {
          const startDate = moment(order.tourStartDate);
          const endDate = moment(order.tourEndDate);
          const days = endDate.diff(startDate, 'days') + 1;
          
          // 获取旅游产品名称作为默认位置
          const locationName = order.tourName || order.tourLocation || (order.tourType === 'day_tour' ? '一日游' : '跟团游');
          
          // 为一日游特别处理
          if (order.tourType === 'day_tour') {
            itinerary = [{
              day: 1,
              location: locationName,
              description: `${locationName}行程`
            }];
            console.log(`为一日游订单[${order.bookingId}]创建默认行程`);
          } else {
          // 为每天创建默认行程
          itinerary = Array.from({ length: days }, (_, i) => ({
            day: i + 1,
            location: locationName || '待安排'
          }));
        }
        }
      }

      // 特殊情况：如果是一日游但仍然没有行程数据，强制创建一个默认行程
      if (itinerary.length === 0 && order.tourType === 'day_tour') {
        const locationName = order.tourName || order.tourLocation || '一日游';
        itinerary = [{
          day: 1,
          location: locationName,
          description: `${locationName}行程`
        }];
        console.log(`为一日游订单[${order.bookingId}]强制创建默认行程`);
      }

      // 收集所有该订单的行程日期和地点
      const dates = {};
      // 安全获取开始日期，如果为null则使用当前日期
      const startDate = order.tourStartDate ? moment(order.tourStartDate) : moment();
      
      itinerary.forEach((item, index) => {
        // 计算实际日期
        const actualDate = startDate.clone().add(index, 'days');
        const dateStr = actualDate.format('YYYY-MM-DD');
        
        // 构建位置名称，优先使用行程中的位置，如果没有则使用旅游产品名称
        let locationName = item.location || '待安排';
        
        // 对于位置是"待安排"的，尝试使用旅游产品名称
        if (locationName === '待安排' && order.tourName) {
          locationName = order.tourName;
        }
        
        // 获取位置颜色，基于位置名称的一致性
        const locationColor = getLocationColor(locationName);
        
        // 确保tourId不为空
        const tourId = order.tourId || 1; // 默认值为1，避免null
        
        dates[dateStr] = {
          id: `loc-${index}`,
          name: locationName,
          color: locationColor,
          description: item.description || '',
          tourId: tourId, // 添加tourId
          tourType: order.tourType || 'group_tour', // 添加tourType
          order: {
            ...order,
            tourId: tourId, // 确保order中也有tourId
            orderNumber: order.orderNumber || '',
            specialRequests: order.specialRequests || ''
          }
        };
      });
      
      // 提取短名称作为显示，例如"塔斯马尼亚环岛游"简化为"塔斯"
      let shortName = order.tourName || '';
      if (shortName.length > 4) {
        // 如果名称很长，提取前两个字作为简称
        shortName = shortName.substring(0, 2);
      }
      
      return {
        id: order.bookingId.toString(),
        customer: {
          id: order.userId ? order.userId.toString() : 'unknown',
          name: order.contactPerson || '未知客户',
          phone: order.contactPhone || '',
          pax: (order.adultCount || 0) + (order.childCount || 0),
          bookingId: order.bookingId.toString() || '',
          orderNumber: order.orderNumber || '',
          hotel: order.pickupLocation || '',
          shortName: shortName
        },
        startDate: order.tourStartDate ? moment(order.tourStartDate) : moment(),
        endDate: order.tourEndDate ? moment(order.tourEndDate) : (order.tourStartDate ? moment(order.tourStartDate) : moment()),
        type: order.tourType,
        dates: dates,
        orderNumber: order.orderNumber || '',
        specialRequests: order.specialRequests || ''
      };
    }));

    // 过滤掉没有行程的订单
    const validOrders = processedOrders.filter(order => Object.keys(order.dates).length > 0);
    
    // 使用新方法排列订单
    return arrangeOrdersByTimeline(validOrders);
  };

  // 新增：按时间线排列订单
  const arrangeOrdersByTimeline = (orders) => {
    if (!orders || orders.length === 0) return [];
    
    // 先按照开始日期排序
    const sortedOrders = [...orders].sort((a, b) => {
      const aFirstDate = Object.keys(a.dates).sort()[0];
      const bFirstDate = Object.keys(b.dates).sort()[0];
      return moment(aFirstDate).valueOf() - moment(bFirstDate).valueOf();
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
      return moment(aFirstDate).valueOf() - moment(bFirstDate).valueOf();
    });
    
    console.log(`订单排列完成，共${sortedOrders.length}个订单，使用了${Math.max(...sortedOrders.map(o => o.columnIndex)) + 1}列`);
    
    return sortedOrders;
  };

  const handleDateChange = (dates) => {
    if (dates && dates.length === 2) {
      setDateRange(dates);
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
            
            // 获取日期中的天数，用于dayNumber
            const dayNumber = parseInt(dateStr.split('-')[2]) || displayOrderCounter;
            
            // 获取所有必要的字段
            const schedule = {
              id: scheduleId, // 如果是更新已有数据，使用原始ID
              bookingId: bookingId,
              tourDate: dateStr,
              tourId: tourId,
              tourType: tourType,
              title: locationName,
              description: location.description || locationInfo.description || '',
              dayNumber: dayNumber, // 日期中的天数
              displayOrder: displayOrderCounter, // 显示顺序，从1开始递增
              orderNumber: orderInfo.orderNumber || group.orderNumber || '',
              adultCount: orderInfo.adultCount || 0,
              childCount: orderInfo.childCount || 0,
              contactPerson: orderInfo.contactPerson || group.customer?.name || '',
              contactPhone: orderInfo.contactPhone || group.customer?.phone || '',
              pickupLocation: orderInfo.pickupLocation || group.customer?.hotel || '',
              dropoffLocation: orderInfo.dropoffLocation || '',
              specialRequests: orderInfo.specialRequests || group.specialRequests || '',
              luggageCount: orderInfo.luggageCount || 0,
              hotelLevel: orderInfo.hotelLevel || '',
              roomType: orderInfo.roomType || '',
              serviceType: orderInfo.serviceType || tourType === 'day_tour' ? '一日游' : '跟团游',
              paymentStatus: orderInfo.paymentStatus || '',
              totalPrice: orderInfo.totalPrice || 0,
              userId: orderInfo.userId || null,
              agentId: orderInfo.agentId || null,
              groupSize: orderInfo.groupSize || (orderInfo.adultCount + orderInfo.childCount) || 0,
              status: orderInfo.status || 'confirmed',
              tourName: orderInfo.tourName || locationInfo.name || '',
              tourLocation: orderInfo.tourLocation || '',
              color: color // 保存颜色信息
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

  // 初始化订单行程
  const initOrderSchedule = async (bookingId) => {
    if (!bookingId) return;
    
    setLoading(true);
    try {
      const response = await initOrderSchedules(bookingId);
      
      if (response && response.code === 1) {
        message.success(`订单 ${bookingId} 的行程已成功初始化`);
        
        // 直接更新UI，而不是重新加载
        const orderToRemove = ordersWithoutSchedule.find(o => parseInt(o.id) === bookingId);
        if (orderToRemove) {
          // 从未初始化的订单列表中移除
          setOrdersWithoutSchedule(prev => prev.filter(o => parseInt(o.id) !== bookingId));
        }
        
        // 刷新数据以显示新初始化的行程
        handleRefresh();
      } else {
        message.error(response?.msg || `初始化订单 ${bookingId} 的行程失败`);
      }
    } catch (error) {
      console.error('初始化行程失败:', error);
      message.error('初始化行程失败: ' + (error.message || '未知错误'));
    } finally {
      setLoading(false);
    }
  };

  // 备用方法：当行程排序API不可用时，使用订单API获取数据
  const fetchOrdersAsBackup = async () => {
    if (isInitializing.current) return; // 防止递归
    isInitializing.current = true; // 设置初始化标记
    
    try {
      // 准备API请求参数
      const params = {
        pageSize: 100, // 获取足够多的订单
        page: 1,
      };
      
      // 根据视图模式设置筛选条件
      if (viewMode !== 'all') {
        params.tourType = viewMode;
      }
      
      console.log('获取原始订单数据，参数:', params);
      
      // 调用API获取订单列表
      const response = await getOrderList(params);
      
      if (response?.code === 1 && response.data?.records?.length > 0) {
        const orderList = response.data.records;
        console.log(`找到${orderList.length}条原始订单数据`);
        
        // 转换API数据为组件需要的格式
        const formattedData = await formatApiDataForSchedule(orderList);
        setScheduleData(formattedData);
        
        // 检查哪些订单需要初始化
        await checkOrdersForInit(orderList);
      } else {
        console.log('没有找到匹配条件的订单数据');
        message.info('没有找到匹配条件的订单数据');
        setScheduleData([]);
      }
    } catch (error) {
      console.error('获取订单数据失败:', error);
      message.error('获取数据失败，请检查网络连接或API配置');
      setScheduleData([]);
    } finally {
      isInitializing.current = false; // 重置初始化标记
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
              value={dateRange}
              onChange={handleDateChange}
              allowClear={false}
              format="YYYY-MM-DD"
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
            {ordersWithoutSchedule.length > 0 && (
              <Button
                type="primary"
                onClick={batchInitOrderSchedules}
                loading={loading}
              >
                初始化行程({ordersWithoutSchedule.length})
              </Button>
            )}
            <Button 
              icon={<ReloadOutlined />} 
              onClick={handleRefresh}
              loading={loading}
            >
              刷新数据
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
            onInitSchedule={initOrderSchedule}
          />
        )}
      </Card>
    </div>
  );
};

export default TourArrangement; 