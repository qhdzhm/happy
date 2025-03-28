import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Modal, Form, Input, message, Popconfirm } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { 
  getDayTourSuitables, 
  getDayTourSuitablesByDayTourId, 
  associateDayTourSuitables,
  createDayTourSuitableFor,
  updateDayTourSuitableFor,
  deleteDayTourSuitableFor
} from '@/apis/daytour';
import './SuitableManagement.scss';

const SuitableManagement = () => {
  const [suitableList, setSuitableList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingSuitable, setEditingSuitable] = useState(null);
  const [form] = Form.useForm();

  useEffect(() => {
    fetchSuitableFor();
  }, []);

  const fetchSuitableFor = async () => {
    setLoading(true);
    try {
      const res = await getDayTourSuitables();
      if (res.code === 1) {
        setSuitableList(res.data || []);
      } else {
        message.error(res.msg || '获取适合人群列表失败');
      }
    } catch (error) {
      console.error('获取适合人群列表失败:', error);
      message.error('获取适合人群列表失败');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setEditingSuitable(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (suitable) => {
    setEditingSuitable(suitable);
    form.setFieldsValue({
      name: suitable.name,
      description: suitable.description
    });
    setModalVisible(true);
  };

  const handleDelete = async (suitableId) => {
    try {
      const res = await deleteDayTourSuitableFor(suitableId);
      if (res.code === 1) {
        message.success('删除适合人群成功');
        fetchSuitableFor();
      } else {
        message.error(res.msg || '删除适合人群失败');
      }
    } catch (error) {
      console.error('删除适合人群失败:', error);
      message.error('删除适合人群失败');
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      const data = {
        ...values
      };

      let res;
      if (editingSuitable) {
        data.suitableId = editingSuitable.suitableId;
        res = await updateDayTourSuitableFor(data);
      } else {
        res = await createDayTourSuitableFor(data);
      }

      if (res.code === 1) {
        message.success(editingSuitable ? '更新适合人群成功' : '创建适合人群成功');
        setModalVisible(false);
        fetchSuitableFor();
      } else {
        message.error(res.msg || (editingSuitable ? '更新适合人群失败' : '创建适合人群失败'));
      }
    } catch (error) {
      console.error(editingSuitable ? '更新适合人群失败:' : '创建适合人群失败:', error);
      message.error(editingSuitable ? '更新适合人群失败' : '创建适合人群失败');
    }
  };

  const columns = [
    {
      title: 'ID',
      dataIndex: 'suitableId',
      key: 'suitableId',
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
            title="确定要删除此适合人群吗？"
            onConfirm={() => handleDelete(record.suitableId)}
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
    <div className="suitable-management">
      <Card 
        title="一日游适合人群管理" 
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
            添加适合人群
          </Button>
        }
      >
        <Table
          columns={columns}
          dataSource={suitableList}
          rowKey="suitableId"
          loading={loading}
          pagination={{ pageSize: 10 }}
        />
      </Card>

      <Modal
        title={editingSuitable ? "编辑适合人群" : "添加适合人群"}
        visible={modalVisible}
        onCancel={() => setModalVisible(false)}
        onOk={handleSubmit}
        okText={editingSuitable ? "更新" : "创建"}
        cancelText="取消"
      >
        <Form
          form={form}
          layout="vertical"
        >
          <Form.Item
            name="name"
            label="名称"
            rules={[{ required: true, message: '请输入适合人群名称' }]}
          >
            <Input placeholder="请输入适合人群名称" />
          </Form.Item>

          <Form.Item
            name="description"
            label="描述"
          >
            <Input.TextArea rows={4} placeholder="请输入适合人群描述" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default SuitableManagement; 