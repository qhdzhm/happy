import { instance } from "@/utils";

export const getTurnoverStatistics = (params) => {
  // 返回模拟数据，避免404错误
  const { begin, end } = params;
  const startDate = new Date(begin);
  const endDate = new Date(end);
  const dateList = [];
  const turnoverList = [];
  
  // 生成日期范围内的模拟数据
  for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
    dateList.push(d.toISOString().split('T')[0]);
    turnoverList.push((Math.random() * 5000 + 1000).toFixed(2)); // 随机营业额
  }
  
  return Promise.resolve({
    code: 1,
    data: {
      dateList: dateList.join(','),
      turnoverList: turnoverList.join(',')
    },
    msg: null
  });
};

export const getUserStatistics = (params) => {
  // 返回模拟数据，避免404错误
  const { begin, end } = params;
  const startDate = new Date(begin);
  const endDate = new Date(end);
  const dateList = [];
  const newUserList = [];
  const totalUserList = [];
  
  let totalUsers = 1000; // 初始用户数
  
  // 生成日期范围内的模拟数据
  for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
    dateList.push(d.toISOString().split('T')[0]);
    const newUsers = Math.floor(Math.random() * 50 + 10); // 每天新增用户
    newUserList.push(newUsers);
    totalUsers += newUsers;
    totalUserList.push(totalUsers);
  }
  
  return Promise.resolve({
    code: 1,
    data: {
      dateList: dateList.join(','),
      newUserList: newUserList.join(','),
      totalUserList: totalUserList.join(',')
    },
    msg: null
  });
};

export const getOrderStatistics = (params) => {
  // 返回模拟数据，避免404错误
  const { begin, end } = params;
  const startDate = new Date(begin);
  const endDate = new Date(end);
  const dateList = [];
  const orderCountList = [];
  const validOrderCountList = [];
  
  let totalOrderCount = 0;
  let validOrderCount = 0;
  
  // 生成日期范围内的模拟数据
  for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
    dateList.push(d.toISOString().split('T')[0]);
    const dayOrders = Math.floor(Math.random() * 100 + 20); // 每天订单数
    const dayValidOrders = Math.floor(dayOrders * 0.8); // 80%有效订单
    orderCountList.push(dayOrders);
    validOrderCountList.push(dayValidOrders);
    totalOrderCount += dayOrders;
    validOrderCount += dayValidOrders;
  }
  
  const orderCompletionRate = totalOrderCount > 0 ? (validOrderCount / totalOrderCount * 100).toFixed(2) : 0;
  
  return Promise.resolve({
    code: 1,
    data: {
      dateList: dateList.join(','),
      orderCountList: orderCountList.join(','),
      validOrderCountList: validOrderCountList.join(','),
      totalOrderCount: totalOrderCount,
      validOrderCount: validOrderCount,
      orderCompletionRate: orderCompletionRate
    },
    msg: null
  });
};

export const getTop = (params) => {
  // 返回模拟Top10数据，避免404错误
  const dishes = [
    '塔斯马尼亚三文鱼', '袋鼠肉排', '塔斯马尼亚蜂蜜', '当地红酒', 
    '海鲜拼盘', '羊肉卷', '澳洲牛排', '龙虾', '生蚝', '巧克力蛋糕'
  ];
  
  const nameList = dishes.slice(0, 10);
  const numberList = nameList.map(() => Math.floor(Math.random() * 200 + 50)); // 随机销量
  
  return Promise.resolve({
    code: 1,
    data: {
      nameList: nameList.join(','),
      numberList: numberList.join(',')
    },
    msg: null
  });
};

export function exportInfor() {
  // 返回模拟Excel文件，避免404错误
  const csvContent = "日期,营业额,订单数,用户数\n2024-01-01,1500.00,25,10\n2024-01-02,1800.00,30,12";
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  
  return Promise.resolve({
    data: blob
  });
}
