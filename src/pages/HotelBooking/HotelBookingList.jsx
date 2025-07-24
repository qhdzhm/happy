import React, { useState, useEffect } from 'react'
import './HotelBooking.css'
import {
  Table,
  Button,
  Input,
  Select,
  DatePicker,
  Space,
  Modal,
  message,
  Tag,
  Popconfirm,
  Card,
  Row,
  Col,
  Statistic,
  Dropdown
} from 'antd'
import {
  PlusOutlined,
  SearchOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  ReloadOutlined,
  ExportOutlined,
  MailOutlined,
  DownOutlined
} from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import {
  getHotelBookings,
  deleteHotelBooking,
  batchDeleteHotelBookings,
  updateHotelBookingStatus,
  batchUpdateHotelBookingStatus,
  getHotelBookingStats
} from '@/apis/hotel'
import dayjs from 'dayjs'
import HotelEmailModal from '../../components/HotelEmailModal/HotelEmailModal'

const { RangePicker } = DatePicker
const { Option } = Select

const HotelBookingList = () => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState([])
  const [total, setTotal] = useState(0)
  const [selectedRowKeys, setSelectedRowKeys] = useState([])
  const [stats, setStats] = useState({})
  
  // 邮件弹窗状态
  const [emailModalVisible, setEmailModalVisible] = useState(false)
  const [currentBookingData, setCurrentBookingData] = useState(null)
  
  // 查询参数
  const [queryParams, setQueryParams] = useState({
    page: 1,
    pageSize: 10,
    guestName: '',
    guestPhone: '',
    status: '',
    hotelId: '',
    checkInDate: null,
    checkOutDate: null
  })

  // 状态选项配置
  const statusOptions = [
    { value: 'pending', label: '待处理', color: 'orange' },
    { value: 'email_sending', label: '邮件发送中', color: 'processing' },
    { value: 'email_sent', label: '已发送邮件', color: 'blue' },
    { value: 'email_failed', label: '邮件发送失败', color: 'volcano' },
    { value: 'confirmed', label: '已确认', color: 'green' },
    { value: 'checked_in', label: '已入住', color: 'purple' },
    { value: 'checked_out', label: '已退房', color: 'default' },
    { value: 'cancelled', label: '已取消', color: 'red' },
    { value: 'rescheduled', label: '重新安排', color: 'cyan' }
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

  // 根据状态获取可用操作
  const getAvailableActions = (record) => {
    const actions = []
    
    switch (record.bookingStatus) {
      case 'pending':
        actions.push(
          { key: 'sendEmail', label: '发送邮件', type: 'primary' },
          { key: 'edit', label: '编辑', type: 'default' },
          { key: 'cancel', label: '取消', type: 'warning' },
          { key: 'delete', label: '删除', type: 'danger' }
        )
        break
        
      case 'email_sending':
        actions.push(
          { key: 'view', label: '查看', type: 'default' },
          { key: 'cancel', label: '取消', type: 'warning' }
        )
        break

      case 'email_sent':
        actions.push(
          { key: 'confirm', label: '确认预订', type: 'primary' },
          { key: 'resendEmail', label: '重发邮件', type: 'default' },
          { key: 'changeStatus', label: '修改状态', type: 'default' },
          { key: 'reschedule', label: '重新安排', type: 'warning' },
          { key: 'cancel', label: '取消', type: 'warning' },
          { key: 'delete', label: '删除', type: 'danger' }
        )
        break

      case 'email_failed':
        actions.push(
          { key: 'resendEmail', label: '重新发送邮件', type: 'primary' },
          { key: 'edit', label: '编辑', type: 'default' },
          { key: 'changeStatus', label: '修改状态', type: 'default' },
          { key: 'cancel', label: '取消', type: 'warning' },
          { key: 'delete', label: '删除', type: 'danger' }
        )
        break
        
      case 'confirmed':
        actions.push(
          { key: 'checkIn', label: '办理入住', type: 'primary' },
          { key: 'edit', label: '编辑', type: 'default' },
          { key: 'cancel', label: '取消', type: 'warning' },
          { key: 'delete', label: '删除', type: 'danger' }
        )
        break
        
      case 'checked_in':
        actions.push(
          { key: 'checkOut', label: '办理退房', type: 'primary' },
          { key: 'view', label: '查看', type: 'default' },
          { key: 'delete', label: '删除', type: 'danger' }
        )
        break
        
      case 'checked_out':
      case 'cancelled':
      case 'rescheduled':
        actions.push(
          { key: 'view', label: '查看', type: 'default' },
          { key: 'delete', label: '删除', type: 'danger' }
        )
        break
        
      default:
        actions.push(
          { key: 'view', label: '查看', type: 'default' },
          { key: 'delete', label: '删除', type: 'danger' }
        )
    }
    
    return actions
  }

  // 状态修改处理
  const handleStatusChange = (record, newStatus) => {
    Modal.confirm({
      title: '确认修改状态',
      content: `确定要将预订状态从"${getStatusText(record.bookingStatus)}"修改为"${getStatusText(newStatus)}"吗？`,
      onOk: async () => {
        try {
          await updateHotelBookingStatus(record.id, newStatus)
          message.success('状态修改成功')
          fetchData()
        } catch (error) {
          message.error('状态修改失败')
        }
      }
    })
  }

  // 重新安排处理
  const handleReschedule = (record) => {
    Modal.confirm({
      title: '重新安排预订',
      content: (
        <div>
          <p>当前预订：{record.hotelName} - {record.roomType}</p>
          <p>原因：酒店无房间/客人要求变更</p>
          <p><strong>操作说明：</strong></p>
          <ul>
            <li>1. 保留客人信息和入住时间，清空酒店相关信息</li>
            <li>2. 重新选择酒店后，状态将变为"待确认"</li>
            <li>3. 更新现有预订而非创建新预订</li>
          </ul>
        </div>
      ),
      width: 500,
      onOk: async () => {
        try {
          // 直接跳转到编辑页面，使用重新安排模式
          message.success('正在重新安排预订...')
          
          navigate(`/hotel-bookings/edit/${record.id}?mode=reschedule`, { 
            state: { 
              rescheduleData: {
                // 保留客人信息
                guestName: record.guestName,
                guestPhone: record.guestPhone,
                guestEmail: record.guestEmail,
                // 保留入住信息
                checkInDate: record.checkInDate,
                checkOutDate: record.checkOutDate,
                roomCount: record.roomCount || 1,
                adultCount: record.adultCount || 1,
                childCount: record.childCount || 0,
                totalGuests: record.totalGuests || (record.adultCount + record.childCount),
                // 保留其他信息
                specialRequests: record.specialRequests,
                scheduleOrderId: record.scheduleOrderId,
                // 原始状态信息（用于重置）
                originalStatus: record.bookingStatus
              }
            }
          })
          
        } catch (error) {
          console.error('重新安排失败:', error)
          message.error('重新安排失败: ' + (error.response?.data?.msg || error.message))
        }
      }
    })
  }



  // 取消预订处理
  const handleCancel = (record) => {
    Modal.confirm({
      title: '取消预订',
      content: (
        <div>
          <p>请选择操作类型：</p>
          <p><strong>预订参考号：</strong>{record.bookingReference}</p>
          <p><strong>客人姓名：</strong>{record.guestName}</p>
          <p><strong>酒店：</strong>{record.hotelName}</p>
          <p><strong>入住日期：</strong>{dayjs(record.checkInDate).format('YYYY-MM-DD')}</p>
        </div>
      ),
      okText: '标记为已取消',
      cancelText: '关闭',
      okType: 'warning',
      onOk: async () => {
        try {
          await updateHotelBookingStatus(record.id, 'cancelled')
          message.success('预订已标记为取消状态')
          fetchData()
        } catch (error) {
          console.error('取消预订失败:', error)
          message.error('取消预订失败: ' + (error.response?.data?.msg || error.message))
        }
      }
    })
  }

  // 删除预订处理
  const handleDeleteBooking = (record) => {
    Modal.confirm({
      title: '确认删除预订',
      content: (
        <div>
          <p style={{ color: 'red' }}><strong>警告：此操作将永久删除预订记录，无法恢复！</strong></p>
          <p><strong>预订参考号：</strong>{record.bookingReference}</p>
          <p><strong>客人姓名：</strong>{record.guestName}</p>
          <p><strong>酒店：</strong>{record.hotelName}</p>
          <p><strong>入住日期：</strong>{dayjs(record.checkInDate).format('YYYY-MM-DD')}</p>
        </div>
      ),
      okText: '确认删除',
      cancelText: '取消',
      okType: 'danger',
      onOk: async () => {
        try {
          await handleDelete(record.id)
          message.success('预订已删除')
          fetchData()
        } catch (error) {
          console.error('删除预订失败:', error)
          message.error('删除预订失败: ' + (error.response?.data?.msg || error.message))
        }
      }
    })
  }

  // 重发邮件处理
  const handleResendEmail = (record) => {
    Modal.confirm({
      title: '重发预订邮件',
      content: (
        <div>
          <p>确定要重新发送预订邮件吗？</p>
          <p><strong>预订参考号：</strong>{record.bookingReference}</p>
          <p><strong>酒店邮箱：</strong>{record.hotelEmail || '待确认'}</p>
          <p><strong>上次发送时间：</strong>{record.emailSentAt ? dayjs(record.emailSentAt).format('YYYY-MM-DD HH:mm') : '无记录'}</p>
        </div>
      ),
      okText: '重发邮件',
      cancelText: '取消',
      onOk: () => {
        // 使用现有的邮件发送功能
        handleSendEmail(record)
      }
    })
  }

  // 获取状态标签
  const getStatusLabel = (status) => {
    const option = statusOptions.find(opt => opt.value === status)
    return option ? option.label : status
  }

  // 表格列定义
  const columns = [
    {
      title: '预订参考号',
      dataIndex: 'bookingReference',
      key: 'bookingReference',
      width: 150,
      render: (text) => (
        <Button type="link" onClick={() => handleView(text)}>
          {text}
        </Button>
      )
    },
    {
      title: '客人姓名',
      dataIndex: 'guestName',
      key: 'guestName',
      width: 120
    },
    {
      title: '联系电话',
      dataIndex: 'guestPhone',
      key: 'guestPhone',
      width: 130
    },
    {
      title: '酒店名称',
      dataIndex: 'hotelName',
      key: 'hotelName',
      width: 180
    },
    {
      title: '房型',
      dataIndex: 'roomType',
      key: 'roomType',
      width: 120
    },
    {
      title: '入住日期',
      dataIndex: 'checkInDate',
      key: 'checkInDate',
      width: 120,
      render: (text) => dayjs(text).format('YYYY-MM-DD')
    },
    {
      title: '退房日期',
      dataIndex: 'checkOutDate',
      key: 'checkOutDate',
      width: 120,
      render: (text) => dayjs(text).format('YYYY-MM-DD')
    },
    {
      title: '房间数',
      dataIndex: 'roomCount',
      key: 'roomCount',
      width: 80,
      align: 'center'
    },
    {
      title: '客人数',
      dataIndex: 'totalGuests',
      key: 'totalGuests',
      width: 80,
      align: 'center'
    },
    {
      title: '总金额',
      dataIndex: 'totalAmount',
      key: 'totalAmount',
      width: 120,
      align: 'right',
      render: (text) => `$${parseFloat(text).toFixed(2)}`
    },
    {
      title: '状态',
      dataIndex: 'bookingStatus',
      key: 'bookingStatus',
      render: (status) => {
        const option = statusOptions.find(opt => opt.value === status)
        return (
          <Tag color={option?.color || 'default'}>
            {option?.label || status}
          </Tag>
        )
      }
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 150,
      render: (text) => dayjs(text).format('YYYY-MM-DD HH:mm')
    },
    {
      title: '操作',
      key: 'action',
      width: 300,
      render: (_, record) => {
        const actions = getAvailableActions(record)
        
        return (
          <Space size="small" wrap>
            {actions.map(action => {
              switch (action.key) {
                case 'sendEmail':
                  return (
                    <Button
                      key="sendEmail"
                      type="primary"
                      size="small"
                      onClick={() => handleSendEmail(record)}
                    >
                      发送邮件
                    </Button>
                  )
                  
                case 'changeStatus':
                  return (
                    <Dropdown
                      key="changeStatus"
                      menu={{
                        items: statusOptions
                          .filter(opt => opt.value !== record.bookingStatus)
                          .map(opt => ({
                            key: opt.value,
                            label: opt.label,
                            onClick: () => handleStatusChange(record, opt.value)
                          }))
                      }}
                    >
                      <Button size="small">
                        修改状态 <DownOutlined />
                      </Button>
                    </Dropdown>
                  )
                  
                case 'reschedule':
                  return (
                    <Button
                      key="reschedule"
                      type="default"
                      size="small"
                      onClick={() => handleReschedule(record)}
                    >
                      重新安排
                    </Button>
                  )
                  
                default:
                  return (
                    <Button
                      key={action.key}
                      type={action.type}
                      size="small"
                      onClick={() => {
                        // 处理其他操作
                        switch (action.key) {
                          case 'edit':
                            navigate(`/hotel-bookings/edit/${record.id}`)
                            break
                          case 'view':
                            navigate(`/hotel-bookings/detail/${record.bookingReference}`)
                            break
                          case 'cancel':
                            handleCancel(record)
                            break
                          case 'resendEmail':
                            handleResendEmail(record)
                            break
                          case 'confirm':
                            handleStatusChange(record, 'confirmed')
                            break
                          case 'checkIn':
                            handleStatusChange(record, 'checked_in')
                            break
                          case 'checkOut':
                            handleStatusChange(record, 'checked_out')
                            break

                          case 'editBasic':
                            navigate(`/hotel-bookings/edit/${record.id}?mode=basic`)
                            break
                          case 'delete':
                            handleDeleteBooking(record)
                            break
                          default:
                            console.log('未处理的操作:', action.key)
                        }
                      }}
                    >
                      {action.label}
                    </Button>
                  )
              }
            })}
          </Space>
        )
      }
    }
  ]

  // 行选择配置
  const rowSelection = {
    selectedRowKeys,
    onChange: setSelectedRowKeys,
    getCheckboxProps: (record) => ({
      disabled: record.bookingStatus === 'checked_out'
    })
  }

  // 获取数据
  const fetchData = async () => {
    setLoading(true)
    try {
      const params = {
        ...queryParams,
        checkInDate: queryParams.checkInDate ? dayjs(queryParams.checkInDate).format('YYYY-MM-DD') : null,
        checkOutDate: queryParams.checkOutDate ? dayjs(queryParams.checkOutDate).format('YYYY-MM-DD') : null
      }
      
      const response = await getHotelBookings(params)
      if (response.code === 1) {
        setData(response.data.records || [])
        setTotal(response.data.total || 0)
      } else {
        message.error(response.msg || '获取数据失败')
      }
    } catch (error) {
      console.error('获取酒店预订列表失败:', error)
      message.error('获取数据失败')
    } finally {
      setLoading(false)
    }
  }

  // 获取统计数据
  const fetchStats = async () => {
    try {
      const response = await getHotelBookingStats()
      if (response.code === 1) {
        setStats(response.data || {})
      }
    } catch (error) {
      console.error('获取统计数据失败:', error)
    }
  }

  // 处理查询
  const handleSearch = () => {
    setQueryParams({ ...queryParams, page: 1 })
    fetchData()
  }

  // 重置查询
  const handleReset = () => {
    setQueryParams({
      page: 1,
      pageSize: 10,
      guestName: '',
      guestPhone: '',
      status: '',
      hotelId: '',
      checkInDate: null,
      checkOutDate: null
    })
  }

  // 处理分页变化
  const handleTableChange = (pagination) => {
    setQueryParams({
      ...queryParams,
      page: pagination.current,
      pageSize: pagination.pageSize
    })
  }

  // 查看详情
  const handleView = (bookingReference) => {
    navigate(`/hotel-bookings/detail/${bookingReference}`)
  }

  // 发送邮件
  const handleSendEmail = (record) => {
    setCurrentBookingData(record)
    setEmailModalVisible(true)
  }

  // 邮件发送成功回调
  const handleEmailSuccess = () => {
    fetchData() // 刷新列表数据
    fetchStats() // 刷新统计数据
  }

  // 删除单个
  const handleDelete = async (id) => {
    try {
      const response = await deleteHotelBooking(id)
      if (response.code === 1) {
        message.success('删除成功')
        fetchData()
        fetchStats()
      } else {
        message.error(response.msg || '删除失败')
      }
    } catch (error) {
      console.error('删除失败:', error)
      message.error('删除失败')
    }
  }

  // 批量删除
  const handleBatchDelete = async () => {
    if (selectedRowKeys.length === 0) {
      message.warning('请选择要删除的记录')
      return
    }

    Modal.confirm({
      title: '确认删除',
      content: `确定要删除选中的 ${selectedRowKeys.length} 条记录吗？`,
      onOk: async () => {
        try {
          const response = await batchDeleteHotelBookings(selectedRowKeys)
          if (response.code === 1) {
            message.success('批量删除成功')
            setSelectedRowKeys([])
            fetchData()
            fetchStats()
          } else {
            message.error(response.msg || '批量删除失败')
          }
        } catch (error) {
          console.error('批量删除失败:', error)
          message.error('批量删除失败')
        }
      }
    })
  }

  // 批量更新状态
  const handleBatchUpdateStatus = (status) => {
    if (selectedRowKeys.length === 0) {
      message.warning('请选择要更新状态的记录')
      return
    }

    const statusText = getStatusText(status)
    Modal.confirm({
      title: '确认更新状态',
      content: `确定要将选中的 ${selectedRowKeys.length} 条记录状态更新为"${statusText}"吗？`,
      onOk: async () => {
        try {
          const response = await batchUpdateHotelBookingStatus(selectedRowKeys, status)
          if (response.code === 1) {
            message.success('批量更新状态成功')
            setSelectedRowKeys([])
            fetchData()
            fetchStats()
          } else {
            message.error(response.msg || '批量更新状态失败')
          }
        } catch (error) {
          console.error('批量更新状态失败:', error)
          message.error('批量更新状态失败')
        }
      }
    })
  }

  // 组件挂载时获取数据
  useEffect(() => {
    fetchData()
    fetchStats()
  }, [queryParams])

  return (
    <div className="hotel-booking-list">
      {/* 统计卡片 */}
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="总预订数"
              value={stats.totalBookings || 0}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="待确认"
              value={stats.pendingBookings || 0}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="已确认"
              value={stats.confirmedBookings || 0}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="本月入住"
              value={stats.thisMonthCheckIns || 0}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
      </Row>

      {/* 查询表单 */}
      <Card style={{ marginBottom: 16 }}>
        <Row gutter={16}>
          <Col span={6}>
            <Input
              placeholder="客人姓名"
              value={queryParams.guestName}
              onChange={(e) => setQueryParams({ ...queryParams, guestName: e.target.value })}
              allowClear
            />
          </Col>
          <Col span={6}>
            <Input
              placeholder="联系电话"
              value={queryParams.guestPhone}
              onChange={(e) => setQueryParams({ ...queryParams, guestPhone: e.target.value })}
              allowClear
            />
          </Col>
          <Col span={6}>
            <Select
              placeholder="预订状态"
              value={queryParams.status}
              onChange={(value) => setQueryParams({ ...queryParams, status: value })}
              allowClear
              style={{ width: '100%' }}
            >
              {statusOptions.map(option => (
                <Option key={option.value} value={option.value}>
                  {option.label}
                </Option>
              ))}
            </Select>
          </Col>
          <Col span={6}>
            <Space>
              <Button
                type="primary"
                icon={<SearchOutlined />}
                onClick={handleSearch}
              >
                查询
              </Button>
              <Button onClick={handleReset}>
                重置
              </Button>
            </Space>
          </Col>
        </Row>
        <Row gutter={16} style={{ marginTop: 16 }}>
          <Col span={12}>
            <RangePicker
              placeholder={['入住日期开始', '入住日期结束']}
              value={[queryParams.checkInDate, queryParams.checkOutDate]}
              onChange={(dates) => setQueryParams({
                ...queryParams,
                checkInDate: dates ? dates[0] : null,
                checkOutDate: dates ? dates[1] : null
              })}
              style={{ width: '100%' }}
            />
          </Col>
        </Row>
      </Card>

      {/* 操作按钮 */}
      <Card style={{ marginBottom: 16 }}>
        <Space>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => navigate('/hotel-bookings/add')}
          >
            新增预订
          </Button>
          <Button
            danger
            icon={<DeleteOutlined />}
            onClick={handleBatchDelete}
            disabled={selectedRowKeys.length === 0}
          >
            批量删除
          </Button>
          <Button
            icon={<ReloadOutlined />}
            onClick={() => {
              fetchData()
              fetchStats()
            }}
          >
            刷新
          </Button>
          <Button icon={<ExportOutlined />}>
            导出
          </Button>
        </Space>
        
        {selectedRowKeys.length > 0 && (
          <Space style={{ marginLeft: 16 }}>
            <span>已选择 {selectedRowKeys.length} 项</span>
            <Button
              size="small"
              onClick={() => handleBatchUpdateStatus('confirmed')}
            >
              批量确认
            </Button>
            <Button
              size="small"
              onClick={() => handleBatchUpdateStatus('checked_in')}
            >
              批量入住
            </Button>
            <Button
              size="small"
              onClick={() => handleBatchUpdateStatus('checked_out')}
            >
              批量退房
            </Button>
          </Space>
        )}
      </Card>

      {/* 数据表格 */}
      <Card>
        <Table
          columns={columns}
          dataSource={data}
          rowKey="id"
          loading={loading}
          rowSelection={rowSelection}
          scroll={{ x: 1800 }}
          pagination={{
            current: queryParams.page,
            pageSize: queryParams.pageSize,
            total: total,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条/共 ${total} 条`
          }}
          onChange={handleTableChange}
        />
      </Card>

      {/* 邮件发送弹窗 */}
      <HotelEmailModal
        visible={emailModalVisible}
        onCancel={() => setEmailModalVisible(false)}
        onSuccess={handleEmailSuccess}
        bookingData={currentBookingData}
      />
    </div>
  )
}

export default HotelBookingList 