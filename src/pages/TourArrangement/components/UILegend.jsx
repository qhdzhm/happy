import React from 'react';
import { Card, Row, Col, Typography, Space, Tag } from 'antd';
import { InfoCircleOutlined, HomeOutlined, QuestionOutlined } from '@ant-design/icons';

const { Text, Title } = Typography;

const UILegend = () => {
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
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 12 }}>
        <InfoCircleOutlined style={{ color: '#1890ff', marginRight: 6 }} />
        <Text strong style={{ fontSize: '14px' }}>UI图例说明</Text>
      </div>
      
      <Row gutter={[24, 16]}>
        {/* 边框样式说明 */}
        <Col span={12}>
          <div style={{ marginBottom: 8 }}>
            <Text strong style={{ fontSize: '13px', color: '#333' }}>边框样式</Text>
          </div>
          <Space direction="vertical" size={8} style={{ width: '100%' }}>
            {/* 普通边框 - 使用不同颜色示例 */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div
                style={{
                  width: 60,
                  height: 30,
                  border: '2px solid #1890ff',
                  borderRadius: '6px',
                  backgroundColor: '#f0f9ff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '10px'
                }}
              >
                行程
              </div>
              <Text style={{ fontSize: '12px' }}>普通行程（实线边框）</Text>
            </div>
            
            {/* 虚线边框 - 使用不同颜色示例 */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div
                style={{
                  width: 60,
                  height: 30,
                  border: '2px dashed #52c41a',
                  borderRadius: '6px',
                  backgroundColor: '#f6ffed',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '10px'
                }}
              >
                行程
              </div>
              <Text style={{ fontSize: '12px' }}>有酒店预订（虚线边框）</Text>
            </div>
            
            {/* 粗边框加阴影 */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div
                style={{
                  width: 60,
                  height: 30,
                  border: '3px solid #f5222d',
                  borderRadius: '8px',
                  backgroundColor: '#fff2f0',
                  boxShadow: '0 0 8px #f5222d40, inset 0 0 8px #f5222d20',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '10px'
                }}
              >
                行程
              </div>
              <Text style={{ fontSize: '12px' }}>酒店预订已确认（粗边框+阴影）</Text>
            </div>
          </Space>
        </Col>

        {/* 角标说明 */}
        <Col span={12}>
          <div style={{ marginBottom: 8 }}>
            <Text strong style={{ fontSize: '13px', color: '#333' }}>角标说明</Text>
          </div>
          <Space direction="vertical" size={8} style={{ width: '100%' }}>
            {/* 绿色角标 - 调整位置 */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ position: 'relative', margin: '0 12px 0 0' }}>
                <div
                  style={{
                    width: 60,
                    height: 30,
                    border: '2px solid #d9d9d9',
                    borderRadius: '6px',
                    backgroundColor: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '10px'
                  }}
                >
                  行程
                </div>
                <div style={{
                  position: 'absolute',
                  top: '-10px',
                  right: '-10px',
                  width: '18px',
                  height: '18px',
                  backgroundColor: '#52c41a',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontSize: '10px',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                  border: '1px solid #fff'
                }}>
                  <HomeOutlined />
                </div>
              </div>
              <Text style={{ fontSize: '12px' }}>酒店预订已确认</Text>
            </div>
            
            {/* 黄色角标 - 调整位置 */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ position: 'relative', margin: '0 12px 0 0' }}>
                <div
                  style={{
                    width: 60,
                    height: 30,
                    border: '2px solid #d9d9d9',
                    borderRadius: '6px',
                    backgroundColor: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '10px'
                  }}
                >
                  行程
                </div>
                <div style={{
                  position: 'absolute',
                  top: '-8px',
                  right: '-8px',
                  width: '14px',
                  height: '14px',
                  backgroundColor: '#faad14',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontSize: '8px',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                  border: '1px solid #fff'
                }}>
                  ?
                </div>
              </div>
              <Text style={{ fontSize: '12px' }}>酒店预订待确认</Text>
            </div>

            {/* 无角标 */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ margin: '0 12px 0 0' }}>
                <div
                  style={{
                    width: 60,
                    height: 30,
                    border: '2px solid #d9d9d9',
                    borderRadius: '6px',
                    backgroundColor: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '10px'
                  }}
                >
                  行程
                </div>
              </div>
              <Text style={{ fontSize: '12px' }}>无酒店预订</Text>
            </div>
          </Space>
        </Col>
      </Row>

      <div style={{ marginTop: 12, paddingTop: 8, borderTop: '1px solid #f0f0f0' }}>
        <Text type="secondary" style={{ fontSize: '11px' }}>
          💡 提示：
          <br />
          • <strong>边框颜色</strong>：每个订单组有自己的颜色（蓝色、绿色、红色等），相同颜色属于同一个订单
          <br />
          • <strong>边框样式</strong>：实线=无酒店预订，虚线=有酒店预订待确认，粗边框+阴影=酒店预订已确认  
          <br />
          • <strong>角标位置</strong>：显示在行程框的右上角，表示酒店预订状态
        </Text>
      </div>
    </Card>
  );
};

export default UILegend; 