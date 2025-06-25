import React, { useState, useEffect } from 'react';
import { Card, Typography, Button, Space, Table, Tag, message, Popconfirm, Alert } from 'antd';
import { DeleteOutlined, ReloadOutlined, WarningOutlined } from '@ant-design/icons';
import { 
  getAllDiscountLevels, 
  getDiscountConfigsByLevel, 
  deleteProductDiscount,
  getDayTourList,
  getGroupTourList
} from '@/apis/discount';

const { Title, Text, Paragraph } = Typography;

const DataCleaner = () => {
  const [loading, setLoading] = useState(false);
  const [invalidConfigs, setInvalidConfigs] = useState([]);
  const [validProductIds, setValidProductIds] = useState({
    day_tour: [],
    group_tour: []
  });

  const checkDataIntegrity = async () => {
    setLoading(true);
    try {
      // 获取所有有效的产品ID
      const [dayTourRes, groupTourRes, levelsRes] = await Promise.all([
        getDayTourList(),
        getGroupTourList(),
        getAllDiscountLevels()
      ]);

      const dayTourIds = dayTourRes.code === 1 ? 
        (dayTourRes.data?.records || []).map(item => item.id) : [];
      const groupTourIds = groupTourRes.code === 1 ? 
        (groupTourRes.data?.records || []).map(item => item.id) : [];

      setValidProductIds({
        day_tour: dayTourIds,
        group_tour: groupTourIds
      });

      console.log('有效的一日游ID:', dayTourIds);
      console.log('有效的跟团游ID:', groupTourIds);

      // 检查每个等级的折扣配置
      const levels = levelsRes.code === 1 ? levelsRes.data || [] : [];
      const invalidList = [];

      for (const level of levels) {
        const configRes = await getDiscountConfigsByLevel(level.id);
        if (configRes.code === 1) {
          const configs = configRes.data || [];
          
          for (const config of configs) {
            const validIds = config.productType === 'day_tour' ? dayTourIds : groupTourIds;
            if (!validIds.includes(config.productId)) {
              invalidList.push({
                ...config,
                levelName: level.levelName,
                levelCode: level.levelCode,
                reason: `产品ID ${config.productId} 在${config.productType === 'day_tour' ? '一日游' : '跟团游'}表中不存在`
              });
            }
          }
        }
      }

      setInvalidConfigs(invalidList);
      
      if (invalidList.length === 0) {
        message.success('数据检查完成，没有发现无效配置');
      } else {
        message.warning(`发现 ${invalidList.length} 条无效配置`);
      }
    } catch (error) {
      console.error('数据检查失败:', error);
      message.error('数据检查失败');
    } finally {
      setLoading(false);
    }
  };

  const cleanInvalidConfig = async (configId) => {
    try {
      await deleteProductDiscount(configId);
      message.success('已删除无效配置');
      // 重新检查数据
      checkDataIntegrity();
    } catch (error) {
      message.error('删除无效配置失败');
    }
  };

  const cleanAllInvalidConfigs = async () => {
    try {
      setLoading(true);
      for (const config of invalidConfigs) {
        await deleteProductDiscount(config.id);
      }
      message.success(`已清理 ${invalidConfigs.length} 条无效配置`);
      setInvalidConfigs([]);
    } catch (error) {
      message.error('批量清理失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkDataIntegrity();
  }, []);

  const columns = [
    {
      title: '配置ID',
      dataIndex: 'id',
      key: 'id',
      width: 80
    },
    {
      title: '等级',
      key: 'level',
      render: (_, record) => (
        <Tag color="blue">{record.levelCode} - {record.levelName}</Tag>
      )
    },
    {
      title: '产品类型',
      dataIndex: 'productType',
      key: 'productType',
      render: (type) => (
        <Tag color={type === 'day_tour' ? 'green' : 'orange'}>
          {type === 'day_tour' ? '一日游' : '跟团游'}
        </Tag>
      )
    },
    {
      title: '产品ID',
      dataIndex: 'productId',
      key: 'productId',
      render: (id) => <Text code>{id}</Text>
    },
    {
      title: '折扣率',
      dataIndex: 'discountRate',
      key: 'discountRate',
      render: (rate) => `${(rate * 100).toFixed(1)}%`
    },
    {
      title: '问题原因',
      dataIndex: 'reason',
      key: 'reason',
      render: (reason) => (
        <Text type="danger">
          <WarningOutlined style={{ marginRight: 4 }} />
          {reason}
        </Text>
      )
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Popconfirm
          title="确定删除这条无效配置吗？"
          onConfirm={() => cleanInvalidConfig(record.id)}
          okText="确定"
          cancelText="取消"
        >
          <Button 
            type="link" 
            danger 
            icon={<DeleteOutlined />}
            size="small"
          >
            删除
          </Button>
        </Popconfirm>
      )
    }
  ];

  return (
    <Card title="数据清理工具">
      <Space style={{ marginBottom: 16 }}>
        <Button 
          type="primary" 
          icon={<ReloadOutlined />} 
          onClick={checkDataIntegrity}
          loading={loading}
        >
          重新检查
        </Button>
        
        {invalidConfigs.length > 0 && (
          <Popconfirm
            title={`确定要清理所有 ${invalidConfigs.length} 条无效配置吗？`}
            onConfirm={cleanAllInvalidConfigs}
            okText="确定"
            cancelText="取消"
          >
            <Button 
              danger 
              icon={<DeleteOutlined />}
              loading={loading}
            >
              清理所有无效配置
            </Button>
          </Popconfirm>
        )}
      </Space>

      {invalidConfigs.length > 0 ? (
        <>
          <Alert
            message="发现数据不一致问题"
            description={`发现 ${invalidConfigs.length} 条无效的折扣配置，这些配置引用的产品ID在产品表中不存在。建议清理这些无效配置。`}
            type="warning"
            showIcon
            style={{ marginBottom: 16 }}
          />
          
          <Table
            columns={columns}
            dataSource={invalidConfigs}
            rowKey="id"
            size="small"
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showTotal: (total) => `共 ${total} 条无效配置`
            }}
          />
        </>
      ) : (
        <Alert
          message="数据检查完成"
          description="没有发现无效的折扣配置，所有数据都是有效的。"
          type="success"
          showIcon
        />
      )}

      <div style={{ marginTop: 16, padding: 16, background: '#f9f9f9', borderRadius: 4 }}>
        <Title level={5}>📊 数据统计</Title>
        <ul>
          <li><strong>有效一日游产品：</strong>{validProductIds.day_tour.length} 个</li>
          <li><strong>有效跟团游产品：</strong>{validProductIds.group_tour.length} 个</li>
          <li><strong>无效折扣配置：</strong>{invalidConfigs.length} 条</li>
        </ul>
        
        {validProductIds.day_tour.length > 0 && (
          <div style={{ marginTop: 8 }}>
            <Text strong>一日游产品ID: </Text>
            <Text code>{validProductIds.day_tour.join(', ')}</Text>
          </div>
        )}
        
        {validProductIds.group_tour.length > 0 && (
          <div style={{ marginTop: 8 }}>
            <Text strong>跟团游产品ID: </Text>
            <Text code>{validProductIds.group_tour.join(', ')}</Text>
          </div>
        )}
      </div>
    </Card>
  );
};

export default DataCleaner; 