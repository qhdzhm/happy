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
  CarOutlined,
  ReloadOutlined,
  InfoCircleOutlined
} from "@ant-design/icons";
import { enableOrDisableEmp, getEmpList, getEmpById, getEmployeesByPage, deleteEmployee, assignVehicleToEmployee, removeVehicleFromEmployee, getEmployeeAssignedVehicle } from "@/apis/Employee";
import { getVehiclesByPage, getAvailableVehicles, getVehicleList, getVehicleById } from "@/apis/vehicle";
import { useNavigate } from "react-router-dom";
import "./Employee.scss";

const { Option } = Select;

const Employee = () => {
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

  // 状态选项
  const statusOptions = [
    { label: "已启用", value: 1, color: "success" },
    { label: "已禁用", value: 0, color: "error" },
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
    status: null,
    licensePlate: null,
    workStatus: null,
    page: 1,
    pageSize: 10,
  });

  // 车辆列表数据
  const [vehicleList, setVehicleList] = useState([]);
  // 加载状态
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // 车辆分配相关状态
  const [availableVehicles, setAvailableVehicles] = useState([]);
  const [assignModalVisible, setAssignModalVisible] = useState(false);
  const [assignForm] = Form.useForm();
  const [assignLoading, setAssignLoading] = useState(false);
  const [currentEmployee, setCurrentEmployee] = useState(null);
  const [currentAssignedVehicle, setCurrentAssignedVehicle] = useState(null);
  const [vehicles, setVehicles] = useState([]);
  const [vehicleForm] = Form.useForm();

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

  useEffect(() => {
    fetchVehicleList();
    fetchEmpList();
  }, [params.page, params.pageSize]);

  // 获取可分配的车辆列表
  const fetchAvailableVehicles = async () => {
    try {
      const res = await getVehicleList();
      console.log('获取到的可用车辆列表:', res);
      if (res.code === 1) {
        // 过滤出可用的车辆
        const availableVehicleList = res.data || [];
        console.log('可用车辆列表:', availableVehicleList);
        setAvailableVehicles(availableVehicleList);
      } else {
        message.error(res.msg || "获取可分配车辆列表失败");
      }
    } catch (err) {
      console.error("获取可分配车辆失败", err);
      message.error("获取可分配车辆列表失败");
    }
  };

  // 获取员工当前分配的车辆
  const fetchEmployeeAssignedVehicle = async (employeeId) => {
    try {
      const res = await getEmployeeAssignedVehicle(employeeId);
      console.log('获取员工分配车辆结果:', res);
      
      if (res.code === 1 && res.data) {
        // 后端可能直接返回单个车辆对象或车辆数组
        let vehicle = null;
        
        if (Array.isArray(res.data)) {
          if (res.data.length > 0) {
            vehicle = res.data[0]; // 获取第一个分配的车辆
          }
        } else {
          // 后端直接返回了车辆对象
          vehicle = res.data;
        }
        
        if (vehicle) {
          // 获取车辆的最新状态
          try {
            const vehicleRes = await getVehicleById(vehicle.vehicleId);
            if (vehicleRes.code === 1 && vehicleRes.data) {
              // 更新车辆状态
              vehicle.status = vehicleRes.data.status;
            }
          } catch (error) {
            console.error("获取车辆状态失败", error);
          }
          
          setCurrentAssignedVehicle(vehicle);
          return vehicle;
        }
      }
      
      // 没有分配车辆
      setCurrentAssignedVehicle(null);
      return null;
    } catch (err) {
      console.error("获取员工分配车辆失败", err);
      message.error("获取员工当前分配的车辆信息失败");
      setCurrentAssignedVehicle(null);
      return null;
    }
  };

  // 打开分配车辆对话框
  const showAssignModal = async (record) => {
    setCurrentEmployee(record);
    await fetchAvailableVehicles();
    const vehicle = await fetchEmployeeAssignedVehicle(record.id);
    
    assignForm.resetFields();
    if (vehicle) {
      assignForm.setFieldsValue({
        vehicleId: vehicle.vehicleId,
        isPrimary: vehicle.drivers?.some(d => d.id === record.id && d.isPrimary === 1) ? 1 : 0
      });
    }
    
    setAssignModalVisible(true);
  };

  // 取消分配车辆
  const handleUnassignVehicle = async (record) => {
    try {
      setLoading(true);
      // 获取员工当前分配的车辆
      const vehicle = await fetchEmployeeAssignedVehicle(record.id);
      
      if (!vehicle) {
        message.warning("该员工未分配车辆");
        setLoading(false);
        return;
      }
      
      const res = await removeVehicleFromEmployee({
        employeeId: record.id,
        vehicleId: vehicle.vehicleId
      });
      
      if (res.code === 1) {
        message.success("取消分配成功");
        fetchEmpList(); // 刷新列表
      } else {
        message.error(res.msg || "取消分配失败");
      }
    } catch (err) {
      console.error("取消分配失败", err);
      message.error("取消分配失败");
    } finally {
      setLoading(false);
    }
  };

  // 处理车辆分配
  const handleVehicleAllocation = async (values) => {
    if (!currentEmployee) return;
    
    setAssignLoading(true);
    try {
      console.log('提交分配车辆表单数据:', values);
      
      const params = {
        employeeId: currentEmployee.id,
        vehicleId: values.vehicleId,
        isPrimary: values.isPrimary ? 1 : 0
      };
      
      const res = await assignVehicleToEmployee(params);
      if (res.code === 1) {
        message.success("车辆分配成功");
        setAssignModalVisible(false);
        fetchEmpList(); // 刷新列表
      } else {
        message.error(res.msg || "车辆分配失败");
      }
    } catch (err) {
      console.error("车辆分配失败", err);
      message.error("车辆分配失败");
    } finally {
      setAssignLoading(false);
    }
  };

  // 格式化车辆已分配情况显示
  const formatVehicleOption = (vehicle) => {
    return `${vehicle.licensePlate} (${vehicle.vehicleType}) - ${vehicle.currentDriverCount}/${vehicle.maxDrivers}${vehicle.isFull ? ' [已满]' : ''}`;
  };

  // 获取车辆列表
  const fetchVehicleList = async () => {
    try {
      const res = await getVehiclesByPage({ page: 1, pageSize: 1000 });
      if (res.code === 1) {
        setVehicleList(res.data.records || []);
      }
    } catch (error) {
      console.error("获取车辆列表失败:", error);
    }
  };

  // 获取员工列表
  const fetchEmpList = async () => {
    setLoading(true);
    try {
      const res = await getEmployeesByPage(queryParams);
      console.log('获取到的员工列表数据:', res);
      
      if (res.code === 1 && res.data) {
        // 根据返回数据结构的不同进行适配
        if (res.data.records && Array.isArray(res.data.records)) {
          // 标准分页数据结构
          console.log('标准分页数据结构 - 员工记录:', res.data.records);
          console.log('标准分页数据结构 - 员工总数:', res.data.total);
          setEmpList(res.data);
          setEmployees(res.data.records);
          setPagination({
            current: queryParams.page,
            pageSize: queryParams.pageSize,
            total: res.data.total,
          });
        } else if (Array.isArray(res.data)) {
          // 数组形式返回，没有分页信息
          console.log('数组形式数据 - 员工记录:', res.data);
          setEmpList({
            records: res.data,
            total: res.data.length
          });
          setEmployees(res.data);
          setPagination({
            current: queryParams.page,
            pageSize: queryParams.pageSize,
            total: res.data.length,
          });
        } else {
          // 其他格式，尝试转换
          console.log('其他数据结构:', res.data);
          const records = res.data.content || res.data.list || [];
          const total = res.data.totalElements || res.data.total || records.length;
          console.log('转换后 - 员工记录:', records);
          console.log('转换后 - 员工总数:', total);
          setEmpList({
            records,
            total
          });
          setEmployees(res.data.records);
          setPagination({
            current: queryParams.page,
            pageSize: queryParams.pageSize,
            total: res.data.total,
          });
        }
      } else {
        message.error(res.msg || '获取员工列表失败');
      }
    } catch (error) {
      console.error("获取员工列表失败:", error);
      message.error("获取员工列表失败");
    } finally {
      setLoading(false);
    }
  };

  // 获取可用车辆列表
  const fetchVehicles = async () => {
    try {
      const res = await getVehicleList();
      if (res.code === 1) {
        setVehicles(res.data || []);
      } else {
        message.error(res.msg || "获取车辆列表失败");
      }
    } catch (err) {
      console.error("获取车辆列表失败", err);
      message.error("获取车辆列表失败");
    }
  };

  // 搜索处理
  const handleSearch = (values) => {
    setQueryParams({
      ...queryParams,
      ...values,
      page: 1,
    });
    fetchEmpList();
  };

  // 重置搜索条件
  const handleReset = () => {
    setQueryParams({
      username: "",
      name: "",
      phone: "",
      roleId: null,
      page: 1,
      pageSize: 10,
    });
    fetchEmpList();
  };

  // 分页变化
  const handleTableChange = (pagination) => {
    setParams({
      ...params,
      page: pagination.current,
      pageSize: pagination.pageSize,
    });
  };

  // 启用/禁用员工
  const handleStatusChange = async (id, status) => {
    // 处理status为null的情况
    const currentStatus = status === 1 ? 1 : 0;
    
    try {
      // 使用更新后的API函数名
      const res = await enableOrDisableEmp({
        id,
        status: currentStatus === 1 ? 0 : 1
      });
      
      if (res.code === 1) {
        message.success(`${currentStatus === 1 ? '禁用' : '启用'}成功`);
        fetchEmpList(); // 刷新列表
      } else {
        message.error(res.msg || `${currentStatus === 1 ? '禁用' : '启用'}失败`);
      }
    } catch (error) {
      console.error(`${currentStatus === 1 ? '禁用' : '启用'}失败:`, error);
      message.error(`${currentStatus === 1 ? '禁用' : '启用'}失败`);
    }
  };

  // 添加/编辑员工
  const handleAddEdit = (id) => {
    navigate(id ? `/employee/edit/${id}` : "/employee/add");
  };

  // 获取工作状态标签
  const getWorkStatusTag = (status) => {
    const option = workStatusOptions.find(item => item.value === status);
    return option ? <Tag color={option.color}>{option.label}</Tag> : null;
  };

  // 获取角色标签
  const getRoleTag = (role) => {
    const option = roleOptions.find(item => item.value === role);
    return option ? (
      <Tag icon={option.icon} color="blue">
        {option.label}
      </Tag>
    ) : null;
  };

  // 获取分配的车辆信息
  const getVehicleInfo = (record) => {
    if (!record.assignedVehicle) return <Tag color="default">未分配</Tag>;
    
    const vehicle = record.assignedVehicle;
    console.log('获取车辆信息用于显示:', vehicle);
    
    // 确保状态值存在
    let vehicleStatus = vehicle.status;
    if (vehicleStatus === null || vehicleStatus === undefined) {
      vehicleStatus = 2; // 默认为"已占用"
    }
    
    const tooltipContent = (
      <div>
        <p>{vehicle.vehicleType} - {vehicle.seatCount}座</p>
        <p>驾驶员分配: {vehicle.allocation || '已分配'}</p>
        <p>状态: {getVehicleStatusText(vehicleStatus)}</p>
      </div>
    );
    
    return (
      <Tooltip title={tooltipContent}>
        <Tag icon={<CarOutlined />} color="blue" className="vehicle-tag">
          {vehicle.licensePlate} {vehicle.allocation && `(${vehicle.allocation})`}
        </Tag>
      </Tooltip>
    );
  };

  // 打开车辆分配对话框
  const showVehicleModal = async (record) => {
    setCurrentEmployee(record);
    setAssignLoading(true);
    
    try {
      // 获取可用车辆列表
      await fetchAvailableVehicles();
      
      // 获取员工当前分配的车辆
      const vehicle = await fetchEmployeeAssignedVehicle(record.id);
      
      // 重置表单
      assignForm.resetFields();
      
      // 如果员工已分配车辆，设置表单默认值
      if (vehicle) {
        console.log('员工已分配车辆:', vehicle);
        assignForm.setFieldsValue({
          vehicleId: vehicle.vehicleId,
          isPrimary: vehicle.isPrimary === 1 ? 1 : 0
        });
      }
      
      // 显示对话框
      setAssignModalVisible(true);
    } catch (error) {
      console.error('打开车辆分配对话框失败:', error);
      message.error('获取车辆信息失败');
    } finally {
      setAssignLoading(false);
    }
  };
  
  // 取消车辆分配
  const handleVehicleDeallocation = async (employeeId) => {
    try {
      // 获取员工当前分配的车辆
      const vehicle = await fetchEmployeeAssignedVehicle(employeeId);
      
      if (!vehicle) {
        message.warning("该员工未分配车辆");
        return;
      }
      
      const res = await removeVehicleFromEmployee({
        employeeId: employeeId,
        vehicleId: vehicle.vehicleId
      });
      console.log();
      
      if (res.code === 1) {
        message.success("取消分配成功");
        fetchEmpList(); // 刷新列表
      } else {
        message.error(res.msg || "取消分配失败");
      }
    } catch (err) {
      console.error("取消分配失败", err);
      message.error("取消分配失败");
    }
  };

  // 添加获取车辆状态文本的函数
  const getVehicleStatusText = (status) => {
    console.log('车辆状态值:', status);
    const statusMap = {
      0: '送修中',
      1: '可用',
      2: '已占用',
      3: '已满',
      4: '注册过期',
      5: '车检过期',
      'FULL': '已满'
    };
    return statusMap[status] || '未知';
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
      render: (status) => getWorkStatusTag(status),
    },
    {
      title: "分配车辆",
      dataIndex: "assignedVehicle",
      key: "assignedVehicle",
      render: (_, record) => getVehicleInfo(record),
    },
    {
      title: "状态",
      dataIndex: "status",
      key: "status",
      render: (status) => (
        <Badge
          status={(status === 1) ? "success" : "error"}
          text={(status === 1) ? "已启用" : "已禁用"}
        />
      ),
    },
    {
      title: "操作",
      key: "action",
      width: 240,
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
          <Tooltip title="分配车辆">
            <Button
              type="primary"
              icon={<CarOutlined />}
              size="small"
              onClick={() => showVehicleModal(record)}
            />
          </Tooltip>
          {record.assignedVehicle && (
            <Tooltip title="取消车辆分配">
              <Popconfirm
                title="确定要取消此员工的车辆分配吗？"
                onConfirm={() => handleVehicleDeallocation(record.id)}
                okText="确定"
                cancelText="取消"
              >
                <Button
                  type="primary"
                  danger
                  icon={<CloseCircleOutlined />}
                  size="small"
                />
              </Popconfirm>
            </Tooltip>
          )}
          <Tooltip title={(record.status === 1) ? "禁用" : "启用"}>
            <Popconfirm
              title={`确定要${(record.status === 1) ? "禁用" : "启用"}此员工吗？`}
              onConfirm={() => handleStatusChange(record.id, record.status)}
              okText="确定"
              cancelText="取消"
            >
              <Button
                type={(record.status === 1) ? "default" : "primary"}
                icon={(record.status === 1) ? <CloseCircleOutlined /> : <CheckCircleOutlined />}
                size="small"
                danger={(record.status === 1)}
              />
            </Popconfirm>
          </Tooltip>
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

      {/* 分配车辆对话框 */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <CarOutlined style={{ color: '#1890ff', marginRight: '8px' }} />
            <span>分配车辆</span>
          </div>
        }
        open={assignModalVisible}
        onOk={() => {
          assignForm.validateFields().then(values => {
            handleVehicleAllocation(values);
          }).catch(info => {
            console.log('验证失败:', info);
          });
        }}
        onCancel={() => setAssignModalVisible(false)}
        confirmLoading={assignLoading}
        okText="确定"
        cancelText="取消"
        width={280}
        destroyOnClose
        centered
        className="assign-vehicle-modal"
      >
        <Form
          form={assignForm}
          layout="vertical"
          initialValues={{ isPrimary: 0 }}
          size="small"
          style={{ padding: '0 0 8px 0' }}
        >
          <Form.Item
            name="vehicleId"
            label={<span><span style={{ color: '#ff4d4f' }}>*</span> 选择车辆</span>}
            rules={[{ required: true, message: "请选择车辆" }]}
            style={{ marginBottom: '12px' }}
          >
            <Select
              placeholder="请选择车辆"
              showSearch
              optionFilterProp="label"
              suffixIcon={<CarOutlined />}
              style={{ width: '100%' }}
            >
              {availableVehicles.map(vehicle => (
                <Option 
                  key={vehicle.vehicleId} 
                  value={vehicle.vehicleId}
                  label={vehicle.licensePlate}
                >
                  <CarOutlined style={{ marginRight: '5px', color: '#1890ff' }} />
                  {vehicle.licensePlate}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item 
            name="isPrimary" 
            label="是否主驾驶"
            style={{ marginBottom: '0' }}
          >
            <Radio.Group style={{ width: '100%' }}>
              <div style={{ display: 'flex', gap: '40px' }}>
                <Radio value={1}>是</Radio>
                <Radio value={0}>否</Radio>
              </div>
            </Radio.Group>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Employee;