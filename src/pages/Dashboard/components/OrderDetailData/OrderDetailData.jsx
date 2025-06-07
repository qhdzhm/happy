import {
  cancel,
  complete,
  delivery,
  detail,
  getOrderList,
  getstatistics,
  handleAccept,
  reject,
} from "@/apis/Order";
import { Badge, Button, Table, message, Tabs, Tag, Modal, Select } from "antd";
import TextArea from "antd/es/input/TextArea";
import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
const OrderDetailData = () => {
  const columns = [
    {
      title: "Order number",
      dataIndex: "number",
      render: (text) => <p>{text}</p>,
    },
    {
      title: "Order Status",
      dataIndex: "status",
      render: (_, { status }) => (
        <>
          {orderCategoryTable.map((item) => {
            return item.value === status ? item.label : null;
          })}
        </>
      ),
    },

    {
      title: "User Name",
      dataIndex: "consignee",
      render: (text) => <p>{text}</p>,
    },
    {
      title: "Phone",
      dataIndex: "phone",
      render: (text) => <p>{text}</p>,
    },
    {
      title: "Address",
      dataIndex: "address",
    },
    {
      title: "Order Time",
      dataIndex: "orderTime",
    },
    {
      title: "Amount",
      dataIndex: "amount",
      render: (text) => `$${text}`,
    },
    {
      title: "Action",
      key: "action",
      render: (_, { status, id }) => (
        <div className="action-button flex">
          <div className="first-action">
            {status === 2 && (
              <Button
                style={{
                  backgroundColor: "rgb(246, 255, 237)",
                  borderColor: "rgb(183, 235, 143)",
                  color: "rgb(56, 158, 13)",
                  width: "80px",
                }}
                onClick={() => handleAcc(id)}
              >
                Accept
              </Button>
            )}
            {status === 3 && (
              <Button
                style={{
                  backgroundColor: "rgb(246, 255, 237)",
                  borderColor: "rgb(183, 235, 143)",
                  color: "rgb(56, 158, 13)",
                  width: "80px",
                }}
                onClick={() => handleDelivery(id)}
              >
                Delivery
              </Button>
            )}
            {status === 4 && (
              <Button
                style={{
                  backgroundColor: "rgb(246, 255, 237)",
                  borderColor: "rgb(183, 235, 143)",
                  color: "rgb(56, 158, 13)",
                  width: "80px",
                }}
                onClick={() => handleCompleted(id)}
              >
                Completed
              </Button>
            )}
          </div>
          <div className="second-action">
            {status === 2 && (
              <>
                <Button
                  style={{
                    backgroundColor: "rgb(255, 241, 240)",
                    borderColor: "rgb(255, 163, 158)",
                    color: "rgb(207, 19, 34)",
                    width: "80px",
                  }}
                  onClick={() => handleReject(id)}
                >
                  Reject
                </Button>
              </>
            )}
            {status !== 2 && status !== 6 && (
              <>
                <Button
                  style={{
                    backgroundColor: "rgb(255, 241, 240)",
                    borderColor: "rgb(255, 163, 158)",
                    color: "rgb(207, 19, 34)",
                    width: "80px",
                  }}
                  onClick={() => handleDecline(id)}
                >
                  Decline
                </Button>
              </>
            )}
          </div>
          <div className="third-action">
            <Button onClick={() => checkOrder(id)}>Check</Button>
          </div>
        </div>
      ),
    },
  ];

  //get Badge
  const [orderStatistics, setOrderStatistics] = useState({
    confirmed: "",
    deliveryInProgress: "",
    toBeConfirmed: "",
  });
  const [params, setParams] = useState({
    page: 1,
    pageSize: 10,
  });
  useEffect(() => {
    async function getBadge() {
      try {
        const res = await getstatistics();
        setOrderStatistics(res.data || res);
      } catch (error) {
        console.error('获取订单统计失败:', error);
        setOrderStatistics({});
      }
    }
    getBadge();
  }, [params]);
  //orderList
  const [orderList, setOrderList] = useState({
    total: "",
    records: [],
  });

  useEffect(() => {
    async function getOrders() {
      try {
        const res = await getOrderList(params);
        setOrderList(res.data || res);
      } catch (error) {
        console.error('获取订单列表失败:', error);
        setOrderList({ total: 0, records: [] });
      }
    }
    getOrders();
  }, [params]);
  //Order Category
  const orderCategory = [
    {
      label: "All Orders",
      value: 0,
    },
    {
      label: (
        <Badge color="warning" count={orderStatistics.toBeConfirmed}>
          Awaiting Acceptance
        </Badge>
      ),
      value: 2,
    },
    {
      label: (
        <Badge color="warning" count={orderStatistics.confirmed}>
          Pending Delivery
        </Badge>
      ),
      value: 3,
    },
  ];
  const orderCategoryTable = [
    {
      label: "All Orders",
      value: 0,
    },
    {
      label: "Awaiting Acceptance",
      value: 2,
    },
    {
      label: "Pending Delivery",
      value: 3,
    },
  ];
  //tab change handle
  const [activeTab, setActiveTab] = useState();

  const tabChange = (value) => {
    setActiveTab(value);
    value = value === 0 ? null : value;
    setActiveTab(value);
    setParams({
      ...params,
      page: 1,
      status: value,
      number: "",
      phone: "",
      beginTime: "",
      endTime: "",
    });
  };

  //handle page change
  const pageChange = (page, pageSize) => {
    setParams({
      ...params,
      page: page,
      pageSize: pageSize,
    });
  };

  //handle handleAccept
  const handleAcc = async (id) => {
    const res = await handleAccept(id);

    if (res.data.code !== 1) {
      message.error(res.data.msg);
      handleCheckDetailmodelCancel();
    } else {
      message.success("accept successed");
      handleCheckDetailmodelCancel();
      setOrderDetail({
        ...orderDetail,
        status: 3,
      });
      setParams({ ...params });
    }
  };

  //handleDelivery
  const handleDelivery = async (id) => {
    const res = await delivery(id);
    if (res.data.code !== 1) {
      message.error(res.data.msg);
      handleCheckDetailmodelCancel();
    } else {
      message.success("accept successed");
      handleCheckDetailmodelCancel();
      setOrderDetail({
        ...orderDetail,
        status: 4,
      });
      setParams({ ...params });
    }
  };

  // handleCompleted
  const handleCompleted = async (id) => {
    const res = await complete(id);
    if (res.data.code !== 1) {
      message.error(res.data.msg);
      handleCheckDetailmodelCancel();
    } else {
      message.success("accept successed");
      handleCheckDetailmodelCancel();
      setOrderDetail({
        ...orderDetail,
        status: 5,
      });
      setParams({ ...params });
    }
  };
  //handlecancel
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [cancelId, setCancelId] = useState("");
  const handleDecline = (id) => {
    setIsCancelModalOpen(true);
    setCancelId(id);
  };

  //cancel model dialog
  const cancelOrderReasonList = [
    {
      value: 1,
      label: "Too many orders, unable to accept at the moment",
    },
    {
      value: 2,
      label: "Dishes are sold out, unable to accept orders at the moment",
    },
    {
      value: 3,
      label: "Restaurant is closed, unable to accept orders at the moment",
    },
    {
      value: 0,
      label: "Custom reason",
    },
  ];
  const [customReasonFlag, setCustomReasonFlag] = useState(false);
  const [cancelReason, setCancelIdReason] = useState(
    "Too many orders, unable to accept at the moment"
  );
  const cancelReasonChange = (value) => {
    if (value === 0) {
      setCustomReasonFlag(true);
    } else {
      setCustomReasonFlag(false);

      setCancelIdReason(
        cancelOrderReasonList.find((e) => e.value === value).label
      );
    }
  };
  const customreason = (e) => {
    setCancelIdReason(e.target.value);
  };

  const handleCancelOK = async () => {
    const declineData = { id: cancelId, cancelReason: cancelReason };
    const res = await cancel(declineData);
    if (res.data.code !== 1) {
      message.error(res.data.msg);
      handleCheckDetailmodelCancel();
    } else {
      message.success("accept successed");
      handleCheckDetailmodelCancel();
      setOrderDetail({
        ...orderDetail,
        status: 6,
      });
      setParams({ ...params });
    }
  };
  const handleCancel = () => {
    setIsCancelModalOpen(false);
    setIsRejectModalOpen(false);
  };

  //reject order

  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [rejectId, setRejectId] = useState("");
  const handleReject = (id) => {
    setIsRejectModalOpen(true);
    setRejectId(id);
    handleCheckDetailmodelCancel();
  };

  const [customRejectReasonFlag, setCustomRejectReasonFlag] = useState(false);
  const [rejectReason, setRejectReason] = useState(
    "Too many orders, unable to accept at the moment"
  );
  const rejectReasonChange = (value) => {
    if (value === 0) {
      setCustomRejectReasonFlag(true);
    } else {
      setCustomRejectReasonFlag(false);
      const reason = cancelOrderReasonList.find((e) => e.value === value).label;
      console.log(reason);
      setRejectReason(reason);
    }
  };
  const customRejectReason = (e) => {
    console.log(e.target.value);
    setRejectReason(e.target.value);
  };

  const handleRejectOK = async () => {
    const rejectData = { id: rejectId, rejectionReason: rejectReason };
    const res = await reject(rejectData);
    if (res.data.code !== 1) {
      message.error(res.data.msg);
      setIsRejectModalOpen(false);
    } else {
      message.success("decline successed");
      setIsRejectModalOpen(false);
      setOrderDetail({
        ...orderDetail,
        status: 6,
      });
      setParams({ ...params });
    }
  };

  //check detail
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [orderDetail, setOrderDetail] = useState({});
  const checkOrder = async (id) => {
    setIsDetailModalOpen(true);
    const res = await detail(id);
    setOrderDetail(res.data.data);
  };

  const [searchParams] = useSearchParams();
  const id = searchParams.get("orderId");
  useEffect(() => {
    console.log(id);
    if (id) {
      checkOrder(id);
    }
  }, [id]);

  const handleCheckDetailmodelCancel = () => {
    setIsDetailModalOpen(false);
  };

  //display different base on status
  const statusButtons = {
    2: [
      <Button key="acceptBtn" onClick={() => handleAcc(orderDetail.id)}>
        Accept
      </Button>,
      <Button key="rejectBtn" onClick={() => handleReject(orderDetail.id)}>
        Reject
      </Button>,
    ],
    3: [
      <Button key="deliveryBtn" onClick={() => handleDelivery(orderDetail.id)}>
        delivery
      </Button>,
      <Button key="backBtn" onClick={handleCheckDetailmodelCancel}>
        Back
      </Button>,
    ],
    4: [
      <Button key="completeBtn" onClick={() => handleCompleted(orderDetail.id)}>
        Complete
      </Button>,
      <Button key="backBtn" onClick={handleCheckDetailmodelCancel}>
        Back
      </Button>,
    ],
    1: [
      <Button key="cancelBtn" onClick={() => handleDecline(orderDetail.id)}>
        cancel order
      </Button>,
      <Button key="backBtn" onClick={handleCheckDetailmodelCancel}>
        Back
      </Button>,
    ],
    5: [
      <Button key="backBtn" onClick={handleCheckDetailmodelCancel}>
        Back
      </Button>,
    ],
    6: [
      <Button key="backBtn" onClick={handleCheckDetailmodelCancel}>
        Back
      </Button>,
    ],
  };
  return (
    <div className="order-detail">
      <div className="header">
        <div className="title">
          <span>Order Detail</span>
          <div className="tabs">
            <Tabs
              defaultActiveKey="1"
              tabPosition="top"
              size="large"
              onChange={tabChange}
              items={orderCategory.map((tab, i) => {
                return {
                  label: tab.label,
                  key: tab.value,
                  children: (
                    <>
                      <div key={tab.value} className="table-container">
                        <div className="order-table">
                          <Table
                            columns={columns}
                            dataSource={orderList.records}
                            rowKey="id"
                            pagination={{
                              current: params.page,
                              pageSize: params.pageSize,
                              onChange: pageChange,
                              total: orderList.total,
                            }}
                          />
                        </div>
                      </div>
                    </>
                  ),
                };
              })}
            />
          </div>
          <div className="order-reject-model">
        <Modal
          title="Decline Reason"
          open={isRejectModalOpen}
          onOk={handleRejectOK}
          onCancel={handleCancel}
        >
          <Select
            defaultValue={1}
            options={cancelOrderReasonList}
            onChange={rejectReasonChange}
          />
          {customRejectReasonFlag && (
            <div className="custom-reason">
              <TextArea onChange={customRejectReason} />
            </div>
          )}
        </Modal>
      </div>
      <div className="order-check-model">
        <Modal
          className="order-model-dialog"
          open={isDetailModalOpen}
          onCancel={handleCheckDetailmodelCancel}
          footer={statusButtons[orderDetail.status] || []}
          width={900}
        >
          <div className="order-detail-container">
            <div className="order-detail-header">
              <div className="title">
                <span>Order Detail</span>
              </div>
            </div>
            <div className="order-detail-top">
              <div className="order-detail-top-left">
                <label>Order number:</label>
                <span>{orderDetail.number}</span>
                {orderCategoryTable.map((item) => {
                  return item.value === orderDetail.status ? (
                    <Tag color="magenta" key={item.value}>
                      {item.label}
                    </Tag>
                  ) : null;
                })}
              </div>
              <div className="order-detail-top-right">
                <label>Order Time:</label>
                <span>{orderDetail.orderTime}</span>
              </div>
            </div>
            <div className="order-detail-body">
              <div className="user-info">
                <div className="username">
                  <label>User Name : </label>
                  <span>{orderDetail.consignee}</span>
                </div>
                <div className="mobile-number">
                  <label>Mobile Number : </label>
                  <span>{orderDetail.phone}</span>
                </div>
                <div className="address">
                  <label>Address : </label>
                  <span>{orderDetail.address}</span>
                </div>

                {orderDetail.status === 5 && (
                  <div className="delivered-time">
                    <label>Delivered time</label>
                    <span>{orderDetail.deliveryTime}</span>
                  </div>
                )}

                {orderDetail.status !== 5 && orderDetail.status !== 6 && (
                  <div className="delivered-time">
                    <label>Estimated Delivery Time:</label>
                    <span>{orderDetail.estimatedDeliveryTime}</span>
                  </div>
                )}

                {orderDetail.status !== 6 && (
                  <div className="remark">
                    <Tag color="gold">Remark</Tag>
                    <span>{orderDetail.remark}</span>
                  </div>
                )}
                {orderDetail.status === 6 && (
                  <div className="cancel-reason">
                    <Tag>Cancel Reason</Tag>
                    {orderDetail.cancelReason ? (
                      <span>{orderDetail.cancelReason}</span>
                    ) : (
                      <span>{orderDetail.rejectionReason}</span>
                    )}
                  </div>
                )}
              </div>

              <div className="order-info">
                <div className="dish-title">
                  <span>Dish</span>
                </div>
                <div className="dish-List">
                  {orderDetail.orderDetailList?.map((item) => {
                    return (
                      <div key={item.id} className="dish-item">
                        <div className="dish-item-box">
                          <span className="dish-name">{item.name}</span>
                          <span className="dish-num">x{item.number}</span>
                        </div>
                        <span className="dish-price">
                          ${item.amount ? item.amount.toFixed(2) : ""}
                        </span>
                      </div>
                    );
                  })}
                  <div className="dish-all-amount">
                    <label>Total Amount</label>
                    <span>
                      $
                      {(
                        orderDetail.amount -
                        6 -
                        orderDetail.packAmount
                      ).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="order-detail-amount">
                <div className="amount-label">Amount </div>
                <div className="amount-list">
                  <div className="dish-amount">
                    <span className="amount-name">Dish amount: </span>
                    <span className="amount-price">
                      $
                      {((
                        orderDetail.amount -
                        6 -
                        orderDetail.packAmount
                      ).toFixed(2) *
                        100) /
                        100}
                    </span>
                  </div>

                  <div className="delivery-amount">
                    <span className="amount-name">Delivery Amount: </span>
                    <span className="amount-price">${6}</span>
                  </div>

                  <div className="package-amount">
                    <span className="amount-name">Package Amount: </span>
                    <span className="amount-price">
                      $
                      {orderDetail.packAmount
                        ? (orderDetail.packAmount.toFixed(2) * 100) / 100
                        : ""}
                    </span>
                  </div>

                  <div className="total-amount">
                    <span className="amount-name">Total: </span>
                    <span className="amount-price">
                      $
                      {orderDetail.amount
                        ? (orderDetail.amount.toFixed(2) * 100) / 100
                        : ""}
                    </span>
                  </div>
                  <div className="pay-type">
                    <span className="pay-name">Payment Method: </span>
                    <span className="pay-value">
                      {orderDetail.payMethod === 1 ? "WechatPay" : "AliPay"}
                    </span>
                  </div>

                  <div className="pay-time">
                    <span className="pay-name">Payment Time: </span>
                    <span className="pay-value">
                      {orderDetail.checkoutTime}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Modal>
        <div className="order-cancel-model">
        <Modal
          title="Decline Reason"
          open={isCancelModalOpen}
          onOk={handleCancelOK}
          onCancel={handleCancel}
        >
          <Select
            defaultValue={1}
            options={cancelOrderReasonList}
            onChange={cancelReasonChange}
          />
          {customReasonFlag && (
            <div className="custom-reason">
              <TextArea onChange={customreason} />
            </div>
          )}
        </Modal>
      </div>
      </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetailData;
