import React from "react";
import { Outlet, useLocation } from "react-router-dom";
import { Breadcrumb } from "antd";
import { HomeOutlined } from "@ant-design/icons";
import router from "@/router/route";

const getBreadcrumbItems = (pathname) => {
  // 获取当前路径对应的路由配置
  const routes = router.routes || [];
  const mainRoute = routes.find(route => route.path === "/");
  if (!mainRoute || !mainRoute.children) return [];
  
  const items = [];
  // 首页
  items.push({
    title: <><HomeOutlined /> 首页</>,
    path: "/"
  });
  
  // 如果是首页，直接返回
  if (pathname === "/") return items;
  
  // 一级路径
  const firstLevelPath = "/" + pathname.split("/")[1];
  const firstLevelRoute = mainRoute.children.find(route => route.path === firstLevelPath);
  
  if (firstLevelRoute) {
    items.push({
      title: firstLevelRoute.meta?.title || firstLevelPath,
      path: firstLevelPath
    });
    
    // 二级路径
    if (pathname !== firstLevelPath && firstLevelRoute.children) {
      const secondLevelPath = pathname;
      const secondLevelRoute = firstLevelRoute.children.find(route => route.path === secondLevelPath);
      
      if (secondLevelRoute) {
        items.push({
          title: secondLevelRoute.meta?.title || secondLevelPath,
          path: secondLevelPath
        });
      }
    }
  }
  
  return items;
};

const AppMain = () => {
  const location = useLocation();
  const breadcrumbItems = getBreadcrumbItems(location.pathname);
  
  return (
    <div className="appmain">
      {/* 面包屑导航 */}
      <div className="breadcrumb-container">
        <Breadcrumb items={breadcrumbItems.map(item => ({ title: item.title }))} />
      </div>
      
      {/* 页面内容区域 */}
      <div className="layout-content">
        <div className="page-container">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default AppMain;
