import React, { useState, useEffect } from 'react';
import { Table, Card, Button, DatePicker, Space, Typography, Tag, message, Switch, Tooltip } from 'antd';
import { PrinterOutlined, ExportOutlined, MergeCellsOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import * as tourAssignmentAPI from '@/api/tourAssignment';

const { Title } = Typography;

const AssignmentTable = () => {
  const [loading, setLoading] = useState(false);
  const [assignments, setAssignments] = useState([]);
  const [selectedDate, setSelectedDate] = useState(dayjs());
  const [enableMerge, setEnableMerge] = useState(true); // 默认启用地点合并

  useEffect(() => {
    fetchAssignments();
  }, [selectedDate, enableMerge]);

  // 地点合并规则配置
  const mergeRules = {
    // 亚瑟港相关地点可以合并
    '亚瑟港': ['亚瑟港', '亚瑟港(迅)', '亚瑟港(不)', '亚(迅)', '亚(不)', '亚'],
    // 玛丽亚岛和酒杯湾可以合并（经常一起游览）
    '玛丽亚岛+酒杯湾': ['玛丽亚岛', '玛', '酒杯湾', '酒', '酒(徒步)', '酒(观景)'],
    // 布鲁尼岛相关
    '布鲁尼岛': ['布鲁尼岛', '布'],
    // 霍巴特相关
    '霍巴特': ['霍巴特', '霍'],
    // 摇篮山相关
    '摇篮山': ['摇篮山', '摇'],
    // 朗塞斯顿相关
    '朗塞斯顿': ['朗塞斯顿', '朗']
  };

  // 获取地点的合并组
  const getMergeGroup = (destination) => {
    for (const [groupName, locations] of Object.entries(mergeRules)) {
      if (locations.includes(destination)) {
        return groupName;
      }
    }
    return destination; // 如果没有匹配的合并规则，返回原地点
  };

  // 智能合并同一导游的相似地点
  const mergeAssignmentsByGuideAndLocation = (assignments) => {
    if (!assignments || assignments.length === 0) return [];

    // 按导游分组
    const guideGroups = {};
    assignments.forEach(assignment => {
      const guideKey = assignment.guide?.guideId || 'unknown';
      if (!guideGroups[guideKey]) {
        guideGroups[guideKey] = [];
      }
      guideGroups[guideKey].push(assignment);
    });

    const mergedAssignments = [];

    // 对每个导游的分配进行地点合并
    Object.values(guideGroups).forEach(guideAssignments => {
      // 按合并组分类
      const locationGroups = {};
      guideAssignments.forEach(assignment => {
        const mergeGroup = getMergeGroup(assignment.destination);
        if (!locationGroups[mergeGroup]) {
          locationGroups[mergeGroup] = [];
        }
        locationGroups[mergeGroup].push(assignment);
      });

      // 合并每个地点组
      Object.entries(locationGroups).forEach(([groupName, groupAssignments]) => {
        if (groupAssignments.length === 1) {
          // 单个地点，直接添加
          mergedAssignments.push(groupAssignments[0]);
        } else {
          // 多个地点需要合并
          const baseAssignment = groupAssignments[0];
          
          // 合并数据
          const mergedAssignment = {
            ...baseAssignment,
            id: `merged_${baseAssignment.guide?.guideId}_${groupName}`, // 生成唯一ID
            destination: groupName,
            // 合并游客数量
            totalPeople: groupAssignments.reduce((sum, a) => sum + (a.totalPeople || 0), 0),
            adultCount: groupAssignments.reduce((sum, a) => sum + (a.adultCount || 0), 0),
            childCount: groupAssignments.reduce((sum, a) => sum + (a.childCount || 0), 0),
            // 合并具体地点信息（用于显示详情）
            mergedDestinations: groupAssignments.map(a => a.destination),
            originalAssignments: groupAssignments, // 保留原始数据
            isMerged: true, // 标记为合并记录
            // 合并特殊要求
            specialRequirements: [...new Set(
              groupAssignments.flatMap(a => a.specialRequirements || [])
            )],
            // 合并备注
            remarks: groupAssignments
              .map(a => a.remarks)
              .filter(r => r && r.trim())
              .join('; ') || null
          };

          console.log(`🔄 合并地点: ${groupAssignments.map(a => a.destination).join(' + ')} → ${groupName}`, {
            导游: baseAssignment.guide?.guideName,
            原始记录数: groupAssignments.length,
            合并后人数: mergedAssignment.totalPeople
          });

          mergedAssignments.push(mergedAssignment);
        }
      });
    });

    return mergedAssignments;
  };

  // 获取指定日期的分配记录
  const fetchAssignments = async () => {
    if (!selectedDate) return;
    
    setLoading(true);
    try {
      const dateStr = selectedDate.format('YYYY-MM-DD');
      const response = await tourAssignmentAPI.getAssignmentsByDate(dateStr);
      
      if (response.code === 1) {
        const originalAssignments = response.data || [];
        
        let finalAssignments = originalAssignments;
        
        if (enableMerge) {
          // 应用智能合并逻辑
          finalAssignments = mergeAssignmentsByGuideAndLocation(originalAssignments);
          
          console.log('📊 地点合并统计:', {
            原始记录数: originalAssignments.length,
            合并后记录数: finalAssignments.length,
            节省记录数: originalAssignments.length - finalAssignments.length
          });
        } else {
          console.log('📊 地点合并已禁用，显示原始记录:', originalAssignments.length);
        }
        
        setAssignments(finalAssignments);
      } else {
        message.error(response.msg || '获取分配记录失败');
      }
    } catch (error) {
      message.error('获取分配记录失败');
      console.error('获取分配记录失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // 表格列定义 - 模拟"图2"的表格结构
  const columns = [
    {
      title: '序号',
      key: 'index',
      width: 60,
      render: (_, __, index) => index + 1,
      align: 'center'
    },
    {
      title: '目的地',
      dataIndex: 'destination',
      key: 'destination',
      width: 150,
      align: 'center',
      render: (destination, record) => (
        <div>
          <div style={{ fontWeight: 'bold', fontSize: '14px' }}>
            {destination}
          </div>
          {record.isMerged && record.mergedDestinations && (
            <div style={{ 
              fontSize: '11px', 
              color: '#666', 
              marginTop: '2px',
              background: '#f0f9ff',
              padding: '2px 4px',
              borderRadius: '3px',
              border: '1px solid #e0f2fe'
            }}>
              合并: {record.mergedDestinations.join(' + ')}
            </div>
          )}
          {record.isMerged && (
            <Tag size="small" color="blue" style={{ marginTop: '2px' }}>
              已合并 ({record.originalAssignments?.length || 0})
            </Tag>
          )}
        </div>
      )
    },
    {
      title: '导游信息',
      key: 'guideInfo',
      width: 150,
      render: (_, record) => (
        <div style={{ textAlign: 'left' }}>
          <div style={{ fontWeight: 'bold' }}>{record.guide?.guideName}</div>
          <div style={{ fontSize: '12px', color: '#666' }}>{record.guide?.phone}</div>
          {record.guide?.languages && (
            <div style={{ fontSize: '12px', color: '#1890ff' }}>
              语言: {record.guide.languages}
            </div>
          )}
        </div>
      )
    },
    {
      title: '车辆信息',
      key: 'vehicleInfo',
      width: 130,
      render: (_, record) => (
        <div style={{ textAlign: 'left' }}>
          <div style={{ fontWeight: 'bold' }}>{record.vehicle?.licensePlate}</div>
          <div style={{ fontSize: '12px', color: '#666' }}>
            {record.vehicle?.vehicleType}
          </div>
          <div style={{ fontSize: '12px', color: '#52c41a' }}>
            {record.vehicle?.seatCount}座
          </div>
        </div>
      )
    },
    {
      title: '游客人数',
      key: 'peopleInfo',
      width: 120,
      align: 'center',
      render: (_, record) => (
        <div>
          <div style={{ fontWeight: 'bold', fontSize: '16px', color: record.isMerged ? '#1890ff' : '#000' }}>
            {record.totalPeople}人
          </div>
          <div style={{ fontSize: '12px', color: '#666' }}>
            成人: {record.adultCount}
          </div>
          <div style={{ fontSize: '12px', color: '#666' }}>
            儿童: {record.childCount}
          </div>
          {record.isMerged && (
            <div style={{ 
              fontSize: '10px', 
              color: '#1890ff',
              marginTop: '2px',
              fontStyle: 'italic'
            }}>
              合并总数
            </div>
          )}
        </div>
      )
    },
    {
      title: '联系信息',
      key: 'contactInfo',
      width: 140,
      render: (_, record) => (
        <div style={{ textAlign: 'left' }}>
          <div style={{ fontWeight: 'bold' }}>{record.contactPerson}</div>
          <div style={{ fontSize: '12px', color: '#666' }}>{record.contactPhone}</div>
        </div>
      )
    },
    {
      title: '接送信息',
      key: 'pickupInfo',
      width: 150,
      render: (_, record) => (
        <div style={{ textAlign: 'left' }}>
          {record.pickupLocation && (
            <div style={{ fontSize: '12px' }}>
              <span style={{ color: '#666' }}>接:</span> {record.pickupLocation}
            </div>
          )}
          {record.dropoffLocation && (
            <div style={{ fontSize: '12px' }}>
              <span style={{ color: '#666' }}>送:</span> {record.dropoffLocation}
            </div>
          )}
          {record.pickupMethod && (
            <div style={{ fontSize: '12px', color: '#1890ff' }}>
              方式: {getPickupMethodText(record.pickupMethod)}
            </div>
          )}
        </div>
      )
    },
    {
      title: '特殊需求',
      key: 'requirements',
      width: 120,
      render: (_, record) => {
        const requirements = [];
        if (record.specialRequirements) requirements.push('特殊要求');
        if (record.dietaryRestrictions) requirements.push('饮食限制');
        if (record.emergencyContact) requirements.push('紧急联系');
        
        return (
          <div>
            {requirements.length > 0 ? (
              requirements.map(req => (
                <Tag key={req} size="small" color="orange" style={{ margin: '1px' }}>
                  {req}
                </Tag>
              ))
            ) : (
              <span style={{ color: '#ccc' }}>无</span>
            )}
          </div>
        );
      }
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 80,
      align: 'center',
      render: (status) => {
        const statusConfig = {
          confirmed: { color: 'green', text: '已确认' },
          in_progress: { color: 'blue', text: '进行中' },
          completed: { color: 'purple', text: '已完成' },
          cancelled: { color: 'red', text: '已取消' }
        };
        const config = statusConfig[status] || { color: 'default', text: status };
        return <Tag color={config.color}>{config.text}</Tag>;
      }
    },
    {
      title: '备注',
      dataIndex: 'remarks',
      key: 'remarks',
      width: 120,
      ellipsis: true,
      render: (text, record) => (
        <div>
          {text || '-'}
          {record.isMerged && record.originalAssignments?.length > 1 && (
            <div style={{ 
              fontSize: '10px', 
              color: '#666',
              marginTop: '2px',
              fontStyle: 'italic'
            }}>
              来自{record.originalAssignments.length}个原始记录
            </div>
          )}
        </div>
      )
    }
  ];

  // 接送方式文本转换
  const getPickupMethodText = (method) => {
    const methodMap = {
      hotel_pickup: '酒店接送',
      meeting_point: '集合点',
      self_drive: '自驾',
      other: '其他'
    };
    return methodMap[method] || method;
  };

  // 打印功能
  const handlePrint = () => {
    window.print();
  };

  // 导出功能
  const handleExport = async () => {
    try {
      const dateStr = selectedDate.format('YYYY-MM-DD');
      const response = await tourAssignmentAPI.exportAssignments({
        startDate: dateStr,
        endDate: dateStr
      });
      
      if (response.code === 1) {
        message.success('导出成功');
        // 这里可以添加文件下载逻辑
      } else {
        message.error(response.msg || '导出失败');
      }
    } catch (error) {
      message.error('导出失败');
    }
  };

  // 计算统计信息
  const statistics = {
    totalAssignments: assignments.length,
    totalGuides: new Set(assignments.map(a => a.guide?.guideId)).size,
    totalVehicles: new Set(assignments.map(a => a.vehicle?.vehicleId)).size,
    totalPeople: assignments.reduce((sum, a) => sum + (a.totalPeople || 0), 0),
    destinations: [...new Set(assignments.map(a => a.destination))].join(', ')
  };

  return (
    <div className="assignment-table-page">
      <Card>
        {/* 头部信息 */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: 16,
          padding: '16px 0',
          borderBottom: '2px solid #f0f0f0'
        }}>
          <div>
            <Title level={3} style={{ margin: 0 }}>
              旅游团导游车辆分配表
            </Title>
            <div style={{ marginTop: 8, color: '#666' }}>
              <Space>
                <span>日期：</span>
                <DatePicker 
                  value={selectedDate}
                  onChange={setSelectedDate}
                  format="YYYY年MM月DD日"
                />
                <Tooltip 
                  title="启用后，同一导游的相似地点（如：亚瑟港+亚瑟港迅游，玛丽亚岛+酒杯湾）将智能合并为一个单子"
                  placement="top"
                >
                  <Space>
                    <MergeCellsOutlined style={{ color: enableMerge ? '#1890ff' : '#ccc' }} />
                    <span>智能合并：</span>
                    <Switch 
                      checked={enableMerge}
                      onChange={setEnableMerge}
                      size="small"
                    />
                  </Space>
                </Tooltip>
              </Space>
            </div>
          </div>
          <Space>
            <Button icon={<PrinterOutlined />} onClick={handlePrint}>
              打印
            </Button>
            <Button icon={<ExportOutlined />} onClick={handleExport}>
              导出
            </Button>
          </Space>
        </div>

        {/* 统计信息 */}
        <div style={{ 
          background: '#fafafa', 
          padding: '12px 16px',
          marginBottom: 16,
          borderRadius: '6px',
          fontSize: '14px'
        }}>
          <Space wrap>
            <span>总分配数：<strong>{statistics.totalAssignments}</strong></span>
            <span>导游数：<strong>{statistics.totalGuides}</strong></span>
            <span>车辆数：<strong>{statistics.totalVehicles}</strong></span>
            <span>游客总数：<strong>{statistics.totalPeople}</strong>人</span>
            {statistics.destinations && (
              <span>目的地：<strong>{statistics.destinations}</strong></span>
            )}
          </Space>
        </div>

        {/* 分配表格 */}
        <Table
          columns={columns}
          dataSource={assignments}
          loading={loading}
          pagination={false}
          rowKey="id"
          scroll={{ x: 1200 }}
          size="small"
          bordered
          className="assignment-detail-table"
          locale={{
            emptyText: selectedDate ? `${selectedDate.format('YYYY年MM月DD日')} 暂无分配记录` : '请选择日期'
          }}
        />

        {/* 页脚说明 */}
        <div style={{ 
          marginTop: 16, 
          textAlign: 'center', 
          color: '#999',
          fontSize: '12px',
          borderTop: '1px solid #f0f0f0',
          paddingTop: '16px'
        }}>
          <div>Happy Tassie Travel - 旅游团分配管理系统</div>
          <div>生成时间：{dayjs().format('YYYY-MM-DD HH:mm:ss')}</div>
        </div>
      </Card>

      <style jsx>{`
        @media print {
          .ant-btn,
          .ant-pagination,
          .no-print {
            display: none !important;
          }
          
          .assignment-detail-table .ant-table {
            font-size: 12px;
          }
          
          .assignment-detail-table .ant-table-thead > tr > th {
            background: #f5f5f5 !important;
            -webkit-print-color-adjust: exact;
          }
        }
      `}</style>
    </div>
  );
};

export default AssignmentTable; 