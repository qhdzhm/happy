import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Modal, Form, Input, message, Popconfirm } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { getDayTourThemes, createDayTourTheme, updateDayTourTheme, deleteDayTourTheme } from '@/apis/daytour';
import './ThemeManagement.scss';

const ThemeManagement = () => {
  const [themes, setThemes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingTheme, setEditingTheme] = useState(null);
  const [form] = Form.useForm();

  useEffect(() => {
    fetchThemes();
  }, []);

  const fetchThemes = async () => {
    setLoading(true);
    try {
      const res = await getDayTourThemes();
      if (res.code === 1) {
        setThemes(res.data || []);
      } else {
        message.error(res.msg || '获取主题列表失败');
      }
    } catch (error) {
      console.error('获取主题列表失败:', error);
      message.error('获取主题列表失败');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setEditingTheme(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (theme) => {
    setEditingTheme(theme);
    form.setFieldsValue({
      name: theme.name,
      description: theme.description
    });
    setModalVisible(true);
  };

  const handleDelete = async (themeId) => {
    try {
      const res = await deleteDayTourTheme(themeId);
      if (res.code === 1) {
        message.success('删除主题成功');
        fetchThemes();
      } else {
        message.error(res.msg || '删除主题失败');
      }
    } catch (error) {
      console.error('删除主题失败:', error);
      message.error('删除主题失败');
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      const data = {
        ...values
      };

      let res;
      if (editingTheme) {
        data.themeId = editingTheme.themeId;
        res = await updateDayTourTheme(data);
      } else {
        res = await createDayTourTheme(data);
      }

      if (res.code === 1) {
        message.success(editingTheme ? '更新主题成功' : '创建主题成功');
        setModalVisible(false);
        fetchThemes();
      } else {
        message.error(res.msg || (editingTheme ? '更新主题失败' : '创建主题失败'));
      }
    } catch (error) {
      console.error(editingTheme ? '更新主题失败:' : '创建主题失败:', error);
      message.error(editingTheme ? '更新主题失败' : '创建主题失败');
    }
  };

  const columns = [
    {
      title: 'ID',
      dataIndex: 'themeId',
      key: 'themeId',
      width: 100
    },
    {
      title: '名称',
      dataIndex: 'name',
      key: 'name'
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description'
    },
    {
      title: '操作',
      key: 'actions',
      width: 200,
      render: (_, record) => (
        <div className="action-buttons">
          <Button 
            type="primary" 
            icon={<EditOutlined />} 
            size="small" 
            onClick={() => handleEdit(record)}
          >
            编辑
          </Button>
          <Popconfirm
            title="确定要删除此主题吗？"
            onConfirm={() => handleDelete(record.themeId)}
            okText="确定"
            cancelText="取消"
          >
            <Button 
              type="primary" 
              danger 
              icon={<DeleteOutlined />} 
              size="small"
            >
              删除
            </Button>
          </Popconfirm>
        </div>
      )
    }
  ];

  return (
    <div className="theme-management">
      <Card 
        title="一日游主题管理" 
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
            添加主题
          </Button>
        }
      >
        <Table
          columns={columns}
          dataSource={themes}
          rowKey="themeId"
          loading={loading}
          pagination={{ pageSize: 10 }}
        />
      </Card>

      <Modal
        title={editingTheme ? "编辑主题" : "添加主题"}
        visible={modalVisible}
        onCancel={() => setModalVisible(false)}
        onOk={handleSubmit}
        okText={editingTheme ? "更新" : "创建"}
        cancelText="取消"
      >
        <Form
          form={form}
          layout="vertical"
        >
          <Form.Item
            name="name"
            label="名称"
            rules={[{ required: true, message: '请输入主题名称' }]}
          >
            <Input placeholder="请输入主题名称" />
          </Form.Item>

          <Form.Item
            name="description"
            label="描述"
          >
            <Input.TextArea rows={4} placeholder="请输入主题描述" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default ThemeManagement; 