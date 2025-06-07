import React, { useState, useEffect } from 'react';
import { 
  Table, 
  Card, 
  Button, 
  Space, 
  Form, 
  DatePicker, 
  Input, 
  Select, 
  Modal, 
  message, 
  Popconfirm, 
  Tag, 
  Tooltip,
  Row,
  Col,
  Statistic,
  Tabs
} from 'antd';
import { 
  PlusOutlined, 
  SearchOutlined, 
  ExportOutlined, 
  EyeOutlined, 
  EditOutlined, 
  DeleteOutlined, 
  StopOutlined,
  CalendarOutlined,
  CarOutlined,
  UserOutlined,
  EnvironmentOutlined,
  TableOutlined,
  SettingOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import * as tourAssignmentAPI from '@/api/tourAssignment';
import AssignmentForm from './components/AssignmentForm';
import AssignmentDetail from './components/AssignmentDetail';
import AssignmentTable from './components/AssignmentTable';
import './index.scss';

const { RangePicker } = DatePicker;
const { Option } = Select;
const { TabPane } = Tabs;

const TourAssignment = () => {
  const [loading, setLoading] = useState(false);
  const [assignments, setAssignments] = useState([]);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0
  });
  const [searchForm] = Form.useForm();
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [currentRecord, setCurrentRecord] = useState(null);
  const [statistics, setStatistics] = useState({});
  const [activeTab, setActiveTab] = useState('management');

  // 搜索参数
  const [searchParams, setSearchParams] = useState({});

  // 获取分配列表
  const fetchAssignments = async (params = {}) => {
    setLoading(true);
    try {
      const queryParams = {
        page: pagination.current,
        pageSize: pagination.pageSize,
        ...searchParams,
        ...params
      };
      
      const response = await tourAssignmentAPI.getAssignmentsPage(queryParams);
      if (response.code === 1) {
        setAssignments(response.data.records || []);
        setPagination(prev => ({
          ...prev,
          total: response.data.total || 0
        }));
      } else {
        message.error(response.msg || '获取分配记录失败');
      }
    } catch (error) {
      message.error('获取分配记录失败');
      console.error('获取分配记录失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // 获取今日统计
  const fetchTodayStatistics = async () => {
    try {
      const today = dayjs().format('YYYY-MM-DD');
      const response = await tourAssignmentAPI.getAssignmentStatistics(today);
      if (response.code === 1) {
        setStatistics(response.data || {});
      }
    } catch (error) {
      console.error('获取统计信息失败:', error);
    }
  };

  useEffect(() => {
    if (activeTab === 'management') {
      fetchAssignments();
      fetchTodayStatistics();
    }
  }, [pagination.current, pagination.pageSize, activeTab]);

  // 搜索
  const handleSearch = (values) => {
    const params = {};
    if (values.dateRange && values.dateRange.length === 2) {
      params.startDate = values.dateRange[0].format('YYYY-MM-DD');
      params.endDate = values.dateRange[1].format('YYYY-MM-DD');
    }
    if (values.destination) params.destination = values.destination;
    if (values.guideName) params.guideName = values.guideName;
    if (values.licensePlate) params.licensePlate = values.licensePlate;
    if (values.status) params.status = values.status;

    setSearchParams(params);
    setPagination(prev => ({ ...prev, current: 1 }));
    fetchAssignments(params);
  };

  // 重置搜索
  const handleReset = () => {
    searchForm.resetFields();
    setSearchParams({});
    setPagination(prev => ({ ...prev, current: 1 }));
    fetchAssignments();
  };

  // 表格列定义
  const columns = [
    {
      title: '分配日期',
      dataIndex: 'assignmentDate',
      key: 'assignmentDate',
      width: 120,
      render: (date) => dayjs(date).format('YYYY-MM-DD')
    },
    {
      title: '目的地',
      dataIndex: 'destination',
      key: 'destination',
      width: 120,
      ellipsis: true
    },
    {
      title: '导游信息',
      key: 'guide',
      width: 150,
      render: (_, record) => (
        <div>
          <div><UserOutlined /> {record.guide?.guideName}</div>
          <div style={{ fontSize: '12px', color: '#666' }}>
            {record.guide?.phone}
          </div>
        </div>
      )
    },
    {
      title: '车辆信息',
      key: 'vehicle',
      width: 150,
      render: (_, record) => (
        <div>
          <div><CarOutlined /> {record.vehicle?.licensePlate}</div>
          <div style={{ fontSize: '12px', color: '#666' }}>
            {record.vehicle?.vehicleType} ({record.vehicle?.seatCount}座)
          </div>
        </div>
      )
    },
    {
      title: '人数',
      key: 'people',
      width: 100,
      render: (_, record) => (
        <div>
          <div>总计: {record.totalPeople}</div>
          <div style={{ fontSize: '12px', color: '#666' }}>
            成人: {record.adultCount} | 儿童: {record.childCount}
          </div>
        </div>
      )
    },
    {
      title: '联系信息',
      key: 'contact',
      width: 120,
      render: (_, record) => (
        <div>
          <div>{record.contactPerson}</div>
          <div style={{ fontSize: '12px', color: '#666' }}>
            {record.contactPhone}
          </div>
        </div>
      )
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status) => {
        const statusConfig = {
          confirmed: { color: 'green', text: '已确认' },
          in_progress: { color: 'blue', text: '进行中' },
          completed: { color: 'purple', text: '已完成' },
          cancelled: { color: 'red', text: '已取消' }
        };
        const config = statusConfig[status] || { color: 'default', text: status };
        return <Tag color={config.color}>{config.text}</Tag>;
      }
    },
    {
      title: '操作',
      key: 'actions',
      width: 200,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="查看详情">
            <Button 
              type="link" 
              icon={<EyeOutlined />} 
              onClick={() => handleViewDetail(record)}
            />
          </Tooltip>
          {record.status !== 'cancelled' && record.status !== 'completed' && (
            <Tooltip title="编辑">
              <Button 
                type="link" 
                icon={<EditOutlined />} 
                onClick={() => handleEdit(record)}
              />
            </Tooltip>
          )}
          {record.status === 'confirmed' && (
            <Tooltip title="取消分配">
              <Popconfirm
                title="确定要取消这个分配吗？"
                onConfirm={() => handleCancel(record.id)}
                okText="确定"
                cancelText="取消"
              >
                <Button type="link" icon={<StopOutlined />} danger />
              </Popconfirm>
            </Tooltip>
          )}
          <Tooltip title="删除">
            <Popconfirm
              title="确定要删除这个分配记录吗？"
              onConfirm={() => handleDelete(record.id)}
              okText="确定"
              cancelText="取消"
            >
              <Button type="link" icon={<DeleteOutlined />} danger />
            </Popconfirm>
          </Tooltip>
        </Space>
      )
    }
  ];

  // 查看详情
  const handleViewDetail = (record) => {
    setCurrentRecord(record);
    setDetailModalVisible(true);
  };

  // 编辑
  const handleEdit = (record) => {
    setCurrentRecord(record);
    setEditModalVisible(true);
  };

  // 取消分配
  const handleCancel = async (id) => {
    try {
      const response = await tourAssignmentAPI.cancelAssignment(id);
      if (response.code === 1) {
        message.success('取消成功');
        fetchAssignments();
        fetchTodayStatistics();
      } else {
        message.error(response.msg || '取消失败');
      }
    } catch (error) {
      message.error('取消失败');
    }
  };

  // 删除
  const handleDelete = async (id) => {
    try {
      const response = await tourAssignmentAPI.deleteAssignment(id);
      if (response.code === 1) {
        message.success('删除成功');
        fetchAssignments();
        fetchTodayStatistics();
      } else {
        message.error(response.msg || '删除失败');
      }
    } catch (error) {
      message.error('删除失败');
    }
  };

  // 创建成功回调
  const handleCreateSuccess = () => {
    setCreateModalVisible(false);
    fetchAssignments();
    fetchTodayStatistics();
    message.success('创建成功');
  };

  // 编辑成功回调
  const handleEditSuccess = () => {
    setEditModalVisible(false);
    setCurrentRecord(null);
    fetchAssignments();
    fetchTodayStatistics();
    message.success('更新成功');
  };

  // 导出
  const handleExport = async () => {
    try {
      const response = await tourAssignmentAPI.exportAssignments(searchParams);
      if (response.code === 1) {
        // 这里可以处理导出逻辑，比如下载文件
        message.success('导出成功');
      } else {
        message.error(response.msg || '导出失败');
      }
    } catch (error) {
      message.error('导出失败');
    }
  };

  // 表格变化处理
  const handleTableChange = (newPagination) => {
    setPagination(newPagination);
  };

  // 管理界面内容
  const ManagementContent = () => (
    <>
      {/* 统计卡片 */}
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="今日分配"
              value={statistics.totalAssignments || 0}
              prefix={<CalendarOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="导游数量"
              value={statistics.totalGuides || 0}
              prefix={<UserOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="车辆数量"
              value={statistics.totalVehicles || 0}
              prefix={<CarOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="游客总数"
              value={statistics.totalPeople || 0}
              prefix={<EnvironmentOutlined />}
            />
          </Card>
        </Col>
      </Row>

      {/* 搜索区域 */}
      <Card className="search-card" style={{ marginBottom: 16 }}>
        <Form
          form={searchForm}
          layout="inline"
          onFinish={handleSearch}
          className="search-form"
        >
          <Form.Item name="dateRange" label="分配日期">
            <RangePicker />
          </Form.Item>
          <Form.Item name="destination" label="目的地">
            <Input placeholder="请输入目的地" />
          </Form.Item>
          <Form.Item name="guideName" label="导游姓名">
            <Input placeholder="请输入导游姓名" />
          </Form.Item>
          <Form.Item name="licensePlate" label="车牌号">
            <Input placeholder="请输入车牌号" />
          </Form.Item>
          <Form.Item name="status" label="状态">
            <Select placeholder="请选择状态" allowClear>
              <Option value="confirmed">已确认</Option>
              <Option value="in_progress">进行中</Option>
              <Option value="completed">已完成</Option>
              <Option value="cancelled">已取消</Option>
            </Select>
          </Form.Item>
          <Form.Item>
            <Space>
              <Button 
                type="primary" 
                htmlType="submit" 
                icon={<SearchOutlined />}
              >
                搜索
              </Button>
              <Button onClick={handleReset}>重置</Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>

      {/* 主表格 */}
      <Card>
        <div className="table-header">
          <Space>
            <Button 
              type="primary" 
              icon={<PlusOutlined />}
              onClick={() => setCreateModalVisible(true)}
            >
              新建分配
            </Button>
            <Button 
              icon={<ExportOutlined />}
              onClick={handleExport}
            >
              导出
            </Button>
          </Space>
        </div>

        <Table
          columns={columns}
          dataSource={assignments}
          loading={loading}
          pagination={{
            ...pagination,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条/共 ${total} 条`
          }}
          onChange={handleTableChange}
          rowKey="id"
          scroll={{ x: 1400 }}
        />
      </Card>
    </>
  );

  return (
    <div className="tour-assignment-page">
      <Card>
        <Tabs activeKey={activeTab} onChange={setActiveTab}>
          <TabPane 
            tab={
              <span>
                <SettingOutlined />
                分配管理
              </span>
            } 
            key="management"
          >
            <ManagementContent />
          </TabPane>
          <TabPane 
            tab={
              <span>
                <TableOutlined />
                分配表格
              </span>
            } 
            key="table"
          >
            <AssignmentTable />
          </TabPane>
        </Tabs>
      </Card>

      {/* 创建分配模态框 */}
      <Modal
        title="新建分配"
        open={createModalVisible}
        onCancel={() => setCreateModalVisible(false)}
        footer={null}
        width={800}
      >
        <AssignmentForm 
          onSuccess={handleCreateSuccess}
          onCancel={() => setCreateModalVisible(false)}
        />
      </Modal>

      {/* 编辑分配模态框 */}
      <Modal
        title="编辑分配"
        open={editModalVisible}
        onCancel={() => {
          setEditModalVisible(false);
          setCurrentRecord(null);
        }}
        footer={null}
        width={800}
      >
        <AssignmentForm 
          initialValues={currentRecord}
          onSuccess={handleEditSuccess}
          onCancel={() => {
            setEditModalVisible(false);
            setCurrentRecord(null);
          }}
        />
      </Modal>

      {/* 详情查看模态框 */}
      <Modal
        title="分配详情"
        open={detailModalVisible}
        onCancel={() => {
          setDetailModalVisible(false);
          setCurrentRecord(null);
        }}
        footer={[
          <Button key="close" onClick={() => {
            setDetailModalVisible(false);
            setCurrentRecord(null);
          }}>
            关闭
          </Button>
        ]}
        width={1000}
      >
        <AssignmentDetail assignment={currentRecord} />
      </Modal>
    </div>
  );
};

export default TourAssignment; 