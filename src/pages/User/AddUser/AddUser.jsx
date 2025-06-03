import React, { useState, useEffect } from 'react';
import { Card, Form, Input, Button, message, Space, Select, Radio } from 'antd';
import { useNavigate, useLocation } from 'react-router-dom';
import { createUser, getUserById, updateUser } from '@/apis/user';
import './AddUser.scss';

const { Option } = Select;

const AddUser = () => {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const userId = location.state?.id;
  const isEdit = !!userId;

  useEffect(() => {
    if (userId) {
      fetchUserDetails();
    }
  }, [userId]);

  const fetchUserDetails = async () => {
    setLoading(true);
    try {
      const res = await getUserById(userId);
      if (res.code === 1 && res.data) {
        // 设置默认值并处理可能缺少的字段
        const userData = {
          ...res.data,
          status: res.data.status === undefined ? 1 : res.data.status,
          userType: res.data.userType || 'regular',
          sex: res.data.sex || '1',
          // 处理姓名显示，优先使用name，若没有则尝试使用first_name和last_name
          name: res.data.name || (res.data.first_name && res.data.last_name ? `${res.data.first_name} ${res.data.last_name}` : ''),
          first_name: res.data.first_name || '',
          last_name: res.data.last_name || ''
        };
        form.setFieldsValue(userData);
      } else {
        message.error(res.msg || '获取用户信息失败');
      }
    } catch (error) {
      console.error('获取用户信息失败:', error);
      message.error('获取用户信息失败');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (values) => {
    setLoading(true);
    try {
      // 确保status字段有值
      const userData = {
        ...values,
        status: values.status === undefined ? 1 : values.status
      };
      
      // 如果用户表中使用first_name和last_name字段，则拆分name字段
      if (values.name && (!values.first_name || !values.last_name)) {
        const nameParts = values.name.trim().split(' ');
        if (nameParts.length > 1) {
          userData.last_name = nameParts.pop();
          userData.first_name = nameParts.join(' ');
        } else {
          userData.first_name = values.name;
          userData.last_name = '';
        }
      }
      
      let res;
      if (isEdit) {
        res = await updateUser({ ...userData, id: userId });
      } else {
        res = await createUser(userData);
      }

      if (res.code === 1) {
        message.success(isEdit ? '用户更新成功' : '用户添加成功');
        navigate('/user');
      } else {
        message.error(res.msg || (isEdit ? '用户更新失败' : '用户添加失败'));
      }
    } catch (error) {
      console.error(isEdit ? '更新用户失败:' : '添加用户失败:', error);
      message.error(isEdit ? '更新用户失败' : '添加用户失败');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate('/user');
  };

  return (
    <div className="add-user-container">
      <Card title={isEdit ? '编辑用户' : '添加用户'} variant="bordered">
        <Form
          form={form}
          name="userForm"
          labelCol={{ span: 4 }}
          wrapperCol={{ span: 16 }}
          initialValues={{
            userType: 'regular',
            status: 1,
            sex: '1',
          }}
          onFinish={handleSubmit}
          autoComplete="off"
        >
          <Form.Item
            label="用户名"
            name="username"
            rules={[
              { required: true, message: '请输入用户名' },
              { min: 4, message: '用户名至少4个字符' },
            ]}
          >
            <Input disabled={isEdit} placeholder="请输入用户名" />
          </Form.Item>

          {!isEdit && (
            <Form.Item
              label="密码"
              name="password"
              rules={[
                { required: true, message: '请输入密码' },
                { min: 6, message: '密码至少6个字符' },
              ]}
            >
              <Input.Password placeholder="请输入密码" />
            </Form.Item>
          )}

          <Form.Item
            label="姓名"
            name="name"
            rules={[{ required: true, message: '请输入姓名' }]}
          >
            <Input placeholder="请输入姓名" />
          </Form.Item>

          <Form.Item
            label="手机号"
            name="phone"
            rules={[
              { required: true, message: '请输入手机号' },
              { pattern: /^1[3-9]\d{9}$/, message: '请输入有效的手机号' },
            ]}
          >
            <Input placeholder="请输入11位手机号" />
          </Form.Item>

          <Form.Item
            label="邮箱"
            name="email"
            rules={[
              { required: true, message: '请输入邮箱' },
              { type: 'email', message: '请输入有效的邮箱地址' },
            ]}
          >
            <Input placeholder="请输入邮箱地址" />
          </Form.Item>

          <Form.Item
            label="性别"
            name="sex"
          >
            <Radio.Group>
              <Radio value="1">男</Radio>
              <Radio value="0">女</Radio>
            </Radio.Group>
          </Form.Item>

          <Form.Item
            label="用户类型"
            name="userType"
            rules={[{ required: true, message: '请选择用户类型' }]}
          >
            <Select placeholder="请选择用户类型">
              <Option value="regular">普通用户</Option>
              <Option value="agent">代理商</Option>
            </Select>
          </Form.Item>

          {/* 暂时注释掉身份证号字段，因为数据库中不存在此字段 
          <Form.Item
            label="身份证号"
            name="idNumber"
          >
            <Input placeholder="请输入身份证号" />
          </Form.Item>
          */}

          {isEdit && (
            <Form.Item
              label="状态"
              name="status"
            >
              <Radio.Group>
                <Radio value={1}>启用</Radio>
                <Radio value={0}>禁用</Radio>
              </Radio.Group>
            </Form.Item>
          )}

          <Form.Item wrapperCol={{ offset: 4, span: 16 }}>
            <Space>
              <Button type="primary" htmlType="submit" loading={loading}>
                {isEdit ? '更新' : '添加'}
              </Button>
              <Button onClick={handleCancel}>取消</Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default AddUser; 