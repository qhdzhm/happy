import React, { useState } from 'react';
import {
  Modal,
  Steps,
  Button,
  Typography,
  Space,
  Alert,
  Card,
  Row,
  Col,
  Tag,
  Divider
} from 'antd';
import {
  UserOutlined,
  TeamOutlined,
  CalendarOutlined,
  SyncOutlined,
  CheckCircleOutlined,
  InfoCircleOutlined,
  RightOutlined
} from '@ant-design/icons';

const { Title, Paragraph, Text } = Typography;
const { Step } = Steps;

const QuickStartGuide = ({ visible, onCancel }) => {
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    {
      title: '了解系统状态',
      icon: <InfoCircleOutlined />,
      content: (
        <div>
          <Paragraph>
            在员工管理页面顶部，您可以看到系统状态卡片，它会显示：
          </Paragraph>
          <Row gutter={16}>
            <Col span={12}>
              <Card size="small">
                <div style={{ textAlign: 'center' }}>
                  <UserOutlined style={{ fontSize: '24px', color: '#1890ff' }} />
                  <div>总员工数</div>
                  <Text type="secondary">系统中所有员工的数量</Text>
                </div>
              </Card>
            </Col>
            <Col span={12}>
              <Card size="small">
                <div style={{ textAlign: 'center' }}>
                  <TeamOutlined style={{ fontSize: '24px', color: '#52c41a' }} />
                  <div>导游员工</div>
                  <Text type="secondary">角色为导游的员工数量</Text>
                </div>
              </Card>
            </Col>
          </Row>
          <Alert
            message="提示"
            description="如果系统状态显示警告或错误，说明需要进行数据同步。"
            type="info"
            showIcon
            style={{ marginTop: 16 }}
          />
        </div>
      )
    },
    {
      title: '数据同步操作',
      icon: <SyncOutlined />,
      content: (
        <div>
          <Paragraph>
            当系统检测到数据不一致时，您可以使用数据同步功能：
          </Paragraph>
          <div style={{ marginBottom: 16 }}>
            <Tag color="blue">方法1</Tag>
            <Text>点击系统状态卡片中的"立即同步"按钮</Text>
          </div>
          <div style={{ marginBottom: 16 }}>
            <Tag color="green">方法2</Tag>
            <Text>点击操作区域的"数据同步"按钮</Text>
          </div>
          <Alert
            message="同步过程"
            description={
              <div>
                <div>1. 修复现有导游记录与员工记录的关联关系</div>
                <div>2. 将导游表中的数据同步到员工表</div>
              </div>
            }
            type="success"
            showIcon
          />
        </div>
      )
    },
    {
      title: '管理导游可用性',
      icon: <CalendarOutlined />,
      content: (
        <div>
          <Paragraph>
            对于导游角色的员工，您可以管理他们的可用性：
          </Paragraph>
          <div style={{ marginBottom: 16 }}>
            <Space>
              <CalendarOutlined style={{ color: '#52c41a' }} />
              <Text>在员工列表中，导游角色会显示绿色的"管理可用性"按钮</Text>
            </Space>
          </div>
          <Card size="small" style={{ marginBottom: 16 }}>
            <Title level={5}>可用性管理功能：</Title>
            <ul>
              <li>查看导游的可用性统计</li>
              <li>设置单个日期的可用性</li>
              <li>批量设置日期范围的可用性</li>
              <li>删除可用性设置</li>
            </ul>
          </Card>
          <Alert
            message="注意"
            description="只有完成数据同步后，导游的可用性管理功能才能正常使用。"
            type="warning"
            showIcon
          />
        </div>
      )
    },
    {
      title: '添加新导游',
      icon: <UserOutlined />,
      content: (
        <div>
          <Paragraph>
            添加新的导游员工时，系统会自动处理关联关系：
          </Paragraph>
          <Card size="small" style={{ marginBottom: 16 }}>
            <Title level={5}>自动化流程：</Title>
            <div style={{ marginLeft: 16 }}>
              <div style={{ marginBottom: 8 }}>
                <CheckCircleOutlined style={{ color: '#52c41a', marginRight: 8 }} />
                在员工表中创建导游角色员工
              </div>
              <div style={{ marginBottom: 8 }}>
                <CheckCircleOutlined style={{ color: '#52c41a', marginRight: 8 }} />
                自动在导游表中创建对应记录
              </div>
              <div style={{ marginBottom: 8 }}>
                <CheckCircleOutlined style={{ color: '#52c41a', marginRight: 8 }} />
                建立正确的关联关系
              </div>
              <div>
                <CheckCircleOutlined style={{ color: '#52c41a', marginRight: 8 }} />
                可用性管理功能立即可用
              </div>
            </div>
          </Card>
          <Alert
            message="最佳实践"
            description="建议在添加导游员工后，立即设置其可用性信息，以便更好地进行团队管理。"
            type="success"
            showIcon
          />
        </div>
      )
    }
  ];

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  return (
    <Modal
      title={
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <InfoCircleOutlined style={{ color: '#1890ff', marginRight: '8px' }} />
          <span>员工导游管理快速入门</span>
        </div>
      }
      open={visible}
      onCancel={onCancel}
      width={800}
      footer={
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <Button onClick={onCancel}>
            跳过指南
          </Button>
          <Space>
            <Button 
              onClick={prevStep} 
              disabled={currentStep === 0}
            >
              上一步
            </Button>
            {currentStep < steps.length - 1 ? (
              <Button type="primary" onClick={nextStep} icon={<RightOutlined />}>
                下一步
              </Button>
            ) : (
              <Button type="primary" onClick={onCancel} icon={<CheckCircleOutlined />}>
                完成
              </Button>
            )}
          </Space>
        </div>
      }
      destroyOnClose
    >
      <div style={{ padding: '16px 0' }}>
        {/* 步骤指示器 */}
        <Steps current={currentStep} style={{ marginBottom: 32 }}>
          {steps.map((step, index) => (
            <Step
              key={index}
              title={step.title}
              icon={step.icon}
            />
          ))}
        </Steps>

        {/* 当前步骤内容 */}
        <div style={{ minHeight: '400px' }}>
          <Title level={3} style={{ marginBottom: 24 }}>
            {steps[currentStep].icon}
            <span style={{ marginLeft: 8 }}>{steps[currentStep].title}</span>
          </Title>
          {steps[currentStep].content}
        </div>

        {/* 进度指示 */}
        <Divider />
        <div style={{ textAlign: 'center' }}>
          <Text type="secondary">
            {currentStep + 1} / {steps.length}
          </Text>
        </div>
      </div>
    </Modal>
  );
};

export default QuickStartGuide; 