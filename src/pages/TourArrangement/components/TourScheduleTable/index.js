import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Empty, Spin, Tooltip, message, Button, Tag, Modal, Popover, Table, Form, Select, Dropdown, Menu, Input } from 'antd';
import { SaveOutlined, UserOutlined, HomeOutlined, IdcardOutlined, PhoneOutlined, TeamOutlined, EnvironmentOutlined, CalendarOutlined, CreditCardOutlined, CommentOutlined, CarOutlined, UserSwitchOutlined, SettingOutlined, LeftOutlined, RightOutlined, EditOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import moment from 'moment';
import './index.scss';
import axios from 'axios';
import { getEmployeesByPage } from '@/apis/Employee';
import { getAvailableGuides, getAvailableVehicles, checkAssignmentStatus, getAssignmentByDateAndLocation, cancelAssignment } from '@/api/guideAssignment';
import { assignGuideAndVehicle, saveSchedule, getSchedulesByBookingId, saveBatchSchedules } from '@/api/tourSchedule';
import { updateOrder } from '@/apis/orderApi';
import GuideVehicleAssignModal from '../../../../components/GuideVehicleAssignModal';
import AssignmentDetailModal from '../../../../components/AssignmentDetailModal';
import HotelBookingModal from '../HotelBookingModal';
import { getHotelBookingByScheduleOrderId } from '@/apis/hotel';

const TourScheduleTable = ({ data, loading, dateRange, onUpdate }) => {
  // 🔍 入口数据调试
  console.log('🔍 [TourScheduleTable] 接收到的data:', {
    数据类型: typeof data,
    是否为数组: Array.isArray(data),
    数据长度: data?.length,
    前2条数据样例: data?.slice(0, 2)?.map(item => ({
      订单ID: item.id,
      客户信息: item.customer,
      日期数据键列表: Object.keys(item.dates || {}),
      日期数据详情: Object.keys(item.dates || {}).map(date => ({
        日期: date,
        数据键列表: Object.keys(item.dates[date] || {}),
        重要字段: {
          contactPerson: item.dates[date]?.contactPerson,
          contactPhone: item.dates[date]?.contactPhone,
          adultCount: item.dates[date]?.adultCount,
          childCount: item.dates[date]?.childCount,
          pickupLocation: item.dates[date]?.pickupLocation,
          dropoffLocation: item.dates[date]?.dropoffLocation
        }
      }))
    }))
  });
  
  const navigate = useNavigate();
  const [dates, setDates] = useState([]);
  const [tourGroups, setTourGroups] = useState([]);
  const [draggedItem, setDraggedItem] = useState(null);
  const [dragOriginContainer, setDragOriginContainer] = useState(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [originalData, setOriginalData] = useState(null);
  const [activeTooltip, setActiveTooltip] = useState(null);
  // 移除导航控制相关状态 - 改用普通滚动条
  // const [visibleColumnStart, setVisibleColumnStart] = useState(0);
  // const [visibleColumnCount, setVisibleColumnCount] = useState(4); // 默认显示4列
  const [dateModalVisible, setDateModalVisible] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [dateLocationStats, setDateLocationStats] = useState([]);
  
  // 导游和车辆分配相关状态
  const [assignModalVisible, setAssignModalVisible] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [availableGuides, setAvailableGuides] = useState([]);
  const [availableVehicles, setAvailableVehicles] = useState([]);
  const [assignForm] = Form.useForm();
  const [assignLoading, setAssignLoading] = useState(false);
  
  // 新的导游车辆分配弹窗状态
  const [guideVehicleModalVisible, setGuideVehicleModalVisible] = useState(false);
  const [selectedOrders, setSelectedOrders] = useState([]);
  
  // 分配详情弹窗状态
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [currentAssignmentData, setCurrentAssignmentData] = useState(null);
  
  // 编辑排团表信息弹窗状态
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editForm] = Form.useForm();
  const [currentEditData, setCurrentEditData] = useState(null);
  
  // 酒店预订弹窗状态
  const [hotelBookingModalVisible, setHotelBookingModalVisible] = useState(false);
  const [currentHotelBookingData, setCurrentHotelBookingData] = useState(null);
  
  // 横向滚动容器引用
  const scrollContainerRef = useRef(null);
  
  // 横向导航状态
  const [scrollProgress, setScrollProgress] = useState(0);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  // Refs for tracking draggable elements
  const dragItemRef = useRef(null);
  const dragNodeRef = useRef(null);

  // 新增状态：订单组颜色映射和酒店预订状态
  const [orderGroupColors, setOrderGroupColors] = useState({});
  const [hotelBookingStatus, setHotelBookingStatus] = useState({});

  // 组件初始化时清除本地存储，确保不使用可能包含静态数据的草稿
  useEffect(() => {
    try {
      localStorage.removeItem('tourSchedule_draft');
      localStorage.removeItem('tourSchedule_draftTimestamp');
    } catch (e) {
      console.error('Failed to clear localStorage', e);
    }
  }, []);

  // 计算行程分组 - 将连续的日期归为一组
  const calculateTourSegments = (dateArray, locationsByDate) => {
    const segments = [];
    let currentSegment = null;

    dateArray.forEach(date => {
      const hasLocation = !!locationsByDate[date.date];
      
      if (hasLocation) {
        if (!currentSegment) {
          // 开始新的分段
          currentSegment = {
            startDate: date.date,
            endDate: date.date,
            dates: [date.date]
          };
        } else {
          // 扩展当前分段
          currentSegment.endDate = date.date;
          currentSegment.dates.push(date.date);
        }
      } else if (currentSegment) {
        // 结束当前分段
        segments.push(currentSegment);
        currentSegment = null;
      }
    });

    // 处理最后一个分段
    if (currentSegment) {
      segments.push(currentSegment);
    }

    return segments;
  };

  // 智能排列订单，避免重叠，尽量从左侧开始排列
  const arrangeOrdersByDate = (ordersData) => {
    if (!ordersData || !Array.isArray(ordersData) || ordersData.length === 0) {
      return [];
    }

    // 先按开始日期排序
    const sortedOrders = [...ordersData].sort((a, b) => {
      const aStartDate = a.startDate ? a.startDate.valueOf() : 0;
      const bStartDate = b.startDate ? b.startDate.valueOf() : 0;
      return aStartDate - bStartDate;
    });

    // 为每个订单创建日期范围信息
    const orderRanges = sortedOrders.map(order => {
      // 从订单中提取日期范围
      let startDate = null;
      let endDate = null;
      
      const orderDates = Object.keys(order.dates || {}).sort();
      
      if (orderDates.length > 0) {
        // 如果有日期数据，使用第一个和最后一个日期
        startDate = orderDates[0];
        endDate = orderDates[orderDates.length - 1];
      } else if (order.startDate && order.endDate) {
        // 如果有明确的开始和结束日期，使用它们
        startDate = order.startDate.format('YYYY-MM-DD');
        endDate = order.endDate.format('YYYY-MM-DD');
      } else if (order.tourStartDate && order.tourEndDate) {
        // 尝试使用tourStartDate和tourEndDate
        try {
          startDate = dayjs(order.tourStartDate).format('YYYY-MM-DD');
          endDate = dayjs(order.tourEndDate).format('YYYY-MM-DD');
        } catch (e) {
          console.error('日期解析错误:', e);
        }
      }
      
      // 如果提取失败，为单日行程设置相同的开始和结束日期
      if (!startDate && !endDate && orderDates.length === 1) {
        startDate = orderDates[0];
        endDate = orderDates[0];
      }
      
      // 如果仍然没有日期，使用当前日期（作为最后的回退）
      if (!startDate || !endDate) {
        const today = dayjs().format('YYYY-MM-DD');
        startDate = today;
        endDate = today;
        console.warn(`订单 ${order.id} 无法提取日期范围，使用当前日期作为替代`);
      }
      
      console.log(`订单 ${order.id} 日期范围: ${startDate} 至 ${endDate}`);
      
      return {
        id: order.id,
        order,
        startDate,
        endDate
      };
    }).filter(range => range.startDate && range.endDate);

    // 创建列占用情况
    const columns = [];
    
    // 调试输出
    console.log('排序前订单数量:', orderRanges.length);

    // 为每个订单分配列号 - 增强的列分配算法
    orderRanges.forEach(orderRange => {
      // 寻找第一个可用的列
      let columnIndex = 0;
      let assigned = false;

      while (!assigned) {
        if (!columns[columnIndex]) {
          columns[columnIndex] = [];
        }

        // 检查该列是否有时间重叠
        let hasOverlap = false;
        for (const existingRange of columns[columnIndex]) {
          // 转换为日期对象进行比较，确保比较的是日期而不是字符串
          const orderStart = dayjs(orderRange.startDate);
          const orderEnd = dayjs(orderRange.endDate);
          const existingStart = dayjs(existingRange.startDate);
          const existingEnd = dayjs(existingRange.endDate);
          
          // 更精确的重叠检测 - 如果两个日期范围有重叠
          // 一个订单的结束日期大于等于另一个订单的开始日期，且一个订单的开始日期小于等于另一个订单的结束日期
          if ((orderStart.isBefore(existingEnd) || orderStart.isSame(existingEnd)) && (orderEnd.isAfter(existingStart) || orderEnd.isSame(existingStart))) {
            hasOverlap = true;
            console.log(`订单 ${orderRange.id} 与 ${existingRange.id} 在列 ${columnIndex} 重叠`);
            console.log(`- 订单时间: ${orderStart.format('YYYY-MM-DD')} 至 ${orderEnd.format('YYYY-MM-DD')}`);
            console.log(`- 已有时间: ${existingStart.format('YYYY-MM-DD')} 至 ${existingEnd.format('YYYY-MM-DD')}`);
            break;
          }
        }

        if (!hasOverlap) {
          // 找到可用列，分配订单
          columns[columnIndex].push(orderRange);
          orderRange.order.columnIndex = columnIndex;
          console.log(`订单 ${orderRange.id} 分配到列 ${columnIndex}`);
          assigned = true;
        } else {
          // 该列已被占用，检查下一列
          columnIndex++;
        }
      }
    });

    // 打印列分配结果
    console.log('列分配结果:');
    columns.forEach((column, index) => {
      console.log(`列 ${index}: ${column.length} 个订单`);
    });

    // 将列号信息确保应用到所有订单
    sortedOrders.forEach(order => {
      if (order.columnIndex === undefined) {
        // 查找对应的orderRange并获取其列号
        const range = orderRanges.find(r => r.id === order.id);
        if (range && range.order && range.order.columnIndex !== undefined) {
          order.columnIndex = range.order.columnIndex;
        } else {
          // 默认放在第一列
          order.columnIndex = 0;
        }
      }
    });

    // 将订单按列号和开始日期排序
    return sortedOrders.sort((a, b) => {
      const aCol = a.columnIndex || 0;
      const bCol = b.columnIndex || 0;
      
      if (aCol !== bCol) {
        return aCol - bCol;
      }
      
      // 如果列相同，按开始日期排序
      const aStart = a.startDate ? a.startDate.valueOf() : 0;
      const bStart = b.startDate ? b.startDate.valueOf() : 0;
      return aStart - bStart;
    });
  };

  // 处理拖拽开始
  const handleDragStart = (e, groupId, segmentIndex, date, locationData) => {
    // 拖拽开始时隐藏tooltip
    setActiveTooltip(null);
    
    // 记录被拖拽的元素信息
    const dragInfo = {
      groupId,
      segmentIndex,
      date,
      locationData,
      index: e.currentTarget.dataset.index
    };
    
    setDraggedItem(dragInfo);
    
    // 记录原始容器
    setDragOriginContainer(`${groupId}-segment-${segmentIndex}`);
    
    // 设置被拖拽元素的引用
    dragNodeRef.current = e.currentTarget;
    dragItemRef.current = dragInfo;
    
    // 保存拖拽前的原始数据（如果尚未保存）
    if (!originalData) {
      setOriginalData(JSON.parse(JSON.stringify(tourGroups)));
    }
    
    // 添加拖拽中的样式
    setTimeout(() => {
      if (e.currentTarget) {
        e.currentTarget.classList.add('dragging');
      }
      
      // 为body添加dragging类
      document.body.classList.add('dragging');
    }, 0);
    
    // 设置拖拽时的图像和偏移量
    if (e.dataTransfer) {
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', date);
    }
  };

  // 处理拖拽结束
  const handleDragEnd = (e) => {
    // 清除拖拽中的样式
    if (dragNodeRef.current) {
      dragNodeRef.current.classList.remove('dragging');
    }
    
    // 移除body的dragging类
    document.body.classList.remove('dragging');
    
    // 清除容器中的样式
    const containers = document.querySelectorAll('.tour-container');
    containers.forEach(container => {
      container.classList.remove('drag-over');
    });

    // 清除所有目标样式
    const cells = document.querySelectorAll('.date-cell');
    cells.forEach(cell => {
      cell.classList.remove('drag-target');
    });

    // 重置拖拽状态
    setDraggedItem(null);
    dragItemRef.current = null;
    dragNodeRef.current = null;
    setDragOriginContainer(null);
  };

  // 处理拖拽进入单元格
  const handleDragEnter = (e, groupId, segmentIndex, date, targetIndex) => {
    // 阻止默认行为，允许放置
    e.preventDefault();
    e.stopPropagation();
    
    // 拖拽期间隐藏tooltip
    setActiveTooltip(null);
    
    // 只允许在同一个容器内交换
    const currentContainer = `${groupId}-segment-${segmentIndex}`;
    if (dragOriginContainer !== currentContainer || !dragItemRef.current) {
      return;
    }
    
    // 如果是拖拽到自己，不做任何操作
    if (dragItemRef.current.date === date) {
      return;
    }
    
    // 清除其他单元格的高亮
    const cells = document.querySelectorAll('.date-cell');
    cells.forEach(cell => {
      if (cell !== e.currentTarget) {
        cell.classList.remove('drag-target');
      }
    });
    
    // 高亮目标单元格，表示可以交换
    e.currentTarget.classList.add('drag-target');
  };

  // 处理离开单元格
  const handleDragLeave = (e) => {
    // 如果不是离开到子元素，才移除高亮
    if (!e.currentTarget.contains(e.relatedTarget)) {
      e.currentTarget.classList.remove('drag-target');
    }
  };

  // 执行位置交换
  const swapLocations = (sourceGroupId, segmentIndex, sourceDate, targetDate) => {
    // 复制当前状态以进行修改
    const updatedGroups = [...tourGroups];
    
    // 找到需要修改的组
    const groupIndex = updatedGroups.findIndex(group => group.id === sourceGroupId);
    if (groupIndex === -1) return;
    
    const group = updatedGroups[groupIndex];
    
    // 确保两个日期都有位置数据
    if (!group.locationsByDate[sourceDate] || !group.locationsByDate[targetDate]) {
      return;
    }
    
    // 临时保存源位置数据和目标位置数据的完整副本
    const sourceLocation = JSON.parse(JSON.stringify(group.locationsByDate[sourceDate]));
    const targetLocation = JSON.parse(JSON.stringify(group.locationsByDate[targetDate]));
    
    // 重要：保留原始名称，因为颜色是基于名称的
    const sourceName = sourceLocation.name || sourceLocation.location?.name;
    const targetName = targetLocation.name || targetLocation.location?.name;
    
    // 记录关键信息，确保不丢失
    const sourceTourId = sourceLocation.location?.tourId || sourceLocation.tourId || 1;
    const sourceTourType = sourceLocation.location?.tourType || sourceLocation.tourType || 'group_tour';
    const targetTourId = targetLocation.location?.tourId || targetLocation.tourId || 1;
    const targetTourType = targetLocation.location?.tourType || targetLocation.tourType || 'group_tour';
    
    // 保存原始颜色信息
    const sourceColor = sourceLocation.location?.color || sourceLocation.color;
    const targetColor = targetLocation.location?.color || targetLocation.color;
    
    // 创建更新后的locationsByDate对象
    const updatedLocationsByDate = { ...group.locationsByDate };
    
    // 交换两个位置，同时保留各自的原始属性
    updatedLocationsByDate[sourceDate] = targetLocation;
    updatedLocationsByDate[targetDate] = sourceLocation;
    
    // 关键修改：确保交换后每个位置保留自己的名称和对应的颜色
    if (updatedLocationsByDate[sourceDate]) {
      // 源位置现在有了目标位置的内容，但应该保留源位置的名称对应的颜色
      updatedLocationsByDate[sourceDate].tourId = sourceTourId;
      updatedLocationsByDate[sourceDate].tourType = sourceTourType;
      
      // 名称应该交换
      const swappedNameSource = targetName;
      if (swappedNameSource) {
        if (updatedLocationsByDate[sourceDate].name) {
          updatedLocationsByDate[sourceDate].name = swappedNameSource;
        }
        if (updatedLocationsByDate[sourceDate].location) {
          updatedLocationsByDate[sourceDate].location.name = swappedNameSource;
        }
      }
    }
    
    if (updatedLocationsByDate[targetDate]) {
      // 目标位置现在有了源位置的内容，但应该保留目标位置的名称对应的颜色
      updatedLocationsByDate[targetDate].tourId = targetTourId;
      updatedLocationsByDate[targetDate].tourType = targetTourType;
      
      // 名称应该交换
      const swappedNameTarget = sourceName;
      if (swappedNameTarget) {
        if (updatedLocationsByDate[targetDate].name) {
          updatedLocationsByDate[targetDate].name = swappedNameTarget;
        }
        if (updatedLocationsByDate[targetDate].location) {
          updatedLocationsByDate[targetDate].location.name = swappedNameTarget;
        }
      }
    }
    
    // 确保位置数据中包含必要的属性
    [sourceDate, targetDate].forEach(date => {
      if (updatedLocationsByDate[date]) {
        // 如果location属性不存在，从原属性中创建
        if (!updatedLocationsByDate[date].location && updatedLocationsByDate[date].name) {
          updatedLocationsByDate[date].location = {
            name: updatedLocationsByDate[date].name,
            color: updatedLocationsByDate[date].color,
            description: updatedLocationsByDate[date].description,
            tourId: updatedLocationsByDate[date].tourId || 1,
            tourType: updatedLocationsByDate[date].tourType || 'group_tour',
            order: updatedLocationsByDate[date].order
          };
        }
        
        // 确保order中包含tourId
        if (updatedLocationsByDate[date].order && !updatedLocationsByDate[date].order.tourId) {
          updatedLocationsByDate[date].order.tourId = updatedLocationsByDate[date].tourId || 1;
          updatedLocationsByDate[date].order.tourType = updatedLocationsByDate[date].tourType || 'group_tour';
        }
      }
    });
    
    // 更新组的locationsByDate
    updatedGroups[groupIndex] = {
      ...group,
      locationsByDate: updatedLocationsByDate
    };
    
    // 更新状态
    setTourGroups(updatedGroups);
    setHasUnsavedChanges(true);
    
    // 将更改保存到本地存储，防止刷新丢失
    try {
      localStorage.setItem('tourSchedule_draft', JSON.stringify(updatedGroups));
      localStorage.setItem('tourSchedule_draftTimestamp', Date.now().toString());
    } catch (e) {
      console.error('Failed to save draft to localStorage', e);
    }
    
    return updatedGroups;
  };

  // 处理拖拽放置
  const handleDrop = async (e, targetGroupId, targetSegmentIndex, targetDate, targetIndex) => {
    e.preventDefault();
    e.stopPropagation();
    
    // 移除目标单元格高亮
    e.currentTarget.classList.remove('drag-target');
    
    // 只允许在同一个容器内交换
    const targetContainer = `${targetGroupId}-segment-${targetSegmentIndex}`;
    if (dragOriginContainer !== targetContainer || !draggedItem) {
      return;
    }
    
    // 如果源和目标相同，不做任何操作
    if (draggedItem.date === targetDate) {
      return;
    }
    
    // 🛡️ 拖拽前检测：查找涉及的地点
    const sourceGroup = tourGroups.find(group => group.id === targetGroupId);
    if (!sourceGroup) {
      handleDragEnd(e);
      return;
    }
    
    const sourceLocation = sourceGroup.locationsByDate[draggedItem.date];
    const targetLocation = sourceGroup.locationsByDate[targetDate];
    
    if (!sourceLocation || !targetLocation) {
      handleDragEnd(e);
      return;
    }
    
    // 提取地点名称
    const sourceLocationName = extractLocationName(sourceLocation.name || sourceLocation.location?.name || '');
    const targetLocationName = extractLocationName(targetLocation.name || targetLocation.location?.name || '');
    
    try {
      // 检查涉及的日期和地点是否已分配导游车辆
      const [sourceAssignment, targetAssignment] = await Promise.all([
        getAssignmentByDateAndLocation(draggedItem.date, sourceLocationName).catch(() => null),
        getAssignmentByDateAndLocation(targetDate, targetLocationName).catch(() => null)
      ]);
      
      // 检查是否有任何一个位置已分配
      const hasSourceAssignment = sourceAssignment?.code === 1 && sourceAssignment?.data?.length > 0;
      const hasTargetAssignment = targetAssignment?.code === 1 && targetAssignment?.data?.length > 0;
      
      if (hasSourceAssignment || hasTargetAssignment) {
        // 准备需要清除的分配信息
        const affectedAssignments = [];
        
        if (hasSourceAssignment) {
          affectedAssignments.push({
            id: sourceAssignment.data[0].id,
            date: draggedItem.date,
            location: sourceLocationName,
            guideName: sourceAssignment.data[0]?.guideName || '未知'
          });
        }
        
        if (hasTargetAssignment) {
          affectedAssignments.push({
            id: targetAssignment.data[0].id,
            date: targetDate,
            location: targetLocationName,
            guideName: targetAssignment.data[0]?.guideName || '未知'
          });
        }
        
        // 生成显示信息
        const sourceAssignmentInfo = hasSourceAssignment ? 
          `${draggedItem.date} ${sourceLocationName}（导游：${sourceAssignment.data[0]?.guideName || '未知'}）` : '';
        const targetAssignmentInfo = hasTargetAssignment ? 
          `${targetDate} ${targetLocationName}（导游：${targetAssignment.data[0]?.guideName || '未知'}）` : '';
        
        const assignmentList = [sourceAssignmentInfo, targetAssignmentInfo].filter(Boolean);
        
        // 使用Antd的Modal.confirm
        Modal.confirm({
          title: '⚠️ 检测到已分配的行程',
          content: (
            <div>
              <p>以下行程已分配导游和车辆：</p>
              <ul style={{ marginLeft: 20, color: '#ff4d4f' }}>
                {assignmentList.map((info, index) => (
                  <li key={index}>{info}</li>
                ))}
              </ul>
              <p style={{ marginTop: 16, color: '#666' }}>
                拖拽调整会影响现有分配，是否继续？
              </p>
              <p style={{ fontSize: '12px', color: '#999' }}>
                继续操作将自动清除这些分配，之后需要重新分配导游和车辆
              </p>
            </div>
          ),
          okText: '继续拖拽并清除分配',
          cancelText: '取消',
          okType: 'danger',
          onOk: () => {
            // 用户确认继续，执行拖拽操作并传递需要清除的分配
            performDragOperation(targetGroupId, targetSegmentIndex, targetDate, affectedAssignments);
          },
          onCancel: () => {
            // 用户取消，结束拖拽
            handleDragEnd(e);
          }
        });
        
        return; // 等待用户确认，不继续执行
      }
    } catch (error) {
      console.error('检查分配状态时出错:', error);
      // 如果检查失败，询问用户是否继续
             Modal.confirm({
         title: '无法检查分配状态',
         content: '无法确认该行程是否已分配导游和车辆，是否继续拖拽操作？',
         okText: '继续',
         cancelText: '取消',
         onOk: () => {
           performDragOperation(targetGroupId, targetSegmentIndex, targetDate, []);
         },
         onCancel: () => {
           handleDragEnd(e);
         }
       });
      return;
    }
    
         // 如果没有分配，直接执行拖拽操作
     performDragOperation(targetGroupId, targetSegmentIndex, targetDate, []);
  };
  
  // 执行拖拽操作的函数
  const performDragOperation = async (targetGroupId, targetSegmentIndex, targetDate, affectedAssignments = []) => {
    try {
      // 🗑️ 如果有受影响的分配，先清除它们
      if (affectedAssignments.length > 0) {
        message.loading('正在清除相关分配...', 0);
        
        for (const assignment of affectedAssignments) {
          try {
            const result = await cancelAssignment(assignment.id, '行程拖拽调整自动清除');
            if (result?.code === 1) {
              console.log(`✅ 已清除分配: ${assignment.date} ${assignment.location} (导游: ${assignment.guideName})`);
            } else {
              console.error(`❌ 清除分配失败: ${assignment.date} ${assignment.location}`, result);
            }
          } catch (error) {
            console.error(`❌ 清除分配异常: ${assignment.date} ${assignment.location}`, error);
          }
        }
        
        message.destroy(); // 清除loading消息
        message.success(`已清除 ${affectedAssignments.length} 个相关分配`);
      }
      
      // 执行位置交换
      const updatedGroups = swapLocations(
        targetGroupId,
        targetSegmentIndex,
        draggedItem.date,
        targetDate
      );
      
      if (updatedGroups) {
        // 提示用户
        message.success('已调整行程顺序，正在自动保存...');
        
        // 自动保存更改
        if (onUpdate) {
          setTimeout(() => {
            onUpdate({
              type: 'saveAll',
              updatedData: updatedGroups
            });
          }, 300);
        }
      }
    } catch (error) {
      console.error('拖拽操作失败:', error);
      message.error('拖拽操作失败: ' + (error.message || '未知错误'));
    } finally {
      handleDragEnd(null);
    }
  };

  // 处理拖拽放置区域进入
  const handleContainerDragEnter = (e, containerId) => {
    // 只有当拖拽起始区域和目标区域相同时才应用拖拽样式
    if (containerId === dragOriginContainer) {
      e.currentTarget.classList.add('drag-over');
    }
  };
  
  // 保存更改
  const handleSaveChanges = useCallback(() => {
    if (!hasUnsavedChanges) return;
    
    // 提交更改到父组件
    if (onUpdate) {
      onUpdate({
        type: 'saveAll',
        updatedData: tourGroups
      });
    }
    
    // 清除本地存储的草稿
    try {
      localStorage.removeItem('tourSchedule_draft');
      localStorage.removeItem('tourSchedule_draftTimestamp');
    } catch (e) {
      console.error('Failed to remove draft from localStorage', e);
    }
    
    setHasUnsavedChanges(false);
    setOriginalData(null);
    
    message.success('行程安排已保存');
  }, [hasUnsavedChanges, tourGroups, onUpdate]);
  
  // 取消更改
  const handleDiscardChanges = useCallback(() => {
    if (!hasUnsavedChanges || !originalData) return;
    
    // 恢复原始数据
    setTourGroups(originalData);
    
    // 清除本地存储的草稿
    try {
      localStorage.removeItem('tourSchedule_draft');
      localStorage.removeItem('tourSchedule_draftTimestamp');
    } catch (e) {
      console.error('Failed to remove draft from localStorage', e);
    }
    
    setHasUnsavedChanges(false);
    setOriginalData(null);
    
    message.info('已取消更改');
  }, [hasUnsavedChanges, originalData]);

  // 提取地点名称 - 从标题中提取主要地点名称
  const extractLocationName = (title) => {
    if (!title) return '';
    
    let locationName = title;
    
    // 先移除"第X天:"的前缀（兼容数字和中文数字）
    locationName = locationName.replace(/^第[一二三四五六七八九十\d]+天[:：]\s*/, '');
    
    // 如果还有冒号，提取冒号后的部分
    const colonSplit = locationName.split(/[:：]\s*/);
    if (colonSplit.length > 1) {
      locationName = colonSplit[1];
    }
    
    // 去掉"一日游"等后缀，但保留重要的区分信息
    locationName = locationName.replace(/一日游$/, '').trim();
    
    // 🎯 特殊处理：保留可选行程的重要区分信息
    // 对于亚瑟港相关行程，保留关键特征词
    if (locationName.includes('亚瑟港')) {
      if (locationName.includes('历史文化') || locationName.includes('含门票')) {
        return '亚瑟港(含门票)';
      } else if (locationName.includes('不含门票')) {
        return '亚瑟港(不含门票)';
      } else if (locationName.includes('迅游') || locationName.includes('1.5小时')) {
        return '亚瑟港(迅游)';
      } else {
        return '亚瑟港';
      }
    }
    
    // 对于酒杯湾相关行程，保留特征词
    if (locationName.includes('酒杯湾')) {
      if (locationName.includes('自然风光') || locationName.includes('徒步')) {
        return '酒杯湾(徒步)';
      } else if (locationName.includes('观景台')) {
        return '酒杯湾(观景)';
      } else {
        return '酒杯湾';
      }
    }
    
    // 其他地点的简化映射
    const simplifiedNames = {
      '霍巴特市游': '霍巴特',
      '霍巴特市区': '霍巴特',  
      '霍巴特周边经典': '霍巴特',
      '霍巴特': '霍巴特',
      '布鲁尼岛美食生态': '布鲁尼岛',
      '布鲁尼岛': '布鲁尼岛',
      '摇篮山': '摇篮山',
      '朗塞斯顿': '朗塞斯顿',
      '玛丽亚岛': '玛丽亚岛',
      '菲尔德山': '菲尔德山',
      '菲欣纳国家公园': '菲欣纳',
      '菲欣纳': '菲欣纳',
      '塔斯曼半岛': '塔斯曼半岛',
      '非常湾': '非常湾',
      '摩恩谷': '摩恩谷',
      '卡尔德': '卡尔德',
      '珊瑚湾': '珊瑚湾'
    };
    
    // 检查是否有简化名称
    for (const [key, value] of Object.entries(simplifiedNames)) {
      if (locationName.includes(key)) {
        return value;
      }
    }
    
    // 如果没有匹配的简化名称，返回处理后的名称
    return locationName;
  };
  
  // 获取颜色映射，根据地点名称返回颜色（与主页面保持一致）
  const getLocationColor = (locationName) => {
    if (!locationName) return '#1890ff';
    
    // 与主页面保持一致的颜色映射，同一地点使用统一颜色
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
      '塔斯曼半岛': '#ff4d4f',
      '玛丽亚岛': '#ffaa00',
      '摩恩谷': '#9254de',
      '菲尔德山': '#237804',
      '非常湾': '#5cdbd3',
      '卡尔德': '#096dd9'
    };
    
    // 优先进行精确匹配
    if (locationColors[locationName]) {
      return locationColors[locationName];
    }
    
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

  // 生成表格数据
  useEffect(() => {
    if (!dateRange || dateRange.length !== 2 || !data || data.length === 0) return;

    // 检查是否有保存的草稿
    let draftData = null;
    
    // 只有在没有传入数据或数据为空时才尝试加载草稿
    if (data.length === 0) {
      try {
        const draftStr = localStorage.getItem('tourSchedule_draft');
        const draftTimestamp = localStorage.getItem('tourSchedule_draftTimestamp');
        
        if (draftStr && draftTimestamp) {
          // 检查草稿是否在24小时内
          const now = Date.now();
          const draftTime = parseInt(draftTimestamp, 10);
          
          if (now - draftTime < 24 * 60 * 60 * 1000) { // 24小时内的草稿
            draftData = JSON.parse(draftStr);
            
            // 提示用户有未保存的草稿
            setTimeout(() => {
              message.info('检测到未保存的行程安排草稿，已自动加载');
            }, 500);
          } else {
            // 草稿太旧，删除
            localStorage.removeItem('tourSchedule_draft');
            localStorage.removeItem('tourSchedule_draftTimestamp');
          }
        }
      } catch (e) {
        console.error('Failed to load draft from localStorage', e);
      }
    }

    // 创建日期行
    const datesArray = [];
    let currentDate = dateRange[0].clone();
    while (currentDate.isBefore(dateRange[1]) || currentDate.isSame(dateRange[1])) {
      const dateStr = currentDate.format('YYYY-MM-DD');
      const dayName = currentDate.format('ddd');
      const monthDay = currentDate.format('MM/DD');
      
      datesArray.push({
        date: dateStr,
        displayDate: `${dayName} ${monthDay}`,
        dayNum: dayName,
        dateNum: monthDay
      });
      
      currentDate = currentDate.add(1, 'days');
    }
    
    // 如果有草稿数据，使用草稿
    if (draftData) {
      setDates(datesArray);
      setTourGroups(draftData);
      setHasUnsavedChanges(true);
      setOriginalData(JSON.parse(JSON.stringify(data)));
      return;
    }
    
    // 先进行智能排列，确保有日期重叠的订单会被分配到不同列
    const arrangedData = arrangeOrdersByDate(data);
    console.log('智能排列后的数据：', arrangedData.length);
    
    // 打印一些订单的location数据结构，帮助调试
    if (arrangedData.length > 0) {
      console.log('订单示例：', arrangedData[0]);
      console.log('日期数据示例：', arrangedData[0].dates);
      const sampleDateKey = Object.keys(arrangedData[0].dates)[0];
      if (sampleDateKey) {
        console.log('位置数据示例：', arrangedData[0].dates[sampleDateKey]);
      }
    }
    
    // 按照旅行社/团队组织数据
    const groups = arrangedData.map(order => {
      const orderDates = Object.keys(order.dates || {}).sort();
      
      // 收集每个日期的景点
      const locationsByDate = {};
      datesArray.forEach(dateObj => {
        const location = order.dates[dateObj.date];
        if (location) {
          // 提取地点名称
          const locationName = extractLocationName(location.name);
          
          locationsByDate[dateObj.date] = {
            date: dateObj.date,
            displayDate: dateObj.displayDate,
            location: {
              ...location,
              displayName: locationName, // 添加简化的显示名称
              originalOrder: location.order // 确保原始订单数据传递下去
            }
          };
        }
      });
      
      // 计算行程分段
      const segments = calculateTourSegments(datesArray, locationsByDate);
      
      return {
        id: order.id,
        customer: order.customer,
        locationsByDate: locationsByDate,
        segments: segments,
        hasLocations: Object.keys(locationsByDate).length > 0,
        columnIndex: order.columnIndex || 0 // 保存列号信息
      };
    });
    
    // 过滤掉没有行程的团队并按列号排序
    const filteredGroups = groups
      .filter(group => group.hasLocations)
      .sort((a, b) => a.columnIndex - b.columnIndex);
    
    setDates(datesArray);
    setTourGroups(filteredGroups);
  }, [dateRange, data]);

  // 当数据更新时，重新计算分段
  useEffect(() => {
    if (!dates || dates.length === 0 || !tourGroups || tourGroups.length === 0) return;
    
    // 更新所有组的分段信息
    const updatedGroups = tourGroups.map(group => {
      // 重新计算分段
      const segments = calculateTourSegments(dates, group.locationsByDate);
      
      return {
        ...group,
        segments: segments
      };
    });
    
    setTourGroups(updatedGroups);
  }, [dates]); // 只在dates改变时重新计算，避免无限循环



  // 更新横向导航状态
  const updateNavigation = useCallback(() => {
    if (!scrollContainerRef.current) return;
    
    const container = scrollContainerRef.current;
    const scrollLeft = container.scrollLeft;
    const scrollWidth = container.scrollWidth;
    const clientWidth = container.clientWidth;
    
    if (scrollWidth <= clientWidth) {
      // 不需要滚动
      setScrollProgress(100);
      setCanScrollLeft(false);
      setCanScrollRight(false);
      setCurrentPage(1);
      setTotalPages(1);
      return;
    }
    
    // 计算滚动进度
    const maxScrollLeft = scrollWidth - clientWidth;
    const progress = Math.min(100, Math.max(0, (scrollLeft / maxScrollLeft) * 100));
    setScrollProgress(progress);
    
    // 更新左右按钮状态（增加一些容错）
    const canLeft = scrollLeft > 1; // 给一点容错空间
    const canRight = scrollLeft < (maxScrollLeft - 1); // 给一点容错空间
    
    setCanScrollLeft(canLeft);
    setCanScrollRight(canRight);
    
    // 简化页数计算 - 基于滚动比例
    const pageSize = 0.8; // 每次滚动80%，所以页面有20%重叠
    const totalScrollPages = Math.ceil(1 / pageSize); // 简单估算
    const currentScrollPage = Math.floor(progress / (100 / totalScrollPages)) + 1;
    
    // 至少显示2页，最多显示5页
    const calculatedTotalPages = Math.max(2, Math.min(5, Math.ceil(scrollWidth / clientWidth)));
    const calculatedCurrentPage = Math.max(1, Math.min(calculatedTotalPages, 
      Math.floor((progress / 100) * calculatedTotalPages) + 1));
    
    setCurrentPage(calculatedCurrentPage);
    setTotalPages(calculatedTotalPages);
  }, []);

  // 监听滚动事件
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;
    
    let timeoutId = null;
    
    const handleScroll = () => {
      // 清除之前的定时器
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      
      // 设置防抖，避免过度频繁更新
      timeoutId = setTimeout(() => {
        updateNavigation();
      }, 50); // 50ms 防抖
    };
    
    container.addEventListener('scroll', handleScroll);
    updateNavigation(); // 初始更新
    
    return () => {
      container.removeEventListener('scroll', handleScroll);
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [updateNavigation]);

  // 组件挂载后立即更新导航状态
  useEffect(() => {
    // 立即更新一次
    updateNavigation();
    
    // 延迟再更新一次，确保DOM已完全渲染
    const timer = setTimeout(() => {
      updateNavigation();
    }, 200);
    
    return () => clearTimeout(timer);
  }, [dates, tourGroups, updateNavigation]);

  // 窗口大小变化时重新计算
  useEffect(() => {
    const handleResize = () => {
      setTimeout(() => {
        updateNavigation();
      }, 100);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [updateNavigation]);

  // 左右导航按钮功能
  const scrollLeft = () => {
    if (!scrollContainerRef.current || !canScrollLeft) {
      return;
    }
    
    const container = scrollContainerRef.current;
    const scrollStep = container.clientWidth * 0.8; // 每次滚动80%的可视区域
    const newScrollLeft = Math.max(0, container.scrollLeft - scrollStep);
    
    container.scrollTo({
      left: newScrollLeft,
      behavior: 'smooth'
    });
  };

  const scrollRight = () => {
    if (!scrollContainerRef.current || !canScrollRight) {
      return;
    }
    
    const container = scrollContainerRef.current;
    const scrollStep = container.clientWidth * 0.8; // 每次滚动80%的可视区域
    const maxScrollLeft = container.scrollWidth - container.clientWidth;
    const newScrollLeft = Math.min(maxScrollLeft, container.scrollLeft + scrollStep);
    
    container.scrollTo({
      left: newScrollLeft,
      behavior: 'smooth'
    });
  };

  // 快捷跳转到指定页
  const jumpToPage = (page) => {
    if (!scrollContainerRef.current || totalPages <= 1) return;
    
    const container = scrollContainerRef.current;
    const maxScrollLeft = container.scrollWidth - container.clientWidth;
    
    // 确保页数在有效范围内
    const validPage = Math.max(1, Math.min(totalPages, page));
    const targetProgress = (validPage - 1) / (totalPages - 1);
    const targetScrollLeft = Math.round(targetProgress * maxScrollLeft);
    

    
    container.scrollTo({
      left: targetScrollLeft,
      behavior: 'smooth'
    });
  };

  // 移除导航按钮相关函数 - 改用普通滚动条
  // const scrollLeft = () => {
  //   if (visibleColumnStart > 0) {
  //     setVisibleColumnStart(prev => Math.max(0, prev - 1));
  //   }
  // };

  // const scrollRight = () => {
  //   const maxVisibleStart = dates.length - visibleColumnCount;
  //   if (visibleColumnStart < maxVisibleStart) {
  //     setVisibleColumnStart(prev => Math.min(maxVisibleStart, prev + 1));
  //   }
  // };

  // 移除不再使用的renderScheduleTable函数 - 现在使用新的滚动列表布局
  // const renderScheduleTable = () => {
  //   return (
  //     <div className="schedule-table">
  //       {/* 日期头部 */}
  //       <div className="date-header" style={{ display: 'flex' }}>
  //         {dates.slice(visibleColumnStart, visibleColumnStart + visibleColumnCount).map(date => (
  //           renderDateColumn(dayjs(date.date))
  //         ))}
  //       </div>
  //       
  //       {/* 团队行程 */}
  //       <div className="tour-groups">
  //         {tourGroups.map(group => (
  //           <div key={group.id} className="tour-group-row">
  //             {/* 团队信息 */}
  //             <div className="group-info" style={{ padding: '10px', borderBottom: '1px solid #e8e8e8' }}>
  //               <div><strong>{group.customer?.name || group.name || '未命名团队'}</strong></div>
  //               <div><TeamOutlined /> {group.customer?.pax || group.pax || '0'} 人</div>
  //             </div>
  //             
  //             {/* 团队行程单元格 */}
  //             <div className="schedule-cells" style={{ display: 'flex' }}>
  //               {dates.slice(visibleColumnStart, visibleColumnStart + visibleColumnCount).map(date => {
  //                 const schedule = group.locationsByDate[date.date];
  //                 return (
  //                   <div key={`${group.id}-${date.date}`} className="schedule-cell" style={{ 
  //                     width: '80px', 
  //                     padding: '5px',
  //                     borderRight: '1px solid #e8e8e8',
  //                     borderBottom: '1px solid #e8e8e8'
  //                   }}>
  //                     {schedule && (
  //                       <Tooltip title={schedule.location?.name || schedule.name || ''}>
  //                         <div style={{ 
  //                           backgroundColor: schedule.location?.color || schedule.color || '#1890ff',
  //                           color: 'white',
  //                           padding: '3px 6px',
  //                           borderRadius: '3px',
  //                           fontSize: '12px',
  //                           marginBottom: '3px'
  //                         }}>
  //                           {extractLocationName(schedule.location?.name || schedule.name || '')}
  //                           <div style={{ marginTop: '2px' }}>
  //                             <TeamOutlined /> {group.customer?.pax || group.pax || '0'}
  //                           </div>
  //                         </div>
  //                       </Tooltip>
  //                     )}
  //                   </div>
  //                 );
  //               })}
  //             </div>
  //           </div>
  //         ))}
  //       </div>
  //     </div>
  //   );
  // };

  // 渲染日期列
  const renderDateColumn = (dateObj) => {
    // 当前日期字符串
    const dateStr = dateObj.format('YYYY-MM-DD');
    // 当前星期几
    const dayOfWeek = dateObj.format('ddd');
    // 当前日期
    const dayOfMonth = dateObj.format('MM/DD');
    
    // 判断是否为周末
    const isWeekend = dayOfWeek === 'Sat' || dayOfWeek === 'Sun';
    
    // 根据是否为周末设置不同的样式
    const dateColumnStyle = {
      width: '80px',
      padding: '10px 0',
      textAlign: 'center',
      backgroundColor: isWeekend ? '#f0f0f0' : 'white',
      borderRight: '1px solid #e8e8e8',
      cursor: 'pointer' // 添加鼠标指针样式，表示可点击
    };
    
    // 处理日期点击，显示当天的行程统计
    const handleDateClick = async () => {
      console.log(`🎯 日期点击事件触发! 日期: ${dateStr}, 星期: ${dayOfWeek}`);
      
      // 统计当天各个地点的人数
      const stats = {};
      
      // 遍历所有团队，查找当天安排
      tourGroups.forEach(group => {
        const todaySchedule = group.locationsByDate[dateStr];
        
        if (todaySchedule && (todaySchedule.location?.name || todaySchedule.name)) {
          const locationName = extractLocationName(todaySchedule.location?.name || todaySchedule.name || '');
          
          if (!stats[locationName]) {
            stats[locationName] = {
              count: 0,
              totalPax: 0,
              tourGroupIds: [] // 保存该地点的团队ID
            };
          }
          
          stats[locationName].count += 1;
          stats[locationName].totalPax += (parseInt(group.customer?.pax) || parseInt(group.pax) || 0);
          stats[locationName].tourGroupIds.push(group.id); // 添加团队ID
        }
      });
      
      // 转换为数组格式，并检查分配状态
      const statsArray = await Promise.all(Object.keys(stats).map(async (location) => {
        console.log(`📍 开始检查地点: ${location} 的分配状态`);
        
        try {
          // 调用API检查该日期该地点的分配状态
          console.log(`🔍 API请求参数:`, {
            url: '/admin/guide-assignment/status',
            params: {
              date: dateStr,
              location: location
            }
          });
          
          const assignmentResponse = await checkAssignmentStatus(dateStr, location);
          
          console.log(`✅ ${location} API响应:`, assignmentResponse);
          
          let isAssigned = false;
          let guideInfo = '';
          let vehicleInfo = '';
          
          if (assignmentResponse && assignmentResponse.code === 1 && assignmentResponse.data) {
            const assignmentData = assignmentResponse.data;
            isAssigned = assignmentData.isAssigned || false;
            guideInfo = assignmentData.guideName || '';
            vehicleInfo = assignmentData.vehicleInfo || '';
            
            console.log(`📊 ${location} 解析结果:`, {
              isAssigned,
              guideInfo,
              vehicleInfo
            });
          } else {
            console.warn(`⚠️ ${location} API响应格式异常:`, assignmentResponse);
          }
          
          return {
            location,
            count: stats[location].count,
            totalPax: stats[location].totalPax,
            tourGroupIds: stats[location].tourGroupIds,
            isAssigned,
            guideInfo,
            vehicleInfo
          };
        } catch (error) {
          console.error(`❌ 检查分配状态失败 - ${location}:`, error);
          console.error(`错误详情:`, error.response?.data || error.message);
          console.error(`HTTP状态码:`, error.response?.status);
          console.error(`完整错误对象:`, error);
          
          // 显示用户友好的错误提示
          if (error.response?.status === 401) {
            console.error(`🔐 认证失败！请检查是否已登录或token是否有效`);
          } else if (error.response?.status === 404) {
            console.error(`🔍 API接口不存在: ${error.config?.url}`);
          } else if (error.response?.status >= 500) {
            console.error(`🔥 服务器内部错误`);
          }
          
          // 如果API调用失败，默认为未分配状态
          return {
            location,
            count: stats[location].count,
            totalPax: stats[location].totalPax,
            tourGroupIds: stats[location].tourGroupIds,
            isAssigned: false,
            guideInfo: '',
            vehicleInfo: '',
            error: error.message,
            httpStatus: error.response?.status
          };
        }
      }));
      
      setDateLocationStats(statsArray);
      setSelectedDate(dateObj);
      setDateModalVisible(true);
    };
    
    return (
      <div key={dateStr} style={dateColumnStyle} onClick={handleDateClick}>
        <div style={{ fontWeight: 'bold', color: '#1890ff' }}>{dayOfWeek}</div>
        <div>{dayOfMonth}</div>
      </div>
    );
  };

  // 生成订单组颜色的函数
  const generateOrderGroupColors = useCallback((tourGroups) => {
    const colors = [
      '#1890ff', '#52c41a', '#faad14', '#f5222d', '#722ed1', 
      '#13c2c2', '#eb2f96', '#fa541c', '#a0d911', '#2f54eb',
      '#fa8c16', '#eb2f96', '#52c41a', '#1890ff', '#722ed1'
    ];
    
    const colorMap = {};
    const usedOrderIds = new Set();
    
    tourGroups.forEach((group, index) => {
      // 使用订单ID作为分组依据，如果没有则使用group.id
      const orderId = group.orderId || group.customer?.orderId || group.id;
      
      if (!usedOrderIds.has(orderId)) {
        colorMap[orderId] = colors[usedOrderIds.size % colors.length];
        usedOrderIds.add(orderId);
      }
    });
    
    return colorMap;
  }, []);

  // 检查订单酒店预订状态的函数
  const checkHotelBookingStatus = useCallback(async (tourGroups) => {
    console.log('🏨 [调试] 开始检查酒店预订状态，订单组数量:', tourGroups.length);
    const statusMap = {};
    
    try {
      // 为每个订单检查酒店预订状态
      const promises = tourGroups.map(async (group, index) => {
        try {
          const orderId = group.orderId || group.customer?.orderId || group.id;
          console.log(`🏨 [调试] 检查订单 ${index + 1}/${tourGroups.length}: `, {
            orderId,
            groupId: group.id,
            customerOrderId: group.customer?.orderId
          });
          
          if (statusMap[orderId] !== undefined) {
            console.log(`🏨 [调试] 订单 ${orderId} 已检查过，跳过`);
            return; // 已经检查过这个订单了
          }
          
          // 调用API检查酒店预订状态
          console.log(`🏨 [调试] 正在调用API检查订单 ${orderId} 的酒店预订状态...`);
          const response = await getHotelBookingByScheduleOrderId(orderId);
          console.log(`🏨 [调试] 订单 ${orderId} API响应:`, response);
          
          if (response && response.code === 1 && response.data) {
            // 有酒店预订
            const hotelStatus = {
              hasHotelBooking: true,
              hotelBookingStatus: response.data.bookingStatus,
              hotelInfo: response.data,
              isConfirmed: response.data.bookingStatus === 'confirmed'
            };
            statusMap[orderId] = hotelStatus;
            console.log(`✅ [调试] 订单 ${orderId} 有酒店预订:`, hotelStatus);
          } else {
            statusMap[orderId] = {
              hasHotelBooking: false,
              hotelBookingStatus: null,
              hotelInfo: null,
              isConfirmed: false
            };
            console.log(`❌ [调试] 订单 ${orderId} 无酒店预订`);
          }
        } catch (error) {
          console.error(`❌ [调试] 检查订单 ${group.id} 酒店预订状态失败:`, error);
          const orderId = group.orderId || group.customer?.orderId || group.id;
          statusMap[orderId] = {
            hasHotelBooking: false,
            hotelBookingStatus: null,
            hotelInfo: null,
            isConfirmed: false
          };
        }
      });
      
      await Promise.all(promises);
      console.log('🏨 [调试] 酒店预订状态检查完成，结果:', statusMap);
    } catch (error) {
      console.error('❌ [调试] 批量检查酒店预订状态失败:', error);
    }
    
    return statusMap;
  }, []);

  // 当数据更新时重新生成颜色和检查酒店状态
  useEffect(() => {
    if (tourGroups && tourGroups.length > 0) {
      const colors = generateOrderGroupColors(tourGroups);
      setOrderGroupColors(colors);
      
      // 异步检查酒店预订状态
      checkHotelBookingStatus(tourGroups).then(status => {
        setHotelBookingStatus(status);
      });
    }
  }, [tourGroups, generateOrderGroupColors, checkHotelBookingStatus]);

  // 获取订单组边框样式的函数
  const getOrderGroupBorderStyle = (group) => {
    const orderId = group.orderId || group.customer?.orderId || group.id;
    const color = orderGroupColors[orderId] || '#d9d9d9';
    const hotelStatus = hotelBookingStatus[orderId];
    
    // 如果有确认的酒店预订，使用更粗的边框和阴影
    if (hotelStatus?.isConfirmed) {
      return {
        border: `3px solid ${color}`,
        boxShadow: `0 0 8px ${color}40, inset 0 0 8px ${color}20`,
        borderRadius: '8px'
      };
    } else if (hotelStatus?.hasHotelBooking) {
      // 有酒店预订但未确认，使用虚线边框
      return {
        border: `2px dashed ${color}`,
        boxShadow: `0 0 4px ${color}30`,
        borderRadius: '6px'
      };
    } else {
      // 普通边框
      return {
        border: `2px solid ${color}`,
        borderRadius: '6px'
      };
    }
  };

  // 获取酒店预订图标
  const getHotelBookingIcon = (group) => {
    const orderId = group.orderId || group.customer?.orderId || group.id;
    const hotelStatus = hotelBookingStatus[orderId];
    
    if (hotelStatus?.isConfirmed) {
      return (
        <div style={{
          position: 'absolute',
          top: '-8px',
          right: '-8px',
          width: '20px',
          height: '20px',
          backgroundColor: '#52c41a',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontSize: '12px',
          fontWeight: 'bold',
          zIndex: 10,
          boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
        }}>
          <HomeOutlined />
        </div>
      );
    } else if (hotelStatus?.hasHotelBooking) {
      return (
        <div style={{
          position: 'absolute',
          top: '-6px',
          right: '-6px',
          width: '16px',
          height: '16px',
          backgroundColor: '#faad14',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontSize: '10px',
          zIndex: 10,
          boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
        }}>
          ?
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div className="loading-container">
        <Spin size="large" />
      </div>
    );
  }

  if (!tourGroups || tourGroups.length === 0) {
    return <Empty description="暂无数据" />;
  }

  // 为每个分段创建日期索引映射，确保对齐
  const createSegmentMap = (segment, allDates) => {
    const dateIndexMap = {};
    const startIdx = allDates.findIndex(d => d.date === segment.startDate);
    const endIdx = allDates.findIndex(d => d.date === segment.endDate);
    
    if (startIdx !== -1 && endIdx !== -1) {
      for (let i = startIdx; i <= endIdx; i++) {
        dateIndexMap[allDates[i].date] = i - startIdx;
      }
    }
    
    return { dateIndexMap, startIdx, endIdx };
  };
  

  // 按列号对订单进行分组
  const groupsByColumn = {};
  tourGroups.forEach(group => {
    const colIndex = group.columnIndex || 0;
    if (!groupsByColumn[colIndex]) {
      groupsByColumn[colIndex] = [];
    }
    groupsByColumn[colIndex].push(group);
  });

  // 获取所有列号并排序
  const columnIndexes = Object.keys(groupsByColumn).map(Number).sort((a, b) => a - b);
  const totalColumns = columnIndexes.length;

  // 创建详情内容渲染函数
  const renderDetailContent = (locationData) => {
    if (!locationData) {
      return <Empty description="暂无详细信息" />;
    }
    
    // 确保我们正确提取订单信息
    const location = locationData.location || {};
    const order = locationData.order || locationData.location?.order || {};
    
    // 确保即使没有完整订单信息也能显示部分内容
    const bookingId = order.bookingId || order.id || locationData.bookingId || null;
    const orderNumber = order.orderNumber || locationData.orderNumber || '未知订单号';
    
          // 🎯 优先使用排团表API数据，确保字段映射正确
      // 🔧 修复：数据在location属性下，需要正确的访问路径
      const locationInfo = locationData.location || {};
      
      const orderInfo = {
        // 客户信息 - 优先使用排团表数据（正确路径：locationData.location）
        name: locationInfo.contactPerson || order.contactPerson || locationData.name || '未知客户',
        phone: locationInfo.contactPhone || order.contactPhone || '未提供',
        // 人数信息 - 直接从排团表获取（正确路径）
        adultCount: locationInfo.adultCount || order.adultCount || 0,
        childCount: locationInfo.childCount || order.childCount || 0,
        pax: (locationInfo.adultCount || order.adultCount || 0) + (locationInfo.childCount || order.childCount || 0),
        // 基本订单信息
        bookingId: bookingId,
        orderNumber: orderNumber,
        tourType: locationInfo.tourType || order.tourType || '未知类型',
        tourName: locationInfo.tourName || order.tourName || locationInfo.name || '未知产品',
        specialRequests: locationInfo.specialRequests || order.specialRequests || '无特殊要求',
        // 🚗 接送地点 - 多路径查找排团表数据（修复的关键：完整路径搜索）
        pickupLocation: locationData.pickupLocation || locationInfo.pickupLocation || order.pickupLocation || '',
        dropoffLocation: locationData.dropoffLocation || locationInfo.dropoffLocation || order.dropoffLocation || '',
        dayNumber: locationInfo.dayNumber || order.dayNumber || location.dayNumber || 0,
        // ✈️ 航班信息 - 从排团表API获取（正确路径）
        flightNumber: locationInfo.flightNumber || order.flightNumber || '',
        returnFlightNumber: locationInfo.returnFlightNumber || order.returnFlightNumber || '',
        arrivalLandingTime: locationInfo.arrivalLandingTime || order.arrivalLandingTime || null,
        arrivalDepartureTime: locationInfo.arrivalDepartureTime || order.arrivalDepartureTime || null,
        departureDepartureTime: locationInfo.departureDepartureTime || order.departureDepartureTime || null,
        departureLandingTime: locationInfo.departureLandingTime || order.departureLandingTime || null,
        // 🏨 酒店信息 - 支持驼峰和下划线两种命名方式
        hotelRoomCount: locationInfo.hotelRoomCount || locationInfo.hotel_room_count || order.hotelRoomCount || order.hotel_room_count || locationData.hotelRoomCount || locationData.hotel_room_count || 0,
        roomDetails: locationInfo.roomDetails || locationInfo.room_details || order.roomDetails || order.room_details || locationData.roomDetails || locationData.room_details || '标准房型',
        hotelLevel: locationInfo.hotelLevel || locationInfo.hotel_level || order.hotelLevel || order.hotel_level || locationData.hotelLevel || locationData.hotel_level || '',
        roomType: locationInfo.roomType || locationInfo.room_type || order.roomType || order.room_type || locationData.roomType || locationData.room_type || '',
        hotelCheckInDate: locationInfo.hotelCheckInDate || locationInfo.hotel_check_in_date || order.hotelCheckInDate || order.hotel_check_in_date || locationData.hotelCheckInDate || locationData.hotel_check_in_date || null,
        hotelCheckOutDate: locationInfo.hotelCheckOutDate || locationInfo.hotel_check_out_date || order.hotelCheckOutDate || order.hotel_check_out_date || locationData.hotelCheckOutDate || locationData.hotel_check_out_date || null,
        // 代理商和操作员信息
        agentName: locationInfo.agentName || order.agentName || '未知代理商',
        operatorName: locationInfo.operatorName || order.operatorName || '未分配',
        passengerContact: locationInfo.passengerContact || order.passengerContact || locationInfo.contactPhone || '未提供',
        // 兼容性字段（用于显示接送点的老逻辑）
        hotel: locationInfo.pickupLocation || order.pickupLocation || '未指定'
      };
      
      // 🏨 简化调试：检查后端是否返回酒店字段
      console.log('🏨 [前端调试] 订单' + orderInfo.orderNumber + ' - 最终提取的酒店数据:', {
        hotelLevel: orderInfo.hotelLevel,
        roomType: orderInfo.roomType,
        hotelRoomCount: orderInfo.hotelRoomCount,
        hotelCheckInDate: orderInfo.hotelCheckInDate,
        hotelCheckOutDate: orderInfo.hotelCheckOutDate,
        roomDetails: orderInfo.roomDetails
      });
    
    // 提取当前订单ID以启用初始化功能
    const currentBookingId = bookingId ? parseInt(bookingId) : null;
    
    return (
      <div className="order-detail-content">
        <div className="detail-header">
          <h3>{extractLocationName(orderInfo.tourName)}</h3>
          <div className="tag-container">
            <Tag color={orderInfo.tourType === 'day_tour' ? 'blue' : 'orange'}>
              {orderInfo.tourType === 'day_tour' ? '一日游' : '跟团游'}
            </Tag>
            <Tag color="green">{orderInfo.pax}人</Tag>
          </div>
        </div>
        
        <div className="detail-info">
          {/* 基础信息区域 - 紧凑的两列布局 */}
          <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px 12px', marginBottom: '10px', fontSize: '13px'}}>
            <div style={{display: 'flex', alignItems: 'center'}}>
              <UserOutlined style={{color: '#1890ff', marginRight: '4px', fontSize: '12px'}} />
              <span style={{fontWeight: '500'}}>{orderInfo.name}</span>
            </div>
            <div style={{display: 'flex', alignItems: 'center'}}>
              <PhoneOutlined style={{color: '#52c41a', marginRight: '4px', fontSize: '12px'}} />
              <span>{orderInfo.phone}</span>
            </div>
            <div style={{display: 'flex', alignItems: 'center'}}>
              <TeamOutlined style={{color: '#fa8c16', marginRight: '4px', fontSize: '12px'}} />
              <span>{orderInfo.pax}人 ({orderInfo.adultCount}大{orderInfo.childCount}小)</span>
            </div>
            <div style={{display: 'flex', alignItems: 'center'}}>
              <HomeOutlined style={{color: '#722ed1', marginRight: '4px', fontSize: '12px'}} />
              <span style={{fontSize: '12px'}}>{orderInfo.pickupLocation || orderInfo.hotel || '未指定'}</span>
            </div>
          </div>

          {/* 订单号 - 单独一行 */}
          <div style={{marginBottom: '10px', padding: '4px 6px', backgroundColor: '#f8f9fa', borderRadius: '3px', fontSize: '11px', color: '#666'}}>
            <IdcardOutlined style={{marginRight: '4px'}} />
            {orderInfo.orderNumber}
          </div>

          {/* 航班信息 - 紧凑横向布局 */}
          {(orderInfo.flightNumber || orderInfo.returnFlightNumber) && (
            <div style={{marginBottom: '10px', padding: '6px', backgroundColor: '#e6f7ff', borderRadius: '4px', fontSize: '12px'}}>
              <div style={{display: 'flex', gap: '12px', flexWrap: 'wrap'}}>
                {orderInfo.flightNumber && orderInfo.flightNumber !== '暂无' && (
                  <span style={{color: '#1890ff'}}>
                    ✈️ {orderInfo.flightNumber}
                  </span>
                )}
                {orderInfo.returnFlightNumber && orderInfo.returnFlightNumber !== '暂无' && (
                  <span style={{color: '#fa8c16'}}>
                    🛬 {orderInfo.returnFlightNumber}
                  </span>
                )}
              </div>
            </div>
          )}
          
          {/* 🏨 酒店信息 - 紧凑卡片式布局 */}
          {(orderInfo.tourType === 'group_tour' || orderInfo.hotelRoomCount > 0 || (orderInfo.hotelLevel && orderInfo.hotelLevel.trim() !== '') || (orderInfo.roomType && orderInfo.roomType.trim() !== '')) && (
            <div style={{
              marginBottom: '10px', 
              padding: '8px', 
              backgroundColor: '#fff7e6', 
              borderRadius: '4px', 
              border: '1px solid #ffd591'
            }}>
              {/* 酒店标题 */}
              <div style={{
                display: 'flex', 
                alignItems: 'center', 
                marginBottom: '6px', 
                fontSize: '12px', 
                fontWeight: '600', 
                color: '#d46b08'
              }}>
                <span style={{marginRight: '3px'}}>🏨</span>
                <span>酒店信息</span>
              </div>
              
              {/* 酒店详情 - 紧凑的网格布局 */}
              <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3px 8px', fontSize: '11px'}}>
                <div>
                  <span style={{color: '#8c8c8c'}}>⭐ </span>
                  <span style={{color: orderInfo.hotelLevel && orderInfo.hotelLevel.trim() !== '' ? '#262626' : '#bfbfbf'}}>
                    {orderInfo.hotelLevel && orderInfo.hotelLevel.trim() !== '' ? orderInfo.hotelLevel : '待确定'}
                  </span>
                </div>
                <div>
                  <span style={{color: '#8c8c8c'}}>🛏️ </span>
                  <span style={{color: orderInfo.roomType && orderInfo.roomType.trim() !== '' ? '#262626' : '#bfbfbf'}}>
                    {orderInfo.roomType && orderInfo.roomType.trim() !== '' ? orderInfo.roomType : '待确定'}
                  </span>
                </div>
                <div>
                  <span style={{color: '#8c8c8c'}}>🏠 </span>
                  <span style={{color: orderInfo.hotelRoomCount > 0 ? '#262626' : '#bfbfbf'}}>
                    {orderInfo.hotelRoomCount > 0 ? `${orderInfo.hotelRoomCount}间` : '待确定'}
                  </span>
                </div>
                {/* 日期信息 */}
                {(orderInfo.hotelCheckInDate || orderInfo.hotelCheckOutDate) && (
                  <div style={{fontSize: '10px'}}>
                    <span style={{color: '#8c8c8c'}}>📅 </span>
                    <span style={{color: '#389e0d'}}>
                      {orderInfo.hotelCheckInDate && dayjs(orderInfo.hotelCheckInDate).format('MM/DD')}
                      {orderInfo.hotelCheckInDate && orderInfo.hotelCheckOutDate && '-'}
                      {orderInfo.hotelCheckOutDate && dayjs(orderInfo.hotelCheckOutDate).format('MM/DD')}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}
          
          {/* 接送地点信息 - 紧凑布局 */}
          <div style={{marginBottom: '10px', padding: '6px', backgroundColor: '#f0f8ff', borderRadius: '4px', fontSize: '11px'}}>
            <div style={{fontWeight: '600', color: '#0c5460', marginBottom: '4px', fontSize: '12px'}}>
              📍 第{orderInfo.dayNumber}天接送
            </div>
            <div style={{display: 'grid', gridTemplateColumns: '1fr', gap: '2px'}}>
              <div>
                <span style={{color: '#28a745'}}>🚌 接:</span> 
                <span>{orderInfo.pickupLocation || '未指定'}</span>
              </div>
              <div>
                <span style={{color: '#dc3545'}}>🏁 送:</span> 
                <span>{orderInfo.dropoffLocation || '未指定'}</span>
              </div>
            </div>
          </div>

          {/* 特殊要求/行程描述 - 紧凑显示 */}
          {(orderInfo.specialRequests && orderInfo.specialRequests !== '无特殊要求') && (
            <div style={{marginBottom: '10px', padding: '6px', backgroundColor: '#fff2e8', borderRadius: '4px', fontSize: '11px'}}>
              <div style={{fontWeight: '600', color: '#fa8c16', marginBottom: '2px'}}>💡 特殊要求</div>
              <div style={{color: '#666'}}>{orderInfo.specialRequests}</div>
            </div>
          )}

          {/* 代理商信息 - 只在有数据时显示 */}
          {orderInfo.agentName && orderInfo.agentName !== '未知代理商' && (
            <div style={{marginBottom: '10px', fontSize: '11px', color: '#52c41a'}}>
              🏢 {orderInfo.agentName}
            </div>
          )}

          {/* 酒店预订状态显示 */}
          {(() => {
            const orderId = orderInfo.bookingId;
            const hotelStatus = hotelBookingStatus[orderId];
            
            if (hotelStatus?.hasHotelBooking) {
              return (
                <div style={{
                  marginBottom: '10px', 
                  padding: '8px', 
                  backgroundColor: hotelStatus.isConfirmed ? '#f6ffed' : '#fff7e6',
                  border: `1px solid ${hotelStatus.isConfirmed ? '#b7eb8f' : '#ffd591'}`,
                  borderRadius: '4px', 
                  fontSize: '12px'
                }}>
                  <div style={{
                    display: 'flex', 
                    alignItems: 'center', 
                    marginBottom: '4px',
                    color: hotelStatus.isConfirmed ? '#52c41a' : '#fa8c16',
                    fontWeight: '600'
                  }}>
                    <HomeOutlined style={{marginRight: '4px'}} />
                    {hotelStatus.isConfirmed ? '✅ 酒店已确认' : '⏳ 酒店预订中'}
                  </div>
                  {hotelStatus.hotelInfo && (
                    <div style={{fontSize: '11px', color: '#666'}}>
                      {hotelStatus.hotelInfo.hotelName && (
                        <div>🏨 {hotelStatus.hotelInfo.hotelName}</div>
                      )}
                      {hotelStatus.hotelInfo.roomType && (
                        <div>🛏️ {hotelStatus.hotelInfo.roomType}</div>
                      )}
                      {hotelStatus.hotelInfo.checkInDate && hotelStatus.hotelInfo.checkOutDate && (
                        <div>📅 {dayjs(hotelStatus.hotelInfo.checkInDate).format('MM/DD')} - {dayjs(hotelStatus.hotelInfo.checkOutDate).format('MM/DD')}</div>
                      )}
                    </div>
                  )}
                </div>
              );
            }
            
            return null;
          })()}

          {/* 操作按钮区域 */}
          <div style={{marginTop: '10px', padding: '8px', backgroundColor: '#f8f9fa', borderRadius: '4px', borderTop: '1px solid #e9ecef'}}>
            <div style={{display: 'flex', gap: '6px', justifyContent: 'center'}}>
              <Button 
                type="primary" 
                size="small" 
                icon={<EditOutlined />}
                onClick={() => handleEditScheduleInfo(locationData, orderInfo)}
                style={{fontSize: '11px', height: '28px'}}
              >
                修改信息
              </Button>
              <Button 
                type="default" 
                size="small" 
                icon={<HomeOutlined />}
                onClick={() => handleBookHotel(locationData, orderInfo)}
                style={{fontSize: '11px', height: '28px', color: '#fa8c16', borderColor: '#fa8c16'}}
              >
                {(() => {
                  const orderId = orderInfo.bookingId;
                  const hotelStatus = hotelBookingStatus[orderId];
                  
                  if (hotelStatus?.isConfirmed) {
                    return '管理酒店';
                  } else if (hotelStatus?.hasHotelBooking) {
                    return '修改酒店';
                  } else {
                    return orderInfo.hotelLevel ? '分配酒店' : '预定酒店';
                  }
                })()}
              </Button>
            </div>
          </div>
        </div>

      </div>
    );
  };

  // 添加辅助函数用于提取数据
  const getPersonCount = (locationData) => {
    const order = locationData.location?.order || locationData.order || {};
    return (order.adultCount || 0) + (order.childCount || 0);
  };

  const getCustomerInfo = (locationData) => {
    const order = locationData.location?.order || locationData.order || {};
    return order.agentName || order.contactPerson || '未知';
  };

  // 处理修改排团表信息
  const handleEditScheduleInfo = (locationData, orderInfo) => {
    console.log('修改排团表信息:', { locationData, orderInfo });
    
    // 设置当前编辑的数据
    setCurrentEditData({ locationData, orderInfo });
    
    // 填充表单数据
    editForm.setFieldsValue({
      contactPerson: orderInfo.name,
      contactPhone: orderInfo.phone,
      flightNumber: orderInfo.flightNumber,
      returnFlightNumber: orderInfo.returnFlightNumber,
      pickupLocation: orderInfo.pickupLocation,
      dropoffLocation: orderInfo.dropoffLocation
    });
    
    // 显示编辑弹窗
    setEditModalVisible(true);
  };

  // 处理预定酒店
  const handleBookHotel = (locationData, orderInfo) => {
    console.log('🏨 酒店预订功能 - 详细信息:', { locationData, orderInfo });
    
    // 直接打开酒店预订弹窗
    setHotelBookingModalVisible(true);
    setCurrentHotelBookingData({ locationData, orderInfo });
  };

  // 保存编辑的排团表信息
  const handleSaveEditInfo = async () => {
    try {
      const values = await editForm.validateFields();
      const { locationData, orderInfo } = currentEditData;
      
      console.log('保存编辑信息:', values);
      console.log('当前编辑数据:', currentEditData);
      
      // 提取当前数据
      const location = locationData.location || {};
      const order = locationData.order || locationData.location?.order || {};
      const bookingId = order.bookingId || order.id || locationData.bookingId;
      const scheduleId = location.scheduleId || locationData.scheduleId;
      
      if (!bookingId) {
        throw new Error('无法获取订单ID');
      }
      
      // 🔄 分步处理：乘客信息 vs 接送地点信息
      
      // 1️⃣ 更新乘客信息到订单表（姓名、电话、航班号）
      const passengerInfoChanged = 
        values.contactPerson !== orderInfo.name ||
        values.contactPhone !== orderInfo.phone ||
        values.flightNumber !== orderInfo.flightNumber ||
        values.returnFlightNumber !== orderInfo.returnFlightNumber;
      
      if (passengerInfoChanged) {
        console.log('🔄 更新乘客信息到订单表...');
        const orderUpdateData = {
          contactPerson: values.contactPerson,
          contactPhone: values.contactPhone,
          flightNumber: values.flightNumber,
          returnFlightNumber: values.returnFlightNumber
        };
        
        await updateOrder(bookingId, orderUpdateData);
        console.log('✅ 订单表更新成功');
      }
      
      // 2️⃣ 更新排团表信息
      const locationInfoChanged = 
        values.pickupLocation !== orderInfo.pickupLocation ||
        values.dropoffLocation !== orderInfo.dropoffLocation;
      
      if (passengerInfoChanged) {
        // 🔄 乘客信息改变：需要更新该订单所有天数的排团表记录
        console.log('🔄 更新该订单所有天数的乘客信息...');
        
        // 获取该订单的所有排团表记录
        const allSchedulesResponse = await getSchedulesByBookingId(bookingId);
        if (allSchedulesResponse?.code === 1 && allSchedulesResponse?.data?.length > 0) {
          const allSchedules = allSchedulesResponse.data;
          
          // 更新所有天数的乘客信息
          const updatedSchedules = allSchedules.map(schedule => ({
            ...schedule,
            contactPerson: values.contactPerson,
            contactPhone: values.contactPhone,
            flightNumber: values.flightNumber,
            returnFlightNumber: values.returnFlightNumber,
            // 如果是当天的记录，同时更新接送地点
            ...(schedule.id === scheduleId && locationInfoChanged ? {
              pickupLocation: values.pickupLocation,
              dropoffLocation: values.dropoffLocation
            } : {})
          }));
          
          // 批量更新排团表
          await saveBatchSchedules({
            bookingId: bookingId,
            schedules: updatedSchedules
          });
          console.log('✅ 批量更新排团表成功（所有天数的乘客信息已同步）');
        }
      } else if (locationInfoChanged) {
        // 🔄 仅接送地点改变：只更新当天的排团表记录
        console.log('🔄 更新当天的接送地点信息...');
        
        // 首先获取当前排团表记录的完整信息
        const allSchedulesResponse = await getSchedulesByBookingId(bookingId);
        console.log('🔍 获取到的排团表记录:', allSchedulesResponse?.data);
        console.log('🎯 查找的scheduleId:', scheduleId);
        console.log('🎯 查找的bookingId:', bookingId);
        
        if (allSchedulesResponse?.code === 1 && allSchedulesResponse?.data?.length > 0) {
          // 尝试多种方式查找匹配的记录
          let currentSchedule = null;
          
          // 方法1: 通过scheduleId查找
          if (scheduleId) {
            currentSchedule = allSchedulesResponse.data.find(schedule => schedule.id === scheduleId);
            console.log('🔍 通过scheduleId查找结果:', currentSchedule);
          }
          
          // 方法2: 如果scheduleId查找失败，根据当前编辑的地点信息查找
          if (!currentSchedule && locationData) {
            const currentLocation = locationData.location || {};
            const currentOrder = locationData.order || currentLocation.order || {};
            
            // 尝试通过天数、日期等信息匹配
            if (currentOrder.dayNumber) {
              currentSchedule = allSchedulesResponse.data.find(schedule => 
                schedule.dayNumber === currentOrder.dayNumber
              );
              console.log('🔍 通过dayNumber查找结果:', currentSchedule);
            }
            
            // 如果还没找到，取第一条记录（单天修改的情况）
            if (!currentSchedule && allSchedulesResponse.data.length === 1) {
              currentSchedule = allSchedulesResponse.data[0];
              console.log('🔍 使用唯一记录:', currentSchedule);
            }
          }
          
          if (currentSchedule) {
            // 保留原有数据，只更新接送地点
            const scheduleUpdateData = {
              ...currentSchedule,
              pickupLocation: values.pickupLocation,
              dropoffLocation: values.dropoffLocation
            };
            
            console.log('📝 准备更新的数据:', scheduleUpdateData);
            await saveSchedule(scheduleUpdateData);
            console.log('✅ 排团表更新成功（仅当天接送地点）');
          } else {
            console.error('❌ 所有查找方法都失败了');
            console.error('📊 可用的排团记录:', allSchedulesResponse.data.map(s => ({
              id: s.id,
              dayNumber: s.dayNumber,
              tourDate: s.tourDate,
              title: s.title
            })));
            throw new Error(`无法找到当前排团表记录 (scheduleId: ${scheduleId}, bookingId: ${bookingId})`);
          }
        } else {
          throw new Error('无法获取排团表记录');
        }
      }
      
      if (!passengerInfoChanged && !locationInfoChanged) {
        message.info('没有信息需要更新');
        setEditModalVisible(false);
        return;
      }
      
      // 🎉 成功提示
      if (passengerInfoChanged && locationInfoChanged) {
        message.success('信息更新成功 (乘客信息已同步到订单表和所有天数，接送地点仅更新当天)');
      } else if (passengerInfoChanged) {
        message.success('乘客信息更新成功 (已同步到订单表和所有天数的排团表)');
      } else if (locationInfoChanged) {
        message.success('接送地点更新成功 (仅更新当天排团表)');
      }
      
      setEditModalVisible(false);
      
      // 刷新数据
      if (onUpdate) {
        onUpdate({
          type: 'refresh'
        });
      }
    } catch (error) {
      console.error('保存编辑信息失败:', error);
      message.error('保存失败: ' + (error.message || '未知错误'));
    }
  };

  // 查看导游用车分配详情 - 跳转到分配表页面
  const handleViewAssignment = async (locationRecord) => {
    console.log('查看导游用车分配详情:', locationRecord);
    
    if (!selectedDate) {
      message.warning('请先选择日期');
      return;
    }

    try {
      const selectedDateStr = selectedDate.format('YYYY-MM-DD');
      const location = encodeURIComponent(locationRecord.location);
      
      // 跳转到导游用车分配表页面，传递日期和地点参数
      navigate(`/tour-itinerary?date=${selectedDateStr}&location=${location}`);
    } catch (error) {
      console.error('跳转到分配表失败:', error);
      message.error('跳转到分配表失败');
    }
  };

  // 处理重新分配
  const handleReassign = (locationRecord) => {
    console.log('重新分配:', locationRecord);
    
    if (!selectedDate) {
      message.warning('请先选择日期');
      return;
    }
    
    // 设置重新分配的模式
    setSelectedLocation(locationRecord);
    setSelectedDate(selectedDate);
    
    // 构造订单数据（与handleAssignClick类似的逻辑）
    const selectedDateStr = selectedDate.format('YYYY-MM-DD');
    const ordersForLocation = [];
    
    tourGroups.forEach(group => {
      const locationData = group.locationsByDate[selectedDateStr];
      if (locationData && locationData.location) {
        const locationName = extractLocationName(locationData.location.name || locationData.name || '');
        
        if (locationName === locationRecord.location) {
          const orderData = {
            id: group.id,
            order_number: locationData.location.order?.orderNumber || `ORDER-${group.id}`,
            title: locationData.location.name || locationData.name || '',
            tour_location: locationName,
            adult_count: locationData.location.order?.adultCount || 2,
            child_count: locationData.location.order?.childCount || 0,
            customer_name: group.customer?.name || locationData.location.order?.contactPerson || '未知客户',
            contact_phone: locationData.location.order?.contactPhone || '',
            pickup_location: locationData.location.order?.pickupLocation || '',
            special_requirements: locationData.location.order?.specialRequirements || '',
            // 添加重新分配标识
            isReassignment: true,
            assignmentId: locationRecord.assignmentId,
            currentGuideId: locationRecord.guideId,
            currentVehicleId: locationRecord.vehicleId
          };
          
          ordersForLocation.push(orderData);
        }
      }
    });
    
    if (ordersForLocation.length > 0) {
      setSelectedOrders(ordersForLocation);
      setGuideVehicleModalVisible(true);
      message.info('正在为您加载重新分配界面...');
    } else {
      message.warning('未找到该地点的订单数据');
    }
  };

  // 添加修改分配功能
  const handleEditAssignment = async (record) => {
    try {
      console.log('修改分配:', record);
      
      if (!selectedDate) {
        message.error('未选择日期');
        return;
      }
      
      const dateStr = selectedDate.format('YYYY-MM-DD');
      
      // 获取该日期该地点的分配详情
      console.log('获取分配详情用于修改，日期:', dateStr, '地点:', record.location);
      
      const assignmentDetails = await getAssignmentByDateAndLocation(dateStr, record.location);
      
      if (!assignmentDetails || !assignmentDetails.data || assignmentDetails.data.length === 0) {
        message.error('未找到分配记录');
        return;
      }
      
      // 取第一个分配记录
      const assignment = assignmentDetails.data[0];
      
      // 构造订单数据，与handleAssignClick类似，但添加现有分配信息
      const ordersForLocation = [];
      
      tourGroups.forEach(group => {
        const locationData = group.locationsByDate[dateStr];
        if (locationData && locationData.location) {
          const locationName = extractLocationName(locationData.location.name || locationData.name || '');
          
          if (locationName === record.location) {
            const orderData = {
              id: group.id,
              order_number: locationData.location.order?.orderNumber || `ORDER-${group.id}`,
              title: locationData.location.name || locationData.name || '',
              tour_location: locationName,
              adult_count: locationData.location.order?.adultCount || 2,
              child_count: locationData.location.order?.childCount || 0,
              customer_name: group.customer?.name || locationData.location.order?.contactPerson || '未知客户',
              contact_phone: locationData.location.order?.contactPhone || '',
              pickup_location: locationData.location.order?.pickupLocation || '',
              special_requirements: locationData.location.order?.specialRequirements || '',
              // 添加修改分配标识和现有分配信息
              isEdit: true,
              assignmentId: assignment.id,
              currentGuideId: assignment.guide?.guideId,
              currentVehicleId: assignment.vehicle?.vehicleId,
              currentGuideName: assignment.guide?.guideName,
              currentVehicleInfo: assignment.vehicle?.licensePlate + ' (' + assignment.vehicle?.vehicleType + ')'
            };
            
            ordersForLocation.push(orderData);
          }
        }
      });
      
      if (ordersForLocation.length > 0) {
        setSelectedOrders(ordersForLocation);
        setGuideVehicleModalVisible(true);
        message.info('正在为您加载修改分配界面...');
      } else {
        message.warning('未找到该地点的订单数据');
      }
      
    } catch (error) {
      console.error('获取分配信息失败:', error);
      message.error('获取分配信息失败: ' + (error.message || '未知错误'));
    }
  };

  // 处理分配按钮点击 - 使用新的组件
  const handleAssignClick = (locationRecord) => {
    console.log('点击分配按钮，位置记录:', locationRecord);
    console.log('当前选择的日期:', selectedDate);
    console.log('selectedDate类型:', typeof selectedDate, selectedDate?.constructor?.name);
    console.log('selectedDate详细信息:', selectedDate);
    console.log('当前数据结构:', data);
    
    // 根据当前的数据结构，从tourGroups中收集该地点的订单
    const selectedDateStr = selectedDate ? selectedDate.format('YYYY-MM-DD') : null;
    
    if (!selectedDateStr) {
      message.warning('请先选择日期');
      return;
    }
    
    // 从tourGroups中找到该日期该地点的所有订单
    const ordersForLocation = [];
    
    tourGroups.forEach(group => {
      const locationData = group.locationsByDate[selectedDateStr];
      if (locationData && locationData.location) {
        const locationName = extractLocationName(locationData.location.name || locationData.name || '');
        
        // 如果地点匹配
        if (locationName === locationRecord.location) {
          // 构造订单数据
          const orderData = {
            id: group.id,
            order_number: locationData.location.order?.orderNumber || `ORDER-${group.id}`,
            title: locationData.location.name || locationData.name || '',
            tour_location: locationName,
            adult_count: locationData.location.order?.adultCount || 2,
            child_count: locationData.location.order?.childCount || 0,
            customer_name: group.customer?.name || locationData.location.order?.contactPerson || '未知客户',
            contact_phone: locationData.location.order?.contactPhone || '',
            pickup_location: locationData.location.order?.pickupLocation || '',
            special_requirements: locationData.location.order?.specialRequirements || ''
          };
          
          ordersForLocation.push(orderData);
        }
      }
    });
    
    console.log('找到的订单数据:', ordersForLocation);
    
    if (ordersForLocation.length > 0) {
      setSelectedOrders(ordersForLocation);
      setGuideVehicleModalVisible(true);
    } else {
      message.warning('未找到该地点的订单数据，请检查数据结构');
      console.log('调试信息 - tourGroups:', tourGroups);
      console.log('调试信息 - locationRecord:', locationRecord);
    }
  };
  
  // 处理分配成功回调
  const handleAssignSuccess = async (assignmentData) => {
    console.log('分配成功:', assignmentData);
    message.success('导游和车辆分配成功！');
    
    // 立即刷新当前弹窗的状态数据
    if (selectedDate && dateModalVisible) {
      await refreshDateLocationStats();
    }
    
    // 通知父组件刷新整体数据
    if (onUpdate) {
      onUpdate();
    }
  };
  
  // 刷新日期地点统计数据的函数
  const refreshDateLocationStats = async () => {
    if (!selectedDate) return;
    
    console.log('开始刷新分配状态，日期:', selectedDate.format('YYYY-MM-DD'));
    
    const dateStr = selectedDate.format('YYYY-MM-DD');
    const stats = {};
    
    // 重新统计当天各个地点的人数
    tourGroups.forEach(group => {
      const todaySchedule = group.locationsByDate[dateStr];
      
      if (todaySchedule && (todaySchedule.location?.name || todaySchedule.name)) {
        const locationName = extractLocationName(todaySchedule.location?.name || todaySchedule.name || '');
        
        if (!stats[locationName]) {
          stats[locationName] = {
            count: 0,
            totalPax: 0,
            tourGroupIds: []
          };
        }
        
        stats[locationName].count += 1;
        stats[locationName].totalPax += (parseInt(group.customer?.pax) || parseInt(group.pax) || 0);
        stats[locationName].tourGroupIds.push(group.id);
      }
    });
    
    console.log('统计到的地点:', Object.keys(stats));
    
    // 重新检查分配状态
    const statsArray = await Promise.all(Object.keys(stats).map(async (location) => {
      console.log(`🔄 刷新检查地点: ${location} 的分配状态`);
      
      try {
        console.log(`🔍 刷新API请求参数:`, {
          url: '/admin/guide-assignment/status',
          params: {
            date: dateStr,
            location: location
          }
        });
        
        const assignmentResponse = await checkAssignmentStatus(dateStr, location);
        
        console.log(`✅ 刷新${location} API响应:`, assignmentResponse);
        
        let isAssigned = false;
        let guideInfo = '';
        let vehicleInfo = '';
        
        if (assignmentResponse && assignmentResponse.code === 1 && assignmentResponse.data) {
          const assignmentData = assignmentResponse.data;
          isAssigned = assignmentData.isAssigned || false;
          guideInfo = assignmentData.guideName || '';
          vehicleInfo = assignmentData.vehicleInfo || '';
          
          console.log(`📊 刷新${location} 解析结果:`, {
            isAssigned,
            guideInfo,
            vehicleInfo
          });
        } else {
          console.warn(`⚠️ 刷新${location} API响应格式异常:`, assignmentResponse);
        }
        
        return {
          location,
          count: stats[location].count,
          totalPax: stats[location].totalPax,
          tourGroupIds: stats[location].tourGroupIds,
          isAssigned,
          guideInfo,
          vehicleInfo
        };
      } catch (error) {
        console.error(`❌ 刷新检查分配状态失败 - ${location}:`, error);
        console.error(`刷新错误详情:`, error.response?.data || error.message);
        
        // 即使API调用失败，也返回基本信息，避免数据丢失
        return {
          location,
          count: stats[location].count,
          totalPax: stats[location].totalPax,
          tourGroupIds: stats[location].tourGroupIds,
          isAssigned: false,
          guideInfo: '',
          vehicleInfo: '',
          error: error.message
        };
      }
    }));
    
    console.log('刷新后的分配状态:', statsArray);
    setDateLocationStats(statsArray);
  };
  
  // 获取可用导游和车辆
  const fetchAvailableGuidesAndVehicles = async () => {
    setAssignLoading(true);
    try {
      // 检查必要参数
      if (!selectedDate) {
        message.error('请先选择日期');
        setAvailableGuides([]);
        setAvailableVehicles([]);
        return;
      }
      
      const dateStr = selectedDate.format('YYYY-MM-DD');
      const startTime = '08:00:00';  // 默认开始时间
      const endTime = '18:00:00';    // 默认结束时间
      const location = selectedLocation?.location || '';
      const peopleCount = selectedLocation?.totalPax || 1;
      
      console.log('获取可用资源参数:', { dateStr, startTime, endTime, location, peopleCount });

      // 获取可用导游列表 - 使用availability表
      const guidesResponse = await getAvailableGuides(dateStr, startTime, endTime, location);
      
      console.log('导游数据响应:', guidesResponse);
      
      if (guidesResponse && guidesResponse.code === 1) {
        setAvailableGuides(guidesResponse.data || []);
      } else {
        setAvailableGuides([]);
        console.error('获取导游数据失败:', guidesResponse?.msg || '未知错误');
      }
      
      // 获取可用车辆列表 - 使用availability表
      const vehiclesResponse = await getAvailableVehicles(dateStr, startTime, endTime, peopleCount);
      
      console.log('车辆数据响应:', vehiclesResponse);
      
      if (vehiclesResponse && vehiclesResponse.code === 1) {
        setAvailableVehicles(vehiclesResponse.data || []);
      } else {
        setAvailableVehicles([]);
        console.error('获取车辆数据失败:', vehiclesResponse?.msg || '未知错误');
      }
    } catch (error) {
      console.error('获取导游或车辆数据失败:', error);
      message.error('获取导游或车辆数据失败: ' + (error.message || '网络错误'));
      setAvailableGuides([]);
      setAvailableVehicles([]);
    } finally {
      setAssignLoading(false);
    }
  };
  
  // 处理导游和车辆分配提交
  const handleAssignSubmit = async () => {
    try {
      const values = await assignForm.validateFields();
      setAssignLoading(true);
      
      // 组装请求数据
      const assignData = {
        date: selectedDate ? selectedDate.format('YYYY-MM-DD') : null,
        location: selectedLocation?.location,
        guideId: values.guideId,
        vehicleId: values.vehicleId,
        // 如果你有团队的ID列表，可以在这里添加
        tourGroups: dateLocationStats.find(item => item.location === selectedLocation?.location)?.tourGroupIds || []
      };
      
      console.log('发送分配请求数据:', assignData);
      
      // 发送分配请求
      const response = await assignGuideAndVehicle(assignData);
      
      console.log('分配响应:', response);
      
      if (response && response.code === 1) {
        message.success('分配成功');
        setAssignModalVisible(false);
        // 可以在这里刷新数据
      } else {
        message.error(response?.msg || '分配失败');
      }
    } catch (error) {
      console.error('分配失败:', error);
      message.error('分配失败: ' + (error.message || '未知错误'));
    } finally {
      setAssignLoading(false);
    }
  };
  
  // 渲染分配弹窗
  const renderAssignModal = () => {
    return (
      <Modal
        title={`分配导游和车辆 - ${selectedLocation?.location || ''}`}
        open={assignModalVisible}
        onCancel={() => setAssignModalVisible(false)}
        confirmLoading={assignLoading}
        onOk={handleAssignSubmit}
      >
        <Spin spinning={assignLoading}>
          <Form 
            form={assignForm}
            layout="vertical"
            initialValues={{
              location: selectedLocation?.location,
              date: selectedDate ? selectedDate.format('YYYY-MM-DD') : null
            }}
          >
            <Form.Item
              label="日期"
              name="date"
            >
              <span>{selectedDate ? selectedDate.format('YYYY-MM-DD') : '未选择'}</span>
            </Form.Item>
            
            <Form.Item
              label="目的地"
              name="location"
            >
              <span>{selectedLocation?.location || '未选择'}</span>
            </Form.Item>
            
            <Form.Item
              label="团队数"
              name="teamCount"
            >
              <span>{selectedLocation?.count || 0}</span>
            </Form.Item>
            
            <Form.Item
              label="总人数"
              name="totalPax"
            >
              <span>{selectedLocation?.totalPax || 0}</span>
            </Form.Item>
            
            <Form.Item
              label="选择导游"
              name="guideId"
              rules={[{ required: true, message: '请选择导游' }]}
            >
              <Select placeholder="请选择导游">
                {availableGuides.map(guide => (
                  <Select.Option key={guide.guideId || guide.id} value={guide.guideId || guide.id}>
                    {guide.guideName || guide.name} 
                    {guide.availabilityStatus === 'available' ? ' (可用)' : 
                     guide.availabilityStatus === 'busy' ? ' (忙碌)' : 
                     guide.availabilityStatus === 'unavailable' ? ' (不可用)' : ' (未知状态)'}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
            
            <Form.Item
              label="选择车辆"
              name="vehicleId"
              rules={[{ required: true, message: '请选择车辆' }]}
            >
              <Select placeholder="请选择车辆">
                {availableVehicles.map(vehicle => (
                  <Select.Option key={vehicle.vehicleId} value={vehicle.vehicleId}>
                    {vehicle.licensePlate} ({vehicle.vehicleType} - {vehicle.seatCount}座)
                    {vehicle.availabilityStatus === 'available' ? ' (可用)' : 
                     vehicle.availabilityStatus === 'busy' ? ' (使用中)' : 
                     vehicle.availabilityStatus === 'unavailable' ? ' (不可用)' : ' (未知状态)'}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
          </Form>
        </Spin>
      </Modal>
    );
  };

  // 处理取消分配
  const handleCancelAssignment = async (record) => {
    try {
      console.log('取消分配:', record);
      
      if (!selectedDate) {
        message.error('未选择日期');
        return;
      }
      
      const dateStr = selectedDate.format('YYYY-MM-DD');
      
      // 首先获取该日期该地点的分配详情，获得分配ID
      console.log('获取分配详情，日期:', dateStr, '地点:', record.location);
      
      const assignmentDetails = await getAssignmentByDateAndLocation(dateStr, record.location);
      
      if (!assignmentDetails || !assignmentDetails.data || assignmentDetails.data.length === 0) {
        message.error('未找到分配记录');
        return;
      }
      
      // 取第一个分配记录的ID
      const assignmentId = assignmentDetails.data[0].id;
      const reason = '用户手动取消分配';
      
      console.log('开始取消分配，ID:', assignmentId);
      
      // 调用取消分配API
      const result = await cancelAssignment(assignmentId, reason);
      
      if (result && result.code === 1) {
        message.success('分配已取消');
        // 刷新状态
        await refreshDateLocationStats();
      } else {
        message.error(result?.msg || '取消分配失败');
      }
      
    } catch (error) {
      console.error('取消分配失败:', error);
      message.error('取消分配失败: ' + (error.message || '未知错误'));
    }
  };

  // 渲染日期点击统计弹窗的函数
  const renderDateStatsModal = () => {
    return (
      <Modal
        title={
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            fontSize: '18px', 
            fontWeight: 'bold',
            color: '#495057'
          }}>
            <CalendarOutlined style={{ marginRight: '8px' }} />
            {selectedDate ? `${selectedDate.format('YYYY-MM-DD')} 行程分配管理` : '行程分配管理'}
          </div>
        }
        open={dateModalVisible}
        onCancel={() => setDateModalVisible(false)}
        footer={[
          <Button 
            key="close" 
            type="primary" 
            onClick={() => setDateModalVisible(false)}
            style={{ 
              borderRadius: '4px',
              fontWeight: 'bold'
            }}
          >
            关闭
          </Button>
        ]}
        width={900}
        style={{ top: 20 }}
      >
        <Table
          dataSource={dateLocationStats}
          rowKey="location"
          pagination={false}
          size="middle"
          style={{ marginTop: '16px' }}
          columns={[
            {
              title: '目的地',
              dataIndex: 'location',
              key: 'location',
              width: 120,
              render: (location) => (
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  fontWeight: 'bold',
                  color: '#262626',
                  fontSize: '14px'
                }}>
                  <EnvironmentOutlined style={{ 
                    color: getLocationColor(location), 
                    marginRight: '6px',
                    fontSize: '16px'
                  }} />
                  {location}
                </div>
              ),
            },
            {
              title: '团队数',
              dataIndex: 'count',
              key: 'count',
              width: 80,
              align: 'center',
              render: (count) => (
                <Tag 
                  color="blue" 
                  style={{ 
                    borderRadius: '4px', 
                    fontSize: '13px',
                    fontWeight: 'bold',
                    padding: '4px 8px'
                  }}
                >
                  {count}
                </Tag>
              ),
            },
            {
              title: '总人数',
              dataIndex: 'totalPax',
              key: 'totalPax',
              width: 80,
              align: 'center',
              render: (totalPax) => (
                <Tag 
                  color="green" 
                  style={{ 
                    borderRadius: '4px', 
                    fontSize: '13px',
                    fontWeight: 'bold',
                    padding: '4px 8px'
                  }}
                >
                  <TeamOutlined style={{ marginRight: '4px' }} />
                  {totalPax}
                </Tag>
              ),
            },
            {
              title: '分配状态',
              key: 'assignmentStatus',
              width: 300,
              render: (_, record) => {
                const isAssigned = record.isAssigned || false;
                const guideInfo = record.guideInfo || '';
                const vehicleInfo = record.vehicleInfo || '';
                
                if (isAssigned) {
                  return (
                    <div style={{ 
                      padding: '10px 14px', 
                      backgroundColor: '#d4edda', 
                      border: '1px solid #c3e6cb',
                      borderRadius: '6px',
                      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
                    }}>
                      <div style={{ marginBottom: '6px' }}>
                        <Tag 
                          color="success" 
                          style={{ 
                            borderRadius: '4px', 
                            fontSize: '13px',
                            fontWeight: 'bold',
                            marginBottom: '8px',
                            padding: '4px 10px'
                          }}
                        >
                          ✅ 已分配
                        </Tag>
                      </div>
                      {guideInfo && (
                        <div style={{ 
                          fontSize: '13px', 
                          color: '#155724', 
                          marginBottom: '4px',
                          display: 'flex',
                          alignItems: 'center',
                          fontWeight: '500'
                        }}>
                          <UserSwitchOutlined style={{ marginRight: '6px', fontSize: '14px' }} />
                          <strong>导游:</strong> <span style={{ marginLeft: '6px' }}>{guideInfo}</span>
                        </div>
                      )}
                      {vehicleInfo && (
                        <div style={{ 
                          fontSize: '13px', 
                          color: '#155724',
                          display: 'flex',
                          alignItems: 'center',
                          fontWeight: '500'
                        }}>
                          <CarOutlined style={{ marginRight: '6px', fontSize: '14px' }} />
                          <strong>车辆:</strong> <span style={{ marginLeft: '6px' }}>{vehicleInfo}</span>
                        </div>
                      )}
                    </div>
                  );
                } else {
                  return (
                    <div style={{ 
                      padding: '10px 14px', 
                      backgroundColor: '#fff3cd', 
                      border: '1px solid #ffeaa7',
                      borderRadius: '6px',
                      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
                    }}>
                      <Tag 
                        color="warning" 
                        style={{ 
                          borderRadius: '4px', 
                          fontSize: '13px',
                          fontWeight: 'bold',
                          padding: '4px 10px'
                        }}
                      >
                        ⏳ 待分配
                      </Tag>
                    </div>
                  );
                }
              },
            },
            {
              title: '操作',
              key: 'action',
              width: 180,
              render: (_, record) => {
                const isAssigned = record.isAssigned || false;
                
                if (isAssigned) {
                  return (
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                      <Button 
                        size="small" 
                        type="default"
                        onClick={() => handleViewAssignment(record)}
                        style={{ 
                          borderRadius: '4px',
                          fontSize: '12px',
                          height: '28px',
                          backgroundColor: '#e3f2fd',
                          borderColor: '#90caf9',
                          color: '#1976d2'
                        }}
                        icon={<CommentOutlined />}
                      >
                        详情
                      </Button>
                      <Button 
                        size="small"
                        type="primary"
                        ghost
                        onClick={() => handleEditAssignment(record)}
                        style={{ 
                          borderRadius: '4px',
                          fontSize: '12px',
                          height: '28px'
                        }}
                        icon={<SettingOutlined />}
                      >
                        修改
                      </Button>
                      <Button 
                        size="small"
                        danger
                        ghost
                        onClick={() => {
                          Modal.confirm({
                            title: '确认取消分配',
                            content: `确定要取消 ${record.location} 的导游和车辆分配吗？`,
                            icon: <CreditCardOutlined style={{ color: '#ff4d4f' }} />,
                            okText: '确认取消',
                            cancelText: '保留分配',
                            okType: 'danger',
                            onOk: () => handleCancelAssignment(record),
                          });
                        }}
                        style={{ 
                          borderRadius: '4px',
                          fontSize: '12px',
                          height: '28px'
                        }}
                        icon={<CreditCardOutlined />}
                      >
                        取消
                      </Button>
                    </div>
                  );
                } else {
                  return (
                    <Button 
                      type="primary" 
                      size="small" 
                      icon={<SettingOutlined />}
                      onClick={() => handleAssignClick(record)}
                      style={{ 
                        borderRadius: '4px',
                        fontSize: '13px',
                        height: '32px',
                        fontWeight: 'bold'
                      }}
                    >
                      分配
                    </Button>
                  );
                }
              },
            }
          ]}
          rowClassName={(record) => {
            return record.isAssigned ? 'assigned-row' : 'unassigned-row';
          }}
        />
        
        {/* 统计信息汇总 */}
        <div style={{ 
          marginTop: '20px', 
          padding: '16px', 
          background: '#f8f9fa',
          borderRadius: '6px',
          border: '1px solid #e9ecef',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
        }}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-around', 
            alignItems: 'center' 
          }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#007bff' }}>
                {dateLocationStats.length}
              </div>
              <div style={{ fontSize: '13px', color: '#6c757d', fontWeight: '500' }}>总目的地</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#28a745' }}>
                {dateLocationStats.filter(item => item.isAssigned).length}
              </div>
              <div style={{ fontSize: '13px', color: '#6c757d', fontWeight: '500' }}>已分配</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#ffc107' }}>
                {dateLocationStats.filter(item => !item.isAssigned).length}
              </div>
              <div style={{ fontSize: '13px', color: '#6c757d', fontWeight: '500' }}>待分配</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#6f42c1' }}>
                {dateLocationStats.reduce((sum, item) => sum + item.totalPax, 0)}
              </div>
              <div style={{ fontSize: '13px', color: '#6c757d', fontWeight: '500' }}>总人数</div>
            </div>
          </div>
        </div>
      </Modal>
    );
  };

  // 渲染组件
  return (
    <div className="tour-schedule-table">
      {/* 保存按钮区域 */}
      {hasUnsavedChanges && (
        <div className="save-actions">
          <Button 
            type="primary" 
            icon={<SaveOutlined />} 
            onClick={handleSaveChanges}
          >
            保存更改
          </Button>
          <Button 
            onClick={handleDiscardChanges}
            style={{ marginLeft: '10px' }}
          >
            取消更改
          </Button>
        </div>
      )}
      

      
      <div className="schedule-container">
        {/* 时间列 - 固定在左侧 */}
        <div className="time-column">
          <div className="time-header">时间</div>
          {dates.map(date => {
            // 创建日期对象 - 统一使用moment而不是dayjs
            const dateObj = moment(date.date);
            // 获取日期字符串
            const dateStr = dateObj.format('YYYY-MM-DD');
            
            return (
              <div 
                key={date.date} 
                className="time-cell" 
                onClick={async () => {
                  console.log(`🎯 时间列日期点击事件触发! 日期: ${dateStr}`);
                  
                  // 统计当天各个地点的人数
                  const stats = {};
                  
                  // 遍历所有团队，查找当天安排
                  tourGroups.forEach(group => {
                    const todaySchedule = group.locationsByDate[dateStr];
                    
                    if (todaySchedule && (todaySchedule.location?.name || todaySchedule.name)) {
                      const locationName = extractLocationName(todaySchedule.location?.name || todaySchedule.name || '');
                      
                      if (!stats[locationName]) {
                        stats[locationName] = {
                          count: 0,
                          totalPax: 0,
                          tourGroupIds: [] // 保存该地点的团队ID
                        };
                      }
                      
                      stats[locationName].count += 1;
                      stats[locationName].totalPax += (parseInt(group.customer?.pax) || parseInt(group.pax) || 0);
                      stats[locationName].tourGroupIds.push(group.id); // 添加团队ID
                    }
                  });
                  
                  // 转换为数组格式，并检查分配状态
                  const statsArray = await Promise.all(Object.keys(stats).map(async (location) => {
                    console.log(`📍 时间列开始检查地点: ${location} 的分配状态`);
                    
                    try {
                      // 调用API检查该日期该地点的分配状态
                      console.log(`🔍 时间列API请求参数:`, {
                        url: '/admin/guide-assignment/status',
                        params: {
                          date: dateStr,
                          location: location
                        }
                      });
                      
                      const assignmentResponse = await checkAssignmentStatus(dateStr, location);
                      
                      console.log(`✅ 时间列${location} API响应:`, assignmentResponse);
                      
                      let isAssigned = false;
                      let guideInfo = '';
                      let vehicleInfo = '';
                      
                      if (assignmentResponse && assignmentResponse.code === 1 && assignmentResponse.data) {
                        const assignmentData = assignmentResponse.data;
                        isAssigned = assignmentData.isAssigned || false;
                        guideInfo = assignmentData.guideName || '';
                        vehicleInfo = assignmentData.vehicleInfo || '';
                        
                        console.log(`📊 时间列${location} 解析结果:`, {
                          isAssigned,
                          guideInfo,
                          vehicleInfo
                        });
                      } else {
                        console.warn(`⚠️ 时间列${location} API响应格式异常:`, assignmentResponse);
                      }
                      
                      return {
                    location,
                    count: stats[location].count,
                    totalPax: stats[location].totalPax,
                        tourGroupIds: stats[location].tourGroupIds,
                        isAssigned,
                        guideInfo,
                        vehicleInfo
                      };
                    } catch (error) {
                      console.error(`❌ 时间列检查分配状态失败 - ${location}:`, error);
                      console.error(`时间列错误详情:`, error.response?.data || error.message);
                      console.error(`时间列HTTP状态码:`, error.response?.status);
                      console.error(`时间列完整错误对象:`, error);
                      
                      // 显示用户友好的错误提示
                      if (error.response?.status === 401) {
                        console.error(`🔐 时间列认证失败！请检查是否已登录或token是否有效`);
                      } else if (error.response?.status === 404) {
                        console.error(`🔍 时间列API接口不存在: ${error.config?.url}`);
                      } else if (error.response?.status >= 500) {
                        console.error(`🔥 时间列服务器内部错误`);
                      }
                      
                      // 如果API调用失败，默认为未分配状态
                      return {
                        location,
                        count: stats[location].count,
                        totalPax: stats[location].totalPax,
                        tourGroupIds: stats[location].tourGroupIds,
                        isAssigned: false,
                        guideInfo: '',
                        vehicleInfo: '',
                        error: error.message,
                        httpStatus: error.response?.status
                      };
                    }
                  }));
                  
                  setDateLocationStats(statsArray);
                  console.log('时间列点击 - 设置selectedDate之前:', {
                    originalDate: date.date,
                    dateObj: dateObj,
                    dateObjType: typeof dateObj,
                    dateObjConstructor: dateObj?.constructor?.name,
                    formatted: dateObj.format('YYYY-MM-DD')
                  });
                  setSelectedDate(dateObj);
                  setDateModalVisible(true);
                }}
                style={{cursor: 'pointer'}} // 添加指针样式表明可点击
              >
              <div className="time-day">{date.dayNum}</div>
              <div className="time-date">{date.dateNum}</div>
            </div>
            );
          })}
        </div>
        
        {/* 内容区域 - 可滚动 */}
        <div className="scrollable-content" ref={scrollContainerRef}>
          {/* 按列渲染订单组 */}
          <div className="columns-wrapper">
            {Object.keys(groupsByColumn).map(columnIndex => (
              <div 
                key={`column-${columnIndex}`} 
                className="column-group"
                style={{
                  width: '90px',
                  marginRight: '5px'
                }}
              >
                {/* 列标题 */}
                <div className="column-header" style={{ height: '40px' }}></div>
                
                {/* 日期行容器 - 创建与日期行相同数量的格子 */}
                <div className="date-rows">
                  {dates.map(date => (
                    <div key={`grid-${date.date}-${columnIndex}`} className="date-grid-cell" style={{ height: '70px' }}></div>
                  ))}
                </div>
                
                {/* 在日期格子上叠加订单组 */}
                <div className="orders-container">
                  {groupsByColumn[columnIndex].map(group => (
                    <React.Fragment key={group.id}>
              {group.segments.map((segment, segIndex) => {
                const { dateIndexMap, startIdx, endIdx } = createSegmentMap(segment, dates);
                const segmentDates = dates.slice(startIdx, endIdx + 1);
                const containerId = `${group.id}-segment-${segIndex}`;
                
                const orderId = group.orderId || group.customer?.orderId || group.id;
                const hotelStatus = hotelBookingStatus[orderId];
                const orderColor = orderGroupColors[orderId] || '#d9d9d9';
                
                // 生成订单组编号（简化显示）
                const orderGroupNumber = Object.keys(orderGroupColors).indexOf(orderId) + 1;
                
                // 生成CSS类名
                let containerClasses = 'tour-container';
                if (hotelStatus?.isConfirmed) {
                  containerClasses += ' hotel-confirmed';
                } else if (hotelStatus?.hasHotelBooking) {
                  containerClasses += ' hotel-pending';
                }

                return (
                  <div 
                    key={containerId} 
                    className={containerClasses}
                    style={{ 
                      position: 'absolute',
                              top: `${40 + startIdx * 70}px`,
                              height: `${segmentDates.length * 70}px`,
                              left: 0,
                              right: 0,
                              margin: '0 5px',
                              ...getOrderGroupBorderStyle(group)
                    }}
                    onDragEnter={(e) => handleContainerDragEnter(e, containerId)}
                    onDragOver={(e) => e.preventDefault()}
                  >
                    {/* 订单组编号标识 */}
                    <div 
                      className="order-group-identifier"
                      style={{ backgroundColor: orderColor }}
                      title={`订单组 ${orderGroupNumber} - ${orderId}`}
                    >
                      {orderGroupNumber}
                    </div>
                    
                    {/* 酒店预订状态图标 */}
                    {getHotelBookingIcon(group)}
                    {segmentDates.map((date, dateIndex) => {
                      const locationData = group.locationsByDate[date.date];
                      const tooltipId = `${group.id}-${date.date}`;
                      
                      return (
                        <div 
                          key={tooltipId}
                          className="date-cell"
                          onDragEnter={(e) => handleDragEnter(e, group.id, segIndex, date.date, dateIndex)}
                          onDragLeave={handleDragLeave}
                          onDragOver={(e) => e.preventDefault()}
                          onDrop={(e) => handleDrop(e, group.id, segIndex, date.date, dateIndex)}
                          data-date={date.date}
                                  style={{ height: '70px', padding: '5px' }}
                        >
                          {locationData && (
                                    <Popover
                                      content={renderDetailContent(locationData)}
                              title={
                                        <span>
                                          <EnvironmentOutlined /> 
                                          {extractLocationName(locationData.location?.name || locationData.name || '行程详情')}
                                        </span>
                              }
                                      placement="right"
                                      trigger="hover"
                                      overlayClassName="tour-popover"
                              mouseEnterDelay={0.5}
                                      mouseLeaveDelay={0.2}
                            >
                              <div 
                                className="location-box"
                                draggable="true"
                                onDragStart={(e) => handleDragStart(e, group.id, segIndex, date.date, locationData)}
                                onDragEnd={handleDragEnd}
                                data-index={dateIndex}
                              >
                                <div 
                                  className="location-name" 
                                  style={{
                                            backgroundColor: locationData.location?.color || locationData.color || getLocationColor(locationData.location?.name || locationData.name || ''),
                                            borderLeft: `3px solid ${locationData.location?.color || locationData.color || getLocationColor(locationData.location?.name || locationData.name || '')}`,
                                            boxShadow: `0 1px 4px ${locationData.location?.color || locationData.color || getLocationColor(locationData.location?.name || locationData.name || '')}30`,
                                            padding: '3px 6px',
                                            fontSize: '12px'
                                  }}
                                >
                                          {extractLocationName(locationData.location?.name || locationData.name || '')}
                                          <Tag color={locationData.location?.color || locationData.color || getLocationColor(locationData.location?.name || locationData.name || '')} className="pax-tag">
                                            <TeamOutlined /> {getPersonCount(locationData)}
                                  </Tag>
                                </div>
                                <div className="customer-info">
                                          <UserOutlined /> {getCustomerInfo(locationData)}
                                </div>
                              </div>
                                    </Popover>
                          )}
                        </div>
                      );
                    })}
                  </div>
                );
              })}
                    </React.Fragment>
                  ))}
                </div>
            </div>
          ))}
          </div>
        </div>
      </div>
      
      {/* 日期行程统计弹窗 */}
      {renderDateStatsModal()}
      
      {/* 分配导游和车辆弹窗 */}
      {renderAssignModal()}
      
      {/* 新的导游车辆分配弹窗 */}
      <GuideVehicleAssignModal
        visible={guideVehicleModalVisible}
        onCancel={() => setGuideVehicleModalVisible(false)}
        onSuccess={handleAssignSuccess}
        selectedOrders={selectedOrders}
        selectedDate={selectedDate}
      />
      
      {/* 分配详情弹窗 */}
      <AssignmentDetailModal
        visible={detailModalVisible}
        onCancel={() => {
          setDetailModalVisible(false);
          setCurrentAssignmentData(null);
        }}
        assignmentData={currentAssignmentData}
      />
      
      {/* 编辑排团表信息弹窗 */}
      <Modal
        title="修改排团表信息"
        open={editModalVisible}
        onCancel={() => setEditModalVisible(false)}
        onOk={handleSaveEditInfo}
        okText="保存"
        cancelText="取消"
        width={600}
      >
        <Form
          form={editForm}
          layout="vertical"
          style={{ maxHeight: '400px', overflowY: 'auto' }}
        >
          <div style={{ marginBottom: '16px', padding: '12px', backgroundColor: '#f6ffed', borderRadius: '6px', border: '1px solid #b7eb8f' }}>
            <p style={{ margin: 0, color: '#52c41a', fontSize: '14px' }}>
              <strong>📝 可修改内容：</strong>
            </p>
            <ul style={{ margin: '8px 0 0 20px', color: '#666', fontSize: '12px' }}>
              <li>姓名、电话、航班号 → <span style={{ color: '#1890ff' }}>同步更新到订单表</span></li>
              <li>接送地点 → <span style={{ color: '#722ed1' }}>仅更新排团表</span></li>
            </ul>
          </div>
          
          <Form.Item
            name="contactPerson"
            label="联系人姓名"
            rules={[{ required: true, message: '请输入联系人姓名' }]}
          >
            <Input placeholder="请输入联系人姓名" />
          </Form.Item>
          
          <Form.Item
            name="contactPhone"
            label="联系电话"
            rules={[{ required: true, message: '请输入联系电话' }]}
          >
            <Input placeholder="请输入联系电话" />
          </Form.Item>
          
          <Form.Item
            name="flightNumber"
            label="到达航班号"
          >
            <Input placeholder="请输入到达航班号" />
          </Form.Item>
          
          <Form.Item
            name="returnFlightNumber"
            label="返程航班号"
          >
            <Input placeholder="请输入返程航班号" />
          </Form.Item>
          
          <Form.Item
            name="pickupLocation"
            label="接客地点"
          >
            <Input placeholder="请输入接客地点" />
          </Form.Item>
          
          <Form.Item
            name="dropoffLocation"
            label="送客地点"
          >
            <Input placeholder="请输入送客地点" />
          </Form.Item>
        </Form>
      </Modal>
      
      {/* 酒店预订弹窗 */}
      <HotelBookingModal
        visible={hotelBookingModalVisible}
        onCancel={() => {
          setHotelBookingModalVisible(false);
          setCurrentHotelBookingData(null);
        }}
        onSuccess={async () => {
          setHotelBookingModalVisible(false);
          setCurrentHotelBookingData(null);
          message.success('酒店预订操作成功！');
          
          // 重新检查酒店预订状态
          if (tourGroups && tourGroups.length > 0) {
            try {
              const updatedHotelStatus = await checkHotelBookingStatus(tourGroups);
              setHotelBookingStatus(updatedHotelStatus);
            } catch (error) {
              console.error('刷新酒店预订状态失败:', error);
            }
          }
          
          // 刷新整体数据
          if (onUpdate) {
            onUpdate();
          }
        }}
        locationData={currentHotelBookingData?.locationData}
        orderInfo={currentHotelBookingData?.orderInfo}
      />
      
      {/* 固定在右下角的横向导航控制器 - 始终显示 */}
      <div className="horizontal-nav-controls">
        {/* 左箭头按钮 */}
        <button 
          className="nav-btn"
          onClick={scrollLeft}
          disabled={!canScrollLeft}
          title="向左滚动"
        >
          <LeftOutlined />
        </button>

        {/* 滚动进度显示 */}
        <div className="scroll-progress">
          <div className="progress-text">
            {currentPage} / {totalPages}
          </div>
          <div className="progress-bar">
            <div 
              className="progress-fill"
              style={{ width: `${scrollProgress}%` }}
            />
          </div>
        </div>

        {/* 右箭头按钮 */}
        <button 
          className="nav-btn"
          onClick={scrollRight}
          disabled={!canScrollRight}
          title="向右滚动"
        >
          <RightOutlined />
        </button>

        {/* 快捷页面跳转按钮 */}
        {totalPages > 1 && totalPages <= 5 && (
          <div className="quick-nav">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
              <button
                key={page}
                className={`quick-btn ${currentPage === page ? 'active' : ''}`}
                onClick={() => jumpToPage(page)}
                title={`跳转到第${page}页`}
              >
                {page}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default TourScheduleTable; 