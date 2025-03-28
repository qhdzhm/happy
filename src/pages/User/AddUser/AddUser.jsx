import React, { useState, useEffect } from 'react';
import { Form, Input, Button, Card, message, Space } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import { createUser, getUserById, updateUser } from '@/apis/user';
import './AddUser.scss';

const AddUser = () => {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    const { state } = location;
    if (state && state.id) {
      setIsEdit(true);
      setUserId(state.id);
      fetchUserDetails(state.id);
    }
  }, [location]);

  const fetchUserDetails = async (id) => {
    try {
      const res = await getUserById(id);
      if (res.code === 1) {
        const userData = res.data;
        form.setFieldsValue({
          username: userData.username,
          firstName: userData.firstName,
          lastName: userData.lastName,
          email: userData.email,
          phone: userData.phone,
        });
      } else {
        message.error(res.msg || '获取用户详情失败');
      }
    } catch (error) {
      console.error('获取用户详情失败:', error);
      message.error('获取用户详情失败');
    }
  };

  const handleSubmit = async (values) => {
    setLoading(true);
    try {
      const userData = { 
        ...values,
        role: 'customer',  // 设定为客户角色
        userType: 'regular' // 设定为普通用户类型
      };
      let res;

      if (isEdit) {
        userData.id = userId;
        res = await updateUser(userData);
      } else {
        res = await createUser(userData);
      }

      if (res.code === 1) {
        message.success(isEdit ? '更新客户成功' : '创建客户成功');
        navigate('/user');
      } else {
        message.error(res.msg || (isEdit ? '更新客户失败' : '创建客户失败'));
      }
    } catch (error) {
      console.error(isEdit ? '更新客户失败:' : '创建客户失败:', error);
      message.error(isEdit ? '更新客户失败' : '创建客户失败');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    navigate('/user');
  };

  return (
    <div className="add-user-container">
      <Card
        title={
          <Space>
            <Button icon={<ArrowLeftOutlined />} onClick={handleBack} type="link" />
            {isEdit ? '编辑客户' : '添加客户'}
          </Space>
        }
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          <Form.Item
            name="username"
            label="用户名"
            rules={[{ required: true, message: '请输入用户名' }]}
          >
            <Input placeholder="请输入用户名" />
          </Form.Item>

          {!isEdit && (
            <Form.Item
              name="password"
              label="密码"
              rules={[{ required: true, message: '请输入密码' }]}
            >
              <Input.Password placeholder="请输入密码" />
            </Form.Item>
          )}

          <Form.Item
            name="firstName"
            label="名"
            rules={[{ required: true, message: '请输入名' }]}
          >
            <Input placeholder="请输入名" />
          </Form.Item>

          <Form.Item
            name="lastName"
            label="姓"
            rules={[{ required: true, message: '请输入姓' }]}
          >
            <Input placeholder="请输入姓" />
          </Form.Item>

          <Form.Item
            name="email"
            label="邮箱"
            rules={[
              { required: true, message: '请输入邮箱' },
              { type: 'email', message: '请输入有效的邮箱地址' },
            ]}
          >
            <Input placeholder="请输入邮箱" />
          </Form.Item>

          <Form.Item
            name="phone"
            label="电话"
            rules={[{ required: true, message: '请输入电话' }]}
          >
            <Input placeholder="请输入电话" />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading}>
              {isEdit ? '更新' : '添加'}
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default AddUser; 