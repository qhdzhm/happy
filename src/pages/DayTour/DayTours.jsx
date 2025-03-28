import React, { useState, useEffect } from 'react';
import { Table, Button, Space, Modal, message, Switch, Tag, Card, Image, Tooltip } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, ExclamationCircleOutlined, ScheduleOutlined, HighlightOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { getDayTourList, deleteDayTour, enableOrDisableDayTour } from '@/apis/daytour';
import './DayTours.scss';

const { confirm } = Modal;

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

  const handleManageSchedules = (record) => {
    navigate('/daytour/edit', { state: { id: record.dayTourId, activeTab: '2' } });
  };

  const handleManageHighlights = (record) => {
    navigate('/daytour/edit', { state: { id: record.dayTourId, activeTab: '3' } });
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
      dataIndex: 'imageUrl',
      key: 'imageUrl',
      width: 100,
      render: (imageUrl) => (
        <Image
          width={80}
          height={60}
          src={imageUrl || 'https://via.placeholder.com/80x60?text=No+Image'}
          alt="Tour"
          style={{ objectFit: 'cover' }}
          fallback="https://via.placeholder.com/80x60?text=Error"
        />
      ),
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
      title: '状态',
      key: 'isActive',
      dataIndex: 'isActive',
      render: (isActive, record) => (
        <Switch
          checked={isActive === 1}
          onChange={(checked) => handleStatusChange(checked, record)}
        />
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 320,
      render: (_, record) => (
        <Space size="small">
          <Button
            type="primary"
            size="small"
            icon={<ScheduleOutlined />}
            onClick={() => handleManageSchedules(record)}
          >
            日期和价格
          </Button>
          <Button
            type="primary"
            size="small"
            icon={<HighlightOutlined />}
            onClick={() => handleManageHighlights(record)}
          >
            亮点
          </Button>
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
          <Button
            type="link"
            size="small"
            onClick={() => navigate(`/daytour/schedules?id=${record.dayTourId}`)}
          >
            日程安排
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