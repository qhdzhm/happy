import React, { useState } from 'react';
import { 
  Card, 
  Form, 
  Input, 
  DatePicker, 
  Button, 
  Table, 
  Select,
  Tag, 
  Typography,
  Alert,
  Space,
  Spin,
  Empty,
  Row,
  Col,
  Divider,
  Radio
} from 'antd';
import { SearchOutlined, ReloadOutlined, PrinterOutlined, UserOutlined } from '@ant-design/icons';
import { getHotelCustomerStatistics } from '@/api/tourSchedule';
import './HotelCustomerStatistics.scss';

const { Title, Text } = Typography;
const { Option } = Select;

const HotelCustomerStatistics = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [statisticsData, setStatisticsData] = useState(null);
  const [selectedGuide, setSelectedGuide] = useState('all'); // 'all' 或具体导游名

  // 处理搜索
  const handleSearch = async (values) => {
    const { hotelName, tourDate } = values;
    
    if (!hotelName || !tourDate) {
      return;
    }

    setLoading(true);
    
    try {
      const response = await getHotelCustomerStatistics(hotelName, tourDate.format('YYYY-MM-DD'));
      
      if (response.code === 1) {
        setStatisticsData(response.data);
        setSelectedGuide('all'); // 重置选择
      } else {
        setStatisticsData(null);
        console.error('获取酒店客人统计失败:', response.msg);
      }
    } catch (error) {
      console.error('获取酒店客人统计异常:', error);
      setStatisticsData(null);
    } finally {
      setLoading(false);
    }
  };

  // 重置表单
  const handleReset = () => {
    form.resetFields();
    setStatisticsData(null);
    setSelectedGuide('all');
  };

  // 打印功能
  const handlePrint = () => {
    window.print();
  };

  // 获取当前显示的数据
  const getCurrentDisplayData = () => {
    if (!statisticsData) return null;
    
    if (selectedGuide === 'all') {
      // 显示所有导游的数据
      return statisticsData;
    } else {
      // 显示特定导游的数据
      const selectedGroup = statisticsData.guideGroups.find(
        group => group.guideName === selectedGuide
      );
      
      if (selectedGroup) {
        return {
          ...statisticsData,
          guideGroups: [selectedGroup],
          totalCustomers: selectedGroup.customerCount
        };
      }
    }
    return null;
  };

  // 生成打印用的表格数据
  const generateTableData = () => {
    const displayData = getCurrentDisplayData();
    if (!displayData) return [];

    const tableData = [];
    
    displayData.guideGroups.forEach((group, groupIndex) => {
      // 添加导游信息行（作为分组标题）
      tableData.push({
        key: `guide-${groupIndex}`,
        isGuideHeader: true,
        guideName: group.guideName,
        vehicleInfo: group.vehicleInfo,
        customerCount: group.customerCount,
        tourDate: displayData.tourDate
      });

      // 添加该导游下的所有客人
      group.customers.forEach((customer, customerIndex) => {
        tableData.push({
          key: `${groupIndex}-${customerIndex}`,
          isGuideHeader: false,
          ...customer,
          guideName: group.guideName,
          vehicleInfo: group.vehicleInfo
        });
      });
    });

    return tableData;
  };

  // 表格列定义
  const columns = [
    {
      title: '建议时间',
      dataIndex: 'suggestedTime',
      key: 'suggestedTime',
      width: 100,
      render: (text, record) => {
        if (record.isGuideHeader) {
          return <Text strong style={{ color: '#1890ff' }}>{record.tourDate}</Text>;
        }
        return '-'; // 客人行可以显示建议时间，这里先用-
      }
    },
    {
      title: '订单号',
      dataIndex: 'orderNumber',
      key: 'orderNumber',
      width: 140,
      render: (text, record) => {
        if (record.isGuideHeader) {
          return null;
        }
        return <Text code>{text}</Text>;
      }
    },
    {
      title: '姓名',
      dataIndex: 'contactPerson',
      key: 'contactPerson',
      width: 120,
      render: (text, record) => {
        if (record.isGuideHeader) {
          return (
            <div style={{ background: '#52c41a', color: 'white', padding: '4px 8px', borderRadius: '4px', textAlign: 'center' }}>
              <Text strong style={{ color: 'white' }}>{record.guideName}</Text>
            </div>
          );
        }
        return text;
      }
    },
    {
      title: '人数',
      dataIndex: 'totalPeople',
      key: 'totalPeople',
      width: 80,
      align: 'center',
      render: (text, record) => {
        if (record.isGuideHeader) {
          return <Text strong style={{ color: '#1890ff' }}>{record.customerCount}</Text>;
        }
        const total = (record.adultCount || 0) + (record.childCount || 0);
        return <Tag color="blue">{total}</Tag>;
      }
    },
    {
      title: '联系方式',
      dataIndex: 'contactPhone',
      key: 'contactPhone',
      width: 130,
      render: (text, record) => {
        if (record.isGuideHeader) {
          return <Text style={{ color: '#666' }}>{record.vehicleInfo}</Text>;
        }
        return text;
      }
    },
    {
      title: '上车地点',
      dataIndex: 'pickupLocation',
      key: 'pickupLocation',
      width: 150,
      render: (text, record) => {
        if (record.isGuideHeader) {
          return null;
        }
        return text || '市中心';
      }
    },
    {
      title: '送达酒店',
      dataIndex: 'dropoffLocation',
      key: 'dropoffLocation',
      width: 150,
      render: (text, record) => {
        if (record.isGuideHeader) {
          return null;
        }
        return <Text strong style={{ color: '#1890ff' }}>{text || '-'}</Text>;
      }
    },
    {
      title: '当天导游',
      dataIndex: 'currentGuide',
      key: 'currentGuide',
      width: 120,
      render: (text, record) => {
        if (record.isGuideHeader) {
          return null;
        }
        // 显示当前选择的导游，如果选择了特定导游就显示，否则显示分配的导游
        if (selectedGuide !== 'all') {
          return <Tag color="processing">{selectedGuide}</Tag>;
        }
        return record.guideName ? <Tag color="success">{record.guideName}</Tag> : <Tag color="default">未分配</Tag>;
      }
    }
  ];

  const displayData = getCurrentDisplayData();
  const tableData = generateTableData();

  return (
    <div className="hotel-customer-statistics">
      <div className="no-print">
        <Card>
          <Title level={2}>酒店送客巴士安排表</Title>
          <Text type="secondary">
            统计需要送回指定酒店的客人，用于安排送客巴士服务（市中心→酒店）。
          </Text>
          
          <Divider />
          
          {/* 搜索表单 */}
          <Form
            form={form}
            layout="inline"
            onFinish={handleSearch}
            style={{ marginBottom: 24 }}
          >
            <Form.Item
              name="hotelName"
              label="酒店名称"
              rules={[{ required: true, message: '请输入酒店名称' }]}
            >
              <Input 
                placeholder="请输入酒店名称"
                style={{ width: 200 }}
              />
            </Form.Item>
            
            <Form.Item
              name="tourDate"
              label="旅游日期"
              rules={[{ required: true, message: '请选择旅游日期' }]}
            >
              <DatePicker 
                placeholder="选择日期"
                style={{ width: 150 }}
              />
            </Form.Item>
            
            <Form.Item>
              <Space>
                <Button 
                  type="primary" 
                  htmlType="submit" 
                  icon={<SearchOutlined />}
                  loading={loading}
                >
                  查询统计
                </Button>
                <Button 
                  onClick={handleReset}
                  icon={<ReloadOutlined />}
                >
                  重置
                </Button>
              </Space>
            </Form.Item>
          </Form>

          {/* 导游选择器 */}
          {displayData && displayData.guideGroups.length > 0 && (
            <Card size="small" style={{ marginBottom: 16 }}>
              <Space align="center">
                <UserOutlined />
                <Text strong>选择导游:</Text>
                <Radio.Group 
                  value={selectedGuide} 
                  onChange={(e) => setSelectedGuide(e.target.value)}
                  buttonStyle="solid"
                >
                  <Radio.Button value="all">全部导游</Radio.Button>
                  {displayData.guideGroups.map((group, index) => (
                    <Radio.Button key={index} value={group.guideName}>
                      {group.guideName} ({group.customerCount}人)
                    </Radio.Button>
                  ))}
                </Radio.Group>
                <Button 
                  type="primary"
                  icon={<PrinterOutlined />}
                  onClick={handlePrint}
                  style={{ marginLeft: 16 }}
                >
                  打印分配表
                </Button>
              </Space>
            </Card>
          )}

          {/* 加载状态 */}
          {loading && (
            <div style={{ textAlign: 'center', padding: '40px' }}>
              <Spin size="large" />
              <div style={{ marginTop: 16 }}>正在统计酒店客人信息...</div>
            </div>
          )}

          {/* 使用说明 */}
          {!loading && !statisticsData && (
                         <Alert
               message="送客巴士使用说明"
               description={
                 <div>
                   <p>1. 输入目标酒店名称（支持模糊匹配）和日期</p>
                   <p>2. 系统查找需要送回该酒店的所有客人（仅检查送达地点）</p>
                   <p>3. 可以选择特定导游查看该导游负责的送客任务</p>
                   <p>4. 点击"打印分配表"生成送客巴士安排单，方便导游执行送客服务</p>
                   <p>💡 <Text type="warning">注意：此功能专用于市中心→酒店的送客服务</Text></p>
                 </div>
               }
              type="info"
              showIcon
              style={{ marginTop: 24 }}
            />
          )}
        </Card>
      </div>

      {/* 打印区域 */}
      {displayData && (
        <div className="print-area">
          {/* 打印标题 */}
                     <div className="print-header">
             <Title level={3} style={{ textAlign: 'center', margin: '20px 0' }}>
               酒店送客巴士安排表
             </Title>
            
            {/* 汇总信息 */}
            <Row gutter={16} style={{ marginBottom: 20 }}>
              <Col span={6}>
                <Text strong>日期: </Text>
                <Text>{displayData.tourDate}</Text>
              </Col>
              <Col span={6}>
                <Text strong>酒店: </Text>
                <Text>{displayData.hotelName}</Text>
              </Col>
              <Col span={6}>
                <Text strong>总人数: </Text>
                <Text>{displayData.totalCustomers}</Text>
              </Col>
              <Col span={6}>
                <Text strong>导游数: </Text>
                <Text>{displayData.guideGroups.length}</Text>
              </Col>
            </Row>
          </div>

          {/* 统计结果表格 */}
          {displayData.totalCustomers === 0 ? (
            <Empty 
              description={`未找到住在 "${displayData.hotelName}" 在 "${displayData.tourDate}" 的客人`}
              style={{ margin: '40px 0' }}
            />
          ) : (
            <Table
              columns={columns}
              dataSource={tableData}
              pagination={false}
              size="small"
              bordered
              className="assignment-table"
              rowClassName={(record) => record.isGuideHeader ? 'guide-header-row' : 'customer-row'}
            />
          )}
        </div>
      )}
    </div>
  );
};

export default HotelCustomerStatistics; 