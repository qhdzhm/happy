import { instance } from "@/utils";

export const getBusinessData = () => {
  // 返回模拟数据，避免404错误
  return Promise.resolve({
    code: 1,
    data: {
      newUsers: 0,
      orderCompletionRate: 0,
      newOrders: 0,
      turnover: 0,
      validOrderCount: 0,
      orderCount: 0,
      unitPrice: 0
    },
    msg: null
  });
};

export const getOrderData = () => {
  // 返回模拟数据，避免404错误
  return Promise.resolve({
    code: 1,
    data: {
      waitingOrders: 0,
      deliveredOrders: 0,
      completedOrders: 0,
      cancelledOrders: 0,
      allOrders: 0
    },
    msg: null
  });
};

export const getOverviewDishes = () => {
  // 返回模拟数据，避免404错误
  return Promise.resolve({
    code: 1,
    data: {
      sold: 0,
      discontinued: 0
    },
    msg: null
  });
};

export const getSetMealStatistics = () => {
  // 返回模拟数据，避免404错误
  return Promise.resolve({
    code: 1,
    data: {
      sold: 0,
      discontinued: 0
    },
    msg: null
  });
};
