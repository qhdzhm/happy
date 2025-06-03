import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Space, Form, Row, Col, Input, Select, DatePicker, message, Tag } from 'antd';
import { SearchOutlined, ReloadOutlined, DownloadOutlined } from '@ant-design/icons';
import { getCreditTransactions, exportCreditTransactions, getAgentOptions } from '../../apis/credit';
import moment from 'moment';
import './index.scss';

const { Option } = Select;
const { RangePicker } = DatePicker;

// 交易类型标签颜色映射
const typeColors = {
  topup: 'green',
  payment: 'blue',
  refund: 'gold',
  adjustment: 'purple'
};

// 交易类型中文显示
const typeText = {
  topup: '充值',
  payment: '支付',
  refund: '退款',
  adjustment: '调整'
};

const TransactionListPage = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [transactions, setTransactions] = useState([]);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0
  });
  const [agentOptions, setAgentOptions] = useState([]);
  const [searchingAgents, setSearchingAgents] = useState(false);

  // 初始加载
  useEffect(() => {
    // 从URL中获取参数
    const urlParams = new URLSearchParams(window.location.search);
    const agentId = urlParams.get('agentId');
    
    if (agentId) {
      form.setFieldsValue({ agentId: parseInt(agentId) });
    }
    
    fetchTransactions();
    fetchAgentOptions();
  }, []);

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

  // 获取交易记录列表
  const fetchTransactions = async (page = pagination.current, pageSize = pagination.pageSize) => {
    try {
      setLoading(true);
      
      // 获取过滤条件
      const values = form.getFieldsValue();
      const params = {
        page,
        pageSize,
        transactionType: values.type
      };
      
      // 处理代理商ID
      if (values.agentId) {
        params.agentId = values.agentId;
      }
      
      // 处理交易编号
      if (values.transactionNo) {
        params.transactionNo = values.transactionNo;
      }
      
      // 处理日期范围
      if (values.dateRange && values.dateRange.length === 2) {
        params.startDate = values.dateRange[0].format('YYYY-MM-DD');
        params.endDate = values.dateRange[1].format('YYYY-MM-DD');
      }
      
      const res = await getCreditTransactions(params);
      if (res.code === 1 && res.data) {
        console.log('获取的交易记录列表:', res.data.records);
        
        // 处理数据，确保字段正确映射
        const processedData = (res.data.records || []).map(record => {
          return {
            ...record,
            // 确保createdByName字段有值
            createdByName: record.createdByName || (record.createdBy ? `ID: ${record.createdBy}` : '-')
          };
        });
        
        setTransactions(processedData);
        setPagination({
          current: page,
          pageSize,
          total: res.data.total || 0
        });
      } else {
        message.error(res.msg || '获取交易记录列表失败');
      }
    } catch (error) {
      console.error('获取交易记录列表失败:', error);
      message.error('获取交易记录列表失败');
    } finally {
      setLoading(false);
    }
  };

  // 表格分页变化
  const handleTableChange = (pagination) => {
    fetchTransactions(pagination.current, pagination.pageSize);
  };

  // 搜索
  const handleSearch = () => {
    fetchTransactions(1, pagination.pageSize);
  };

  // 重置搜索
  const handleReset = () => {
    form.resetFields();
    fetchTransactions(1, pagination.pageSize);
  };

  // 导出交易记录
  const handleExport = async () => {
    try {
      // 获取过滤条件
      const values = form.getFieldsValue();
      
      // 构建与查询相同的参数对象，确保导出与筛选结果一致
      const params = {};
      
      // 处理交易类型 - 确保使用正确的参数名
      if (values.type) {
        params.transactionType = values.type;
      }
      
      // 处理代理商ID
      if (values.agentId) {
        params.agentId = values.agentId;
      }
      
      // 处理交易编号
      if (values.transactionNo) {
        params.transactionNo = values.transactionNo;
      }
      
      // 处理日期范围
      if (values.dateRange && values.dateRange.length === 2) {
        params.startDate = values.dateRange[0].format('YYYY-MM-DD');
        params.endDate = values.dateRange[1].format('YYYY-MM-DD');
      }
      
      // 显示加载提示，使用key便于后续关闭
      const loadingKey = 'exportLoading';
      message.loading({ content: '正在导出数据...', key: loadingKey, duration: 0 });
      
      console.log('发送导出请求，参数:', params);
      
      // 使用直接的获取方式，绕过拦截器
      const baseURL = '//localhost:8080';
      const token = localStorage.getItem('token');
      const queryString = Object.keys(params)
        .filter(key => params[key] !== undefined && params[key] !== null)
        .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
        .join('&');
      
      const url = `${baseURL}/admin/credits/transactions/export${queryString ? `?${queryString}` : ''}`;
      
      // 创建请求
      const xhr = new XMLHttpRequest();
      xhr.open('GET', url, true);
      xhr.responseType = 'blob';
      xhr.setRequestHeader('token', token);
      
      xhr.onload = function() {
        if (xhr.status === 200) {
          // 获取文件名
          const disposition = xhr.getResponseHeader('Content-Disposition');
          let filename = '信用交易记录.xlsx';
          if (disposition && disposition.indexOf('attachment') !== -1) {
            const filenameRegex = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/;
            const matches = filenameRegex.exec(disposition);
            if (matches != null && matches[1]) {
              filename = matches[1].replace(/['"]/g, '');
            }
          }
          
          // 构建文件名：加入筛选信息
          if (values.agentId) {
            const agent = agentOptions.find(a => a.id === values.agentId);
            if (agent) {
              filename = `信用交易记录_${agent.companyName}_${moment().format('YYYYMMDD')}.xlsx`;
            } else {
              filename = `信用交易记录_代理商${values.agentId}_${moment().format('YYYYMMDD')}.xlsx`;
            }
          } else {
            filename = `信用交易记录_${moment().format('YYYYMMDD')}.xlsx`;
          }
          
          if (values.type) {
            filename = filename.replace('.xlsx', `_${typeText[values.type] || values.type}.xlsx`);
          }
          
          const blob = new Blob([xhr.response], { 
            type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
          });
          
          // 创建下载链接
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.setAttribute('download', filename);
          document.body.appendChild(link);
          link.click();
          
          // 清理
          document.body.removeChild(link);
          window.URL.revokeObjectURL(url);
          
          message.success({ content: '导出成功', key: loadingKey, duration: 2 });
        } else {
          message.error({ content: `导出失败: ${xhr.status}`, key: loadingKey, duration: 2 });
        }
      };
      
      xhr.onerror = function() {
        message.error({ content: '导出失败: 网络错误', key: loadingKey, duration: 2 });
      };
      
      xhr.send();
    } catch (error) {
      console.error('导出失败:', error);
      message.error('导出失败: ' + (error.message || '未知错误'));
    }
  };

  // 表格列配置
  const columns = [
    {
      title: '交易编号',
      dataIndex: 'transactionNo',
      key: 'transactionNo',
      width: 150,
      render: (text) => text || '-'
    },
    {
      title: '代理商',
      dataIndex: 'agentName',
      key: 'agentName',
      width: 150,
      render: (text, record) => {
        if (text) return text;
        return record.agentId ? `代理商(ID: ${record.agentId})` : '-';
      }
    },
    {
      title: '交易类型',
      dataIndex: 'transactionType',
      key: 'transactionType',
      width: 100,
      render: (type) => (
        <Tag color={typeColors[type] || 'default'}>
          {typeText[type] || type || '未知'}
        </Tag>
      )
    },
    {
      title: '交易金额',
      dataIndex: 'amount',
      key: 'amount',
      width: 120,
      render: (amount) => amount ? `￥${amount.toFixed(2)}` : '￥0.00'
    },
    {
      title: '交易前余额',
      dataIndex: 'balanceBefore',
      key: 'balanceBefore',
      width: 120,
      render: (amount) => amount ? `￥${amount.toFixed(2)}` : '￥0.00'
    },
    {
      title: '交易后余额',
      dataIndex: 'balanceAfter',
      key: 'balanceAfter',
      width: 120,
      render: (amount) => amount ? `￥${amount.toFixed(2)}` : '￥0.00'
    },
    {
      title: '订单号',
      dataIndex: 'bookingId',
      key: 'bookingId',
      width: 150,
      render: (text) => text || '-'
    },
    {
      title: '操作人',
      dataIndex: 'createdByName',
      key: 'createdByName',
      width: 150,
      render: (text, record) => {
        if (text) return text;
        return record.createdById ? `ID: ${record.createdById}` : '-';
      }
    },
    {
      title: '交易时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 180,
      render: (time) => time ? moment(time).format('YYYY-MM-DD HH:mm:ss') : '-'
    }
  ];

  return (
    <div className="transaction-management">
      <Card 
        title="信用交易记录" 
        extra={
          <Button 
            type="primary" 
            icon={<DownloadOutlined />} 
            onClick={handleExport}
          >
            导出数据
          </Button>
        }
        className="transaction-card"
      >
        {/* 搜索表单 */}
        <Form
          form={form}
          layout="horizontal"
          className="credit-filter"
        >
          <Row gutter={24}>
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
              <Form.Item name="transactionNo" label="交易编号">
                <Input placeholder="请输入交易编号" allowClear />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="type" label="交易类型">
                <Select placeholder="请选择类型" allowClear>
                  <Option value="topup">充值</Option>
                  <Option value="payment">支付</Option>
                  <Option value="refund">退款</Option>
                  <Option value="adjustment">调整</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={6} style={{ textAlign: 'right' }}>
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
                </Space>
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={24}>
            <Col span={12}>
              <Form.Item name="dateRange" label="交易时间">
                <RangePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
        </Form>

        {/* 交易记录列表 */}
        <Table
          rowKey="id"
          loading={loading}
          columns={columns}
          dataSource={transactions}
          pagination={pagination}
          onChange={handleTableChange}
          scroll={{ x: 1300 }}
          className="transaction-table"
        />
      </Card>
    </div>
  );
};

export default TransactionListPage; 