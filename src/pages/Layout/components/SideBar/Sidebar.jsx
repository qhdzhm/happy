import React, { useEffect, useState } from "react";
import { Layout, Menu } from "antd";
import {
  HomeOutlined,
  PieChartOutlined,
  OrderedListOutlined,
  CompassOutlined,
  TeamOutlined,
  UserOutlined,
  CarOutlined,
  GlobalOutlined,
  ShopOutlined,
  UserSwitchOutlined,
  CustomerServiceOutlined
} from "@ant-design/icons";
import { useLocation, useNavigate } from "react-router-dom";
import router from "@/router/route";
import './Sidebar.scss';
import logo from "../../../../assets/login/logo.png";
import miniLogo from "../../../../assets/login/mini-logo.png";

const { Sider } = Layout;

const Sidebar = ({ collapsed }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [menuItems, setMenuItems] = useState([]);
  const [openKeys, setOpenKeys] = useState([]);
  const selectedKey = location.pathname;

  // 图标映射
  const iconMap = {
    HomeOutlined: <HomeOutlined />,
    PieChartOutlined: <PieChartOutlined />,
    OrderedListOutlined: <OrderedListOutlined />,
    CompassOutlined: <CompassOutlined />,
    TeamOutlined: <TeamOutlined />,
    UserOutlined: <UserOutlined />,
    CarOutlined: <CarOutlined />,
    GlobalOutlined: <GlobalOutlined />,
    ShopOutlined: <ShopOutlined />,
    UserSwitchOutlined: <UserSwitchOutlined />,
    CustomerServiceOutlined: <CustomerServiceOutlined />
  };

  // 获取图标
  const getIcon = (iconName) => {
    if (!iconName) return null;
    return iconMap[iconName] || null;
  };

  // 获取路由菜单
  useEffect(() => {
    // 从路由配置获取菜单
    const routes = router.routes || [];
    const mainRoute = routes.find(route => route.path === "/");
    
    if (mainRoute && mainRoute.children) {
      const filteredMenus = mainRoute.children.filter(item => {
        // 过滤掉不需要显示的菜单项
        return !item.meta?.hidden;
      });
      
      // 转换为Ant Design Menu需要的items格式
      const items = convertToMenuItems(filteredMenus);
      setMenuItems(items);
      
      // 设置默认展开的菜单
      const pathname = location.pathname;
      const parentPath = '/' + pathname.split('/')[1];
      setOpenKeys([parentPath]);
    }
  }, [location.pathname]);

  // 将路由配置转换为Menu的items格式
  const convertToMenuItems = (routeItems) => {
    return routeItems.map(item => {
      const icon = getIcon(item.meta?.icon);
      
      // 检查是否有子项
      if (item.children && item.children.length > 0) {
        const childrenItems = item.children.filter(child => !child.meta?.hidden);
        
        if (childrenItems.length === 0) {
          return {
            key: item.path,
            icon,
            label: item.meta?.title
          };
        }
        
        return {
          key: item.path,
          icon,
          label: item.meta?.title,
          children: convertToMenuItems(childrenItems)
        };
      }
      
      return {
        key: item.path,
        icon,
        label: item.meta?.title
      };
    });
  };

  // 菜单点击
  const handleMenuClick = ({ key }) => {
    navigate(key);
  };

  // 子菜单展开/收起
  const handleOpenChange = (keys) => {
    setOpenKeys(keys);
  };

  return (
    <Sider
      width={220}
      collapsible
      collapsed={collapsed}
      className="sidebar-container"
      trigger={null}
    >
      <div className="logo">
        <img src={collapsed ? miniLogo : logo} alt="塔斯马尼亚旅游" />
      </div>
      <div className="sidebar-Menu">
        <Menu
          theme="light"
          mode="inline"
          items={menuItems}
          selectedKeys={[selectedKey]}
          openKeys={collapsed ? [] : openKeys}
          onOpenChange={handleOpenChange}
          onClick={handleMenuClick}
        />
      </div>
    </Sider>
  );
};

export default Sidebar;
