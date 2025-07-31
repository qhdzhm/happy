import React, { useState, useEffect } from 'react';
import { Modal, Form, Select, DatePicker, TimePicker, Button, Table, message, Tabs, Card, Row, Col, Tag, Divider, Input } from 'antd';
import { UserOutlined, CarOutlined, ClockCircleOutlined, EnvironmentOutlined } from '@ant-design/icons';
import moment from 'moment';
import { getAvailableGuides, getAvailableVehicles, autoAssignGuideVehicle, manualAssignGuideVehicle, updateGuideVehicleAssignment } from '../../api/guideAssignment';

const { Option } = Select;

const GuideVehicleAssignModal = ({ 
  visible, 
  onCancel, 
  onSuccess, 
  selectedOrders = [], 
  selectedDate 
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [availableGuides, setAvailableGuides] = useState([]);
  const [availableVehicles, setAvailableVehicles] = useState([]);
  const [selectedGuide, setSelectedGuide] = useState(null);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [assignmentMode, setAssignmentMode] = useState('auto'); // 'auto' or 'manual'
  
  // 检测是否为修改模式
  const isEditMode = selectedOrders.length > 0 && selectedOrders[0]?.isEdit;
  const assignmentId = isEditMode ? selectedOrders[0]?.assignmentId : null;
  const currentGuideId = isEditMode ? selectedOrders[0]?.currentGuideId : null;
  const currentVehicleId = isEditMode ? selectedOrders[0]?.currentVehicleId : null;

  // 计算总人数和地点信息
  const totalPeople = selectedOrders.reduce((sum, order) => {
    const adultCount = parseInt(order.adult_count) || 0;
    const childCount = parseInt(order.child_count) || 0;
    return sum + adultCount + childCount;
  }, 0);
  
  const locations = [...new Set(selectedOrders.map(order => {
    return order.tour_location || order.title || extractLocationName(order.title || '');
  }).filter(Boolean))];
  
  const mainLocation = locations[0] || '';
  
  // 提取地点名称的辅助函数
  function extractLocationName(title) {
    if (!title) return '';
    const colonSplit = title.split(/[:：]\s*/);
    if (colonSplit.length > 1) {
      return colonSplit[1].replace('一日游', '').trim();
    }
    return title;
  }

  // 根据原始地点确定颜色的辅助函数
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
      '酒': '#a0d911'       // 黄绿 - 酒杯湾
    };
    return colorMap[location] || '#666';
  };

  useEffect(() => {
    if (visible) {
      console.log('Modal打开，selectedOrders:', selectedOrders);
      console.log('计算的totalPeople:', totalPeople);
      console.log('计算的mainLocation:', mainLocation);
      console.log('修改模式:', isEditMode, '分配ID:', assignmentId);
      console.log('传入的selectedDate:', selectedDate);
      console.log('selectedDate类型:', typeof selectedDate, selectedDate?.constructor?.name);
      
      // 处理日期，确保使用正确的格式
      let targetDate;
      if (selectedDate) {
        // 如果是moment对象，直接使用
        if (moment.isMoment(selectedDate)) {
          targetDate = selectedDate.clone();
        } else {
          // 如果是其他格式，转换为moment
          targetDate = moment(selectedDate);
        }
        console.log('处理后的targetDate:', targetDate.format('YYYY-MM-DD'));
      } else {
        targetDate = moment();
        console.log('使用当前日期作为默认值:', targetDate.format('YYYY-MM-DD'));
      }
      
      // 设置默认值
      form.setFieldsValue({
        assignmentDate: targetDate,
        startTime: moment('08:00:00', 'HH:mm:ss'),
        endTime: moment('18:00:00', 'HH:mm:ss'),
        location: mainLocation,
        totalPeople: totalPeople || 1
      });
      
      // 如果是修改模式，设置为手动分配模式
      if (isEditMode) {
        setAssignmentMode('manual');
      }
      
      // 如果有订单数据或者强制加载，则加载可用资源
      if (selectedOrders.length > 0 || totalPeople > 0) {
        loadAvailableResources();
      } else {
        console.warn('没有选中的订单，跳过加载资源');
      }
    }
  }, [visible, selectedOrders, selectedDate, mainLocation, totalPeople, isEditMode, assignmentId]);

  const loadAvailableResources = async () => {
    try {
      setLoading(true);
      
      // 详细调试表单中的日期值
      const formDate = form.getFieldValue('assignmentDate');
      console.log('表单中的assignmentDate值:', formDate);
      console.log('表单中的assignmentDate类型:', typeof formDate, formDate?.constructor?.name);
      console.log('表单中的assignmentDate格式化:', formDate?.format('YYYY-MM-DD'));
      
      const date = formDate?.format('YYYY-MM-DD') || moment().format('YYYY-MM-DD');
      const startTime = form.getFieldValue('startTime')?.format('HH:mm:ss') || '08:00:00';
      const endTime = form.getFieldValue('endTime')?.format('HH:mm:ss') || '18:00:00';
      
      console.log('加载可用资源参数:', { date, startTime, endTime, mainLocation, totalPeople });
      console.log('当前时间用于对比:', moment().format('YYYY-MM-DD HH:mm:ss'));
      
      const [guidesRes, vehiclesRes] = await Promise.all([
        getAvailableGuides(date, startTime, endTime, mainLocation),
        getAvailableVehicles(date, startTime, endTime, totalPeople)
      ]);
      
      console.log('导游响应:', guidesRes);
      console.log('车辆响应:', vehiclesRes);
      
      // 处理响应数据
      if (guidesRes && guidesRes.code === 1) {
        setAvailableGuides(guidesRes.data || []);
        
        // 如果是修改模式，预选当前导游
        if (isEditMode && currentGuideId) {
          const currentGuide = (guidesRes.data || []).find(guide => 
            guide.guideId === currentGuideId || guide.id === currentGuideId
          );
          if (currentGuide) {
            setSelectedGuide(currentGuide);
            console.log('预选当前导游:', currentGuide);
          }
        }
      } else {
        console.warn('导游数据格式异常:', guidesRes);
        setAvailableGuides([]);
      }
      
      if (vehiclesRes && vehiclesRes.code === 1) {
        setAvailableVehicles(vehiclesRes.data || []);
        
        // 如果是修改模式，预选当前车辆
        if (isEditMode && currentVehicleId) {
          const currentVehicle = (vehiclesRes.data || []).find(vehicle => 
            vehicle.vehicleId === currentVehicleId || vehicle.id === currentVehicleId
          );
          if (currentVehicle) {
            setSelectedVehicle(currentVehicle);
            console.log('预选当前车辆:', currentVehicle);
          }
        }
      } else {
        console.warn('车辆数据格式异常:', vehiclesRes);
        setAvailableVehicles([]);
      }
      
    } catch (error) {
      message.error('加载可用资源失败: ' + (error.message || '未知错误'));
      console.error('Load available resources error:', error);
      setAvailableGuides([]);
      setAvailableVehicles([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAutoAssign = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);
      
      const assignmentData = {
        assignmentDate: values.assignmentDate.format('YYYY-MM-DD'),
        startTime: values.startTime.format('HH:mm:ss'),
        endTime: values.endTime.format('HH:mm:ss'),
        location: values.location,
        totalPeople: values.totalPeople,
        tourScheduleOrderIds: selectedOrders.map(order => order.id),
        priority: 1,
        assignmentStatus: 'confirmed'
      };
      
      const result = await autoAssignGuideVehicle(assignmentData);
      
      if (result.code === 1) {
        message.success('自动分配成功！');
        onSuccess && onSuccess(result.data);
        onCancel();
      } else {
        message.error(result.msg || '自动分配失败');
      }
    } catch (error) {
      message.error('自动分配失败');
      console.error('Auto assign error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleManualAssign = async () => {
    if (!selectedGuide || !selectedVehicle) {
      message.warning('请选择导游和车辆');
      return;
    }

    setLoading(true);
    try {
      const values = await form.validateFields();
      
      // 从选中订单中汇总信息
      const totalAdultCount = selectedOrders.reduce((sum, order) => 
        sum + (parseInt(order.adult_count) || 0), 0);
      const totalChildCount = selectedOrders.reduce((sum, order) => 
        sum + (parseInt(order.child_count) || 0), 0);
      
      // 获取第一个订单的联系信息作为主要联系方式
      const firstOrder = selectedOrders[0] || {};
      
      // 提取接送地点信息
      const pickupLocations = selectedOrders
        .map(order => order.pickup_location)
        .filter(loc => loc && loc.trim())
        .join('; ');
      
      const dropoffLocations = selectedOrders
        .map(order => order.dropoff_location)
        .filter(loc => loc && loc.trim())
        .join('; ');

      const assignmentData = {
        assignmentDate: values.assignmentDate.format('YYYY-MM-DD'),
        startTime: values.startTime.format('HH:mm:ss'),
        endTime: values.endTime.format('HH:mm:ss'),
        location: values.location,
        destination: values.location, // 字段映射：location -> destination
        totalPeople: values.totalPeople,
        adultCount: totalAdultCount,
        childCount: totalChildCount,
        contactPerson: firstOrder.contact_name || firstOrder.customer_name || '待确认',
        contactPhone: firstOrder.contact_phone || firstOrder.customer_phone || '待确认',
        pickupMethod: 'hotel_pickup', // 默认酒店接送
        pickupLocation: pickupLocations || values.location || '待确认',
        dropoffLocation: dropoffLocations || values.location || '待确认',
        guideId: selectedGuide.guideId,
        vehicleId: selectedVehicle.vehicleId,
        tourScheduleOrderIds: selectedOrders.map(order => order.id),
        priority: 1,
        assignmentStatus: 'confirmed',
        remarks: values.remarks,
        // 添加其他可选字段
        specialRequirements: selectedOrders
          .map(order => order.special_requirements)
          .filter(req => req && req.trim())
          .join('; ') || null,
        dietaryRestrictions: selectedOrders
          .map(order => order.dietary_restrictions)
          .filter(diet => diet && diet.trim())
          .join('; ') || null,
        emergencyContact: firstOrder.emergency_contact || null,
        languagePreference: 'chinese' // 默认中文
      };
      
      let result;
      
      if (isEditMode && assignmentId) {
        // 修改模式：调用更新API
        console.log('更新分配，ID:', assignmentId, '数据:', assignmentData);
        result = await updateGuideVehicleAssignment(assignmentId, assignmentData);
        
        if (result.code === 1) {
          message.success('修改分配成功！');
          onSuccess && onSuccess(result.data);
          onCancel();
        } else {
          message.error(result.msg || '修改分配失败');
        }
      } else {
        // 新建模式：调用创建API
        console.log('创建新分配，数据:', assignmentData);
        result = await manualAssignGuideVehicle(assignmentData);
      
      if (result.code === 1) {
        message.success('手动分配成功！');
        onSuccess && onSuccess(result.data);
        onCancel();
      } else {
        message.error(result.msg || '手动分配失败');
        }
      }
    } catch (error) {
      const errorMsg = isEditMode ? '修改分配失败' : '手动分配失败';
      message.error(errorMsg);
      console.error('Manual assign/update error:', error);
    } finally {
      setLoading(false);
    }
  };

  // 导游表格列定义
  const guideColumns = [
    {
      title: '导游姓名',
      dataIndex: 'guideName',
      key: 'guideName',
      render: (text, record) => (
        <div>
          <UserOutlined style={{ marginRight: 8 }} />
          {text}
          {record.recommended && <Tag color="gold" style={{ marginLeft: 8 }}>推荐</Tag>}
        </div>
      )
    },
    {
      title: '语言能力',
      dataIndex: 'languages',
      key: 'languages'
    },
    {
      title: '经验年数',
      dataIndex: 'experienceYears',
      key: 'experienceYears',
      render: text => text ? `${text}年` : '-'
    },
    {
      title: '日费率',
      dataIndex: 'dailyRate',
      key: 'dailyRate',
      render: text => text ? `$${text}` : '-'
    },
    {
      title: '可用时间',
      key: 'availableTime',
      render: (text, record) => (
        <div>
          <ClockCircleOutlined style={{ marginRight: 4 }} />
          {record.availableStartTime} - {record.availableEndTime}
        </div>
      )
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: status => {
        const statusMap = {
          'available': { color: 'green', text: '可用' },
          'busy': { color: 'orange', text: '忙碌' },
          'off': { color: 'red', text: '休息' }
        };
        const statusInfo = statusMap[status] || { color: 'default', text: status };
        return <Tag color={statusInfo.color}>{statusInfo.text}</Tag>;
      }
    }
  ];

  // 车辆表格列定义
  const vehicleColumns = [
    {
      title: '车辆信息',
      key: 'vehicleInfo',
      render: (text, record) => (
        <div>
          <CarOutlined style={{ marginRight: 8 }} />
          {record.vehicleType} - {record.licensePlate}
          {record.recommended && <Tag color="gold" style={{ marginLeft: 8 }}>推荐</Tag>}
        </div>
      )
    },
    {
      title: '座位数',
      dataIndex: 'seatCount',
      key: 'seatCount',
      render: text => `${text}座`
    },
    {
      title: '当前位置',
      dataIndex: 'currentLocation',
      key: 'currentLocation',
      render: text => (
        <div>
          <EnvironmentOutlined style={{ marginRight: 4 }} />
          {text || '-'}
        </div>
      )
    },
    {
      title: '油量',
      dataIndex: 'fuelLevel',
      key: 'fuelLevel',
      render: text => text ? `${text}%` : '-'
    },
    {
      title: '可用时间',
      key: 'availableTime',
      render: (text, record) => (
        <div>
          <ClockCircleOutlined style={{ marginRight: 4 }} />
          {record.availableStartTime} - {record.availableEndTime}
        </div>
      )
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: status => {
        const statusMap = {
          'available': { color: 'green', text: '可用' },
          'in_use': { color: 'orange', text: '使用中' },
          'maintenance': { color: 'red', text: '维护中' }
        };
        const statusInfo = statusMap[status] || { color: 'default', text: status };
        return <Tag color={statusInfo.color}>{statusInfo.text}</Tag>;
      }
    }
  ];

  return (
    <Modal
      title={isEditMode ? "修改导游和车辆分配" : "分配导游和车辆"}
      open={visible}
      onCancel={onCancel}
      width={1200}
      footer={null}
      destroyOnClose
      className="guide-vehicle-assign-modal"
    >
      <Form form={form} layout="vertical">
        <Row gutter={16}>
          <Col span={8}>
            <Form.Item
              label="分配日期"
              name="assignmentDate"
              rules={[{ required: true, message: '请选择分配日期' }]}
            >
              <DatePicker style={{ width: '100%' }} />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              label="开始时间"
              name="startTime"
              rules={[{ required: true, message: '请选择开始时间' }]}
            >
              <TimePicker format="HH:mm" style={{ width: '100%' }} />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              label="结束时间"
              name="endTime"
              rules={[{ required: true, message: '请选择结束时间' }]}
            >
              <TimePicker format="HH:mm" style={{ width: '100%' }} />
            </Form.Item>
          </Col>
        </Row>
        
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              label="主要地点"
              name="location"
              rules={[{ required: true, message: '请输入地点' }]}
            >
              <Select>
                {locations.map(location => (
                  <Option key={location} value={location}>{location}</Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              label="总人数"
              name="totalPeople"
            >
              <Select disabled>
                <Option value={totalPeople}>{totalPeople}人</Option>
              </Select>
            </Form.Item>
          </Col>
        </Row>

        <Form.Item label="备注" name="remarks">
          <Input.TextArea rows={2} placeholder="请输入备注信息" />
        </Form.Item>
        
        {/* 如果是修改模式，显示当前分配信息 */}
        {isEditMode && (
          <Card 
            size="small" 
            className="current-assignment-card"
            style={{ 
              marginBottom: 16, 
              backgroundColor: '#d4edda', 
              border: '1px solid #c3e6cb',
              borderRadius: '6px',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
            }}
          >
            <div style={{ 
              padding: '4px 0',
              fontSize: '14px',
              fontWeight: 'bold',
              color: '#155724',
              marginBottom: '8px',
              textAlign: 'center'
            }}>
              📋 当前分配信息
            </div>
            <Row gutter={16}>
              <Col span={12}>
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
                  <UserOutlined style={{ marginRight: 8, color: '#28a745', fontSize: '16px' }} />
                  <span><strong>当前导游：</strong>{selectedOrders[0]?.currentGuideName || '未知'}</span>
                </div>
              </Col>
              <Col span={12}>
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
                  <CarOutlined style={{ marginRight: 8, color: '#28a745', fontSize: '16px' }} />
                  <span><strong>当前车辆：</strong>{selectedOrders[0]?.currentVehicleInfo || '未知'}</span>
                </div>
              </Col>
            </Row>
          </Card>
        )}
      </Form>

      <Divider />

      <Tabs 
        activeKey={assignmentMode} 
        onChange={setAssignmentMode}
        items={[
          // 修改模式下隐藏自动分配选项
          ...(!isEditMode ? [{
            key: 'auto',
            label: '自动分配',
            children: (
              <Card style={{ borderRadius: '6px' }}>
                <div style={{ textAlign: 'center', marginBottom: '16px' }}>
                  <div style={{ 
                    fontSize: '16px', 
                    fontWeight: 'bold', 
                    color: '#007bff',
                    marginBottom: '8px'
                  }}>
                    🤖 智能自动分配
                  </div>
                  <p style={{ color: '#6c757d', fontSize: '14px' }}>
                    系统将根据以下条件自动为您分配最合适的导游和车辆：
                  </p>
                </div>
                <Row gutter={16}>
                  <Col span={12}>
                    <ul style={{ 
                      listStyle: 'none', 
                      padding: 0, 
                      margin: 0,
                      fontSize: '14px',
                      color: '#6c757d'
                    }}>
                      <li style={{ marginBottom: '8px', display: 'flex', alignItems: 'center' }}>
                        <span style={{ color: '#28a745', marginRight: '8px' }}>✓</span>
                        导游语言能力匹配
                      </li>
                      <li style={{ marginBottom: '8px', display: 'flex', alignItems: 'center' }}>
                        <span style={{ color: '#28a745', marginRight: '8px' }}>✓</span>
                        车辆容量满足需求
                      </li>
                    </ul>
                  </Col>
                  <Col span={12}>
                    <ul style={{ 
                      listStyle: 'none', 
                      padding: 0, 
                      margin: 0,
                      fontSize: '14px',
                      color: '#6c757d'
                    }}>
                      <li style={{ marginBottom: '8px', display: 'flex', alignItems: 'center' }}>
                        <span style={{ color: '#28a745', marginRight: '8px' }}>✓</span>
                        时间无冲突
                      </li>
                      <li style={{ marginBottom: '8px', display: 'flex', alignItems: 'center' }}>
                        <span style={{ color: '#28a745', marginRight: '8px' }}>✓</span>
                        地理位置就近原则
                      </li>
                </ul>
                  </Col>
                </Row>
                <div style={{ textAlign: 'center', marginTop: '24px' }}>
                <Button 
                  type="primary" 
                  size="large" 
                  loading={loading}
                  onClick={handleAutoAssign}
                    className="action-button"
                    style={{ 
                      height: '44px',
                      padding: '0 32px',
                      borderRadius: '6px',
                      fontSize: '16px',
                      fontWeight: 'bold'
                    }}
                    icon={<UserOutlined />}
                  >
                    开始自动分配
                </Button>
                </div>
              </Card>
            )
          }] : []),
          {
            key: 'manual',
            label: isEditMode ? '修改分配' : '手动分配',
            children: (
              <div>
                <Row gutter={16}>
                  <Col span={12}>
                    <Card title="选择导游" size="small">
                      <Table
                        columns={guideColumns}
                        dataSource={availableGuides}
                        rowKey="guideId"
                        size="small"
                        pagination={false}
                        scroll={{ y: 300 }}
                        rowSelection={{
                          type: 'radio',
                          selectedRowKeys: selectedGuide ? [selectedGuide.guideId] : [],
                          onSelect: (record) => setSelectedGuide(record)
                        }}
                        loading={loading}
                      />
                    </Card>
                  </Col>
                  <Col span={12}>
                    <Card title="选择车辆" size="small">
                      <Table
                        columns={vehicleColumns}
                        dataSource={availableVehicles}
                        rowKey="vehicleId"
                        size="small"
                        pagination={false}
                        scroll={{ y: 300 }}
                        rowSelection={{
                          type: 'radio',
                          selectedRowKeys: selectedVehicle ? [selectedVehicle.vehicleId] : [],
                          onSelect: (record) => setSelectedVehicle(record)
                        }}
                        loading={loading}
                      />
                    </Card>
                  </Col>
                </Row>
                
                <div style={{ textAlign: 'center', marginTop: 16 }}>
                  <Button 
                    type="primary" 
                    size="large" 
                    loading={loading}
                    onClick={handleManualAssign}
                    disabled={!selectedGuide || !selectedVehicle}
                    className="action-button"
                    style={{ 
                      height: '44px',
                      padding: '0 32px',
                      borderRadius: '6px',
                      fontSize: '16px',
                      fontWeight: 'bold'
                    }}
                    icon={isEditMode ? <CarOutlined /> : <UserOutlined />}
                  >
                    {isEditMode ? '确认修改' : '确认分配'}
                  </Button>
                </div>
              </div>
            )
          }
        ]}
      />

      <Divider />
      
      <Card 
        title={
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span>📋 散拼团客人详细信息</span>
            <span style={{ fontSize: '12px', color: '#666', fontWeight: 'normal' }}>
              ({selectedOrders?.length || 0}个订单)
            </span>
          </div>
        } 
        size="small" 
        style={{ borderRadius: '6px' }}
      >
        <div style={{ maxHeight: 200, overflowY: 'auto' }}>
          {selectedOrders && selectedOrders.length > 0 ? (
            <div>
              {/* 如果是合并记录，显示合并信息 */}
              {selectedOrders.some(order => order.is_from_merged) && (
                <div style={{
                  backgroundColor: '#fff2e8',
                  border: '1px solid #ffd591',
                  borderRadius: '4px',
                  padding: '8px',
                  marginBottom: '12px',
                  fontSize: '12px'
                }}>
                  <div style={{ fontWeight: 'bold', color: '#d46b08', marginBottom: '4px' }}>
                    🔄 合并地点提醒
                  </div>
                  <div style={{ color: '#8c4a02' }}>
                    以下客人被合并分配到同一导游，但实际目的地可能不同，请仔细核对：
                  </div>
                </div>
              )}
              
              {/* 显示订单列表 */}
              {selectedOrders.map((order, index) => {
                const totalPeople = (parseInt(order.adult_count) || 0) + (parseInt(order.child_count) || 0);
                
                return (
                  <div 
                    key={order.id}
                    style={{
                      border: '1px solid #e8e8e8',
                      borderRadius: '6px',
                      padding: '10px',
                      marginBottom: '8px',
                      backgroundColor: '#fafafa'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      {/* 左侧：订单和客人信息 */}
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '6px' }}>
                          <span style={{ 
                            fontWeight: 'bold', 
                            color: '#262626',
                            fontSize: '13px'
                          }}>
                            {order.order_number || `ORDER-${order.id}`}
                          </span>
                          <span style={{ 
                            marginLeft: '8px',
                            color: '#666',
                            fontSize: '12px'
                          }}>
                            {order.customer_name || '未知客户'}
                          </span>
                          <Tag 
                            style={{ 
                              marginLeft: '8px',
                              fontSize: '11px',
                              padding: '1px 6px',
                              height: '20px'
                            }}
                            color="blue"
                          >
                            {totalPeople}人
                          </Tag>
                        </div>
                        
                        {/* 联系方式和特殊要求 */}
                        <div style={{ fontSize: '11px', color: '#8c8c8c' }}>
                          {order.contact_phone && (
                            <span style={{ marginRight: '12px' }}>
                              📞 {order.contact_phone}
                            </span>
                          )}
                          {order.special_requirements && (
                            <span>💡 {order.special_requirements}</span>
                          )}
                        </div>
                      </div>
                      
                      {/* 右侧：地点信息 */}
                      <div style={{ textAlign: 'right', minWidth: '120px' }}>
                        <div style={{
                          backgroundColor: getLocationColor(order.original_tour_location),
                          color: 'white',
                          padding: '4px 8px',
                          borderRadius: '4px',
                          fontSize: '12px',
                          fontWeight: 'bold',
                          marginBottom: '4px'
                        }}>
                          📍 {order.original_tour_location}
                        </div>
                        
                        {/* 显示完整地点名称 */}
                        <div style={{ 
                          fontSize: '10px', 
                          color: '#666',
                          wordWrap: 'break-word',
                          maxWidth: '120px'
                        }}>
                          {order.original_full_title?.replace('一日游', '') || order.title?.replace('一日游', '')}
                        </div>
                        
                        {/* 如果是合并记录，显示合并标识 */}
                        {order.is_from_merged && (
                          <Tag 
                            size="small" 
                            color="orange" 
                            style={{ 
                              fontSize: '10px',
                              marginTop: '2px',
                              padding: '0 4px'
                            }}
                          >
                            合并
                          </Tag>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
              
              {/* 底部汇总信息 */}
              <div style={{
                backgroundColor: '#f0f9ff',
                border: '1px solid #d1ecf1',
                borderRadius: '4px',
                padding: '8px',
                marginTop: '8px',
                fontSize: '12px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span><strong>总订单数：</strong>{selectedOrders.length}</span>
                  <span><strong>总人数：</strong>{selectedOrders.reduce((sum, order) => sum + (parseInt(order.adult_count) || 0) + (parseInt(order.child_count) || 0), 0)}</span>
                </div>
                <div style={{ marginTop: '4px', color: '#666' }}>
                  <strong>涉及地点：</strong>
                  {[...new Set(selectedOrders.map(order => order.original_tour_location))].map(location => (
                    <Tag 
                      key={location}
                      size="small" 
                      style={{ 
                        marginLeft: '4px',
                        fontSize: '10px',
                        backgroundColor: getLocationColor(location),
                        color: 'white',
                        border: 'none'
                      }}
                    >
                      {location}
              </Tag>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div style={{ textAlign: 'center', color: '#6c757d', padding: '20px' }}>
              📝 暂无选中的订单
            </div>
          )}
        </div>
      </Card>
    </Modal>
  );
};

export default GuideVehicleAssignModal; 