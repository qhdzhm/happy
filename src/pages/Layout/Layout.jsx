import React, { useState, useEffect } from "react";
import "./Layout.scss";
import Sidebar from "./components/SideBar/Sidebar";
import AppMain from "./components/AppMain";
import NavBar from "./components/NavBar/NavBar";
import { Layout as AntLayout, FloatButton } from "antd";
import { GlobalOutlined } from "@ant-design/icons";
import adminWebSocketService from "../../utils/websocket";

const Layout = () => {
  const [collapsed, setCollapsed] = useState(false);

  const toggleCollapsed = () => {
    setCollapsed(!collapsed);
  };

  // 🔔 启动WebSocket连接
  useEffect(() => {
    // 🔥 修复：使用当前登录员工的ID
    const currentEmployeeId = localStorage.getItem('empId') || localStorage.getItem('employeeId') || localStorage.getItem('adminId') || '1';
    
    console.log('🚀 启动管理后台WebSocket连接，员工ID:', currentEmployeeId);
    adminWebSocketService.connect(currentEmployeeId);

    // 将WebSocket实例挂载到window对象上，供其他组件使用
    window.adminWebSocket = adminWebSocketService;

    // 监听连接状态
    const handleConnected = () => {
      console.log('✅ 管理后台WebSocket连接成功');
    };

    const handleDisconnected = () => {
      console.log('❌ 管理后台WebSocket连接断开');
    };

    const handleError = (error) => {
      console.error('❌ 管理后台WebSocket连接错误:', error);
    };

    adminWebSocketService.on('connected', handleConnected);
    adminWebSocketService.on('disconnected', handleDisconnected);
    adminWebSocketService.on('error', handleError);

    return () => {
      adminWebSocketService.off('connected', handleConnected);
      adminWebSocketService.off('disconnected', handleDisconnected);
      adminWebSocketService.off('error', handleError);
      adminWebSocketService.disconnect();
      // 清理window对象上的引用
      window.adminWebSocket = null;
    };
  }, []);

  return (
    <div className={`app-wrapper ${collapsed ? 'hideSidebar' : ''}`}>
      <div
        className={collapsed ? "drawer-bg" : ""}
        onClick={() => collapsed && toggleCollapsed()}
      />
      <Sidebar collapsed={collapsed} />
      <div className='main-container'>
        <NavBar collapsed={collapsed} toggle={toggleCollapsed} />
        <AppMain />
      </div>
      <FloatButton.BackTop 
        visibilityHeight={100}
        icon={<GlobalOutlined />}
      />
    </div>
  );
};

export default Layout;
