import React, { useState, useEffect } from 'react';
import { Table, Button, Space, Modal, message, Switch, Tag, InputNumber } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, ExclamationCircleOutlined, PercentageOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { getAgentList, deleteAgent, enableOrDisableAgent, updateAgentDiscountRate } from '@/apis/agent';
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
  const [currentAgent, setCurrentAgent] = useState(null);
  const [discountRate, setDiscountRate] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    fetchAgents();
  }, [pagination.current, pagination.pageSize]);

  const fetchAgents = async () => {
    setLoading(true);
    try {
      const params = {
        page: pagination.current,
        pageSize: pagination.pageSize,
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
    setDiscountModalVisible(true);
  };

  const handleDiscountOk = async () => {
    try {
      const res = await updateAgentDiscountRate(currentAgent.id, discountRate / 100);
      if (res.code === 1) {
        message.success('更新折扣率成功');
        setDiscountModalVisible(false);
        fetchAgents();
      } else {
        message.error(res.msg || '更新折扣率失败');
      }
    } catch (error) {
      console.error('更新折扣率失败:', error);
      message.error('更新折扣率失败');
    }
  };

  const handleDiscountCancel = () => {
    setDiscountModalVisible(false);
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
      title: '折扣率',
      dataIndex: 'discountRate',
      key: 'discountRate',
      render: (discountRate) => `${(discountRate * 100).toFixed(0)}%`,
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
        title="设置折扣率"
        open={discountModalVisible}
        onOk={handleDiscountOk}
        onCancel={handleDiscountCancel}
      >
        <div style={{ marginBottom: '16px' }}>
          当前代理商: {currentAgent?.companyName}
        </div>
        <div>
          <span style={{ marginRight: '8px' }}>折扣率:</span>
          <InputNumber
            min={0}
            max={100}
            value={discountRate}
            onChange={setDiscountRate}
            formatter={(value) => `${value}%`}
            parser={(value) => value.replace('%', '')}
          />
          <div style={{ marginTop: '8px', color: 'rgba(0, 0, 0, 0.45)' }}>
            请输入0-100之间的数值，表示折扣百分比。例如：90表示9折。
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Agents; 