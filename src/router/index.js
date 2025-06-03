// 删除此文件中的所有内容，因为路由已在route.jsx中配置 

// 导入订单管理页面
import OrderList from '../pages/orders/OrderList';
import OrderDetail from '../pages/orders/OrderDetail';
import OrderEdit from '../pages/orders/OrderEdit';

// 路由配置
const routes = [
  // ... 其他路由配置
  
  // 订单管理路由
  {
    path: '/orders',
    element: <OrderList />,
    meta: {
      title: '订单管理',
      auth: true
    }
  },
  {
    path: '/orders/detail/:bookingId',
    element: <OrderDetail />,
    meta: {
      title: '订单详情',
      auth: true
    }
  },
  {
    path: '/orders/edit/:bookingId',
    element: <OrderEdit />,
    meta: {
      title: '编辑订单',
      auth: true
    }
  }
  
  // ... 其他路由配置
];

export default routes; 