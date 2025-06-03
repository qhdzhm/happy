import { getVehiclesByPage, deleteVehicle } from "@/apis/vehicle";
import { 
  PlusOutlined, 
  SearchOutlined, 
  ReloadOutlined, 
  CarOutlined,
  EditOutlined,
  DeleteOutlined,
  CalendarOutlined
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
  Space
} from "antd";
import dayjs from "dayjs";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import VehicleAvailabilityModal from "@/components/AvailabilityManagement/VehicleAvailabilityModal";
import "./Vehicle.scss";

const { Option } = Select;

// 定义初始查询参数
const initialQueryParams = {
  vehicleType: "", // 车辆类型
  licensePlate: "", // 车牌号
  status: null, // 状态
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

const Vehicle = () => {
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

  // 可用性管理相关状态
  const [availabilityModalVisible, setAvailabilityModalVisible] = useState(false);
  const [currentVehicle, setCurrentVehicle] = useState(null);

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

  // 打开可用性管理对话框
  const showAvailabilityModal = (record) => {
    setCurrentVehicle(record);
    setAvailabilityModalVisible(true);
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
      dataIndex: "location",
      key: "location",
      render: (location) => (location ? location : "-"),
    },
    {
      title: "座位数量",
      dataIndex: "seatCount",
      key: "seatCount",
      render: (seatCount) => (
        <Tag color="purple">{seatCount ? `${seatCount}座` : "-"}</Tag>
      ),
    },
    {
      title: "注册到期日期",
      dataIndex: "regoExpiryDate",
      key: "regoExpiryDate",
      render: (date) => (date ? dayjs(date).format("YYYY-MM-DD") : "-"),
    },
    {
      title: "检验到期日期",
      dataIndex: "inspectionDueDate",
      key: "inspectionDueDate",
      render: (date) => (date ? dayjs(date).format("YYYY-MM-DD") : "-"),
    },
    {
      title: "状态",
      dataIndex: "status",
      key: "status",
      width: 150,
      render: (status, record) => {
        // 获取状态标签
        const getStatusTag = (status) => {
          const statusMap = {
            0: { color: 'default', text: '送修中' },
            1: { color: 'success', text: '可用' },
            2: { color: 'processing', text: '已占用' },
            3: { color: 'warning', text: '已满' },
            4: { color: 'error', text: '注册过期' },
            5: { color: 'error', text: '车检过期' }
          };
          return statusMap[status] || { color: 'default', text: '未知' };
        };

        // 获取状态文本
        const { color, text } = getStatusTag(status);
        
        // 添加日期提示
        let dateInfo = null;
        
        if (record.regoRemainingDays !== undefined && record.regoRemainingDays <= 30) {
          const days = record.regoRemainingDays;
          if (days < 0) {
            dateInfo = <div style={{ color: '#f5222d', fontSize: '12px' }}>注册已过期 {Math.abs(days)} 天</div>;
          } else if (days <= 30) {
            dateInfo = <div style={{ color: '#faad14', fontSize: '12px' }}>注册剩余 {days} 天</div>;
          }
        }
        
        if (record.inspectionRemainingDays !== undefined && record.inspectionRemainingDays <= 30) {
          const days = record.inspectionRemainingDays;
          if (days < 0) {
            dateInfo = dateInfo ? 
              <>{dateInfo}<div style={{ color: '#f5222d', fontSize: '12px' }}>车检已过期 {Math.abs(days)} 天</div></> :
              <div style={{ color: '#f5222d', fontSize: '12px' }}>车检已过期 {Math.abs(days)} 天</div>;
          } else if (days <= 30) {
            dateInfo = dateInfo ? 
              <>{dateInfo}<div style={{ color: '#faad14', fontSize: '12px' }}>车检剩余 {days} 天</div></> :
              <div style={{ color: '#faad14', fontSize: '12px' }}>车检剩余 {days} 天</div>;
          }
        }
        
        return (
          <Space direction="vertical" size={0}>
            <Tag color={color}>{text}</Tag>
            {dateInfo}
          </Space>
        );
      }
    },
    {
      title: "备注",
      dataIndex: "notes",
      key: "notes",
      ellipsis: true,
      render: (notes) => (
        notes ? (
          <Tooltip title={notes}>
            <span>{notes}</span>
          </Tooltip>
        ) : "-"
      ),
    },
    {
      title: "操作",
      key: "action",
      width: 180,
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="编辑">
            <Button
              type="primary"
              icon={<EditOutlined />}
              size="small"
              onClick={() => handleEdit(record.vehicleId)}
            />
          </Tooltip>
          <Tooltip title="管理可用性">
            <Button
              type="primary"
              icon={<CalendarOutlined />}
              size="small"
              onClick={() => showAvailabilityModal(record)}
              style={{ backgroundColor: '#52c41a', borderColor: '#52c41a' }}
            />
          </Tooltip>
          <Tooltip title="删除">
            <Popconfirm
              title="确定要删除该车辆吗？"
              description="删除后无法恢复，请谨慎操作"
              onConfirm={() => handleDelete(record.vehicleId)}
              okText="确定"
              cancelText="取消"
              placement="topRight"
              okButtonProps={{ danger: true }}
            >
              <Button
                type="primary"
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
      <Card className="vehicle-card" title="车辆管理系统" extra={
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={handleAddVehicle}
          className="add-vehicle-btn"
        >
          添加车辆
        </Button>
      }>
        <div className="vehicle-top">
          {/* 筛选条件 */}
          <Form
            form={form}
            onFinish={handleSearch}
            className="search-form"
          >
            <Row gutter={[16, 16]}>
              <Col span={6}>
                <Form.Item name="vehicleType" label="车辆类型">
                  <Select
                    allowClear
                    placeholder="请选择车辆类型"
                  >
                    <Option value="小型巴士">小型巴士</Option>
                    <Option value="中型巴士">中型巴士</Option>
                    <Option value="大型巴士">大型巴士</Option>
                    <Option value="SUV">SUV</Option>
                    <Option value="轿车">轿车</Option>
                    <Option value="面包车">面包车</Option>
                  </Select>
                </Form.Item>
              </Col>
              <Col span={6}>
                <Form.Item name="licensePlate" label="车牌号">
                  <Input
                    allowClear
                    placeholder="请输入车牌号"
                  />
                </Form.Item>
              </Col>
              <Col span={6}>
                <Form.Item name="status" label="状态">
                  <Select
                    allowClear
                    placeholder="请选择状态"
                  >
                    <Option value={0}>送修中</Option>
                    <Option value={1}>可用</Option>
                    <Option value={2}>已占用</Option>
                    <Option value={3}>已满</Option>
                    <Option value={4}>注册过期</Option>
                    <Option value={5}>车检过期</Option>
                  </Select>
                </Form.Item>
              </Col>
              <Col span={6}>
                <Form.Item name="location" label="车辆地址">
                  <Input
                    allowClear
                    placeholder="请输入车辆地址"
                  />
                </Form.Item>
              </Col>
              <Col span={6}>
                <Form.Item name="seatCount" label="座位数量">
                  <InputNumber
                    min={1}
                    placeholder="请输入座位数量"
                    style={{ width: '100%' }}
                  />
                </Form.Item>
              </Col>
              <Col span={6}>
                <Form.Item name="regoExpiryDate" label="注册到期日期">
                  <DatePicker
                    allowClear
                    style={{ width: '100%' }}
                    placeholder="请选择注册到期日期"
                  />
                </Form.Item>
              </Col>
              <Col span={6}>
                <Form.Item name="inspectionDueDate" label="检验到期日期">
                  <DatePicker
                    allowClear
                    style={{ width: '100%' }}
                    placeholder="请选择检验到期日期"
                  />
                </Form.Item>
              </Col>
            </Row>
            <Row>
              <Col span={24} style={{ textAlign: 'right', marginTop: '16px' }}>
                <Space>
                  <Button type="primary" htmlType="submit" icon={<SearchOutlined />}>
                    查询
                  </Button>
                  <Button onClick={handleReset} icon={<ReloadOutlined />}>
                    重置
                  </Button>
                </Space>
              </Col>
            </Row>
          </Form>
        </div>
        
        {/* 车辆列表 */}
        <Table
          className="vehicle-table"
          dataSource={vehicles}
          columns={columns}
          rowKey="vehicleId"
          loading={loading}
          pagination={{
            current: pagination.current,
            pageSize: pagination.pageSize,
            total: pagination.total,
            onChange: handlePageChange,
            showQuickJumper: true,
            showSizeChanger: true,
            showTotal: (total) => `共 ${total} 条记录`,
          }}
          scroll={{ x: 1100 }}
        />
      </Card>

      {/* 可用性管理对话框 */}
      <VehicleAvailabilityModal
        visible={availabilityModalVisible}
        onCancel={() => setAvailabilityModalVisible(false)}
        vehicle={currentVehicle}
      />
    </div>
  );
};

export default Vehicle;