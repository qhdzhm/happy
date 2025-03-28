import React, { useState } from "react";
import "./Layout.scss";
import Sidebar from "./components/SideBar/Sidebar";
import AppMain from "./components/AppMain";
import NavBar from "./components/NavBar/NavBar";
import { Layout as AntLayout, FloatButton } from "antd";
import { GlobalOutlined } from "@ant-design/icons";

const Layout = () => {
  const [collapsed, setCollapsed] = useState(false);

  const toggleCollapsed = () => {
    setCollapsed(!collapsed);
  };

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
