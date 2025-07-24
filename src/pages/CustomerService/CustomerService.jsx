import React, { useState, useEffect } from 'react';
import {
  Table,
  Card,
  Button,
  Space,
  Tag,
  Modal,
  Form,
  Input,
  Select,
  InputNumber,
  Switch,
  message,
  Badge,
  Tooltip,
  Row,
  Col,
  Statistic
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  EyeOutlined,
  PoweroffOutlined,
  MessageOutlined,
  UserOutlined,
  ClockCircleOutlined
} from '@ant-design/icons';
import { customerServiceApi } from '@/api/customerService';
import './CustomerService.scss';

const { Option } = Select;

const CustomerService = () => {
  const [loading, setLoading] = useState(false);
  const [serviceList, setServiceList] = useState([]);
  const [statistics, setStatistics] = useState({});
  const [modalVisible, setModalVisible] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const [form] = Form.useForm();

  useEffect(() => {
    fetchServiceList();
    fetchStatistics();
  }, []);

  // 获取客服列表
  const fetchServiceList = async () => {
    setLoading(true);
    try {
      // 🔧 修复：传递正确的分页参数
      const params = {
        page: 1,
        pageSize: 10
      };
      
      const response = await customerServiceApi.getServiceList(params);
      console.log('🔍 客服列表API响应:', response);
      
      // 🔧 修复：确保数据是数组类型
      let serviceData = [];
      if (response && response.data) {
        if (Array.isArray(response.data)) {
          serviceData = response.data;
        } else if (response.data.records && Array.isArray(response.data.records)) {
          serviceData = response.data.records;
        } else if (response.data.list && Array.isArray(response.data.list)) {
          serviceData = response.data.list;
        } else {
          console.warn('⚠️ 客服列表API返回数据格式异常:', response.data);
          serviceData = [];
        }
      }
      
      console.log('✅ 设置客服列表数据:', serviceData);
      setServiceList(serviceData);
    } catch (error) {
      console.error('❌ 获取客服列表失败:', error);
      message.error('获取客服列表失败：' + error.message);
      // 确保出错时也设置为空数组
      setServiceList([]);
    } finally {
      setLoading(false);
    }
  };

  // 获取统计数据
  const fetchStatistics = async () => {
    try {
      const response = await customerServiceApi.getStatistics();
      setStatistics(response.data || {});
    } catch (error) {
      console.error('获取统计数据失败：', error);
    }
  };

  // 在线状态颜色映射
  const getOnlineStatusColor = (status) => {
    const statusMap = {
      0: 'default', // 离线
      1: 'success', // 在线
      2: 'warning', // 忙碌
      3: 'processing' // 暂离
    };
    return statusMap[status] || 'default';
  };

  // 在线状态文本映射
  const getOnlineStatusText = (status) => {
    const statusMap = {
      0: '离线',
      1: '在线',
      2: '忙碌',
      3: '暂离'
    };
    return statusMap[status] || '未知';
  };

  // 服务等级颜色映射
  const getServiceLevelColor = (level) => {
    const levelMap = {
      1: 'default', // 初级
      2: 'blue',    // 中级
      3: 'orange',  // 高级
      4: 'red'      // 专家
    };
    return levelMap[level] || 'default';
  };

  // 服务等级文本映射
  const getServiceLevelText = (level) => {
    const levelMap = {
      1: '初级',
      2: '中级',
      3: '高级',
      4: '专家'
    };
    return levelMap[level] || '未知';
  };

  // 🔧 修改：角色类型映射，支持管理员、操作员、客服
  const getRoleText = (role, record) => {
    const roleMap = {
      1: '管理员',
      2: '操作员', 
      3: '客服',
      4: '导游'
    };
    
    // 返回角色名称，并在后面显示服务等级（如果有的话）
    const roleName = roleMap[role] || '未知角色';
    const serviceLevel = record.serviceLevel ? getServiceLevelText(record.serviceLevel) : '';
    
    // 对于有服务等级的角色，显示等级信息
    if (serviceLevel && role !== 1) {
      return `${roleName} (${serviceLevel})`;
    }
    
    return roleName;
  };

  // 切换在线状态
  const toggleOnlineStatus = async (employeeId, currentStatus) => {
    try {
      const newStatus = currentStatus === 1 ? 0 : 1;
      await customerServiceApi.updateOnlineStatus(employeeId, newStatus);
      message.success(newStatus === 1 ? '已上线' : '已下线');
      fetchServiceList();
    } catch (error) {
      message.error('状态切换失败：' + error.message);
    }
  };

  // 打开编辑模态框
  const handleEdit = (record) => {
    setEditingService(record);
    form.setFieldsValue({
      name: record.name,
      username: record.username,
      phone: record.phone,
      role: record.role, // 添加角色字段
      skillTags: record.skillTags ? record.skillTags.split(',') : [],
      serviceLevel: record.serviceLevel,
      maxConcurrentCustomers: record.maxConcurrentCustomers
    });
    setModalVisible(true);
  };

  // 新增客服
  const handleAdd = () => {
    setEditingService(null);
    form.resetFields();
    setModalVisible(true);
  };

  // 查看客服会话记录
  const handleViewSessions = (record) => {
    // 跳转到会话管理页面，并过滤显示该客服的会话
    window.open(`/customer-service/sessions?serviceId=${record.employeeId}&serviceName=${record.name}`, '_blank');
  };

  // 保存客服信息
  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      const data = {
        ...values,
        skillTags: values.skillTags ? values.skillTags.join(',') : ''
      };

      if (editingService) {
        await customerServiceApi.updateService(editingService.employeeId, data);
        message.success('更新成功');
      } else {
        await customerServiceApi.createService(data);
        message.success('创建成功');
      }

      setModalVisible(false);
      fetchServiceList();
    } catch (error) {
      if (error.errorFields) {
        message.error('请检查表单信息');
      } else {
        message.error('保存失败：' + error.message);
      }
    }
  };

  // 表格列定义
  const columns = [
    {
      title: '工号',
      dataIndex: 'serviceNo',
      key: 'serviceNo',
      width: 100
    },
    {
      title: '姓名',
      dataIndex: 'name',
      key: 'name',
      width: 100
    },
    {
      title: '角色',
      dataIndex: 'role',
      key: 'role',
      width: 120,
      render: (role, record) => (
        <Tag color="blue">
          {getRoleText(role, record)}
        </Tag>
      )
    },
    {
      title: '在线状态',
      dataIndex: 'onlineStatus',
      key: 'onlineStatus',
      width: 100,
      render: (status, record) => (
        <Space>
          <Badge 
            status={getOnlineStatusColor(status)} 
            text={getOnlineStatusText(status)} 
          />
          <Switch
            checked={status === 1}
            onChange={() => toggleOnlineStatus(record.employeeId, status)}
            size="small"
          />
        </Space>
      )
    },
    {
      title: '服务状态',
      key: 'serviceStatus',
      width: 120,
      render: (_, record) => (
        <Space direction="vertical" size="small">
          <span>
            {record.currentCustomerCount}/{record.maxConcurrentCustomers}
          </span>
          <div style={{ width: '60px', height: '6px', backgroundColor: '#f0f0f0', borderRadius: '3px' }}>
            <div
              style={{
                width: `${(record.currentCustomerCount / record.maxConcurrentCustomers) * 100}%`,
                height: '100%',
                backgroundColor: record.currentCustomerCount >= record.maxConcurrentCustomers ? '#ff4d4f' : '#52c41a',
                borderRadius: '3px'
              }}
            />
          </div>
        </Space>
      )
    },
    {
      title: '服务等级',
      dataIndex: 'serviceLevel',
      key: 'serviceLevel',
      width: 100,
      render: (level) => (
        <Tag color={getServiceLevelColor(level)}>
          {getServiceLevelText(level)}
        </Tag>
      )
    },
    {
      title: '技能标签',
      dataIndex: 'skillTags',
      key: 'skillTags',
      width: 200,
      render: (tags) => (
        tags ? tags.split(',').map(tag => (
          <Tag key={tag} color="blue" style={{ marginBottom: '2px' }}>
            {tag}
          </Tag>
        )) : '-'
      )
    },
    {
      title: '最后活跃',
      dataIndex: 'lastActiveTime',
      key: 'lastActiveTime',
      width: 150,
      render: (time) => time ? new Date(time).toLocaleString() : '-'
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      fixed: 'right',
      render: (_, record) => (
        <Space>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            编辑
          </Button>
          <Button
            type="link"
            icon={<MessageOutlined />}
            onClick={() => handleViewSessions(record)}
          >
            会话
          </Button>
        </Space>
      )
    }
  ];

  return (
    <div className="customer-service-page">
      {/* 统计卡片 */}
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="团队总数"
              value={statistics.totalServices || 0}
              prefix={<UserOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="在线成员"
              value={statistics.onlineServices || 0}
              prefix={<Badge status="success" />}
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="活跃会话"
              value={statistics.activeSessions || 0}
              prefix={<MessageOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="等待队列"
              value={statistics.waitingQueue || 0}
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
      </Row>

      {/* 主要内容 */}
      <Card
        title="客服团队管理"
        extra={
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleAdd}
          >
            新增成员
          </Button>
        }
      >
        <Table
          columns={columns}
          dataSource={serviceList}
          rowKey="employeeId"
          loading={loading}
          scroll={{ x: 1200 }}
          pagination={{
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条记录`
          }}
        />
      </Card>

      {/* 编辑/新增模态框 */}
      <Modal
        title={editingService ? '编辑团队成员' : '新增团队成员'}
        open={modalVisible}
        onOk={handleSave}
        onCancel={() => setModalVisible(false)}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          initialValues={{
            role: 3, // 默认客服角色
            serviceLevel: 1,
            maxConcurrentCustomers: 5
          }}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="姓名"
                name="name"
                rules={[{ required: true, message: '请输入姓名' }]}
              >
                <Input placeholder="请输入姓名" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="用户名"
                name="username"
                rules={[{ required: true, message: '请输入用户名' }]}
              >
                <Input placeholder="请输入用户名" disabled={!!editingService} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="角色"
                name="role"
                rules={[{ required: true, message: '请选择角色' }]}
              >
                <Select placeholder="请选择角色">
                  <Option value={1}>管理员</Option>
                  <Option value={2}>操作员</Option>
                  <Option value={3}>客服</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="手机号"
                name="phone"
                rules={[
                  { required: true, message: '请输入手机号' },
                  { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号' }
                ]}
              >
                <Input placeholder="请输入手机号" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="服务等级"
                name="serviceLevel"
                rules={[{ required: true, message: '请选择服务等级' }]}
              >
                <Select placeholder="请选择服务等级">
                  <Option value={1}>初级</Option>
                  <Option value={2}>中级</Option>
                  <Option value={3}>高级</Option>
                  <Option value={4}>专家</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="最大并发客户数"
                name="maxConcurrentCustomers"
                rules={[{ required: true, message: '请输入最大并发客户数' }]}
              >
                <InputNumber
                  min={1}
                  max={20}
                  placeholder="最大并发客户数"
                  style={{ width: '100%' }}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="技能标签"
                name="skillTags"
              >
                <Select
                  mode="tags"
                  placeholder="请选择或输入技能标签"
                  options={[
                    { label: '旅游咨询', value: '旅游咨询' },
                    { label: 'AI转人工', value: 'AI转人工' },
                    { label: '投诉处理', value: '投诉处理' },
                    { label: '订单问题', value: '订单问题' },
                    { label: '退款处理', value: '退款处理' }
                  ]}
                />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>
    </div>
  );
};

export default CustomerService; 