import React, { useState, useEffect } from 'react';
import { Table, Button, Space, Modal, message, Switch, Tag, Tooltip, Input, Select, Row, Col } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, ExclamationCircleOutlined, KeyOutlined, SearchOutlined, ReloadOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { getUserList, deleteUser, updateUserStatus, resetUserPassword } from '@/apis/user';
import './Users.scss';

const { confirm } = Modal;
const { Option } = Select;

const Users = () => {
  const [users, setUsers] = useState([]);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const [searchForm, setSearchForm] = useState({
    name: '',
    phone: '',
    username: '',
    userType: 'regular'
  });

  useEffect(() => {
    fetchUsers();
  }, [pagination.current, pagination.pageSize]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params = {
        page: pagination.current,
        pageSize: pagination.pageSize,
        ...searchForm
      };
      const res = await getUserList(params);
      if (res.code === 1) {
        // 确保数据中的status字段有默认值
        const usersWithDefaultStatus = (res.data.records || []).map(user => ({
          ...user,
          status: user.status === undefined ? 1 : user.status,
          // 处理姓名显示，优先使用name字段，若没有则尝试使用first_name和last_name
          name: user.name || (user.first_name && user.last_name ? `${user.first_name} ${user.last_name}` : '-')
        }));
        setUsers(usersWithDefaultStatus);
        setPagination({
          ...pagination,
          total: res.data.total || 0,
        });
      } else {
        message.error(res.msg || '获取用户列表失败');
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
      const data = {
        id: record.id,
        status: status
      };
      const res = await updateUserStatus(data);
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

  const handleResetPassword = (id) => {
    Modal.confirm({
      title: '重置用户密码',
      icon: <ExclamationCircleOutlined />,
      content: (
        <div>
          <p>请输入新密码：</p>
          <Input.Password
            id="resetPasswordInput"
            placeholder="请输入新密码"
            defaultValue="123456"
          />
        </div>
      ),
      onOk: async () => {
        try {
          const password = document.getElementById('resetPasswordInput').value;
          if (!password) {
            message.error('密码不能为空');
            return Promise.reject('密码不能为空');
          }
          
          const data = {
            id: id,
            password: password
          };
          
          const res = await resetUserPassword(data);
          if (res.code === 1) {
            message.success('密码重置成功');
          } else {
            message.error(res.msg || '密码重置失败');
          }
        } catch (error) {
          console.error('重置密码失败:', error);
          message.error('重置密码失败');
          return Promise.reject(error);
        }
      },
    });
  };

  const handleInputChange = (e, field) => {
    setSearchForm({
      ...searchForm,
      [field]: e.target.value
    });
  };

  const handleSearch = () => {
    setPagination({
      ...pagination,
      current: 1
    });
    fetchUsers();
  };

  const handleReset = () => {
    setSearchForm({
      name: '',
      phone: '',
      username: '',
      userType: 'regular'
    });
    setPagination({
      ...pagination,
      current: 1
    });
    // 使用setTimeout确保状态更新后再查询
    setTimeout(fetchUsers, 0);
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
      dataIndex: 'name',
      key: 'name',
      render: (name) => name || '-',
    },
    {
      title: '手机号',
      dataIndex: 'phone',
      key: 'phone',
    },
    {
      title: '性别',
      dataIndex: 'sex',
      key: 'sex',
      render: (sex) => (sex === '1' ? '男' : sex === '0' ? '女' : '未知'),
    },
    {
      title: '用户类型',
      dataIndex: 'userType',
      key: 'userType',
      render: (userType) => (
        <Tag color={userType === 'regular' ? 'blue' : 'green'}>
          {userType === 'regular' ? '普通用户' : userType === 'agent' ? '代理商' : userType}
        </Tag>
      ),
    },
    {
      title: '注册时间',
      dataIndex: 'createTime',
      key: 'createTime',
      render: (createTime) => createTime ? new Date(createTime).toLocaleString('zh-CN') : '-',
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
          <Tooltip title="编辑">
            <Button type="primary" icon={<EditOutlined />} onClick={() => handleEditUser(record)} />
          </Tooltip>
          <Tooltip title="删除">
            <Button danger icon={<DeleteOutlined />} onClick={() => handleDelete(record.id)} />
          </Tooltip>
          <Tooltip title="重置密码">
            <Button icon={<KeyOutlined />} onClick={() => handleResetPassword(record.id)} />
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <div className="user-container">
      <div className="user-header">
        <h2>普通用户管理</h2>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAddUser}>
          添加用户
        </Button>
      </div>

      <div className="user-search">
        <Row gutter={16}>
          <Col span={5}>
            <Input
              placeholder="用户名"
              value={searchForm.username}
              onChange={(e) => handleInputChange(e, 'username')}
              allowClear
            />
          </Col>
          <Col span={5}>
            <Input
              placeholder="姓名"
              value={searchForm.name}
              onChange={(e) => handleInputChange(e, 'name')}
              allowClear
            />
          </Col>
          <Col span={5}>
            <Input
              placeholder="手机号"
              value={searchForm.phone}
              onChange={(e) => handleInputChange(e, 'phone')}
              allowClear
            />
          </Col>
          <Col span={4}>
            <Button type="primary" icon={<SearchOutlined />} onClick={handleSearch}>
              搜索
            </Button>
            <Button icon={<ReloadOutlined />} onClick={handleReset} style={{ marginLeft: 8 }}>
              重置
            </Button>
          </Col>
        </Row>
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