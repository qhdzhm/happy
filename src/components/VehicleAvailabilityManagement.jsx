import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Button,
  DatePicker,
  TimePicker,
  Select,
  Form,
  Modal,
  message,
  Space,
  Tag,
  Row,
  Col,
  Tooltip,
  Popconfirm,
  Alert,
  Badge,
  Input,
  InputNumber
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  CalendarOutlined,
  ClockCircleOutlined,
  CarOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ExclamationCircleOutlined,
  ToolOutlined,
  GasStationOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { getVehicleAvailability, setVehicleAvailability, batchSetVehicleAvailability } from '@/api/vehicleAvailability';

const { RangePicker } = DatePicker;
const { Option } = Select;

const VehicleAvailabilityManagement = ({ vehicleId, vehicleInfo }) => {
  const [loading, setLoading] = useState(false);
  const [availabilityData, setAvailabilityData] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [batchModalVisible, setBatchModalVisible] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [form] = Form.useForm();
  const [batchForm] = Form.useForm();
  const [dateRange, setDateRange] = useState([dayjs(), dayjs().add(30, 'day')]);

  // 状态选项
  const statusOptions = [
    { value: 'available', label: '可用', color: 'success', icon: <CheckCircleOutlined /> },
    { value: 'maintenance', label: '维护中', color: 'warning', icon: <ToolOutlined /> },
    { value: 'assigned', label: '已分配', color: 'processing', icon: <ClockCircleOutlined /> },
    { value: 'unavailable', label: '不可用', color: 'error', icon: <CloseCircleOutlined /> }
  ];

  // 获取可用性数据
  const fetchAvailabilityData = async () => {
    if (!vehicleId) return;
    
    setLoading(true);
    try {
      const params = {
        vehicleId,
        startDate: dateRange[0].format('YYYY-MM-DD'),
        endDate: dateRange[1].format('YYYY-MM-DD')
      };
      
      const response = await getVehicleAvailability(params);
      if (response.code === 1) {
        setAvailabilityData(response.data || []);
      } else {
        message.error(response.msg || '获取可用性数据失败');
      }
    } catch (error) {
      console.error('获取可用性数据失败:', error);
      message.error('获取可用性数据失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (vehicleId) {
      fetchAvailabilityData();
    }
  }, [vehicleId, dateRange]);

  // 处理日期范围变化
  const handleDateRangeChange = (dates) => {
    if (dates && dates.length === 2) {
      setDateRange(dates);
    }
  };

  // 打开编辑模态框
  const handleEdit = (record) => {
    setEditingRecord(record);
    form.setFieldsValue({
      date: dayjs(record.availableDate),
      startTime: dayjs(record.startTime, 'HH:mm:ss'),
      endTime: dayjs(record.endTime, 'HH:mm:ss'),
      status: record.status,
      fuelLevel: record.fuelLevel,
      currentLocation: record.currentLocation,
      notes: record.notes
    });
    setModalVisible(true);
  };

  // 添加新的可用性设置
  const handleAdd = () => {
    setEditingRecord(null);
    form.resetFields();
    form.setFieldsValue({
      date: dayjs(),
      startTime: dayjs('07:00', 'HH:mm'),
      endTime: dayjs('19:00', 'HH:mm'),
      status: 'available',
      fuelLevel: 100,
      currentLocation: vehicleInfo?.currentLocation || ''
    });
    setModalVisible(true);
  };

  // 保存可用性设置
  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      const data = {
        vehicleId,
        availableDate: values.date.format('YYYY-MM-DD'),
        startTime: values.startTime.format('HH:mm:ss'),
        endTime: values.endTime.format('HH:mm:ss'),
        status: values.status,
        fuelLevel: values.fuelLevel || 100,
        currentLocation: values.currentLocation || '',
        notes: values.notes || ''
      };

      const response = await setVehicleAvailability(data);
      if (response.code === 1) {
        message.success('保存成功');
        setModalVisible(false);
        fetchAvailabilityData();
      } else {
        message.error(response.msg || '保存失败');
      }
    } catch (error) {
      console.error('保存失败:', error);
      message.error('保存失败');
    }
  };

  // 批量设置可用性
  const handleBatchSet = async () => {
    try {
      const values = await batchForm.validateFields();
      const data = {
        vehicleId,
        startDate: values.dateRange[0].format('YYYY-MM-DD'),
        endDate: values.dateRange[1].format('YYYY-MM-DD'),
        startTime: values.startTime.format('HH:mm:ss'),
        endTime: values.endTime.format('HH:mm:ss'),
        status: values.status,
        fuelLevel: values.fuelLevel || 100,
        currentLocation: values.currentLocation || '',
        notes: values.notes || '',
        excludeWeekends: values.excludeWeekends || false
      };

      const response = await batchSetVehicleAvailability(data);
      if (response.code === 1) {
        message.success('批量设置成功');
        setBatchModalVisible(false);
        fetchAvailabilityData();
      } else {
        message.error(response.msg || '批量设置失败');
      }
    } catch (error) {
      console.error('批量设置失败:', error);
      message.error('批量设置失败');
    }
  };

  // 删除可用性设置
  const handleDelete = async (record) => {
    try {
      const data = {
        vehicleId,
        availableDate: record.availableDate
      };
      
      // 设置为不可用状态
      const response = await setVehicleAvailability({
        ...data,
        status: 'unavailable'
      });
      
      if (response.code === 1) {
        message.success('删除成功');
        fetchAvailabilityData();
      } else {
        message.error(response.msg || '删除失败');
      }
    } catch (error) {
      console.error('删除失败:', error);
      message.error('删除失败');
    }
  };

  // 获取状态标签
  const getStatusTag = (status) => {
    const option = statusOptions.find(opt => opt.value === status);
    if (!option) return <Tag>未知</Tag>;
    
    return (
      <Tag color={option.color} icon={option.icon}>
        {option.label}
      </Tag>
    );
  };

  // 获取油量标签
  const getFuelLevelTag = (fuelLevel) => {
    let color = 'success';
    if (fuelLevel < 30) color = 'error';
    else if (fuelLevel < 50) color = 'warning';
    
    return (
      <Space>
        <GasStationOutlined />
        <Tag color={color}>{fuelLevel}%</Tag>
      </Space>
    );
  };

  // 表格列定义
  const columns = [
    {
      title: '日期',
      dataIndex: 'availableDate',
      key: 'availableDate',
      render: (date) => (
        <Space>
          <CalendarOutlined />
          {dayjs(date).format('YYYY-MM-DD')}
          <Tag color="blue">{dayjs(date).format('dddd')}</Tag>
        </Space>
      ),
      sorter: (a, b) => dayjs(a.availableDate).unix() - dayjs(b.availableDate).unix(),
    },
    {
      title: '可用时间',
      key: 'timeRange',
      render: (_, record) => (
        <Space>
          <ClockCircleOutlined />
          {record.startTime} - {record.endTime}
        </Space>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status) => getStatusTag(status),
      filters: statusOptions.map(opt => ({ text: opt.label, value: opt.value })),
      onFilter: (value, record) => record.status === value,
    },
    {
      title: '油量',
      dataIndex: 'fuelLevel',
      key: 'fuelLevel',
      render: (fuelLevel) => getFuelLevelTag(fuelLevel),
      sorter: (a, b) => (a.fuelLevel || 0) - (b.fuelLevel || 0),
    },
    {
      title: '当前位置',
      dataIndex: 'currentLocation',
      key: 'currentLocation',
      ellipsis: {
        showTitle: false,
      },
      render: (location) => (
        <Tooltip placement="topLeft" title={location}>
          {location || '-'}
        </Tooltip>
      ),
    },
    {
      title: '备注',
      dataIndex: 'notes',
      key: 'notes',
      ellipsis: {
        showTitle: false,
      },
      render: (notes) => (
        <Tooltip placement="topLeft" title={notes}>
          {notes || '-'}
        </Tooltip>
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 120,
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="编辑">
            <Button
              type="link"
              icon={<EditOutlined />}
              onClick={() => handleEdit(record)}
              size="small"
            />
          </Tooltip>
          <Tooltip title="删除">
            <Popconfirm
              title="确定要删除这条可用性设置吗？"
              onConfirm={() => handleDelete(record)}
              okText="确定"
              cancelText="取消"
            >
              <Button
                type="link"
                danger
                icon={<DeleteOutlined />}
                size="small"
              />
            </Popconfirm>
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Card
        title={
          <Space>
            <CarOutlined />
            {vehicleInfo ? `${vehicleInfo.licensePlate} (${vehicleInfo.vehicleType}) - 可用性管理` : '车辆可用性管理'}
          </Space>
        }
        extra={
          <Space>
            <RangePicker
              value={dateRange}
              onChange={handleDateRangeChange}
              format="YYYY-MM-DD"
            />
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => setBatchModalVisible(true)}
            >
              批量设置
            </Button>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleAdd}
            >
              添加设置
            </Button>
          </Space>
        }
      >
        <Alert
          message="提示"
          description="可以设置车辆在特定日期的可用时间、状态、油量和位置信息。系统会根据这些设置来推荐合适的车辆。"
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
        />

        <Table
          columns={columns}
          dataSource={availabilityData}
          loading={loading}
          rowKey={(record) => `${record.vehicleId}-${record.availableDate}`}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条记录`,
          }}
          scroll={{ x: 800 }}
        />
      </Card>

      {/* 编辑/添加模态框 */}
      <Modal
        title={editingRecord ? '编辑可用性设置' : '添加可用性设置'}
        open={modalVisible}
        onOk={handleSave}
        onCancel={() => setModalVisible(false)}
        width={600}
      >
        <Form form={form} layout="vertical">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="date"
                label="日期"
                rules={[{ required: true, message: '请选择日期' }]}
              >
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="status"
                label="状态"
                rules={[{ required: true, message: '请选择状态' }]}
              >
                <Select>
                  {statusOptions.map(option => (
                    <Option key={option.value} value={option.value}>
                      <Space>
                        {option.icon}
                        {option.label}
                      </Space>
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>
          
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="startTime"
                label="开始时间"
                rules={[{ required: true, message: '请选择开始时间' }]}
              >
                <TimePicker format="HH:mm" style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="endTime"
                label="结束时间"
                rules={[{ required: true, message: '请选择结束时间' }]}
              >
                <TimePicker format="HH:mm" style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="fuelLevel"
                label="油量 (%)"
                rules={[{ required: true, message: '请输入油量' }]}
              >
                <InputNumber
                  min={0}
                  max={100}
                  style={{ width: '100%' }}
                  placeholder="请输入油量百分比"
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="currentLocation"
                label="当前位置"
              >
                <Input placeholder="请输入当前位置" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="notes" label="备注">
            <Input.TextArea rows={3} placeholder="请输入备注信息" />
          </Form.Item>
        </Form>
      </Modal>

      {/* 批量设置模态框 */}
      <Modal
        title="批量设置可用性"
        open={batchModalVisible}
        onOk={handleBatchSet}
        onCancel={() => setBatchModalVisible(false)}
        width={600}
      >
        <Form form={batchForm} layout="vertical">
          <Form.Item
            name="dateRange"
            label="日期范围"
            rules={[{ required: true, message: '请选择日期范围' }]}
          >
            <RangePicker style={{ width: '100%' }} />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="startTime"
                label="开始时间"
                rules={[{ required: true, message: '请选择开始时间' }]}
              >
                <TimePicker format="HH:mm" style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="endTime"
                label="结束时间"
                rules={[{ required: true, message: '请选择结束时间' }]}
              >
                <TimePicker format="HH:mm" style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="status"
                label="状态"
                rules={[{ required: true, message: '请选择状态' }]}
              >
                <Select>
                  {statusOptions.map(option => (
                    <Option key={option.value} value={option.value}>
                      <Space>
                        {option.icon}
                        {option.label}
                      </Space>
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="fuelLevel"
                label="油量 (%)"
                rules={[{ required: true, message: '请输入油量' }]}
              >
                <InputNumber
                  min={0}
                  max={100}
                  style={{ width: '100%' }}
                  placeholder="请输入油量百分比"
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="currentLocation" label="当前位置">
            <Input placeholder="请输入当前位置" />
          </Form.Item>

          <Form.Item name="excludeWeekends" label="排除周末">
            <Select>
              <Option value={false}>包含周末</Option>
              <Option value={true}>排除周末</Option>
            </Select>
          </Form.Item>

          <Form.Item name="notes" label="备注">
            <Input.TextArea rows={3} placeholder="请输入备注信息" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default VehicleAvailabilityManagement; 