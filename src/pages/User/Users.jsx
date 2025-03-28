import React, { useState, useEffect } from 'react';
import { Table, Button, Space, Modal, message, Switch, Tag } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { getUserList, deleteUser, enableOrDisableUser } from '@/apis/user';
import './Users.scss';

const { confirm } = Modal;

const Users = () => {
  const [users, setUsers] = useState([]);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchUsers();
  }, [pagination.current, pagination.pageSize]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params = {
        page: pagination.current,
        pageSize: pagination.pageSize,
        role: 'customer',
        userType: 'regular'
      };
      const res = await getUserList(params);
      if (res.code === 1) {
        setUsers(res.data.records);
        setPagination({
          ...pagination,
          total: res.data.total,
        });
      }
    } catch (error) {
      console.error('获取用户列表失败:', error);
      message.error('获取用户列表失败');
    } finally {
      setLoading(false);
    }
  };

  const handleTableChange = (pagination) => {
    setPagination(pagination);
  };

  const handleAddUser = () => {
    navigate('/user/add');
  };

  const handleEditUser = (record) => {
    navigate('/user/add', { state: { id: record.id } });
  };

  const handleDelete = (id) => {
    confirm({
      title: '确定要删除此用户吗?',
      icon: <ExclamationCircleOutlined />,
      content: '此操作不可逆，请谨慎操作。',
      onOk: async () => {
        try {
          const res = await deleteUser(id);
          if (res.code === 1) {
            message.success('删除成功');
            fetchUsers();
          } else {
            message.error(res.msg || '删除失败');
          }
        } catch (error) {
          console.error('删除用户失败:', error);
          message.error('删除用户失败');
        }
      },
    });
  };

  const handleStatusChange = async (checked, record) => {
    try {
      const status = checked ? 1 : 0;
      const res = await enableOrDisableUser(status, record.id);
      if (res.code === 1) {
        message.success(`用户已${checked ? '启用' : '禁用'}`);
        fetchUsers();
      } else {
        message.error(res.msg || `${checked ? '启用' : '禁用'}失败`);
      }
    } catch (error) {
      console.error('更改用户状态失败:', error);
      message.error('更改用户状态失败');
    }
  };

  const columns = [
    {
      title: '用户ID',
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
      title: '姓名',
      key: 'name',
      render: (_, record) => `${record.firstName} ${record.lastName}`,
    },
    {
      title: '邮箱',
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: '电话',
      dataIndex: 'phone',
      key: 'phone',
    },
    {
      title: '注册时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (createdAt) => new Date(createdAt).toLocaleDateString('zh-CN'),
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
          <Button type="primary" icon={<EditOutlined />} onClick={() => handleEditUser(record)}>
            编辑
          </Button>
          <Button danger icon={<DeleteOutlined />} onClick={() => handleDelete(record.id)}>
            删除
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div className="user-container">
      <div className="user-header">
        <h2>客户管理</h2>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAddUser}>
          添加客户
        </Button>
      </div>
      <Table
        columns={columns}
        dataSource={users}
        rowKey="id"
        pagination={pagination}
        loading={loading}
        onChange={handleTableChange}
      />
    </div>
  );
};

export default Users; 