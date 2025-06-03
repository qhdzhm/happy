import React, { useState } from 'react';
import {
  Card,
  Button,
  Steps,
  Alert,
  Space,
  Typography,
  Divider,
  Result,
  Spin,
  message,
  Modal,
  List,
  Tag
} from 'antd';
import {
  SyncOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  InfoCircleOutlined,
  UserOutlined,
  TeamOutlined
} from '@ant-design/icons';
import { fixEmployeeRelation, syncGuidesToEmployees } from '@/api/guide';

const { Title, Paragraph, Text } = Typography;
const { Step } = Steps;

const DataSyncManager = ({ visible, onCancel }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState({
    step1: null,
    step2: null
  });

  // 步骤配置
  const steps = [
    {
      title: '修复关联关系',
      description: '修复现有导游记录与员工记录的关联关系',
      icon: <UserOutlined />,
      action: fixEmployeeRelation,
      key: 'step1'
    },
    {
      title: '同步导游数据',
      description: '将导游表中没有对应员工记录的导游同步到员工表',
      icon: <TeamOutlined />,
      action: syncGuidesToEmployees,
      key: 'step2'
    }
  ];

  // 执行单个步骤
  const executeStep = async (stepIndex) => {
    const step = steps[stepIndex];
    setLoading(true);
    
    try {
      const response = await step.action();
      
      if (response.code === 1) {
        setResults(prev => ({
          ...prev,
          [step.key]: {
            success: true,
            message: response.data || '操作成功',
            timestamp: new Date().toLocaleString()
          }
        }));
        message.success(`${step.title}成功`);
        
        // 自动进入下一步
        if (stepIndex < steps.length - 1) {
          setCurrentStep(stepIndex + 1);
        }
      } else {
        throw new Error(response.msg || '操作失败');
      }
    } catch (error) {
      setResults(prev => ({
        ...prev,
        [step.key]: {
          success: false,
          message: error.message || '操作失败',
          timestamp: new Date().toLocaleString()
        }
      }));
      message.error(`${step.title}失败: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // 执行所有步骤
  const executeAllSteps = async () => {
    for (let i = 0; i < steps.length; i++) {
      setCurrentStep(i);
      await executeStep(i);
      
      // 如果某步失败，停止执行
      if (results[steps[i].key] && !results[steps[i].key].success) {
        break;
      }
    }
  };

  // 重置状态
  const resetSync = () => {
    setCurrentStep(0);
    setResults({ step1: null, step2: null });
  };

  // 检查是否所有步骤都完成
  const isAllCompleted = () => {
    return steps.every(step => results[step.key]?.success);
  };

  // 检查是否有失败的步骤
  const hasFailures = () => {
    return Object.values(results).some(result => result && !result.success);
  };

  return (
    <Modal
      title={
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <SyncOutlined style={{ color: '#1890ff', marginRight: '8px' }} />
          <span>数据同步管理</span>
        </div>
      }
      open={visible}
      onCancel={onCancel}
      width={800}
      footer={null}
      destroyOnClose
    >
      <div style={{ padding: '16px 0' }}>
        {/* 说明信息 */}
        <Alert
          message="数据同步说明"
          description={
            <div>
              <Paragraph>
                此工具用于修复员工表和导游表之间的数据关联关系，确保系统功能正常运行。
              </Paragraph>
              <ul>
                <li>步骤1：修复现有导游记录与员工记录的关联关系</li>
                <li>步骤2：将导游表中的数据同步到员工表，创建缺失的员工记录</li>
              </ul>
              <Text type="warning">
                <ExclamationCircleOutlined /> 执行前请确保已备份数据库
              </Text>
            </div>
          }
          type="info"
          showIcon
          style={{ marginBottom: 24 }}
        />

        {/* 步骤进度 */}
        <Steps current={currentStep} style={{ marginBottom: 24 }}>
          {steps.map((step, index) => (
            <Step
              key={index}
              title={step.title}
              description={step.description}
              icon={step.icon}
              status={
                results[step.key]?.success ? 'finish' :
                results[step.key]?.success === false ? 'error' :
                currentStep === index ? 'process' : 'wait'
              }
            />
          ))}
        </Steps>

        {/* 操作按钮 */}
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <Space size="large">
            <Button
              type="primary"
              size="large"
              loading={loading}
              onClick={executeAllSteps}
              disabled={isAllCompleted()}
              icon={<SyncOutlined />}
            >
              执行所有步骤
            </Button>
            
            <Button
              size="large"
              loading={loading}
              onClick={() => executeStep(currentStep)}
              disabled={currentStep >= steps.length || results[steps[currentStep]?.key]?.success}
            >
              执行当前步骤
            </Button>
            
            <Button
              size="large"
              onClick={resetSync}
              disabled={loading}
            >
              重置
            </Button>
          </Space>
        </div>

        <Divider />

        {/* 执行结果 */}
        <div>
          <Title level={4}>执行结果</Title>
          
          {isAllCompleted() && (
            <Result
              status="success"
              title="数据同步完成！"
              subTitle="所有步骤都已成功执行，员工和导游数据已同步。"
              extra={
                <Button type="primary" onClick={onCancel}>
                  关闭
                </Button>
              }
            />
          )}

          {hasFailures() && !isAllCompleted() && (
            <Result
              status="error"
              title="同步过程中出现错误"
              subTitle="请检查错误信息并重试失败的步骤。"
            />
          )}

          <List
            dataSource={steps}
            renderItem={(step, index) => {
              const result = results[step.key];
              if (!result) return null;

              return (
                <List.Item>
                  <List.Item.Meta
                    avatar={
                      result.success ? 
                        <CheckCircleOutlined style={{ color: '#52c41a', fontSize: '20px' }} /> :
                        <ExclamationCircleOutlined style={{ color: '#ff4d4f', fontSize: '20px' }} />
                    }
                    title={
                      <div>
                        <span>{step.title}</span>
                        <Tag color={result.success ? 'success' : 'error'} style={{ marginLeft: 8 }}>
                          {result.success ? '成功' : '失败'}
                        </Tag>
                      </div>
                    }
                    description={
                      <div>
                        <div>{result.message}</div>
                        <Text type="secondary" style={{ fontSize: '12px' }}>
                          {result.timestamp}
                        </Text>
                      </div>
                    }
                  />
                </List.Item>
              );
            }}
          />
        </div>

        {/* 加载状态 */}
        {loading && (
          <div style={{ textAlign: 'center', padding: '20px' }}>
            <Spin size="large" />
            <div style={{ marginTop: 16 }}>
              <Text>正在执行 {steps[currentStep]?.title}...</Text>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default DataSyncManager; 