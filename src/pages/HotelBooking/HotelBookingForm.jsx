import React, { useState, useEffect } from 'react'
import {
  Card,
  Form,
  Input,
  Select,
  DatePicker,
  InputNumber,
  Button,
  Space,
  message,
  Row,
  Col,
  Divider,
  Spin
} from 'antd'
import {
  ArrowLeftOutlined,
  SaveOutlined,
  ReloadOutlined
} from '@ant-design/icons'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import {
  getHotelBookingById,
  addHotelBooking,
  updateHotelBooking,
  getHotels,
  getHotelRoomTypes
} from '@/apis/hotel'
import dayjs from 'dayjs'

const { Option } = Select
const { TextArea } = Input

const HotelBookingForm = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [hotels, setHotels] = useState([])
  const [roomTypes, setRoomTypes] = useState([])
  const [selectedHotelId, setSelectedHotelId] = useState(null)

  const isEdit = !!id
  const baseData = location.state?.baseData // 从重新安排传来的预填数据  
  const rescheduleData = location.state?.rescheduleData // 重新安排模式的数据
  const isRescheduleMode = new URLSearchParams(location.search).get('mode') === 'reschedule'

  // 预订状态选项
  const statusOptions = [
    { label: '待确认', value: 'pending' },
    { label: '已确认', value: 'confirmed' },
    { label: '已入住', value: 'checked_in' },
    { label: '已退房', value: 'checked_out' },
    { label: '已取消', value: 'cancelled' }
  ]

  // 获取酒店列表
  const fetchHotels = async () => {
    try {
      const response = await getHotels()
      if (response.code === 1) {
        const hotelData = response.data || []
        setHotels(hotelData)
        console.log('酒店数据加载完成:', hotelData)
        return hotelData
      }
    } catch (error) {
      console.error('获取酒店列表失败:', error)
    }
    return []
  }

  // 获取房型列表
  const fetchRoomTypes = async (hotelId) => {
    if (!hotelId) {
      setRoomTypes([])
      return
    }

    try {
      const response = await getHotelRoomTypes(hotelId)
      if (response.code === 1) {
        setRoomTypes(response.data || [])
      }
    } catch (error) {
      console.error('获取房型列表失败:', error)
      setRoomTypes([])
    }
  }

  // 获取预订详情（编辑模式）
  const fetchBookingDetail = async (hotelDataList = null) => {
    if (!id) return

    setLoading(true)
    try {
      const response = await getHotelBookingById(id)
      if (response.code === 1) {
        const data = response.data
        console.log('获取到的预订详情:', data)
        
        // 使用传入的酒店数据或状态中的酒店数据
        const availableHotels = hotelDataList || hotels
        console.log('🔍 用于匹配的酒店数据:', availableHotels)
        
        // 先设置酒店ID，触发房型列表加载
        // 检查是否为重新安排模式
        if (isRescheduleMode && rescheduleData) {
          console.log('重新安排模式，使用保留的数据:', rescheduleData)
          // 重新安排模式：清空酒店信息，保留客人和入住信息
          const formData = {
            ...rescheduleData,
            checkInDate: rescheduleData.checkInDate ? dayjs(rescheduleData.checkInDate) : null,
            checkOutDate: rescheduleData.checkOutDate ? dayjs(rescheduleData.checkOutDate) : null,
            // 清空酒店相关信息
            hotelId: null,
            roomTypeId: null,
            roomRate: null,
            totalAmount: null,
            // 设为待确认状态
            status: 'pending'
          }
          
          form.setFieldsValue(formData)
          setSelectedHotelId(null)
          setRoomTypes([])
          console.log('重新安排模式表单设置完成:', formData)
        } else {
          // 正常编辑模式
          console.log('处理正常编辑模式数据:', data)
          
          // 需要根据酒店名称查找hotelId，根据房型名称查找roomTypeId
          let hotelId = null
          let roomTypeId = null
          
          // 从酒店列表中找到对应的hotelId
          if (data.hotelName && availableHotels.length > 0) {
            console.log('🔍 查找酒店:', data.hotelName, '在酒店列表:', availableHotels.map(h => h.hotelName))
            const hotel = availableHotels.find(h => h.hotelName === data.hotelName)
            if (hotel) {
              hotelId = hotel.id
              setSelectedHotelId(hotelId)
              console.log('✅ 找到匹配的酒店:', hotel.hotelName, 'ID:', hotelId)
              
              // 获取房型列表
              const roomTypesResponse = await getHotelRoomTypes(hotelId)
              if (roomTypesResponse.code === 1) {
                const roomTypesData = roomTypesResponse.data || []
                setRoomTypes(roomTypesData)
                console.log('获取到的房型数据:', roomTypesData)
                
                // 从房型列表中找到对应的roomTypeId
                if (data.roomType) {
                  console.log('🔍 查找房型:', data.roomType, '在房型列表:', roomTypesData.map(rt => rt.roomType))
                  const roomType = roomTypesData.find(rt => rt.roomType === data.roomType)
                  if (roomType) {
                    roomTypeId = roomType.id
                    console.log('✅ 找到匹配的房型:', roomType.roomType, 'ID:', roomTypeId)
                  } else {
                    console.warn('❌ 未找到匹配的房型:', data.roomType)
                  }
                }
              }
            } else {
              console.warn('❌ 未找到匹配的酒店:', data.hotelName)
            }
          } else {
            console.warn('⚠️ 酒店名称为空或酒店列表为空:', { hotelName: data.hotelName, hotelsCount: availableHotels.length })
          }
          
          // 设置表单值，进行字段映射
          const formData = {
            // 基本信息
            guestName: data.guestName,
            guestPhone: data.guestPhone,
            guestEmail: data.guestEmail,
            // 酒店信息 - 字段映射
            hotelId: hotelId,
            roomTypeId: roomTypeId,
            roomRate: data.roomRate,
            // 预订信息 - 字段映射
            checkInDate: data.checkInDate ? dayjs(data.checkInDate) : null,
            checkOutDate: data.checkOutDate ? dayjs(data.checkOutDate) : null,
            numberOfRooms: data.roomCount || 1, // roomCount -> numberOfRooms
            totalGuests: data.totalGuests,
            nights: data.nights,
            totalAmount: data.totalAmount,
            // 其他信息
            status: data.bookingStatus, // bookingStatus -> status
            scheduleOrderId: data.scheduleOrderId,
            specialRequests: data.specialRequests
          }
          
          console.log('🎯 准备设置表单数据:')
          console.log('原始数据:', {
            hotelName: data.hotelName,
            roomType: data.roomType,
            roomRate: data.roomRate,
            bookingStatus: data.bookingStatus
          })
          console.log('映射后数据:', {
            hotelId: hotelId,
            roomTypeId: roomTypeId,
            roomRate: data.roomRate,
            status: data.bookingStatus
          })
          console.log('完整表单数据:', formData)
          
          form.setFieldsValue(formData)
          console.log('✅ 表单设置完成，字段映射后:', formData)
          
          // 触发总金额计算
          setTimeout(calculateBookingDetails, 200)
        }
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

  // 处理酒店选择变化
  const handleHotelChange = (hotelId) => {
    setSelectedHotelId(hotelId)
    form.setFieldsValue({ 
      roomTypeId: undefined,
      roomRate: undefined
    })
    fetchRoomTypes(hotelId)
  }

  // 处理房间类型选择变化
  const handleRoomTypeChange = (roomTypeId) => {
    const selectedRoomType = roomTypes.find(room => room.id === roomTypeId)
    if (selectedRoomType) {
      form.setFieldsValue({ roomRate: selectedRoomType.basePrice })
      // 自动计算总金额
      setTimeout(calculateBookingDetails, 100)
    }
  }

  // 计算住宿天数和总金额
  const calculateBookingDetails = () => {
    const checkInDate = form.getFieldValue('checkInDate')
    const checkOutDate = form.getFieldValue('checkOutDate')
    const roomRate = form.getFieldValue('roomRate')
    const numberOfRooms = form.getFieldValue('numberOfRooms')

    if (checkInDate && checkOutDate && roomRate && numberOfRooms) {
      const nights = checkOutDate.diff(checkInDate, 'day')
      const totalAmount = nights * roomRate * numberOfRooms

      form.setFieldsValue({
        nights: nights,
        totalAmount: totalAmount
      })
    }
  }

  // 处理日期变化
  const handleDateChange = () => {
    setTimeout(calculateBookingDetails, 100)
  }

  // 提交表单
  const handleSubmit = async (values) => {
    setSubmitting(true)
    try {
      const submitData = {
        ...values,
        checkInDate: values.checkInDate.format('YYYY-MM-DD'),
        checkOutDate: values.checkOutDate.format('YYYY-MM-DD')
      }

      // 如果是重新安排模式，强制设置状态为 pending
      if (isRescheduleMode) {
        submitData.status = 'pending'
        submitData.bookingStatus = 'pending'
      }

      let response
      if (isEdit) {
        response = await updateHotelBooking({ id, ...submitData })
      } else {
        response = await addHotelBooking(submitData)
      }

      if (response.code === 1) {
        if (isRescheduleMode) {
          message.success('重新安排成功，预订状态已更新为待确认')
        } else {
          message.success(isEdit ? '更新成功' : '创建成功')
        }
        navigate('/hotel-bookings')
      } else {
        message.error(response.msg || (isEdit ? '更新失败' : '创建失败'))
      }
    } catch (error) {
      console.error('提交失败:', error)
      message.error(isEdit ? '更新失败' : '创建失败')
    } finally {
      setSubmitting(false)
    }
  }

  // 返回列表
  const handleBack = () => {
    navigate('/hotel-bookings')
  }

  // 重置表单
  const handleReset = () => {
    form.resetFields()
    setSelectedHotelId(null)
    setRoomTypes([])
  }

  useEffect(() => {
    const initializeForm = async () => {
      // 先加载酒店数据，确保获取到数据后再进行后续操作
      const hotelData = await fetchHotels()
      console.log('初始化表单，酒店数据:', hotelData)
      
      if (isEdit) {
        // 酒店数据加载完后再获取预订详情，并传递酒店数据
        await fetchBookingDetail(hotelData)
      } else if (baseData) {
        // 新增模式：如果有预填数据（来自重新安排），设置表单值
        console.log('设置预填数据:', baseData)
        form.setFieldsValue({
          ...baseData,
          checkInDate: baseData.checkInDate ? dayjs(baseData.checkInDate) : null,
          checkOutDate: baseData.checkOutDate ? dayjs(baseData.checkOutDate) : null
        })
      }
    }
    
    initializeForm()
  }, [id, baseData, rescheduleData])

  return (
    <div className="hotel-booking-form">
      <Card>
        <div style={{ marginBottom: 16 }}>
          <Space size="large">
            <Button
              icon={<ArrowLeftOutlined />}
              onClick={handleBack}
            >
              返回列表
            </Button>
            <h2 style={{ margin: 0 }}>
              {isRescheduleMode ? '重新安排酒店预订' : (isEdit ? '编辑酒店预订' : '新增酒店预订')}
            </h2>
          </Space>
        </div>

        <Spin spinning={loading}>
          <Form
            form={form}
            layout="vertical"
            onFinish={handleSubmit}
            initialValues={{
              status: 'pending',
              numberOfRooms: 1,
              totalGuests: 2
            }}
          >
            <Row gutter={16}>
              {/* 客人信息 */}
              <Col span={24}>
                <Divider orientation="left">客人信息</Divider>
              </Col>
              
              <Col span={8}>
                <Form.Item
                  label="客人姓名"
                  name="guestName"
                  rules={[{ required: true, message: '请输入客人姓名' }]}
                >
                  <Input placeholder="请输入客人姓名" />
                </Form.Item>
              </Col>

              <Col span={8}>
                <Form.Item
                  label="联系电话"
                  name="guestPhone"
                  rules={[{ required: true, message: '请输入联系电话' }]}
                >
                  <Input placeholder="请输入联系电话" />
                </Form.Item>
              </Col>

              <Col span={8}>
                <Form.Item
                  label="邮箱地址"
                  name="guestEmail"
                  rules={[
                    { type: 'email', message: '请输入有效的邮箱地址' }
                  ]}
                >
                  <Input placeholder="请输入邮箱地址（可选）" />
                </Form.Item>
              </Col>

              {/* 酒店信息 */}
              <Col span={24}>
                <Divider orientation="left">酒店信息</Divider>
              </Col>

              <Col span={8}>
                <Form.Item
                  label="选择酒店"
                  name="hotelId"
                  rules={[{ required: true, message: '请选择酒店' }]}
                >
                  <Select
                    placeholder="请选择酒店"
                    onChange={handleHotelChange}
                    showSearch
                    filterOption={(input, option) =>
                      option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
                    }
                  >
                    {hotels.map(hotel => (
                      <Option key={hotel.id} value={hotel.id}>
                        {hotel.hotelName} ({hotel.hotelLevel})
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>

              <Col span={8}>
                <Form.Item
                  label="房型"
                  name="roomTypeId"
                  rules={[{ required: true, message: '请选择房型' }]}
                >
                  <Select
                    placeholder="请先选择酒店"
                    disabled={!selectedHotelId}
                    onChange={handleRoomTypeChange}
                  >
                    {roomTypes.map(roomType => (
                      <Option key={roomType.id} value={roomType.id}>
                        {roomType.roomType} - ${roomType.basePrice}/晚
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>

              <Col span={8}>
                <Form.Item
                  label="房价（每晚）"
                  name="roomRate"
                  rules={[{ required: true, message: '请选择房型以获取房价' }]}
                >
                  <InputNumber
                    placeholder="请先选择房型"
                    min={0}
                    precision={2}
                    style={{ width: '100%' }}
                    addonBefore="$"
                    disabled
                  />
                </Form.Item>
              </Col>

              {/* 预订信息 */}
              <Col span={24}>
                <Divider orientation="left">预订信息</Divider>
              </Col>

              <Col span={6}>
                <Form.Item
                  label="入住日期"
                  name="checkInDate"
                  rules={[{ required: true, message: '请选择入住日期' }]}
                >
                  <DatePicker
                    placeholder="请选择入住日期"
                    style={{ width: '100%' }}
                    onChange={handleDateChange}
                  />
                </Form.Item>
              </Col>

              <Col span={6}>
                <Form.Item
                  label="退房日期"
                  name="checkOutDate"
                  rules={[{ required: true, message: '请选择退房日期' }]}
                >
                  <DatePicker
                    placeholder="请选择退房日期"
                    style={{ width: '100%' }}
                    onChange={handleDateChange}
                  />
                </Form.Item>
              </Col>

              <Col span={4}>
                <Form.Item
                  label="住宿天数"
                  name="nights"
                >
                  <InputNumber
                    placeholder="自动计算"
                    min={1}
                    style={{ width: '100%' }}
                    disabled
                  />
                </Form.Item>
              </Col>

              <Col span={4}>
                <Form.Item
                  label="房间数"
                  name="numberOfRooms"
                  rules={[{ required: true, message: '请输入房间数' }]}
                >
                  <InputNumber
                    placeholder="房间数"
                    min={1}
                    style={{ width: '100%' }}
                    onChange={calculateBookingDetails}
                  />
                </Form.Item>
              </Col>

              <Col span={4}>
                <Form.Item
                  label="客人数"
                  name="totalGuests"
                  rules={[{ required: true, message: '请输入客人数' }]}
                >
                  <InputNumber
                    placeholder="客人数"
                    min={1}
                    style={{ width: '100%' }}
                  />
                </Form.Item>
              </Col>

              <Col span={8}>
                <Form.Item
                  label="总金额"
                  name="totalAmount"
                >
                  <InputNumber
                    placeholder="自动计算"
                    min={0}
                    precision={2}
                    style={{ width: '100%' }}
                    addonBefore="$"
                    disabled
                  />
                </Form.Item>
              </Col>

              <Col span={8}>
                <Form.Item
                  label="预订状态"
                  name="status"
                  rules={[{ required: true, message: '请选择预订状态' }]}
                >
                  <Select placeholder="请选择预订状态">
                    {statusOptions.map(option => (
                      <Option key={option.value} value={option.value}>
                        {option.label}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>

              <Col span={8}>
                <Form.Item
                  label="排团订单ID"
                  name="scheduleOrderId"
                >
                  <InputNumber
                    placeholder="关联的排团订单ID（可选）"
                    style={{ width: '100%' }}
                  />
                </Form.Item>
              </Col>

              <Col span={24}>
                <Form.Item
                  label="特殊要求"
                  name="specialRequests"
                >
                  <TextArea
                    placeholder="请输入特殊要求（可选）"
                    rows={4}
                  />
                </Form.Item>
              </Col>

              {/* 操作按钮 */}
              <Col span={24}>
                <Form.Item>
                  <Space>
                    <Button
                      type="primary"
                      htmlType="submit"
                      loading={submitting}
                      icon={<SaveOutlined />}
                    >
                      {isRescheduleMode ? '确认重新安排' : (isEdit ? '更新预订' : '创建预订')}
                    </Button>
                    <Button
                      onClick={handleReset}
                      icon={<ReloadOutlined />}
                    >
                      重置
                    </Button>
                    <Button onClick={handleBack}>
                      取消
                    </Button>
                  </Space>
                </Form.Item>
              </Col>
            </Row>
          </Form>
        </Spin>
      </Card>
    </div>
  )
}

export default HotelBookingForm 