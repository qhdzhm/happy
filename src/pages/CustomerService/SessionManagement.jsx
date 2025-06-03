import React, { useState, useEffect } from 'react';
import {
  Table,
  Card,
  Button,
  Space,
  Tag,
  Modal,
  Form,
  DatePicker,
  Select,
  Input,
  message,
  Badge,
  Tooltip,
  Row,
  Col,
  Statistic,
  Drawer,
  List,
  Avatar,
  Typography
} from 'antd';
import {
  EyeOutlined,
  CloseOutlined,
  MessageOutlined,
  UserOutlined,
  SearchOutlined,
  ReloadOutlined,
  ExportOutlined,
  FilterOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined
} from '@ant-design/icons';
import { serviceSessionApi } from '@/api/customerService';
import moment from 'moment';
import './SessionManagement.scss';

const { RangePicker } = DatePicker;
const { Option } = Select;
const { Search } = Input;
const { Text, Title } = Typography;

const SessionManagement = () => {
  const [loading, setLoading] = useState(false);
  const [sessionList, setSessionList] = useState([]);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0
  });
  const [filters, setFilters] = useState({
    status: null,
    dateRange: null,
    serviceId: null,
    keyword: ''
  });
  const [selectedSession, setSelectedSession] = useState(null);
  const [messagesVisible, setMessagesVisible] = useState(false);
  const [sessionMessages, setSessionMessages] = useState([]);
  const [statistics, setStatistics] = useState({});
  const [waitingQueue, setWaitingQueue] = useState([]);

  useEffect(() => {
    fetchSessionList();
    fetchStatistics();
    fetchWaitingQueue();
  }, [pagination.current, pagination.pageSize, filters]);

  // 获取会话列表
  const fetchSessionList = async () => {
    setLoading(true);
    try {
      const params = {
        page: pagination.current,
        pageSize: pagination.pageSize,
        ...filters,
        startDate: filters.dateRange?.[0]?.format('YYYY-MM-DD'),
        endDate: filters.dateRange?.[1]?.format('YYYY-MM-DD')
      };

      const response = await serviceSessionApi.getSessionList(params);
      
      setSessionList(response.data?.records || []);
      setPagination(prev => ({
        ...prev,
        total: response.data?.total || 0
      }));
    } catch (error) {
      message.error('获取会话列表失败：' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // 获取统计数据
  const fetchStatistics = async () => {
    try {
      const response = await serviceSessionApi.getStatistics();
      setStatistics(response.data || {});
    } catch (error) {
      console.error('获取统计数据失败：', error);
    }
  };

  // 获取等待队列
  const fetchWaitingQueue = async () => {
    try {
      const response = await serviceSessionApi.getWaitingQueue();
      setWaitingQueue(response.data || []);
    } catch (error) {
      console.error('获取等待队列失败：', error);
    }
  };

  // 查看会话消息
  const viewSessionMessages = async (session) => {
    setSelectedSession(session);
    setMessagesVisible(true);
    
    try {
      const response = await serviceSessionApi.getSessionMessages(session.id);
      setSessionMessages(response.data?.messages || []);
    } catch (error) {
      message.error('获取会话消息失败：' + error.message);
    }
  };

  // 强制结束会话
  const forceEndSession = async (sessionId) => {
    Modal.confirm({
      title: '确认强制结束会话',
      content: '强制结束后用户和客服都将无法继续对话，确定要结束这个会话吗？',
      onOk: async () => {
        try {
          await serviceSessionApi.endSession(sessionId, {
            reason: '管理员强制结束',
            endType: 'admin'
          });
          
          message.success('会话已强制结束');
          fetchSessionList();
        } catch (error) {
          message.error('结束会话失败：' + error.message);
        }
      }
    });
  };

  // 接受会话
  const acceptSession = async (sessionId) => {
    try {
      await serviceSessionApi.acceptSession(sessionId);
      message.success('已成功接受会话');
      fetchSessionList();
      fetchWaitingQueue();
    } catch (error) {
      message.error('接受会话失败：' + error.message);
    }
  };

  // 确认接受会话
  const confirmAcceptSession = (session) => {
    Modal.confirm({
      title: '确认接受会话',
      content: (
        <div>
          <p>确定要接受来自用户 <strong>{session.userDisplayName || `用户${session.userId}`}</strong> 的会话吗？</p>
          <p>会话主题：<strong>{session.subject}</strong></p>
        </div>
      ),
      onOk: () => acceptSession(session.id)
    });
  };

  // 获取会话状态标签
  const getSessionStatusTag = (status) => {
    const statusMap = {
      0: { color: 'orange', text: '等待分配' },
      1: { color: 'green', text: '进行中' },
      2: { color: 'default', text: '用户结束' },
      3: { color: 'blue', text: '客服结束' },
      4: { color: 'red', text: '超时结束' },
      5: { color: 'purple', text: '强制结束' }
    };
    
    const config = statusMap[status] || { color: 'default', text: '未知' };
    return <Tag color={config.color}>{config.text}</Tag>;
  };

  // 格式化时长
  const formatDuration = (seconds) => {
    if (!seconds) return '-';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return hours > 0 ? `${hours}小时${minutes}分钟` : `${minutes}分钟`;
  };

  // 格式化时间
  const formatTime = (timeStr) => {
    return timeStr ? moment(timeStr).format('YYYY-MM-DD HH:mm:ss') : '-';
  };

  // 表格列定义
  const columns = [
    {
      title: '会话ID',
      dataIndex: 'id',
      key: 'id',
      width: 120,
      render: (id) => <Text code>{id}</Text>
    },
    {
      title: '用户信息',
      key: 'userInfo',
      width: 150,
      render: (_, record) => (
        <Space>
          <Avatar size="small" icon={<UserOutlined />} />
          <div>
            <div>{record.userDisplayName || `用户${record.userId}`}</div>
            <Text type="secondary" style={{ fontSize: 12 }}>
              ID: {record.userId}
            </Text>
          </div>
        </Space>
      )
    },
    {
      title: '客服信息',
      key: 'serviceInfo',
      width: 150,
      render: (_, record) => (
        record.employeeId ? (
          <Space>
            <Avatar size="small" icon={<MessageOutlined />} />
            <div>
              <div>{record.serviceName || `客服${record.employeeId}`}</div>
              <Text type="secondary" style={{ fontSize: 12 }}>
                工号: {record.serviceNo || '-'}
              </Text>
            </div>
          </Space>
        ) : (
          <Text type="secondary">未分配</Text>
        )
      )
    },
    {
      title: '会话主题',
      dataIndex: 'subject',
      key: 'subject',
      width: 200,
      ellipsis: true
    },
    {
      title: '状态',
      dataIndex: 'sessionStatus',
      key: 'sessionStatus',
      width: 100,
      render: (status) => getSessionStatusTag(status)
    },
    {
      title: '消息数',
      dataIndex: 'messageCount',
      key: 'messageCount',
      width: 80,
      render: (count) => (
        <Badge count={count || 0} showZero color="#52c41a" />
      )
    },
    {
      title: '服务时长',
      key: 'duration',
      width: 100,
      render: (_, record) => formatDuration(record.serviceDuration)
    },
    {
      title: '用户评分',
      dataIndex: 'userRating',
      key: 'userRating',
      width: 100,
      render: (rating) => (
        rating ? (
          <Space>
            <Text>{rating}</Text>
            <Text type="secondary">分</Text>
          </Space>
        ) : (
          <Text type="secondary">未评分</Text>
        )
      )
    },
    {
      title: '开始时间',
      dataIndex: 'createTime',
      key: 'createTime',
      width: 150,
      render: (time) => formatTime(time)
    },
    {
      title: '结束时间',
      dataIndex: 'endTime',
      key: 'endTime',
      width: 150,
      render: (time) => formatTime(time)
    },
    {
      title: '操作',
      key: 'actions',
      width: 120,
      fixed: 'right',
      render: (_, record) => (
        <Space>
          <Tooltip title="查看消息">
            <Button
              type="text"
              size="small"
              icon={<EyeOutlined />}
              onClick={() => viewSessionMessages(record)}
            />
          </Tooltip>
          {record.sessionStatus === 0 && (
            <Tooltip title="接受会话">
              <Button
                type="text"
                size="small"
                icon={<CheckCircleOutlined />}
                onClick={() => confirmAcceptSession(record)}
                style={{ color: '#52c41a' }}
              />
            </Tooltip>
          )}
          {record.sessionStatus === 1 && (
            <Tooltip title="强制结束">
              <Button
                type="text"
                size="small"
                danger
                icon={<CloseOutlined />}
                onClick={() => forceEndSession(record.id)}
              />
            </Tooltip>
          )}
        </Space>
      )
    }
  ];

  return (
    <div className="session-management">
      {/* 统计卡片 */}
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={6}>
          <Card size="small">
            <Statistic
              title="总会话数"
              value={statistics.totalSessions || 0}
              prefix={<MessageOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Statistic
              title="活跃会话"
              value={statistics.activeSessions || 0}
              prefix={<MessageOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Statistic
              title="平均服务时长"
              value={formatDuration(statistics.avgServiceDuration)}
              prefix={<ClockCircleOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Statistic
              title="平均用户评分"
              value={statistics.avgUserRating || 0}
              precision={1}
              suffix="分"
              valueStyle={{ color: '#eb2f96' }}
            />
          </Card>
        </Col>
      </Row>

      {/* 等待队列 */}
      {waitingQueue.length > 0 && (
        <Card 
          title={
            <Space>
              <ClockCircleOutlined style={{ color: '#faad14' }} />
              <span>等待队列 ({waitingQueue.length})</span>
            </Space>
          }
          style={{ marginBottom: 16 }}
          size="small"
        >
          <List
            dataSource={waitingQueue}
            renderItem={(session) => (
              <List.Item
                actions={[
                  <Button
                    type="primary"
                    size="small"
                    icon={<CheckCircleOutlined />}
                    onClick={() => confirmAcceptSession(session)}
                  >
                    接受
                  </Button>
                ]}
              >
                <List.Item.Meta
                  avatar={<Avatar icon={<UserOutlined />} />}
                  title={
                    <Space>
                      <Text strong>用户{session.userId}</Text>
                      <Tag color="orange">等待分配</Tag>
                    </Space>
                  }
                  description={
                    <div>
                      <div>主题：{session.subject}</div>
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        等待时间：{formatTime(session.createTime)}
                      </Text>
                    </div>
                  }
                />
              </List.Item>
            )}
          />
        </Card>
      )}

      {/* 筛选器 */}
      <Card style={{ marginBottom: 16 }}>
        <Row gutter={16} align="middle">
          <Col span={6}>
            <Search
              placeholder="搜索用户ID或会话主题"
              value={filters.keyword}
              onChange={(e) => setFilters(prev => ({ ...prev, keyword: e.target.value }))}
              onSearch={() => setPagination(prev => ({ ...prev, current: 1 }))}
            />
          </Col>
          <Col span={4}>
            <Select
              placeholder="会话状态"
              style={{ width: '100%' }}
              value={filters.status}
              onChange={(value) => setFilters(prev => ({ ...prev, status: value }))}
              allowClear
            >
              <Option value={0}>等待分配</Option>
              <Option value={1}>进行中</Option>
              <Option value={2}>用户结束</Option>
              <Option value={3}>客服结束</Option>
              <Option value={4}>超时结束</Option>
              <Option value={5}>强制结束</Option>
            </Select>
          </Col>
          <Col span={6}>
            <RangePicker
              style={{ width: '100%' }}
              value={filters.dateRange}
              onChange={(dates) => setFilters(prev => ({ ...prev, dateRange: dates }))}
              format="YYYY-MM-DD"
            />
          </Col>
          <Col span={8}>
            <Space>
              <Button
                type="primary"
                icon={<SearchOutlined />}
                onClick={() => setPagination(prev => ({ ...prev, current: 1 }))}
              >
                查询
              </Button>
              <Button
                icon={<ReloadOutlined />}
                onClick={() => {
                  setFilters({
                    status: null,
                    dateRange: null,
                    serviceId: null,
                    keyword: ''
                  });
                  setPagination(prev => ({ ...prev, current: 1 }));
                }}
              >
                重置
              </Button>
              <Button icon={<ExportOutlined />}>
                导出
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* 数据表格 */}
      <Card>
        <Table
          columns={columns}
          dataSource={sessionList}
          loading={loading}
          rowKey="id"
          scroll={{ x: 1200 }}
          pagination={{
            current: pagination.current,
            pageSize: pagination.pageSize,
            total: pagination.total,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条/共 ${total} 条`,
            onChange: (page, pageSize) => {
              setPagination(prev => ({
                ...prev,
                current: page,
                pageSize
              }));
            }
          }}
        />
      </Card>

      {/* 消息查看抽屉 */}
      <Drawer
        title={`会话消息 - ${selectedSession?.userDisplayName || '未知用户'}`}
        width={600}
        open={messagesVisible}
        onClose={() => setMessagesVisible(false)}
        className="session-messages-drawer"
      >
        {selectedSession && (
          <div>
            {/* 会话信息 */}
            <Card size="small" style={{ marginBottom: 16 }}>
              <Row gutter={16}>
                <Col span={12}>
                  <Text strong>会话ID：</Text>
                  <Text code>{selectedSession.id}</Text>
                </Col>
                <Col span={12}>
                  <Text strong>状态：</Text>
                  {getSessionStatusTag(selectedSession.sessionStatus)}
                </Col>
                <Col span={12}>
                  <Text strong>开始时间：</Text>
                  <Text>{formatTime(selectedSession.createTime)}</Text>
                </Col>
                <Col span={12}>
                  <Text strong>服务时长：</Text>
                  <Text>{formatDuration(selectedSession.serviceDuration)}</Text>
                </Col>
              </Row>
            </Card>

            {/* 消息列表 */}
            <List
              dataSource={sessionMessages}
              renderItem={(message) => (
                <List.Item style={{ border: 'none', padding: '8px 0' }}>
                  <div className={`message-item ${message.senderType === 1 ? 'user-message' : 'service-message'}`}>
                    <div className="message-header">
                      <Avatar 
                        size="small"
                        icon={message.senderType === 1 ? <UserOutlined /> : <MessageOutlined />}
                        style={{
                          backgroundColor: message.senderType === 1 ? '#1890ff' : '#52c41a'
                        }}
                      />
                      <Text strong style={{ marginLeft: 8 }}>
                        {message.senderType === 1 ? '用户' : '客服'}
                      </Text>
                      <Text type="secondary" style={{ marginLeft: 'auto', fontSize: 12 }}>
                        {formatTime(message.createTime)}
                      </Text>
                    </div>
                    <div className="message-content">
                      <Text>{message.content}</Text>
                    </div>
                  </div>
                </List.Item>
              )}
              locale={{ emptyText: '暂无消息记录' }}
            />
          </div>
        )}
      </Drawer>
    </div>
  );
};

export default SessionManagement; 