import React, { useState, useEffect } from 'react';
import {
  Badge,
  Dropdown,
  List,
  Avatar,
  Button,
  Empty,
  Typography,
  Tag,
  Space,
  message,
  Popover
} from 'antd';
import {
  BellOutlined,
  SettingOutlined,
  CheckOutlined,
  DollarOutlined,
  MessageOutlined,
  EditOutlined,
  UserAddOutlined,
  ExclamationCircleOutlined,
  WarningOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { notificationApi } from '@/api/notification';
import adminWebSocketService from '@/utils/websocket';
import './NotificationCenter.scss';

const { Text, Title } = Typography;

const NotificationCenter = () => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [dropdownVisible, setDropdownVisible] = useState(false);
  const [settingsVisible, setSettingsVisible] = useState(false);
  const navigate = useNavigate();

  // 获取通知图标
  const getNotificationIcon = (type, iconText) => {
    // 如果有图标文本，优先使用映射
    if (iconText) {
      const iconMap = {
        'dollar': <DollarOutlined style={{ color: '#52c41a' }} />,
        'message': <MessageOutlined style={{ color: '#1890ff' }} />,
        'edit': <EditOutlined style={{ color: '#faad14' }} />,
        'user': <UserAddOutlined style={{ color: '#722ed1' }} />,
        'refund': <ExclamationCircleOutlined style={{ color: '#ff4d4f' }} />,
        'warning': <WarningOutlined style={{ color: '#ff7a45' }} />
      };
      return iconMap[iconText] || <BellOutlined />;
    }
    
    // 如果没有图标文本，使用类型映射
    const typeIconMap = {
      1: <DollarOutlined style={{ color: '#52c41a' }} />, // 新订单
      2: <MessageOutlined style={{ color: '#1890ff' }} />, // 聊天请求
      3: <EditOutlined style={{ color: '#faad14' }} />, // 订单修改
      4: <UserAddOutlined style={{ color: '#722ed1' }} />, // 用户注册
      5: <ExclamationCircleOutlined style={{ color: '#ff4d4f' }} />, // 退款申请
      6: <WarningOutlined style={{ color: '#ff7a45' }} />, // 投诉建议
    };
    return typeIconMap[type] || <BellOutlined />;
  };

  // 获取通知级别标签
  const getLevelTag = (level) => {
    const levelMap = {
      1: { color: 'default', text: '普通' },
      2: { color: 'orange', text: '重要' },
      3: { color: 'red', text: '紧急' }
    };
    const config = levelMap[level] || levelMap[1];
    return <Tag color={config.color} size="small">{config.text}</Tag>;
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

  // 处理通知点击跳转
  const handleNotificationClick = async (notification) => {
    // 先标记为已读
    if (!notification.isRead) {
      await markAsRead(notification.id);
    }
    
    // 关闭下拉菜单
    setDropdownVisible(false);
    
    // 根据通知类型和相关数据跳转到对应页面
    const { type, relatedId, relatedType } = notification;
    
    try {
      switch (type) {
        case 1: // 新订单
          if (relatedId) {
            navigate(`/orders/confirm/${relatedId}`); // 跳转到确认订单页面
          } else {
            navigate('/orders');
          }
          break;
          
        case 2: // 聊天请求
          if (relatedId) {
            navigate(`/customer-service/sessions/${relatedId}`);
          } else {
            navigate('/customer-service');
          }
          break;
          
        case 3: // 订单修改
          if (relatedId) {
            navigate(`/orders/confirm/${relatedId}`); // 跳转到确认订单页面
          } else {
            navigate('/orders');
          }
          break;
          
        case 4: // 用户注册
          if (relatedId) {
            navigate(`/users/detail/${relatedId}`);
          } else {
            navigate('/users');
          }
          break;
          
        case 5: // 退款申请
          if (relatedId) {
            navigate(`/refunds/detail/${relatedId}`);
          } else {
            navigate('/refunds');
          }
          break;
          
        case 6: // 投诉建议
          if (relatedId) {
            navigate(`/complaints/detail/${relatedId}`);
          } else {
            navigate('/complaints');
          }
          break;
          
        default:
          // 默认跳转到通知中心
          navigate('/notifications');
          break;
      }
    } catch (error) {
      console.error('跳转失败:', error);
      message.error('页面跳转失败');
    }
  };

  // 加载通知数据
  const loadNotifications = async () => {
    setLoading(true);
    try {
      const [notificationsRes, countRes] = await Promise.all([
        notificationApi.getNotifications(20),
        notificationApi.getUnreadCount()
      ]);
      
      setNotifications(notificationsRes.data || []);
      setUnreadCount(countRes.data || 0);
    } catch (error) {
      console.error('加载通知失败:', error);
      message.error('加载通知失败');
    } finally {
      setLoading(false);
    }
  };

  // 标记单个通知为已读
  const markAsRead = async (notificationId) => {
    try {
      await notificationApi.markAsRead(notificationId);
      setNotifications(prev => 
        prev.map(item => 
          item.id === notificationId 
            ? { ...item, isRead: 1 } 
            : item
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      message.error('标记已读失败');
    }
  };

  // 标记所有通知为已读
  const markAllAsRead = async () => {
    try {
      await notificationApi.markAllAsRead();
      setNotifications(prev => 
        prev.map(item => ({ ...item, isRead: 1 }))
      );
      setUnreadCount(0);
      message.success('所有通知已标记为已读');
    } catch (error) {
      message.error('操作失败');
    }
  };

  // 播放通知音效
  const playNotificationSound = () => {
    try {
      // 检查用户是否允许播放声音（可以通过设置控制）
      const isSoundEnabled = localStorage.getItem('notification-sound') !== 'false';
      console.log('🔊 音效设置状态:', isSoundEnabled);
      
      if (!isSoundEnabled) {
        console.log('🔇 音效已被用户关闭');
        return;
      }
      
      // 支持多种音频格式，按优先级尝试
      const audioFormats = ['/notification.wav', '/notification.mp3', '/notification.ogg'];
      const audio = new Audio();
      
      // 尝试加载第一个可用的音频格式
      let formatIndex = 0;
      const tryNextFormat = () => {
        if (formatIndex < audioFormats.length) {
          console.log('🔊 尝试加载音频格式:', audioFormats[formatIndex]);
          audio.src = audioFormats[formatIndex];
          formatIndex++;
        } else {
          console.log('🔇 所有音频格式都加载失败');
        }
      };
      
      audio.addEventListener('error', (e) => {
        console.log('🔇 音频加载失败:', e);
        tryNextFormat();
      });
      
      audio.addEventListener('loadstart', () => {
        console.log('🔊 音频开始加载');
        audio.removeEventListener('error', tryNextFormat);
      });
      
      audio.addEventListener('canplay', () => {
        console.log('🔊 音频可以播放');
      });
      
      tryNextFormat(); // 开始尝试第一个格式
      
      const volume = Number(localStorage.getItem('notification-volume')) || 0.6;
      audio.volume = volume;
      audio.preload = 'auto';
      
      console.log('🔊 设置音频音量:', volume);
      
      // 尝试播放音频
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            console.log('🔊 通知音效播放成功');
          })
          .catch(e => {
            console.log('🔇 播放提示音失败 (可能需要用户交互):', e.message);
            // 可以在这里显示一个提示，告诉用户需要点击页面来启用音效
          });
      }
    } catch (e) {
      console.log('🔇 创建音频失败:', e.message);
    }
  };

  // 初始化音频权限（用户第一次交互时）
  useEffect(() => {
    const enableAudio = () => {
      const audio = new Audio('/notification.wav');
      audio.volume = 0.1;
      audio.play().then(() => {
        audio.pause();
        audio.currentTime = 0;
        console.log('🔊 音频权限已启用');
      }).catch(() => {
        console.log('🔇 音频权限未启用');
      });
    };

    // 监听用户第一次点击
    const handleFirstClick = () => {
      enableAudio();
      document.removeEventListener('click', handleFirstClick);
    };

    document.addEventListener('click', handleFirstClick);
    
    return () => {
      document.removeEventListener('click', handleFirstClick);
    };
  }, []);

  // WebSocket监听系统通知
  useEffect(() => {
    const handleSystemNotification = (data) => {
      console.log('🔔 NotificationCenter收到系统通知:', data);
      
      if (data.type === 'system_notification') {
        // 修正数据结构解析
        const notificationData = data.data || data; // 兼容两种数据格式
        
        console.log('🔔 解析的通知数据:', notificationData);
        
        // 构建通知对象
        const newNotification = {
          id: notificationData.notificationId || Date.now(),
          type: notificationData.type || 3, // 默认为订单修改类型
          title: data.title || notificationData.title || '新通知',
          content: notificationData.content || '您有新的通知消息',
          icon: notificationData.icon || '📝',
          level: notificationData.level || 1,
          isRead: 0,
          relatedId: notificationData.relatedId,
          relatedType: notificationData.relatedType,
          createTime: notificationData.createTime || new Date().toISOString()
        };
        
        console.log('🔔 构建的通知对象:', newNotification);
        
        // 添加新通知到列表顶部
        setNotifications(prev => {
          console.log('🔔 更新通知列表，新通知:', newNotification);
          return [newNotification, ...prev];
        });
        
        // 增加未读计数
        setUnreadCount(prev => {
          const newCount = prev + 1;
          console.log('🔔 更新未读计数:', newCount);
          return newCount;
        });
        
        // 播放提示音
        console.log('🔔 尝试播放提示音');
        playNotificationSound();
        
        // 显示桌面通知
        if (Notification.permission === 'granted') {
          console.log('🔔 显示桌面通知');
          new Notification(newNotification.title, {
            body: newNotification.content,
            icon: '/favicon.ico',
            tag: `notification-${newNotification.id}`
          });
        } else {
          console.log('🔔 桌面通知权限未授权:', Notification.permission);
        }
        
        // 显示消息提示
        console.log('🔔 显示消息提示');
        message.info({
          content: (
            <Space>
              <span style={{ marginRight: 8 }}>{newNotification.icon}</span>
              {newNotification.title}: {newNotification.content}
            </Space>
          ),
          duration: 5
        });
      }
    };

    adminWebSocketService.on('message', handleSystemNotification);
    
    return () => {
      adminWebSocketService.off('message', handleSystemNotification);
    };
  }, []);

  // 请求桌面通知权限
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  // 组件挂载时加载通知
  useEffect(() => {
    loadNotifications();
  }, []);

  // 通知设置内容
  const settingsContent = (
    <div className="notification-settings" style={{ width: 280, padding: 16 }}>
      <Title level={5} style={{ margin: '0 0 16px 0' }}>通知设置</Title>
      
      <div className="setting-item" style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text>声音提醒</Text>
          <Button
            size="small"
            type={localStorage.getItem('notification-sound') !== 'false' ? 'primary' : 'default'}
            onClick={() => {
              const current = localStorage.getItem('notification-sound') !== 'false';
              localStorage.setItem('notification-sound', (!current).toString());
              message.success(current ? '声音提醒已关闭' : '声音提醒已开启');
            }}
          >
            {localStorage.getItem('notification-sound') !== 'false' ? '开启' : '关闭'}
          </Button>
        </div>
      </div>
      
      <div className="setting-item" style={{ marginBottom: 16 }}>
        <div style={{ marginBottom: 8 }}>
          <Text>音量大小</Text>
        </div>
        <input
          type="range"
          min="0"
          max="1"
          step="0.1"
          defaultValue={localStorage.getItem('notification-volume') || '0.6'}
          onChange={(e) => {
            localStorage.setItem('notification-volume', e.target.value);
          }}
          style={{ width: '100%' }}
        />
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#999' }}>
          <span>静音</span>
          <span>最大</span>
        </div>
      </div>
      
      <div className="setting-item" style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text>桌面通知</Text>
          <Button
            size="small"
            type={Notification.permission === 'granted' ? 'primary' : 'default'}
            onClick={() => {
              if (Notification.permission === 'default') {
                Notification.requestPermission().then(permission => {
                  message.success(permission === 'granted' ? '桌面通知已开启' : '桌面通知被拒绝');
                });
              } else if (Notification.permission === 'granted') {
                message.info('桌面通知已开启，可在浏览器设置中关闭');
              } else {
                message.warning('桌面通知被拒绝，请在浏览器设置中允许');
              }
            }}
          >
            {Notification.permission === 'granted' ? '已开启' : '未开启'}
          </Button>
        </div>
      </div>
      
      <div className="setting-item">
        <Button 
          type="link" 
          size="small" 
          onClick={() => {
            playNotificationSound();
            message.info('播放测试音效');
          }}
        >
          🔊 测试音效
        </Button>
      </div>
    </div>
  );

  // 通知列表内容
  const notificationList = (
    <div className="notification-dropdown">
      <div className="notification-header">
        <Title level={5} style={{ margin: 0 }}>通知中心</Title>
        <Space>
          <Button 
            type="link" 
            size="small" 
            onClick={markAllAsRead}
            disabled={unreadCount === 0}
          >
            全部已读
          </Button>
          <Popover
            content={settingsContent}
            title={null}
            trigger="click"
            placement="bottomRight"
            open={settingsVisible}
            onOpenChange={setSettingsVisible}
          >
            <Button 
              type="link" 
              size="small" 
              icon={<SettingOutlined />}
            >
              设置
            </Button>
          </Popover>
        </Space>
      </div>
      
      <div className="notification-list">
        {notifications.length > 0 ? (
          <List
            itemLayout="horizontal"
            dataSource={notifications}
            renderItem={item => (
              <List.Item 
                className={`notification-item ${item.isRead ? 'read' : 'unread'}`}
                onClick={() => handleNotificationClick(item)}
                style={{ cursor: 'pointer' }}
              >
                <List.Item.Meta
                  avatar={
                    <Avatar 
                      icon={getNotificationIcon(item.type, item.icon)} 
                      style={{ backgroundColor: item.isRead ? '#f5f5f5' : '#e6f7ff' }}
                    />
                  }
                  title={
                    <Space>
                      <Text strong={!item.isRead}>{item.title}</Text>
                      {getLevelTag(item.level)}
                      {!item.isRead && <Badge status="processing" />}
                    </Space>
                  }
                  description={
                    <div>
                      <Text 
                        type={item.isRead ? 'secondary' : 'default'}
                        ellipsis={{ tooltip: item.content }}
                      >
                        {item.content}
                      </Text>
                      <br />
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        {formatTime(item.createTime)}
                      </Text>
                    </div>
                  }
                />
                {!item.isRead && (
                  <Button 
                    type="text" 
                    size="small" 
                    icon={<CheckOutlined />}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleNotificationClick(item);
                    }}
                  />
                )}
              </List.Item>
            )}
          />
        ) : (
          <Empty 
            description="暂无通知" 
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            style={{ padding: '40px 20px' }}
          />
        )}
      </div>
      
      <div className="notification-footer">
        <Button type="link" block>查看全部通知</Button>
      </div>
    </div>
  );

  return (
    <Dropdown
      menu={{
        items: [],
        disabled: true
      }}
      dropdownRender={() => notificationList}
      trigger={['click']}
      placement="bottomRight"
      open={dropdownVisible}
      onOpenChange={setDropdownVisible}
      overlayClassName="notification-dropdown-overlay"
    >
      <div className="notification-trigger">
        <Badge count={unreadCount} size="small" offset={[-2, 2]}>
          <BellOutlined 
            style={{ 
              fontSize: 18, 
              color: unreadCount > 0 ? '#1890ff' : '#666',
              cursor: 'pointer'
            }} 
          />
        </Badge>
      </div>
    </Dropdown>
  );
};

export default NotificationCenter; 