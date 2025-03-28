import React, { useState, useEffect } from 'react';
import { Table, Card, Button, Space, Tag, Modal, message, Select, Input } from 'antd';
import { EyeOutlined, DollarOutlined, CloseCircleOutlined } from '@ant-design/icons';
import { getBookingList, updateBookingStatus, updatePaymentStatus, cancelBooking } from '@/apis/booking';
import './BookingManagement.scss';

const { confirm } = Modal;
const { Option } = Select;
const { TextArea } = Input;

const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const BookingManagement = () => {
  const [bookings, setBookings] = useState([]);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const [loading, setLoading] = useState(false);
  const [currentBooking, setCurrentBooking] = useState(null);
  const [statusModalVisible, setStatusModalVisible] = useState(false);
  const [paymentModalVisible, setPaymentModalVisible] = useState(false);
  const [cancelModalVisible, setCancelModalVisible] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedPaymentStatus, setSelectedPaymentStatus] = useState('');
  const [cancelReason, setCancelReason] = useState('');

  useEffect(() => {
    fetchBookings();
  }, [pagination.current, pagination.pageSize]);

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const params = {
        page: pagination.current,
        pageSize: pagination.pageSize,
      };
      const res = await getBookingList(params);
      if (res.code === 1) {
        setBookings(res.data.records);
        setPagination({
          ...pagination,
          total: res.data.total,
        });
      }
    } catch (error) {
      console.error('获取预订列表失败:', error);
      message.error('获取预订列表失败');
    } finally {
      setLoading(false);
    }
  };

  const handleTableChange = (pagination) => {
    setPagination(pagination);
  };

  const showStatusModal = (record) => {
    setCurrentBooking(record);
    setSelectedStatus(record.status);
    setStatusModalVisible(true);
  };

  const handleStatusOk = async () => {
    try {
      const res = await updateBookingStatus(currentBooking.bookingId, selectedStatus);
      if (res.code === 1) {
        message.success('更新预订状态成功');
        setStatusModalVisible(false);
        fetchBookings();
      } else {
        message.error(res.msg || '更新预订状态失败');
      }
    } catch (error) {
      console.error('更新预订状态失败:', error);
      message.error('更新预订状态失败');
    }
  };

  const showPaymentModal = (record) => {
    setCurrentBooking(record);
    setSelectedPaymentStatus(record.paymentStatus);
    setPaymentModalVisible(true);
  };

  const handlePaymentOk = async () => {
    try {
      const res = await updatePaymentStatus(currentBooking.bookingId, selectedPaymentStatus);
      if (res.code === 1) {
        message.success('更新支付状态成功');
        setPaymentModalVisible(false);
        fetchBookings();
      } else {
        message.error(res.msg || '更新支付状态失败');
      }
    } catch (error) {
      console.error('更新支付状态失败:', error);
      message.error('更新支付状态失败');
    }
  };

  const showCancelModal = (record) => {
    confirm({
      title: '确定要取消此预订吗?',
      content: (
        <div>
          <p>请输入取消原因:</p>
          <TextArea 
            rows={4} 
            value={cancelReason} 
            onChange={(e) => setCancelReason(e.target.value)}
            placeholder="请输入取消原因"
          />
        </div>
      ),
      onOk: async () => {
        if (!cancelReason.trim()) {
          message.error('请输入取消原因');
          return;
        }
        try {
          const res = await cancelBooking(record.bookingId, cancelReason);
          if (res.code === 1) {
            message.success('取消预订成功');
            setCancelReason('');
            fetchBookings();
          } else {
            message.error(res.msg || '取消预订失败');
          }
        } catch (error) {
          console.error('取消预订失败:', error);
          message.error('取消预订失败');
        }
      },
      onCancel: () => {
        setCancelReason('');
      },
    });
  };

  const getStatusTag = (status) => {
    switch (status) {
      case 'pending':
        return <Tag color="gold">待确认</Tag>;
      case 'confirmed':
        return <Tag color="green">已确认</Tag>;
      case 'cancelled':
        return <Tag color="red">已取消</Tag>;
      case 'completed':
        return <Tag color="blue">已完成</Tag>;
      default:
        return <Tag>未知</Tag>;
    }
  };

  const getPaymentStatusTag = (status) => {
    switch (status) {
      case 'unpaid':
        return <Tag color="red">未支付</Tag>;
      case 'partial':
        return <Tag color="orange">部分支付</Tag>;
      case 'paid':
        return <Tag color="green">已支付</Tag>;
      default:
        return <Tag>未知</Tag>;
    }
  };

  const getTourTypeText = (type) => {
    return type === 'day_tour' ? '一日游' : '团队游';
  };

  const columns = [
    {
      title: '预订ID',
      dataIndex: 'bookingId',
      key: 'bookingId',
      width: 80,
    },
    {
      title: '用户',
      dataIndex: 'userId',
      key: 'userId',
    },
    {
      title: '产品类型',
      dataIndex: 'tourType',
      key: 'tourType',
      render: (type) => getTourTypeText(type),
    },
    {
      title: '产品ID',
      dataIndex: 'tourId',
      key: 'tourId',
    },
    {
      title: '预订日期',
      dataIndex: 'bookingDate',
      key: 'bookingDate',
      render: (date) => formatDate(date),
    },
    {
      title: '出行日期',
      dataIndex: 'startDate',
      key: 'startDate',
      render: (date) => formatDate(date),
    },
    {
      title: '人数',
      key: 'people',
      render: (_, record) => `成人: ${record.adults}, 儿童: ${record.children || 0}`,
    },
    {
      title: '总价',
      dataIndex: 'totalPrice',
      key: 'totalPrice',
      render: (price) => `¥${price}`,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status) => getStatusTag(status),
    },
    {
      title: '支付状态',
      dataIndex: 'paymentStatus',
      key: 'paymentStatus',
      render: (status) => getPaymentStatusTag(status),
    },
    {
      title: '操作',
      key: 'action',
      width: 250,
      render: (_, record) => {
        const isCompleted = record.status === 'completed';
        const isCancelled = record.status === 'cancelled';
        
        return (
          <Space size="small">
            <Button 
              type="primary"
              size="small"
              icon={<EyeOutlined />}
              onClick={() => showStatusModal(record)}
              disabled={isCompleted || isCancelled}
            >
              状态
            </Button>
            <Button 
              type="primary"
              size="small"
              icon={<DollarOutlined />}
              onClick={() => showPaymentModal(record)}
              disabled={isCancelled}
            >
              支付
            </Button>
            <Button 
              danger
              size="small"
              icon={<CloseCircleOutlined />}
              onClick={() => showCancelModal(record)}
              disabled={isCompleted || isCancelled}
            >
              取消
            </Button>
          </Space>
        );
      },
    },
  ];

  return (
    <div className="booking-container">
      <Card title="预订管理">
        <Table
          columns={columns}
          dataSource={bookings}
          rowKey="bookingId"
          pagination={pagination}
          loading={loading}
          onChange={handleTableChange}
          scroll={{ x: 1300 }}
        />
      </Card>

      <Modal
        title="更新预订状态"
        open={statusModalVisible}
        onOk={handleStatusOk}
        onCancel={() => setStatusModalVisible(false)}
      >
        <div style={{ marginBottom: '16px' }}>
          当前预订ID: {currentBooking?.bookingId}
        </div>
        <div>
          <span style={{ marginRight: '8px' }}>选择状态:</span>
          <Select
            value={selectedStatus}
            onChange={setSelectedStatus}
            style={{ width: '100%' }}
          >
            <Option value="pending">待确认</Option>
            <Option value="confirmed">已确认</Option>
            <Option value="completed">已完成</Option>
            <Option value="cancelled">已取消</Option>
          </Select>
        </div>
      </Modal>

      <Modal
        title="更新支付状态"
        open={paymentModalVisible}
        onOk={handlePaymentOk}
        onCancel={() => setPaymentModalVisible(false)}
      >
        <div style={{ marginBottom: '16px' }}>
          当前预订ID: {currentBooking?.bookingId}
        </div>
        <div>
          <span style={{ marginRight: '8px' }}>选择支付状态:</span>
          <Select
            value={selectedPaymentStatus}
            onChange={setSelectedPaymentStatus}
            style={{ width: '100%' }}
          >
            <Option value="unpaid">未支付</Option>
            <Option value="partial">部分支付</Option>
            <Option value="paid">已支付</Option>
          </Select>
        </div>
      </Modal>
    </div>
  );
};

export default BookingManagement; 