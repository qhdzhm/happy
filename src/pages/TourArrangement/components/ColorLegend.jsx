import React from 'react';
import { Card, Tag, Space, Divider, Typography } from 'antd';
import { InfoCircleOutlined } from '@ant-design/icons';

const { Text, Title } = Typography;

const ColorLegend = ({ scheduleData }) => {
  // 从排团数据中提取所有独特的地点和颜色
  const extractLocationColors = (data) => {
    const locationMap = new Map();
    
    data.forEach(order => {
      if (order.dates) {
        Object.values(order.dates).forEach(location => {
          if (location.name && location.color) {
            locationMap.set(location.name, location.color);
          }
        });
      }
    });
    
    // 转换为数组并按名称排序
    return Array.from(locationMap.entries())
      .map(([name, color]) => ({ name, color }))
      .sort((a, b) => a.name.localeCompare(b.name));
  };

  const locationColors = extractLocationColors(scheduleData);

  if (locationColors.length === 0) {
    return null;
  }

  return (
    <Card 
      size="small" 
      style={{ 
        marginBottom: 16,
        background: '#fafafa',
        border: '1px solid #d9d9d9'
      }}
      bodyStyle={{ padding: '12px 16px' }}
    >
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
        <InfoCircleOutlined style={{ color: '#1890ff', marginRight: 6 }} />
        <Text strong style={{ fontSize: '14px' }}>颜色图例</Text>
        <Divider type="vertical" />
        <Text type="secondary" style={{ fontSize: '12px' }}>
          不同颜色代表不同的旅游地点或项目
        </Text>
      </div>
      
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px 16px' }}>
        {locationColors.map(({ name, color }, index) => (
          <div key={`${name}-${index}`} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div
              style={{
                width: 16,
                height: 16,
                backgroundColor: color,
                borderRadius: '50%',
                border: '1px solid rgba(0,0,0,0.1)',
                flexShrink: 0
              }}
            />
            <Text style={{ fontSize: '13px', color: '#333' }}>{name}</Text>
          </div>
        ))}
      </div>
      
      {locationColors.length > 10 && (
        <div style={{ marginTop: 8, fontSize: '12px', color: '#666' }}>
          共 {locationColors.length} 种不同地点
        </div>
      )}
    </Card>
  );
};

export default ColorLegend; 