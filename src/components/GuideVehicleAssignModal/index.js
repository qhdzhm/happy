import React, { useState, useEffect } from 'react';
import { Modal, Form, Select, DatePicker, TimePicker, Button, Table, message, Tabs, Card, Row, Col, Tag, Divider, Input } from 'antd';
import { UserOutlined, CarOutlined, ClockCircleOutlined, EnvironmentOutlined } from '@ant-design/icons';
import moment from 'moment';
import { getAvailableGuides, getAvailableVehicles, autoAssignGuideVehicle, manualAssignGuideVehicle } from '../../api/guideAssignment';

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

  useEffect(() => {
    if (visible) {
      console.log('Modal打开，selectedOrders:', selectedOrders);
      console.log('计算的totalPeople:', totalPeople);
      console.log('计算的mainLocation:', mainLocation);
      
      // 设置默认值
      form.setFieldsValue({
        assignmentDate: selectedDate ? moment(selectedDate) : moment(),
        startTime: moment('08:00', 'HH:mm'),
        endTime: moment('18:00', 'HH:mm'),
        location: mainLocation,
        totalPeople: totalPeople || 1
      });
      
      // 如果有订单数据或者强制加载，则加载可用资源
      if (selectedOrders.length > 0 || totalPeople > 0) {
        loadAvailableResources();
      } else {
        console.warn('没有选中的订单，跳过加载资源');
      }
    }
  }, [visible, selectedOrders, selectedDate, mainLocation, totalPeople]);

  const loadAvailableResources = async () => {
    try {
      setLoading(true);
      const date = form.getFieldValue('assignmentDate')?.format('YYYY-MM-DD') || moment().format('YYYY-MM-DD');
      const startTime = form.getFieldValue('startTime')?.format('HH:mm') || '08:00';
      const endTime = form.getFieldValue('endTime')?.format('HH:mm') || '18:00';
      
      console.log('加载可用资源参数:', { date, startTime, endTime, mainLocation, totalPeople });
      
      const [guidesRes, vehiclesRes] = await Promise.all([
        getAvailableGuides(date, startTime, endTime, mainLocation),
        getAvailableVehicles(date, startTime, endTime, totalPeople)
      ]);
      
      console.log('导游响应:', guidesRes);
      console.log('车辆响应:', vehiclesRes);
      
      // 处理响应数据
      if (guidesRes && guidesRes.code === 1) {
        setAvailableGuides(guidesRes.data || []);
      } else {
        console.warn('导游数据格式异常:', guidesRes);
        setAvailableGuides([]);
      }
      
      if (vehiclesRes && vehiclesRes.code === 1) {
        setAvailableVehicles(vehiclesRes.data || []);
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
        startTime: values.startTime.format('HH:mm'),
        endTime: values.endTime.format('HH:mm'),
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
    try {
      const values = await form.validateFields();
      
      if (!selectedGuide || !selectedVehicle) {
        message.warning('请选择导游和车辆');
        return;
      }
      
      setLoading(true);
      
      const assignmentData = {
        assignmentDate: values.assignmentDate.format('YYYY-MM-DD'),
        startTime: values.startTime.format('HH:mm'),
        endTime: values.endTime.format('HH:mm'),
        location: values.location,
        totalPeople: values.totalPeople,
        guideId: selectedGuide.guideId,
        vehicleId: selectedVehicle.vehicleId,
        tourScheduleOrderIds: selectedOrders.map(order => order.id),
        priority: 1,
        assignmentStatus: 'confirmed',
        remarks: values.remarks
      };
      
      const result = await manualAssignGuideVehicle(assignmentData);
      
      if (result.code === 1) {
        message.success('手动分配成功！');
        onSuccess && onSuccess(result.data);
        onCancel();
      } else {
        message.error(result.msg || '手动分配失败');
      }
    } catch (error) {
      message.error('手动分配失败');
      console.error('Manual assign error:', error);
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
      title="分配导游和车辆"
      open={visible}
      onCancel={onCancel}
      width={1200}
      footer={null}
      destroyOnClose
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
      </Form>

      <Divider />

      <Tabs 
        activeKey={assignmentMode} 
        onChange={setAssignmentMode}
        items={[
          {
            key: 'auto',
            label: '自动分配',
            children: (
              <Card>
                <p>系统将根据以下条件自动为您分配最合适的导游和车辆：</p>
                <ul>
                  <li>导游语言能力匹配</li>
                  <li>车辆容量满足需求</li>
                  <li>时间无冲突</li>
                  <li>地理位置就近原则</li>
                </ul>
                <Button 
                  type="primary" 
                  size="large" 
                  loading={loading}
                  onClick={handleAutoAssign}
                  style={{ marginTop: 16 }}
                >
                  自动分配
                </Button>
              </Card>
            )
          },
          {
            key: 'manual',
            label: '手动分配',
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
                  >
                    确认分配
                  </Button>
                </div>
              </div>
            )
          }
        ]}
      />

      <Divider />
      
      <Card title="选中的订单" size="small">
        <div style={{ maxHeight: 150, overflowY: 'auto' }}>
          {selectedOrders && selectedOrders.length > 0 ? (
            selectedOrders.map(order => (
              <Tag key={order.id} style={{ margin: 4 }}>
                {order.order_number || `ORDER-${order.id}`} - {order.title || '未知行程'} ({(parseInt(order.adult_count) || 0) + (parseInt(order.child_count) || 0)}人)
              </Tag>
            ))
          ) : (
            <div style={{ textAlign: 'center', color: '#999' }}>暂无选中的订单</div>
          )}
        </div>
      </Card>
    </Modal>
  );
};

export default GuideVehicleAssignModal; 