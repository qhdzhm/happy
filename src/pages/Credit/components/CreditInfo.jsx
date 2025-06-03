import React from 'react';
import { Popover, Tag, Divider } from 'antd';
import { InfoCircleOutlined } from '@ant-design/icons';
import moment from 'moment';

/**
 * 信用额度详情组件
 * 显示一个信息图标，悬停时展示详细信息
 */
const CreditInfo = ({ record }) => {
  // 没有记录或缺少基本信息时不显示
  if (!record || !record.agentId) {
    return null;
  }
  
  // 格式化日期
  const formatDate = (dateStr) => {
    if (!dateStr) return '未设置';
    return moment(dateStr).format('YYYY-MM-DD');
  };
  
  // 构建内容
  const content = (
    <div className="credit-detail-panel">
      <div className="detail-item">
        <span className="label">信用评级:</span>
        <span className="value">
          {record.creditRating || 'B'}
        </span>
      </div>
      
      <div className="detail-item">
        <span className="label">信用利率:</span>
        <span className="value number">
          {record.interestRate ? `${record.interestRate.toFixed(2)}%` : '0.00%'}
        </span>
      </div>
      
      <div className="detail-item">
        <span className="label">账单周期日:</span>
        <span className="value number">
          {record.billingCycleDay || 1}号
        </span>
      </div>
      
      <div className="detail-item">
        <span className="label">最后结算日期:</span>
        <span className="value date">
          {formatDate(record.lastSettlementDate)}
        </span>
      </div>
      
      <div className="detail-item">
        <span className="label">透支次数:</span>
        <span className="value number">
          {record.overdraftCount || 0}次
        </span>
      </div>
      
      <div className="detail-item">
        <span className="label">额度状态:</span>
        <span className="value">
          {record.isFrozen ? 
            <Tag color="red">已冻结</Tag> : 
            <Tag color="green">正常</Tag>}
        </span>
      </div>
      
      <Divider style={{ margin: '8px 0' }} />
      
      <div className="detail-item">
        <span className="label">最后更新:</span>
        <span className="value date">
          {record.lastUpdated ? moment(record.lastUpdated).format('YYYY-MM-DD HH:mm:ss') : '未知'}
        </span>
      </div>
      
      <div className="detail-item">
        <span className="label">创建时间:</span>
        <span className="value date">
          {record.createdAt ? moment(record.createdAt).format('YYYY-MM-DD HH:mm:ss') : '未知'}
        </span>
      </div>
    </div>
  );
  
  return (
    <Popover
      content={content}
      title="信用额度详细信息"
      placement="right"
      overlayStyle={{ maxWidth: '400px' }}
    >
      <InfoCircleOutlined style={{ color: '#1890ff', cursor: 'pointer' }} />
    </Popover>
  );
};

export default CreditInfo; 