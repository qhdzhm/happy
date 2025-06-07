import {
  get1stAndToday,
  past30Day,
  past7Day,
  pastMonth,
  pastWeek,
} from "@/utils/dateTimeFormat";
import { Button, Menu, Popconfirm } from "antd";
import React, { useEffect, useState } from "react";
import TurnoverStatistics from "./components/TurnoverStatistics";
import {
  exportInfor,
  getOrderStatistics,
  getTop,
  getTurnoverStatistics,
  getUserStatistics,
} from "@/apis/report";
import UserStatistics from "./components/UserStatistics";
import { OrderStatistics } from "./components/OrderStatistics";
import Top10 from "./components/Top10";
import "./Statistics.scss";
const Statistic = () => {
  const items = [
    {
      label: "Yesterday",
      key: get1stAndToday(),
    },
    {
      label: "Past 7 days ",
      key: past7Day(),
    },
    {
      label: "past 30 days",
      key: past30Day(),
    },
    {
      key: pastWeek(),
      label: "past week",
    },
    {
      key: pastMonth(),
      label: "past month",
    },
  ];
  const past7Days = past7Day().join();
  const [current, setCurrent] = useState(past7Days);

  const onClick = (e) => {
    console.log("click ", e);
    setCurrent(e.key);
  };

  const [turnoverData, setTurnoverData] = useState({
    dateList: "",
    turnoverList: "",
  });
  useEffect(() => {
    console.log(current);
    const dates = current.split(",");
    getTurnoverStatisticsData(dates[0], dates[1]);
    getUserStatisticsData(dates[0], dates[1]);
    getOrderStatisticsData(dates[0], dates[1]);
    getTop10Data(dates[0], dates[1]);
  }, [current]);

  //get turnover data
  async function getTurnoverStatisticsData(begin, end) {
    try {
      const data = await getTurnoverStatistics({ begin: begin, end: end });
      const turnover = data.data || data;
      setTurnoverData({
        dateList: turnover.dateList ? turnover.dateList.split(",") : [],
        turnoverList: turnover.turnoverList ? turnover.turnoverList.split(",") : [],
      });
    } catch (error) {
      console.error('获取营业额统计失败:', error);
      setTurnoverData({ dateList: [], turnoverList: [] });
    }
  }

  //get userStatistics
  const [userData, setUserData] = useState({
    dateList: "",
    newUserList: "",
    totalUserList: "",
  });
  async function getUserStatisticsData(begin, end) {
    try {
      const data = await getUserStatistics({ begin: begin, end: end });
      const udata = data.data || data;
      setUserData({
        dateList: udata.dateList ? udata.dateList.split(",") : [],
        newUserList: udata.newUserList ? udata.newUserList.split(",") : [],
        totalUserList: udata.totalUserList ? udata.totalUserList.split(",") : [],
      });
    } catch (error) {
      console.error('获取用户统计失败:', error);
      setUserData({ dateList: [], newUserList: [], totalUserList: [] });
    }
  }
  //get top10
  const [top10Data, setTop10Data] = useState({ nameList: "", numberList: "" });
  async function getTop10Data(begin, end) {
    try {
      const data = await getTop({ begin: begin, end: end });
      const tdata = data.data || data;
      setTop10Data({
        nameList: tdata.nameList ? tdata.nameList.split(",").reverse() : [],
        numberList: tdata.numberList ? tdata.numberList.split(",").reverse() : [],
      });
    } catch (error) {
      console.error('获取Top10数据失败:', error);
      setTop10Data({ nameList: [], numberList: [] });
    }
  }
  console.log(top10Data);
  //get OrderStatistics
  const [orderData, setOrderData] = useState({
    dateList: "",
    orderCompletionRate: "",
    orderCountList: "",
    totalOrderCount: "",
    validOrderCount: "",
    validOrderCountList: "",
  });

  async function getOrderStatisticsData(begin, end) {
    try {
      const data = await getOrderStatistics({ begin: begin, end: end });
      const odata = data.data || data;
      setOrderData({
        ...odata,
        dateList: odata.dateList ? odata.dateList.split(",") : [],
        orderCountList: odata.orderCountList ? odata.orderCountList.split(",") : [],
        validOrderCountList: odata.validOrderCountList ? odata.validOrderCountList.split(",") : [],
      });
    } catch (error) {
      console.error('获取订单统计失败:', error);
      setOrderData({
        dateList: [],
        orderCompletionRate: 0,
        orderCountList: [],
        totalOrderCount: 0,
        validOrderCount: 0,
        validOrderCountList: [],
      });
    }
  }
  //get dates
  let parts = current.split(",");
  let part1 = parts[0];
  let part2 = parts[1];

 

  //handle download

  const confirm = async () => {
    try {
      const response = await exportInfor();
      const url = window.URL.createObjectURL(response.data);
      const a = document.createElement("a");
      document.body.appendChild(a);
      a.href = url;
      a.download = "statistics.xlsx";
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("download error:", error);
    } 
  };

  

  return (
    <>
      <div className="statitic">
        <div className="header  flex">
          <div className="date-menu">
            <Menu
              onClick={onClick}
              selectedKeys={[current]}
              mode="horizontal"
              items={items}
            />
          </div>
          <div className="date-selected">
            <label>
              Selected date: from <span>{part1}</span> to <span>{part2}</span>
            </label>
          </div>
          <Popconfirm
            title="Data Export"
            description="Are you sure to export the statistics of the last 30 days?"
            onConfirm={confirm}
            okText="Yes"
            cancelText="No"
          >
            <Button type="primary">Export of data</Button>
          </Popconfirm>
        </div>
        <div className="body flex">
          <TurnoverStatistics turnoverData={turnoverData} />
          <UserStatistics userData={userData}></UserStatistics>
          <OrderStatistics orderData={orderData} />
          <Top10 top10Data={top10Data} />
        </div>
      </div>
    </>
  );
};

export default Statistic;
