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
import BookingManagement from "@/pages/Booking/BookingManagement";
import Vehicle from "@/pages/Vehicle/Vehicle";
import AddVehicle from "@/pages/Vehicle/AddVehicle/AddVehicle";
import Employee from "@/pages/Employee/Employee";
import AddEmployee from "@/pages/Employee/AddEmployee/AddEmployee";
import { CarOutlined } from "@ant-design/icons";

const router = createBrowserRouter([
  {
    path: "/",
    element: (
      <AuthRoute>
        <Layout />
      </AuthRoute>
    ),
    children: [
      {
        path: "/",
        element: <Dashboard />,
        meta: {
          title: "仪表盘",
          icon: "HomeOutlined", 
          affix: true
        }
      },
      {
        path: "/statistics",
        element: <Statistic />,
        meta: {
          title: "数据统计",
          icon: "PieChartOutlined" 
        }
      },
      {
        path: "/booking",
        element: <BookingManagement />,
        meta: {
          title: "订单管理",
          icon: "OrderedListOutlined" 
        }
      },
      {
        path: "/daytour",
        element: <DayTours />,
        meta: {
          title: "一日游管理",
          icon: "CompassOutlined" 
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
        path: "/grouptour",
        element: <GroupTours />,
        meta: {
          title: "团队游管理",
          icon: "TeamOutlined" 
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
      {
        path: "/vehicle",
        element: <Vehicle />,
        meta: {
          title: "车辆管理",
          icon: "CarOutlined" 
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
        path: "/employee",
        element: <Employee />,
        meta: {
          title: "员工管理",
          icon: "UserSwitchOutlined" 
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
      {
        path: "/agent",
        element: <Agents />,
        meta: {
          title: "代理商管理",
          icon: "ShopOutlined" 
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
      {
        path: "/user",
        element: <Users />,
        meta: {
          title: "客户管理",
          icon: "UserOutlined" 
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
