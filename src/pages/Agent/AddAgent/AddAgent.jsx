import React, { useState, useEffect } from 'react';
import { Form, Input, Button, Card, InputNumber, message, Space } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import { createAgent, getAgentById, updateAgent } from '@/apis/agent';
import './AddAgent.scss';

const AddAgent = () => {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [agentId, setAgentId] = useState(null);

  useEffect(() => {
    const { state } = location;
    if (state && state.id) {
      setIsEdit(true);
      setAgentId(state.id);
      fetchAgentDetails(state.id);
    }
  }, [location]);

  const fetchAgentDetails = async (id) => {
    try {
      const res = await getAgentById(id);
      if (res.code === 1) {
        const agentData = res.data;
        form.setFieldsValue({
          username: agentData.username,
          companyName: agentData.companyName,
          contactPerson: agentData.contactPerson,
          email: agentData.email,
          phone: agentData.phone,
          discountRate: agentData.discountRate * 100,
        });
      } else {
        message.error(res.msg || '获取代理商详情失败');
      }
    } catch (error) {
      console.error('获取代理商详情失败:', error);
      message.error('获取代理商详情失败');
    }
  };

  const handleSubmit = async (values) => {
    setLoading(true);
    // 将百分比转为小数
    const formattedValues = {
      ...values,
      discountRate: values.discountRate / 100,
    };

    try {
      let res;
      if (isEdit) {
        formattedValues.id = agentId;
        res = await updateAgent(formattedValues);
      } else {
        res = await createAgent(formattedValues);
      }

      if (res.code === 1) {
        message.success(isEdit ? '更新代理商成功' : '创建代理商成功');
        navigate('/agent');
      } else {
        message.error(res.msg || (isEdit ? '更新代理商失败' : '创建代理商失败'));
      }
    } catch (error) {
      console.error(isEdit ? '更新代理商失败:' : '创建代理商失败:', error);
      message.error(isEdit ? '更新代理商失败' : '创建代理商失败');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    navigate('/agent');
  };

  return (
    <div className="add-agent-container">
      <Card
        title={
          <Space>
            <Button icon={<ArrowLeftOutlined />} onClick={handleBack} type="link" />
            {isEdit ? '编辑代理商' : '添加代理商'}
          </Space>
        }
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{
            discountRate: 100,
          }}
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
            name="companyName"
            label="公司名称"
            rules={[{ required: true, message: '请输入公司名称' }]}
          >
            <Input placeholder="请输入公司名称" />
          </Form.Item>

          <Form.Item
            name="contactPerson"
            label="联系人"
            rules={[{ required: true, message: '请输入联系人姓名' }]}
          >
            <Input placeholder="请输入联系人姓名" />
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

          <Form.Item
            name="discountRate"
            label="折扣率 (%)"
            rules={[{ required: true, message: '请输入折扣率' }]}
            extra="输入0-100之间的数值，表示折扣百分比。例如：90表示9折。"
          >
            <InputNumber
              min={0}
              max={100}
              formatter={(value) => `${value}%`}
              parser={(value) => value.replace('%', '')}
              style={{ width: '100%' }}
            />
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

export default AddAgent; 