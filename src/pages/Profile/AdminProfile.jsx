import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Form, 
  Input, 
  Button, 
  message, 
  Row, 
  Col,
  Divider,
  Space,
  Typography
} from 'antd';
import { 
  UserOutlined, 
  MailOutlined, 
  PhoneOutlined,
  LockOutlined,
  SaveOutlined
} from '@ant-design/icons';
// import { useSelector, useDispatch } from 'react-redux'; // 暂时移除避免循环
import AvatarUpload from '../../components/AvatarUpload';
import { updateAdminProfile } from '../../api/employee';
import { getUserInfo } from '../../utils/token';
import './AdminProfile.scss';

const { Title } = Typography;

const AdminProfile = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState('');
  const [passwordForm] = Form.useForm();
  const [passwordLoading, setPasswordLoading] = useState(false);

  // 简化：移除Redux依赖，直接从Cookie获取数据
  
  // 角色文本映射 - 移到前面定义
  const getRoleText = (roleValue) => {
    const roleMap = {
      0: '导游',
      1: '操作员', 
      2: '管理员',
      3: '客服'
    };
    return roleMap[roleValue] || '未知角色';
  };

  // 时间格式化 - 移到前面定义
  const formatDateTime = (dateTime) => {
    if (!dateTime) return null;
    try {
      return new Date(dateTime).toLocaleString('zh-CN');
    } catch (error) {
      return null;
    }
  };
  
  // 简化初始状态，通过useEffect从Cookie加载  
  const [adminInfo, setAdminInfo] = useState({
    id: 0,
    username: '',
    name: '',
    email: '',
    phone: '',
    avatar: '',
    role: '未知角色',
    lastLoginTime: '未知'
  });

  // 只在页面初始化时执行一次，简化逻辑避免无限循环
  useEffect(() => {
    // 从Cookie获取最新用户信息
    const userInfoFromCookie = getUserInfo();
    console.log('🔍 AdminProfile初始化，Cookie信息:', userInfoFromCookie);
    
    if (userInfoFromCookie) {
      // 构建adminInfo
      const adminInfoData = {
        id: userInfoFromCookie.id || userInfoFromCookie.empId || 0,
        username: userInfoFromCookie.username || '',
        name: userInfoFromCookie.name || '',
        email: userInfoFromCookie.email || '',
        phone: userInfoFromCookie.phone || '',
        avatar: userInfoFromCookie.avatar || '',
        role: getRoleText(userInfoFromCookie.roleId),
        lastLoginTime: formatDateTime(userInfoFromCookie.lastLoginTime) || '未知'
      };
      
      setAdminInfo(adminInfo);
      setAvatarUrl(userInfoFromCookie.avatar || '');
      
      // 设置表单初始值 - 包含用户名
      form.setFieldsValue({
        username: userInfoFromCookie.username || '',  // 🔧 设置用户名的值
        name: userInfoFromCookie.name || '',
        email: userInfoFromCookie.email || '',
        phone: userInfoFromCookie.phone || ''
      });
      
      console.log('✅ AdminProfile初始化完成:', adminInfo);
    }
  }, []); // 只执行一次

  // 已在初始化useEffect中设置表单值，移除此重复代码

  // 头像变化处理 - 立即保存到数据库
  const handleAvatarChange = async (url) => {
    try {
      setAvatarUrl(url);
      setAdminInfo(prev => ({
        ...prev,
        avatar: url
      }));
      
      console.log('🔄 头像上传成功，立即保存到数据库:', url);
      
      // 🚀 立即调用API保存头像URL到数据库
      // 获取表单当前值，如果表单没有值则使用adminInfo中的值
      const formValues = form.getFieldsValue();
      const profileData = {
        username: formValues.username || adminInfo.username,  // 🔧 包含用户名
        name: formValues.name || adminInfo.name,
        email: formValues.email || adminInfo.email, 
        phone: formValues.phone || adminInfo.phone,
        avatar: url  // 新的头像URL
      };
      
      const response = await updateAdminProfile(profileData);
      
      // 🔧 修正响应检查逻辑：检查response.code而不是response.data.code
      if (response && response.code === 1) {
        console.log('✅ 头像URL已保存到数据库');
        message.success('头像更新并保存成功');
      } else {
        console.error('❌ 保存头像URL失败:', response);
        message.warning('头像上传成功，但保存失败，请手动点击"保存信息"');
      }
    } catch (error) {
      console.error('❌ 保存头像URL到数据库失败:', error);
      message.warning('头像上传成功，但保存失败，请手动点击"保存信息"');
    }
  };

  // 保存基本信息
  const handleSaveProfile = async (values) => {
    try {
      setLoading(true);
      
      // 调用后端API保存管理员信息
      const profileData = {
        ...values,
        username: values.username || adminInfo.username,  // 🔧 确保包含用户名
        avatar: avatarUrl
      };
      
      console.log('🚀 保存管理员个人信息:', profileData);
      console.log('🔍 表单原始值:', values);
      console.log('🔍 当前adminInfo:', adminInfo);
      const response = await updateAdminProfile(profileData);
      
      // 增加详细的响应调试信息
      console.log('🔍 后端响应结构:', response);
      console.log('🔍 response.code:', response.code);
      console.log('🔍 response.data:', response.data);
      console.log('🔍 response.code === 1:', response.code === 1);
      
      // 🔧 修正响应检查逻辑：检查response.code而不是response.data.code
      if (response && response.code === 1) {
        // 只更新本地状态，避免复杂的Redux操作
        setAdminInfo(prev => ({
          ...prev,
          ...values,
          avatar: avatarUrl
        }));
        
        console.log('✅ 管理员个人信息更新成功');
        message.success('个人信息更新成功，页面将在1秒后刷新');
        
        // 简单的页面刷新，确保显示最新的Cookie信息
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      } else {
        console.error('❌ 响应code不为1:', response);
        throw new Error(response?.msg || '更新失败');
      }
    } catch (error) {
      console.error('❌ 更新个人信息失败:', error);
      console.error('❌ 错误详情:', error.response);
      message.error(error.response?.data?.msg || error.message || '更新个人信息失败');
    } finally {
      setLoading(false);
    }
  };

  // 修改密码
  const handleChangePassword = async (values) => {
    try {
      setPasswordLoading(true);
      
      // 这里应该调用后端API修改密码
      // const response = await changeAdminPassword({
      //   oldPassword: values.oldPassword,
      //   newPassword: values.newPassword
      // });

      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      passwordForm.resetFields();
      message.success('密码修改成功');
    } catch (error) {
      console.error('修改密码失败:', error);
      message.error('修改密码失败');
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <div className="admin-profile-container">
      <div className="profile-header">
        <Title level={2}>
          <UserOutlined /> 个人信息管理
        </Title>
      </div>

      <Row gutter={24}>
        {/* 基本信息卡片 */}
        <Col xs={24} lg={16}>
          <Card title="基本信息" className="profile-card">
            <Form
              form={form}
              layout="vertical"
              onFinish={handleSaveProfile}
            >
              <Row gutter={16}>
                <Col xs={24} sm={12}>
                  <Form.Item
                    name="username"
                    label="用户名"
                    // 🔧 移除required验证，因为字段是disabled的
                  >
                    <Input 
                      prefix={<UserOutlined />} 
                      placeholder="用户名不可修改"
                      disabled // 通常用户名不允许修改
                    />
                  </Form.Item>
                </Col>
                
                <Col xs={24} sm={12}>
                  <Form.Item
                    name="name"
                    label="姓名"
                    rules={[
                      { required: true, message: '请输入姓名' },
                      { max: 50, message: '姓名不能超过50个字符' }
                    ]}
                  >
                    <Input 
                      prefix={<UserOutlined />} 
                      placeholder="请输入姓名"
                    />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col xs={24} sm={12}>
                  <Form.Item
                    name="email"
                    label="邮箱"
                    rules={[
                      { required: true, message: '请输入邮箱' },
                      { type: 'email', message: '请输入有效的邮箱地址' }
                    ]}
                  >
                    <Input 
                      prefix={<MailOutlined />} 
                      placeholder="请输入邮箱"
                    />
                  </Form.Item>
                </Col>
                
                <Col xs={24} sm={12}>
                  <Form.Item
                    name="phone"
                    label="手机号"
                    rules={[
                      { required: true, message: '请输入手机号' },
                      { pattern: /^0\d{9}$/, message: '请输入有效的澳洲手机号' }
                    ]}
                  >
                    <Input 
                      prefix={<PhoneOutlined />} 
                      placeholder="请输入手机号"
                    />
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item>
                <Button 
                  type="primary" 
                  htmlType="submit" 
                  loading={loading}
                  icon={<SaveOutlined />}
                >
                  保存信息
                </Button>
              </Form.Item>
            </Form>
          </Card>
        </Col>

        {/* 头像和账户信息卡片 */}
        <Col xs={24} lg={8}>
          <Card title="头像设置" className="avatar-card">
            <div className="avatar-section">
              <AvatarUpload
                avatarUrl={avatarUrl}
                onAvatarChange={handleAvatarChange}
                size={120}
              />
              <div className="admin-info">
                <h3>{adminInfo.name}</h3>
                <p className="role">{adminInfo.role}</p>
                <p className="last-login">
                  最后登录: {adminInfo.lastLoginTime}
                </p>
              </div>
            </div>
          </Card>

          {/* 密码修改卡片 */}
          <Card title="密码修改" className="password-card" style={{ marginTop: 16 }}>
            <Form
              form={passwordForm}
              layout="vertical"
              onFinish={handleChangePassword}
            >
              <Form.Item
                name="oldPassword"
                label="当前密码"
                rules={[
                  { required: true, message: '请输入当前密码' }
                ]}
              >
                <Input.Password 
                  prefix={<LockOutlined />} 
                  placeholder="请输入当前密码"
                />
              </Form.Item>

              <Form.Item
                name="newPassword"
                label="新密码"
                rules={[
                  { required: true, message: '请输入新密码' },
                  { min: 6, message: '密码长度不能小于6位' }
                ]}
              >
                <Input.Password 
                  prefix={<LockOutlined />} 
                  placeholder="请输入新密码"
                />
              </Form.Item>

              <Form.Item
                name="confirmPassword"
                label="确认密码"
                dependencies={['newPassword']}
                rules={[
                  { required: true, message: '请确认新密码' },
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      if (!value || getFieldValue('newPassword') === value) {
                        return Promise.resolve();
                      }
                      return Promise.reject(new Error('两次输入的密码不一致'));
                    },
                  }),
                ]}
              >
                <Input.Password 
                  prefix={<LockOutlined />} 
                  placeholder="请确认新密码"
                />
              </Form.Item>

              <Form.Item>
                <Button 
                  type="primary" 
                  htmlType="submit" 
                  loading={passwordLoading}
                  block
                >
                  修改密码
                </Button>
              </Form.Item>
            </Form>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default AdminProfile;