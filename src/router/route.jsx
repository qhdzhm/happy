import { createBrowserRouter } from "react-router-dom";
import Layout from "@/pages/Layout/Layout";
import Login from "@/pages/Login/Login";
import AuthRoute from "@/components/AuthRoute";
import Dashboard from "@/pages/Dashboard/Dashboard";
import Statistic from "@/pages/Statistics/Statistic";
import Users from "@/pages/User/Users";
import AddUser from "@/pages/User/AddUser/AddUser";
import Agents from "@/pages/Agent/Agents";
import AddAgent from "@/pages/Agent/AddAgent/AddAgent";
import DayTours from "@/pages/DayTour/DayTours";
import DayTourDetail from "@/pages/DayTour/DayTourDetail/DayTourDetail";
import ThemeManagement from "@/pages/DayTour/ThemeManagement/ThemeManagement";
import SuitableManagement from "@/pages/DayTour/SuitableManagement/SuitableManagement";
import GroupTours from "@/pages/GroupTour/GroupTours";
import GroupTourDetail from "@/pages/GroupTour/GroupTourDetail/GroupTourDetail";
import Vehicle from "@/pages/Vehicle/Vehicle";
import AddVehicle from "@/pages/Vehicle/AddVehicle/AddVehicle";
import Employee from "@/pages/Employee/Employee";
import AddEmployee from "@/pages/Employee/AddEmployee/AddEmployee";
import { CarOutlined } from "@ant-design/icons";
import AgentCreditManagement from "@/pages/Credit/AgentCredit";
import TransactionListPage from "@/pages/Credit/TransactionList";

// 导入订单管理相关组件
import OrderList from "@/pages/orders/OrderList";
import OrderDetail from "@/pages/orders/OrderDetail";
import OrderEdit from "@/pages/orders/OrderEdit";

// 导入行程安排组件
import TourArrangement from "@/pages/TourArrangement";

// 导入行程单页面组件
import TourItinerary from "@/pages/TourItinerary";

// 导入客服管理组件
import CustomerService from "@/pages/CustomerService/CustomerService";
import ServiceWorkbench from "@/pages/CustomerService/ServiceWorkbench";
import SessionManagement from "@/pages/CustomerService/SessionManagement";

// 导入旅游团分配组件
import TourAssignment from "@/pages/TourAssignment";

// 导入折扣管理组件
import DiscountManagement from "@/pages/DiscountManagement/DiscountManagement";

// 导入酒店预订管理组件
import HotelBookingList from "@/pages/HotelBooking/HotelBookingList";
import HotelBookingDetail from "@/pages/HotelBooking/HotelBookingDetail";
import HotelBookingForm from "@/pages/HotelBooking/HotelBookingForm";
import HotelManagement from "@/pages/HotelBooking/HotelManagement";

const router = createBrowserRouter([
  {
    path: "/",
    element: (
      <AuthRoute>
        <Layout />
      </AuthRoute>
    ),
    children: [
      // 核心业务模块
      {
        path: "/",
        element: <Dashboard />,
        meta: {
          title: "仪表盘",
          icon: "HomeOutlined", 
          affix: true,
          group: "core"
        }
      },
      {
        path: "/statistics",
        element: <Statistic />,
        meta: {
          title: "数据统计",
          icon: "PieChartOutlined",
          group: "core"
        }
      },
      
      // 订单与预订管理模块
      {
        path: "/orders",
        element: <OrderList />,
        meta: {
          title: "订单列表",
          icon: "UnorderedListOutlined",
          group: "order-management",
          groupTitle: "订单预订",
          groupIcon: "OrderedListOutlined"
        }
      },
      {
        path: "/hotel-bookings",
        element: <HotelBookingList />,
        meta: {
          title: "酒店预订管理",
          icon: "HomeOutlined",
          group: "order-management",
          groupTitle: "订单预订",
          groupIcon: "OrderedListOutlined"
        }
      },
      {
        path: "/orders/detail/:bookingId",
        element: <OrderDetail />,
        meta: {
          title: "订单详情",
          hidden: true
        }
      },
      {
        path: "/orders/edit/:bookingId",
        element: <OrderEdit />,
        meta: {
          title: "编辑订单",
          hidden: true
        }
      },
      {
        path: "/hotel-bookings/detail/:bookingReference",
        element: <HotelBookingDetail />,
        meta: {
          title: "预订详情",
          hidden: true
        }
      },
      {
        path: "/hotel-bookings/add",
        element: <HotelBookingForm />,
        meta: {
          title: "新增预订",
          hidden: true
        }
      },
      {
        path: "/hotel-bookings/edit/:id",
        element: <HotelBookingForm />,
        meta: {
          title: "编辑预订",
          hidden: true
        }
      },
      
      // 产品管理模块
      {
        path: "/daytour",
        element: <DayTours />,
        meta: {
          title: "一日游管理",
          icon: "CompassOutlined",
          group: "product-management",
          groupTitle: "产品管理",
          groupIcon: "AppstoreOutlined"
        }
      },
      {
        path: "/grouptour",
        element: <GroupTours />,
        meta: {
          title: "团队游管理",
          icon: "TeamOutlined",
          group: "product-management",
          groupTitle: "产品管理",
          groupIcon: "AppstoreOutlined"
        }
      },
      {
        path: "/hotel-management",
        element: <HotelManagement />,
        meta: {
          title: "酒店管理",
          icon: "BankOutlined",
          group: "product-management",
          groupTitle: "产品管理",
          groupIcon: "AppstoreOutlined"
        }
      },
      {
        path: "/daytour/add",
        element: <DayTourDetail />,
        meta: {
          title: "添加一日游",
          hidden: true
        }
      },
      {
        path: "/daytour/edit",
        element: <DayTourDetail />,
        meta: {
          title: "编辑一日游",
          hidden: true
        }
      },
      {
        path: "/daytour/themes",
        element: <ThemeManagement />,
        meta: {
          title: "主题管理",
          hidden: true
        }
      },
      {
        path: "/daytour/suitable",
        element: <SuitableManagement />,
        meta: {
          title: "适合人群管理",
          hidden: true
        }
      },
      {
        path: "/grouptour/add",
        element: <GroupTourDetail />,
        meta: {
          title: "添加团队游",
          hidden: true
        }
      },
      {
        path: "/grouptour/edit",
        element: <GroupTourDetail />,
        meta: {
          title: "编辑团队游",
          hidden: true
        }
      },
      
      // 运营管理模块
      {
        path: "/tour-arrangement",
        element: <TourArrangement />,
        meta: {
          title: "行程安排",
          icon: "ScheduleOutlined",
          group: "operation-management",
          groupTitle: "运营管理",
          groupIcon: "ControlOutlined"
        }
      },
      {
        path: "/tour-assignment",
        element: <TourAssignment />,
        meta: {
          title: "分配管理",
          icon: "DeploymentUnitOutlined",
          group: "operation-management",
          groupTitle: "运营管理",
          groupIcon: "ControlOutlined"
        }
      },
      {
        path: "/tour-itinerary",
        element: <TourItinerary />,
        meta: {
          title: "导游用车分配表",
          hidden: true
        }
      },
      
      // 资源管理模块
      {
        path: "/vehicle",
        element: <Vehicle />,
        meta: {
          title: "车辆管理",
          icon: "CarOutlined",
          group: "resource-management",
          groupTitle: "资源管理",
          groupIcon: "ToolOutlined"
        }
      },
      {
        path: "/employee",
        element: <Employee />,
        meta: {
          title: "员工管理",
          icon: "UserSwitchOutlined",
          group: "resource-management",
          groupTitle: "资源管理",
          groupIcon: "ToolOutlined"
        }
      },
      {
        path: "/vehicle/add",
        element: <AddVehicle />,
        meta: {
          title: "添加车辆",
          hidden: true
        }
      },
      {
        path: "/vehicle/edit/:id",
        element: <AddVehicle />,
        meta: {
          title: "编辑车辆",
          hidden: true
        }
      },
      {
        path: "/employee/add",
        element: <AddEmployee />,
        meta: {
          title: "添加员工",
          hidden: true
        }
      },
      {
        path: "/employee/edit/:id",
        element: <AddEmployee />,
        meta: {
          title: "编辑员工",
          hidden: true
        }
      },
      
      // 代理商管理模块
      {
        path: "/agent",
        element: <Agents />,
        meta: {
          title: "代理商管理",
          icon: "UserOutlined",
          group: "agent-management",
          groupTitle: "代理商管理",
          groupIcon: "ShopOutlined"
        }
      },
      {
        path: "/discount",
        element: <DiscountManagement />,
        meta: {
          title: "折扣设置管理",
          icon: "PercentageOutlined",
          group: "agent-management",
          groupTitle: "代理商管理",
          groupIcon: "ShopOutlined"
        }
      },
      {
        path: "/credit",
        element: <AgentCreditManagement />,
        meta: {
          title: "信用额度管理",
          icon: "CreditCardOutlined",
          group: "agent-management",
          groupTitle: "代理商管理",
          groupIcon: "ShopOutlined"
        }
      },
      {
        path: "/credit/transactions",
        element: <TransactionListPage />,
        meta: {
          title: "信用交易记录",
          icon: "TransactionOutlined",
          group: "agent-management",
          groupTitle: "代理商管理",
          groupIcon: "ShopOutlined"
        }
      },
      {
        path: "/agent/add",
        element: <AddAgent />,
        meta: {
          title: "添加代理商",
          hidden: true
        }
      },
      
      // 客户服务模块
      {
        path: "/user",
        element: <Users />,
        meta: {
          title: "客户管理",
          icon: "UserOutlined",
          group: "customer-service-management",
          groupTitle: "客户服务",
          groupIcon: "CustomerServiceOutlined"
        }
      },
      {
        path: "/customer-service",
        element: <CustomerService />,
        meta: {
          title: "客服管理",
          icon: "TeamOutlined",
          group: "customer-service-management",
          groupTitle: "客户服务",
          groupIcon: "CustomerServiceOutlined"
        }
      },
      {
        path: "/customer-service/workbench",
        element: <ServiceWorkbench />,
        meta: {
          title: "客服工作台",
          icon: "MessageOutlined",
          group: "customer-service-management",
          groupTitle: "客户服务",
          groupIcon: "CustomerServiceOutlined"
        }
      },
      {
        path: "/customer-service/sessions",
        element: <SessionManagement />,
        meta: {
          title: "会话管理",
          icon: "CommentOutlined",
          group: "customer-service-management",
          groupTitle: "客户服务",
          groupIcon: "CustomerServiceOutlined"
        }
      },
      {
        path: "/user/add",
        element: <AddUser />,
        meta: {
          title: "添加客户",
          hidden: true
        }
      }
    ],
  },
  {
    path: "/Login",
    element: <Login />,
    meta: { title: "Happy Tassie Travel - 后台管理系统", hidden: true, notNeedAuth: true },
  },
]);
export default router;
