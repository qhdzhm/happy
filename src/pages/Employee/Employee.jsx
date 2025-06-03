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
  Popconfirm, 
  Row, 
  Col, 
  Tooltip,
  Divider,
  Badge,
  Modal,
  Form,
  Radio,
  Alert
} from "antd";
import { 
  PlusOutlined, 
  SearchOutlined, 
  EditOutlined, 
  DeleteOutlined, 
  CheckCircleOutlined, 
  CloseCircleOutlined,
  UserOutlined,
  TeamOutlined,
  EnvironmentOutlined,
  PhoneOutlined,
  IdcardOutlined,
  ReloadOutlined,
  InfoCircleOutlined,
  CalendarOutlined
} from "@ant-design/icons";
import { enableOrDisableEmp, getEmpList, getEmpById, getEmployeesByPage, deleteEmployee } from "@/apis/Employee";
import { getGuideByEmployeeId } from "@/api/guide";
import { useNavigate } from "react-router-dom";
import GuideAvailabilityModal from "@/components/AvailabilityManagement/GuideAvailabilityModal";
import "./Employee.scss";

const { Option } = Select;

const Employee = () => {
  // 角色选项
  const roleOptions = [
    { label: "导游", value: 0, icon: <EnvironmentOutlined /> },
    { label: "操作员", value: 1, icon: <UserOutlined /> },
    { label: "管理员", value: 2, icon: <TeamOutlined /> },
  ];

  // 员工列表数据
  const [empList, setEmpList] = useState({
    records: [],
    total: 0,
  });

  // 查询参数
  const [params, setParams] = useState({
    name: "",
    role: null,
    page: 1,
    pageSize: 10,
  });

  // 加载状态
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // 新增的员工列表数据
  const [employees, setEmployees] = useState([]);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });

  // 新增的查询参数
  const [queryParams, setQueryParams] = useState({
    username: "",
    name: "",
    phone: "",
    roleId: null,
    page: 1,
    pageSize: 10,
  });

  // 导游可用性管理相关状态
  const [availabilityModalVisible, setAvailabilityModalVisible] = useState(false);
  const [currentGuide, setCurrentGuide] = useState(null);

  // 导游信息缓存
  const [guideInfoCache, setGuideInfoCache] = useState({});

  useEffect(() => {
    fetchEmpList();
  }, [params.page, params.pageSize]);

  // 获取导游信息
  const fetchGuideInfo = async (employeeId) => {
    if (guideInfoCache[employeeId]) {
      return guideInfoCache[employeeId];
    }

    try {
      const response = await getGuideByEmployeeId(employeeId);
      if (response.code === 1 && response.data) {
        const guideInfo = response.data;
        setGuideInfoCache(prev => ({
          ...prev,
          [employeeId]: guideInfo
        }));
        return guideInfo;
      }
    } catch (error) {
      console.error('获取导游信息失败:', error);
    }
    return null;
  };

  // 显示导游可用性管理对话框
  const showAvailabilityModal = async (record) => {
    try {
      // 设置当前导游信息
      setCurrentGuide({
        id: record.id,
        name: record.name,
        role: record.role
      });
      setAvailabilityModalVisible(true);
    } catch (error) {
      console.error('打开可用性管理失败:', error);
      message.error('打开可用性管理失败');
    }
  };

  const fetchEmpList = async () => {
    setLoading(true);
    try {
      const res = await getEmployeesByPage(params);
      console.log('获取员工列表结果:', res);
      
      if (res.code === 1) {
        const records = res.data?.records || [];
        
        // 为导游角色的员工获取导游信息
        const employeesWithGuideInfo = await Promise.all(
          records.map(async (employee) => {
            if (employee.role === 0) { // 导游角色
              const guideInfo = await fetchGuideInfo(employee.id);
              console.log(`员工${employee.id}的导游信息:`, guideInfo);
              return {
                ...employee,
                guideInfo: guideInfo,
                workStatus: guideInfo?.status || 0 // 使用导游表的status字段
              };
            }
            return employee;
          })
        );

        setEmployees(employeesWithGuideInfo);
        setPagination({
          current: params.page,
          pageSize: params.pageSize,
          total: res.data?.total || 0,
        });
      } else {
        message.error(res.msg || "获取员工列表失败");
      }
    } catch (err) {
      console.error("获取员工列表失败", err);
      message.error("获取员工列表失败");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (values) => {
    const newParams = {
      ...params,
      ...values,
      page: 1,
    };
    setParams(newParams);
  };

  const handleReset = () => {
    const resetParams = {
      name: "",
      role: null,
      page: 1,
      pageSize: 10,
    };
    setParams(resetParams);
    setQueryParams({
      username: "",
      name: "",
      phone: "",
      roleId: null,
      page: 1,
      pageSize: 10,
    });
  };

  const handleTableChange = (pagination) => {
    setParams({
      ...params,
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

  const getRoleTag = (role) => {
    const option = roleOptions.find(opt => opt.value === role);
    return (
      <Tag color={role === 0 ? 'blue' : role === 1 ? 'green' : 'orange'}>
        {option?.icon} {option?.label || '未知'}
      </Tag>
    );
  };

  // 获取工作状态显示
  const getWorkStatusDisplay = (record) => {
    if (record.role !== 0) {
      return <span style={{ color: '#999' }}>-</span>;
    }

    const workStatus = record.workStatus;
    if (workStatus === undefined || workStatus === null) {
      return <Badge status="default" text="未知" />;
    }

    return (
      <Badge
        status={workStatus === 1 ? "success" : "error"}
        text={workStatus === 1 ? "可用" : "不可用"}
      />
    );
  };

  // 表格列定义
  const columns = [
    {
      title: "员工ID",
      dataIndex: "id",
      key: "id",
      width: 80,
    },
    {
      title: "姓名",
      dataIndex: "name",
      key: "name",
      render: (text, record) => (
        <div className="employee-name">
          <span className="employee-name-text">{text}</span>
          {record.role === 0 && <Badge color="blue" />}
        </div>
      ),
    },
    {
      title: "用户名",
      dataIndex: "username",
      key: "username",
      render: (text) => (
        <span>
          <UserOutlined style={{ marginRight: 8 }} />
          {text}
        </span>
      ),
    },
    {
      title: "手机号",
      dataIndex: "phone",
      key: "phone",
      render: (text) => (
        <span>
          <PhoneOutlined style={{ marginRight: 8 }} />
          {text}
        </span>
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
      render: (_, record) => getWorkStatusDisplay(record),
    },
    {
      title: "操作",
      key: "action",
      width: 150,
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="编辑">
            <Button
              type="primary"
              icon={<EditOutlined />}
              size="small"
              onClick={() => handleAddEdit(record.id)}
            />
          </Tooltip>
          {record.role === 0 && (
            <Tooltip title="管理可用性">
              <Button
                type="primary"
                icon={<CalendarOutlined />}
                size="small"
                onClick={() => showAvailabilityModal(record)}
                style={{ backgroundColor: '#52c41a', borderColor: '#52c41a' }}
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
      </Card>

      {/* 导游可用性管理对话框 */}
      <GuideAvailabilityModal
        visible={availabilityModalVisible}
        onCancel={() => setAvailabilityModalVisible(false)}
        guide={currentGuide}
      />
    </div>
  );
};

export default Employee;