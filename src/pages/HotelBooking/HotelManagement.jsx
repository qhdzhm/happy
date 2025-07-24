import React, { useState, useEffect } from 'react'
import {
  Table,
  Button,
  Input,
  Space,
  Modal,
  message,
  Card,
  Form,
  Select,
  InputNumber,
  Popconfirm,
  Tabs,
  Tag
} from 'antd'
import {
  PlusOutlined,
  SearchOutlined,
  EditOutlined,
  DeleteOutlined,
  ReloadOutlined
} from '@ant-design/icons'
import {
  getHotels,
  addHotel,
  updateHotel,
  deleteHotel,
  getHotelRoomTypes,
  addHotelRoomType,
  updateHotelRoomType,
  deleteHotelRoomType,
  getHotelSuppliers,
  addHotelSupplier,
  updateHotelSupplier,
  deleteHotelSupplier
} from '@/apis/hotel'

const { Option } = Select
const { TextArea } = Input

const HotelManagement = () => {
  const [activeTab, setActiveTab] = useState('hotels')
  const [loading, setLoading] = useState(false)
  
  // 酒店相关状态
  const [hotels, setHotels] = useState([])
  const [hotelModalVisible, setHotelModalVisible] = useState(false)
  const [hotelForm] = Form.useForm()
  const [editingHotel, setEditingHotel] = useState(null)
  
  // 房型相关状态
  const [roomTypes, setRoomTypes] = useState([])
  const [roomTypeModalVisible, setRoomTypeModalVisible] = useState(false)
  const [roomTypeForm] = Form.useForm()
  const [editingRoomType, setEditingRoomType] = useState(null)
  const [selectedHotelId, setSelectedHotelId] = useState(null)
  
  // 供应商相关状态
  const [suppliers, setSuppliers] = useState([])
  const [supplierModalVisible, setSupplierModalVisible] = useState(false)
  const [supplierForm] = Form.useForm()
  const [editingSupplier, setEditingSupplier] = useState(null)

  // 酒店等级选项
  const hotelLevels = [
    '3星', '4星', '4.5星'
  ]

  // 获取酒店列表
  const fetchHotels = async () => {
    setLoading(true)
    try {
      const response = await getHotels()
      if (response.code === 1) {
        setHotels(response.data || [])
      }
    } catch (error) {
      console.error('获取酒店列表失败:', error)
    } finally {
      setLoading(false)
    }
  }

  // 获取房型列表
  const fetchRoomTypes = async (hotelId) => {
    if (!hotelId) return
    
    setLoading(true)
    try {
      const response = await getHotelRoomTypes(hotelId)
      if (response.code === 1) {
        setRoomTypes(response.data || [])
      }
    } catch (error) {
      console.error('获取房型列表失败:', error)
    } finally {
      setLoading(false)
    }
  }

  // 获取供应商列表
  const fetchSuppliers = async () => {
    setLoading(true)
    try {
      const response = await getHotelSuppliers()
      if (response.code === 1) {
        setSuppliers(response.data || [])
      }
    } catch (error) {
      console.error('获取供应商列表失败:', error)
    } finally {
      setLoading(false)
    }
  }

  // 酒店表格列
  const hotelColumns = [
    {
      title: '酒店名称',
      dataIndex: 'hotelName',
      key: 'hotelName'
    },
    {
      title: '酒店等级',
      dataIndex: 'hotelLevel',
      key: 'hotelLevel',
      render: (level) => <Tag color="blue">{level}</Tag>
    },
    {
      title: '地址',
      dataIndex: 'address',
      key: 'address'
    },
    {
      title: '联系电话',
      dataIndex: 'contactPhone',
      key: 'contactPhone'
    },
    {
      title: '酒店邮箱',
      dataIndex: 'contactEmail',
      key: 'contactEmail'
    },
    {
      title: '联系人',
      dataIndex: 'contactPerson',
      key: 'contactPerson'
    },
    {
      title: '供应商',
      dataIndex: 'supplierName',
      key: 'supplierName'
    },
    {
      title: '操作',
      key: 'action',
      width: 200,
      render: (_, record) => (
        <Space size="small">
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => handleEditHotel(record)}
          >
            编辑
          </Button>
          <Button
            type="link"
            onClick={() => {
              setSelectedHotelId(record.id)
              fetchRoomTypes(record.id)
              setActiveTab('roomTypes')
            }}
          >
            房型管理
          </Button>
          <Popconfirm
            title="确定要删除这个酒店吗？"
            onConfirm={() => handleDeleteHotel(record.id)}
          >
            <Button type="link" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      )
    }
  ]

  // 房型表格列
  const roomTypeColumns = [
    {
      title: '房型名称',
      dataIndex: 'roomType',
      key: 'roomType'
    },
    {
      title: '基础价格',
      dataIndex: 'basePrice',
      key: 'basePrice',
      render: (price) => `$${parseFloat(price).toFixed(2)}`
    },
    {
      title: '最大入住人数',
      dataIndex: 'maxOccupancy',
      key: 'maxOccupancy'
    },
    {
      title: '床型',
      dataIndex: 'bedType',
      key: 'bedType'
    },
    {
      title: '房间面积',
      dataIndex: 'roomSize',
      key: 'roomSize',
      render: (size) => size ? `${size}m²` : '-'
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      render: (_, record) => (
        <Space size="small">
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => handleEditRoomType(record)}
          >
            编辑
          </Button>
          <Popconfirm
            title="确定要删除这个房型吗？"
            onConfirm={() => handleDeleteRoomType(record.id)}
          >
            <Button type="link" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      )
    }
  ]

  // 供应商表格列
  const supplierColumns = [
    {
      title: '供应商名称',
      dataIndex: 'supplierName',
      key: 'supplierName'
    },
    {
      title: '联系人',
      dataIndex: 'contactPerson',
      key: 'contactPerson'
    },
    {
      title: '联系电话',
      dataIndex: 'contactPhone',
      key: 'contactPhone'
    },
    {
      title: '邮箱',
      dataIndex: 'email',
      key: 'email'
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      render: (_, record) => (
        <Space size="small">
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => handleEditSupplier(record)}
          >
            编辑
          </Button>
          <Popconfirm
            title="确定要删除这个供应商吗？"
            onConfirm={() => handleDeleteSupplier(record.id)}
          >
            <Button type="link" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      )
    }
  ]

  // 处理酒店相关操作
  const handleAddHotel = () => {
    setEditingHotel(null)
    hotelForm.resetFields()
    setHotelModalVisible(true)
  }

  const handleEditHotel = (hotel) => {
    setEditingHotel(hotel)
    hotelForm.setFieldsValue(hotel)
    setHotelModalVisible(true)
  }

  const handleSaveHotel = async (values) => {
    try {
      let response
      if (editingHotel) {
        response = await updateHotel({ id: editingHotel.id, ...values })
      } else {
        response = await addHotel(values)
      }

      if (response.code === 1) {
        message.success(editingHotel ? '更新成功' : '添加成功')
        setHotelModalVisible(false)
        fetchHotels()
      } else {
        message.error(response.msg || '操作失败')
      }
    } catch (error) {
      console.error('保存酒店失败:', error)
      message.error('操作失败')
    }
  }

  const handleDeleteHotel = async (id) => {
    try {
      const response = await deleteHotel(id)
      if (response.code === 1) {
        message.success('删除成功')
        fetchHotels()
      } else {
        message.error(response.msg || '删除失败')
      }
    } catch (error) {
      console.error('删除酒店失败:', error)
      message.error('删除失败')
    }
  }

  // 处理房型相关操作
  const handleAddRoomType = () => {
    if (!selectedHotelId) {
      message.warning('请先选择酒店')
      return
    }
    setEditingRoomType(null)
    roomTypeForm.resetFields()
    roomTypeForm.setFieldsValue({ hotelId: selectedHotelId })
    setRoomTypeModalVisible(true)
  }

  const handleEditRoomType = (roomType) => {
    setEditingRoomType(roomType)
    roomTypeForm.setFieldsValue(roomType)
    setRoomTypeModalVisible(true)
  }

  const handleSaveRoomType = async (values) => {
    try {
      let response
      if (editingRoomType) {
        response = await updateHotelRoomType({ id: editingRoomType.id, ...values })
      } else {
        response = await addHotelRoomType(values)
      }

      if (response.code === 1) {
        message.success(editingRoomType ? '更新成功' : '添加成功')
        setRoomTypeModalVisible(false)
        fetchRoomTypes(selectedHotelId)
      } else {
        message.error(response.msg || '操作失败')
      }
    } catch (error) {
      console.error('保存房型失败:', error)
      message.error('操作失败')
    }
  }

  const handleDeleteRoomType = async (id) => {
    try {
      const response = await deleteHotelRoomType(id)
      if (response.code === 1) {
        message.success('删除成功')
        fetchRoomTypes(selectedHotelId)
      } else {
        message.error(response.msg || '删除失败')
      }
    } catch (error) {
      console.error('删除房型失败:', error)
      message.error('删除失败')
    }
  }

  // 处理供应商相关操作
  const handleAddSupplier = () => {
    setEditingSupplier(null)
    supplierForm.resetFields()
    setSupplierModalVisible(true)
  }

  const handleEditSupplier = (supplier) => {
    setEditingSupplier(supplier)
    supplierForm.setFieldsValue(supplier)
    setSupplierModalVisible(true)
  }

  const handleSaveSupplier = async (values) => {
    try {
      let response
      if (editingSupplier) {
        response = await updateHotelSupplier({ id: editingSupplier.id, ...values })
      } else {
        response = await addHotelSupplier(values)
      }

      if (response.code === 1) {
        message.success(editingSupplier ? '更新成功' : '添加成功')
        setSupplierModalVisible(false)
        fetchSuppliers()
      } else {
        message.error(response.msg || '操作失败')
      }
    } catch (error) {
      console.error('保存供应商失败:', error)
      message.error('操作失败')
    }
  }

  const handleDeleteSupplier = async (id) => {
    try {
      const response = await deleteHotelSupplier(id)
      if (response.code === 1) {
        message.success('删除成功')
        fetchSuppliers()
      } else {
        message.error(response.msg || '删除失败')
      }
    } catch (error) {
      console.error('删除供应商失败:', error)
      message.error('删除失败')
    }
  }

  // 处理标签页切换
  const handleTabChange = (key) => {
    setActiveTab(key)
    if (key === 'hotels') {
      fetchHotels()
    } else if (key === 'suppliers') {
      fetchSuppliers()
    } else if (key === 'roomTypes') {
      if (selectedHotelId) {
        fetchRoomTypes(selectedHotelId)
      }
    }
  }

  useEffect(() => {
    fetchHotels()
    fetchSuppliers()
  }, [])

  const tabItems = [
    {
      key: 'hotels',
      label: '酒店管理',
      children: (
        <>
          <div style={{ marginBottom: 16 }}>
            <Space>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={handleAddHotel}
              >
                添加酒店
              </Button>
              <Button
                icon={<ReloadOutlined />}
                onClick={fetchHotels}
              >
                刷新
              </Button>
            </Space>
          </div>
          
          <Table
            columns={hotelColumns}
            dataSource={hotels}
            rowKey="id"
            loading={loading}
            pagination={{
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条/共 ${total} 条`
            }}
          />
        </>
      )
    },
    {
      key: 'roomTypes',
      label: '房型管理',
      children: (
        <>
          <div style={{ marginBottom: 16 }}>
            <Space>
              <Select
                placeholder="选择酒店"
                value={selectedHotelId}
                onChange={(hotelId) => {
                  setSelectedHotelId(hotelId)
                  fetchRoomTypes(hotelId)
                }}
                style={{ width: 200 }}
              >
                {hotels.map(hotel => (
                  <Option key={hotel.id} value={hotel.id}>
                    {hotel.hotelName}
                  </Option>
                ))}
              </Select>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={handleAddRoomType}
                disabled={!selectedHotelId}
              >
                添加房型
              </Button>
              <Button
                icon={<ReloadOutlined />}
                onClick={() => fetchRoomTypes(selectedHotelId)}
                disabled={!selectedHotelId}
              >
                刷新
              </Button>
            </Space>
          </div>
          
          <Table
            columns={roomTypeColumns}
            dataSource={roomTypes}
            rowKey="id"
            loading={loading}
            pagination={{
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条/共 ${total} 条`
            }}
          />
        </>
      )
    },
    {
      key: 'suppliers',
      label: '供应商管理',
      children: (
        <>
          <div style={{ marginBottom: 16 }}>
            <Space>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={handleAddSupplier}
              >
                添加供应商
              </Button>
              <Button
                icon={<ReloadOutlined />}
                onClick={fetchSuppliers}
              >
                刷新
              </Button>
            </Space>
          </div>
          
          <Table
            columns={supplierColumns}
            dataSource={suppliers}
            rowKey="id"
            loading={loading}
            pagination={{
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条/共 ${total} 条`
            }}
          />
        </>
      )
    }
  ]

  return (
    <div className="hotel-management">
      <Card>
        <Tabs 
          activeKey={activeTab} 
          onChange={handleTabChange}
          items={tabItems}
        />
      </Card>

      {/* 酒店模态框 */}
      <Modal
        title={editingHotel ? '编辑酒店' : '添加酒店'}
        open={hotelModalVisible}
        onCancel={() => setHotelModalVisible(false)}
        footer={null}
        width={600}
      >
        <Form
          form={hotelForm}
          layout="vertical"
          onFinish={handleSaveHotel}
        >
          <Form.Item
            label="酒店名称"
            name="hotelName"
            rules={[{ required: true, message: '请输入酒店名称' }]}
          >
            <Input placeholder="请输入酒店名称" />
          </Form.Item>

          <Form.Item
            label="酒店等级"
            name="hotelLevel"
            rules={[{ required: true, message: '请选择酒店等级' }]}
          >
            <Select placeholder="请选择酒店等级">
              {hotelLevels.map(level => (
                <Option key={level} value={level}>{level}</Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            label="地址"
            name="address"
            rules={[{ required: true, message: '请输入地址' }]}
          >
            <TextArea placeholder="请输入地址" rows={2} />
          </Form.Item>

          <Form.Item
            label="联系电话"
            name="contactPhone"
          >
            <Input placeholder="请输入联系电话" />
          </Form.Item>

          <Form.Item
            label="酒店邮箱"
            name="contactEmail"
          >
            <Input placeholder="请输入酒店邮箱" type="email" />
          </Form.Item>

          <Form.Item
            label="联系人"
            name="contactPerson"
          >
            <Input placeholder="请输入联系人姓名" />
          </Form.Item>

          <Form.Item
            label="供应商"
            name="supplierId"
          >
            <Select placeholder="请选择供应商">
              {suppliers.map(supplier => (
                <Option key={supplier.id} value={supplier.id}>
                  {supplier.supplierName}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            label="描述"
            name="description"
          >
            <TextArea placeholder="请输入酒店描述" rows={3} />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                保存
              </Button>
              <Button onClick={() => setHotelModalVisible(false)}>
                取消
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* 房型模态框 */}
      <Modal
        title={editingRoomType ? '编辑房型' : '添加房型'}
        open={roomTypeModalVisible}
        onCancel={() => setRoomTypeModalVisible(false)}
        footer={null}
        width={600}
      >
        <Form
          form={roomTypeForm}
          layout="vertical"
          onFinish={handleSaveRoomType}
        >
          <Form.Item name="hotelId" style={{ display: 'none' }}>
            <Input />
          </Form.Item>

          <Form.Item
            label="房型名称"
            name="roomType"
            rules={[{ required: true, message: '请输入房型名称' }]}
          >
            <Input placeholder="请输入房型名称" />
          </Form.Item>

          <Form.Item
            label="基础价格"
            name="basePrice"
            rules={[{ required: true, message: '请输入基础价格' }]}
          >
            <InputNumber
              placeholder="请输入基础价格"
              min={0}
              precision={2}
              style={{ width: '100%' }}
              addonBefore="$"
            />
          </Form.Item>

          <Form.Item
            label="最大入住人数"
            name="maxOccupancy"
            rules={[{ required: true, message: '请输入最大入住人数' }]}
          >
            <InputNumber
              placeholder="请输入最大入住人数"
              min={1}
              style={{ width: '100%' }}
            />
          </Form.Item>

          <Form.Item
            label="床型"
            name="bedType"
          >
            <Select placeholder="请选择床型">
              <Option value="单人床">单人床</Option>
              <Option value="双人床">双人床</Option>
              <Option value="大床">大床</Option>
              <Option value="双床">双床</Option>
              <Option value="沙发床">沙发床</Option>
            </Select>
          </Form.Item>

          <Form.Item
            label="房间面积（平方米）"
            name="roomSize"
          >
            <InputNumber
              placeholder="请输入房间面积"
              min={0}
              style={{ width: '100%' }}
            />
          </Form.Item>

          <Form.Item
            label="房型描述"
            name="description"
          >
            <TextArea placeholder="请输入房型描述" rows={3} />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                保存
              </Button>
              <Button onClick={() => setRoomTypeModalVisible(false)}>
                取消
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* 供应商模态框 */}
      <Modal
        title={editingSupplier ? '编辑供应商' : '添加供应商'}
        open={supplierModalVisible}
        onCancel={() => setSupplierModalVisible(false)}
        footer={null}
        width={600}
      >
        <Form
          form={supplierForm}
          layout="vertical"
          onFinish={handleSaveSupplier}
        >
          <Form.Item
            label="供应商名称"
            name="supplierName"
            rules={[{ required: true, message: '请输入供应商名称' }]}
          >
            <Input placeholder="请输入供应商名称" />
          </Form.Item>

          <Form.Item
            label="联系人"
            name="contactPerson"
            rules={[{ required: true, message: '请输入联系人' }]}
          >
            <Input placeholder="请输入联系人" />
          </Form.Item>

          <Form.Item
            label="联系电话"
            name="contactPhone"
            rules={[{ required: true, message: '请输入联系电话' }]}
          >
            <Input placeholder="请输入联系电话" />
          </Form.Item>

          <Form.Item
            label="邮箱"
            name="email"
            rules={[
              { required: true, message: '请输入邮箱' },
              { type: 'email', message: '请输入有效的邮箱地址' }
            ]}
          >
            <Input placeholder="请输入邮箱" />
          </Form.Item>

          <Form.Item
            label="地址"
            name="address"
          >
            <TextArea placeholder="请输入地址" rows={2} />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                保存
              </Button>
              <Button onClick={() => setSupplierModalVisible(false)}>
                取消
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default HotelManagement 