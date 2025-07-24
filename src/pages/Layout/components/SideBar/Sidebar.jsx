import React, { useEffect, useState } from "react";
import { Layout, Menu } from "antd";
import {
  HomeOutlined,
  PieChartOutlined,
  OrderedListOutlined,
  UnorderedListOutlined,
  CompassOutlined,
  TeamOutlined,
  UserOutlined,
  CarOutlined,
  GlobalOutlined,
  ShopOutlined,
  UserSwitchOutlined,
  CustomerServiceOutlined,
  AppstoreOutlined,
  ControlOutlined,
  ToolOutlined,
  BankOutlined,
  PercentageOutlined,
  CreditCardOutlined,
  TransactionOutlined,
  MessageOutlined,
  CommentOutlined,
  ScheduleOutlined,
  DeploymentUnitOutlined
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
    UnorderedListOutlined: <UnorderedListOutlined />,
    CompassOutlined: <CompassOutlined />,
    TeamOutlined: <TeamOutlined />,
    UserOutlined: <UserOutlined />,
    CarOutlined: <CarOutlined />,
    GlobalOutlined: <GlobalOutlined />,
    ShopOutlined: <ShopOutlined />,
    UserSwitchOutlined: <UserSwitchOutlined />,
    CustomerServiceOutlined: <CustomerServiceOutlined />,
    AppstoreOutlined: <AppstoreOutlined />,
    ControlOutlined: <ControlOutlined />,
    ToolOutlined: <ToolOutlined />,
    BankOutlined: <BankOutlined />,
    PercentageOutlined: <PercentageOutlined />,
    CreditCardOutlined: <CreditCardOutlined />,
    TransactionOutlined: <TransactionOutlined />,
    MessageOutlined: <MessageOutlined />,
    CommentOutlined: <CommentOutlined />,
    ScheduleOutlined: <ScheduleOutlined />,
    DeploymentUnitOutlined: <DeploymentUnitOutlined />
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
      
      // 按组分类菜单项
      const items = groupMenuItems(filteredMenus);
      setMenuItems(items);
      
      // 设置默认展开的菜单
      const pathname = location.pathname;
      const currentRoute = filteredMenus.find(route => route.path === pathname);
      if (currentRoute && currentRoute.meta?.group && currentRoute.meta.group !== 'core') {
        setOpenKeys([currentRoute.meta.group]);
      }
    }
  }, [location.pathname]);

  // 按组分类菜单项
  const groupMenuItems = (routeItems) => {
    const groups = {};
    const coreItems = [];

    // 分组处理
    routeItems.forEach(item => {
      const group = item.meta?.group;
      
      if (group === 'core' || !group) {
        // 核心菜单项直接放在顶层
        coreItems.push({
          key: item.path,
          icon: getIcon(item.meta?.icon),
          label: item.meta?.title
        });
      } else {
        // 其他菜单项按组分类
        if (!groups[group]) {
          groups[group] = {
            key: group,
            icon: getIcon(item.meta?.groupIcon),
            label: item.meta?.groupTitle,
            children: []
          };
        }
        
        groups[group].children.push({
          key: item.path,
          icon: getIcon(item.meta?.icon),
          label: item.meta?.title
        });
      }
    });

    // 合并核心菜单和分组菜单
    return [...coreItems, ...Object.values(groups)];
  };

  // 菜单点击
  const handleMenuClick = ({ key }) => {
    // 如果是分组key，不进行导航
    if (!key.startsWith('/')) {
      return;
    }
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
