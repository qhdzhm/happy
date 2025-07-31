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
  getHotelBookingStats,
  getHotelBookingsByTourBookingId
} from '@/apis/hotel'
import { getSchedulesByBookingId, saveBatchSchedules } from '@/api/tourSchedule'
import dayjs from 'dayjs'
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter'
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore'
import HotelEmailModal from '../../components/HotelEmailModal/HotelEmailModal'

dayjs.extend(isSameOrAfter)
dayjs.extend(isSameOrBefore)

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

  // 状态选项配置（与后端ENUM保持一致）
  const statusOptions = [
    { value: 'pending', label: '待处理', color: 'orange' },
    { value: 'email_sent', label: '已发送邮件', color: 'blue' },
    { value: 'confirmed', label: '已确认', color: 'green' },
    { value: 'checked_in', label: '已入住', color: 'purple' },
    { value: 'checked_out', label: '已退房', color: 'default' },
    { value: 'cancelled', label: '已取消', color: 'red' },
    { value: 'no_show', label: '未出现', color: 'volcano' },
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
          { key: 'changeStatus', label: '修改状态', type: 'default' },
          { key: 'edit', label: '编辑', type: 'default' },
          { key: 'cancel', label: '取消', type: 'warning' },
          { key: 'delete', label: '删除', type: 'danger' }
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
        
      case 'confirmed':
        actions.push(
          { key: 'checkIn', label: '办理入住', type: 'primary' },
          { key: 'changeStatus', label: '修改状态', type: 'default' },
          { key: 'edit', label: '编辑', type: 'default' },
          { key: 'cancel', label: '取消', type: 'warning' },
          { key: 'delete', label: '删除', type: 'danger' }
        )
        break
        
      case 'checked_in':
        actions.push(
          { key: 'checkOut', label: '办理退房', type: 'primary' },
          { key: 'changeStatus', label: '修改状态', type: 'default' },
          { key: 'view', label: '查看', type: 'default' },
          { key: 'delete', label: '删除', type: 'danger' }
        )
        break
        
      case 'checked_out':
      case 'cancelled':
      case 'no_show':
      case 'rescheduled':
        actions.push(
          { key: 'view', label: '查看', type: 'default' },
          { key: 'changeStatus', label: '修改状态', type: 'default' },
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

  // 更新排团表的接送信息（基于已确认的酒店预订）
  const updateScheduleTransfers = async (tourBookingId) => {
    try {
      console.log('🚀 [酒店管理页面] 开始更新排团表接送信息，订单ID:', tourBookingId);
      
      // 获取该订单的所有酒店预订
      const hotelResponse = await getHotelBookingsByTourBookingId(tourBookingId);
      if (hotelResponse?.code !== 1 || !hotelResponse?.data?.length) {
        console.log('📝 [酒店管理页面] 没有找到酒店预订数据');
        return;
      }

      // 获取排团表数据
      const scheduleResponse = await getSchedulesByBookingId(tourBookingId);
      if (scheduleResponse?.code !== 1 || !scheduleResponse?.data?.length) {
        console.log('📝 [酒店管理页面] 没有找到排团表数据');
        return;
      }

      const schedules = scheduleResponse.data.sort((a, b) => dayjs(a.tourDate).diff(dayjs(b.tourDate)));
      
      // 只使用已确认的酒店预订
      const confirmedBookings = hotelResponse.data.filter(b => b.bookingStatus === 'confirmed');
      
      if (confirmedBookings.length === 0) {
        console.log('📝 [酒店管理页面] 没有已确认的酒店预订，跳过接送信息更新');
        return;
      }

      // 按日期排序已确认的酒店预订
      const sortedBookings = [...confirmedBookings].sort((a, b) => dayjs(a.checkInDate).diff(dayjs(b.checkInDate)));
      
      console.log('🏨 [酒店管理页面] 已确认的酒店预订:', sortedBookings.map(b => ({
        id: b.id,
        name: b.hotelName,
        checkIn: dayjs(b.checkInDate).format('YYYY-MM-DD'),
        checkOut: dayjs(b.checkOutDate).format('YYYY-MM-DD'),
        address: b.hotelAddress || b.hotelName
      })));

      console.log('📅 [酒店管理页面] 行程日期:', schedules.map(s => dayjs(s.tourDate).format('YYYY-MM-DD')));

      const updatedSchedules = [];

      schedules.forEach(schedule => {
        const scheduleDate = dayjs(schedule.tourDate);
        const isFirstDay = scheduleDate.isSame(dayjs(schedules[0].tourDate));
        const isLastDay = scheduleDate.isSame(dayjs(schedules[schedules.length - 1].tourDate));
        
        let pickup = '未指定';
        let dropoff = '未指定';

        console.log(`\n🔍 [酒店管理页面] 处理日期: ${scheduleDate.format('YYYY-MM-DD')} (第一天: ${isFirstDay}, 最后一天: ${isLastDay})`);

        if (isFirstDay) {
          // 第一天：机场接 → 当天入住的酒店送
          pickup = '机场';
          
          // 找到在当天或之前入住，且在当天之后退房的酒店
          const todayHotel = sortedBookings.find(booking => {
            const checkIn = dayjs(booking.checkInDate);
            const checkOut = dayjs(booking.checkOutDate);
            const isCheckInOnOrBefore = checkIn.isSameOrBefore(scheduleDate, 'day');
            const isCheckOutAfter = checkOut.isAfter(scheduleDate, 'day');
            
            console.log(`  🏨 检查酒店 ${booking.hotelName}: 入住${checkIn.format('MM-DD')} <= ${scheduleDate.format('MM-DD')}? ${isCheckInOnOrBefore}, 退房${checkOut.format('MM-DD')} > ${scheduleDate.format('MM-DD')}? ${isCheckOutAfter}`);
            
            return isCheckInOnOrBefore && isCheckOutAfter;
          });
          
          dropoff = todayHotel ? (todayHotel.hotelAddress || todayHotel.hotelName) : '酒店';
          console.log(`  ✅ 第一天接送: 机场 → ${dropoff}`);
        } else if (isLastDay) {
          // 最后一天：从当天退房的酒店接 → 机场送
          
          // 找到在当天退房的酒店，或者在当天之前入住且没有在当天之前退房的酒店
          const checkoutHotel = sortedBookings.find(booking => {
            const checkIn = dayjs(booking.checkInDate);
            const checkOut = dayjs(booking.checkOutDate);
            const isCheckOutToday = checkOut.isSame(scheduleDate, 'day');
            const isStayingThroughToday = checkIn.isBefore(scheduleDate, 'day') && checkOut.isAfter(scheduleDate, 'day');
            
            console.log(`  🏨 检查酒店 ${booking.hotelName}: 今天退房${checkOut.format('MM-DD')} = ${scheduleDate.format('MM-DD')}? ${isCheckOutToday}, 住宿覆盖今天? ${isStayingThroughToday}`);
            
            return isCheckOutToday || isStayingThroughToday;
          });
          
          pickup = checkoutHotel ? (checkoutHotel.hotelAddress || checkoutHotel.hotelName) : '酒店';
          dropoff = '机场';
          console.log(`  ✅ 最后一天接送: ${pickup} → 机场`);
        } else {
          // 中间天：从昨晚住的酒店接 → 今晚住的酒店送
          
          // 找到昨晚住的酒店（昨天入住，今天之后退房）
          const yesterday = scheduleDate.subtract(1, 'day');
          const prevHotel = sortedBookings.find(booking => {
            const checkIn = dayjs(booking.checkInDate);
            const checkOut = dayjs(booking.checkOutDate);
            const isCheckInOnOrBeforeYesterday = checkIn.isSameOrBefore(yesterday, 'day');
            const isCheckOutAfterYesterday = checkOut.isAfter(yesterday, 'day');
            
            console.log(`  🏨 检查昨晚酒店 ${booking.hotelName}: 入住${checkIn.format('MM-DD')} <= ${yesterday.format('MM-DD')}? ${isCheckInOnOrBeforeYesterday}, 退房${checkOut.format('MM-DD')} > ${yesterday.format('MM-DD')}? ${isCheckOutAfterYesterday}`);
            
            return isCheckInOnOrBeforeYesterday && isCheckOutAfterYesterday;
          });
          
          // 找到今晚住的酒店（今天入住，明天之后退房）
          const tonightHotel = sortedBookings.find(booking => {
            const checkIn = dayjs(booking.checkInDate);
            const checkOut = dayjs(booking.checkOutDate);
            const isCheckInOnOrBeforeToday = checkIn.isSameOrBefore(scheduleDate, 'day');
            const isCheckOutAfterToday = checkOut.isAfter(scheduleDate, 'day');
            
            console.log(`  🏨 检查今晚酒店 ${booking.hotelName}: 入住${checkIn.format('MM-DD')} <= ${scheduleDate.format('MM-DD')}? ${isCheckInOnOrBeforeToday}, 退房${checkOut.format('MM-DD')} > ${scheduleDate.format('MM-DD')}? ${isCheckOutAfterToday}`);
            
            return isCheckInOnOrBeforeToday && isCheckOutAfterToday;
          });
          
          pickup = prevHotel ? (prevHotel.hotelAddress || prevHotel.hotelName) : '酒店';
          dropoff = tonightHotel ? (tonightHotel.hotelAddress || tonightHotel.hotelName) : '酒店';
          console.log(`  ✅ 中间天接送: ${pickup} → ${dropoff}`);
        }

        updatedSchedules.push({
          ...schedule,
          pickupLocation: pickup,
          dropoffLocation: dropoff
        });
        
        console.log(`📝 [酒店管理页面] ${scheduleDate.format('YYYY-MM-DD')} - 接: ${pickup}, 送: ${dropoff}`);
      });

      if (updatedSchedules.length > 0) {
        console.log('💾 [酒店管理页面] 准备保存接送信息:', updatedSchedules.map(s => ({
          date: dayjs(s.tourDate).format('YYYY-MM-DD'),
          pickup: s.pickupLocation,
          dropoff: s.dropoffLocation
        })));
        
        await saveBatchSchedules({
          bookingId: tourBookingId,
          schedules: updatedSchedules
        });
        console.log('✅ [酒店管理页面] 接送信息更新成功');
      }
    } catch (error) {
      console.error('❌ [酒店管理页面] 更新排团表接送信息失败:', error);
    }
  };

  // 状态修改处理
  const handleStatusChange = (record, newStatus) => {
    Modal.confirm({
      title: '确认修改状态',
      content: `确定要将预订状态从"${getStatusText(record.bookingStatus)}"修改为"${getStatusText(newStatus)}"吗？`,
      onOk: async () => {
        try {
          await updateHotelBookingStatus(record.id, newStatus)
          message.success('状态修改成功')
          
          console.log('🔍 [酒店管理页面] 状态更新调试信息:', {
            newStatus,
            recordId: record.id,
            tourBookingId: record.tourBookingId,
            record: record
          });
          
          // 如果状态改为已确认，且该预订属于某个旅游订单，则更新接送信息
          if (newStatus === 'confirmed' && record.tourBookingId) {
            console.log('🏨 [酒店管理页面] 酒店已确认，开始更新接送信息, 旅游订单ID:', record.tourBookingId);
            await updateScheduleTransfers(record.tourBookingId);
          } else if (newStatus === 'confirmed' && !record.tourBookingId) {
            console.warn('⚠️ [酒店管理页面] 酒店已确认，但没有关联的旅游订单ID，无法更新接送信息');
          }
          
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
          console.log('批量删除响应:', response)
          if (response.code === 1) {
            message.success(response.msg || response.data || '批量删除成功')
            setSelectedRowKeys([])
            fetchData()
            fetchStats()
          } else {
            message.error(response.msg || '批量删除失败')
          }
        } catch (error) {
          console.error('批量删除失败:', error)
          message.error('批量删除失败: ' + (error.response?.data?.msg || error.message || '未知错误'))
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
            
            // 如果状态改为已确认，需要更新相关订单的接送信息
            if (status === 'confirmed') {
              // 获取选中记录中有tourBookingId的记录
              const selectedRecords = data.filter(record => selectedRowKeys.includes(record.id));
              const tourBookingIds = [...new Set(selectedRecords.filter(r => r.tourBookingId).map(r => r.tourBookingId))];
              
              console.log('🏨 [酒店管理页面] 批量确认酒店，需要更新接送信息的旅游订单ID:', tourBookingIds);
              
              // 为每个相关的旅游订单更新接送信息
              for (const tourBookingId of tourBookingIds) {
                await updateScheduleTransfers(tourBookingId);
              }
            }
            
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