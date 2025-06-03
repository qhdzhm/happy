import React, { useState, useEffect } from 'react';
import {
  Card,
  Row,
  Col,
  Statistic,
  Alert,
  Button,
  Tag,
  Spin,
  message
} from 'antd';
import {
  UserOutlined,
  TeamOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  SyncOutlined,
  InfoCircleOutlined
} from '@ant-design/icons';
import { getEmpList } from '@/apis/Employee';
import { getGuideList } from '@/api/guide';

const SystemStatusCard = ({ onSyncClick }) => {
  const [loading, setLoading] = useState(false);
  const [systemStatus, setSystemStatus] = useState({
    totalEmployees: 0,
    guideEmployees: 0,
    totalGuides: 0,
    linkedGuides: 0,
    unlinkedGuides: 0,
    syncStatus: 'unknown'
  });

  // 检查系统状态
  const checkSystemStatus = async () => {
    setLoading(true);
    try {
      // 获取员工数据
      const empResponse = await getEmpList({ page: 1, pageSize: 1000 });
      let totalEmployees = 0;
      let guideEmployees = 0;
      
      if (empResponse.code === 1 && empResponse.data) {
        const employees = empResponse.data.records || [];
        totalEmployees = employees.length;
        guideEmployees = employees.filter(emp => emp.role === 0).length;
      }

      // 获取导游数据
      let totalGuides = 0;
      let linkedGuides = 0;
      let unlinkedGuides = 0;
      
      try {
        const guideResponse = await getGuideList({ page: 1, pageSize: 1000 });
        if (guideResponse.code === 1 && guideResponse.data) {
          const guides = guideResponse.data.records || guideResponse.data || [];
          totalGuides = guides.length;
          linkedGuides = guides.filter(guide => guide.employee_id || guide.employeeId).length;
          unlinkedGuides = totalGuides - linkedGuides;
        }
      } catch (error) {
        console.warn('获取导游数据失败，可能是接口不存在:', error);
        // 如果导游接口不存在，使用默认值
        totalGuides = 0;
        linkedGuides = 0;
        unlinkedGuides = 0;
      }

      // 判断同步状态
      let syncStatus = 'good';
      if (unlinkedGuides > 0 || guideEmployees > linkedGuides) {
        syncStatus = 'warning';
      }
      if (guideEmployees === 0 && totalGuides > 0) {
        syncStatus = 'error';
      }

      setSystemStatus({
        totalEmployees,
        guideEmployees,
        totalGuides,
        linkedGuides,
        unlinkedGuides,
        syncStatus
      });
    } catch (error) {
      console.error('检查系统状态失败:', error);
      message.error('检查系统状态失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkSystemStatus();
  }, []);

  // 获取状态颜色和图标
  const getStatusInfo = () => {
    switch (systemStatus.syncStatus) {
      case 'good':
        return {
          color: 'success',
          icon: <CheckCircleOutlined />,
          text: '数据同步正常',
          description: '员工和导游数据已正确关联'
        };
      case 'warning':
        return {
          color: 'warning',
          icon: <ExclamationCircleOutlined />,
          text: '需要数据同步',
          description: '存在未关联的导游记录或员工记录'
        };
      case 'error':
        return {
          color: 'error',
          icon: <ExclamationCircleOutlined />,
          text: '数据不一致',
          description: '员工表和导游表数据严重不匹配'
        };
      default:
        return {
          color: 'info',
          icon: <InfoCircleOutlined />,
          text: '状态未知',
          description: '正在检查系统状态...'
        };
    }
  };

  const statusInfo = getStatusInfo();

  return (
    <Card 
      title={
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span>
            <InfoCircleOutlined style={{ marginRight: 8 }} />
            系统状态
          </span>
          <Button 
            size="small" 
            icon={<SyncOutlined />} 
            onClick={checkSystemStatus}
            loading={loading}
          >
            刷新
          </Button>
        </div>
      }
      size="small"
      style={{ marginBottom: 16 }}
    >
      <Spin spinning={loading}>
        <Row gutter={16}>
          <Col span={6}>
            <Statistic
              title="总员工数"
              value={systemStatus.totalEmployees}
              prefix={<UserOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="导游员工"
              value={systemStatus.guideEmployees}
              prefix={<TeamOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="导游记录"
              value={systemStatus.totalGuides}
              prefix={<TeamOutlined />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="已关联导游"
              value={systemStatus.linkedGuides}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Col>
        </Row>

        <div style={{ marginTop: 16 }}>
          <Alert
            message={
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  {statusInfo.icon}
                  <span style={{ marginLeft: 8 }}>{statusInfo.text}</span>
                </div>
                {systemStatus.syncStatus !== 'good' && (
                  <Button 
                    type="primary" 
                    size="small"
                    icon={<SyncOutlined />}
                    onClick={onSyncClick}
                  >
                    立即同步
                  </Button>
                )}
              </div>
            }
            description={
              <div>
                <div>{statusInfo.description}</div>
                {systemStatus.unlinkedGuides > 0 && (
                  <div style={{ marginTop: 4 }}>
                    <Tag color="orange">
                      {systemStatus.unlinkedGuides} 个导游记录未关联员工
                    </Tag>
                  </div>
                )}
                {systemStatus.guideEmployees > systemStatus.linkedGuides && (
                  <div style={{ marginTop: 4 }}>
                    <Tag color="blue">
                      {systemStatus.guideEmployees - systemStatus.linkedGuides} 个导游员工缺少导游记录
                    </Tag>
                  </div>
                )}
              </div>
            }
            type={statusInfo.color}
          />
        </div>
      </Spin>
    </Card>
  );
};

export default SystemStatusCard; 