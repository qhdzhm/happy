import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Table, 
  DatePicker, 
  Select, 
  Row, 
  Col, 
  Statistic, 
  Space, 
  Button,
  message,
  Tag
} from 'antd';
import { 
  DollarOutlined,
  PercentageOutlined,
  UserOutlined,
  ShoppingOutlined,
  ReloadOutlined,
  DownloadOutlined
} from '@ant-design/icons';
import {
  getDiscountStats,
  getAgentDiscountLogs,
  getProductDiscountStats
} from '@/apis/discount';
import './DiscountManagement.scss';

const { RangePicker } = DatePicker;
const { Option } = Select;

const DiscountStats = () => {
  const [loading, setLoading] = useState(false);
  const [statsData, setStatsData] = useState([]);
  const [summaryStats, setSummaryStats] = useState({
    totalDiscountAmount: 0,
    totalOrderCount: 0,
    avgDiscountRate: 0,
    totalSavedAmount: 0
  });
  const [dateRange, setDateRange] = useState([]);
  const [filterType, setFilterType] = useState('all');

  useEffect(() => {
    fetchStats();
  }, [dateRange, filterType]);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const [startTime, endTime] = dateRange;
      const res = await getDiscountStats(
        startTime?.format('YYYY-MM-DD HH:mm:ss'),
        endTime?.format('YYYY-MM-DD HH:mm:ss')
      );
      
      if (res.code === 1) {
        const data = res.data || [];
        setStatsData(data);
        
        // 计算汇总统计
        const summary = data.reduce((acc, item) => {
          acc.totalDiscountAmount += item.discountAmount || 0;
          acc.totalOrderCount += 1;
          acc.totalSavedAmount += item.discountAmount || 0;
          return acc;
        }, {
          totalDiscountAmount: 0,
          totalOrderCount: 0,
          avgDiscountRate: 0,
          totalSavedAmount: 0
        });
        
        if (summary.totalOrderCount > 0) {
          summary.avgDiscountRate = (summary.totalDiscountAmount / summary.totalOrderCount) || 0;
        }
        
        setSummaryStats(summary);
      }
    } catch (error) {
      message.error('获取折扣统计失败');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    // 导出功能实现
    message.info('导出功能开发中...');
  };

  const columns = [
    {
      title: '时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 180,
      render: (time) => new Date(time).toLocaleString()
    },
    {
      title: '代理商ID',
      dataIndex: 'agentId',
      key: 'agentId',
      width: 100
    },
    {
      title: '订单ID',
      dataIndex: 'orderId',
      key: 'orderId',
      width: 100
    },
    {
      title: '产品类型',
      dataIndex: 'productType',
      key: 'productType',
      width: 100,
      render: (type) => (
        <Tag color={type === 'day_tour' ? 'orange' : 'purple'}>
          {type === 'day_tour' ? '一日游' : '跟团游'}
        </Tag>
      )
    },
    {
      title: '产品ID',
      dataIndex: 'productId',
      key: 'productId',
      width: 100
    },
    {
      title: '原价',
      dataIndex: 'originalPrice',
      key: 'originalPrice',
      width: 100,
      render: (price) => `$${price?.toFixed(2) || '0.00'}`
    },
    {
      title: '折扣率',
      dataIndex: 'discountRate',
      key: 'discountRate',
      width: 100,
      render: (rate) => `${((1 - rate) * 100).toFixed(1)}%`
    },
    {
      title: '折扣金额',
      dataIndex: 'discountAmount',
      key: 'discountAmount',
      width: 100,
      render: (amount) => (
        <span style={{ color: '#52c41a', fontWeight: 'bold' }}>
          $${amount?.toFixed(2) || '0.00'}
        </span>
      )
    },
    {
      title: '最终价格',
      dataIndex: 'finalPrice',
      key: 'finalPrice',
      width: 100,
      render: (price) => `$${price?.toFixed(2) || '0.00'}`
    },
    {
      title: '等级',
      dataIndex: 'levelCode',
      key: 'levelCode',
      width: 80,
      render: (level) => level ? <Tag color="blue">{level}</Tag> : '-'
    }
  ];

  return (
    <div className="discount-stats">
      <Card title="折扣使用统计" className="main-card">
        {/* 统计概览 */}
        <Row gutter={16} className="stats-overview">
          <Col span={6}>
            <Card>
              <Statistic
                title="总折扣金额"
                value={summaryStats.totalSavedAmount}
                prefix={<DollarOutlined />}
                precision={2}
                valueStyle={{ color: '#3f8600' }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="总订单数"
                value={summaryStats.totalOrderCount}
                prefix={<ShoppingOutlined />}
                valueStyle={{ color: '#1890ff' }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="平均折扣率"
                value={((1 - summaryStats.avgDiscountRate) * 100)}
                suffix="%"
                prefix={<PercentageOutlined />}
                precision={1}
                valueStyle={{ color: '#cf1322' }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="平均折扣金额"
                value={summaryStats.totalOrderCount > 0 ? summaryStats.totalSavedAmount / summaryStats.totalOrderCount : 0}
                prefix={<DollarOutlined />}
                precision={2}
                valueStyle={{ color: '#722ed1' }}
              />
            </Card>
          </Col>
        </Row>

        {/* 筛选条件 */}
        <Card className="filter-card">
          <Row gutter={16} align="middle">
            <Col span={8}>
              <Space>
                <span>时间范围：</span>
                <RangePicker
                  showTime
                  value={dateRange}
                  onChange={setDateRange}
                  placeholder={['开始时间', '结束时间']}
                />
              </Space>
            </Col>
            <Col span={8}>
              <Space>
                <span>筛选类型：</span>
                <Select 
                  value={filterType} 
                  onChange={setFilterType}
                  style={{ width: 150 }}
                >
                  <Option value="all">全部</Option>
                  <Option value="day_tour">一日游</Option>
                  <Option value="group_tour">跟团游</Option>
                </Select>
              </Space>
            </Col>
            <Col span={8}>
              <Space>
                <Button 
                  type="primary" 
                  icon={<ReloadOutlined />}
                  onClick={fetchStats}
                  loading={loading}
                >
                  刷新
                </Button>
                <Button 
                  icon={<DownloadOutlined />}
                  onClick={handleExport}
                >
                  导出
                </Button>
              </Space>
            </Col>
          </Row>
        </Card>

        {/* 详细数据表格 */}
        <Card className="data-table">
          <Table
            columns={columns}
            dataSource={statsData}
            loading={loading}
            rowKey="id"
            scroll={{ x: 1200 }}
            pagination={{
              total: statsData.length,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total) => `共 ${total} 条记录`
            }}
          />
        </Card>
      </Card>
    </div>
  );
};

export default DiscountStats; 