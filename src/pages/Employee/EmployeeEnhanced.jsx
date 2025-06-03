import React, { useEffect, useState } from "react";
import { 
  Button, 
  Table, 
  Tag, 
  message, 
  Select, 
  Card, 
  Space, 
  Input, 
  Row, 
  Col, 
  Tooltip,
  Divider,
  Alert,
  Tabs
} from "antd";
import { 
  PlusOutlined, 
  SearchOutlined, 
  EditOutlined, 
  UserOutlined,
  TeamOutlined,
  EnvironmentOutlined,
  PhoneOutlined,
  IdcardOutlined,
  ReloadOutlined,
  CalendarOutlined
} from "@ant-design/icons";
import { getEmployeesByPage } from "@/apis/Employee";
import { useNavigate } from "react-router-dom";
import GuideAvailabilityManagement from "@/components/GuideAvailabilityManagement";
import "./Employee.scss";

const { Option } = Select;

const EmployeeEnhanced = () => {
  // 工作状态选项
  const workStatusOptions = [
    { label: "空闲", value: 0, color: "green" },
    { label: "忙碌", value: 1, color: "orange" },
    { label: "休假", value: 2, color: "blue" },
    { label: "出团", value: 3, color: "purple" },
    { label: "待命", value: 4, color: "cyan" },
  ];

  // 角色选项
  const roleOptions = [
    { label: "导游", value: 0, icon: <EnvironmentOutlined /> },
    { label: "操作员", value: 1, icon: <UserOutlined /> },
    { label: "管理员", value: 2, icon: <TeamOutlined /> },
  ];

  // 员工列表数据
  const [employees, setEmployees] = useState([]);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });

  // 查询参数
  const [queryParams, setQueryParams] = useState({
    username: "",
    name: "",
    phone: "",
    roleId: null,
    page: 1,
    pageSize: 10,
  });

  // 加载状态
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // 标签页相关状态
  const [activeTab, setActiveTab] = useState('list');
  const [selectedEmployee, setSelectedEmployee] = useState(null);

  useEffect(() => {
    fetchEmpList();
  }, [queryParams.page, queryParams.pageSize]);

  const fetchEmpList = async () => {
    setLoading(true);
    try {
      const response = await getEmployeesByPage({
        page: queryParams.page,
        pageSize: queryParams.pageSize,
        username: queryParams.username || undefined,
        name: queryParams.name || undefined,
        phone: queryParams.phone || undefined,
        roleId: queryParams.roleId !== null ? queryParams.roleId : undefined,
      });

      if (response.code === 1) {
        const records = response.data.records || [];
        
        setEmployees(records);
        setPagination({
          current: queryParams.page,
          pageSize: queryParams.pageSize,
          total: response.data.total || 0,
        });
      } else {
        message.error(response.msg || "获取员工列表失败");
      }
    } catch (error) {
      console.error("获取员工列表错误:", error);
      message.error("获取员工列表失败");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (values) => {
    const newParams = {
      ...queryParams,
      ...values,
      page: 1,
    };
    setQueryParams(newParams);
  };

  const handleReset = () => {
    const resetParams = {
      username: "",
      name: "",
      phone: "",
      roleId: null,
      page: 1,
      pageSize: 10,
    };
    setQueryParams(resetParams);
  };

  const handleTableChange = (pagination) => {
    setQueryParams({
      ...queryParams,
      page: pagination.current,
      pageSize: pagination.pageSize,
    });
  };

  const handleAddEdit = (id) => {
    if (id) {
      navigate(`/employee/edit/${id}`);
    } else {
      navigate("/employee/add");
    }
  };

  // 管理导游可用性
  const handleManageAvailability = (record) => {
    setSelectedEmployee(record);
    setActiveTab('availability');
  };

  const getWorkStatusTag = (status) => {
    const option = workStatusOptions.find(opt => opt.value === status);
    return option ? <Tag color={option.color}>{option.label}</Tag> : <Tag>未知</Tag>;
  };

  const getRoleTag = (role) => {
    const option = roleOptions.find(opt => opt.value === role);
    if (!option) return <Tag>未知</Tag>;
    
    return (
      <Tag color="blue" icon={option.icon}>
        {option.label}
      </Tag>
    );
  };

  // 表格列定义
  const columns = [
    {
      title: "员工姓名",
      dataIndex: "name",
      key: "name",
      render: (text, record) => (
        <Space>
          <UserOutlined />
          <span style={{ fontWeight: 500 }}>{text}</span>
          {record.role === 0 && <Tag color="green">导游</Tag>}
        </Space>
      ),
    },
    {
      title: "用户名",
      dataIndex: "username",
      key: "username",
    },
    {
      title: "手机号",
      dataIndex: "phone",
      key: "phone",
      render: (text) => (
        <Space>
          <PhoneOutlined />
          {text}
        </Space>
      ),
    },
    {
      title: "性别",
      dataIndex: "sex",
      key: "sex",
      render: (sex) => (sex === "1" ? "男" : "女"),
    },
    {
      title: "身份证号",
      dataIndex: "idNumber",
      key: "idNumber",
      render: (text) => (
        <Space>
          <IdcardOutlined />
          {text ? `${text.slice(0, 6)}****${text.slice(-4)}` : '-'}
        </Space>
      ),
    },
    {
      title: "角色",
      dataIndex: "role",
      key: "role",
      render: (role) => getRoleTag(role),
    },
    {
      title: "工作状态",
      dataIndex: "workStatus",
      key: "workStatus",
      render: (status) => getWorkStatusTag(status),
    },
    {
      title: "操作",
      key: "action",
      width: 200,
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="编辑">
            <Button
              type="link"
              icon={<EditOutlined />}
              onClick={() => handleAddEdit(record.id)}
              size="small"
            />
          </Tooltip>
          
          {record.role === 0 && (
            <Tooltip title="管理可用性">
              <Button
                type="link"
                icon={<CalendarOutlined />}
                onClick={() => handleManageAvailability(record)}
                size="small"
              />
            </Tooltip>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div className="employee-container">
      <Card title="员工管理" className="employee-card">
        <Tabs 
          activeKey={activeTab} 
          onChange={setActiveTab}
          items={[
            {
              key: 'list',
              label: (
                <span>
                  <TeamOutlined />
                  员工列表
                </span>
              ),
              children: (
                <>
                  {/* 搜索区域 */}
                  <div className="search-container">
                    <Row gutter={[16, 16]} align="middle">
                      <Col xs={24} sm={12} md={6} lg={5}>
                        <Input
                          placeholder="员工姓名/用户名"
                          value={queryParams.username}
                          onChange={(e) => setQueryParams({ ...queryParams, username: e.target.value })}
                          prefix={<SearchOutlined />}
                          allowClear
                        />
                      </Col>
                      <Col xs={24} sm={12} md={6} lg={5}>
                        <Input
                          placeholder="员工姓名"
                          value={queryParams.name}
                          onChange={(e) => setQueryParams({ ...queryParams, name: e.target.value })}
                          prefix={<SearchOutlined />}
                          allowClear
                        />
                      </Col>
                      <Col xs={24} sm={12} md={6} lg={5}>
                        <Input
                          placeholder="手机号"
                          value={queryParams.phone}
                          onChange={(e) => setQueryParams({ ...queryParams, phone: e.target.value })}
                          prefix={<SearchOutlined />}
                          allowClear
                        />
                      </Col>
                      <Col xs={24} sm={12} md={6} lg={5}>
                        <Select
                          placeholder="选择角色"
                          value={queryParams.roleId}
                          onChange={(value) => setQueryParams({ ...queryParams, roleId: value })}
                          style={{ width: "100%" }}
                          allowClear
                        >
                          {roleOptions.map((option) => (
                            <Option key={option.value} value={option.value}>
                              {option.icon} {option.label}
                            </Option>
                          ))}
                        </Select>
                      </Col>
                      <Col xs={24} sm={24} md={24} lg={4}>
                        <Space>
                          <Button type="primary" onClick={() => handleSearch(queryParams)}>搜索</Button>
                          <Button onClick={handleReset}>重置</Button>
                        </Space>
                      </Col>
                    </Row>
                  </div>
                  
                  <Divider style={{ margin: '12px 0' }} />
                  
                  {/* 操作按钮区域 */}
                  <div className="operation-container">
                    <Button
                      type="primary"
                      icon={<PlusOutlined />}
                      onClick={() => handleAddEdit()}
                    >
                      添加员工
                    </Button>
                  </div>
                  
                  {/* 表格区域 */}
                  <Table
                    columns={columns}
                    dataSource={employees}
                    rowKey="id"
                    pagination={{
                      current: pagination.current,
                      pageSize: pagination.pageSize,
                      total: pagination.total,
                      showSizeChanger: true,
                      showQuickJumper: true,
                      showTotal: (total) => `共 ${total} 条记录`,
                    }}
                    loading={loading}
                    onChange={handleTableChange}
                    scroll={{ x: 1000 }}
                  />
                </>
              )
            },
            {
              key: 'availability',
              label: (
                <span>
                  <CalendarOutlined />
                  导游可用性管理
                </span>
              ),
              children: selectedEmployee ? (
                <GuideAvailabilityManagement 
                  guideId={selectedEmployee.id}
                  guideName={selectedEmployee.name}
                />
              ) : (
                <Alert
                  message="请先选择一个导游"
                  description="请在员工列表中选择一个导游，然后点击'管理可用性'按钮来管理该导游的可用性设置。"
                  type="info"
                  showIcon
                />
              )
            }
          ]}
        />
      </Card>
    </div>
  );
};

export default EmployeeEnhanced; 