import React, { useState, useEffect } from 'react';
import { Form, Input, Button, Card, InputNumber, Select, Upload, message, Space, Tabs, List, Modal, Tooltip, DatePicker, Table, Divider, Empty, Avatar, Tag, Dropdown, Menu, Row, Col, Spin, Alert, Switch } from 'antd';
import { ArrowLeftOutlined, PlusOutlined, DeleteOutlined, EditOutlined, ExclamationCircleOutlined, MoreOutlined, EnvironmentOutlined, ClockCircleOutlined, DollarOutlined, CheckCircleOutlined, QuestionCircleOutlined, CompassOutlined } from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import { getGroupTourById, updateGroupTour, createGroupTour, uploadGroupTourImage, getGroupTourAvailableDates, addGroupTourAvailableDate, deleteGroupTourAvailableDate, getGroupTourItinerary, addGroupTourItinerary, updateGroupTourItinerary, deleteGroupTourItinerary, getGroupTourThemes, getGroupTourSuitables, getGroupTourDayTours, saveGroupTourDayTours, addTheme, addSuitable } from '@/apis/grouptour';
import { getDayTourList } from '@/apis/daytour';
import DragDropTours from '@/components/DragDropTours';
import ImageUpload from '@/components/ImageUpload';
import './GroupTourDetail.scss';
import { groupBy } from 'lodash';

const { Option } = Select;
const { TextArea } = Input;
const { TabPane } = Tabs;
const { confirm } = Modal;
const { RangePicker } = DatePicker;

const GroupTourDetail = () => {
  const [form] = Form.useForm();
  const [itineraryForm] = Form.useForm();
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const [dayTourLoading, setDayTourLoading] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const [isEdit, setIsEdit] = useState(false);
  const [groupTourId, setGroupTourId] = useState(null);
  const [availableDates, setAvailableDates] = useState([]);
  const [itineraries, setItineraries] = useState([]);
  const [themes, setThemes] = useState([]);
  const [suitables, setSuitables] = useState([]);
  const [newDate, setNewDate] = useState({ startDate: '', endDate: '', adultPrice: 0, childPrice: 0, maxPeople: 20 });
  const [editingItinerary, setEditingItinerary] = useState(null);
  const [itineraryModalVisible, setItineraryModalVisible] = useState(false);
  
  // 添加缺失的状态变量
  const [highlights, setHighlights] = useState([]);
  const [inclusions, setInclusions] = useState([]);
  const [exclusions, setExclusions] = useState([]);
  const [tips, setTips] = useState([]);
  const [faqs, setFaqs] = useState([]);
  const [tourImages, setTourImages] = useState([]);
  
  // 新增状态变量，用于管理一日游关联
  const [dayTours, setDayTours] = useState([]);
  const [selectedDayTours, setSelectedDayTours] = useState([]);
  const [daysCount, setDaysCount] = useState(1);
  const [activeTab, setActiveTab] = useState("1");
  const [dayTourSearchText, setDayTourSearchText] = useState('');
  const [dayTourLocationFilter, setDayTourLocationFilter] = useState('');
  const [filteredDayTours, setFilteredDayTours] = useState([]);
  const [allDayTours, setAllDayTours] = useState([]);
  // 添加状态变量，用于添加新主题和适合人群
  const [newThemeName, setNewThemeName] = useState('');
  const [newSuitableName, setNewSuitableName] = useState('');
  const [selectedThemes, setSelectedThemes] = useState([]);
  const [selectedSuitable, setSelectedSuitable] = useState([]);

  // 在状态变量部分添加一个临时选择变量
  const [tempSelectedDayTours, setTempSelectedDayTours] = useState([]);
  const [bulkMode, setBulkMode] = useState(false);
  // 添加状态变量记录当前选择的天数
  const [currentSelectedDay, setCurrentSelectedDay] = useState(undefined);

  // 添加一个辅助函数，用于重置所有选择天数下拉框
  const resetAllDaySelectors = () => {
    // 重置当前选择的天数状态
    setCurrentSelectedDay(undefined);
    
    // 使用setTimeout确保组件渲染完成后再操作DOM
    setTimeout(() => {
      // 找到所有下拉框并重置
      document.querySelectorAll('select').forEach(select => {
        if (select.getAttribute('placeholder') === '选择天数') {
          select.value = '';
        }
      });
      
      // 通过更新ant-select的值来重置
      document.querySelectorAll('.ant-select-selection-item').forEach(item => {
        if (item.textContent.includes('第') && item.textContent.includes('天')) {
          // 尝试找到清除按钮并触发点击
          const clearIcon = item.parentElement.querySelector('.ant-select-clear');
          if (clearIcon) {
            clearIcon.click();
          }
        }
      });
    }, 0);
  };

  useEffect(() => {
    fetchThemes();
    fetchSuitables();
    fetchDayTours();
    
    const { state } = location;
    console.log('接收到的location state:', state);
    
    if (state && state.id) {
      console.log('获取到跟团游ID:', state.id);
      setIsEdit(true);
      setGroupTourId(state.id);
      fetchData(state.id);
      
      if (state.activeTab) {
        setActiveTab(state.activeTab);
      }
    } else {
      console.log('没有接收到跟团游ID，可能是新增操作');
    }
  }, [location]);

  // 添加监听天数变化的effect
  useEffect(() => {
    // 监听天数变化，获取当前表单中的天数值
    const currentDays = form.getFieldValue('days') || 1;
    if (currentDays !== daysCount) {
      setDaysCount(currentDays);
    }
    
    // 当天数减少时，处理已关联一日游的天数问题
    if (currentDays < daysCount && selectedDayTours.length > 0) {
      // 找出超出天数范围的一日游
      const outOfRangeTours = selectedDayTours.filter(tour => tour.dayNumber > currentDays);
      if (outOfRangeTours.length > 0) {
        // 将超出的一日游移到第一天
        const updatedTours = selectedDayTours.map(tour => {
          if (tour.dayNumber > currentDays) {
            return { ...tour, dayNumber: 1 };
          }
          return tour;
        });
        setSelectedDayTours(updatedTours);
        message.warning(`有${outOfRangeTours.length}个一日游超出天数范围，已移动到第1天`);
      }
    }
  }, [form.getFieldValue('days')]); // 使用表单值作为依赖

  const fetchData = async (id) => {
    try {
      setLoading(true);
      console.log('正在获取跟团游详情，ID:', id);
      const res = await getGroupTourById(id);
      if (res.code === 1) {
        console.log('获取跟团游详情成功:', res.data);
        
        // 解构获取到的数据
        const {
          id: tourId,
          name,
          description,
          price,
          discountedPrice,
          duration,
          location,
          departureAddress,
          themes,
          themeIds,
          suitableFor,
          suitableIds,
          highlights,
          inclusions,
          exclusions,
          tips,
          faqs,
          images,
          itinerary,
          days,
          nights,
          coverImage,
          // 其他字段...
        } = res.data;
        
        // 自动计算天数和晚数（如果未提供）
        let calculatedDays = days;
        let calculatedNights = nights;
        
        // 如果有duration但没有days/nights，尝试从duration解析
        if (duration && (!calculatedDays || !calculatedNights)) {
          const durationMatch = duration.match(/(\d+)\s*天\s*(\d+)\s*晚/);
          if (durationMatch) {
            calculatedDays = parseInt(durationMatch[1]) || calculatedDays;
            calculatedNights = parseInt(durationMatch[2]) || calculatedNights;
          }
        }
        
        // 设置表单值
        form.setFieldsValue({
          title: name, // 使用name字段作为title
          location: location,
          duration: duration,
          price: price,
          days: calculatedDays,
          nights: calculatedNights,
          description: description,
          departureAddress: departureAddress,
          // 设置主题和适合人群
          themes: themeIds || [], // 使用themeIds
          suitableFor: suitableIds || [], // 使用suitableIds
          
          // 设置亮点、包含、不包含和提示
          highlights: highlights || [],
          inclusions: inclusions || [],
          exclusions: exclusions || [],
          tips: tips || [],
        });

        // 设置状态变量
        setGroupTourId(tourId || id); // 如果返回的id为空，使用原有id
        setImageUrl(coverImage);
        
        // 设置所选主题和适合人群
        setSelectedThemes(themeIds || []);
        setSelectedSuitable(suitableIds || []);
        
        // 设置亮点、包含项目、不包含项目和提示
        if (highlights) setHighlights(highlights);
        if (inclusions) setInclusions(inclusions);
        if (exclusions) setExclusions(exclusions);
        if (tips) setTips(tips);
        
        // 设置FAQ
        if (faqs) setFaqs(faqs);
        
        // 设置图片
        if (images && images.length) setTourImages(images);
        
        // 设置行程
        if (itinerary) setItineraries(itinerary);
        
        // 获取可用日期
        fetchAvailableDates(id);
        
        // 获取已关联的一日游
        fetchRelatedDayTours(id);
      } else {
        message.error(res.msg || '获取团队游详情失败');
      }
    } catch (error) {
      console.error('获取团队游详情失败:', error);
      message.error('获取团队游详情失败');
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableDates = async (id) => {
    try {
      const res = await getGroupTourAvailableDates(id);
      if (res.code === 1) {
        setAvailableDates(res.data || []);
      } else {
        message.error(res.msg || '获取可用日期列表失败');
      }
    } catch (error) {
      console.error('获取可用日期列表失败:', error);
      message.error('获取可用日期列表失败');
    }
  };

  const fetchItineraries = async (id) => {
    try {
      const res = await getGroupTourItinerary(id);
      if (res.code === 1) {
        // 确保每个行程项有一个唯一ID，如果原本没有ID
        const formattedItineraries = (res.data || []).map(item => ({
          ...item,
          id: item.id || `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}` // 生成临时ID
        }));
        setItineraries(formattedItineraries);
      } else {
        message.error(res.msg || '获取行程安排失败');
      }
    } catch (error) {
      console.error('获取行程安排失败:', error);
      message.error('获取行程安排失败');
    }
  };

  const fetchThemes = async () => {
    try {
      const res = await getGroupTourThemes();
      if (res.code === 1) {
        setThemes(res.data || []);
      }
    } catch (error) {
      console.error('获取主题列表失败:', error);
    }
  };

  const fetchSuitables = async () => {
    try {
      const res = await getGroupTourSuitables();
      if (res.code === 1) {
        setSuitables(res.data || []);
      }
    } catch (error) {
      console.error('获取适合人群列表失败:', error);
    }
  };

  const fetchDayTours = async () => {
    try {
      setDayTourLoading(true);
      const res = await getDayTourList({
        page: 1,
        pageSize: 100, // 获取更多一日游用于选择
        status: 1 // 只获取已上架的一日游
      });
      
      if (res.code === 1) {
        console.log('一日游列表:', res.data.records);
        const tours = res.data.records.map(tour => ({
          ...tour,
          dayTourId: tour.id, // 确保dayTourId属性存在
          id: tour.dayTourId || tour.id
        }));
        
        setAllDayTours(tours);
        setFilteredDayTours(tours);
        
        // 如果是编辑模式，获取已关联的一日游
        if (isEdit && groupTourId) {
          fetchRelatedDayTours(groupTourId);
        }
      } else {
        message.error(res.msg || '获取一日游列表失败');
      }
    } catch (error) {
      console.error('获取一日游列表失败:', error);
      message.error('获取一日游列表失败');
    } finally {
      setDayTourLoading(false);
    }
  };

  const fetchRelatedDayTours = async (tourId) => {
    try {
      console.log('fetchRelatedDayTours被调用');
      setDayTourLoading(true);
      const res = await getGroupTourDayTours(tourId);
      
      if (res.code === 1) {
        console.log('已关联的一日游:', res.data);
        
        // 处理返回的数据，确保格式正确
        const relatedTours = res.data.map(tour => ({
          ...tour,
          dayTourId: tour.dayTourId, // 确保有dayTourId
          id: tour.id || tour.dayTourId, // 确保有id
          isOptional: tour.isOptional === 1 || tour.isOptional === true
        }));
        
        setSelectedDayTours(relatedTours);
      } else {
        message.error(res.msg || '获取已关联一日游失败');
      }
    } catch (error) {
      console.error('获取已关联一日游失败:', error);
      message.error('获取已关联一日游失败');
    } finally {
      setDayTourLoading(false);
    }
  };

  const handleSubmit = async (values) => {
    try {
      setLoading(true);
      console.log('提交的表单数据:', values);
      
      // 准备提交的数据
      const tourData = {
        id: groupTourId,
        name: values.title,
        description: values.description,
        price: values.price,
        discountedPrice: values.discountedPrice || values.price, // 如果未设置折扣价格，使用原价
        duration: values.duration,
        location: values.location,
        departureAddress: values.departureAddress,
        days: values.days,
        nights: values.nights,
        coverImage: imageUrl,
        
        // 确保主题和适合人群数据正确
        themeIds: selectedThemes || [],
        suitableIds: selectedSuitable || [],
        
        // 添加亮点、包含项目、不包含项目和提示数据
        highlights: values.highlights || [],
        inclusions: values.inclusions || [],
        exclusions: values.exclusions || [],
        tips: values.tips || [],
        
        // 添加图片数据
        images: tourImages || [],
        
        // 其他需要的字段
      };

      let res;
      if (isEdit) {
        res = await updateGroupTour(tourData);
      } else {
        res = await createGroupTour(tourData);
      }

      if (res.code === 1) {
        message.success(isEdit ? '更新成功' : '创建成功');
        
        if (!isEdit) {
          setIsEdit(true);
          setGroupTourId(res.data);
        }
        
        // 切换到可用日期标签页
        setActiveTab('2');
      } else {
        message.error(res.msg || (isEdit ? '更新失败' : '创建失败'));
      }
    } catch (error) {
      console.error(isEdit ? '更新失败:' : '创建失败:', error);
      message.error(isEdit ? '更新失败' : '创建失败');
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (info) => {
    if (info.file.status === 'uploading') {
      return;
    }
    if (info.file.status === 'done') {
      // 上传图片到服务器
      const formData = new FormData();
      formData.append('file', info.file.originFileObj);
      
      try {
        const res = await uploadGroupTourImage(formData);
        if (res.code === 1) {
          setImageUrl(res.data.url);
          message.success('图片上传成功');
        } else {
          message.error(res.msg || '图片上传失败');
        }
      } catch (error) {
        console.error('图片上传失败:', error);
        message.error('图片上传失败');
      }
    }
  };

  const formatDate = (date) => {
    if (!date) return '';
    return date.toISOString().split('T')[0]; // 返回 YYYY-MM-DD 格式
  };

  const handleDateRangeChange = (dates) => {
    if (dates) {
      setNewDate({
        ...newDate,
        startDate: formatDate(dates[0].toDate()),
        endDate: formatDate(dates[1].toDate())
      });
    } else {
      setNewDate({
        ...newDate,
        startDate: '',
        endDate: ''
      });
    }
  };

  const handleAddAvailableDate = async () => {
    if (!groupTourId) {
      message.error('请先保存基本信息');
      return;
    }

    if (!newDate.startDate || !newDate.endDate) {
      message.error('请选择日期范围');
      return;
    }

    try {
      const dateData = {
        groupTourId: groupTourId,
        ...newDate
      };
      
      const res = await addGroupTourAvailableDate(dateData);
      if (res.code === 1) {
        message.success('添加可用日期成功');
        setNewDate({ startDate: '', endDate: '', adultPrice: 0, childPrice: 0, maxPeople: 20 });
        fetchAvailableDates(groupTourId);
      } else {
        message.error(res.msg || '添加可用日期失败');
      }
    } catch (error) {
      console.error('添加可用日期失败:', error);
      message.error('添加可用日期失败');
    }
  };

  const handleDeleteAvailableDate = (dateId) => {
    confirm({
      title: '确定要删除此可用日期吗?',
      icon: <ExclamationCircleOutlined />,
      content: '此操作不可逆，请谨慎操作。',
      onOk: async () => {
        try {
          const res = await deleteGroupTourAvailableDate(dateId);
          if (res.code === 1) {
            message.success('删除成功');
            fetchAvailableDates(groupTourId);
          } else {
            message.error(res.msg || '删除失败');
          }
        } catch (error) {
          console.error('删除可用日期失败:', error);
          message.error('删除可用日期失败');
        }
      },
    });
  };

  const showItineraryModal = (itinerary = null) => {
    setEditingItinerary(itinerary);
    if (itinerary) {
      itineraryForm.setFieldsValue({
        day: itinerary.day,
        title: itinerary.title,
        description: itinerary.description,
        meals: itinerary.meals,
        accommodation: itinerary.accommodation,
      });
    } else {
      itineraryForm.resetFields();
    }
    setItineraryModalVisible(true);
  };

  const handleItineraryOk = async () => {
    try {
      const values = await itineraryForm.validateFields();
      const itineraryData = {
        ...values,
        groupTourId: groupTourId,
      };

      let res;
      if (editingItinerary) {
        itineraryData.id = editingItinerary.id;
        res = await updateGroupTourItinerary(itineraryData);
      } else {
        res = await addGroupTourItinerary(itineraryData);
      }

      if (res.code === 1) {
        message.success(editingItinerary ? '更新行程成功' : '添加行程成功');
        setItineraryModalVisible(false);
        fetchItineraries(groupTourId);
        
        // 如果选择了一日游，也同时关联这个一日游到这一天
        if (values.dayTourId) {
          // 查找选中的一日游数据
          const selectedDayTour = dayTours.find(tour => 
            tour.id === values.dayTourId || tour.dayTourId === values.dayTourId
          );
          
          if (selectedDayTour) {
            // 检查是否已经关联
            const alreadyRelated = selectedDayTours.some(
              tour => (tour.dayTourId === values.dayTourId || tour.dayTourId === selectedDayTour.id) && 
                       tour.dayNumber === values.day
            );
            
            if (!alreadyRelated) {
              // 添加到关联的一日游中
              const newDayTour = {
                id: Date.now(), // 临时ID
                dayTourId: values.dayTourId || selectedDayTour.id,
                dayNumber: values.day,
                isOptional: false, // 默认为必选项
                // 添加额外信息以便前端显示
                dayTourName: selectedDayTour.name || selectedDayTour.title,
                location: selectedDayTour.location,
                duration: selectedDayTour.duration,
                price: selectedDayTour.price
              };
              
              const updatedDayTours = [...selectedDayTours, newDayTour];
              setSelectedDayTours(updatedDayTours);
              
              // 保存关联的一日游
              saveDayTourRelations();
            } else {
              message.info('该日期已关联此一日游');
            }
          }
        }
      } else {
        message.error(res.msg || (editingItinerary ? '更新行程失败' : '添加行程失败'));
      }
    } catch (error) {
      console.error(editingItinerary ? '更新行程失败:' : '添加行程失败:', error);
      message.error(editingItinerary ? '更新行程失败' : '添加行程失败');
    }
  };

  const handleDeleteItinerary = (itineraryId) => {
    confirm({
      title: '确定要删除此行程吗?',
      icon: <ExclamationCircleOutlined />,
      content: '此操作不可逆，请谨慎操作。',
      onOk: async () => {
        try {
          const res = await deleteGroupTourItinerary(itineraryId);
          if (res.code === 1) {
            message.success('删除成功');
            fetchItineraries(groupTourId);
          } else {
            message.error(res.msg || '删除失败');
          }
        } catch (error) {
          console.error('删除行程失败:', error);
          message.error('删除行程失败');
        }
      },
    });
  };

  const handleBack = () => {
    navigate('/grouptour');
  };

  const saveDayTourRelations = async () => {
    try {
      if (!groupTourId) {
        message.warning('请先保存跟团游基本信息');
        return;
      }
      
      setDayTourLoading(true);
      
      // 格式化一日游数据，确保与后端API期望的格式一致
      const formattedDayTours = selectedDayTours.map(tour => ({
        dayTourId: tour.dayTourId || tour.id,
        dayNumber: tour.dayNumber,
        isOptional: tour.isOptional ? 1 : 0
      }));
      
      console.log('保存关联一日游数据:', formattedDayTours);
      
      const res = await saveGroupTourDayTours({
        groupTourId: groupTourId,
        dayTours: formattedDayTours
      });
        
      if (res.code === 1) {
        console.log('关联一日游保存成功');
        message.success('关联一日游保存成功');
        
        if (formattedDayTours.length === 0) {
          console.log('没有一日游数据');
        } else {
          // 重新获取一下最新的关联数据
          fetchRelatedDayTours(groupTourId);
        }
      } else {
        message.error(res.msg || '关联一日游保存失败');
      }
    } catch (error) {
      console.error('保存关联一日游失败:', error);
      message.error('保存关联一日游失败');
    } finally {
      setDayTourLoading(false);
    }
  };

  const addDayTourToItinerary = (dayTour, dayNumber, isOptional = false) => {
    // 获取正确的dayTourId
    const dayTourId = dayTour.dayTourId || dayTour.id;
    
    // 在批量模式下，先加入临时列表而不是直接添加
    if (bulkMode) {
      // 检查临时列表中是否已存在
      const existsInTemp = tempSelectedDayTours.some(
        item => item.dayTourId === dayTourId && item.dayNumber === dayNumber
      );
      
      // 检查已提交列表中是否已存在
      const existsInSelected = selectedDayTours.some(
        item => item.dayTourId === dayTourId && item.dayNumber === dayNumber
      );
      
      if (existsInTemp || existsInSelected) {
        message.warning('该日期已添加此一日游');
        return;
      }
      
      // 获取当前一日游的详细信息
      const dayTourDetails = allDayTours.find(tour => 
        tour.dayTourId === dayTourId || tour.id === dayTourId
      ) || dayTour;
      
      const newItem = {
        id: Date.now(), 
        dayTourId: dayTourId,
        dayNumber: dayNumber,
        isOptional: isOptional,
        dayTourName: dayTourDetails.name || dayTourDetails.title,
        location: dayTourDetails.location,
        duration: dayTourDetails.duration,
        price: dayTourDetails.price
      };
      
      setTempSelectedDayTours([...tempSelectedDayTours, newItem]);
      message.success(`已添加${dayTourDetails.name || dayTourDetails.title}到待提交列表`);
      
      // 更新总天数
      if (dayNumber > daysCount) {
        setDaysCount(dayNumber);
      }
      
      return;
    }
    
    // 非批量模式下的原逻辑
    // 检查当前选中的一日游是否已经添加到指定天数
    const exists = selectedDayTours.some(
      item => item.dayTourId === dayTourId && item.dayNumber === dayNumber
    );
    
    if (exists) {
      message.warning('该日期已添加此一日游');
      return;
    }
    
    // 获取当前一日游的详细信息
    const dayTourDetails = allDayTours.find(tour => 
      tour.dayTourId === dayTourId || tour.id === dayTourId
    ) || dayTour;
    
    console.log(`添加一日游：${dayTourDetails.name || dayTourDetails.title} 到第${dayNumber}天`);
    
    const newItem = {
      id: Date.now(), // 临时ID，保存时会由后端分配真实ID
      dayTourId: dayTourId,
      dayNumber: dayNumber,
      isOptional: isOptional,
      // 添加额外信息方便显示
      dayTourName: dayTourDetails.name || dayTourDetails.title,
      location: dayTourDetails.location,
      duration: dayTourDetails.duration,
      price: dayTourDetails.price
    };
    
    setSelectedDayTours([...selectedDayTours, newItem]);
    message.success(`已添加${dayTourDetails.name || dayTourDetails.title}到第${dayNumber}天`);
    
    // 更新总天数
    if (dayNumber > daysCount) {
      setDaysCount(dayNumber);
    }
  };
  
  const removeDayTourFromItinerary = (itemId) => {
    setSelectedDayTours(selectedDayTours.filter(item => item.id !== itemId));
  };
  
  const toggleDayTourOptional = (itemId) => {
    setSelectedDayTours(
      selectedDayTours.map(item => 
        item.id === itemId ? { ...item, isOptional: !item.isOptional } : item
      )
    );
  };
  
  const renderDayTourSelector = () => {
    const dayOptions = Array.from({ length: daysCount + 1 }, (_, i) => ({ 
      value: i + 1, 
      label: `第${i + 1}天` 
    }));
    
    const columns = [
      {
        title: '名称',
        dataIndex: 'name',
        key: 'name',
      },
      {
        title: '地点',
        dataIndex: 'location',
        key: 'location',
      },
      {
        title: '时长',
        dataIndex: 'duration',
        key: 'duration',
      },
      {
        title: '价格',
        dataIndex: 'price',
        key: 'price',
        render: price => `$${price}`
      },
      {
        title: '操作',
        key: 'action',
        render: (_, record) => (
          <Space size="middle">
            <Select
              placeholder="选择天数"
              style={{ width: 100 }}
              options={dayOptions}
              onChange={(value) => addDayTourToItinerary(record, value)}
            />
          </Space>
        ),
      },
    ];
    
    return (
      <div>
        <div className="day-tour-section">
          <h3>选择要添加的一日游</h3>
          <Table 
            dataSource={dayTours} 
            columns={columns} 
            rowKey="dayTourId"
            pagination={{ pageSize: 5 }}
            size="small"
            scroll={{ y: 300 }}
          />
        </div>
        
        <div className="day-tour-section">
          <h3>已安排的一日游行程</h3>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
            <Button 
              type="primary"
              onClick={() => setDaysCount(daysCount + 1)}
            >
              添加一天
            </Button>
            <Button 
              type="primary"
              onClick={saveDayTourRelations}
            >
              保存安排
            </Button>
          </div>
          
          {daysCount > 0 ? (
            Array.from({ length: daysCount }, (_, i) => {
              const dayNumber = i + 1;
              const dayTourItems = selectedDayTours.filter(item => item.dayNumber === dayNumber);
              
              return (
                <Card 
                  title={`第${dayNumber}天行程`} 
                  key={dayNumber}
                  className="day-card"
                  size="small"
                  style={{ marginBottom: '16px' }}
                >
                  {dayTourItems.length === 0 ? (
                    <p>未安排行程，请从上方列表中选择一日游</p>
                  ) : (
                    <List
                      size="small"
                      dataSource={dayTourItems}
                      renderItem={item => {
                        // 使用dayTourName显示名称，这是从API获取的
                        const tourName = item.dayTourName || 
                          (dayTours.find(tour => tour.dayTourId === item.dayTourId)?.name || '未知一日游');
                        
                        return (
                          <List.Item
                            actions={[
                              <Button 
                                type={item.isOptional ? "primary" : "default"} 
                                size="small"
                                onClick={() => toggleDayTourOptional(item.id)}
                              >
                                {item.isOptional ? '可选项' : '必选项'}
                              </Button>,
                              <Button 
                                type="danger" 
                                size="small"
                                icon={<DeleteOutlined />}
                                onClick={() => removeDayTourFromItinerary(item.id)}
                              />
                            ]}
                          >
                            <div>
                              <div style={{ fontWeight: 'bold' }}>{tourName}</div>
                              <div style={{ fontSize: '12px', color: '#888' }}>
                                {item.location && <span>地点: {item.location}</span>}
                                {item.duration && <span style={{ marginLeft: '10px' }}>时长: {item.duration}</span>}
                                {item.price && <span style={{ marginLeft: '10px' }}>价格: ${item.price}</span>}
                              </div>
                            </div>
                          </List.Item>
                        );
                      }}
                    />
                  )}
                </Card>
              );
            })
          ) : (
            <div className="empty-message">
              <p>尚未安排行程天数</p>
              <Button type="primary" onClick={() => setDaysCount(1)}>设置为1天</Button>
            </div>
          )}
        </div>
      </div>
    );
  };

  const handleTabChange = (key) => {
    setActiveTab(key);
  };

  const handleAddTheme = async () => {
    if (!newThemeName || newThemeName.trim() === '') {
      message.warning('请输入主题名称');
      return;
    }

    try {
      const res = await addTheme({ name: newThemeName.trim() });
      if (res.code === 1) {
        message.success('添加新主题成功');
        
        // 添加到主题列表中
        const newTheme = res.data;
        setThemes([...themes, newTheme]);
        
        // 更新当前选择的主题
        const currentThemes = form.getFieldValue('themes') || [];
        form.setFieldsValue({ themes: [...currentThemes, newTheme.id] });
        
        // 清空输入框
        setNewThemeName('');
      } else {
        message.error(res.msg || '添加新主题失败');
      }
    } catch (error) {
      console.error('添加新主题失败:', error);
      message.error('添加新主题失败');
    }
  };

  const handleAddSuitable = async () => {
    if (!newSuitableName || newSuitableName.trim() === '') {
      message.warning('请输入适合人群名称');
      return;
    }

    try {
      const res = await addSuitable({ name: newSuitableName.trim() });
      if (res.code === 1) {
        message.success('添加新适合人群成功');
        
        // 添加到适合人群列表中
        const newSuitable = res.data;
        setSuitables([...suitables, newSuitable]);
        
        // 更新当前选择的适合人群
        const currentSuitables = form.getFieldValue('suitableFor') || [];
        form.setFieldsValue({ suitableFor: [...currentSuitables, newSuitable.id] });
        
        // 清空输入框
        setNewSuitableName('');
      } else {
        message.error(res.msg || '添加新适合人群失败');
      }
    } catch (error) {
      console.error('添加新适合人群失败:', error);
      message.error('添加新适合人群失败');
    }
  };

  // 渲染一日游关联标签页内容
  const renderDayToursTabContent = () => {
    return (
      <div className="day-tours-tab">
        <Spin spinning={dayTourLoading}>
          <Alert
            message="拖拽提示"
            description="您可以通过拖拽来关联或移动一日游，从左侧拖到右侧添加一日游，从右侧拖回左侧移除一日游，也可以在不同天数之间拖动调整。"
            type="info"
            showIcon
            style={{ marginBottom: '20px' }}
          />
          
          <DragDropTours
            allDayTours={allDayTours}
            selectedDayTours={selectedDayTours}
            daysCount={form.getFieldValue('days') || daysCount}
            loading={dayTourLoading}
            onSelectedToursChange={(tours) => {
              setSelectedDayTours(tours);
            }}
          />
          
          <div style={{ marginTop: '16px', textAlign: 'center' }}>
            <Button 
              type="primary" 
              onClick={saveDayTourRelations} 
              style={{ marginRight: '8px' }}
            >
              保存关联
            </Button>
            <Button 
              type="primary"
              onClick={generateItineraryFromDayTours}
            >
              根据关联一日游生成行程
            </Button>
          </div>
        </Spin>
      </div>
    );
  };
  
  // 根据关联一日游生成行程安排
  const generateItineraryFromDayTours = () => {
    // 检查是否有关联的一日游
    if (!selectedDayTours || selectedDayTours.length === 0) {
      message.warning('请先添加关联的一日游');
      return;
    }

    // 先删除现有的所有行程
    // 清空前端状态中的行程
    setItineraries([]);
    
    // 按天数分组
    const dayToursGroupedByDay = groupBy(selectedDayTours, 'dayNumber');
    
    // 遍历每天的一日游，生成行程项
    const newItineraries = [];

    Object.keys(dayToursGroupedByDay).forEach(day => {
      const toursForDay = dayToursGroupedByDay[day];
      const tourTitles = toursForDay.map(tour => tour.dayTourName).join('、');
      
      // 创建行程项
      const itineraryItem = {
        id: null, // ID将由后端生成
        groupTourId: groupTourId,
        day: parseInt(day),
        title: `第${day}天: ${tourTitles}`,
        description: toursForDay.map(tour => `${tour.dayTourName}: ${tour.location}`).join('\n'),
        meals: '早午晚餐', // 默认值，可以根据实际情况调整
        accommodation: '舒适酒店', // 默认住宿信息
      };
      
      newItineraries.push(itineraryItem);
    });

    // 更新状态
    setItineraries(newItineraries);
    
    // 保存到后端
    saveItineraries(newItineraries);
    
    message.success('已根据关联的一日游生成行程安排');
  };

  // 保存行程安排
  const saveItineraries = async (itinerariesData) => {
    setLoading(true);
    try {
      // 使用Promise.all并行处理所有行程的保存
      await Promise.all(itinerariesData.map(async (item) => {
        try {
          await addGroupTourItinerary(item);
        } catch (error) {
          console.error(`保存第${item.day}天行程失败:`, error);
          // 继续处理其他行程，不中断流程
        }
      }));

      // 保存完成后，重新获取行程
      const result = await getGroupTourItinerary(groupTourId);
      if (result.code === 1) {
        setItineraries(result.data || []);
        message.success('行程保存成功');
      }
    } catch (error) {
      console.error('保存行程失败:', error);
      message.error('保存部分行程失败，请检查后重试');
    } finally {
      setLoading(false);
    }
  };

  // 处理一日游过滤
  const handleDayTourFilter = (e) => {
    const value = e.target.value.toLowerCase();
    if (!value) {
      setFilteredDayTours(allDayTours);
      return;
    }
    
    const filtered = allDayTours.filter(tour => 
      (tour.name && tour.name.toLowerCase().includes(value)) || 
      (tour.location && tour.location.toLowerCase().includes(value))
    );
    
    setFilteredDayTours(filtered);
  };

  // 已关联一日游的表格列定义
  const selectedDayToursColumns = [
    {
      title: '日期',
      dataIndex: 'dayNumber',
      key: 'dayNumber',
      render: (text) => `第${text}天`
    },
    {
      title: '一日游名称',
      dataIndex: 'dayTourName',
      key: 'dayTourName'
    },
    {
      title: '地点',
      dataIndex: 'location',
      key: 'location'
    },
    {
      title: '时长',
      dataIndex: 'duration',
      key: 'duration'
    },
    {
      title: '价格',
      dataIndex: 'price',
      key: 'price',
      render: (text) => `¥${text}`
    },
    {
      title: '是否可选',
      dataIndex: 'isOptional',
      key: 'isOptional',
      render: (isOptional) => isOptional ? '是' : '否'
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Space size="small">
          <Button 
            type="text" 
            danger 
            icon={<DeleteOutlined />}
            onClick={() => removeDayTourFromItinerary(record.id)}
          />
          <Button
            type="text"
            icon={record.isOptional ? <CheckCircleOutlined /> : <QuestionCircleOutlined />}
            onClick={() => toggleDayTourOptional(record.id)}
          />
        </Space>
      )
    }
  ];

  // 可选一日游的表格列定义
  const availableDayToursColumns = [
    {
      title: '一日游名称',
      dataIndex: 'name',
      key: 'name'
    },
    {
      title: '地点',
      dataIndex: 'location',
      key: 'location'
    },
    {
      title: '时长',
      dataIndex: 'duration',
      key: 'duration'
    },
    {
      title: '价格',
      dataIndex: 'price',
      key: 'price',
      render: (text) => `¥${text}`
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <div>
          <Select
            placeholder="请选择要添加到哪一天"
            style={{ width: 100, marginRight: 8 }}
            allowClear
            options={Array.from({ length: daysCount }, (_, i) => ({
              value: i + 1,
              label: `第${i + 1}天`
            }))}
            onChange={(value) => {
              // 保存当前选择的天数
              setCurrentSelectedDay(value);
              addDayTourToItinerary(record, value);
            }}
            value={currentSelectedDay}
          />
          <Button
            type="link"
            onClick={() => {
              Modal.confirm({
                title: '可选项',
                content: '是否将此项设为可选行程？',
                okText: '是',
                cancelText: '否',
                onOk: () => addDayTourToItinerary(record, 1, true),
                onCancel: () => addDayTourToItinerary(record, 1, false)
              });
            }}
          >
            添加
          </Button>
        </div>
      )
    }
  ];

  return (
    <div className="group-tour-detail-container">
      <Card
        title={
          <Space>
            <Button icon={<ArrowLeftOutlined />} onClick={handleBack} type="link" />
            {isEdit ? '编辑跟团游' : '添加跟团游'}
          </Space>
        }
        extra={
          <Space>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => navigate('/daytour/add')}
            >
              添加一日游
            </Button>
            <Button
              type="primary"
              onClick={() => navigate('/theme/manage')}
            >
              主题管理
            </Button>
            <Button
              type="primary"
              onClick={() => navigate('/suitable/manage')}
            >
              适合人群管理
            </Button>
          </Space>
        }
      >
        <Tabs defaultActiveKey="basic" onChange={setActiveTab} items={[
          {
            key: 'basic',
            label: '基本信息',
            children: (
            <Form
              form={form}
              layout="vertical"
              onFinish={handleSubmit}
            >
                <Row gutter={16}>
                  <Col span={12}>
              <Form.Item
                      name="title"
                      label="标题"
                      rules={[{ required: true, message: '请输入标题' }]}
                    >
                      <Input placeholder="请输入标题" />
              </Form.Item>
                  </Col>
                  <Col span={12}>
              <Form.Item
                name="location"
                label="目的地"
                rules={[{ required: true, message: '请输入目的地' }]}
              >
                <Input placeholder="请输入目的地" />
              </Form.Item>
                  </Col>
                </Row>

                <Row gutter={16}>
                  <Col span={8}>
              <Form.Item
                name="duration"
                label="持续时间"
                rules={[{ required: true, message: '请输入持续时间' }]}
              >
                      <Input 
                        placeholder="请输入持续时间，例如：3天2晚" 
                        onChange={(e) => {
                          const durationValue = e.target.value;
                          const durationMatch = durationValue.match(/(\d+)\s*天\s*(\d+)\s*晚/);
                          if (durationMatch) {
                            const days = parseInt(durationMatch[1]);
                            const nights = parseInt(durationMatch[2]);
                            if (days && nights) {
                              // 更新天数和晚数字段
                              form.setFieldsValue({
                                days: days,
                                nights: nights
                              });
                            }
                          }
                        }}
                      />
              </Form.Item>
                  </Col>
                  <Col span={8}>
                    <Form.Item
                      name="days"
                      label="天数"
                      rules={[{ required: true, message: '请输入天数' }]}
                    >
                      <InputNumber 
                        min={1} 
                        style={{ width: '100%' }} 
                        placeholder="请输入天数"
                        onChange={(value) => {
                          if (value) {
                            // 获取当前晚数
                            const nights = form.getFieldValue('nights') || 0;
                            // 更新持续时间字段
                            form.setFieldsValue({
                              duration: `${value}天${nights}晚`
                            });
                          }
                        }}
                      />
                    </Form.Item>
                  </Col>
                  <Col span={8}>
                    <Form.Item
                      name="nights"
                      label="晚数"
                      rules={[{ required: true, message: '请输入晚数' }]}
                    >
                      <InputNumber 
                        min={0} 
                        style={{ width: '100%' }} 
                        placeholder="请输入晚数"
                        onChange={(value) => {
                          // 获取当前天数
                          const days = form.getFieldValue('days') || 0;
                          if (days) {
                            // 更新持续时间字段
                            form.setFieldsValue({
                              duration: `${days}天${value}晚`
                            });
                          }
                        }}
                      />
                    </Form.Item>
                  </Col>
                </Row>

                <Row gutter={16}>
                  <Col span={12}>
              <Form.Item
                name="price"
                label="成人价格"
                rules={[{ required: true, message: '请输入成人价格' }]}
              >
                <InputNumber 
                  min={0} 
                  placeholder="请输入成人价格" 
                  style={{ width: '100%' }} 
                  formatter={value => `¥ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  parser={value => value.replace(/\¥\s?|(,*)/g, '')}
                />
              </Form.Item>
                  </Col>
                  <Col span={12}>
              <Form.Item
                      name="discountedPrice"
                      label="折扣价格"
              >
                <InputNumber 
                  min={0} 
                        placeholder="请输入折扣价格" 
                  style={{ width: '100%' }} 
                  formatter={value => `¥ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  parser={value => value.replace(/\¥\s?|(,*)/g, '')}
                />
              </Form.Item>
                  </Col>
                </Row>

                <Row gutter={16}>
                  <Col span={12}>
              <Form.Item
                      name="departureAddress"
                      label="出发地址"
                      rules={[{ required: true, message: '请输入出发地址' }]}
                    >
                      <Input placeholder="请输入出发地址" />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item label="封面图片">
                      <Upload
                        listType="picture-card"
                        showUploadList={false}
                        customRequest={({ file, onSuccess }) => { 
                          // 这里只是用于阻止默认上传行为
                          setTimeout(() => {
                            onSuccess("ok");
                          }, 0);
                        }}
                        onChange={handleImageUpload}
                      >
                        {imageUrl ? (
                          <img
                            src={imageUrl}
                            alt="tour"
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                        ) : (
                          <div>
                            <PlusOutlined />
                            <div style={{ marginTop: 8 }}>上传</div>
                          </div>
                        )}
                      </Upload>
                    </Form.Item>
                  </Col>
                </Row>

                <Form.Item
                  name="description"
                  label="详细描述"
                  rules={[{ required: true, message: '请输入详细描述' }]}
                >
                  <TextArea rows={6} placeholder="请输入详细描述" />
                </Form.Item>

                <Row gutter={16}>
                  <Col span={12}>
                    <Form.Item
                      name="themes"
                label="主题"
                      rules={[{ required: false, message: '请选择主题' }]}
                    >
                      <Select 
                        mode="multiple" 
                        placeholder="请选择主题"
                        value={selectedThemes}
                        onChange={(values) => {
                          setSelectedThemes(values);
                          form.setFieldsValue({ themes: values });
                        }}
                        dropdownRender={menu => (
                          <div>
                            {menu}
                            <Divider style={{ margin: '4px 0' }} />
                            <div style={{ display: 'flex', padding: '8px' }}>
                              <Input 
                                placeholder="输入新主题" 
                                value={newThemeName}
                                onChange={(e) => setNewThemeName(e.target.value)}
                                style={{ flexGrow: 1, marginRight: '8px' }}
                              />
                              <Button 
                                type="primary"
                                icon={<PlusOutlined />}
                                onClick={handleAddTheme}
                              >
                                添加
                              </Button>
                            </div>
                          </div>
                        )}
                      >
                  {themes.map(theme => (
                          <Option key={theme.id} value={theme.id}>{theme.name}</Option>
                  ))}
                </Select>
              </Form.Item>
                  </Col>
                  <Col span={12}>
              <Form.Item
                name="suitableFor"
                label="适合人群"
                      rules={[{ required: false, message: '请选择适合人群' }]}
              >
                <Select 
                  mode="multiple" 
                  placeholder="请选择适合人群"
                        value={selectedSuitable}
                        onChange={(values) => {
                          setSelectedSuitable(values);
                          form.setFieldsValue({ suitableFor: values });
                        }}
                        dropdownRender={menu => (
                          <div>
                            {menu}
                            <Divider style={{ margin: '4px 0' }} />
                            <div style={{ display: 'flex', padding: '8px' }}>
                              <Input 
                                placeholder="输入新的适合人群" 
                                value={newSuitableName}
                                onChange={(e) => setNewSuitableName(e.target.value)}
                                style={{ flexGrow: 1, marginRight: '8px' }}
                              />
                              <Button 
                                type="primary"
                                icon={<PlusOutlined />}
                                onClick={handleAddSuitable}
                              >
                                添加
                              </Button>
                            </div>
                          </div>
                        )}
                >
                  {suitables.map(suitable => (
                          <Option key={suitable.id} value={suitable.id}>{suitable.name}</Option>
                  ))}
                </Select>
              </Form.Item>
                  </Col>
                </Row>

                <Form.Item label="亮点" name="highlights">
                  <Select
                    mode="tags"
                    style={{ width: '100%' }}
                    placeholder="输入亮点后按Enter添加"
                    tokenSeparators={[',']}
                  >
                    {highlights.map((item, index) => (
                      <Option key={`highlight-${index}`} value={item}>{item}</Option>
                    ))}
                  </Select>
              </Form.Item>

                <Form.Item label="包含项目" name="inclusions">
                  <Select
                    mode="tags"
                    style={{ width: '100%' }}
                    placeholder="输入包含项目后按Enter添加"
                    tokenSeparators={[',']}
                  >
                    {inclusions.map((item, index) => (
                      <Option key={`inclusion-${index}`} value={item}>{item}</Option>
                    ))}
                  </Select>
              </Form.Item>

                <Form.Item label="不包含项目" name="exclusions">
                  <Select
                    mode="tags"
                    style={{ width: '100%' }}
                    placeholder="输入不包含项目后按Enter添加"
                    tokenSeparators={[',']}
                  >
                    {exclusions.map((item, index) => (
                      <Option key={`exclusion-${index}`} value={item}>{item}</Option>
                    ))}
                  </Select>
              </Form.Item>

                <Form.Item label="旅行提示" name="tips">
                  <Select
                    mode="tags"
                    style={{ width: '100%' }}
                    placeholder="输入旅行提示后按Enter添加"
                    tokenSeparators={[',']}
                  >
                    {tips.map((item, index) => (
                      <Option key={`tip-${index}`} value={item}>{item}</Option>
                    ))}
                  </Select>
              </Form.Item>

              <Form.Item>
                <Button type="primary" htmlType="submit" loading={loading}>
                  {isEdit ? '更新' : '添加'}
                </Button>
              </Form.Item>
            </Form>
            )
          },
          {
            key: 'dates',
            label: '可用日期',
            disabled: !isEdit,
            children: (
            <div className="dates-container">
              <h4>添加新可用日期</h4>
              <div className="add-date-form">
                  <Row gutter={16}>
                    <Col span={8}>
                      <Form.Item label="日期范围">
                    <RangePicker 
                      onChange={handleDateRangeChange}
                      format="YYYY-MM-DD"
                          style={{ width: '100%' }}
                        />
                      </Form.Item>
                    </Col>
                    <Col span={6}>
                      <Form.Item label="成人价格">
                    <InputNumber 
                      min={0} 
                      value={newDate.adultPrice}
                      onChange={(value) => setNewDate({...newDate, adultPrice: value})}
                          style={{ width: '100%' }}
                        />
                      </Form.Item>
                    </Col>
                    <Col span={6}>
                      <Form.Item label="儿童价格">
                    <InputNumber 
                      min={0} 
                      value={newDate.childPrice}
                      onChange={(value) => setNewDate({...newDate, childPrice: value})}
                          style={{ width: '100%' }}
                        />
                      </Form.Item>
                    </Col>
                    <Col span={4}>
                      <Form.Item label="最大人数">
                    <InputNumber 
                      min={1} 
                      max={100}
                      value={newDate.maxPeople}
                      onChange={(value) => setNewDate({...newDate, maxPeople: value})}
                          style={{ width: '100%' }}
                    />
                      </Form.Item>
                    </Col>
                  </Row>
                    <Button type="primary" onClick={handleAddAvailableDate}>添加</Button>
              </div>

              <h4 style={{ marginTop: '20px' }}>已有可用日期列表</h4>
              <List
                bordered
                dataSource={availableDates}
                renderItem={item => (
                  <List.Item
                      key={item.id}
                    actions={[
                        <Tooltip key="delete" title="删除">
                        <Button 
                          type="text" 
                          danger 
                          icon={<DeleteOutlined />} 
                          onClick={() => handleDeleteAvailableDate(item.id)}
                        />
                      </Tooltip>
                    ]}
                  >
                    <div className="date-item">
                        <div className="date-range">{item.startDate} 至 {item.endDate}</div>
                      <div className="date-price">成人：¥{item.adultPrice}</div>
                      <div className="date-price">儿童：¥{item.childPrice}</div>
                      <div className="date-people">最大人数：{item.maxPeople}</div>
                    </div>
                  </List.Item>
                )}
              />
            </div>
            )
          },
          {
            key: 'itinerary',
            label: '行程安排',
            disabled: !isEdit,
            children: (
              <div className="itinerary-container">
                <div className="itinerary-header">
                  <h4>行程安排</h4>
                  <Button type="primary" icon={<PlusOutlined />} onClick={() => showItineraryModal()}>
                    添加行程
                  </Button>
                </div>

                <List
                  bordered
                  dataSource={itineraries}
                  renderItem={item => (
                    <List.Item
                      key={item.id}
                      actions={[
                        <Tooltip key="edit" title="编辑">
                          <Button 
                            type="text" 
                            icon={<EditOutlined />} 
                            onClick={() => showItineraryModal(item)}
                          />
                        </Tooltip>,
                        <Tooltip key="delete" title="删除">
                          <Button 
                            type="text" 
                            danger 
                            icon={<DeleteOutlined />} 
                            onClick={() => handleDeleteItinerary(item.id)}
                          />
                        </Tooltip>
                      ]}
                    >
                      <div className="itinerary-item">
                        <div className="itinerary-day">第{item.day}天</div>
                        <div>
                          <div className="itinerary-title">{item.title}</div>
                          <div className="itinerary-desc">{item.description}</div>
                          <div className="itinerary-meta">
                            <span>餐食: {item.meals || '无'}</span>
                            <span style={{ marginLeft: '16px' }}>住宿: {item.accommodation || '无'}</span>
                          </div>
                          {/* 显示关联的一日游信息 */}
                          {item.relatedDayTours && item.relatedDayTours.length > 0 && (
                            <div className="related-daytours" style={{ marginTop: '8px' }}>
                              <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>关联一日游:</div>
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                {item.relatedDayTours.map((tour, idx) => {
                                  // 查找关联的一日游详情
                                  const relatedTour = selectedDayTours.find(t => 
                                    t.dayTourId === tour.dayTourId && t.dayNumber === item.day
                                  );
                                  
                                  if (!relatedTour) return null;
                                  
                                  return (
                                    <Tag 
                                      key={`${tour.dayTourId}-${idx}`} 
                                      color={tour.isOptional ? 'orange' : 'blue'}
                                    >
                                      {relatedTour.dayTourName || relatedTour.name || '未知一日游'} 
                                      {tour.isOptional ? ' (可选)' : ''}
                                    </Tag>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </List.Item>
                  )}
                />
              </div>
            )
          },
          {
            key: 'daytours',
            label: '关联一日游',
            disabled: !isEdit,
            children: renderDayToursTabContent()
          },
          {
            key: 'faqs',
            label: '常见问题',
            disabled: !isEdit,
            children: (
              <div className="section-container">
                <h3>管理常见问题</h3>
                <Form layout="vertical">
                  <Row gutter={16}>
                    <Col span={8}>
                      <Form.Item label="问题">
                        <Input
                          placeholder="输入问题"
                          id="new-faq-question"
                        />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item label="回答">
                        <Input
                          placeholder="输入回答"
                          id="new-faq-answer"
                        />
                      </Form.Item>
                    </Col>
                    <Col span={4}>
                      <Form.Item label=" " colon={false}>
                        <Button
                          type="primary"
                          onClick={() => {
                            const question = document.getElementById('new-faq-question').value;
                            const answer = document.getElementById('new-faq-answer').value;
                            if (question && answer) {
                              const newFaqs = [...faqs, { question, answer }];
                              setFaqs(newFaqs);
                              form.setFieldsValue({ faqs: newFaqs });
                              document.getElementById('new-faq-question').value = '';
                              document.getElementById('new-faq-answer').value = '';
                            } else {
                              message.warning('请输入问题和回答');
                            }
                          }}
                        >
                          添加
                </Button>
                      </Form.Item>
                    </Col>
                  </Row>
                </Form>
              <List
                bordered
                  dataSource={faqs}
                  renderItem={(item, index) => (
                  <List.Item
                    actions={[
                        <Button 
                          type="text" 
                          danger
                          icon={<DeleteOutlined />}
                          onClick={() => {
                            const newFaqs = [...faqs];
                            newFaqs.splice(index, 1);
                            setFaqs(newFaqs);
                            form.setFieldsValue({ faqs: newFaqs });
                          }}
                        >
                          删除
                        </Button>
                      ]}
                    >
                      <div style={{ width: '100%' }}>
                        <div><strong>问题:</strong> {item.question}</div>
                        <div><strong>回答:</strong> {item.answer}</div>
                      </div>
                    </List.Item>
                  )}
                />
              </div>
            )
          },
          {
            key: 'images',
            label: '图片集',
            disabled: !isEdit,
            children: (
              <div className="section-container">
                <Card variant="borderless">
                  <ImageUpload 
                    type="group_tour" 
                    relatedId={groupTourId}
                    onChange={(images) => {
                      console.log('图片列表已更新:', images);
                    }}
                  />
                </Card>
              </div>
            )
          }
        ]} />
      </Card>

      <Modal
        title={editingItinerary ? '编辑行程' : '添加行程'}
        open={itineraryModalVisible}
        onOk={handleItineraryOk}
        onCancel={() => setItineraryModalVisible(false)}
        width={600}
      >
        <Form
          form={itineraryForm}
          layout="vertical"
        >
          <Form.Item
            name="day"
            label="天数"
            rules={[{ required: true, message: '请输入天数' }]}
          >
            <InputNumber min={1} style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item
            name="title"
            label="标题"
            rules={[{ required: true, message: '请输入标题' }]}
          >
            <Input placeholder="请输入行程标题" />
          </Form.Item>

          <Form.Item
            name="description"
            label="描述"
            rules={[{ required: true, message: '请输入描述' }]}
          >
            <TextArea rows={4} placeholder="请输入行程描述" />
          </Form.Item>

          <Form.Item
            name="dayTourId"
            label="选择一日游"
            help="选择一日游后可将其行程添加到当前天"
          >
            <Select
              placeholder="请选择一日游"
              style={{ width: '100%' }}
              allowClear
              showSearch
              optionFilterProp="children"
              onChange={(value) => {
                console.log('选择的一日游ID:', value);  // 调试: 输出选择的ID
                if (value) {
                  // 查找选中的一日游数据
                  const selectedDayTour = dayTours.find(tour => 
                    tour.id === value || tour.dayTourId === value
                  );
                  
                  console.log('选中的一日游数据:', selectedDayTour);  // 调试: 输出选中的数据
                  
                  if (selectedDayTour) {
                    // 设置标题和描述
                    const title = selectedDayTour.name || selectedDayTour.title || '一日游行程';
                    const description = selectedDayTour.description || selectedDayTour.intro || '';
                    
                    itineraryForm.setFieldsValue({
                      title: title,
                      description: description
                    });
                  }
                }
              }}
              notFoundContent={
                loading ? (
                  <div style={{textAlign: 'center', padding: '10px'}}>
                    正在加载一日游数据...
                  </div>
                ) : dayTours.length === 0 ? (
                  <Empty 
                    description="暂无一日游数据" 
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                  />
                ) : null
              }
              loading={loading}
            >
              {dayTours && dayTours.length > 0 ? (
                dayTours.map(tour => (
                  <Option 
                    key={tour.dayTourId || tour.id} 
                    value={tour.dayTourId || tour.id}
                  >
                    {tour.name || tour.title || '未命名一日游'} 
                    {tour.location && `(${tour.location})`}
                  </Option>
                ))
              ) : (
                <Option value="no-data" disabled>暂无一日游数据，请先添加</Option>
              )}
            </Select>
          </Form.Item>

          <Form.Item
            name="meals"
            label="餐食"
          >
            <Input placeholder="例如：早餐,午餐" />
          </Form.Item>

          <Form.Item
            name="accommodation"
            label="住宿"
          >
            <Input placeholder="例如：塔斯马尼亚国际酒店" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default GroupTourDetail; 