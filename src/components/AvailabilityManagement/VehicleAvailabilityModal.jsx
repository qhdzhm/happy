import React, { useState, useEffect } from 'react';
import {
  Modal,
  Table,
  Button,
  DatePicker,
  Select,
  Form,
  Space,
  message,
  Popconfirm,
  Tag,
  Row,
  Col,
  Card,
  Statistic,
  Alert,
  Input
} from 'antd';
import {
  PlusOutlined,
  DeleteOutlined,
  CarOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  InfoCircleOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { 
  getVehicleAvailability, 
  setVehicleAvailability, 
  batchSetVehicleAvailability, 
  deleteVehicleAvailability,
  getVehicleAvailabilityStats 
} from '@/api/vehicleAvailability';

const { RangePicker } = DatePicker;
const { Option } = Select;

const VehicleAvailabilityModal = ({ visible, onCancel, vehicle }) => {
  const [loading, setLoading] = useState(false);
  const [availabilityList, setAvailabilityList] = useState([]);
  const [form] = Form.useForm();
  const [batchForm] = Form.useForm();
  const [dateRange, setDateRange] = useState([]);
  const [stats, setStats] = useState({});
  const [showBatchForm, setShowBatchForm] = useState(false);

  // 可用性状态选项
  const statusOptions = [
    { label: '可用', value: 'available', color: 'success' },
    { label: '使用中', value: 'in_use', color: 'processing' },
    { label: '维修中', value: 'maintenance', color: 'warning' },
    { label: '停用', value: 'out_of_service', color: 'error' }
  ];

  // 获取可用性列表
  const fetchAvailabilityList = async () => {
    if (!vehicle) return;
    
    setLoading(true);
    try {
      const params = {
        vehicleId: vehicle.vehicleId
      };
      
      // 只有在用户选择了日期范围时才添加日期参数
      if (dateRange[0] && dateRange[1]) {
        params.startDate = dayjs(dateRange[0]).format('YYYY-MM-DD');
        params.endDate = dayjs(dateRange[1]).format('YYYY-MM-DD');
      }
      
      const response = await getVehicleAvailability(params);
      if (response.code === 1) {
        setAvailabilityList(response.data || []);
      } else {
        message.error(response.msg || '获取可用性列表失败');
      }
    } catch (error) {
      console.error('获取可用性列表失败:', error);
      message.error('获取可用性列表失败');
    } finally {
      setLoading(false);
    }
  };

  // 获取统计信息
  const fetchStats = async () => {
    if (!vehicle) return;
    
    try {
      const params = { 
        vehicleId: vehicle.vehicleId
      };
      
      // 只有在用户选择了日期范围时才添加日期参数
      if (dateRange[0] && dateRange[1]) {
        params.startDate = dayjs(dateRange[0]).format('YYYY-MM-DD');
        params.endDate = dayjs(dateRange[1]).format('YYYY-MM-DD');
      }
      
      const response = await getVehicleAvailabilityStats(params);
      if (response.code === 1) {
        setStats(response.data || {});
      }
    } catch (error) {
      console.error('获取统计信息失败:', error);
    }
  };

  useEffect(() => {
    if (visible && vehicle) {
      fetchAvailabilityList();
      fetchStats();
    }
  }, [visible, vehicle]);

  // 日期范围变化
  const handleDateRangeChange = (dates) => {
    setDateRange(dates || []);
  };

  // 查询
  const handleSearch = () => {
    fetchAvailabilityList();
  };

  // 重置
  const handleReset = () => {
    setDateRange([]);
    fetchAvailabilityList();
  };

  // 添加单个设置
  const handleAddSingle = async (values) => {
    try {
      const data = {
        vehicleId: vehicle.vehicleId,
        availableDate: dayjs(values.date).format('YYYY-MM-DD'),
        startTime: values.startTime || '08:00:00',
        endTime: values.endTime || '18:00:00',
        status: values.status,
        notes: values.notes || ''
      };
      
      const response = await setVehicleAvailability(data);
      if (response.code === 1) {
        message.success('设置成功');
        form.resetFields();
        fetchAvailabilityList();
        fetchStats();
      } else {
        message.error(response.msg || '设置失败');
      }
    } catch (error) {
      console.error('设置失败:', error);
      message.error('设置失败');
    }
  };

  // 批量设置
  const handleBatchSet = async (values) => {
    try {
      const data = {
        vehicleId: vehicle.vehicleId,
        startDate: dayjs(values.dateRange[0]).format('YYYY-MM-DD'),
        endDate: dayjs(values.dateRange[1]).format('YYYY-MM-DD'),
        startTime: values.startTime || '08:00:00',
        endTime: values.endTime || '18:00:00',
        status: values.status,
        notes: values.notes || ''
      };
      
      const response = await batchSetVehicleAvailability(data);
      if (response.code === 1) {
        message.success('批量设置成功');
        batchForm.resetFields();
        setShowBatchForm(false);
        fetchAvailabilityList();
        fetchStats();
      } else {
        message.error(response.msg || '批量设置失败');
      }
    } catch (error) {
      console.error('批量设置失败:', error);
      message.error('批量设置失败');
    }
  };

  // 删除设置
  const handleDelete = async (record) => {
    try {
      const response = await deleteVehicleAvailability({
        vehicleId: vehicle.vehicleId,
        date: record.date
      });
      
      if (response.code === 1) {
        message.success('删除成功');
        fetchAvailabilityList();
        fetchStats();
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
    return (
      <Tag color={option?.color || 'default'}>
        {option?.label || '未知'}
      </Tag>
    );
  };

  // 表格列定义
  const columns = [
    {
      title: '日期',
      dataIndex: 'date',
      key: 'date',
      render: (date) => dayjs(date).format('YYYY-MM-DD')
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status) => getStatusTag(status)
    },
    {
      title: '备注',
      dataIndex: 'notes',
      key: 'notes',
      ellipsis: true
    },
    {
      title: '创建时间',
      dataIndex: 'createTime',
      key: 'createTime',
      render: (time) => time ? dayjs(time).format('YYYY-MM-DD HH:mm') : '-'
    },
    {
      title: '操作',
      key: 'action',
      width: 100,
      render: (_, record) => (
        <Popconfirm
          title="确定要删除这条设置吗？"
          onConfirm={() => handleDelete(record)}
          okText="确定"
          cancelText="取消"
        >
          <Button
            type="primary"
            danger
            size="small"
            icon={<DeleteOutlined />}
          />
        </Popconfirm>
      )
    }
  ];

  return (
    <Modal
      title={
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <CarOutlined style={{ color: '#1890ff', marginRight: '8px' }} />
          <span>管理可用性 - {vehicle?.licensePlate}</span>
        </div>
      }
      open={visible}
      onCancel={onCancel}
      width={1000}
      footer={null}
      destroyOnClose
    >
      {/* 统计信息 */}
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="本月可用天数"
              value={stats.availableDays || 0}
              prefix={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="本月不可用天数"
              value={stats.unavailableDays || 0}
              prefix={<CloseCircleOutlined style={{ color: '#ff4d4f' }} />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="当前分配数"
              value={stats.currentAssignments || 0}
              prefix={<InfoCircleOutlined style={{ color: '#1890ff' }} />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="可用性比例"
              value={stats.availabilityRate || 0}
              suffix="%"
              precision={1}
            />
          </Card>
        </Col>
      </Row>

      {/* 查询区域 */}
      <Card size="small" style={{ marginBottom: 16 }}>
        <Row gutter={16} align="middle">
          <Col span={8}>
            <RangePicker
              value={dateRange}
              onChange={handleDateRangeChange}
              placeholder={['开始日期', '结束日期']}
              style={{ width: '100%' }}
            />
          </Col>
          <Col span={8}>
            <Space>
              <Button type="primary" onClick={handleSearch}>
                查询
              </Button>
              <Button onClick={handleReset}>
                重置
              </Button>
            </Space>
          </Col>
          <Col span={8} style={{ textAlign: 'right' }}>
            <Space>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => setShowBatchForm(!showBatchForm)}
              >
                批量设置
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* 批量设置表单 */}
      {showBatchForm && (
        <Card size="small" style={{ marginBottom: 16 }}>
          <Alert
            message="批量设置"
            description="选择日期范围和状态，批量设置车辆的可用性"
            type="info"
            showIcon
            style={{ marginBottom: 16 }}
          />
          <Form
            form={batchForm}
            layout="inline"
            onFinish={handleBatchSet}
          >
            <Form.Item
              name="dateRange"
              label="日期范围"
              rules={[{ required: true, message: '请选择日期范围' }]}
            >
              <RangePicker placeholder={['开始日期', '结束日期']} />
            </Form.Item>
            <Form.Item
              name="status"
              label="状态"
              rules={[{ required: true, message: '请选择状态' }]}
            >
              <Select placeholder="选择状态" style={{ width: 120 }}>
                {statusOptions.map(option => (
                  <Option key={option.value} value={option.value}>
                    {option.label}
                  </Option>
                ))}
              </Select>
            </Form.Item>
            <Form.Item name="notes" label="备注">
              <Input placeholder="备注信息" style={{ width: 200 }} />
            </Form.Item>
            <Form.Item>
              <Space>
                <Button type="primary" htmlType="submit">
                  批量设置
                </Button>
                <Button onClick={() => setShowBatchForm(false)}>
                  取消
                </Button>
              </Space>
            </Form.Item>
          </Form>
        </Card>
      )}

      {/* 单个添加表单 */}
      <Card size="small" style={{ marginBottom: 16 }}>
        <Form
          form={form}
          layout="inline"
          onFinish={handleAddSingle}
        >
          <Form.Item
            name="date"
            label="日期"
            rules={[{ required: true, message: '请选择日期' }]}
          >
            <DatePicker placeholder="选择日期" />
          </Form.Item>
          <Form.Item
            name="status"
            label="状态"
            rules={[{ required: true, message: '请选择状态' }]}
          >
            <Select placeholder="选择状态" style={{ width: 120 }}>
              {statusOptions.map(option => (
                <Option key={option.value} value={option.value}>
                  {option.label}
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="notes" label="备注">
            <Input placeholder="备注信息" style={{ width: 200 }} />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" icon={<PlusOutlined />}>
              添加设置
            </Button>
          </Form.Item>
        </Form>
      </Card>

      {/* 可用性列表 */}
      <Table
        columns={columns}
        dataSource={availabilityList}
        rowKey={(record) => `${record.vehicleId}-${record.date}`}
        loading={loading}
        pagination={{
          pageSize: 10,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total) => `共 ${total} 条记录`
        }}
        scroll={{ y: 300 }}
      />
    </Modal>
  );
};

export default VehicleAvailabilityModal; 