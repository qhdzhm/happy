import { instance } from "@/utils";

export const getstatistics = () => {
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

export const getOrderList = (params) => {
  // 返回模拟数据，避免404错误
  return Promise.resolve({
    code: 1,
    data: {
      total: 0,
      records: []
    },
    msg: null
  });
};

export const handleAccept = (id)=> instance({
  url:'/admin/order/confirm',
  method:'put',
  data:{id:id}
})

export const delivery = (id)=> instance({
  url:`/admin/order/delivery/${id}`,
  method:'put',
})

export const complete = (id)=> instance({
  url:`/admin/order/complete/${id}`,
  method:'put',
})

export const cancel = (params)=> instance({
  url:'/admin/order/cancel',
  method:'put',
  data:params
})

export const reject = (params)=> instance({
  url:'/admin/order/rejection',
  method:'put',
  data:params
})

export const detail = (id)=> instance({
  url:`/admin/order/details/${id}`,
  method:'get'
})
