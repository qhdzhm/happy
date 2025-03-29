import React, { useState, useEffect } from 'react';
import { Form, Input, Button, Card, InputNumber, Select, Upload, message, Space, Tabs, List, Modal, Tooltip, Row, Col } from 'antd';
import { ArrowLeftOutlined, PlusOutlined, DeleteOutlined, UploadOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import { getDayTourById, updateDayTour, createDayTour, uploadDayTourImage, getDayTourHighlights, addDayTourHighlight, deleteDayTourHighlight, getDayTourInclusions, getDayTourExclusions, getDayTourItineraries, getDayTourFaqs, getDayTourTips, getDayTourImages, addDayTourInclusion, deleteDayTourInclusion, addDayTourExclusion, deleteDayTourExclusion, addDayTourItinerary, deleteDayTourItinerary, addDayTourFaq, deleteDayTourFaq, addDayTourTip, deleteDayTourTip, handleImageUploadToGallery, handleSetPrimaryImage, handleDeleteImage, handleUpdateImageDescription, handleSaveImageDescription, getDayTourThemes, getDayTourSuitableFor, getDayTourRelatedThemes, getDayTourRelatedSuitableFor, updateDayTourRelatedThemes, updateDayTourRelatedSuitableFor, getDayTourList } from '@/apis/daytour';
import ImageUpload from '@/components/ImageUpload';
import './DayTourDetail.scss';

const { Option } = Select;
const { TextArea } = Input;
const { confirm } = Modal;

const DayTourDetail = () => {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const [isEdit, setIsEdit] = useState(false);
  const [tourId, setTourId] = useState(null);
  const [highlights, setHighlights] = useState([]);
  const [inclusions, setInclusions] = useState([]);
  const [exclusions, setExclusions] = useState([]);
  const [itineraries, setItineraries] = useState([]);
  const [faqs, setFaqs] = useState([]);
  const [tips, setTips] = useState([]);
  const [images, setImages] = useState([]);
  const [newHighlight, setNewHighlight] = useState('');
  const [newInclusion, setNewInclusion] = useState('');
  const [newExclusion, setNewExclusion] = useState('');
  const [newItinerary, setNewItinerary] = useState({ timeSlot: '', activity: '', location: '', description: '' });
  const [newFaq, setNewFaq] = useState({ question: '', answer: '' });
  const [newTip, setNewTip] = useState('');
  const [activeTab, setActiveTab] = useState('1');
  const [themes, setThemes] = useState([]);
  const [suitableFor, setSuitableFor] = useState([]);
  const [selectedThemes, setSelectedThemes] = useState([]);
  const [selectedSuitable, setSelectedSuitable] = useState([]);

  useEffect(() => {
    const { state } = location;
    if (state && state.id) {
      setIsEdit(true);
      setTourId(state.id);
      fetchTourDetails(state.id);
      fetchHighlights(state.id);
      fetchInclusions(state.id);
      fetchExclusions(state.id);
      fetchItineraries(state.id);
      fetchFaqs(state.id);
      fetchTips(state.id);
      fetchImages(state.id);
      
      if (state.activeTab) {
        setActiveTab(state.activeTab);
      }
    }
    fetchThemes();
    fetchSuitableFor();
  }, [location]);

  // 监控isEdit和tourId的变化，确保在成功保存基本信息后能获取关联数据
  useEffect(() => {
    // 只有当isEdit为true且tourId存在时，才尝试获取关联数据
    if (isEdit && tourId) {
      console.log('检测到编辑状态和ID变化，重新获取关联数据:', tourId);
      fetchHighlights(tourId);
      fetchInclusions(tourId);
      fetchExclusions(tourId);
      fetchItineraries(tourId);
      fetchFaqs(tourId);
      fetchTips(tourId);
      fetchImages(tourId);
      fetchRelatedThemes(tourId);
      fetchRelatedSuitableFor(tourId);
    }
  }, [isEdit, tourId]);

  const fetchThemes = async () => {
    try {
      const res = await getDayTourThemes();
      if (res.code === 1) {
        const uniqueThemes = [];
        const themeIds = new Set();
        
        (res.data || []).forEach(theme => {
          if (!themeIds.has(theme.themeId)) {
            themeIds.add(theme.themeId);
            uniqueThemes.push(theme);
          }
        });
        
        setThemes(uniqueThemes);
      } else {
        message.error(res.msg || '获取主题列表失败');
      }
    } catch (error) {
      console.error('获取主题列表失败:', error);
      message.error('获取主题列表失败');
    }
  };

  const fetchSuitableFor = async () => {
    try {
      const res = await getDayTourSuitableFor();
      if (res.code === 1) {
        const uniqueSuitable = [];
        const suitableIds = new Set();
        
        (res.data || []).forEach(suitable => {
          if (!suitableIds.has(suitable.suitableId)) {
            suitableIds.add(suitable.suitableId);
            uniqueSuitable.push(suitable);
          }
        });
        
        setSuitableFor(uniqueSuitable);
      } else {
        message.error(res.msg || '获取适合人群列表失败');
      }
    } catch (error) {
      console.error('获取适合人群列表失败:', error);
      message.error('获取适合人群列表失败');
    }
  };

  const fetchTourDetails = async (id) => {
    try {
      const res = await getDayTourById(id);
      if (res.code === 1) {
        const tourData = res.data;
        form.setFieldsValue({
          name: tourData.name,
          location: tourData.location,
          price: tourData.price,
          childPrice: tourData.childPrice,
          duration: tourData.duration,
          category: tourData.category,
          description: tourData.description,
          inclusionExclusion: tourData.inclusionExclusion,
          cancellationPolicy: tourData.cancellationPolicy,
        });
        setImageUrl(tourData.imageUrl);
        
        fetchRelatedThemes(id);
        fetchRelatedSuitableFor(id);
      } else {
        message.error(res.msg || '获取一日游详情失败');
      }
    } catch (error) {
      console.error('获取一日游详情失败:', error);
      message.error('获取一日游详情失败');
    }
  };

  const fetchHighlights = async (id) => {
    try {
      const res = await getDayTourHighlights(id);
      if (res.code === 1) {
        setHighlights(res.data || []);
      } else {
        message.error(res.msg || '获取亮点列表失败');
      }
    } catch (error) {
      console.error('获取亮点列表失败:', error);
      message.error('获取亮点列表失败');
    }
  };

  const fetchInclusions = async (id) => {
    try {
      const res = await getDayTourInclusions(id);
      if (res.code === 1) {
        setInclusions(res.data || []);
      } else {
        message.error(res.msg || '获取包含项目列表失败');
      }
    } catch (error) {
      console.error('获取包含项目列表失败:', error);
      message.error('获取包含项目列表失败');
    }
  };

  const fetchExclusions = async (id) => {
    try {
      const res = await getDayTourExclusions(id);
      if (res.code === 1) {
        setExclusions(res.data || []);
      } else {
        message.error(res.msg || '获取不包含项目列表失败');
      }
    } catch (error) {
      console.error('获取不包含项目列表失败:', error);
      message.error('获取不包含项目列表失败');
    }
  };

  const fetchItineraries = async (id) => {
    try {
      const res = await getDayTourItineraries(id);
      if (res.code === 1) {
        setItineraries(res.data || []);
      } else {
        message.error(res.msg || '获取行程安排列表失败');
      }
    } catch (error) {
      console.error('获取行程安排列表失败:', error);
      message.error('获取行程安排列表失败');
    }
  };

  const fetchFaqs = async (id) => {
    try {
      const res = await getDayTourFaqs(id);
      if (res.code === 1) {
        setFaqs(res.data || []);
      } else {
        message.error(res.msg || '获取常见问题列表失败');
      }
    } catch (error) {
      console.error('获取常见问题列表失败:', error);
      message.error('获取常见问题列表失败');
    }
  };

  const fetchTips = async (id) => {
    try {
      const res = await getDayTourTips(id);
      if (res.code === 1) {
        setTips(res.data || []);
      } else {
        message.error(res.msg || '获取旅行提示列表失败');
      }
    } catch (error) {
      console.error('获取旅行提示列表失败:', error);
      message.error('获取旅行提示列表失败');
    }
  };

  const fetchImages = async (id) => {
    try {
      const res = await getDayTourImages(id);
      if (res.code === 1) {
        setImages(res.data || []);
      } else {
        message.error(res.msg || '获取图片列表失败');
      }
    } catch (error) {
      console.error('获取图片列表失败:', error);
      message.error('获取图片列表失败');
    }
  };

  const fetchRelatedThemes = async (id) => {
    try {
      const res = await getDayTourRelatedThemes(id);
      if (res.code === 1) {
        const uniqueThemeIds = Array.from(new Set((res.data || []).map(theme => theme.themeId)));
        setSelectedThemes(uniqueThemeIds);
      } else {
        message.error(res.msg || '获取关联主题失败');
      }
    } catch (error) {
      console.error('获取关联主题失败:', error);
      message.error('获取关联主题失败');
    }
  };

  const fetchRelatedSuitableFor = async (id) => {
    try {
      const res = await getDayTourRelatedSuitableFor(id);
      if (res.code === 1) {
        const uniqueSuitableIds = Array.from(new Set((res.data || []).map(suitable => suitable.suitableId)));
        setSelectedSuitable(uniqueSuitableIds);
      } else {
        message.error(res.msg || '获取关联适合人群失败');
      }
    } catch (error) {
      console.error('获取关联适合人群失败:', error);
      message.error('获取关联适合人群失败');
    }
  };

  const handleSubmit = async (values) => {
    console.log('提交的表单值:', values);
    setLoading(true);
    
    // 检查必填字段
    if (!values.name || !values.price || !values.duration || !values.category || !values.description) {
      message.error('请填写所有必填字段');
      setLoading(false);
      return;
    }
    
    // 特别检查location字段，因为数据库中它是非空字段
    if (!values.location) {
      message.error('位置字段不能为空，请填写位置信息');
      setLoading(false);
      return;
    }

    // 构建请求数据
    const tourData = {
      ...values,
      imageUrl: imageUrl || '',
      themeIds: selectedThemes,
      suitableIds: selectedSuitable
    };

    try {
      let res;
      if (isEdit) {
        tourData.id = tourId;
        res = await updateDayTour(tourData);
      } else {
        res = await createDayTour(tourData);
      }

      if (res.code === 1) {
        message.success(isEdit ? '更新一日游成功' : '创建一日游成功');
        
        // 设置编辑状态和ID
        setIsEdit(true);
        
        // 重要：确保设置tourId，不管是新建还是编辑
        if (!isEdit) {
          // 检查res.data是否为null，如果是，使用默认值或其他方式获取ID
          if (!res.data) {
            console.log('警告：服务器返回的数据为null，将尝试从其他地方获取ID');
            // 尝试从URL参数获取ID或使用后端生成的临时ID
            // 由于一日游已经成功创建，但没有返回ID，需要重新获取列表找到最新创建的
            fetchLatestCreatedDayTour(values.name); // 新增函数，根据名称获取最新创建的一日游
            return; // 先返回，等fetchLatestCreatedDayTour完成后再继续
          }
          
          // 正常情况，设置从响应中获取的ID
          const newTourId = res.data.id || res.data.dayTourId;
          setTourId(newTourId);
          
          // 如果有关联的主题和适合人群，保存关联关系
          if (selectedThemes.length > 0) {
            updateRelatedThemes(newTourId, selectedThemes);
          }
          if (selectedSuitable.length > 0) {
            updateRelatedSuitableFor(newTourId, selectedSuitable);
          }
        } else {
          // 确保编辑模式下也正确设置tourId
          setTourId(tourId || (res.data ? (res.data.id || res.data.dayTourId) : tourId));
        }
        
        // 保存ID到URL状态，以便刷新后保持编辑状态
        navigate(`/daytour/edit`, { 
          state: { 
            id: isEdit ? tourId : (res.data ? (res.data.id || res.data.dayTourId) : tourId), 
            activeTab: activeTab 
          },
          replace: true
        });
        
        // 重新获取详情，更新表单数据
        if (isEdit || (res.data && (res.data.id || res.data.dayTourId))) {
          fetchTourDetails(isEdit ? tourId : (res.data.id || res.data.dayTourId));
        }
      } else {
        message.error(res.msg || (isEdit ? '更新一日游失败' : '创建一日游失败'));
      }
    } catch (error) {
      console.error(isEdit ? '更新一日游失败:' : '创建一日游失败:', error);
      message.error(isEdit ? '更新一日游失败' : '创建一日游失败');
    } finally {
      setLoading(false);
    }
  };

  const updateRelatedThemes = async (id, themeIds) => {
    try {
      const res = await updateDayTourRelatedThemes(id, themeIds);
      if (res.code !== 1) {
        message.error(res.msg || '更新关联主题失败');
      }
    } catch (error) {
      console.error('更新关联主题失败:', error);
      message.error('更新关联主题失败');
    }
  };

  const updateRelatedSuitableFor = async (id, suitableIds) => {
    try {
      const res = await updateDayTourRelatedSuitableFor(id, suitableIds);
      if (res.code !== 1) {
        message.error(res.msg || '更新关联适合人群失败');
      }
    } catch (error) {
      console.error('更新关联适合人群失败:', error);
      message.error('更新关联适合人群失败');
    }
  };

  // 根据名称获取最新创建的一日游
  const fetchLatestCreatedDayTour = async (tourName) => {
    try {
      // 获取一日游列表，并找到名称匹配的最新记录
      const res = await getDayTourList({ page: 1, pageSize: 10 });
      if (res.code === 1 && res.data && res.data.records && res.data.records.length > 0) {
        // 找到名称匹配的记录
        const matchedTour = res.data.records.find(tour => tour.name === tourName);
        
        if (matchedTour) {
          console.log('找到匹配的一日游记录:', matchedTour);
          const newTourId = matchedTour.id;
          
          // 设置ID并更新状态
          setTourId(newTourId);
          
          // 如果有关联的主题和适合人群，保存关联关系
          if (selectedThemes.length > 0) {
            updateRelatedThemes(newTourId, selectedThemes);
          }
          if (selectedSuitable.length > 0) {
            updateRelatedSuitableFor(newTourId, selectedSuitable);
          }
          
          // 更新URL状态
          navigate(`/daytour/edit`, { 
            state: { 
              id: newTourId, 
              activeTab: activeTab 
            },
            replace: true
          });
          
          // 获取详情
          fetchTourDetails(newTourId);
        } else {
          console.error('未找到匹配的一日游记录');
          message.error('创建一日游成功，但未能获取ID，请刷新页面');
        }
      } else {
        console.error('获取一日游列表失败:', res);
        message.error('创建一日游成功，但未能获取ID，请刷新页面');
      }
    } catch (error) {
      console.error('获取最新创建的一日游失败:', error);
      message.error('创建一日游成功，但未能获取ID，请刷新页面');
    }
  };

  const handleThemesChange = (value) => {
    setSelectedThemes(value);
  };

  const handleSuitableChange = (value) => {
    setSelectedSuitable(value);
  };

  const handleImageUpload = async (info) => {
    if (info.file.status === 'uploading') {
      return;
    }
    if (info.file.status === 'done') {
      const formData = new FormData();
      formData.append('file', info.file.originFileObj);
      
      try {
        const res = await uploadDayTourImage(formData);
        console.log('图片上传响应:', res);
        
        if (res.code === 1 && res.data && res.data.url) {
          // 使用API返回的处理后URL
          const imageUrlValue = res.data.url;
          console.log('最终使用的图片URL:', imageUrlValue);
          
          // 立即设置状态和表单值
          setImageUrl(imageUrlValue);
          form.setFieldsValue({
            imageUrl: imageUrlValue
          });
          message.success('图片上传成功');
          
          // 立即预加载图片以验证URL是否有效
          const img = new Image();
          img.onload = () => {
            console.log('图片预加载成功');
          };
          
          img.onerror = (e) => {
            console.error('图片预加载失败:', e);
            message.warning('图片上传成功但无法显示，请检查网络设置');
          };
          
          // 开始加载图片
          img.crossOrigin = 'anonymous';
          img.src = imageUrlValue;
        } else {
          console.error('图片上传响应异常:', res);
          message.error(res.msg || '图片上传失败，服务器响应异常');
        }
      } catch (error) {
        console.error('图片上传失败:', error);
        message.error('图片上传失败，请检查网络连接');
      }
    }
  };

  const handleAddHighlight = async () => {
    if (!tourId) {
      message.error('请先保存基本信息');
      return;
    }

    if (!newHighlight.trim()) {
      message.error('请输入亮点内容');
      return;
    }

    try {
      const highlightData = {
        dayTourId: tourId,
        description: newHighlight
      };
      
      console.log('添加亮点，使用的tourId:', tourId);
      const res = await addDayTourHighlight(highlightData);
      if (res.code === 1) {
        message.success('添加亮点成功');
        setNewHighlight('');
        fetchHighlights(tourId);
      } else {
        message.error(res.msg || '添加亮点失败');
      }
    } catch (error) {
      console.error('添加亮点失败:', error);
      message.error('添加亮点失败');
    }
  };

  const handleDeleteHighlight = (highlightId) => {
    confirm({
      title: '确定要删除此亮点吗?',
      icon: <ExclamationCircleOutlined />,
      content: '此操作不可逆，请谨慎操作。',
      onOk: async () => {
        try {
          const res = await deleteDayTourHighlight(highlightId);
          if (res.code === 1) {
            message.success('删除成功');
            fetchHighlights(tourId);
          } else {
            message.error(res.msg || '删除失败');
          }
        } catch (error) {
          console.error('删除亮点失败:', error);
          message.error('删除亮点失败');
        }
      },
    });
  };

  const handleAddInclusion = async () => {
    if (!tourId) {
      message.error('请先保存基本信息');
      return;
    }

    if (!newInclusion.trim()) {
      message.error('请输入包含项目内容');
      return;
    }

    try {
      const inclusionData = {
        dayTourId: tourId,
        description: newInclusion
      };
      
      const res = await addDayTourInclusion(inclusionData);
      if (res.code === 1) {
        message.success('添加包含项目成功');
        setNewInclusion('');
        fetchInclusions(tourId);
      } else {
        message.error(res.msg || '添加包含项目失败');
      }
    } catch (error) {
      console.error('添加包含项目失败:', error);
      message.error('添加包含项目失败');
    }
  };

  const handleDeleteInclusion = (inclusionId) => {
    confirm({
      title: '确定要删除此包含项目吗?',
      icon: <ExclamationCircleOutlined />,
      content: '此操作不可逆，请谨慎操作。',
      onOk: async () => {
        try {
          const res = await deleteDayTourInclusion(inclusionId);
          if (res.code === 1) {
            message.success('删除成功');
            fetchInclusions(tourId);
          } else {
            message.error(res.msg || '删除失败');
          }
        } catch (error) {
          console.error('删除包含项目失败:', error);
          message.error('删除包含项目失败');
        }
      },
    });
  };

  const handleAddExclusion = async () => {
    if (!tourId) {
      message.error('请先保存基本信息');
      return;
    }

    if (!newExclusion.trim()) {
      message.error('请输入不包含项目内容');
      return;
    }

    try {
      const exclusionData = {
        dayTourId: tourId,
        description: newExclusion
      };
      
      const res = await addDayTourExclusion(exclusionData);
      if (res.code === 1) {
        message.success('添加不包含项目成功');
        setNewExclusion('');
        fetchExclusions(tourId);
      } else {
        message.error(res.msg || '添加不包含项目失败');
      }
    } catch (error) {
      console.error('添加不包含项目失败:', error);
      message.error('添加不包含项目失败');
    }
  };

  const handleDeleteExclusion = (exclusionId) => {
    confirm({
      title: '确定要删除此不包含项目吗?',
      icon: <ExclamationCircleOutlined />,
      content: '此操作不可逆，请谨慎操作。',
      onOk: async () => {
        try {
          const res = await deleteDayTourExclusion(exclusionId);
          if (res.code === 1) {
            message.success('删除成功');
            fetchExclusions(tourId);
          } else {
            message.error(res.msg || '删除失败');
          }
        } catch (error) {
          console.error('删除不包含项目失败:', error);
          message.error('删除不包含项目失败');
        }
      },
    });
  };

  const handleAddItinerary = async () => {
    if (!tourId) {
      message.error('请先保存基本信息');
      return;
    }

    if (!newItinerary.timeSlot || !newItinerary.activity || !newItinerary.location || !newItinerary.description) {
      message.error('请填写完整的行程安排信息');
      return;
    }

    try {
      const itineraryData = {
        dayTourId: tourId,
        ...newItinerary
      };
      
      const res = await addDayTourItinerary(itineraryData);
      if (res.code === 1) {
        message.success('添加行程安排成功');
        setNewItinerary({ timeSlot: '', activity: '', location: '', description: '' });
        fetchItineraries(tourId);
      } else {
        message.error(res.msg || '添加行程安排失败');
      }
    } catch (error) {
      console.error('添加行程安排失败:', error);
      message.error('添加行程安排失败');
    }
  };

  const handleDeleteItinerary = (itineraryId) => {
    confirm({
      title: '确定要删除此行程安排吗?',
      icon: <ExclamationCircleOutlined />,
      content: '此操作不可逆，请谨慎操作。',
      onOk: async () => {
        try {
          const res = await deleteDayTourItinerary(itineraryId);
          if (res.code === 1) {
            message.success('删除成功');
            fetchItineraries(tourId);
          } else {
            message.error(res.msg || '删除失败');
          }
        } catch (error) {
          console.error('删除行程安排失败:', error);
          message.error('删除行程安排失败');
        }
      },
    });
  };

  const handleAddFaq = async () => {
    if (!tourId) {
      message.error('请先保存基本信息');
      return;
    }

    if (!newFaq.question.trim() || !newFaq.answer.trim()) {
      message.error('请填写完整的问答信息');
      return;
    }

    try {
      const faqData = {
        dayTourId: tourId,
        question: newFaq.question,
        answer: newFaq.answer
      };
      
      const res = await addDayTourFaq(faqData);
      if (res.code === 1) {
        message.success('添加常见问题成功');
        setNewFaq({ question: '', answer: '' });
        fetchFaqs(tourId);
      } else {
        message.error(res.msg || '添加常见问题失败');
      }
    } catch (error) {
      console.error('添加常见问题失败:', error);
      message.error('添加常见问题失败');
    }
  };

  const handleDeleteFaq = (faqId) => {
    confirm({
      title: '确定要删除此常见问题吗?',
      icon: <ExclamationCircleOutlined />,
      content: '此操作不可逆，请谨慎操作。',
      onOk: async () => {
        try {
          const res = await deleteDayTourFaq(faqId);
          if (res.code === 1) {
            message.success('删除成功');
            fetchFaqs(tourId);
          } else {
            message.error(res.msg || '删除失败');
          }
        } catch (error) {
          console.error('删除常见问题失败:', error);
          message.error('删除常见问题失败');
        }
      },
    });
  };

  const handleAddTip = async () => {
    if (!tourId) {
      message.error('请先保存基本信息');
      return;
    }

    if (!newTip.trim()) {
      message.error('请输入旅行提示内容');
      return;
    }

    try {
      const tipData = {
        dayTourId: tourId,
        description: newTip
      };
      
      const res = await addDayTourTip(tipData);
      if (res.code === 1) {
        message.success('添加旅行提示成功');
        setNewTip('');
        fetchTips(tourId);
      } else {
        message.error(res.msg || '添加旅行提示失败');
      }
    } catch (error) {
      console.error('添加旅行提示失败:', error);
      message.error('添加旅行提示失败');
    }
  };

  const handleDeleteTip = (tipId) => {
    confirm({
      title: '确定要删除此旅行提示吗?',
      icon: <ExclamationCircleOutlined />,
      content: '此操作不可逆，请谨慎操作。',
      onOk: async () => {
        try {
          const res = await deleteDayTourTip(tipId);
          if (res.code === 1) {
            message.success('删除成功');
            fetchTips(tourId);
          } else {
            message.error(res.msg || '删除失败');
          }
        } catch (error) {
          console.error('删除旅行提示失败:', error);
          message.error('删除旅行提示失败');
        }
      },
    });
  };

  const handleBack = () => {
    navigate('/daytour');
  };

  const handleTabChange = (key) => {
    setActiveTab(key);
  };

  return (
    <div className="day-tour-detail">
      <Card
        title={
          <Space>
            <Button icon={<ArrowLeftOutlined />} onClick={handleBack} type="link" />
            {isEdit ? '编辑一日游' : '添加一日游'}
          </Space>
        }
      >
        <Tabs defaultActiveKey="basic" onChange={handleTabChange} items={[
          {
            key: 'basic',
            label: '基本信息',
            children: (
              <Form
                form={form}
                layout="vertical"
                initialValues={location.state}
                onFinish={handleSubmit}
              >
                <Row gutter={16}>
                  <Col span={12}>
                    <Form.Item
                      name="name"
                      label="一日游名称"
                      rules={[{ required: true, message: '请输入一日游名称' }]}
                    >
                      <Input placeholder="请输入一日游名称" />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item
                      name="price"
                      label="价格"
                      rules={[{ required: true, message: '请输入价格' }]}
                    >
                      <InputNumber
                        min={0}
                        precision={2}
                        style={{ width: '100%' }}
                        placeholder="请输入价格"
                        formatter={value => `$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                        parser={value => value.replace(/\$\s?|(,*)/g, '')}
                      />
                    </Form.Item>
                  </Col>
                </Row>
                <Row gutter={16}>
                  <Col span={12}>
                    <Form.Item
                      name="location"
                      label="位置"
                      rules={[{ required: true, message: '请输入位置信息' }]}
                    >
                      <Input placeholder="请输入位置，如：塔斯马尼亚北部" />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item
                      name="duration"
                      label="持续时间"
                      rules={[{ required: true, message: '请输入持续时间' }]}
                    >
                      <Input placeholder="如：8小时" />
                    </Form.Item>
                  </Col>
                </Row>
                <Row gutter={16}>
                  <Col span={12}>
                    <Form.Item
                      name="category"
                      label="类别"
                      rules={[{ required: true, message: '请选择类别' }]}
                    >
                      <Select placeholder="请选择类别">
                        <Option value="自然风光">自然风光</Option>
                        <Option value="海滩">海滩</Option>
                        <Option value="城市观光">城市观光</Option>
                        <Option value="历史文化">历史文化</Option>
                        <Option value="购物美食">购物美食</Option>
                        <Option value="岛屿">岛屿</Option>
                        <Option value="户外活动">户外活动</Option>
                      </Select>
                    </Form.Item>
                  </Col>
                </Row>
                <Row gutter={16}>
                  <Col span={12}>
                    <Form.Item 
                      label="图片"
                      name="imageUrl"
                      valuePropName="value"
                    >
                      <Upload
                        name="file"
                        listType="picture-card"
                        className="avatar-uploader"
                        showUploadList={false}
                        beforeUpload={(file) => {
                          if (file.type !== 'image/jpeg' && file.type !== 'image/png') {
                            message.error('只能上传JPG/PNG图片!');
                            return false;
                          }
                          const isLt2M = file.size / 1024 / 1024 < 2;
                          if (!isLt2M) {
                            message.error('图片必须小于2MB!');
                            return false;
                          }
                          return true;
                        }}
                        customRequest={({ file, onSuccess }) => { 
                          console.log('开始上传文件:', file.name);
                          setTimeout(() => {
                            onSuccess("ok");
                          }, 0);
                          handleImageUpload({ file: { status: 'done', originFileObj: file } });
                        }}
                      >
                        {imageUrl ? (
                          <div className="image-preview-container" style={{ width: '100%', height: '100%', position: 'relative' }}>
                            <img 
                              src={imageUrl} 
                              alt="一日游封面图"
                              style={{ 
                                width: '100%', 
                                height: '100%', 
                                objectFit: 'cover',
                                display: 'block' 
                              }}
                              onError={(e) => {
                                console.error('图片加载失败:', imageUrl);
                                e.target.onerror = null;
                                e.target.src = 'https://via.placeholder.com/150?text=加载失败';
                              }}
                            />
                            <div 
                              className="image-preview-overlay"
                              style={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                right: 0,
                                bottom: 0,
                                background: 'rgba(0,0,0,0.3)',
                                display: 'flex',
                                justifyContent: 'center',
                                alignItems: 'center',
                                opacity: 0,
                                transition: 'opacity 0.3s',
                                cursor: 'pointer'
                              }}
                              onMouseEnter={(e) => e.currentTarget.style.opacity = 1}
                              onMouseLeave={(e) => e.currentTarget.style.opacity = 0}
                            >
                              <PlusOutlined style={{ color: '#fff', fontSize: '20px' }} />
                            </div>
                          </div>
                        ) : (
                          <div>
                            <PlusOutlined />
                            <div style={{ marginTop: 8 }}>上传</div>
                          </div>
                        )}
                      </Upload>
                      <div style={{ marginTop: 8 }}>
                        {imageUrl && (
                          <>
                            <a 
                              href={imageUrl} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              style={{ fontSize: '12px', marginRight: '10px' }}
                            >
                              查看原图
                            </a>
                            <span style={{ fontSize: '12px', color: '#52c41a' }}>
                              {imageUrl.includes('?') ? '图片含URL参数' : '图片URL已简化'}
                            </span>
                          </>
                        )}
                      </div>
                    </Form.Item>
                  </Col>
                </Row>
                <Form.Item
                  name="description"
                  label="详细描述"
                  rules={[{ required: true, message: '请输入详细描述' }]}
                >
                  <TextArea rows={4} placeholder="请输入详细描述" />
                </Form.Item>
                <Form.Item label="主题">
                  <Select
                    mode="multiple"
                    placeholder="请选择主题"
                    value={selectedThemes}
                    onChange={handleThemesChange}
                    style={{ width: '100%' }}
                  >
                    {themes.map(theme => (
                      <Option key={`theme-${theme.themeId}`} value={theme.themeId}>{theme.name}</Option>
                    ))}
                  </Select>
                </Form.Item>
                <Form.Item label="适合人群">
                  <Select
                    mode="multiple"
                    placeholder="请选择适合人群"
                    value={selectedSuitable}
                    onChange={handleSuitableChange}
                    style={{ width: '100%' }}
                  >
                    {suitableFor.map(suitable => (
                      <Option key={`suitable-${suitable.suitableId}`} value={suitable.suitableId}>{suitable.name}</Option>
                    ))}
                  </Select>
                </Form.Item>
                <Form.Item>
                  <Button type="primary" htmlType="submit" loading={loading}>
                    {isEdit ? '更新' : '创建'}
                  </Button>
                </Form.Item>
              </Form>
            )
          },
          {
            key: 'highlights',
            label: '行程亮点',
            children: (
              <div className="highlight-container">
                <h4>添加新亮点</h4>
                <div className="add-highlight-form">
                  <Space>
                    <Input 
                      placeholder="请输入亮点内容" 
                      value={newHighlight}
                      onChange={(e) => setNewHighlight(e.target.value)}
                      style={{ width: '400px' }}
                    />
                    <Button type="primary" onClick={handleAddHighlight}>添加</Button>
                  </Space>
                </div>

                <h4 style={{ marginTop: '20px' }}>已有亮点列表</h4>
                <List
                  bordered
                  dataSource={highlights}
                  renderItem={item => (
                    <List.Item
                      actions={[
                        <Tooltip title="删除">
                          <Button 
                            type="text" 
                            danger 
                            icon={<DeleteOutlined />} 
                            onClick={() => handleDeleteHighlight(item.id)}
                          />
                        </Tooltip>
                      ]}
                    >
                      {item.description}
                    </List.Item>
                  )}
                />
              </div>
            )
          },
          {
            key: 'inclusions',
            label: '费用包含',
            children: (
              <div className="section-container">
                <h3>管理包含项目</h3>
                <div className="add-form">
                  <Input
                    placeholder="输入包含项目内容"
                    value={newInclusion}
                    onChange={(e) => setNewInclusion(e.target.value)}
                    style={{ width: '70%', marginRight: '10px' }}
                  />
                  <Button type="primary" onClick={handleAddInclusion}>添加</Button>
                </div>
                <List
                  dataSource={inclusions}
                  renderItem={(item) => (
                    <List.Item
                      actions={[
                        <Button 
                          type="text" 
                          danger 
                          icon={<DeleteOutlined />} 
                          onClick={() => handleDeleteInclusion(item.id)}
                        />
                      ]}
                    >
                      <div>{item.description}</div>
                    </List.Item>
                  )}
                />
              </div>
            )
          },
          {
            key: 'exclusions',
            label: '费用不包含',
            children: (
              <div className="section-container">
                <h3>管理不包含项目</h3>
                <div className="add-form">
                  <Input
                    placeholder="输入不包含项目内容"
                    value={newExclusion}
                    onChange={(e) => setNewExclusion(e.target.value)}
                    style={{ width: '70%', marginRight: '10px' }}
                  />
                  <Button type="primary" onClick={handleAddExclusion}>添加</Button>
                </div>
                <List
                  dataSource={exclusions}
                  renderItem={(item) => (
                    <List.Item
                      actions={[
                        <Button 
                          type="text" 
                          danger 
                          icon={<DeleteOutlined />} 
                          onClick={() => handleDeleteExclusion(item.id)}
                        />
                      ]}
                    >
                      <div>{item.description}</div>
                    </List.Item>
                  )}
                />
              </div>
            )
          },
          {
            key: 'itinerary',
            label: '行程安排',
            children: (
              <div className="section-container">
                <h3>管理行程安排</h3>
                <div className="add-form">
                  <Form layout="vertical">
                    <Form.Item label="时间段">
                      <Input
                        placeholder="如：09:00-10:30"
                        value={newItinerary.timeSlot}
                        onChange={(e) => setNewItinerary({...newItinerary, timeSlot: e.target.value})}
                      />
                    </Form.Item>
                    <Form.Item label="活动">
                      <Input
                        placeholder="活动名称"
                        value={newItinerary.activity}
                        onChange={(e) => setNewItinerary({...newItinerary, activity: e.target.value})}
                      />
                    </Form.Item>
                    <Form.Item label="地点">
                      <Input
                        placeholder="活动地点"
                        value={newItinerary.location}
                        onChange={(e) => setNewItinerary({...newItinerary, location: e.target.value})}
                      />
                    </Form.Item>
                    <Form.Item label="描述">
                      <TextArea
                        rows={4}
                        placeholder="活动描述"
                        value={newItinerary.description}
                        onChange={(e) => setNewItinerary({...newItinerary, description: e.target.value})}
                      />
                    </Form.Item>
                    <Form.Item>
                      <Button type="primary" onClick={handleAddItinerary}>添加行程</Button>
                    </Form.Item>
                  </Form>
                </div>
                <List
                  dataSource={itineraries}
                  renderItem={(item) => (
                    <List.Item
                      actions={[
                        <Button 
                          type="text" 
                          danger 
                          icon={<DeleteOutlined />} 
                          onClick={() => handleDeleteItinerary(item.id)}
                        />
                      ]}
                    >
                      <div>
                        <div><strong>{item.timeSlot}</strong> - {item.activity}</div>
                        <div>地点: {item.location}</div>
                        <div>描述: {item.description}</div>
                      </div>
                    </List.Item>
                  )}
                />
              </div>
            )
          },
          {
            key: 'faqs',
            label: '常见问题',
            children: (
              <div className="section-container">
                <h3>管理常见问题</h3>
                <div className="add-form">
                  <Form layout="vertical">
                    <Form.Item label="问题">
                      <Input
                        placeholder="输入问题"
                        value={newFaq.question}
                        onChange={(e) => setNewFaq({...newFaq, question: e.target.value})}
                      />
                    </Form.Item>
                    <Form.Item label="回答">
                      <TextArea
                        rows={4}
                        placeholder="输入回答"
                        value={newFaq.answer}
                        onChange={(e) => setNewFaq({...newFaq, answer: e.target.value})}
                      />
                    </Form.Item>
                    <Form.Item>
                      <Button type="primary" onClick={handleAddFaq}>添加问答</Button>
                    </Form.Item>
                  </Form>
                </div>
                <List
                  dataSource={faqs}
                  renderItem={(item) => (
                    <List.Item
                      actions={[
                        <Button 
                          type="text" 
                          danger 
                          icon={<DeleteOutlined />} 
                          onClick={() => handleDeleteFaq(item.id)}
                        />
                      ]}
                    >
                      <div>
                        <div><strong>问: {item.question}</strong></div>
                        <div>答: {item.answer}</div>
                      </div>
                    </List.Item>
                  )}
                />
              </div>
            )
          },
          {
            key: 'tips',
            label: '旅行提示',
            children: (
              <div className="section-container">
                <h3>管理旅行提示</h3>
                <div className="add-form">
                  <Input
                    placeholder="输入旅行提示内容"
                    value={newTip}
                    onChange={(e) => setNewTip(e.target.value)}
                    style={{ width: '70%', marginRight: '10px' }}
                  />
                  <Button type="primary" onClick={handleAddTip}>添加</Button>
                </div>
                <List
                  dataSource={tips}
                  renderItem={(item) => (
                    <List.Item
                      actions={[
                        <Button 
                          type="text" 
                          danger 
                          icon={<DeleteOutlined />} 
                          onClick={() => handleDeleteTip(item.id)}
                        />
                      ]}
                    >
                      <div>{item.description}</div>
                    </List.Item>
                  )}
                />
              </div>
            )
          },
          {
            key: 'images',
            label: '图片管理',
            children: isEdit && tourId ? (
              <Card variant="borderless">
                <ImageUpload 
                  type="day_tour" 
                  relatedId={tourId}
                  onChange={(images) => {
                    console.log('图片列表已更新:', images);
                  }}
                />
              </Card>
            ) : (
              <Card>
                <div className="empty-placeholder">
                  <p>保存一日游信息后才能管理图片</p>
                </div>
              </Card>
            )
          }
        ]} />
      </Card>
    </div>
  );
};

export default DayTourDetail; 