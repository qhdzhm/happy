import React, { useState, useEffect } from 'react';
import { Table, Button, Space, Modal, message, Tag, Card, Tooltip } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, ExclamationCircleOutlined, OrderedListOutlined, FileImageOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { getGroupTourList, deleteGroupTour } from '@/apis/grouptour';
import './GroupTours.scss';

const { confirm } = Modal;

const GroupTours = () => {
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
      const res = await getGroupTourList(params);
      if (res.code === 1) {
        console.log('获取跟团游列表响应:', res.data);
        console.log('第一条跟团游记录:', res.data.records[0]);
        setTours(res.data.records);
        setPagination({
          ...pagination,
          total: res.data.total,
        });
      }
    } catch (error) {
      console.error('获取跟团游列表失败:', error);
      message.error('获取跟团游列表失败');
    } finally {
      setLoading(false);
    }
  };

  const handleTableChange = (pagination) => {
    setPagination(pagination);
  };

  const handleAddTour = () => {
    navigate('/grouptour/add');
  };

  const handleEditTour = (record) => {
    console.log('编辑跟团游，传递的记录:', record);
    navigate('/grouptour/edit', { state: { id: record.id } });
  };

  const handleDelete = (id) => {
    confirm({
      title: '确定要删除此跟团游吗?',
      icon: <ExclamationCircleOutlined />,
      content: '此操作不可逆，请谨慎操作。',
      onOk: async () => {
        try {
          const res = await deleteGroupTour(id);
          if (res.code === 1) {
            message.success('删除成功');
            fetchTours();
          } else {
            message.error(res.msg || '删除失败');
          }
        } catch (error) {
          console.error('删除跟团游失败:', error);
          message.error('删除跟团游失败');
        }
      },
    });
  };

  const handleManageItinerary = (record) => {
    navigate('/grouptour/edit', { state: { id: record.id, activeTab: '3' } });
  };

  const getRatingTag = (rating) => {
    if (rating >= 4.5) return <Tag color="green">{rating}</Tag>;
    if (rating >= 3.5) return <Tag color="blue">{rating}</Tag>;
    if (rating >= 2.5) return <Tag color="orange">{rating}</Tag>;
    return <Tag color="red">{rating}</Tag>;
  };

  const columns = [
    {
      title: '跟团游ID',
      dataIndex: 'id',
      key: 'id',
      width: 80,
    },
    {
      title: '图片',
      dataIndex: 'coverImage',
      key: 'coverImage',
      width: 100,
      render: (coverImage, record) => {
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
      title: '目的地',
      dataIndex: 'location',
      key: 'location',
    },
    {
      title: '价格',
      dataIndex: 'price',
      key: 'price',
              render: (price) => `$${price}`,
    },
    {
      title: '持续时间',
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
      title: '主题',
      dataIndex: 'themes',
      key: 'themes',
      render: (themes) => {
        if (!themes || themes.length === 0) return '无主题';
        return Array.isArray(themes) 
          ? themes.map((theme, index) => (
              <Tag color="blue" key={index}>
                {theme}
              </Tag>
            ))
          : themes;
      }
    },
    {
      title: '操作',
      key: 'action',
      width: 120,
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
            onClick={() => handleDelete(record.id)}
          >
            删除
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div className="group-tour-container">
      <Card title="跟团游管理">
        <div className="button-group">
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAddTour}>
            添加跟团游
          </Button>
        </div>
        <Table
          columns={columns}
          dataSource={tours}
          rowKey="id"
          pagination={pagination}
          loading={loading}
          onChange={handleTableChange}
          scroll={{ x: 1100 }}
          size="small"
        />
      </Card>
    </div>
  );
};

export default GroupTours; 