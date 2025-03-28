import React, { useState } from "react";
import { Button, Form, Input, Spin } from "antd";
import Loginpic from "@/assets/login/Login.jpg";
import { LockOutlined, UserOutlined } from '@ant-design/icons';
import LoginLogo from "@/assets/login/logo.png";
import './Login.scss'
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { fetchLogin } from "@/store/UserStore/UserStore";

const Login = () => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)

  const onFinish = async (formValue) => {
    setLoading(true)
    try {
      console.log('提交登录表单:', formValue)
      const result = await dispatch(fetchLogin(formValue))
      console.log('登录结果:', result)
      
      // 判断是否登录成功
      if (result && result.code === 1) {
        console.log('登录成功，准备跳转到首页')
        setTimeout(() => {
          navigate('/')
        }, 500)
      }
    } catch (error) {
      console.error('登录失败:', error)
    } finally {
      setLoading(false)
    }
  };

  return (
    <div className="login">
      <div className="login-container">
        <div className="login-image">
          <img src={Loginpic} alt="Login background" />
        </div>
        <div className="login-form">
          <Spin spinning={loading}>
            <div className="title">
              <img src={LoginLogo} alt="Logo" />
            </div>
            <Form
              validateTrigger={['onBlur']}
              name="normal_login"
              className="ant-form"
              initialValues={{
                remember: true,
              }}
              onFinish={onFinish}
            >
              <Form.Item
                name="username"
                rules={[
                  {
                    required: true,
                    message: "请输入用户名",
                  },
                ]}
              >
                <Input
                  prefix={<UserOutlined className="site-form-item-icon" />}
                  className="form-item"
                  placeholder="用户名"
                />
              </Form.Item>
              <Form.Item
                name="password"
                rules={[
                  {
                    required: true,
                    message: "请输入密码",
                  },{
                    pattern:/^.{6,}$/,
                    message:'密码必须至少6个字符'
                  }
                ]}
              >
                <Input
                  prefix={<LockOutlined className="site-form-item-icon" />}
                  className="form-item"
                  type="password"
                  placeholder="密码"
                />
              </Form.Item>
              
              <Form.Item>
                <Button
                  type="primary"
                  htmlType="submit"
                  className="login-form-button"
                  loading={loading}
                >
                  登录
                </Button>
              </Form.Item>
            </Form>
          </Spin>
        </div>
      </div>
    </div>
  );
};

export default Login;
