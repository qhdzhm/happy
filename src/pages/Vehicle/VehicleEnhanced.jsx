import { getVehiclesByPage, deleteVehicle } from "@/apis/vehicle";
import { 
  PlusOutlined, 
  SearchOutlined, 
  ReloadOutlined, 
  CarOutlined,
  EditOutlined,
  DeleteOutlined,
  CalendarOutlined,
  SettingOutlined,
  TeamOutlined
} from "@ant-design/icons";
import {
  Button,
  Col,
  DatePicker,
  Form,
  Input,
  InputNumber,
  message,
  Row,
  Select,
  Table,
  Tag,
  Popconfirm,
  Card,
  Tooltip,
  Space,
  Tabs,
  Alert
} from "antd";
import dayjs from "dayjs";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import VehicleAvailabilityManagement from "@/components/VehicleAvailabilityManagement";
import "./Vehicle.scss";

const { Option } = Select;

// 定义初始查询参数
const initialQueryParams = {
  vehicleType: "", // 车辆类型
  licensePlate: "", // 车牌号
  status: null, // 状态
  driverName: "", // 驾驶员姓名
  location: "", // 车辆地址
  seatCount: null, // 座位数量
  regoExpiryDate: null, // 申请日期
  inspectionDueDate: null, // 检验到期日期
  page: 1, // 当前页码
  pageSize: 10, // 每页记录数
};

// 定义状态描述文本映射函数
const getStatusText = (status) => {
  switch (status) {
    case 0: return "送修中";
    case 1: return "可用";
    case 2: return "已占用";
    case 3: return "已满";
    case 4: return "注册过期";
    case 5: return "车检过期";
    default: return "未知";
  }
};

const VehicleEnhanced = () => {
  const navigate = useNavigate();
  const [vehicles, setVehicles] = useState([]); // 车辆列表数据
  const [loading, setLoading] = useState(false); // 加载状态
  const [queryParams, setQueryParams] = useState(initialQueryParams); // 查询参数
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const [form] = Form.useForm();

  // 标签页相关状态
  const [activeTab, setActiveTab] = useState('list');
  const [selectedVehicle, setSelectedVehicle] = useState(null);

  // 获取车辆列表
  const fetchVehicles = async () => {
    setLoading(true);
    try {
      const params = {
        ...queryParams,
        status: queryParams.status !== null ? Number(queryParams.status) : null, // 确保状态是数字类型
        regoExpiryDate: queryParams.regoExpiryDate
          ? dayjs(queryParams.regoExpiryDate).format("YYYY-MM-DD")
          : null,
        inspectionDueDate: queryParams.inspectionDueDate
          ? dayjs(queryParams.inspectionDueDate).format("YYYY-MM-DD")
          : null,
      };
      console.log("查询参数:", params); // 打印查询参数
      const response = await getVehiclesByPage(params);
      console.log("API Response:", response); // 打印 API 返回的数据
      
      if (response.code === 1) {
        // 确保response.data.records存在
        const records = response.data.records || [];
        setVehicles(records);
        setPagination({
          current: queryParams.page,
          pageSize: queryParams.pageSize,
          total: response.data.total || 0,
        });
      } else {
        message.error(response.msg || "获取车辆列表失败");
      }
    } catch (error) {
      console.error("获取车辆列表错误:", error);
      message.error("获取车辆列表失败");
    } finally {
      setLoading(false);
    }
  };

  // 初始化加载数据
  useEffect(() => {
    fetchVehicles();
  }, [queryParams]);

  // 分页变化
  const handlePageChange = (page, pageSize) => {
    setQueryParams({
      ...queryParams,
      page,
      pageSize,
    });
  };

  // 筛选条件变化
  const handleSearch = (values) => {
    const newParams = {
      ...initialQueryParams,
      ...values,
      page: 1,
      status: values.status !== undefined ? Number(values.status) : null, // 确保状态是数字类型
    };
    console.log("搜索参数:", newParams); // 打印搜索参数
    setQueryParams(newParams);
  };

  // 重置搜索条件
  const handleReset = () => {
    form.resetFields();
    setQueryParams(initialQueryParams);
    fetchVehicles();
  };

  // 单个字段重置
  const handleClearField = (fieldName) => {
    form.setFieldValue(fieldName, undefined);
    const values = form.getFieldsValue();
    values[fieldName] = undefined;
    handleSearch(values);
  };

  // 编辑车辆
  const handleEdit = (vehicleId) => {
    navigate(`/vehicle/edit/${vehicleId}`);
  };

  // 删除车辆
  const handleDelete = async (vehicleId) => {
    try {
      await deleteVehicle(vehicleId);
      message.success("删除成功");
      fetchVehicles(); // 刷新列表
    } catch (error) {
      message.error("删除失败");
    }
  };

  // 添加车辆
  const handleAddVehicle = () => {
    navigate("/vehicle/add");
  };

  // 管理车辆可用性
  const handleManageAvailability = (record) => {
    setSelectedVehicle(record);
    setActiveTab('availability');
  };

  // 表格列定义
  const columns = [
    {
      title: "车辆类型",
      dataIndex: "vehicleType",
      key: "vehicleType",
      render: (type) => (
        <Tag color="blue">
          <CarOutlined style={{ marginRight: 4 }} />
          {type}
        </Tag>
      ),
    },
    {
      title: "车牌号",
      dataIndex: "licensePlate",
      key: "licensePlate",
      render: (text) => <span style={{ fontWeight: 500 }}>{text}</span>,
    },
    {
      title: "车辆地址",
      dataIndex: "currentLocation",
      key: "currentLocation",
      ellipsis: true,
    },
    {
      title: "座位数",
      dataIndex: "seatCount",
      key: "seatCount",
      render: (count) => (
        <Tag color="green">{count}座</Tag>
      ),
    },
    {
      title: "状态",
      dataIndex: "status",
      key: "status",
      render: (status) => {
        const getStatusTag = (status) => {
          const statusConfig = {
            0: { color: "red", text: "送修中" },
            1: { color: "green", text: "可用" },
            2: { color: "orange", text: "已占用" },
            3: { color: "purple", text: "已满" },
            4: { color: "red", text: "注册过期" },
            5: { color: "red", text: "车检过期" },
          };
          const config = statusConfig[status] || { color: "default", text: "未知" };
          return <Tag color={config.color}>{config.text}</Tag>;
        };
        return getStatusTag(status);
      },
    },
    {
      title: "注册到期日",
      dataIndex: "regoExpiryDate",
      key: "regoExpiryDate",
      render: (date) => date ? dayjs(date).format("YYYY-MM-DD") : "-",
    },
    {
      title: "检验到期日",
      dataIndex: "inspectionDueDate",
      key: "inspectionDueDate",
      render: (date) => date ? dayjs(date).format("YYYY-MM-DD") : "-",
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
              onClick={() => handleEdit(record.vehicleId)}
              size="small"
            />
          </Tooltip>
          
          <Tooltip title="管理可用性">
            <Button
              type="link"
              icon={<CalendarOutlined />}
              onClick={() => handleManageAvailability(record)}
              size="small"
            />
          </Tooltip>
          
          <Tooltip title="删除">
            <Popconfirm
              title="确定要删除这辆车吗？"
              onConfirm={() => handleDelete(record.vehicleId)}
              okText="确定"
              cancelText="取消"
            >
              <Button
                type="link"
                danger
                icon={<DeleteOutlined />}
                size="small"
              />
            </Popconfirm>
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <div className="vehicle-container">
      <Card title="车辆管理" className="vehicle-card">
        <Tabs 
          activeKey={activeTab} 
          onChange={setActiveTab}
          items={[
            {
              key: 'list',
              label: (
                <span>
                  <CarOutlined />
                  车辆列表
                </span>
              ),
              children: (
                <>
                  {/* 搜索区域 */}
                  <Form
                    form={form}
                    layout="inline"
                    onFinish={handleSearch}
                    style={{ marginBottom: 16 }}
                  >
                    <Row gutter={[16, 16]} style={{ width: '100%' }}>
                      <Col xs={24} sm={12} md={8} lg={6}>
                        <Form.Item name="vehicleType" style={{ marginBottom: 0 }}>
                          <Input
                            placeholder="车辆类型"
                            prefix={<CarOutlined />}
                            allowClear
                          />
                        </Form.Item>
                      </Col>
                      <Col xs={24} sm={12} md={8} lg={6}>
                        <Form.Item name="licensePlate" style={{ marginBottom: 0 }}>
                          <Input
                            placeholder="车牌号"
                            prefix={<SearchOutlined />}
                            allowClear
                          />
                        </Form.Item>
                      </Col>
                      <Col xs={24} sm={12} md={8} lg={6}>
                        <Form.Item name="status" style={{ marginBottom: 0 }}>
                          <Select placeholder="选择状态" allowClear>
                            <Option value={0}>送修中</Option>
                            <Option value={1}>可用</Option>
                            <Option value={2}>已占用</Option>
                            <Option value={3}>已满</Option>
                            <Option value={4}>注册过期</Option>
                            <Option value={5}>车检过期</Option>
                          </Select>
                        </Form.Item>
                      </Col>
                      <Col xs={24} sm={12} md={8} lg={6}>
                        <Form.Item name="location" style={{ marginBottom: 0 }}>
                          <Input
                            placeholder="车辆地址"
                            allowClear
                          />
                        </Form.Item>
                      </Col>
                      <Col xs={24} sm={12} md={8} lg={6}>
                        <Form.Item name="seatCount" style={{ marginBottom: 0 }}>
                          <InputNumber
                            placeholder="座位数"
                            min={1}
                            max={100}
                            style={{ width: '100%' }}
                          />
                        </Form.Item>
                      </Col>
                      <Col xs={24} sm={12} md={8} lg={6}>
                        <Space>
                          <Button type="primary" htmlType="submit" icon={<SearchOutlined />}>
                            搜索
                          </Button>
                          <Button onClick={handleReset} icon={<ReloadOutlined />}>
                            重置
                          </Button>
                        </Space>
                      </Col>
                    </Row>
                  </Form>

                  {/* 操作按钮区域 */}
                  <div style={{ marginBottom: 16 }}>
                    <Button
                      type="primary"
                      icon={<PlusOutlined />}
                      onClick={handleAddVehicle}
                    >
                      添加车辆
                    </Button>
                  </div>

                  {/* 表格区域 */}
                  <Table
                    columns={columns}
                    dataSource={vehicles}
                    rowKey="vehicleId"
                    pagination={{
                      current: pagination.current,
                      pageSize: pagination.pageSize,
                      total: pagination.total,
                      showSizeChanger: true,
                      showQuickJumper: true,
                      showTotal: (total) => `共 ${total} 条记录`,
                      onChange: handlePageChange,
                    }}
                    loading={loading}
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
                  车辆可用性管理
                </span>
              ),
              children: selectedVehicle ? (
                <VehicleAvailabilityManagement 
                  vehicleId={selectedVehicle.vehicleId}
                  vehicleInfo={selectedVehicle}
                />
              ) : (
                <Alert
                  message="请先选择一辆车"
                  description="请在车辆列表中选择一辆车，然后点击'管理可用性'按钮来管理该车辆的可用性设置。"
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

export default VehicleEnhanced; 