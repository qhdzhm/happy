import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { 
  Card, Button, Table, Tag, Space, Form, 
  Input, Select, DatePicker, Row, Col, message, Spin 
} from 'antd';
import { 
  getOrderList, completeOrder,
  getUserOptions, getAgentOptions,
  deleteOrder
} from '../../apis/orderApi';
import { formatDateValue } from '../../utils/dateTimeFormat';
import debounce from 'lodash/debounce';
import OrderStatusUpdate from './OrderStatusUpdate';

const { Option } = Select;
const { RangePicker } = DatePicker;

// 订单状态标签颜色映射
const statusColors = {
  pending: 'orange',
  confirmed: 'blue',
  cancelled: 'red',
  completed: 'green'
};

// 支付状态标签颜色映射
const paymentStatusColors = {
  unpaid: 'red',
  partial: 'orange',
  paid: 'green'
};

const OrderList = () => {
  const location = useLocation();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [orders, setOrders] = useState([]);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0
  });
  const [userType, setUserType] = useState(null);
  
  // 用户和代理商选项状态
  const [userOptions, setUserOptions] = useState([]);
  const [agentOptions, setAgentOptions] = useState([]);
  const [userSearchLoading, setUserSearchLoading] = useState(false);
  const [agentSearchLoading, setAgentSearchLoading] = useState(false);
  const [statusModalVisible, setStatusModalVisible] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);

  // 处理URL查询参数
  const processUrlParams = async () => {
    const searchParams = new URLSearchParams(location.search);
    const userId = searchParams.get('userId');
    const agentId = searchParams.get('agentId');
    
    // 如果有用户或代理商ID的查询参数，更新表单并获取数据
    if (userId) {
      setUserType('user');
      // 获取用户详细信息
      try {
        const response = await getUserOptions({ id: userId });
        if (response.code === 1 && response.data.length > 0) {
          const user = response.data[0];
          const options = [{
            label: `${user.name || user.username} (ID: ${user.id})`,
            value: user.id
          }];
          setUserOptions(options);
        }
      } catch (error) {
        console.error('获取用户信息失败:', error);
      }
      
      form.setFieldsValue({ 
        userId, 
        userType: 'user' 
      });
      fetchOrders({ userId });
    } else if (agentId) {
      setUserType('agent');
      // 获取代理商详细信息
      try {
        const response = await getAgentOptions({ id: agentId });
        if (response.code === 1 && response.data.length > 0) {
          const agent = response.data[0];
          const options = [{
            label: `${agent.name || agent.username} (ID: ${agent.id})`,
            value: agent.id
          }];
          setAgentOptions(options);
        }
      } catch (error) {
        console.error('获取代理商信息失败:', error);
      }
      
      form.setFieldsValue({ 
        agentId, 
        userType: 'agent' 
      });
      fetchOrders({ agentId });
    } else {
      fetchOrders();
    }
  };

  // 处理用户类型变化
  const handleUserTypeChange = (value) => {
    setUserType(value);
    form.setFieldsValue({
      userId: undefined,
      agentId: undefined
    });
    
    // 当选择用户类型后立即加载初始选项列表
    if (value === 'user') {
      fetchUserOptions('');
    } else if (value === 'agent') {
      fetchAgentOptions('');
    }
  };

  // 初始加载
  useEffect(() => {
    processUrlParams();
  }, [location.search]);

  // 获取订单数据
  const fetchOrders = async (params = {}) => {
    try {
      setLoading(true);
      // 构建查询参数
      const queryParams = {
        page: pagination.current,
        pageSize: pagination.pageSize,
        ...params
      };
      
      const response = await getOrderList(queryParams);
      
      if (response.code === 1) {
        setOrders(response.data.records || []);
        setPagination({
          ...pagination,
          total: response.data.total || 0
        });
      } else {
        message.error(response.msg || '获取订单列表失败');
      }
    } catch (error) {
      console.error('获取订单列表出错:', error);
      message.error('获取订单列表失败');
    } finally {
      setLoading(false);
    }
  };

  // 处理表格分页、排序、筛选变化
  const handleTableChange = (pagination, filters, sorter) => {
    fetchOrders({
      page: pagination.current,
      pageSize: pagination.pageSize,
      ...form.getFieldsValue()
    });
  };

  // 处理搜索表单提交
  const handleSearch = (values) => {
    // 处理日期范围
    if (values.dateRange && values.dateRange.length === 2) {
      values.startDate = values.dateRange[0].format('YYYY-MM-DD');
      values.endDate = values.dateRange[1].format('YYYY-MM-DD');
    }
    delete values.dateRange;
    
    // 处理用户类型和ID
    if (values.userType === 'user') {
      delete values.agentId;
    } else if (values.userType === 'agent') {
      delete values.userId;
    }
    
    // 如果没有选择用户类型，删除两个ID字段
    if (!values.userType) {
      delete values.userId;
      delete values.agentId;
    }
    
    // 删除用户类型字段，因为后端API不需要
    delete values.userType;
    
    // 重置分页到第一页
    setPagination({
      ...pagination,
      current: 1
    });
    
    fetchOrders({
      page: 1,
      ...values
    });
  };

  // 重置搜索表单
  const handleReset = () => {
    form.resetFields();
    setPagination({
      ...pagination,
      current: 1
    });
    fetchOrders({ page: 1 });
  };

  // 完成订单
  const handleComplete = async (bookingId) => {
    try {
      const response = await completeOrder(bookingId);
      if (response.code === 1) {
        message.success('订单完成成功');
        fetchOrders({
          page: pagination.current,
          pageSize: pagination.pageSize,
          ...form.getFieldsValue()
        });
      } else {
        message.error(response.msg || '订单完成失败');
      }
    } catch (error) {
      console.error('完成订单出错:', error);
      message.error('订单完成失败');
    }
  };

  // 删除订单
  const handleDelete = async (bookingId) => {
    try {
      const response = await deleteOrder(bookingId);
      if (response.code === 1) {
        message.success('订单删除成功');
        fetchOrders({
          page: pagination.current,
          pageSize: pagination.pageSize,
          ...form.getFieldsValue()
        });
      } else {
        message.error(response.msg || '订单删除失败');
      }
    } catch (error) {
      console.error('删除订单出错:', error);
      message.error('订单删除失败');
    }
  };

  // 🔥 确认订单（支持价格调整）
  const handleConfirmOrder = (record) => {
    // 跳转到订单确认页面，传递订单信息
    window.location.href = `/orders/confirm/${record.bookingId}`;
  };

  // 用户选择变化
  const handleUserSelect = (value, option) => {
    if (value) {
      // 重置分页到第一页
      setPagination({ ...pagination, current: 1 });
      
      // 根据选择的用户获取订单
      fetchOrders({ page: 1, userId: value });
      message.info(`正在查看用户 ${option.label.split(' ')[0]} 的所有订单`);
    }
  };

  // 代理商选择变化
  const handleAgentSelect = (value, option) => {
    if (value) {
      // 重置分页到第一页
      setPagination({ ...pagination, current: 1 });
      
      // 根据选择的代理商获取订单
      fetchOrders({ page: 1, agentId: value });
      message.info(`正在查看代理商 ${option.label.split(' ')[0]} 的所有订单`);
    }
  };

  // 搜索用户
  const fetchUserOptions = debounce(async (searchText) => {
    // 删除长度限制，允许空搜索返回默认列表
    setUserSearchLoading(true);
    try {
      const response = await getUserOptions({ name: searchText });
      if (response.code === 1) {
        const options = response.data.map(user => ({
          label: `${user.name || user.username} (ID: ${user.id})`,
          value: user.id
        }));
        setUserOptions(options);
      } else {
        setUserOptions([]);
      }
    } catch (error) {
      console.error('获取用户列表失败:', error);
      setUserOptions([]);
    } finally {
      setUserSearchLoading(false);
    }
  }, 500);

  // 搜索代理商
  const fetchAgentOptions = debounce(async (searchText) => {
    // 删除长度限制，允许空搜索返回默认列表
    setAgentSearchLoading(true);
    try {
      const response = await getAgentOptions({ name: searchText });
      if (response.code === 1) {
        const options = response.data.map(agent => ({
          label: `${agent.name || agent.username} (ID: ${agent.id})`,
          value: agent.id
        }));
        setAgentOptions(options);
      } else {
        setAgentOptions([]);
      }
    } catch (error) {
      console.error('获取代理商列表失败:', error);
      setAgentOptions([]);
    } finally {
      setAgentSearchLoading(false);
    }
  }, 500);

  // 用户搜索框变化
  const handleUserSearch = (value) => {
    fetchUserOptions(value);
  };

  // 代理商搜索框变化
  const handleAgentSearch = (value) => {
    fetchAgentOptions(value);
  };

  // 打开订单更新弹窗
  const openStatusModal = (record) => {
    setSelectedOrder(record);
    setStatusModalVisible(true);
  };

  // 表格列定义
  const columns = [
    {
      title: '订单号',
      dataIndex: 'orderNumber',
      key: 'orderNumber',
      ellipsis: true
    },
    {
      title: '旅行类型',
      dataIndex: 'tourType',
      key: 'tourType',
      render: (text) => {
        const tourTypeMap = {
          day_tour: '日游',
          group_tour: '团体游'
        };
        return tourTypeMap[text] || text;
      }
    },
    {
      title: '旅行名称',
      dataIndex: 'tourName',
      key: 'tourName',
      ellipsis: true
    },
    {
      title: '用户',
      key: 'user',
      render: (_, record) => {
        // 判断是用户还是代理商
        if (record.agentId) {
          return (
            <Button 
              type="link" 
              size="small" 
              onClick={() => {
                setUserType('agent');
                form.setFieldsValue({ 
                  userType: 'agent',
                  agentId: record.agentId 
                });
                // 获取代理商详细信息
                try {
                  const options = [{
                    label: record.agentName || `代理商ID: ${record.agentId}`,
                    value: record.agentId
                  }];
                  setAgentOptions(options);
                } catch (error) {
                  console.error('设置代理商选项失败:', error);
                }
                // 重置分页到第一页
                setPagination({ ...pagination, current: 1 });
                // 获取订单数据
                fetchOrders({ page: 1, agentId: record.agentId });
                message.info(`正在查看代理商 ${record.agentName || record.agentId} 的所有订单`);
              }}
            >
              {record.agentName || `代理商ID: ${record.agentId}`}
            </Button>
          );
        } else if (record.userId) {
          return (
            <Button 
              type="link" 
              size="small" 
              onClick={() => {
                setUserType('user');
                form.setFieldsValue({ 
                  userType: 'user',
                  userId: record.userId 
                });
                // 获取用户详细信息
                try {
                  const options = [{
                    label: record.userName || `用户ID: ${record.userId}`,
                    value: record.userId
                  }];
                  setUserOptions(options);
                } catch (error) {
                  console.error('设置用户选项失败:', error);
                }
                // 重置分页到第一页
                setPagination({ ...pagination, current: 1 });
                // 获取订单数据
                fetchOrders({ page: 1, userId: record.userId });
                message.info(`正在查看用户 ${record.userName || record.userId} 的所有订单`);
              }}
            >
              {record.userName || `用户ID: ${record.userId}`}
            </Button>
          );
        } else {
          return <span>-</span>;
        }
      }
    },
    {
      title: '联系人',
      dataIndex: 'contactPerson',
      key: 'contactPerson'
    },
    {
      title: '联系电话',
      dataIndex: 'contactPhone',
      key: 'contactPhone'
    },
    {
      title: '预订日期',
      dataIndex: 'bookingDate',
      key: 'bookingDate',
      render: (text) => formatDateValue(text)
    },
    {
      title: '出行日期',
      dataIndex: 'tourStartDate',
      key: 'tourStartDate',
      render: (text) => formatDateValue(text)
    },
    {
      title: '人数',
      dataIndex: 'groupSize',
      key: 'groupSize',
      render: (text) => text || 0
    },
    {
      title: '总价',
      dataIndex: 'totalPrice',
      key: 'totalPrice',
              render: (text) => `$${text || 0}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
    },
    {
      title: '订单状态',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        const statusMap = {
          pending: '待确认',
          confirmed: '已确认',
          cancelled: '已取消',
          completed: '已完成'
        };
        return (
          <Tag color={statusColors[status] || 'default'}>
            {statusMap[status] || status}
          </Tag>
        );
      }
    },
    {
      title: '支付状态',
      dataIndex: 'paymentStatus',
      key: 'paymentStatus',
      render: (status) => {
        const paymentStatusMap = {
          unpaid: '未支付',
          partial: '部分支付',
          paid: '已支付'
        };
        return (
          <Tag color={paymentStatusColors[status] || 'default'}>
            {paymentStatusMap[status] || status}
          </Tag>
        );
      }
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => {
        const isPending = record.status === 'pending';
        const isConfirmed = record.status === 'confirmed';
        const isCancelled = record.status === 'cancelled';
        const isPaid = record.paymentStatus === 'paid';
        
        return (
          <Space size="small">
            <Button
              type="link"
              size="small"
              onClick={() => window.location.href = `/orders/detail/${record.bookingId}`}
            >
              详情
            </Button>
            
            {/* 🔥 待确认订单显示确认按钮 */}
            {isPending && (
              <Button
                type="primary"
                size="small"
                onClick={() => handleConfirmOrder(record)}
              >
                确认订单
              </Button>
            )}
            
            <Button
              type="link"
              size="small"
              onClick={() => openStatusModal(record)}
            >
              更新信息
            </Button>
            
            {isConfirmed && isPaid && (
              <Button
                type="link"
                size="small"
                onClick={() => handleComplete(record.bookingId)}
              >
                完成
              </Button>
            )}
            
            {isCancelled && (
              <Button
                type="link"
                size="small"
                danger
                onClick={() => {
                  if (window.confirm('确定要删除这个已取消的订单吗？此操作不可撤销！')) {
                    handleDelete(record.bookingId);
                  }
                }}
              >
                删除
              </Button>
            )}
            
            <Button
              type="link"
              size="small"
              onClick={() => window.location.href = `/orders/edit/${record.bookingId}`}
            >
              编辑
            </Button>
          </Space>
        );
      }
    }
  ];

  return (
    <div className="order-list-container">
      <Card 
        title="订单管理" 
        variant="bordered"
        extra={
          (form.getFieldValue('userId') || form.getFieldValue('agentId')) ? (
            <Button type="link" onClick={() => {
              form.setFieldsValue({
                userId: undefined,
                agentId: undefined,
                userType: undefined
              });
              setUserType(null);
              message.info('已清除用户筛选条件');
              fetchOrders({ page: 1 });
            }}
            >
              清除用户筛选
            </Button>
          ) : null
        }
      >
        {/* 搜索表单 */}
        <Form
          form={form}
          layout="horizontal"
          onFinish={handleSearch}
          style={{ marginBottom: 20 }}
        >
          <Row gutter={24}>
            <Col span={6}>
              <Form.Item name="orderNumber" label="订单号">
                <Input placeholder="请输入订单号" />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="status" label="订单状态">
                <Select placeholder="请选择订单状态" allowClear>
                  <Option value="pending">待确认</Option>
                  <Option value="confirmed">已确认</Option>
                  <Option value="cancelled">已取消</Option>
                  <Option value="completed">已完成</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="paymentStatus" label="支付状态">
                <Select placeholder="请选择支付状态" allowClear>
                  <Option value="unpaid">未支付</Option>
                  <Option value="partial">部分支付</Option>
                  <Option value="paid">已支付</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="tourType" label="旅行类型">
                <Select placeholder="请选择旅行类型" allowClear>
                  <Option value="day_tour">日游</Option>
                  <Option value="group_tour">团体游</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
          
          <Row gutter={24}>
            <Col span={6}>
              <Form.Item name="userType" label="用户类型">
                <Select 
                  placeholder="请选择用户类型" 
                  allowClear
                  onChange={handleUserTypeChange}
                >
                  <Option value="agent">代理商</Option>
                  <Option value="user">普通用户</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={6}>
              {userType === 'user' && (
                <Form.Item name="userId" label="选择用户">
                  <Select
                    showSearch
                    placeholder="搜索用户名称"
                    filterOption={false}
                    onSearch={handleUserSearch}
                    onSelect={handleUserSelect}
                    notFoundContent={userSearchLoading ? <Spin size="small" /> : null}
                    options={userOptions}
                    allowClear
                  />
                </Form.Item>
              )}
              {userType === 'agent' && (
                <Form.Item name="agentId" label="选择代理商">
                  <Select
                    showSearch
                    placeholder="搜索代理商名称"
                    filterOption={false}
                    onSearch={handleAgentSearch}
                    onSelect={handleAgentSelect}
                    notFoundContent={agentSearchLoading ? <Spin size="small" /> : null}
                    options={agentOptions}
                    allowClear
                  />
                </Form.Item>
              )}
            </Col>
            <Col span={6}>
              <Form.Item name="contactPerson" label="联系人">
                <Input placeholder="请输入联系人" />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="contactPhone" label="联系电话">
                <Input placeholder="请输入联系电话" />
              </Form.Item>
            </Col>
          </Row>
          
          <Row gutter={24}>
            <Col span={12}>
              <Form.Item name="dateRange" label="出行日期">
                <RangePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
          
          <Row>
            <Col span={24} style={{ textAlign: 'right' }}>
              <Button type="primary" htmlType="submit">
                搜索
              </Button>
              <Button style={{ marginLeft: 8 }} onClick={handleReset}>
                重置
              </Button>
            </Col>
          </Row>
        </Form>

        {/* 订单表格 */}
        <Table
          columns={columns}
          dataSource={orders}
          rowKey="bookingId"
          pagination={{
            ...pagination,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条记录`
          }}
          loading={loading}
          onChange={handleTableChange}
          scroll={{ x: 'max-content' }}
        />
      </Card>
      
      {/* 添加订单状态更新弹窗 */}
      <OrderStatusUpdate
        visible={statusModalVisible}
        onCancel={() => setStatusModalVisible(false)}
        onSuccess={() => {
          setStatusModalVisible(false);
          fetchOrders({
            page: pagination.current,
            pageSize: pagination.pageSize,
            ...form.getFieldsValue()
          });
        }}
        bookingId={selectedOrder?.bookingId}
        currentStatus={selectedOrder?.status}
        currentPaymentStatus={selectedOrder?.paymentStatus}
        className="order-status-modal"
      />
    </div>
  );
};

export default OrderList; 