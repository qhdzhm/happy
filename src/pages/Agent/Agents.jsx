import React, { useState, useEffect } from 'react';
import { Table, Button, Space, Modal, message, Switch, Tag, InputNumber, Form, Input, Row, Col, Card, Select } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, ExclamationCircleOutlined, PercentageOutlined, KeyOutlined, SearchOutlined, ReloadOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { getAgentList, deleteAgent, enableOrDisableAgent, updateAgentDiscountRate, resetAgentPassword, updateAgentDiscountLevel } from '@/apis/agent';
import { getAllDiscountLevels } from '@/apis/discount';
import './Agents.scss';

const { confirm } = Modal;

const Agents = () => {
  const [agents, setAgents] = useState([]);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const [loading, setLoading] = useState(false);
  const [discountModalVisible, setDiscountModalVisible] = useState(false);
  const [resetPasswordModalVisible, setResetPasswordModalVisible] = useState(false);
  const [currentAgent, setCurrentAgent] = useState(null);
  const [discountRate, setDiscountRate] = useState(0);
  const [selectedDiscountLevelId, setSelectedDiscountLevelId] = useState(null);
  const [discountLevels, setDiscountLevels] = useState([]);
  const [newPassword, setNewPassword] = useState('');
  const [searchForm] = Form.useForm();
  const [searchParams, setSearchParams] = useState({});
  const navigate = useNavigate();

  useEffect(() => {
    fetchAgents();
    fetchDiscountLevels();
  }, [pagination.current, pagination.pageSize, searchParams]);

  const fetchDiscountLevels = async () => {
    try {
      const res = await getAllDiscountLevels();
      if (res.code === 1) {
        setDiscountLevels(res.data || []);
      }
    } catch (error) {
      console.error('获取折扣等级列表失败:', error);
    }
  };

  const fetchAgents = async () => {
    setLoading(true);
    try {
      const params = {
        page: pagination.current,
        pageSize: pagination.pageSize,
        ...searchParams
      };
      const res = await getAgentList(params);
      if (res.code === 1) {
        setAgents(res.data.records);
        setPagination({
          ...pagination,
          total: res.data.total,
        });
      }
    } catch (error) {
      console.error('获取代理商列表失败:', error);
      message.error('获取代理商列表失败');
    } finally {
      setLoading(false);
    }
  };

  const handleTableChange = (pagination) => {
    setPagination(pagination);
  };

  const handleAddAgent = () => {
    navigate('/agent/add');
  };

  const handleEditAgent = (record) => {
    navigate('/agent/add', { state: { id: record.id } });
  };

  const handleDelete = (id) => {
    confirm({
      title: '确定要删除此代理商吗?',
      icon: <ExclamationCircleOutlined />,
      content: '此操作不可逆，请谨慎操作。',
      onOk: async () => {
        try {
          const res = await deleteAgent(id);
          if (res.code === 1) {
            message.success('删除成功');
            fetchAgents();
          } else {
            message.error(res.msg || '删除失败');
          }
        } catch (error) {
          console.error('删除代理商失败:', error);
          message.error('删除代理商失败');
        }
      },
    });
  };

  const handleStatusChange = async (checked, record) => {
    try {
      const status = checked ? 1 : 0;
      const res = await enableOrDisableAgent(status, record.id);
      if (res.code === 1) {
        message.success(`代理商已${checked ? '启用' : '禁用'}`);
        fetchAgents();
      } else {
        message.error(res.msg || `${checked ? '启用' : '禁用'}失败`);
      }
    } catch (error) {
      console.error('更改代理商状态失败:', error);
      message.error('更改代理商状态失败');
    }
  };

  const showDiscountModal = (record) => {
    setCurrentAgent(record);
    setDiscountRate(record.discountRate * 100);
    setSelectedDiscountLevelId(record.discountLevelId);
    setDiscountModalVisible(true);
  };

  const handleDiscountOk = async () => {
    try {
      // 如果选择了折扣等级，则更新折扣等级；否则更新传统折扣率
      if (selectedDiscountLevelId) {
        const res = await updateAgentDiscountLevel(currentAgent.id, selectedDiscountLevelId);
        if (res.code === 1) {
          message.success('更新折扣等级成功');
          setDiscountModalVisible(false);
          fetchAgents();
        } else {
          message.error(res.msg || '更新折扣等级失败');
        }
      } else {
        const res = await updateAgentDiscountRate(currentAgent.id, discountRate / 100);
        if (res.code === 1) {
          message.success('更新折扣率成功');
          setDiscountModalVisible(false);
          fetchAgents();
        } else {
          message.error(res.msg || '更新折扣率失败');
        }
      }
    } catch (error) {
      console.error('更新折扣配置失败:', error);
      message.error('更新折扣配置失败');
    }
  };

  const handleDiscountCancel = () => {
    setDiscountModalVisible(false);
    setSelectedDiscountLevelId(null);
  };

  // 重置密码相关函数
  const showResetPasswordModal = (record) => {
    setCurrentAgent(record);
    setNewPassword('');
    setResetPasswordModalVisible(true);
  };

  const handleResetPasswordOk = async () => {
    if (!newPassword) {
      message.error('请输入新密码');
      return;
    }

    try {
      const res = await resetAgentPassword(currentAgent.id, newPassword);
      if (res.code === 1) {
        message.success('密码重置成功');
        setResetPasswordModalVisible(false);
      } else {
        message.error(res.msg || '密码重置失败');
      }
    } catch (error) {
      console.error('密码重置失败:', error);
      message.error('密码重置失败');
    }
  };

  const handleResetPasswordCancel = () => {
    setResetPasswordModalVisible(false);
  };

  // 搜索相关函数
  const handleSearch = (values) => {
    // 过滤掉空值
    const filteredValues = Object.entries(values)
      .filter(([_, value]) => value !== undefined && value !== null && value !== '')
      .reduce((acc, [key, value]) => ({ ...acc, [key]: value }), {});
    
    setSearchParams(filteredValues);
    setPagination({ ...pagination, current: 1 }); // 重置到第一页
  };

  const handleReset = () => {
    searchForm.resetFields();
    setSearchParams({});
    setPagination({ ...pagination, current: 1 });
  };

  const columns = [
    {
      title: '代理商ID',
      dataIndex: 'id',
      key: 'id',
      width: 80,
    },
    {
      title: '用户名',
      dataIndex: 'username',
      key: 'username',
    },
    {
      title: '公司名称',
      dataIndex: 'companyName',
      key: 'companyName',
    },
    {
      title: '联系人',
      dataIndex: 'contactPerson',
      key: 'contactPerson',
    },
    {
      title: '电话',
      dataIndex: 'phone',
      key: 'phone',
    },
    {
      title: '邮箱',
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: '折扣配置',
      key: 'discountConfig',
      render: (_, record) => {
        if (record.discountLevelId) {
          const level = discountLevels.find(l => l.id === record.discountLevelId);
          return (
            <div>
              <Tag color="blue">{level ? level.levelCode : '未知等级'}</Tag>
              <div style={{ fontSize: '12px', color: '#666' }}>
                {level ? level.levelName : ''}
              </div>
            </div>
          );
        } else {
          return (
            <div>
              <Tag color="orange">{`${(record.discountRate * 100).toFixed(0)}%`}</Tag>
              <div style={{ fontSize: '12px', color: '#666' }}>
                统一折扣
              </div>
            </div>
          );
        }
      },
    },
    {
      title: '状态',
      key: 'status',
      render: (_, record) => (
        <Switch 
          checked={record.status === 1} 
          onChange={(checked) => handleStatusChange(checked, record)}
        />
      ),
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Space size="middle">
          <Button 
            type="primary" 
            icon={<PercentageOutlined />} 
            onClick={() => showDiscountModal(record)}
          >
            设置折扣
          </Button>
          <Button
            type="primary"
            icon={<KeyOutlined />}
            onClick={() => showResetPasswordModal(record)}
          >
            重置密码
          </Button>
          <Button 
            type="primary" 
            icon={<EditOutlined />} 
            onClick={() => handleEditAgent(record)}
          >
            编辑
          </Button>
          <Button 
            danger 
            icon={<DeleteOutlined />} 
            onClick={() => handleDelete(record.id)}
          >
            删除
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div className="agent-container">
      <Card className="search-card" style={{ marginBottom: 16 }}>
        <Form
          form={searchForm}
          name="agent_search"
          layout="horizontal"
          onFinish={handleSearch}
        >
          <Row gutter={24}>
            <Col span={6}>
              <Form.Item name="companyName" label="公司名称">
                <Input placeholder="请输入公司名称" allowClear />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="contactPerson" label="联系人">
                <Input placeholder="请输入联系人姓名" allowClear />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="phone" label="联系电话">
                <Input placeholder="请输入联系电话" allowClear />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="status" label="账号状态">
                <Select placeholder="请选择状态" allowClear>
                  <Select.Option value={1}>活跃</Select.Option>
                  <Select.Option value={0}>禁用</Select.Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Row>
            <Col span={24} style={{ textAlign: 'right' }}>
              <Space>
                <Button icon={<ReloadOutlined />} onClick={handleReset}>
                  重置
                </Button>
                <Button type="primary" icon={<SearchOutlined />} htmlType="submit">
                  搜索
                </Button>
              </Space>
            </Col>
          </Row>
        </Form>
      </Card>

      <div className="agent-header">
        <h2>代理商管理</h2>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAddAgent}>
          添加代理商
        </Button>
      </div>
      <Table
        columns={columns}
        dataSource={agents}
        rowKey="id"
        pagination={pagination}
        loading={loading}
        onChange={handleTableChange}
        scroll={{ x: 1200 }}
      />

      <Modal
        title="设置折扣配置"
        open={discountModalVisible}
        onOk={handleDiscountOk}
        onCancel={handleDiscountCancel}
        width={600}
      >
        <div style={{ marginBottom: '16px' }}>
          当前代理商: <strong>{currentAgent?.companyName}</strong>
        </div>
        
        <div style={{ marginBottom: '20px' }}>
          <h4>选择折扣模式：</h4>
          <div style={{ marginBottom: '16px' }}>
            <label>
              <input
                type="radio"
                name="discountMode"
                checked={!selectedDiscountLevelId}
                onChange={() => setSelectedDiscountLevelId(null)}
                style={{ marginRight: '8px' }}
              />
              使用统一折扣率
            </label>
          </div>
          <div>
            <label>
              <input
                type="radio"
                name="discountMode"
                checked={!!selectedDiscountLevelId}
                onChange={() => {
                  if (discountLevels.length > 0) {
                    setSelectedDiscountLevelId(discountLevels[0].id);
                  }
                }}
                style={{ marginRight: '8px' }}
              />
              使用折扣等级（推荐）
            </label>
          </div>
        </div>

        {!selectedDiscountLevelId ? (
          <div style={{ marginBottom: '16px', padding: '16px', backgroundColor: '#f5f5f5', borderRadius: '4px' }}>
            <div style={{ marginBottom: '8px' }}>
              <span style={{ marginRight: '8px' }}>统一折扣率:</span>
              <InputNumber
                min={0}
                max={100}
                value={discountRate}
                onChange={setDiscountRate}
                formatter={(value) => `${value}%`}
                parser={(value) => value.replace('%', '')}
              />
            </div>
            <div style={{ color: 'rgba(0, 0, 0, 0.45)', fontSize: '12px' }}>
              请输入0-100之间的数值，表示折扣百分比。例如：90表示9折。
            </div>
          </div>
        ) : (
          <div style={{ marginBottom: '16px', padding: '16px', backgroundColor: '#f0f8ff', borderRadius: '4px' }}>
            <div style={{ marginBottom: '8px' }}>
              <span style={{ marginRight: '8px' }}>折扣等级:</span>
              <Select
                value={selectedDiscountLevelId}
                onChange={setSelectedDiscountLevelId}
                style={{ width: '200px' }}
                placeholder="请选择折扣等级"
              >
                {discountLevels.map(level => (
                  <Select.Option key={level.id} value={level.id}>
                    <Tag color="blue" style={{ marginRight: '8px' }}>{level.levelCode}</Tag>
                    {level.levelName}
                  </Select.Option>
                ))}
              </Select>
            </div>
            <div style={{ color: 'rgba(0, 0, 0, 0.45)', fontSize: '12px' }}>
              折扣等级支持不同产品的个性化折扣配置，比统一折扣更灵活。
            </div>
          </div>
        )}

        <div style={{ backgroundColor: '#fff7e6', padding: '12px', borderRadius: '4px', border: '1px solid #ffd591' }}>
          <strong>说明：</strong>
          <ul style={{ margin: '8px 0 0 0', paddingLeft: '20px' }}>
            <li>统一折扣率：对所有产品使用相同的折扣比例</li>
            <li>折扣等级：可以为不同产品设置不同的折扣，更加灵活</li>
            <li>推荐使用折扣等级，可在"折扣管理"页面配置具体的产品折扣</li>
          </ul>
        </div>
      </Modal>

      <Modal
        title="重置密码"
        open={resetPasswordModalVisible}
        onOk={handleResetPasswordOk}
        onCancel={handleResetPasswordCancel}
      >
        <div style={{ marginBottom: '16px' }}>
          正在为代理商 <strong>{currentAgent?.companyName}</strong> 重置密码
        </div>
        <div>
          <span style={{ marginRight: '8px' }}>新密码:</span>
          <Input.Password
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="请输入新密码"
          />
        </div>
      </Modal>
    </div>
  );
};

export default Agents; 