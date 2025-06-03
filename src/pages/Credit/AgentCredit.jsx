import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Space, Form, Row, Col, Input, Select, DatePicker, message, Tag, Tooltip, Progress, Statistic, Divider, Alert } from 'antd';
import { SearchOutlined, ReloadOutlined, EyeOutlined, DownloadOutlined, DollarOutlined, EditOutlined } from '@ant-design/icons';
import { getAllAgentCredits, getAgentCreditDetail, topupAgentCredit, getAgentOptions, exportCreditTransactions, getCreditTransactionStats, getAgentList } from '../../apis/credit';
import './index.scss';
import CreditTopup from './components/CreditTopup';
import CreditEdit from './components/CreditEdit';
import CreditInfo from './components/CreditInfo';

const { Option } = Select;
const { RangePicker } = DatePicker;

const AgentCreditManagement = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [agentCredits, setAgentCredits] = useState([]);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0
  });
  const [topupVisible, setTopupVisible] = useState(false);
  const [editVisible, setEditVisible] = useState(false);
  const [selectedAgentId, setSelectedAgentId] = useState(null);
  const [agentOptions, setAgentOptions] = useState([]);
  const [searchingAgents, setSearchingAgents] = useState(false);
  const [statsLoading, setStatsLoading] = useState(false);
  const [creditStats, setCreditStats] = useState({
    totalCreditAmount: 0,
    totalUsedAmount: 0,
    totalAvailableAmount: 0,
    agentCount: 0,
    totalDepositBalance: 0
  });
  const [exportLoading, setExportLoading] = useState(false);

  // 初始加载
  useEffect(() => {
    fetchAgentCredits();
    fetchAgentOptions();
    fetchCreditStats();
  }, []);

  // 获取信用额度统计数据
  const fetchCreditStats = async () => {
    try {
      setStatsLoading(true);
      const response = await getCreditTransactionStats({});
      if (response && response.code === 1 && response.data) {
        setCreditStats({
          totalCreditAmount: response.data.totalCreditAmount || 0,
          totalUsedAmount: response.data.totalUsedAmount || 0,
          totalAvailableAmount: response.data.totalAvailableAmount || 0,
          agentCount: response.data.agentCount || 0,
          totalDepositBalance: response.data.totalDepositBalance || 0
        });
      }
    } catch (error) {
      console.error('获取信用额度统计数据失败:', error);
    } finally {
      setStatsLoading(false);
    }
  };

  // 获取代理商下拉选项
  const fetchAgentOptions = async (search = '') => {
    try {
      setSearchingAgents(true);
      const params = {};
      if (search) {
        params.name = search;
      }
      const response = await getAgentOptions(params);
      if (response.code === 1 && response.data) {
        setAgentOptions(response.data);
      }
    } catch (error) {
      console.error('获取代理商选项失败:', error);
    } finally {
      setSearchingAgents(false);
    }
  };

  // 处理代理商搜索
  const handleAgentSearch = (value) => {
    if (value) {
      fetchAgentOptions(value);
    }
  };

  // 获取代理商信用额度列表
  const fetchAgentCredits = async (page = pagination.current, pageSize = pagination.pageSize) => {
    try {
      setLoading(true);
      
      // 获取过滤条件
      const values = form.getFieldsValue();
      const params = {
        page,
        pageSize,
        agentName: values.agentName
      };
      
      // 处理代理商ID
      if (values.agentId) {
        params.agentId = values.agentId;
      }
      
      const res = await getAllAgentCredits(params);
      if (res.code === 1 && res.data) {
        console.log('获取的代理商信用额度列表:', res.data.records);
        
        // 获取代理商列表以关联名称
        const agentRes = await getAgentList();
        const agentsMap = {};
        
        if (agentRes.code === 1 && agentRes.data) {
          // 创建代理商ID到名称的映射
          agentRes.data.forEach(agent => {
            agentsMap[agent.id] = agent.companyName || agent.name || '未知代理商';
          });
        }
        
        // 处理数据，为每条记录添加代理商名称
        const processedRecords = (res.data.records || []).map(record => {
          return {
            ...record,
            agentName: record.agentName || agentsMap[record.agentId] || '未知代理商'
          };
        });
        
        setAgentCredits(processedRecords);
        setPagination({
          current: page,
          pageSize,
          total: res.data.total || 0
        });
      } else {
        message.error(res.msg || '获取代理商信用额度列表失败');
      }
    } catch (error) {
      console.error('获取代理商信用额度列表失败:', error);
      message.error('获取代理商信用额度列表失败');
    } finally {
      setLoading(false);
    }
  };

  // 导出数据
  const handleExport = async () => {
    try {
      setExportLoading(true);
      const values = form.getFieldsValue();
      const params = {
        agentId: values.agentId,
        agentName: values.agentName
      };
      
      const response = await exportCreditTransactions(params);
      
      // 创建下载链接
      const url = window.URL.createObjectURL(new Blob([response]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `代理商信用额度报表_${new Date().toLocaleDateString()}.xlsx`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      message.success('导出成功');
    } catch (error) {
      console.error('导出失败:', error);
      message.error('导出失败');
    } finally {
      setExportLoading(false);
    }
  };

  // 表格分页变化
  const handleTableChange = (pagination) => {
    fetchAgentCredits(pagination.current, pagination.pageSize);
  };

  // 搜索
  const handleSearch = () => {
    fetchAgentCredits(1, pagination.pageSize);
  };

  // 重置搜索
  const handleReset = () => {
    form.resetFields();
    fetchAgentCredits(1, pagination.pageSize);
  };

  // 充值信用额度
  const handleTopup = (agentId) => {
    // 确保agentId是数字类型
    if (!agentId) {
      console.error('代理商ID为空或未定义', agentId);
      message.error('代理商ID无效');
      return;
    }
    
    // 转换为数字类型
    const agentIdNum = parseInt(agentId);
    
    if (isNaN(agentIdNum)) {
      console.error('无效的代理商ID:', agentId);
      message.error('无效的代理商ID');
      return;
    }
    
    console.log('准备充值，代理商ID:', agentIdNum);
    setSelectedAgentId(agentIdNum);
    setTopupVisible(true);
  };

  // 关闭弹窗并刷新数据
  const handleCloseModal = (refresh = false) => {
    setTopupVisible(false);
    setSelectedAgentId(null);
    
    if (refresh) {
      fetchAgentCredits();
      fetchCreditStats(); // 刷新统计数据
    }
  };

  // 获取信用使用率进度条颜色
  const getCreditUsageColor = (usedRatio) => {
    if (usedRatio >= 90) return '#f5222d'; // 危险红色
    if (usedRatio >= 70) return '#faad14'; // 警告黄色
    return '#52c41a'; // 安全绿色
  };

  // 打开编辑弹窗
  const handleEdit = (agentId) => {
    // 确保agentId是数字类型
    if (!agentId) {
      console.error('代理商ID为空或未定义', agentId);
      message.error('代理商ID无效');
      return;
    }
    
    // 转换为数字类型
    const agentIdNum = parseInt(agentId);
    
    if (isNaN(agentIdNum)) {
      console.error('无效的代理商ID:', agentId);
      message.error('无效的代理商ID');
      return;
    }
    
    console.log('准备编辑信用额度信息，代理商ID:', agentIdNum);
    setSelectedAgentId(agentIdNum);
    setEditVisible(true);
  };

  // 关闭编辑弹窗并刷新数据
  const handleCloseEditModal = (refresh = false) => {
    setEditVisible(false);
    setSelectedAgentId(null);
    
    if (refresh) {
      fetchAgentCredits();
      fetchCreditStats(); // 刷新统计数据
    }
  };

  // 表格列配置
  const columns = [
    {
      title: '代理商ID',
      dataIndex: 'agentId',
      key: 'agentId',
      width: 80,
      render: (id, record) => (
        <Space>
          {id}
          <CreditInfo record={record} />
        </Space>
      )
    },
    {
      title: '代理商名称',
      dataIndex: 'agentName',
      key: 'agentName',
      width: 120,
      render: (text) => text || '-'
    },
    {
      title: '总信用额度',
      dataIndex: 'totalCredit',
      key: 'totalCredit',
      width: 100,
      render: (amount) => amount ? `￥${amount.toFixed(2)}` : '￥0.00',
      sorter: (a, b) => a.totalCredit - b.totalCredit
    },
    {
      title: '已使用额度',
      dataIndex: 'usedCredit',
      key: 'usedCredit',
      width: 100,
      render: (amount) => amount ? `￥${amount.toFixed(2)}` : '￥0.00',
      sorter: (a, b) => a.usedCredit - b.usedCredit
    },
    {
      title: '预存余额',
      dataIndex: 'depositBalance',
      key: 'depositBalance',
      width: 100,
      render: (amount) => amount ? (
        <Tag color="cyan">
          ￥{amount.toFixed(2)}
        </Tag>
      ) : '￥0.00',
      sorter: (a, b) => (a.depositBalance || 0) - (b.depositBalance || 0)
    },
    {
      title: '可用额度',
      dataIndex: 'availableCredit',
      key: 'availableCredit',
      width: 100,
      render: (amount) => amount ? (
        <Tag color={amount > 1000 ? 'green' : amount > 0 ? 'orange' : 'red'}>
          ￥{amount.toFixed(2)}
        </Tag>
      ) : '￥0.00',
      sorter: (a, b) => a.availableCredit - b.availableCredit
    },
    {
      title: '信用评级',
      dataIndex: 'creditRating',
      key: 'creditRating',
      width: 80,
      render: (rating) => {
        const ratingColors = {
          'AAA': '#52c41a', 'AA': '#73d13d', 'A': '#95de64',
          'BBB': '#ffc53d', 'BB': '#faad14', 'B': '#fa8c16',
          'CCC': '#ff7875', 'CC': '#ff4d4f', 'C': '#f5222d', 'D': '#cf1322'
        };
        return (
          <Tag color={ratingColors[rating] || 'default'}>
            {rating || 'B'}
          </Tag>
        );
      },
      sorter: (a, b) => {
        const ratingOrder = {
          'AAA': 10, 'AA': 9, 'A': 8, 
          'BBB': 7, 'BB': 6, 'B': 5, 
          'CCC': 4, 'CC': 3, 'C': 2, 'D': 1
        };
        return (ratingOrder[a.creditRating] || 0) - (ratingOrder[b.creditRating] || 0);
      }
    },
    {
      title: '利率',
      dataIndex: 'interestRate',
      key: 'interestRate',
      width: 70,
      render: (rate) => rate ? `${rate.toFixed(2)}%` : '0.00%',
      sorter: (a, b) => (a.interestRate || 0) - (b.interestRate || 0)
    },
    {
      title: '状态',
      dataIndex: 'isFrozen',
      key: 'isFrozen',
      width: 80,
      render: (frozen) => {
        return frozen ? 
          <Tag color="red">已冻结</Tag> : 
          <Tag color="green">正常</Tag>;
      },
      filters: [
        { text: '正常', value: false },
        { text: '冻结', value: true }
      ],
      onFilter: (value, record) => record.isFrozen === value
    },
    {
      title: '操作',
      key: 'action',
      width: 180,
      render: (_, record) => (
        <Space size="small">
          <Button
            type="primary"
            size="small"
            icon={<DollarOutlined />}
            onClick={() => handleTopup(record.agentId)}
          >
            充值
          </Button>
          <Button
            type="default"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record.agentId)}
          >
            编辑
          </Button>
          <Button
            type="default"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => window.location.href = `/credit/transactions?agentId=${record.agentId}`}
          >
            交易
          </Button>
        </Space>
      )
    }
  ];

  return (
    <div className="agent-credit-management">
      <Card title="代理商信用额度管理" className="credit-card">
        <Alert
          message="信用额度系统说明"
          description={
            <ul className="credit-rules">
              <li>总信用额度固定不变，只有管理员可调整</li>
              <li>代理商充值金额会优先减少已使用额度，剩余部分计入预存余额</li>
              <li>支付时会优先使用预存余额，不足时再使用信用额度</li>
              <li>可用额度 = 总额度 - 已使用额度 + 预存余额</li>
              <li>系统支持信用评级、利率、账单周期日等高级设置，可通过"编辑"按钮修改</li>
              <li>代理商账户可以被冻结，冻结后将无法使用信用额度进行支付</li>
            </ul>
          }
          type="info"
          showIcon
          closable
          style={{ marginBottom: '16px' }}
        />
        
        {/* 统计信息 */}
        <div className="credit-stats">
          <Row gutter={16}>
            <Col span={6}>
              <Statistic
                title="总信用额度"
                value={creditStats.totalCreditAmount}
                precision={2}
                prefix="¥"
                loading={statsLoading}
                valueStyle={{ color: '#3f8600' }}
              />
              <div className="stat-note">固定总额度，仅管理员可调整</div>
            </Col>
            <Col span={6}>
              <Statistic
                title="已使用额度"
                value={creditStats.totalUsedAmount}
                precision={2}
                prefix="¥"
                loading={statsLoading}
                valueStyle={{ color: '#cf1322' }}
              />
            </Col>
            <Col span={5}>
              <Statistic
                title="预存余额"
                value={creditStats.totalDepositBalance || 0}
                precision={2}
                prefix="¥"
                loading={statsLoading}
                valueStyle={{ color: '#1890ff' }}
              />
            </Col>
            <Col span={7}>
              <Statistic
                title="可用额度"
                value={creditStats.totalAvailableAmount}
                precision={2}
                prefix="¥"
                loading={statsLoading}
                valueStyle={{ color: '#096dd9' }}
              />
              <div className="stat-note">可用额度 = 总额度 - 已使用额度 + 预存余额</div>
            </Col>
          </Row>
        </div>
        
        <Divider style={{ margin: '16px 0' }} />
        
        {/* 搜索表单 */}
        <Form
          form={form}
          layout="horizontal"
          className="credit-filter"
        >
          <Row gutter={16}>
            <Col span={6}>
              <Form.Item name="agentId" label="代理商">
                <Select
                  placeholder="请选择代理商"
                  allowClear
                  showSearch
                  loading={searchingAgents}
                  filterOption={false}
                  onSearch={handleAgentSearch}
                  onFocus={() => fetchAgentOptions()}
                >
                  {agentOptions.map(agent => (
                    <Option key={agent.id} value={agent.id}>
                      {agent.companyName}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="agentName" label="代理商名称">
                <Input placeholder="请输入代理商名称" allowClear />
              </Form.Item>
            </Col>
            <Col span={12} style={{ textAlign: 'right' }}>
              <Form.Item>
                <Space>
                  <Button 
                    type="primary"
                    icon={<SearchOutlined />} 
                    onClick={handleSearch}
                  >
                    搜索
                  </Button>
                  <Button 
                    icon={<ReloadOutlined />} 
                    onClick={handleReset}
                  >
                    重置
                  </Button>
                  <Button
                    type="default"
                    icon={<DownloadOutlined />}
                    onClick={handleExport}
                    loading={exportLoading}
                  >
                    导出数据
                  </Button>
                </Space>
              </Form.Item>
            </Col>
          </Row>
        </Form>

        {/* 代理商信用额度列表 */}
        <Table
          rowKey="agentId"
          loading={loading}
          columns={columns}
          dataSource={agentCredits}
          pagination={pagination}
          onChange={handleTableChange}
          scroll={{ x: 1100 }}
          className="credit-table"
        />
      </Card>

      {/* 充值弹窗 */}
      <CreditTopup
        visible={topupVisible}
        agentId={selectedAgentId}
        onClose={handleCloseModal}
      />
      
      {/* 编辑弹窗 */}
      <CreditEdit
        visible={editVisible}
        agentId={selectedAgentId}
        onClose={handleCloseEditModal}
      />
    </div>
  );
};

export default AgentCreditManagement; 