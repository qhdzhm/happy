import React, { useState } from 'react';
import { Button, Layout, Dropdown, Avatar, Menu, Badge } from 'antd';
import { MenuUnfoldOutlined, MenuFoldOutlined, UserOutlined, LogoutOutlined, BellOutlined, GlobalOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import NotificationCenter from '../../../../components/NotificationCenter/NotificationCenter';
import './NavBar.scss';

const { Header } = Layout;

const NavBar = ({ collapsed, toggle }) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    // 可以在这里添加登出逻辑，例如清除本地存储的token
    localStorage.removeItem('token');
    navigate('/login');
  };

  const menuItems = [
    {
      key: '1',
      icon: <UserOutlined />,
      label: '个人信息'
    },
    {
      key: '2',
      icon: <GlobalOutlined />,
      label: '系统设置'
    },
    {
      type: 'divider'
    },
    {
      key: '3',
      icon: <LogoutOutlined />,
      label: '退出登录',
      onClick: handleLogout
    }
  ];

  return (
    <Header className="navbar">
      <div className="navbar-left">
        {React.createElement(collapsed ? MenuUnfoldOutlined : MenuFoldOutlined, {
          className: 'trigger',
          onClick: toggle,
        })}
        <div className="system-title">
          <GlobalOutlined /> 塔斯马尼亚旅游管理系统
        </div>
      </div>
      <div className="navbar-right">
        <NotificationCenter />
        <Dropdown menu={{ items: menuItems }} trigger={['click']}>
          <div className="avatar-wrapper">
            <Avatar icon={<UserOutlined />} className="admin-avatar" />
            <span className="username">管理员</span>
          </div>
        </Dropdown>
      </div>
    </Header>
  );
};

export default NavBar;
