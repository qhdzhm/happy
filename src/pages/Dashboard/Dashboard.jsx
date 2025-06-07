import React, { useEffect, useState } from "react";
import DayStatistics from "./components/daystatistics/DayStatistics";
import { getBusinessData, getOrderData ,getOverviewDishes, getSetMealStatistics } from "@/apis/Dashboard";
import OrderManager from "./components/orderManager/OrderManager";
import DishAndMealDB from "./components/DishAndMealDB/DishAndMealDB";
import OrderDetailData from "./components/OrderDetailData/OrderDetailData";

const Dashboard = () => {
  useEffect(()=>{
    getDayData()
    getDayOrder()
    getDishData()
    getMealData()
  },[])
  //dayOverview
  const [dayData,setDayData] = useState({});

  async function getDayData() {
    try {
      const res = await getBusinessData();
      setDayData(res.data || res);
    } catch (error) {
      console.error('获取业务数据失败:', error);
      setDayData({});
    }
  }

  //day Orders
  const [orderData,setOrderData] = useState({})
  async function getDayOrder() {
    try {
      const data = await getOrderData();
      setOrderData(data.data || data);
    } catch (error) {
      console.error('获取订单数据失败:', error);
      setOrderData({});
    }
  }
  //dish and meal overviews
  const [dishData,setDishData] = useState({})
  const [mealData,setMealData] = useState({})
  async function getDishData() {
    try {
      const data = await getOverviewDishes();
      setDishData(data.data || data);
    } catch (error) {
      console.error('获取菜品数据失败:', error);
      setDishData({});
    }
  }
  async function getMealData() {
    try {
      const data = await getSetMealStatistics();
      setMealData(data.data || data);
    } catch (error) {
      console.error('获取套餐数据失败:', error);
      setMealData({});
    }
  }
  console.log(dishData);
  console.log(mealData);

  
  return (
    <div className="dash-container">
      <DayStatistics dayData={dayData}/>
      <OrderManager orderData={orderData}/>
      <DishAndMealDB dishData={dishData} mealData={mealData}/> 
      <OrderDetailData />
    </div>
  );
};

export default Dashboard;
