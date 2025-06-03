import React, { useState, useEffect } from 'react';
import { Modal, Form, Select, Input, message, Tabs, Button, Table, Divider, Space, Row, Col } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { updateOrderStatus, getOrderPassengers, updateOrderPassengers } from '../../apis/orderApi';

const { Option } = Select;
const { TextArea } = Input;
const { TabPane } = Tabs;

/**
 * 订单状态更新组件
 * @param {Object} props 组件属性
 * @param {boolean} props.visible 对话框是否可见
 * @param {Function} props.onCancel 取消回调
 * @param {Function} props.onSuccess 成功回调
 * @param {number} props.bookingId 订单ID
 * @param {string} props.currentStatus 当前订单状态
 * @param {string} props.currentPaymentStatus 当前支付状态
 * @param {string} props.className 自定义样式类名
 */
const OrderStatusUpdate = (props) => {
  const {
    visible,
    onCancel,
    onSuccess,
    bookingId,
    currentStatus,
    currentPaymentStatus,
    className
  } = props;

  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('1');
  const [passengers, setPassengers] = useState([]);
  const [editingPassenger, setEditingPassenger] = useState(null);
  const [passengerForm] = Form.useForm();
  const [fetchingPassengers, setFetchingPassengers] = useState(false);

  // 当对话框显示时，获取乘客信息
  useEffect(() => {
    if (visible && bookingId) {
      fetchPassengers();
    }
  }, [visible, bookingId]);

  // 获取乘客信息
  const fetchPassengers = async () => {
    try {
      setFetchingPassengers(true);
      const response = await getOrderPassengers(bookingId);
      if (response.code === 1) {
        setPassengers(response.data || []);
      } else {
        message.error(response.msg || '获取乘客信息失败');
      }
    } catch (error) {
      console.error('获取乘客信息出错:', error);
      message.error('获取乘客信息失败');
    } finally {
      setFetchingPassengers(false);
    }
  };

  // 更新乘客信息到服务器
  const updatePassengersToServer = async (updatedPassengers) => {
    try {
      console.log('准备发送到服务器的乘客数据:', JSON.stringify(updatedPassengers));
      const response = await updateOrderPassengers(bookingId, updatedPassengers);
      console.log('服务器响应结果:', response);
      if (response.code === 1) {
        message.success('乘客信息已保存到服务器');
        return true;
      } else {
        message.error(response.msg || '保存乘客信息失败');
        return false;
      }
    } catch (error) {
      console.error('保存乘客信息出错:', error);
      message.error('保存乘客信息失败');
      return false;
    }
  };

  // 提交表单
  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      // 添加乘客信息到提交数据
      values.passengers = passengers;

      // 先保存乘客信息
      const passengersUpdated = await updatePassengersToServer(passengers);
      
      if (!passengersUpdated) {
        message.warning('乘客信息保存失败，但会继续更新订单状态');
      }

      const response = await updateOrderStatus(bookingId, values);
      if (response.code === 1) {
        message.success('订单信息更新成功');
        form.resetFields();
        onSuccess();
      } else {
        message.error(response.msg || '订单信息更新失败');
      }
    } catch (error) {
      console.error('更新订单信息出错:', error);
    } finally {
      setLoading(false);
    }
  };

  // 关闭对话框
  const handleCancel = () => {
    form.resetFields();
    passengerForm.resetFields();
    setEditingPassenger(null);
    onCancel();
  };

  // 编辑乘客
  const editPassenger = (passenger) => {
    setEditingPassenger(passenger);
    passengerForm.setFieldsValue({
      fullName: passenger.fullName,
      gender: passenger.gender,
      isChild: passenger.isChild ? 'true' : 'false',
      phone: passenger.phone,
      wechatId: passenger.wechatId,
      email: passenger.email
      // 已移除护照号码和国籍字段
    });
  };

  // 保存乘客编辑
  const savePassengerEdit = async () => {
    try {
      const values = await passengerForm.validateFields();
      console.log('表单验证通过，待保存的乘客信息:', values);
      
      // 转换布尔值
      values.isChild = values.isChild === 'true';
      
      if (!editingPassenger || !editingPassenger.passengerId) {
        message.error('无法识别要编辑的乘客');
        return;
      }
      
      // 创建更新后的乘客对象 - 确保包含原始ID和必要字段
      const updatedPassenger = {
        passengerId: editingPassenger.passengerId,
        fullName: values.fullName,
        gender: values.gender,
        isChild: values.isChild,
        // 确保这些字段即使为空也不会导致问题
        phone: values.phone || null,
        wechatId: values.wechatId || null,
        email: values.email || null
        // 已移除护照号码和国籍字段
      };
      
      console.log('更新后的乘客对象:', updatedPassenger);
      
      // 更新现有乘客数据
      const updatedPassengers = passengers.map(p => 
        p.passengerId === editingPassenger.passengerId 
          ? { ...p, ...updatedPassenger }
          : p
      );
      
      console.log('更新后的乘客列表:', updatedPassengers);
      
      // 更新本地状态
      setPassengers(updatedPassengers);
      
      // 显示正在保存的提示
      message.loading('正在保存乘客信息...', 0);
      
      // 保存到服务器
      const result = await updatePassengersToServer(updatedPassengers);
      
      // 关闭加载提示
      message.destroy();
      
      if (!result) {
        // 保存失败，恢复原始数据
        message.error('保存乘客信息失败');
        // 重新获取乘客信息，恢复为服务器端的数据
        await fetchPassengers();
        return;
      }
      
      // 重置表单和编辑状态
      setEditingPassenger(null);
      passengerForm.resetFields();
      
      message.success('乘客信息已更新');
    } catch (error) {
      console.error('保存乘客信息出错:', error);
      message.error('保存乘客信息失败: ' + (error.message || '未知错误'));
    }
  };

  // 添加新乘客
  const addNewPassenger = async () => {
    try {
      const values = await passengerForm.validateFields();
      
      // 转换布尔值
      values.isChild = values.isChild === 'true';
      
      // 创建新乘客对象 - 确保只包含必要字段
      const newPassenger = {
        fullName: values.fullName,
        gender: values.gender,
        isChild: values.isChild,
        phone: values.phone || null,
        wechatId: values.wechatId || null,
        email: values.email || null,
        // 已移除护照号码和国籍字段
        tempId: `new-${Date.now()}` // 前端临时ID
      };
      
      // 记录准备添加的乘客信息
      console.log('准备添加新乘客:', newPassenger);
      
      // 更新本地状态
      const newPassengersList = [...passengers, newPassenger];
      // 先更新UI提高响应性
      setPassengers(newPassengersList);
      
      // 显示正在保存的提示
      message.loading('正在保存乘客信息...', 0);
      
      // 保存到服务器
      const result = await updatePassengersToServer(newPassengersList);
      
      // 关闭加载提示
      message.destroy();
      
      if (!result) {
        // 如果保存失败，恢复原始列表
        message.error('添加乘客失败，请重试');
        setPassengers(passengers);
        return;
      }
      
      // 重新获取乘客列表，确保获取后端生成的正确ID
      await fetchPassengers();
      
      // 重置表单和编辑状态
      setEditingPassenger(null);
      passengerForm.resetFields();
      
      message.success('已添加新乘客');
    } catch (error) {
      console.error('添加乘客出错:', error);
      message.error('添加乘客失败: ' + (error.message || '未知错误'));
    }
  };

  // 移除乘客
  const removePassenger = (passenger) => {
    Modal.confirm({
      title: '确认移除',
      content: `确定要移除乘客 ${passenger.fullName} 吗？`,
      onOk: async () => {
        try {
          // 记录删除信息
          console.log('准备删除乘客对象:', passenger);
          console.log('当前乘客列表:', passengers);
          
          // 确保传递正确的passengerId
          if (!passenger.passengerId && !passenger.tempId) {
            message.error('乘客ID不存在，无法删除');
            return;
          }
          
          // 更新本地状态 - 使用过滤器确保正确匹配乘客ID
          const updatedPassengers = passengers.filter(p => {
            // 同时检查passengerId和tempId，确保能匹配到要删除的乘客
            if (passenger.passengerId) {
              return p.passengerId !== passenger.passengerId;
            } else {
              return p.tempId !== passenger.tempId;
            }
          });
          
          console.log('过滤后的乘客列表:', updatedPassengers);
          
          // 先更新本地状态以提高响应性
          setPassengers(updatedPassengers);
          
          // 保存到服务器
          const result = await updatePassengersToServer(updatedPassengers);
          
          if (!result) {
            // 如果保存失败，恢复原始列表并显示错误
            message.error('删除乘客失败，请重试');
            setPassengers(passengers);
            return;
          }
          
          // 成功删除后刷新乘客列表，确保数据与后端一致
          await fetchPassengers();
          
          message.success('乘客已移除');
        } catch (error) {
          console.error('删除乘客出错:', error);
          message.error('删除乘客失败: ' + (error.message || '未知错误'));
          // 恢复原始列表
          setPassengers(passengers);
        }
      }
    });
  };

  const passengerColumns = [
    {
      title: '姓名',
      dataIndex: 'fullName',
      key: 'fullName'
    },
    {
      title: '性别',
      dataIndex: 'gender',
      key: 'gender',
      render: (text) => {
        const genderMap = {
          male: '男',
          female: '女',
          other: '其他'
        };
        return genderMap[text] || text;
      }
    },
    {
      title: '类型',
      dataIndex: 'isChild',
      key: 'isChild',
      render: (isChild) => isChild ? '儿童' : '成人'
    },
    {
      title: '电话',
      dataIndex: 'phone',
      key: 'phone',
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Space size="middle">
          <a onClick={() => editPassenger(record)}>编辑</a>
          <a onClick={() => removePassenger(record)}>移除</a>
        </Space>
      ),
    },
  ];

  return (
    <Modal
      title="更新订单信息"
      open={visible}
      onOk={handleSubmit}
      onCancel={handleCancel}
      confirmLoading={loading}
      destroyOnClose
      width={1000}
      className={className || 'order-status-modal'}
    >
      <Tabs activeKey={activeTab} onChange={setActiveTab}>
        <TabPane tab="基本信息" key="1">
          <Form
            form={form}
            layout="vertical"
            initialValues={{
              status: currentStatus,
              paymentStatus: currentPaymentStatus,
              remark: ''
            }}
          >
            <Form.Item
              name="status"
              label="订单状态"
              rules={[{ required: true, message: '请选择订单状态' }]}
            >
              <Select placeholder="请选择订单状态">
                <Option value="pending">待确认</Option>
                <Option value="confirmed">已确认</Option>
                <Option value="cancelled">已取消</Option>
                <Option value="completed">已完成</Option>
              </Select>
            </Form.Item>

            <Form.Item
              name="paymentStatus"
              label="支付状态"
              rules={[{ required: true, message: '请选择支付状态' }]}
            >
              <Select placeholder="请选择支付状态">
                <Option value="unpaid">未支付</Option>
                <Option value="partial">部分支付</Option>
                <Option value="paid">已支付</Option>
              </Select>
            </Form.Item>

            <Form.Item
              name="remark"
              label="备注"
            >
              <TextArea
                rows={4}
                placeholder="请输入备注信息"
                maxLength={500}
                showCount
              />
            </Form.Item>
          </Form>
        </TabPane>
        <TabPane tab="乘客信息" key="2">
          {fetchingPassengers ? (
            <div style={{ textAlign: 'center', padding: '20px' }}>加载乘客信息...</div>
          ) : (
            <>
              {editingPassenger ? (
                <div className="passenger-edit-form">
                  <h3>{editingPassenger.passengerId ? '编辑乘客' : '添加乘客'}</h3>
                  <div style={{ marginBottom: '20px', padding: '8px 12px', backgroundColor: '#f5f5f5', borderRadius: '4px', fontSize: '14px' }}>
                    <div>带 <span style={{ color: 'red' }}>*</span> 为必填项，其余为选填项</div>
                  </div>
                  <Form
                    form={passengerForm}
                    layout="vertical"
                  >
                    <Row gutter={16}>
                      <Col span={8}>
                        <Form.Item
                          name="fullName"
                          label="姓名"
                          rules={[{ required: true, message: '请输入乘客姓名' }]}
                        >
                          <Input placeholder="请输入乘客姓名" />
                        </Form.Item>
                      </Col>
                      <Col span={8}>
                        <Form.Item
                          name="gender"
                          label="性别"
                          rules={[{ required: true, message: '请选择性别' }]}
                        >
                          <Select placeholder="请选择性别">
                            <Option value="male">男</Option>
                            <Option value="female">女</Option>
                            <Option value="other">其他</Option>
                          </Select>
                        </Form.Item>
                      </Col>
                      <Col span={8}>
                        <Form.Item
                          name="isChild"
                          label="乘客类型"
                          rules={[{ required: true, message: '请选择乘客类型' }]}
                        >
                          <Select placeholder="请选择乘客类型">
                            <Option value="false">成人</Option>
                            <Option value="true">儿童</Option>
                          </Select>
                        </Form.Item>
                      </Col>
                    </Row>
                    
                    <Row gutter={16}>
                      <Col span={8}>
                        <Form.Item
                          name="phone"
                          label="电话"
                        >
                          <Input placeholder="请输入联系电话" />
                        </Form.Item>
                      </Col>
                      <Col span={8}>
                        <Form.Item
                          name="wechatId"
                          label="微信ID"
                        >
                          <Input placeholder="请输入微信ID" />
                        </Form.Item>
                      </Col>
                      <Col span={8}>
                        <Form.Item
                          name="email"
                          label="电子邮箱"
                        >
                          <Input placeholder="请输入电子邮箱" />
                        </Form.Item>
                      </Col>
                    </Row>
                    
                    <Form.Item>
                      <Space>
                        <Button type="primary" onClick={editingPassenger.passengerId ? savePassengerEdit : addNewPassenger}>
                          保存
                        </Button>
                        <Button onClick={() => {
                          setEditingPassenger(null);
                          passengerForm.resetFields();
                        }}>
                          取消
                        </Button>
                      </Space>
                    </Form.Item>
                  </Form>
                </div>
              ) : (
                <>
                  <Button 
                    type="primary" 
                    icon={<PlusOutlined />} 
                    onClick={() => {
                      passengerForm.resetFields();
                      setEditingPassenger({});
                    }}
                    style={{ marginBottom: 16 }}
                  >
                    添加乘客
                  </Button>
                  <Table
                    dataSource={passengers}
                    columns={passengerColumns}
                    rowKey={(record) => record.passengerId || record.tempId}
                    pagination={false}
                  />
                </>
              )}
            </>
          )}
        </TabPane>
      </Tabs>
    </Modal>
  );
};

export default OrderStatusUpdate; 