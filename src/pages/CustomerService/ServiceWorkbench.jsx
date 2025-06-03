import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Layout,
  Card,
  List,
  Avatar,
  Badge,
  Button,
  Input,
  Space,
  Typography,
  Tag,
  Row,
  Col,
  Statistic,
  message,
  Modal,
  Divider,
  Empty,
  Spin,
  Tooltip
} from 'antd';
import {
  MessageOutlined,
  SendOutlined,
  UserOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  PhoneOutlined,
  TagOutlined,
  EyeOutlined,
  CloseOutlined
} from '@ant-design/icons';
import { serviceSessionApi } from '@/api/customerService';
import adminWebSocketService from '@/utils/websocket';
import { getToken } from '@/utils';
import './ServiceWorkbench.scss';

const { Header, Sider, Content } = Layout;
const { TextArea } = Input;
const { Text, Title } = Typography;

const ServiceWorkbench = () => {
  const [loading, setLoading] = useState(false);
  const [waitingQueue, setWaitingQueue] = useState([]);
  const [activeSessions, setActiveSessions] = useState([]);
  const [currentSession, setCurrentSession] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [statistics, setStatistics] = useState({});
  const [serviceInfo, setServiceInfo] = useState(null);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [originalTitle, setOriginalTitle] = useState('');
  
  const messagesEndRef = useRef(null);

  // 页面标题闪烁提醒
  const flashTitle = useCallback((text, duration = 5000) => {
    if (!originalTitle) {
      setOriginalTitle(document.title);
    }
    
    let isFlashing = true;
    const interval = setInterval(() => {
      document.title = isFlashing ? text : (originalTitle || '客服工作台');
      isFlashing = !isFlashing;
    }, 1000);
    
    setTimeout(() => {
      clearInterval(interval);
      document.title = originalTitle || '客服工作台';
    }, duration);
  }, [originalTitle]);

  // 选择会话
  const selectSession = useCallback(async (session) => {
    console.log('🔍 选择会话:', session.id);
    
    // 如果选择的是当前会话，不需要重新加载
    if (currentSession && currentSession.id === session.id) {
      console.log('🔍 选择的是当前会话，跳过重新加载');
      return;
    }
    
    setCurrentSession(session);
    
    // 保存当前选中的会话ID到localStorage
    localStorage.setItem('currentSessionId', session.id.toString());
    
    try {
      // 加载会话消息
      console.log('📱 开始加载会话 {} 的消息', session.id);
      const result = await serviceSessionApi.getSessionMessages(session.id);
      console.log('📥 会话消息加载结果:', result);
      
      const messages = result.data?.messages || result.data || [];
      console.log('📝 解析出的消息数组:', messages);
      
      setMessages(messages);
      
      // 标记为已读
      await serviceSessionApi.markMessagesRead(session.id);
      
      // 清除未读计数
      setActiveSessions(prev => prev.map(s => 
        s.id === session.id ? { ...s, unreadCount: 0 } : s
      ));
      
      console.log('✅ 会话选择完成，消息数量:', messages.length);
    } catch (error) {
      console.error('❌ 加载会话消息失败:', error);
      message.error('加载会话消息失败: ' + error.message);
      // 出错时不清空消息，保持原有状态
    }
  }, [currentSession]);

  // 加载工作台数据
  const loadWorkbenchData = useCallback(async (serviceId) => {
    console.log('🚀 loadWorkbenchData 开始执行，serviceId:', serviceId);
    setLoading(true);
    try {
      console.log('📡 准备调用API：getWorkbenchData');
      
      const workbenchResult = await serviceSessionApi.getWorkbenchData(serviceId);
      
      console.log('📥 API响应 - 工作台数据:', workbenchResult);
      
      // 从workbenchData中获取活跃会话和等待队列
      const workbenchData = workbenchResult.data;
      const activeSessions = workbenchData?.activeSessions || [];
      
      setActiveSessions(activeSessions);
      setWaitingQueue(workbenchData?.waitingQueue || []);
      setStatistics(workbenchData?.statistics || {});
      
      console.log('✅ 工作台数据加载完成 - 活跃会话:', activeSessions.length, '等待队列:', workbenchData?.waitingQueue?.length || 0);
      
      // 尝试恢复之前选中的会话
      const savedSessionId = localStorage.getItem('currentSessionId');
      if (savedSessionId && activeSessions.length > 0) {
        const sessionId = parseInt(savedSessionId);
        const savedSession = activeSessions.find(s => s.id === sessionId);
        if (savedSession) {
          console.log('🔄 恢复之前选中的会话:', sessionId);
          // 延迟一下，确保状态更新完成
          setTimeout(() => {
            selectSession(savedSession);
          }, 100);
        } else {
          console.log('⚠️ 之前选中的会话不在活跃列表中，清除保存的状态');
          localStorage.removeItem('currentSessionId');
        }
      }
      
    } catch (error) {
      console.error('❌ 加载工作台数据失败:', error);
      message.error('加载工作台数据失败: ' + error.message);
    } finally {
      setLoading(false);
    }
  }, [selectSession]);
  
  // 获取当前客服信息
  useEffect(() => {
    // 方法1：尝试从localStorage获取user对象
    let currentUser = {};
    try {
      const userStr = localStorage.getItem('user');
      if (userStr && userStr !== '{}') {
        currentUser = JSON.parse(userStr);
      }
    } catch (error) {
      console.error('解析localStorage中的user失败:', error);
    }
    
    // 方法2：从JWT token中解析用户信息
    if (!currentUser.id) {
      const token = getToken();
      if (token) {
        try {
          // JWT token的payload部分（base64解码）
          const payloadBase64 = token.split('.')[1];
          const payload = JSON.parse(atob(payloadBase64));
          console.log('🔍 JWT payload:', payload);
          
          // 从JWT中提取用户信息 - 直接从payload获取
          if (payload.empId) {
            currentUser = {
              id: payload.empId,
              name: payload.name || payload.username || `员工${payload.empId}`,
              empId: payload.empId
            };
          } else if (payload.claims) {
            // 备用方案：从claims中获取
            currentUser = {
              id: payload.claims.serviceId || payload.claims.empId || payload.claims.id,
              name: payload.claims.name || payload.claims.username,
              ...payload.claims
            };
          }
          
          console.log('🔍 从JWT解析的用户信息:', currentUser);
        } catch (error) {
          console.error('解析JWT token失败:', error);
        }
      }
    }
    
    console.log('🔍 工作台页面 - 当前用户信息:', currentUser);
    console.log('🔍 工作台页面 - 用户ID:', currentUser.id);
    setServiceInfo(currentUser);
    
    if (currentUser.id) {
      console.log('✅ 开始加载工作台数据，用户ID:', currentUser.id);
      // 连接WebSocket
      adminWebSocketService.connect(currentUser.id);
      
      // 加载工作台数据
      loadWorkbenchData(currentUser.id);
    } else {
      console.error('❌ 用户ID为空，无法加载工作台数据');
      message.error('无法获取用户信息，请重新登录');
    }

    return () => {
      adminWebSocketService.disconnect();
    };
  }, [loadWorkbenchData]);

  // WebSocket消息监听
  useEffect(() => {
    const handleMessage = (data) => {
      console.log('收到WebSocket消息:', data);
      
      switch (data.type) {
        case 'new_session':
          // 新会话分配
          setWaitingQueue(prev => [...prev, data.session]);
          message.info('有新的用户请求客服支持');
          break;
          
        case 'session_message':
          // 新消息
          const messageData = data.data || data; // 兼容不同的数据结构
          console.log('🔍 处理session_message:', {
            currentSessionId: currentSession?.id,
            messageSessionId: messageData.sessionId,
            isMatch: currentSession && messageData.sessionId === currentSession.id,
            rawData: data
          });
          
          if (currentSession && messageData.sessionId === currentSession.id) {
            console.log('✅ 添加消息到当前会话');
            setMessages(prev => [...prev, {
              id: messageData.messageId,
              content: messageData.content,
              senderType: messageData.senderType,
              createTime: messageData.createTime,
              isFromUser: messageData.senderType === 1
            }]);
          } else {
            console.log('⚠️ 消息不属于当前会话，sessionId:', messageData.sessionId, 'currentSession:', currentSession?.id);
            
            // 如果没有当前会话，或者消息属于其他会话，自动选中该会话
            if (!currentSession || messageData.sessionId !== currentSession.id) {
              console.log('🔄 自动选中会话:', messageData.sessionId);
              setActiveSessions(prev => {
                const targetSession = prev.find(s => s.id === messageData.sessionId);
                if (targetSession) {
                  console.log('🎯 找到目标会话，自动选中:', targetSession);
                  // 自动选中这个会话
                  selectSession(targetSession);
                }
                return prev;
              });
            }
          }
          
          // 更新会话列表中的未读计数
          setActiveSessions(prev => prev.map(session => 
            session.id === messageData.sessionId 
              ? { ...session, unreadCount: (session.unreadCount || 0) + 1 }
              : session
          ));
          break;
          
        case 'session_ended':
          // 会话结束
          const endedSessionId = data.data?.sessionId || data.sessionId;
          console.log('🔚 收到会话结束通知:', endedSessionId);
          
          setActiveSessions(prev => {
            const endedSession = prev.find(s => s.id === endedSessionId);
            if (endedSession) {
              // 根据会话状态判断是谁结束的会话
              message.warning({
                content: `用户 ${endedSession.userDisplayName || `用户${endedSession.userId}`} 已结束会话`,
                duration: 5,
                style: {
                  marginTop: '10vh'
                }
              });
              
              // 播放提示音
              try {
                const audio = new Audio('/notification.mp3');
                audio.volume = 0.5;
                audio.play().catch(e => console.log('播放提示音失败:', e));
              } catch (e) {
                console.log('创建音频失败:', e);
              }
              
              // 页面标题闪烁提醒
              flashTitle(`🔚 用户${endedSession.userDisplayName || endedSession.userId}已结束会话`);
            }
            return prev.filter(s => s.id !== endedSessionId);
          });
          
          if (currentSession && currentSession.id === endedSessionId) {
            setCurrentSession(null);
            setMessages([]);
            // 清理localStorage中的会话状态
            localStorage.removeItem('currentSessionId');
          }
          break;
          
        default:
          break;
      }
    };

    adminWebSocketService.on('message', handleMessage);
    
    return () => {
      adminWebSocketService.off('message', handleMessage);
    };
  }, [currentSession, selectSession, flashTitle]);

  // 滚动到消息底部
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // 接受会话
  const acceptSession = async (session) => {
    try {
      await serviceSessionApi.acceptSession(session.id);
      
      message.success('会话已接受');
      
      // 重新加载工作台数据以获取最新状态
      if (serviceInfo?.id) {
        await loadWorkbenchData(serviceInfo.id);
        
        // 自动选中被接受的会话
        console.log('🎯 自动选中被接受的会话:', session.id);
        // 延迟一下确保数据加载完成
        setTimeout(() => {
          setActiveSessions(prev => {
            const acceptedSession = prev.find(s => s.id === session.id);
            if (acceptedSession) {
              console.log('✅ 找到被接受的会话，自动选中:', acceptedSession);
              selectSession(acceptedSession);
            }
            return prev;
          });
        }, 100);
      }
    } catch (error) {
      message.error('接受会话失败: ' + error.message);
    }
  };

  // 发送消息
  const sendMessage = async () => {
    if (!inputValue.trim() || !currentSession) return;
    
    setSendingMessage(true);
    try {
      const messageData = {
        sessionId: currentSession.id,
        content: inputValue.trim(),
        messageType: 1
      };
      
      await serviceSessionApi.sendMessage(messageData);
      
      // 添加到本地消息列表
      const newMessage = {
        id: Date.now(),
        content: inputValue.trim(),
        senderType: 2, // 客服
        createTime: new Date().toISOString(),
        isFromUser: false
      };
      
      setMessages(prev => [...prev, newMessage]);
      setInputValue('');
      
    } catch (error) {
      message.error('发送消息失败: ' + error.message);
    } finally {
      setSendingMessage(false);
    }
  };

  // 结束会话
  const endSession = async (session) => {
    Modal.confirm({
      title: '确认结束会话',
      content: '结束后将无法继续对话，确定要结束这个会话吗？',
      onOk: async () => {
        try {
          await serviceSessionApi.endSession(session.id, {
            reason: '客服主动结束'
          });
          
          setActiveSessions(prev => prev.filter(s => s.id !== session.id));
          
          if (currentSession && currentSession.id === session.id) {
            setCurrentSession(null);
            setMessages([]);
            // 清理localStorage中的会话状态
            localStorage.removeItem('currentSessionId');
          }
          
          message.success('会话已结束');
        } catch (error) {
          message.error('结束会话失败: ' + error.message);
        }
      }
    });
  };

  // 格式化时间
  const formatTime = (timeStr) => {
    const time = new Date(timeStr);
    const now = new Date();
    const diff = now - time;
    
    if (diff < 60000) return '刚刚';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前`;
    return time.toLocaleDateString();
  };

  // 获取会话状态标签
  const getSessionStatusTag = (status) => {
    const statusMap = {
      0: { color: 'orange', text: '等待中' },
      1: { color: 'green', text: '进行中' },
      2: { color: 'default', text: '用户结束' },
      3: { color: 'blue', text: '客服结束' },
      4: { color: 'red', text: '超时结束' }
    };
    
    const config = statusMap[status] || { color: 'default', text: '未知' };
    return <Tag color={config.color}>{config.text}</Tag>;
  };

  return (
    <div className="service-workbench">
      {/* 顶部统计 */}
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={6}>
          <Card size="small">
            <Statistic
              title="等待队列"
              value={waitingQueue.length}
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Statistic
              title="活跃会话"
              value={activeSessions.length}
              prefix={<MessageOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Statistic
              title="今日服务"
              value={statistics.todayServiceCount || 0}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Statistic
              title="平均评分"
              value={statistics.avgRating || 0}
              precision={1}
              suffix="分"
              valueStyle={{ color: '#eb2f96' }}
            />
          </Card>
        </Col>
      </Row>

      <Layout style={{ minHeight: 'calc(100vh - 200px)' }}>
        {/* 左侧会话列表 */}
        <Sider width={300} theme="light" style={{ borderRight: '1px solid #f0f0f0' }}>
          <div style={{ padding: '16px 0' }}>
            {/* 等待队列 */}
            <div style={{ marginBottom: 16 }}>
              <Title level={5} style={{ padding: '0 16px', marginBottom: 8 }}>
                等待队列 ({waitingQueue.length})
              </Title>
              <List
                dataSource={waitingQueue}
                renderItem={session => (
                  <List.Item 
                    style={{ padding: '8px 16px' }}
                    actions={[
                      <Button 
                        type="primary" 
                        size="small"
                        onClick={() => acceptSession(session)}
                      >
                        接受
                      </Button>
                    ]}
                  >
                    <List.Item.Meta
                      avatar={<Avatar icon={<UserOutlined />} />}
                      title={
                        <Space>
                          <Text>{session.userDisplayName || `用户${session.userId}`}</Text>
                          <Tag color="orange" size="small">等待中</Tag>
                        </Space>
                      }
                      description={
                        <Space direction="vertical" size={0}>
                          <Text type="secondary" style={{ fontSize: 12 }}>
                            {session.subject || '咨询问题'}
                          </Text>
                          <Text type="secondary" style={{ fontSize: 12 }}>
                            等待时间: {formatTime(session.createTime)}
                          </Text>
                        </Space>
                      }
                    />
                  </List.Item>
                )}
                locale={{ emptyText: '暂无等待会话' }}
              />
            </div>

            <Divider />

            {/* 活跃会话 */}
            <div>
              <Title level={5} style={{ padding: '0 16px', marginBottom: 8 }}>
                活跃会话 ({activeSessions.length})
              </Title>
              <List
                dataSource={activeSessions}
                renderItem={session => (
                  <List.Item 
                    style={{ 
                      padding: '8px 16px',
                      backgroundColor: currentSession?.id === session.id ? '#f6ffed' : 'transparent',
                      cursor: 'pointer'
                    }}
                    onClick={() => selectSession(session)}
                    actions={[
                      <Tooltip title="结束会话">
                        <Button 
                          type="text" 
                          size="small"
                          icon={<CloseOutlined />}
                          onClick={(e) => {
                            e.stopPropagation();
                            endSession(session);
                          }}
                        />
                      </Tooltip>
                    ]}
                  >
                    <List.Item.Meta
                      avatar={
                        <Badge count={session.unreadCount || 0} size="small">
                          <Avatar icon={<UserOutlined />} />
                        </Badge>
                      }
                      title={
                        <Space>
                          <Text>{session.userDisplayName || `用户${session.userId}`}</Text>
                          {getSessionStatusTag(session.status)}
                        </Space>
                      }
                      description={
                        <Space direction="vertical" size={0}>
                          <Text type="secondary" style={{ fontSize: 12 }}>
                            {session.lastMessage || '暂无消息'}
                          </Text>
                          <Text type="secondary" style={{ fontSize: 12 }}>
                            {formatTime(session.updateTime)}
                          </Text>
                        </Space>
                      }
                    />
                  </List.Item>
                )}
                locale={{ emptyText: '暂无活跃会话' }}
              />
            </div>
          </div>
        </Sider>

        {/* 右侧聊天区域 */}
        <Content>
          {currentSession ? (
            <div className="chat-container">
              {/* 聊天头部 */}
              <div className="chat-header">
                <Row justify="space-between" align="middle">
                  <Col>
                    <Space>
                      <Avatar icon={<UserOutlined />} />
                      <div>
                        <Text strong>{currentSession.userDisplayName || `用户${currentSession.userId}`}</Text>
                        <br />
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          {currentSession.subject || '咨询问题'}
                        </Text>
                      </div>
                    </Space>
                  </Col>
                  <Col>
                    <Space>
                      {getSessionStatusTag(currentSession.status)}
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        开始时间: {formatTime(currentSession.createTime)}
                      </Text>
                    </Space>
                  </Col>
                </Row>
              </div>

              {/* 消息区域 */}
              <div className="messages-container">
                {messages.map(message => (
                  <div 
                    key={message.id}
                    className={`message ${message.isFromUser ? 'user-message' : 'service-message'}`}
                  >
                    <div className="message-avatar">
                      <Avatar 
                        icon={message.isFromUser ? <UserOutlined /> : <MessageOutlined />}
                        style={{
                          backgroundColor: message.isFromUser ? '#1890ff' : '#52c41a'
                        }}
                      />
                    </div>
                    <div className="message-content">
                      <div className="message-bubble">
                        <Text>{message.content}</Text>
                      </div>
                      <div className="message-time">
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          {formatTime(message.createTime)}
                        </Text>
                      </div>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              {/* 输入区域 */}
              <div className="input-container">
                <Row gutter={8}>
                  <Col flex="auto">
                    <TextArea
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      placeholder="输入回复内容..."
                      autoSize={{ minRows: 2, maxRows: 4 }}
                      onPressEnter={(e) => {
                        if (!e.shiftKey) {
                          e.preventDefault();
                          sendMessage();
                        }
                      }}
                    />
                  </Col>
                  <Col>
                    <Button
                      type="primary"
                      icon={<SendOutlined />}
                      loading={sendingMessage}
                      onClick={sendMessage}
                      disabled={!inputValue.trim()}
                    >
                      发送
                    </Button>
                  </Col>
                </Row>
              </div>
            </div>
          ) : (
            <div className="no-session">
              <Empty
                description="请选择一个会话开始对话"
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              />
            </div>
          )}
        </Content>
      </Layout>
    </div>
  );
};

export default ServiceWorkbench; 