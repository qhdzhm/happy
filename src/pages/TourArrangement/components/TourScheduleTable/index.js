import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Empty, Spin, Tooltip, message, Button, Tag, Modal, Popover, Table, Form, Select, Dropdown, Menu } from 'antd';
import { SaveOutlined, UserOutlined, HomeOutlined, IdcardOutlined, PhoneOutlined, TeamOutlined, LeftOutlined, RightOutlined, EnvironmentOutlined, CalendarOutlined, CreditCardOutlined, CommentOutlined, CarOutlined, UserSwitchOutlined, SettingOutlined } from '@ant-design/icons';
import moment from 'moment';
import './index.scss';
import axios from 'axios';
import { getEmployeesByPage } from '@/apis/Employee';
import { getAvailableVehicles } from '@/apis/vehicle';
import { assignGuideAndVehicle } from '@/api/tourSchedule';
import GuideVehicleAssignModal from '../../../../components/GuideVehicleAssignModal';

const TourScheduleTable = ({ data, loading, dateRange, onUpdate, onInitSchedule }) => {
  const [dates, setDates] = useState([]);
  const [tourGroups, setTourGroups] = useState([]);
  const [draggedItem, setDraggedItem] = useState(null);
  const [dragOriginContainer, setDragOriginContainer] = useState(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [originalData, setOriginalData] = useState(null);
  const [activeTooltip, setActiveTooltip] = useState(null);
  const [visibleColumnStart, setVisibleColumnStart] = useState(0);
  const [visibleColumnCount, setVisibleColumnCount] = useState(4); // 默认显示4列
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
  
  // 横向滚动容器引用
  const scrollContainerRef = useRef(null);
  
  // Refs for tracking draggable elements
  const dragItemRef = useRef(null);
  const dragNodeRef = useRef(null);

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
          startDate = moment(order.tourStartDate).format('YYYY-MM-DD');
          endDate = moment(order.tourEndDate).format('YYYY-MM-DD');
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
        const today = moment().format('YYYY-MM-DD');
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
          const orderStart = moment(orderRange.startDate);
          const orderEnd = moment(orderRange.endDate);
          const existingStart = moment(existingRange.startDate);
          const existingEnd = moment(existingRange.endDate);
          
          // 更精确的重叠检测 - 如果两个日期范围有重叠
          // 一个订单的结束日期大于等于另一个订单的开始日期，且一个订单的开始日期小于等于另一个订单的结束日期
          if ((orderStart.isSameOrBefore(existingEnd) && orderEnd.isSameOrAfter(existingStart))) {
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
  const handleDrop = (e, targetGroupId, targetSegmentIndex, targetDate, targetIndex) => {
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
    
    handleDragEnd(e);
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
    
    // 简化地点名称映射
    const simplifiedNames = {
      '霍巴特市游': '霍巴特',
      '霍巴特市区': '霍巴特',
      '霍巴特': '霍巴特',
      '布鲁尼岛': '布鲁尼',
      '酒杯湾': '酒杯湾',
      '亚瑟港不含门票': '亚瑟港',
      '亚瑟港': '亚瑟港',
      '摇篮山': '摇篮山',
      '朗塞斯顿': '朗塞斯顿',
      '玛丽亚岛': '玛丽亚',
      '菲尔德山': '菲尔德',
      '菲欣纳国家公园': '菲欣纳',
      '塔斯曼半岛': '塔斯曼',
      '非常湾': '非常湾',
      '菲欣纳': '菲欣纳',
      '摩恩谷': '摩恩谷',
      '卡尔德': '卡尔德',
      '珊瑚湾': '珊瑚湾'
    };
    
    // 直接提取冒号后的部分，不保留"第几天"的前缀
    const colonSplit = title.split(/[:：]\s*/);
    let locationName = '';
    
    if (colonSplit.length > 1) {
      // 返回冒号后的内容，去掉"一日游"等后缀
      locationName = colonSplit[1].replace('一日游', '').trim();
    } else {
      // 如果没有冒号，直接返回原标题
      locationName = title;
    }
    
    // 检查是否有简化名称
    for (const [key, value] of Object.entries(simplifiedNames)) {
      if (locationName.includes(key)) {
        return value;
      }
    }
    
    // 如果没有匹配的简化名称，返回原名称
    return locationName;
  };
  
  // 获取颜色映射，根据地点名称返回颜色（与主页面保持一致）
  const getLocationColor = (locationName) => {
    if (!locationName) return '#1890ff';
    
    // 与主页面保持一致的颜色映射
    const locationColors = {
      '霍巴特': '#13c2c2',
      '朗塞斯顿': '#722ed1',
      '摇篮山': '#7b68ee',
      '酒杯湾': '#ff9c6e',
      '亚瑟港': '#dc3545',
      '布鲁尼岛': '#87d068',
      '布鲁尼': '#87d068',
      '惠灵顿山': '#f56a00',
      '塔斯马尼亚': '#1890ff',
      '菲欣纳': '#3f8600',
      '菲欣纳国家公园': '#3f8600',
      '一日游': '#108ee9',
      '跟团游': '#fa8c16',
      '待安排': '#bfbfbf',
      '塔斯曼半岛': '#ff4d4f',
      '塔斯曼': '#ff4d4f',
      '玛丽亚岛': '#ffaa00',
      '玛丽亚': '#ffaa00',
      '摩恩谷': '#9254de',
      '菲尔德山': '#237804',
      '菲尔德': '#237804',
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
    while (currentDate.isSameOrBefore(dateRange[1])) {
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

  // 处理初始化行程
  const handleInitSchedule = () => {
    if (onInitSchedule) {
      onInitSchedule();
    }
  };

  // 向左滚动
  const scrollLeft = () => {
    if (visibleColumnStart > 0) {
      setVisibleColumnStart(prev => Math.max(0, prev - 1));
    }
  };

  // 向右滚动
  const scrollRight = () => {
    const maxVisibleStart = dates.length - visibleColumnCount;
    if (visibleColumnStart < maxVisibleStart) {
      setVisibleColumnStart(prev => Math.min(maxVisibleStart, prev + 1));
    }
  };

  // 渲染行程表格
  const renderScheduleTable = () => {
    return (
      <div className="schedule-table">
        {/* 日期头部 */}
        <div className="date-header" style={{ display: 'flex' }}>
          {dates.slice(visibleColumnStart, visibleColumnStart + visibleColumnCount).map(date => (
            renderDateColumn(moment(date.date))
          ))}
        </div>
        
        {/* 团队行程 */}
        <div className="tour-groups">
          {tourGroups.map(group => (
            <div key={group.id} className="tour-group-row">
              {/* 团队信息 */}
              <div className="group-info" style={{ padding: '10px', borderBottom: '1px solid #e8e8e8' }}>
                <div><strong>{group.customer?.name || group.name || '未命名团队'}</strong></div>
                <div><TeamOutlined /> {group.customer?.pax || group.pax || '0'} 人</div>
              </div>
              
              {/* 团队行程单元格 */}
              <div className="schedule-cells" style={{ display: 'flex' }}>
                {dates.slice(visibleColumnStart, visibleColumnStart + visibleColumnCount).map(date => {
                  const schedule = group.locationsByDate[date.date];
                  return (
                    <div key={`${group.id}-${date.date}`} className="schedule-cell" style={{ 
                      width: '80px', 
                      padding: '5px',
                      borderRight: '1px solid #e8e8e8',
                      borderBottom: '1px solid #e8e8e8'
                    }}>
                      {schedule && (
                        <Tooltip title={schedule.location?.name || schedule.name || ''}>
                          <div style={{ 
                            backgroundColor: schedule.location?.color || schedule.color || '#1890ff',
                            color: 'white',
                            padding: '3px 6px',
                            borderRadius: '3px',
                            fontSize: '12px',
                            marginBottom: '3px'
                          }}>
                            {extractLocationName(schedule.location?.name || schedule.name || '')}
                            <div style={{ marginTop: '2px' }}>
                              <TeamOutlined /> {group.customer?.pax || group.pax || '0'}
                            </div>
                          </div>
                        </Tooltip>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

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
    const handleDateClick = () => {
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
      
      // 转换为数组格式，便于展示
      const statsArray = Object.keys(stats).map(location => ({
        location,
        count: stats[location].count,
        totalPax: stats[location].totalPax,
        tourGroupIds: stats[location].tourGroupIds // 添加团队ID数组
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
  
  const handleTooltipVisibleChange = (tooltipId, visible) => {
    // 如果正在拖拽，不显示tooltip
    if (draggedItem) {
      return;
    }
    
    setActiveTooltip(visible ? tooltipId : null);
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
    const order = location.order || locationData.order || {};
    
    // 确保即使没有完整订单信息也能显示部分内容
    const bookingId = order.bookingId || order.id || null;
    const orderNumber = order.orderNumber || '未知订单号';
    const orderInfo = {
      name: order.contactPerson || location.name || '未知客户',
      phone: order.contactPhone || '未提供',
      pax: (order.adultCount || 0) + (order.childCount || 0),
      hotel: order.pickupLocation || '未指定',
      bookingId: bookingId,
      orderNumber: orderNumber,
      tourType: order.tourType || '未知类型',
      tourName: order.tourName || location.name || '未知产品',
      specialRequests: order.specialRequests || '无特殊要求'
    };
    
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
          <div className="info-item">
            <UserOutlined /> 客户: {orderInfo.name}
          </div>
          <div className="info-item">
            <PhoneOutlined /> 电话: {orderInfo.phone}
          </div>
          <div className="info-item">
            <TeamOutlined /> 人数: {orderInfo.pax}
          </div>
          <div className="info-item">
            <HomeOutlined /> 接送点: {orderInfo.hotel}
          </div>
          <div className="info-item">
            <IdcardOutlined /> 订单号: {orderInfo.orderNumber}
          </div>
        </div>
        
        <div className="detail-description">
          {orderInfo.specialRequests && (
            <div className="description-content">
              <strong>特殊要求:</strong>
              <p>{orderInfo.specialRequests}</p>
            </div>
          )}
          {(!orderInfo.specialRequests && (locationData.description || location.description)) && (
            <div className="description-content">
              <strong>行程描述:</strong>
              <p>{locationData.description || location.description}</p>
            </div>
          )}
        </div>
        
        {/* 添加初始化行程按钮 */}
        {currentBookingId && onInitSchedule && (
          <div className="detail-actions">
            <Button 
              type="primary" 
              size="small" 
              onClick={() => onInitSchedule(currentBookingId)}
              icon={<CalendarOutlined />}
            >
              初始化行程
            </Button>
            <div className="tip">点击此按钮可根据订单信息自动生成行程</div>
          </div>
        )}
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

  // 处理分配按钮点击 - 使用新的组件
  const handleAssignClick = (locationRecord) => {
    console.log('点击分配按钮，位置记录:', locationRecord);
    console.log('当前选择的日期:', selectedDate);
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
  const handleAssignSuccess = (assignmentData) => {
    console.log('分配成功:', assignmentData);
    message.success('导游和车辆分配成功！');
    // 可以在这里刷新数据或更新UI
    if (onUpdate) {
      onUpdate();
    }
  };
  
  // 获取可用导游和车辆
  const fetchAvailableGuidesAndVehicles = async () => {
    setAssignLoading(true);
    try {
      // 获取导游列表 - 角色为0的员工
      const guidesResponse = await getEmployeesByPage({
        role: 0,
        status: 1, // 启用状态
        page: 1,
        pageSize: 100
      });
      
      console.log('导游数据响应:', guidesResponse);
      
      if (guidesResponse && guidesResponse.code === 1) {
        setAvailableGuides(guidesResponse.data.records || []);
      } else {
        setAvailableGuides([]);
        console.error('获取导游数据格式不正确:', guidesResponse);
      }
      
      // 获取可用车辆列表
      const vehiclesResponse = await getAvailableVehicles();
      
      console.log('车辆数据响应:', vehiclesResponse);
      
      if (vehiclesResponse && vehiclesResponse.code === 1) {
        setAvailableVehicles(vehiclesResponse.data || []);
      } else {
        setAvailableVehicles([]);
        console.error('获取车辆数据格式不正确:', vehiclesResponse);
      }
    } catch (error) {
      console.error('获取导游或车辆数据失败:', error);
      message.error('获取导游或车辆数据失败');
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
                  <Select.Option key={guide.id} value={guide.id}>
                    {guide.name} ({guide.workStatus === 0 ? '空闲' : 
                                 guide.workStatus === 1 ? '忙碌' : 
                                 guide.workStatus === 2 ? '休假' : 
                                 guide.workStatus === 3 ? '出团' : '待命'})
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
                    {vehicle.licensePlate} ({vehicle.vehicleType} - {vehicle.seatCount}座 - 
                    当前司机: {vehicle.currentDriverCount || 0}/{vehicle.maxDrivers})
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
          </Form>
        </Spin>
      </Modal>
    );
  };

  // 渲染日期点击统计弹窗的函数
  const renderDateStatsModal = () => {
    return (
      <Modal
        title={selectedDate ? `${selectedDate.format('YYYY-MM-DD')} 行程统计` : '行程统计'}
        open={dateModalVisible}
        onCancel={() => setDateModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setDateModalVisible(false)}>
            关闭
          </Button>
        ]}
      >
        <Table
          dataSource={dateLocationStats}
          rowKey="location"
          pagination={false}
          columns={[
            {
              title: '目的地',
              dataIndex: 'location',
              key: 'location',
            },
            {
              title: '团队数',
              dataIndex: 'count',
              key: 'count',
            },
            {
              title: '总人数',
              dataIndex: 'totalPax',
              key: 'totalPax',
            },
            {
              title: '操作',
              key: 'action',
              render: (_, record) => (
                <Button 
                  type="primary" 
                  size="small" 
                  icon={<SettingOutlined />}
                  onClick={() => handleAssignClick(record)}
                >
                  分配
                </Button>
              ),
            }
          ]}
        />
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
      
      {/* 左右导航按钮 - 现在作为浮动控制器 */}
      {dates.length > visibleColumnCount && (
        <div className="navigation-controls">
          <Button 
            type="primary" 
            shape="circle" 
            icon={<LeftOutlined />} 
            onClick={scrollLeft}
            disabled={visibleColumnStart <= 0}
            className="nav-button nav-left"
          />
          <div className="pagination-indicator">
            {`${visibleColumnStart + 1}-${Math.min(visibleColumnStart + visibleColumnCount, dates.length)} / ${dates.length}`}
          </div>
          <Button 
            type="primary" 
            shape="circle" 
            icon={<RightOutlined />} 
            onClick={scrollRight}
            disabled={visibleColumnStart >= dates.length - visibleColumnCount}
            className="nav-button nav-right"
          />
        </div>
      )}
      
      <div className="schedule-container">
        {/* 时间列 - 固定在左侧 */}
        <div className="time-column">
          <div className="time-header">时间</div>
          {dates.map(date => {
            // 创建日期对象
            const dateObj = moment(date.date);
            // 获取日期字符串
            const dateStr = dateObj.format('YYYY-MM-DD');
            
            return (
              <div 
                key={date.date} 
                className="time-cell" 
                onClick={() => {
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
                  
                  // 转换为数组格式，便于展示
                  const statsArray = Object.keys(stats).map(location => ({
                    location,
                    count: stats[location].count,
                    totalPax: stats[location].totalPax,
                    tourGroupIds: stats[location].tourGroupIds // 添加团队ID数组
                  }));
                  
                  setDateLocationStats(statsArray);
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
                
                return (
                  <div 
                    key={containerId} 
                    className="tour-container"
                    style={{ 
                      position: 'absolute',
                              top: `${40 + startIdx * 70}px`,
                              height: `${segmentDates.length * 70}px`,
                              left: 0,
                              right: 0,
                              margin: '0 5px'
                    }}
                    onDragEnter={(e) => handleContainerDragEnter(e, containerId)}
                    onDragOver={(e) => e.preventDefault()}
                  >
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
    </div>
  );
};

export default TourScheduleTable; 