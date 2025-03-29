import React, { useState, useEffect } from 'react';
import { Table, Button, Space, Modal, message, Switch, Tag, Card, Image, Tooltip } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, ExclamationCircleOutlined, FileImageOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { getDayTourList, deleteDayTour, enableOrDisableDayTour } from '@/apis/daytour';
import './DayTours.scss';

const { confirm } = Modal;

// 处理OSS图片URL的函数
const processImageUrl = (url) => {
  if (!url) return '';
  
  // 如果是阿里云OSS的URL，尝试直接使用，不做额外处理
  // 前端直接显示后端返回的图片URL
  return url;
};

const DayTours = () => {
  const [tours, setTours] = useState([]);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchTours();
  }, [pagination.current, pagination.pageSize]);

  const fetchTours = async () => {
    setLoading(true);
    try {
      const params = {
        page: pagination.current,
        pageSize: pagination.pageSize,
      };
      const res = await getDayTourList(params);
      if (res.code === 1) {
        console.log('后端返回的一日游数据:', res.data.records);
        setTours(res.data.records);
        setPagination({
          ...pagination,
          total: res.data.total,
        });
      }
    } catch (error) {
      console.error('获取一日游列表失败:', error);
      message.error('获取一日游列表失败');
    } finally {
      setLoading(false);
    }
  };

  const handleTableChange = (pagination) => {
    setPagination(pagination);
  };

  const handleAddTour = () => {
    navigate('/daytour/add');
  };

  const handleEditTour = (record) => {
    navigate('/daytour/edit', { state: { id: record.dayTourId } });
  };

  const handleDelete = (id) => {
    confirm({
      title: '确定要删除此一日游吗?',
      icon: <ExclamationCircleOutlined />,
      content: '此操作不可逆，请谨慎操作。',
      onOk: async () => {
        try {
          const res = await deleteDayTour(id);
          if (res.code === 1) {
            message.success('删除成功');
            fetchTours();
          } else {
            message.error(res.msg || '删除失败');
          }
        } catch (error) {
          console.error('删除一日游失败:', error);
          message.error('删除一日游失败');
        }
      },
    });
  };

  const handleStatusChange = async (checked, record) => {
    try {
      const status = checked ? 1 : 0;
      const res = await enableOrDisableDayTour(status, record.dayTourId);
      if (res.code === 1) {
        message.success(`一日游已${checked ? '上架' : '下架'}`);
        fetchTours();
      } else {
        message.error(res.msg || `${checked ? '上架' : '下架'}失败`);
      }
    } catch (error) {
      console.error('更改一日游状态失败:', error);
      message.error('更改一日游状态失败');
    }
  };

  const getRatingTag = (rating) => {
    if (rating >= 4.5) return <Tag color="green">{rating}</Tag>;
    if (rating >= 3.5) return <Tag color="blue">{rating}</Tag>;
    if (rating >= 2.5) return <Tag color="orange">{rating}</Tag>;
    return <Tag color="red">{rating}</Tag>;
  };

  const columns = [
    {
      title: '一日游ID',
      dataIndex: 'dayTourId',
      key: 'dayTourId',
      width: 80,
    },
    {
      title: '图片',
      dataIndex: 'coverImage',
      key: 'coverImage',
      width: 100,
      render: (coverImage, record) => {
        // 直接使用原始URL
        return (
          <div style={{ 
            width: 80, 
            height: 60, 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            overflow: 'hidden',
            border: '1px solid #d9d9d9'
          }}>
            {coverImage ? (
              <img 
                src={coverImage} 
                alt={record.name || 'Tour'} 
                style={{ 
                  width: '100%', 
                  height: '100%', 
                  objectFit: 'cover',
                  display: 'block'
                }} 
                onError={(e) => {
                  console.error('图片加载失败:', coverImage);
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'flex';
                }}
              />
            ) : (
              <FileImageOutlined style={{ fontSize: 24, color: '#999' }} />
            )}
            <div style={{ 
              width: '100%', 
              height: '100%', 
              display: 'none', 
              alignItems: 'center', 
              justifyContent: 'center', 
              background: '#f5f5f5', 
              color: '#999'
            }}>
              <FileImageOutlined style={{ fontSize: 24 }} />
            </div>
          </div>
        );
      },
    },
    {
      title: '名称',
      dataIndex: 'name',
      key: 'name',
      ellipsis: {
        showTitle: false,
      },
      render: (name) => (
        <Tooltip placement="topLeft" title={name}>
          {name}
        </Tooltip>
      ),
    },
    {
      title: '地点',
      dataIndex: 'location',
      key: 'location',
    },
    {
      title: '价格',
      dataIndex: 'price',
      key: 'price',
      render: (price) => `¥${price}`,
    },
    {
      title: '时长',
      dataIndex: 'duration',
      key: 'duration',
    },
    {
      title: '评分',
      dataIndex: 'rating',
      key: 'rating',
      render: (rating) => getRatingTag(rating),
    },
    {
      title: '类别',
      dataIndex: 'category',
      key: 'category',
    },
    {
      title: '操作',
      key: 'action',
      width: 180,
      render: (_, record) => (
        <Space size="small">
          <Button
            type="primary"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEditTour(record)}
          >
            编辑
          </Button>
          <Button
            danger
            size="small"
            icon={<DeleteOutlined />}
            onClick={() => handleDelete(record.dayTourId)}
          >
            删除
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div className="day-tour-container">
      <Card title="一日游管理">
        <div className="button-group" style={{ marginBottom: '16px' }}>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAddTour}>
            添加一日游
          </Button>
          <Button type="default" onClick={() => navigate('/daytour/themes')} style={{ marginLeft: '8px' }}>
            主题管理
          </Button>
          <Button type="default" onClick={() => navigate('/daytour/suitable')} style={{ marginLeft: '8px' }}>
            适合人群管理
          </Button>
        </div>
        <Table
          columns={columns}
          dataSource={tours}
          rowKey="dayTourId"
          pagination={pagination}
          loading={loading}
          onChange={handleTableChange}
        />
      </Card>
    </div>
  );
};

export default DayTours; 