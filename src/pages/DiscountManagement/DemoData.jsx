import React from 'react';
import { Card, Typography, Divider, Space, Tag } from 'antd';

const { Title, Paragraph, Text } = Typography;

const DemoData = () => {
  return (
    <Card title="折扣管理系统演示数据" style={{ margin: '20px' }}>
      <Typography>
        <Title level={3}>系统已配置的演示数据</Title>
        
        <Title level={4}>📊 折扣等级</Title>
        <Space direction="vertical" style={{ width: '100%' }}>
          <Space>
            <Tag color="blue">A</Tag>
            <Text strong>A级代理商</Text>
            <Text type="secondary">- 最高折扣等级</Text>
          </Space>
          <Space>
            <Tag color="orange">B</Tag>
            <Text strong>B级代理商</Text>
            <Text type="secondary">- 中等折扣等级</Text>
          </Space>
          <Space>
            <Tag color="green">C</Tag>
            <Text strong>C级代理商</Text>
            <Text type="secondary">- 基础折扣等级</Text>
          </Space>
        </Space>

        <Divider />

        <Title level={4}>🎯 示例折扣配置</Title>
        <Paragraph>
          <Text strong>一日游产品：</Text>
          <ul>
            <li>A级代理商：30% 折扣（70% 价格）</li>
            <li>B级代理商：20% 折扣（80% 价格）</li>
            <li>C级代理商：10% 折扣（90% 价格）</li>
          </ul>
        </Paragraph>

        <Paragraph>
          <Text strong>跟团游产品：</Text>
          <ul>
            <li>A级代理商：35% 折扣（65% 价格）</li>
            <li>B级代理商：25% 折扣（75% 价格）</li>
            <li>C级代理商：15% 折扣（85% 价格）</li>
          </ul>
        </Paragraph>

        <Divider />

        <Title level={4}>📈 功能特点</Title>
        <ul>
          <li>支持按产品类型设置不同折扣率</li>
          <li>可设置最小订单金额和最大折扣金额限制</li>
          <li>支持折扣生效时间范围配置</li>
          <li>完整的折扣使用统计和分析</li>
          <li>向后兼容原有的统一折扣系统</li>
        </ul>

        <Divider />

        <Title level={4}>🔧 使用说明</Title>
        <Paragraph>
          1. <Text strong>折扣等级管理</Text>：创建和管理A、B、C等不同的代理商等级
        </Paragraph>
        <Paragraph>
          2. <Text strong>产品折扣配置</Text>：为每个等级配置具体产品的折扣率
        </Paragraph>
        <Paragraph>
          3. <Text strong>折扣统计</Text>：查看折扣使用情况和效果分析
        </Paragraph>

        <Divider />

        <Text type="secondary">
          💡 提示：如果API接口返回404错误，请确保后端服务已启动并已创建相应的折扣管理接口。
          当前页面支持向下兼容，即使部分接口不可用也能正常使用基本功能。
        </Text>
      </Typography>
    </Card>
  );
};

export default DemoData; 