import React, { useState, useEffect } from 'react'
import {
  Card,
  Descriptions,
  Button,
  Space,
  Tag,
  message,
  Modal,
  Select,
  Divider,
  Row,
  Col,
  Timeline,
  Image
} from 'antd'
import {
  ArrowLeftOutlined,
  EditOutlined,
  PrinterOutlined,
  PhoneOutlined,
  MailOutlined,
  CalendarOutlined,
  HomeOutlined,
  UserOutlined
} from '@ant-design/icons'
import { useParams, useNavigate } from 'react-router-dom'
import {
  getHotelBookingByReference,
  updateHotelBookingStatus
} from '@/apis/hotel'
import dayjs from 'dayjs'

const { Option } = Select

const HotelBookingDetail = () => {
  const { bookingReference } = useParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState({})
  const [statusModalVisible, setStatusModalVisible] = useState(false)
  const [newStatus, setNewStatus] = useState('')

  // 预订状态选项
  const statusOptions = [
    { label: '待确认', value: 'pending', color: 'orange' },
    { label: '已确认', value: 'confirmed', color: 'blue' },
    { label: '已入住', value: 'checked_in', color: 'green' },
    { label: '已退房', value: 'checked_out', color: 'default' },
    { label: '已取消', value: 'cancelled', color: 'red' }
  ]

  // 获取状态标签颜色
  const getStatusColor = (status) => {
    const option = statusOptions.find(item => item.value === status)
    return option ? option.color : 'default'
  }

  // 获取状态标签文本
  const getStatusText = (status) => {
    const option = statusOptions.find(item => item.value === status)
    return option ? option.label : status
  }

  // 获取数据
  const fetchData = async () => {
    if (!bookingReference) return
    
    setLoading(true)
    try {
      const response = await getHotelBookingByReference(bookingReference)
      if (response.code === 1) {
        setData(response.data || {})
      } else {
        message.error(response.msg || '获取预订详情失败')
      }
    } catch (error) {
      console.error('获取预订详情失败:', error)
      message.error('获取预订详情失败')
    } finally {
      setLoading(false)
    }
  }

  // 更新状态
  const handleUpdateStatus = async () => {
    if (!newStatus) {
      message.warning('请选择新状态')
      return
    }

    try {
      const response = await updateHotelBookingStatus(data.id, newStatus)
      if (response.code === 1) {
        message.success('状态更新成功')
        setStatusModalVisible(false)
        setNewStatus('')
        fetchData()
      } else {
        message.error(response.msg || '状态更新失败')
      }
    } catch (error) {
      console.error('状态更新失败:', error)
      message.error('状态更新失败')
    }
  }

  // 返回列表
  const handleBack = () => {
    navigate('/hotel-bookings')
  }

  // 编辑预订
  const handleEdit = () => {
    navigate(`/hotel-bookings/edit/${data.id}`)
  }

  // 打印预订单
  const handlePrint = () => {
    window.print()
  }

  // 生成时间线数据
  const generateTimeline = () => {
    const timeline = []
    
    if (data.createdAt) {
      timeline.push({
        color: 'blue',
        children: (
          <div>
            <p><strong>预订创建</strong></p>
            <p>{dayjs(data.createdAt).format('YYYY-MM-DD HH:mm:ss')}</p>
          </div>
        )
      })
    }

    if (data.status === 'confirmed' && data.updatedAt) {
      timeline.push({
        color: 'green',
        children: (
          <div>
            <p><strong>预订确认</strong></p>
            <p>{dayjs(data.updatedAt).format('YYYY-MM-DD HH:mm:ss')}</p>
          </div>
        )
      })
    }

    if (data.status === 'checked_in') {
      timeline.push({
        color: 'green',
        children: (
          <div>
            <p><strong>客人入住</strong></p>
            <p>{dayjs(data.checkInDate).format('YYYY-MM-DD')}</p>
          </div>
        )
      })
    }

    if (data.status === 'checked_out') {
      timeline.push({
        color: 'default',
        children: (
          <div>
            <p><strong>客人退房</strong></p>
            <p>{dayjs(data.checkOutDate).format('YYYY-MM-DD')}</p>
          </div>
        )
      })
    }

    return timeline
  }

  useEffect(() => {
    fetchData()
  }, [bookingReference])

  return (
    <div className="hotel-booking-detail">
      {/* 页面头部 */}
      <Card style={{ marginBottom: 16 }}>
        <Space size="large">
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={handleBack}
          >
            返回列表
          </Button>
          <div>
            <h2 style={{ margin: 0 }}>
              酒店预订详情 - {data.bookingReference}
            </h2>
            <Tag color={getStatusColor(data.status)} style={{ marginTop: 8 }}>
              {getStatusText(data.status)}
            </Tag>
          </div>
          <div style={{ marginLeft: 'auto' }}>
            <Space>
              <Button
                icon={<EditOutlined />}
                onClick={handleEdit}
              >
                编辑预订
              </Button>
              <Button
                icon={<PrinterOutlined />}
                onClick={handlePrint}
              >
                打印
              </Button>
              <Button
                type="primary"
                onClick={() => setStatusModalVisible(true)}
              >
                更新状态
              </Button>
            </Space>
          </div>
        </Space>
      </Card>

      <Row gutter={16}>
        {/* 左侧详情信息 */}
        <Col span={16}>
          {/* 基本信息 */}
          <Card title="基本信息" style={{ marginBottom: 16 }}>
            <Descriptions column={2} bordered>
              <Descriptions.Item label="预订参考号">
                {data.bookingReference}
              </Descriptions.Item>
              <Descriptions.Item label="预订状态">
                <Tag color={getStatusColor(data.status)}>
                  {getStatusText(data.status)}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="客人姓名">
                <Space>
                  <UserOutlined />
                  {data.guestName}
                </Space>
              </Descriptions.Item>
              <Descriptions.Item label="联系电话">
                <Space>
                  <PhoneOutlined />
                  {data.guestPhone}
                </Space>
              </Descriptions.Item>
              <Descriptions.Item label="邮箱地址" span={2}>
                <Space>
                  <MailOutlined />
                  {data.guestEmail}
                </Space>
              </Descriptions.Item>
            </Descriptions>
          </Card>

          {/* 酒店信息 */}
          <Card title="酒店信息" style={{ marginBottom: 16 }}>
            <Descriptions column={2} bordered>
              <Descriptions.Item label="酒店名称">
                <Space>
                  <HomeOutlined />
                  {data.hotelName}
                </Space>
              </Descriptions.Item>
              <Descriptions.Item label="酒店等级">
                {data.hotelLevel}
              </Descriptions.Item>
              <Descriptions.Item label="房型">
                {data.roomType}
              </Descriptions.Item>
              <Descriptions.Item label="房间数">
                {data.numberOfRooms} 间
              </Descriptions.Item>
              <Descriptions.Item label="客人数">
                {data.totalGuests} 人
              </Descriptions.Item>
              <Descriptions.Item label="房价">
                ${parseFloat(data.roomRate || 0).toFixed(2)}/晚
              </Descriptions.Item>
            </Descriptions>
          </Card>

          {/* 入住信息 */}
          <Card title="入住信息" style={{ marginBottom: 16 }}>
            <Descriptions column={2} bordered>
              <Descriptions.Item label="入住日期">
                <Space>
                  <CalendarOutlined />
                  {dayjs(data.checkInDate).format('YYYY-MM-DD')}
                </Space>
              </Descriptions.Item>
              <Descriptions.Item label="退房日期">
                <Space>
                  <CalendarOutlined />
                  {dayjs(data.checkOutDate).format('YYYY-MM-DD')}
                </Space>
              </Descriptions.Item>
              <Descriptions.Item label="住宿天数">
                {data.nights} 晚
              </Descriptions.Item>
              <Descriptions.Item label="总金额">
                <strong style={{ color: '#f50' }}>
                  ${parseFloat(data.totalAmount || 0).toFixed(2)}
                </strong>
              </Descriptions.Item>
              <Descriptions.Item label="特殊要求" span={2}>
                {data.specialRequests || '无'}
              </Descriptions.Item>
            </Descriptions>
          </Card>

          {/* 关联信息 */}
          {data.scheduleOrderId && (
            <Card title="关联信息" style={{ marginBottom: 16 }}>
              <Descriptions column={1} bordered>
                <Descriptions.Item label="排团订单ID">
                  <Button
                    type="link"
                    onClick={() => navigate(`/tour-arrangement/detail/${data.scheduleOrderId}`)}
                  >
                    {data.scheduleOrderId}
                  </Button>
                </Descriptions.Item>
                {data.scheduleTitle && (
                  <Descriptions.Item label="行程标题">
                    {data.scheduleTitle}
                  </Descriptions.Item>
                )}
                {data.scheduleDate && (
                  <Descriptions.Item label="行程日期">
                    {dayjs(data.scheduleDate).format('YYYY-MM-DD')}
                  </Descriptions.Item>
                )}
              </Descriptions>
            </Card>
          )}
        </Col>

        {/* 右侧操作历史 */}
        <Col span={8}>
          <Card title="操作历史">
            <Timeline items={generateTimeline()} />
          </Card>
        </Col>
      </Row>

      {/* 更新状态模态框 */}
      <Modal
        title="更新预订状态"
        open={statusModalVisible}
        onOk={handleUpdateStatus}
        onCancel={() => {
          setStatusModalVisible(false)
          setNewStatus('')
        }}
        okText="确定"
        cancelText="取消"
      >
        <div style={{ marginBottom: 16 }}>
          <p>当前状态：
            <Tag color={getStatusColor(data.status)}>
              {getStatusText(data.status)}
            </Tag>
          </p>
        </div>
        <Select
          placeholder="请选择新状态"
          value={newStatus}
          onChange={setNewStatus}
          style={{ width: '100%' }}
        >
          {statusOptions
            .filter(option => option.value !== data.status)
            .map(option => (
              <Option key={option.value} value={option.value}>
                <Tag color={option.color}>{option.label}</Tag>
              </Option>
            ))}
        </Select>
      </Modal>
    </div>
  )
}

export default HotelBookingDetail 