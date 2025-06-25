import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Tabs, 
  Table, 
  Button, 
  Space, 
  Modal, 
  Form, 
  Input, 
  InputNumber, 
  Select, 
  Switch, 
  message, 
  Popconfirm,
  Tag,
  // DatePicker, // 暂时注释，避免dayjs兼容性问题
  Row,
  Col
} from 'antd';
import { 
  PlusOutlined, 
  EditOutlined, 
  DeleteOutlined, 
  ReloadOutlined,
  SettingOutlined
} from '@ant-design/icons';
import {
  getAllDiscountLevels,
  createDiscountLevel,
  updateDiscountLevel,
  deleteDiscountLevel,
  getDiscountConfigsByLevel,
  createProductDiscount,
  updateProductDiscount,
  deleteProductDiscount,
  batchUpdateDiscountRate,
  getDayTourList,
  getGroupTourList
} from '@/apis/discount';
import DiscountStats from './DiscountStats';
import DemoData from './DemoData';
import ProductDebug from './ProductDebug';
import DataCleaner from './DataCleaner';
import './DiscountManagement.scss';

const { Option } = Select;

const DiscountManagement = () => {
  // 折扣等级相关状态
  const [discountLevels, setDiscountLevels] = useState([]);
  const [levelsLoading, setLevelsLoading] = useState(false);
  const [levelModalVisible, setLevelModalVisible] = useState(false);
  const [currentLevel, setCurrentLevel] = useState(null);
  const [levelForm] = Form.useForm();

  // 产品折扣配置相关状态
  const [productDiscounts, setProductDiscounts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [productModalVisible, setProductModalVisible] = useState(false);
  const [currentProduct, setCurrentProduct] = useState(null);
  const [productForm] = Form.useForm();
  const [selectedLevelId, setSelectedLevelId] = useState(null);
  
  // 产品列表
  const [dayTours, setDayTours] = useState([]);
  const [groupTours, setGroupTours] = useState([]);

  useEffect(() => {
    fetchDiscountLevels();
    fetchProductLists();
  }, []);

  useEffect(() => {
    if (selectedLevelId) {
      fetchProductDiscounts(selectedLevelId);
    }
  }, [selectedLevelId]);

  // 获取折扣等级列表
  const fetchDiscountLevels = async () => {
    setLevelsLoading(true);
    try {
      const res = await getAllDiscountLevels();
      if (res.code === 1) {
        setDiscountLevels(res.data || []);
        if (res.data && res.data.length > 0 && !selectedLevelId) {
          setSelectedLevelId(res.data[0].id);
        }
      }
    } catch (error) {
      message.error('获取折扣等级失败');
    } finally {
      setLevelsLoading(false);
    }
  };

  // 获取产品列表
  const fetchProductLists = async () => {
    try {
      const [dayTourRes, groupTourRes] = await Promise.all([
        getDayTourList(),
        getGroupTourList()
      ]);
      
      if (dayTourRes.code === 1) {
        // 处理分页数据结构
        const dayTourData = dayTourRes.data?.records || [];
              console.log('一日游数据:', dayTourData.slice(0, 2)); // 打印前2条数据供调试
      console.log('一日游所有ID:', dayTourData.map(item => item.id)); // 打印所有ID
      setDayTours(dayTourData);
    }
    if (groupTourRes.code === 1) {
      // 处理分页数据结构
      const groupTourData = groupTourRes.data?.records || [];
      console.log('跟团游数据:', groupTourData.slice(0, 2)); // 打印前2条数据供调试
      console.log('跟团游所有ID:', groupTourData.map(item => item.id)); // 打印所有ID
      setGroupTours(groupTourData);
      }
    } catch (error) {
      console.error('获取产品列表失败:', error);
      message.error('获取产品列表失败');
      // 如果API调用失败，设置空数组避免undefined错误
      setDayTours([]);
      setGroupTours([]);
    }
  };

  // 获取产品折扣配置
  const fetchProductDiscounts = async (levelId) => {
    setProductsLoading(true);
    try {
      const res = await getDiscountConfigsByLevel(levelId);
      if (res.code === 1) {
        const discountData = res.data || [];
        console.log(`等级${levelId}的折扣配置:`, discountData);
        console.log(`等级${levelId}配置的产品ID:`, discountData.map(item => `${item.productType}:${item.productId}`));
        setProductDiscounts(discountData);
      }
    } catch (error) {
      message.error('获取产品折扣配置失败');
    } finally {
      setProductsLoading(false);
    }
  };

  // 折扣等级管理
  const showLevelModal = (record = null) => {
    setCurrentLevel(record);
    if (record) {
      levelForm.setFieldsValue({
        ...record,
        isActive: record.isActive === 1
      });
    } else {
      levelForm.resetFields();
    }
    setLevelModalVisible(true);
  };

  const handleLevelOk = async () => {
    try {
      const values = await levelForm.validateFields();
      const data = {
        ...values,
        isActive: values.isActive ? 1 : 0
      };

      if (currentLevel) {
        data.id = currentLevel.id;
        await updateDiscountLevel(data);
        message.success('更新折扣等级成功');
      } else {
        await createDiscountLevel(data);
        message.success('创建折扣等级成功');
      }

      setLevelModalVisible(false);
      fetchDiscountLevels();
    } catch (error) {
      message.error(currentLevel ? '更新折扣等级失败' : '创建折扣等级失败');
    }
  };

  const handleDeleteLevel = async (id) => {
    try {
      await deleteDiscountLevel(id);
      message.success('删除折扣等级成功');
      fetchDiscountLevels();
      if (selectedLevelId === id) {
        setSelectedLevelId(null);
        setProductDiscounts([]);
      }
    } catch (error) {
      message.error('删除折扣等级失败');
    }
  };

  // 产品折扣配置管理
  const showProductModal = (record = null) => {
    setCurrentProduct(record);
    if (record) {
      productForm.setFieldsValue({
        ...record,
        discountRate: (1 - record.discountRate) * 100, // 显示优惠幅度而不是折扣率
        isActive: record.isActive === 1
      });
    } else {
      productForm.resetFields();
      productForm.setFieldsValue({
        levelId: selectedLevelId,
        isActive: true
      });
    }
    setProductModalVisible(true);
  };

  const handleProductOk = async () => {
    try {
      const values = await productForm.validateFields();
      const data = {
        ...values,
        discountRate: 1 - (values.discountRate / 100), // 将优惠幅度转换为折扣率
        isActive: values.isActive ? 1 : 0
      };

      if (currentProduct) {
        data.id = currentProduct.id;
        await updateProductDiscount(data);
        message.success('更新产品折扣配置成功');
      } else {
        await createProductDiscount(data);
        message.success('创建产品折扣配置成功');
      }

      setProductModalVisible(false);
      fetchProductDiscounts(selectedLevelId);
    } catch (error) {
      message.error(currentProduct ? '更新产品折扣配置失败' : '创建产品折扣配置失败');
    }
  };

  const handleDeleteProduct = async (id) => {
    try {
      await deleteProductDiscount(id);
      message.success('删除产品折扣配置成功');
      fetchProductDiscounts(selectedLevelId);
    } catch (error) {
      message.error('删除产品折扣配置失败');
    }
  };

  // 获取产品名称
  const getProductName = (productType, productId) => {
    const products = productType === 'day_tour' ? dayTours : groupTours;
    const product = products.find(p => p.id === productId);
    if (product) {
      // 根据实体类，主要字段是name，如果没有名称就使用描述的一部分
      const productName = product.name;
      if (productName && productName.trim()) {
        return productName;
      }
      // 如果没有名称，尝试使用描述的前20个字符
      if (product.description && product.description.trim()) {
        return `${product.description.substring(0, 20)}...`;
      }
      // 如果都没有，显示产品类型和ID
      const typeText = productType === 'day_tour' ? '一日游' : '跟团游';
      return `${typeText} ID: ${productId}`;
    }
    // 如果找不到产品，可能是数据还在加载中
    if (dayTours.length === 0 && groupTours.length === 0) {
      return '加载中...';
    }
    return `未找到产品 (ID: ${productId})`;
  };

  // 折扣等级表格列
  const levelColumns = [
    {
      title: '等级代码',
      dataIndex: 'levelCode',
      key: 'levelCode',
      render: (text) => <Tag color="blue">{text}</Tag>
    },
    {
      title: '等级名称',
      dataIndex: 'levelName',
      key: 'levelName'
    },
    {
      title: '等级描述',
      dataIndex: 'levelDescription',
      key: 'levelDescription'
    },
    {
      title: '排序',
      dataIndex: 'sortOrder',
      key: 'sortOrder',
      width: 80
    },
    {
      title: '状态',
      dataIndex: 'isActive',
      key: 'isActive',
      width: 80,
      render: (isActive) => (
        <Tag color={isActive === 1 ? 'green' : 'red'}>
          {isActive === 1 ? '启用' : '禁用'}
        </Tag>
      )
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
            onClick={() => showLevelModal(record)}
          >
            编辑
          </Button>
          <Popconfirm
            title="确定要删除这个折扣等级吗？"
            onConfirm={() => handleDeleteLevel(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Button type="link" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      )
    }
  ];

  // 产品折扣配置表格列
  const productColumns = [
    {
      title: '产品类型',
      dataIndex: 'productType',
      key: 'productType',
      width: 100,
      render: (type) => (
        <Tag color={type === 'day_tour' ? 'orange' : 'purple'}>
          {type === 'day_tour' ? '一日游' : '跟团游'}
        </Tag>
      )
    },
    {
      title: '产品名称',
      dataIndex: 'productId',
      key: 'productName',
      render: (productId, record) => getProductName(record.productType, productId)
    },
    {
      title: '优惠幅度',
      dataIndex: 'discountRate',
      key: 'discountRate',
      width: 100,
      render: (rate) => (
        <Tag color="green">
          {((1 - rate) * 100).toFixed(1)}% OFF
        </Tag>
      )
    },
    {
      title: '最小订单金额',
      dataIndex: 'minOrderAmount',
      key: 'minOrderAmount',
      width: 120,
      render: (amount) => amount ? `$${amount}` : '-'
    },
    {
      title: '最大折扣金额',
      dataIndex: 'maxDiscountAmount',
      key: 'maxDiscountAmount',
      width: 120,
      render: (amount) => amount ? `$${amount}` : '-'
    },
    {
      title: '状态',
      dataIndex: 'isActive',
      key: 'isActive',
      width: 80,
      render: (isActive) => (
        <Tag color={isActive === 1 ? 'green' : 'red'}>
          {isActive === 1 ? '启用' : '禁用'}
        </Tag>
      )
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
            onClick={() => showProductModal(record)}
          >
            编辑
          </Button>
          <Popconfirm
            title="确定要删除这个配置吗？"
            onConfirm={() => handleDeleteProduct(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Button type="link" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      )
    }
  ];

  const tabItems = [
    {
      key: 'levels',
      label: '折扣等级管理',
      children: (
        <div className="tab-content">
          <div className="toolbar">
            <Space>
              <Button 
                type="primary" 
                icon={<PlusOutlined />}
                onClick={() => showLevelModal()}
              >
                新增等级
              </Button>
              <Button 
                icon={<ReloadOutlined />}
                onClick={fetchDiscountLevels}
              >
                刷新
              </Button>
            </Space>
          </div>
          
          <Table
            columns={levelColumns}
            dataSource={discountLevels}
            loading={levelsLoading}
            rowKey="id"
            pagination={{
              total: discountLevels.length,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total) => `共 ${total} 条记录`
            }}
          />
        </div>
      )
    },
    {
      key: 'products',
      label: '产品折扣配置',
      children: (
        <div className="tab-content">
          <Row gutter={16} className="level-selector">
            <Col span={8}>
              <Select
                placeholder="选择折扣等级"
                value={selectedLevelId}
                onChange={setSelectedLevelId}
                style={{ width: '100%' }}
              >
                {discountLevels.map(level => (
                  <Option key={level.id} value={level.id}>
                    {level.levelCode} - {level.levelName}
                  </Option>
                ))}
              </Select>
            </Col>
          </Row>

          {selectedLevelId && (
            <>
              <div className="toolbar">
                <Space>
                  <Button 
                    type="primary" 
                    icon={<PlusOutlined />}
                    onClick={() => showProductModal()}
                  >
                    新增配置
                  </Button>
                  <Button 
                    icon={<ReloadOutlined />}
                    onClick={() => fetchProductDiscounts(selectedLevelId)}
                  >
                    刷新
                  </Button>
                </Space>
              </div>

              <Table
                columns={productColumns}
                dataSource={productDiscounts}
                loading={productsLoading}
                rowKey="id"
                pagination={{
                  total: productDiscounts.length,
                  showSizeChanger: true,
                  showQuickJumper: true,
                  showTotal: (total) => `共 ${total} 条记录`
                }}
              />
            </>
          )}
        </div>
      )
    },
    {
      key: 'stats',
      label: '折扣使用统计',
      children: <DiscountStats />
    },
    {
      key: 'demo',
      label: '演示说明',
      children: <DemoData />
    },
    {
      key: 'debug',
      label: '数据调试',
      children: <ProductDebug />
    },
    {
      key: 'cleaner',
      label: '数据清理',
      children: <DataCleaner />
    }
  ];

  return (
    <div className="discount-management">
      <Card title="折扣设置管理" className="main-card">
        <Tabs defaultActiveKey="levels" items={tabItems} />
      </Card>

      {/* 折扣等级编辑模态框 */}
      <Modal
        title={currentLevel ? '编辑折扣等级' : '新增折扣等级'}
        open={levelModalVisible}
        onOk={handleLevelOk}
        onCancel={() => setLevelModalVisible(false)}
        width={600}
      >
        <Form form={levelForm} layout="vertical">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="levelCode"
                label="等级代码"
                rules={[{ required: true, message: '请输入等级代码' }]}
              >
                <Input placeholder="如：A、B、C" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="levelName"
                label="等级名称"
                rules={[{ required: true, message: '请输入等级名称' }]}
              >
                <Input placeholder="如：A级代理" />
              </Form.Item>
            </Col>
          </Row>
          
          <Form.Item
            name="levelDescription"
            label="等级描述"
          >
            <Input.TextArea rows={3} placeholder="等级描述信息" />
          </Form.Item>
          
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="sortOrder"
                label="排序顺序"
                rules={[{ required: true, message: '请输入排序顺序' }]}
              >
                <InputNumber 
                  min={0} 
                  placeholder="数字越小等级越高" 
                  style={{ width: '100%' }}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="isActive"
                label="是否启用"
                valuePropName="checked"
                initialValue={true}
              >
                <Switch />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>

      {/* 产品折扣配置编辑模态框 */}
      <Modal
        title={currentProduct ? '编辑产品折扣配置' : '新增产品折扣配置'}
        open={productModalVisible}
        onOk={handleProductOk}
        onCancel={() => setProductModalVisible(false)}
        width={700}
      >
        <Form form={productForm} layout="vertical">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="levelId"
                label="折扣等级"
                rules={[{ required: true, message: '请选择折扣等级' }]}
              >
                <Select placeholder="选择折扣等级" disabled={!!currentProduct}>
                  {discountLevels.map(level => (
                    <Option key={level.id} value={level.id}>
                      {level.levelCode} - {level.levelName}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="productType"
                label="产品类型"
                rules={[{ required: true, message: '请选择产品类型' }]}
              >
                <Select placeholder="选择产品类型">
                  <Option value="day_tour">一日游</Option>
                  <Option value="group_tour">跟团游</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="productId"
            label="选择产品"
            rules={[{ required: true, message: '请选择产品' }]}
          >
            <Select 
              placeholder="选择产品"
              showSearch
              filterOption={(input, option) =>
                option.children.toLowerCase().includes(input.toLowerCase())
              }
            >
              {((productForm.getFieldValue('productType') === 'day_tour' ? dayTours : groupTours) || [])
                .map(product => {
                  // 获取产品显示名称
                  let displayName = product.name;
                  if (!displayName || !displayName.trim()) {
                    if (product.description && product.description.trim()) {
                      displayName = `${product.description.substring(0, 30)}...`;
                    } else {
                      const typeText = productForm.getFieldValue('productType') === 'day_tour' ? '一日游' : '跟团游';
                      displayName = `${typeText} ID: ${product.id}`;
                    }
                  }
                  return (
                    <Option key={product.id} value={product.id}>
                      {displayName}
                    </Option>
                  );
                })
              }
            </Select>
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="discountRate"
                label="优惠幅度 (%)"
                rules={[{ required: true, message: '请输入优惠幅度' }]}
              >
                <InputNumber 
                  min={0} 
                  max={100}
                  precision={1}
                  placeholder="如：20表示20%优惠，客户支付80%"
                  style={{ width: '100%' }}
                  addonAfter="% OFF"
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="isActive"
                label="是否启用"
                valuePropName="checked"
                initialValue={true}
              >
                <Switch />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="minOrderAmount"
                label="最小订单金额"
              >
                <InputNumber 
                  min={0}
                  precision={2}
                  placeholder="最小订单金额限制"
                  style={{ width: '100%' }}
                  addonBefore="$"
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="maxDiscountAmount"
                label="最大折扣金额"
              >
                <InputNumber 
                  min={0}
                  precision={2}
                  placeholder="最大折扣金额限制"
                  style={{ width: '100%' }}
                  addonBefore="$"
                />
              </Form.Item>
            </Col>
          </Row>

          {/* 暂时移除日期选择器，避免dayjs兼容性问题 */}
          {/* 
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="validFrom"
                label="生效开始时间"
              >
                <DatePicker 
                  showTime 
                  style={{ width: '100%' }}
                  placeholder="选择开始时间"
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="validUntil"
                label="生效结束时间"
              >
                <DatePicker 
                  showTime 
                  style={{ width: '100%' }}
                  placeholder="选择结束时间"
                />
              </Form.Item>
            </Col>
          </Row>
          */}
        </Form>
      </Modal>
    </div>
  );
};

export default DiscountManagement; 