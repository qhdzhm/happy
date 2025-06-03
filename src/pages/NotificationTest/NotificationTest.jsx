import React, { useState } from 'react';
import { Button, Card, Space, message, Input, InputNumber, Select, Divider } from 'antd';
import { BellOutlined, SendOutlined } from '@ant-design/icons';
import { notificationApi } from '@/api/notification';
import adminWebSocketService from '@/utils/websocket';

const { TextArea } = Input;
const { Option } = Select;

const NotificationTest = () => {
  const [loading, setLoading] = useState(false);
  const [testData, setTestData] = useState({
    type: 1,
    title: '测试通知',
    content: '这是一条测试通知消息',
    relatedId: 12345,
    level: 1
  });

  // 通知类型选项
  const notificationTypes = [
    { value: 1, label: '💰 新订单', color: '#52c41a' },
    { value: 2, label: '💬 聊天请求', color: '#1890ff' },
    { value: 3, label: '📝 订单修改', color: '#faad14' },
    { value: 4, label: '👤 用户注册', color: '#722ed1' },
    { value: 5, label: '💸 退款申请', color: '#ff4d4f' },
    { value: 6, label: '⚠️ 投诉建议', color: '#ff7a45' }
  ];

  // 优先级选项
  const priorityLevels = [
    { value: 1, label: '普通', color: 'default' },
    { value: 2, label: '重要', color: 'orange' },
    { value: 3, label: '紧急', color: 'red' }
  ];

  // 发送测试通知
  const sendTestNotification = async () => {
    setLoading(true);
    try {
      const response = await notificationApi.createNotification(testData);
      if (response.success) {
        message.success('测试通知发送成功！');
      } else {
        message.error('发送失败：' + (response.message || '未知错误'));
      }
    } catch (error) {
      console.error('发送测试通知失败:', error);
      message.error('发送失败：' + (error.message || '网络错误'));
    } finally {
      setLoading(false);
    }
  };

  // 模拟订单操作
  const simulateOrderAction = async (action) => {
    setLoading(true);
    try {
      let notificationData = {};
      
      switch (action) {
        case 'new_order':
          notificationData = {
            type: 1,
            title: '💰 新订单通知',
            content: '客户张三刚刚下了一个新订单，金额：￥2580',
            relatedId: Math.floor(Math.random() * 10000),
            level: 2
          };
          break;
        case 'modify_order':
          notificationData = {
            type: 3,
            title: '📝 订单修改通知',
            content: '客户李四修改了订单信息，请及时处理',
            relatedId: Math.floor(Math.random() * 10000),
            level: 1
          };
          break;
        case 'cancel_order':
          notificationData = {
            type: 3,
            title: '📝 订单取消通知',
            content: '客户王五取消了订单，需要处理退款',
            relatedId: Math.floor(Math.random() * 10000),
            level: 3
          };
          break;
        case 'chat_request':
          notificationData = {
            type: 2,
            title: '💬 客服请求',
            content: '客户赵六发起了客服咨询，等待回复',
            relatedId: Math.floor(Math.random() * 10000),
            level: 2
          };
          break;
        default:
          message.warning('未知操作类型');
          return;
      }

      const response = await notificationApi.createNotification(notificationData);
      if (response.success) {
        message.success(`${notificationData.title} 发送成功！`);
      } else {
        message.error('发送失败：' + (response.message || '未知错误'));
      }
    } catch (error) {
      console.error('模拟操作失败:', error);
      message.error('操作失败：' + (error.message || '网络错误'));
    } finally {
      setLoading(false);
    }
  };

  // 检查WebSocket连接状态
  const checkWebSocketStatus = () => {
    const status = adminWebSocketService.getConnectionState();
    const isConnected = adminWebSocketService.isConnected();
    
    message.info(`WebSocket状态: ${status}, 已连接: ${isConnected ? '是' : '否'}`);
  };

  return (
    <div style={{ padding: '24px' }}>
      <h2><BellOutlined /> 实时通知系统测试</h2>
      
      {/* WebSocket状态检查 */}
      <Card title="🔗 连接状态检查" style={{ marginBottom: '16px' }}>
        <Button onClick={checkWebSocketStatus} icon={<BellOutlined />}>
          检查WebSocket连接状态
        </Button>
      </Card>

      {/* 快速模拟操作 */}
      <Card title="🚀 快速模拟" style={{ marginBottom: '16px' }}>
        <Space wrap>
          <Button 
            type="primary" 
            onClick={() => simulateOrderAction('new_order')}
            loading={loading}
          >
            💰 模拟新订单
          </Button>
          <Button 
            onClick={() => simulateOrderAction('modify_order')}
            loading={loading}
          >
            📝 模拟订单修改
          </Button>
          <Button 
            danger
            onClick={() => simulateOrderAction('cancel_order')}
            loading={loading}
          >
            ❌ 模拟订单取消
          </Button>
          <Button 
            type="dashed"
            onClick={() => simulateOrderAction('chat_request')}
            loading={loading}
          >
            💬 模拟客服请求
          </Button>
        </Space>
      </Card>

      {/* 自定义通知测试 */}
      <Card title="🛠️ 自定义通知测试" style={{ marginBottom: '16px' }}>
        <Space direction="vertical" style={{ width: '100%' }}>
          <div>
            <label>通知类型：</label>
            <Select 
              value={testData.type}
              onChange={(value) => setTestData({...testData, type: value})}
              style={{ width: '200px', marginLeft: '8px' }}
            >
              {notificationTypes.map(type => (
                <Option key={type.value} value={type.value}>
                  {type.label}
                </Option>
              ))}
            </Select>
          </div>

          <div>
            <label>优先级：</label>
            <Select 
              value={testData.level}
              onChange={(value) => setTestData({...testData, level: value})}
              style={{ width: '120px', marginLeft: '8px' }}
            >
              {priorityLevels.map(level => (
                <Option key={level.value} value={level.value}>
                  {level.label}
                </Option>
              ))}
            </Select>
          </div>

          <div>
            <label>标题：</label>
            <Input 
              value={testData.title}
              onChange={(e) => setTestData({...testData, title: e.target.value})}
              placeholder="请输入通知标题"
              style={{ marginLeft: '8px' }}
            />
          </div>

          <div>
            <label>内容：</label>
            <TextArea 
              value={testData.content}
              onChange={(e) => setTestData({...testData, content: e.target.value})}
              placeholder="请输入通知内容"
              rows={3}
              style={{ marginLeft: '8px' }}
            />
          </div>

          <div>
            <label>关联ID：</label>
            <InputNumber 
              value={testData.relatedId}
              onChange={(value) => setTestData({...testData, relatedId: value})}
              placeholder="关联数据ID"
              style={{ marginLeft: '8px' }}
            />
          </div>

          <Button 
            type="primary" 
            icon={<SendOutlined />}
            onClick={sendTestNotification}
            loading={loading}
            size="large"
          >
            发送自定义通知
          </Button>
        </Space>
      </Card>

      <Divider />

      {/* 使用说明 */}
      <Card title="📖 使用说明">
        <ul>
          <li><strong>快速模拟</strong>：点击按钮模拟不同类型的业务操作，系统会自动发送相应的通知</li>
          <li><strong>自定义测试</strong>：手动配置通知参数，测试特定场景</li>
          <li><strong>实时效果</strong>：通知会立即显示在右上角的通知中心（铃铛图标）中</li>
          <li><strong>声音提醒</strong>：新通知到达时会播放提示音（需要浏览器支持）</li>
          <li><strong>桌面通知</strong>：如果允许，会显示系统桌面通知</li>
        </ul>
      </Card>
    </div>
  );
};

export default NotificationTest; 