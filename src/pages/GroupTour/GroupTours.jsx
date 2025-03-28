import React, { useState, useEffect } from 'react';
import { Table, Button, Space, Modal, message, Switch, Tag, Card, Image, Tooltip } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, ExclamationCircleOutlined, ScheduleOutlined, OrderedListOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { getGroupTourList, deleteGroupTour, enableOrDisableGroupTour } from '@/apis/grouptour';
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

  const handleStatusChange = async (checked, record) => {
    try {
      const status = checked ? 1 : 0;
      console.log('更改状态的记录:', record);
      const res = await enableOrDisableGroupTour(status, record.id);
      if (res.code === 1) {
        message.success(`跟团游已${checked ? '上架' : '下架'}`);
        fetchTours();
      } else {
        message.error(res.msg || `${checked ? '上架' : '下架'}失败`);
      }
    } catch (error) {
      console.error('更改跟团游状态失败:', error);
      message.error('更改跟团游状态失败');
    }
  };

  const handleManageDates = (record) => {
    navigate('/grouptour/edit', { state: { id: record.id, activeTab: '2' } });
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
      dataIndex: 'groupTourId',
      key: 'groupTourId',
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
      title: '目的地',
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
      dataIndex: 'theme',
      key: 'theme',
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
            onClick={() => handleManageDates(record)}
          >
            可用日期
          </Button>
          <Button
            type="primary"
            size="small"
            icon={<OrderedListOutlined />}
            onClick={() => handleManageItinerary(record)}
          >
            行程安排
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
          rowKey="groupTourId"
          pagination={pagination}
          loading={loading}
          onChange={handleTableChange}
          scroll={{ x: 1300 }}
        />
      </Card>
    </div>
  );
};

export default GroupTours; 