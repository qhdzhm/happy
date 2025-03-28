import React, { useEffect, useState } from "react";
import { 
  Form, 
  Input, 
  Button, 
  message, 
  Select, 
  DatePicker, 
  InputNumber, 
  Card, 
  Divider, 
  Row, 
  Col, 
  Space 
} from "antd";
import { 
  ArrowLeftOutlined,
  CarOutlined
} from "@ant-design/icons";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { addVehicle, getVehicleById, updateVehicle } from "@/apis/vehicle";
import dayjs from "dayjs";
import "./AddVehicle.scss";

const { Option } = Select;
const { TextArea } = Input;

const AddVehicle = () => {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const { id } = useParams();
  const [loading, setLoading] = useState(false);
  const [isEdit, setIsEdit] = useState(false);

  // 获取车辆信息
  const fetchVehicleData = async () => {
    if (!id) return;
    
    setLoading(true);
    try {
      const response = await getVehicleById(id);
      if (response.code === 1) {
        const vehicleData = response.data;
        
        // 转换日期字符串为Dayjs对象
        const formData = {
          ...vehicleData,
          regoExpiryDate: vehicleData.regoExpiryDate ? dayjs(vehicleData.regoExpiryDate) : null,
          inspectionDueDate: vehicleData.inspectionDueDate ? dayjs(vehicleData.inspectionDueDate) : null,
        };
        
        form.setFieldsValue(formData);
        setIsEdit(true);
      } else {
        message.error("获取车辆信息失败");
      }
    } catch (error) {
      console.error("获取车辆信息错误:", error);
      message.error("获取车辆信息失败");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVehicleData();
  }, [id]);

  // 提交表单
  const handleSubmit = async (values) => {
    // 转换日期对象为字符串
    const submitData = {
      ...values,
      regoExpiryDate: values.regoExpiryDate ? dayjs(values.regoExpiryDate).format("YYYY-MM-DD") : null,
      inspectionDueDate: values.inspectionDueDate ? dayjs(values.inspectionDueDate).format("YYYY-MM-DD") : null,
    };

    setLoading(true);
    try {
      let response;
      if (isEdit) {
        // 更新操作
        response = await updateVehicle({
          ...submitData,
          vehicleId: id
        });
      } else {
        // 添加操作
        response = await addVehicle(submitData);
      }

      if (response.code === 1) {
        message.success(`${isEdit ? '更新' : '添加'}车辆成功`);
        navigate("/vehicle");
      } else {
        message.error(response.msg || `${isEdit ? '更新' : '添加'}车辆失败`);
      }
    } catch (error) {
      console.error(`${isEdit ? '更新' : '添加'}车辆错误:`, error);
      message.error(`${isEdit ? '更新' : '添加'}车辆失败`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="add-vehicle-container">
      <Card 
        title={
          <div className="card-title">
            <Space>
              <Button 
                icon={<ArrowLeftOutlined />} 
                type="text" 
                onClick={() => navigate("/vehicle")}
              />
              <span>{isEdit ? "编辑车辆" : "添加车辆"}</span>
            </Space>
          </div>
        }
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{
            status: 1,
            vehicleType: "小型巴士",
            seatCount: 12
          }}
        >
          <Row gutter={24}>
            <Col span={12}>
              <Form.Item
                name="vehicleType"
                label="车辆类型"
                rules={[{ required: true, message: "请选择车辆类型" }]}
              >
                <Select placeholder="请选择车辆类型">
                  <Option value="小型巴士">小型巴士</Option>
                  <Option value="中型巴士">中型巴士</Option>
                  <Option value="大型巴士">大型巴士</Option>
                  <Option value="SUV">SUV</Option>
                  <Option value="轿车">轿车</Option>
                  <Option value="面包车">面包车</Option>
                </Select>
              </Form.Item>
            </Col>

            <Col span={12}>
              <Form.Item
                name="licensePlate"
                label="车牌号"
                rules={[
                  { required: true, message: "请输入车牌号" },
                  { max: 10, message: "车牌号不能超过10个字符" }
                ]}
              >
                <Input prefix={<CarOutlined />} placeholder="请输入车牌号" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={24}>
            <Col span={12}>
              <Form.Item
                name="status"
                label="车辆状态"
                rules={[{ required: true, message: "请选择车辆状态" }]}
              >
                <Select placeholder="请选择车辆状态">
                  <Option value={0}>送修中</Option>
                  <Option value={1}>可用</Option>
                  <Option value={2}>已占用</Option>
                  <Option value={3}>已满</Option>
                  <Option value={4}>注册过期</Option>
                  <Option value={5}>车检过期</Option>
                </Select>
              </Form.Item>
            </Col>

            <Col span={12}>
              <Form.Item
                name="seatCount"
                label="座位数量"
                rules={[{ required: true, message: "请输入座位数量" }]}
              >
                <InputNumber min={1} max={50} style={{ width: "100%" }} placeholder="请输入座位数量" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={24}>
            <Col span={12}>
              <Form.Item
                name="maxDrivers"
                label="最大驾驶员数量"
                rules={[{ required: true, message: "请输入最大驾驶员数量" }]}
              >
                <InputNumber min={1} max={5} style={{ width: "100%" }} placeholder="请输入最大驾驶员数量" />
              </Form.Item>
            </Col>

            <Col span={12}>
              <Form.Item
                name="location"
                label="车辆地址"
              >
                <Input placeholder="请输入车辆地址" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={24}>
            <Col span={12}>
              <Form.Item
                name="regoExpiryDate"
                label="申请日期"
              >
                <DatePicker style={{ width: "100%" }} placeholder="请选择申请日期" />
              </Form.Item>
            </Col>

            <Col span={12}>
              <Form.Item
                name="inspectionDueDate"
                label="检验到期日期"
              >
                <DatePicker style={{ width: "100%" }} placeholder="请选择检验到期日期" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={24}>
            <Col span={24}>
              <Form.Item
                name="notes"
                label="备注"
              >
                <TextArea rows={4} placeholder="请输入备注信息" />
              </Form.Item>
            </Col>
          </Row>

          <Divider />

          <Form.Item>
            <div className="form-buttons">
              <Button onClick={() => navigate("/vehicle")}>取消</Button>
              <Button type="primary" htmlType="submit" loading={loading}>
                {isEdit ? "更新" : "添加"}
              </Button>
            </div>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default AddVehicle; 