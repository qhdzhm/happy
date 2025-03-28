import React, { useEffect, useState } from "react";
import { 
  Form, 
  Input, 
  Radio, 
  Button, 
  message, 
  Select, 
  Card, 
  Space, 
  Divider, 
  Row, 
  Col,
  InputNumber,
  Tooltip
} from "antd";
import { 
  ArrowLeftOutlined, 
  UserOutlined, 
  PhoneOutlined, 
  IdcardOutlined,
  LockOutlined
} from "@ant-design/icons";
import { useNavigate, useParams } from "react-router-dom";
import { addEmp, getEmpById, updateEmp } from "@/apis/Employee";
import "./AddEmployee.scss";

const { Option } = Select;
const { TextArea } = Input;

const AddEmployee = () => {
  const [form] = Form.useForm();
  const { id } = useParams();
  const [loading, setLoading] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const navigate = useNavigate();

  // 获取员工信息
  const fetchEmployeeData = async () => {
    if (!id) return;
    
    setLoading(true);
    try {
      const response = await getEmpById(id);
      if (response.code === 1) {
        form.setFieldsValue(response.data);
        setIsEdit(true);
      } else {
        message.error("获取员工信息失败");
      }
    } catch (error) {
      console.error("获取员工信息失败:", error);
      message.error("获取员工信息失败");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployeeData();
  }, [id]);

  // 提交表单
  const handleSubmit = async (values) => {
    setLoading(true);
    try {
      // 确保状态字段不会变为null
      const formData = {
        ...values,
        status: values.status === undefined ? 1 : values.status // 默认为启用状态
      };
      
      let response;
      if (isEdit) {
        // 更新员工
        response = await updateEmp({
          ...formData,
          id
        });
      } else {
        // 添加员工
        response = await addEmp(formData);
      }

      if (response.code === 1) {
        message.success(`${isEdit ? '更新' : '添加'}员工成功`);
        navigate("/employee");
      } else {
        message.error(response.msg || `${isEdit ? '更新' : '添加'}员工失败`);
      }
    } catch (error) {
      console.error(`${isEdit ? '更新' : '添加'}员工失败:`, error);
      message.error(`${isEdit ? '更新' : '添加'}员工失败`);
    } finally {
      setLoading(false);
    }
  };

  // 角色选项
  const roleOptions = [
    { label: "导游", value: 0 },
    { label: "操作员", value: 1 },
    { label: "管理员", value: 2 },
  ];

  // 工作状态选项
  const workStatusOptions = [
    { label: "空闲", value: 0 },
    { label: "忙碌", value: 1 },
    { label: "休假", value: 2 },
    { label: "出团", value: 3 },
    { label: "待命", value: 4 },
  ];

  return (
    <div className="add-employee-container">
      <Card 
        title={
          <div className="card-title">
            <Space>
              <Button 
                icon={<ArrowLeftOutlined />} 
                type="text" 
                onClick={() => navigate("/employee")}
              />
              <span>{isEdit ? "编辑员工" : "添加员工"}</span>
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
            workStatus: 0,
            role: 0,
            sex: "1"
          }}
        >
          <Row gutter={24}>
            <Col span={12}>
              <Form.Item
                name="username"
                label="用户名"
                rules={[
                  { required: true, message: "请输入用户名" },
                  { min: 3, max: 20, message: "用户名长度应在3-20之间" }
                ]}
              >
                <Input prefix={<UserOutlined />} placeholder="请输入用户名" />
              </Form.Item>
            </Col>
            
            <Col span={12}>
              <Form.Item
                name="name"
                label="姓名"
                rules={[
                  { required: true, message: "请输入姓名" },
                  { max: 50, message: "姓名不能超过50个字符" }
                ]}
              >
                <Input prefix={<UserOutlined />} placeholder="请输入姓名" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={24}>
            <Col span={12}>
              <Form.Item
                name="phone"
                label="手机号"
                rules={[
                  { required: true, message: "请输入手机号" },
                  { pattern: /^\d{10}$/, message: "请输入10位数字手机号" }
                ]}
              >
                <Input prefix={<PhoneOutlined />} placeholder="请输入10位手机号" />
              </Form.Item>
            </Col>
            
            <Col span={12}>
              <Form.Item
                name="idNumber"
                label="ID号"
                rules={[
                  { required: false },
                  { max: 20, message: "ID号不能超过20个字符" }
                ]}
              >
                <Input prefix={<IdcardOutlined />} placeholder="请输入ID号（选填）" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={24}>
            <Col span={12}>
              <Form.Item
                name="sex"
                label="性别"
                rules={[{ required: true, message: "请选择性别" }]}
              >
                <Radio.Group>
                  <Radio value="1">男</Radio>
                  <Radio value="0">女</Radio>
                </Radio.Group>
              </Form.Item>
            </Col>
            
            <Col span={12}>
              <Form.Item
                name="status"
                label="账号状态"
                rules={[{ required: true, message: "请选择账号状态" }]}
              >
                <Radio.Group>
                  <Radio value={1}>正常</Radio>
                  <Radio value={0}>禁用</Radio>
                </Radio.Group>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={24}>
            <Col span={12}>
              <Form.Item
                name="workStatus"
                label="工作状态"
                rules={[{ required: true, message: "请选择工作状态" }]}
              >
                <Select placeholder="请选择工作状态">
                  {workStatusOptions.map(option => (
                    <Option key={option.value} value={option.value}>
                      {option.label}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>

            <Col span={12}>
              <Form.Item
                name="role"
                label="角色"
                rules={[{ required: true, message: "请选择角色" }]}
              >
                <Select placeholder="请选择角色">
                  {roleOptions.map(option => (
                    <Option key={option.value} value={option.value}>
                      {option.label}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          {!isEdit && (
            <Row gutter={24}>
              <Col span={12}>
                <Form.Item
                  name="password"
                  label="密码"
                  rules={[
                    { required: true, message: "请输入密码" },
                    { min: 6, message: "密码长度不能小于6位" }
                  ]}
                >
                  <Input.Password prefix={<LockOutlined />} placeholder="请输入密码" />
                </Form.Item>
              </Col>
            </Row>
          )}

          <Divider />

          <Form.Item>
            <div className="form-buttons">
              <Button onClick={() => navigate("/employee")}>取消</Button>
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

export default AddEmployee;