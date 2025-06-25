import React, { useState, useEffect } from 'react';
import { Card, Typography, Collapse, Table, Tag, Space, Button, message } from 'antd';
import { ReloadOutlined, BugOutlined } from '@ant-design/icons';
import { getDayTourList, getGroupTourList } from '@/apis/discount';

const { Title, Text, Paragraph } = Typography;
const { Panel } = Collapse;

const ProductDebug = () => {
  const [dayTours, setDayTours] = useState([]);
  const [groupTours, setGroupTours] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [dayTourRes, groupTourRes] = await Promise.all([
        getDayTourList(),
        getGroupTourList()
      ]);

      console.log('=== 一日游API响应 ===', dayTourRes);
      console.log('=== 跟团游API响应 ===', groupTourRes);

      if (dayTourRes.code === 1) {
        const data = dayTourRes.data?.records || [];
        setDayTours(data);
        console.log('一日游数据条数:', data.length);
        if (data.length > 0) {
          console.log('第一条一日游数据:', data[0]);
        }
      }

      if (groupTourRes.code === 1) {
        const data = groupTourRes.data?.records || [];
        setGroupTours(data);
        console.log('跟团游数据条数:', data.length);
        if (data.length > 0) {
          console.log('第一条跟团游数据:', data[0]);
        }
      }

      message.success('数据已刷新，请查看控制台日志');
    } catch (error) {
      console.error('获取产品数据失败:', error);
      message.error('获取产品数据失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const dayTourColumns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 60
    },
    {
      title: '名称 (name)',
      dataIndex: 'name',
      key: 'name',
      render: (name) => name || <Text type="secondary">无名称</Text>
    },
    {
      title: '描述 (description)',
      dataIndex: 'description',
      key: 'description',
      render: (desc) => desc ? `${desc.substring(0, 30)}...` : <Text type="secondary">无描述</Text>
    },
    {
      title: '价格',
      dataIndex: 'price',
      key: 'price',
      render: (price) => price ? `$${price}` : '-'
    },
    {
      title: '状态',
      dataIndex: 'isActive',
      key: 'isActive',
      render: (active) => (
        <Tag color={active === 1 ? 'green' : 'red'}>
          {active === 1 ? '激活' : '未激活'}
        </Tag>
      )
    }
  ];

  const groupTourColumns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 60
    },
    {
      title: '名称 (name)',
      dataIndex: 'name',
      key: 'name',
      render: (name) => name || <Text type="secondary">无名称</Text>
    },
    {
      title: '描述 (description)',
      dataIndex: 'description',
      key: 'description',
      render: (desc) => desc ? `${desc.substring(0, 30)}...` : <Text type="secondary">无描述</Text>
    },
    {
      title: '价格',
      dataIndex: 'price',
      key: 'price',
      render: (price) => price ? `$${price}` : '-'
    },
    {
      title: '开始日期',
      dataIndex: 'startDate',
      key: 'startDate'
    }
  ];

  return (
    <Card title={
      <Space>
        <BugOutlined />
        产品数据调试
      </Space>
    }>
      <Space style={{ marginBottom: 16 }}>
        <Button 
          type="primary" 
          icon={<ReloadOutlined />} 
          onClick={fetchData}
          loading={loading}
        >
          刷新数据
        </Button>
        <Text type="secondary">查看控制台获取详细日志信息</Text>
      </Space>

      <Collapse defaultActiveKey={['1', '2']}>
        <Panel header={`一日游数据 (${dayTours.length} 条)`} key="1">
          <Paragraph>
            <Text strong>API路径：</Text> <code>GET /admin/daytour/page</code><br/>
            <Text strong>数据字段：</Text> 主要关注 <code>name</code> 和 <code>description</code> 字段
          </Paragraph>
          
          <Table
            columns={dayTourColumns}
            dataSource={dayTours}
            rowKey="id"
            size="small"
            pagination={{ pageSize: 5 }}
            scroll={{ x: 800 }}
          />
          
          {dayTours.length > 0 && (
            <div style={{ marginTop: 16, padding: 12, background: '#f5f5f5', borderRadius: 4 }}>
              <Text strong>第一条数据示例：</Text>
              <pre style={{ marginTop: 8, fontSize: 12 }}>
                {JSON.stringify(dayTours[0], null, 2)}
              </pre>
            </div>
          )}
        </Panel>

        <Panel header={`跟团游数据 (${groupTours.length} 条)`} key="2">
          <Paragraph>
            <Text strong>API路径：</Text> <code>GET /admin/grouptour/page</code><br/>
            <Text strong>数据字段：</Text> 主要关注 <code>name</code> 和 <code>description</code> 字段
          </Paragraph>
          
          <Table
            columns={groupTourColumns}
            dataSource={groupTours}
            rowKey="id"
            size="small"
            pagination={{ pageSize: 5 }}
            scroll={{ x: 800 }}
          />
          
          {groupTours.length > 0 && (
            <div style={{ marginTop: 16, padding: 12, background: '#f5f5f5', borderRadius: 4 }}>
              <Text strong>第一条数据示例：</Text>
              <pre style={{ marginTop: 8, fontSize: 12 }}>
                {JSON.stringify(groupTours[0], null, 2)}
              </pre>
            </div>
          )}
        </Panel>
      </Collapse>

      <div style={{ marginTop: 16, padding: 16, background: '#fff7e6', borderRadius: 4 }}>
        <Title level={5}>🔍 调试说明</Title>
        <ul>
          <li><strong>查看控制台：</strong>打开浏览器开发者工具的Console标签页查看详细日志</li>
          <li><strong>数据结构：</strong>确认产品的 <code>name</code> 字段是否有值</li>
          <li><strong>空名称处理：</strong>如果 <code>name</code> 为空，系统会使用 <code>description</code> 的前20个字符</li>
          <li><strong>未知产品：</strong>如果显示"未知产品"，说明在当前等级的折扣配置中引用的产品ID在产品列表中找不到</li>
        </ul>
      </div>
    </Card>
  );
};

export default ProductDebug; 