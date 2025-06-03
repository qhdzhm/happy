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
  Divider,
  Badge,
  Input
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  CalendarOutlined,
  ClockCircleOutlined,
  UserOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ExclamationCircleOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { getGuideAvailability, setGuideAvailability, batchSetGuideAvailability } from '@/api/guideAvailability';

const { RangePicker } = DatePicker;
const { Option } = Select;

const GuideAvailabilityManagement = ({ guideId, guideName }) => {
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
    { value: 'off', label: '请假', color: 'default', icon: <CloseCircleOutlined /> },
    { value: 'sick', label: '生病', color: 'warning', icon: <ExclamationCircleOutlined /> },
    { value: 'busy', label: '忙碌', color: 'processing', icon: <ClockCircleOutlined /> }
  ];

  // 获取可用性数据
  const fetchAvailabilityData = async () => {
    if (!guideId) return;
    
    setLoading(true);
    try {
      const params = {
        guideId,
        startDate: dateRange[0].format('YYYY-MM-DD'),
        endDate: dateRange[1].format('YYYY-MM-DD')
      };
      
      const response = await getGuideAvailability(params);
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
    if (guideId) {
      fetchAvailabilityData();
    }
  }, [guideId, dateRange]);

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
      date: dayjs(record.date),
      availableStartTime: dayjs(record.availableStartTime, 'HH:mm:ss'),
      availableEndTime: dayjs(record.availableEndTime, 'HH:mm:ss'),
      status: record.status,
      maxGroups: record.maxGroups,
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
      availableStartTime: dayjs('08:00', 'HH:mm'),
      availableEndTime: dayjs('18:00', 'HH:mm'),
      status: 'available',
      maxGroups: 1
    });
    setModalVisible(true);
  };

  // 保存可用性设置
  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      const data = {
        guideId,
        date: values.date.format('YYYY-MM-DD'),
        availableStartTime: values.availableStartTime.format('HH:mm:ss'),
        availableEndTime: values.availableEndTime.format('HH:mm:ss'),
        status: values.status,
        maxGroups: values.maxGroups || 1,
        notes: values.notes || ''
      };

      const response = await setGuideAvailability(data);
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
        guideId,
        startDate: values.dateRange[0].format('YYYY-MM-DD'),
        endDate: values.dateRange[1].format('YYYY-MM-DD'),
        availableStartTime: values.availableStartTime.format('HH:mm:ss'),
        availableEndTime: values.availableEndTime.format('HH:mm:ss'),
        status: values.status,
        maxGroups: values.maxGroups || 1,
        notes: values.notes || '',
        excludeWeekends: values.excludeWeekends || false
      };

      const response = await batchSetGuideAvailability(data);
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
        guideId,
        date: record.date
      };
      
      // 这里可以调用删除API，暂时使用设置为不可用的方式
      const response = await setGuideAvailability({
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
    // 将状态值转换为数字类型进行匹配
    const numericStatus = typeof status === 'string' ? parseInt(status, 10) : status;
    const option = statusOptions.find(opt => opt.value === numericStatus);
    if (!option) return <Tag>未知</Tag>;
    
    return (
      <Tag color={option.color} icon={option.icon}>
        {option.label}
      </Tag>
    );
  };

  // 表格列定义
  const columns = [
    {
      title: '日期',
      dataIndex: 'date',
      key: 'date',
      render: (date) => (
        <Space>
          <CalendarOutlined />
          {dayjs(date).format('YYYY-MM-DD')}
          <Tag color="blue">{dayjs(date).format('dddd')}</Tag>
        </Space>
      ),
      sorter: (a, b) => dayjs(a.date).unix() - dayjs(b.date).unix(),
    },
    {
      title: '可用时间',
      key: 'timeRange',
      render: (_, record) => (
        <Space>
          <ClockCircleOutlined />
          {record.availableStartTime} - {record.availableEndTime}
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
      title: '最大团数',
      dataIndex: 'maxGroups',
      key: 'maxGroups',
      render: (maxGroups) => (
        <Badge count={maxGroups} style={{ backgroundColor: '#52c41a' }} />
      ),
    },
    {
      title: '当前团数',
      dataIndex: 'currentGroups',
      key: 'currentGroups',
      render: (currentGroups = 0) => (
        <Badge count={currentGroups} style={{ backgroundColor: '#1890ff' }} />
      ),
    },
    {
      title: '剩余容量',
      key: 'remainingCapacity',
      render: (_, record) => {
        const remaining = (record.maxGroups || 1) - (record.currentGroups || 0);
        return (
          <Badge 
            count={remaining} 
            style={{ 
              backgroundColor: remaining > 0 ? '#52c41a' : '#ff4d4f' 
            }} 
          />
        );
      },
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
            <UserOutlined />
            {guideName ? `${guideName} - 可用性管理` : '导游可用性管理'}
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
          description="可以设置导游在特定日期的可用时间、状态和最大接团数量。系统会根据这些设置来推荐合适的导游。"
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
        />

        <Table
          columns={columns}
          dataSource={availabilityData}
          loading={loading}
          rowKey={(record) => `${record.guideId}-${record.date}`}
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
                name="availableStartTime"
                label="开始时间"
                rules={[{ required: true, message: '请选择开始时间' }]}
              >
                <TimePicker format="HH:mm" style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="availableEndTime"
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
                name="maxGroups"
                label="最大团数"
                rules={[{ required: true, message: '请输入最大团数' }]}
              >
                <Select>
                  <Option value={1}>1团</Option>
                  <Option value={2}>2团</Option>
                  <Option value={3}>3团</Option>
                  <Option value={4}>4团</Option>
                  <Option value={5}>5团</Option>
                </Select>
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
                name="availableStartTime"
                label="开始时间"
                rules={[{ required: true, message: '请选择开始时间' }]}
              >
                <TimePicker format="HH:mm" style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="availableEndTime"
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
                name="maxGroups"
                label="最大团数"
                rules={[{ required: true, message: '请输入最大团数' }]}
              >
                <Select>
                  <Option value={1}>1团</Option>
                  <Option value={2}>2团</Option>
                  <Option value={3}>3团</Option>
                  <Option value={4}>4团</Option>
                  <Option value={5}>5团</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="excludeWeekends" label="排除周末" valuePropName="checked">
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

export default GuideAvailabilityManagement; 