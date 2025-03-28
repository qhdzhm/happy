import React, { useEffect, useState } from 'react';
import { Table, Button, message, Form, Input, DatePicker, Select, Modal, Space, Card, Col, Row, InputNumber } from 'antd';
import { 
  getDayTourSchedulesByDayTourId,
  saveDayTourSchedule,
  deleteDayTourScheduleById,
  getDayTourList,
  getDayTourById
} from '@/apis/daytour';
import moment from 'moment';
import { useLocation, useNavigate } from 'react-router-dom';
import './index.scss';

const { RangePicker } = DatePicker;
const { Option } = Select;

const ScheduleManagement = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [schedules, setSchedules] = useState([]);
  const [visible, setVisible] = useState(false);
  const [dayTours, setDayTours] = useState([]);
  const [selectedDayTour, setSelectedDayTour] = useState(null);
  const [selectedDayTourInfo, setSelectedDayTourInfo] = useState(null);
  const [scheduleType, setScheduleType] = useState('single');

  // 获取一日游列表
  const fetchDayTours = async () => {
    try {
      const res = await getDayTourList({});
      if (res.code === 1) {
        setDayTours(res.data.records || []);
        
        // 检查URL中是否有dayTourId参数
        const query = new URLSearchParams(location.search);
        const dayTourId = query.get('id');
        
        if (dayTourId && res.data.records) {
          setSelectedDayTour(Number(dayTourId));
          fetchSchedules(Number(dayTourId));
          fetchDayTourInfo(Number(dayTourId));
        }
      }
    } catch (error) {
      message.error('获取一日游列表失败');
    }
  };

  // 获取日程安排列表
  const fetchSchedules = async (dayTourId) => {
    if (!dayTourId) return;
    
    setLoading(true);
    try {
      const res = await getDayTourSchedulesByDayTourId(dayTourId);
      if (res.code === 1) {
        setSchedules(res.data || []);
      } else {
        message.error(res.msg || '获取日程安排失败');
      }
    } catch (error) {
      message.error('获取日程安排失败');
    } finally {
      setLoading(false);
    }
  };

  // 获取一日游详情
  const fetchDayTourInfo = async (dayTourId) => {
    try {
      const res = await getDayTourById(dayTourId);
      if (res.code === 1 && res.data) {
        setSelectedDayTourInfo(res.data);
      }
    } catch (error) {
      console.error('获取一日游详情失败', error);
    }
  };

  // 选择一日游
  const handleDayTourChange = (value) => {
    setSelectedDayTour(value);
    fetchSchedules(value);
    fetchDayTourInfo(value);
    
    // 更新URL，不刷新页面
    navigate(`/daytour/schedules?id=${value}`, { replace: true });
  };

  // 初始化数据
  useEffect(() => {
    fetchDayTours();
  }, []);

  // 返回按钮处理
  const handleBack = () => {
    navigate('/daytour');
  };

  // 表格列定义
  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 60
    },
    {
      title: '日期',
      dataIndex: 'scheduleDate',
      key: 'scheduleDate',
      render: (text) => text ? moment(text).format('YYYY-MM-DD') : '-'
    },
    {
      title: '可用座位',
      dataIndex: 'availableSeats',
      key: 'availableSeats'
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        const statusMap = {
          0: '未开放',
          1: '开放预订',
          2: '已满座',
          3: '已结束'
        };
        return statusMap[status] || '未知状态';
      }
    },
    {
      title: '备注',
      dataIndex: 'remarks',
      key: 'remarks',
      ellipsis: true
    },
    {
      title: '操作',
      key: 'action',
      width: 120,
      render: (_, record) => (
        <Space size="small">
          <Button 
            type="link" 
            size="small" 
            danger 
            onClick={() => handleDelete(record.id)}
          >
            删除
          </Button>
        </Space>
      )
    }
  ];

  // 删除日程安排
  const handleDelete = async (id) => {
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除此日程安排吗？',
      okText: '确认',
      cancelText: '取消',
      onOk: async () => {
        try {
          const res = await deleteDayTourScheduleById(id);
          if (res.code === 1) {
            message.success('删除成功');
            fetchSchedules(selectedDayTour);
          } else {
            message.error(res.msg || '删除失败');
          }
        } catch (error) {
          message.error('删除失败');
        }
      }
    });
  };

  // 保存日程安排
  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      
      const data = {
        dayTourId: selectedDayTour,
        availableSeats: values.availableSeats,
        status: values.status,
        remarks: values.remarks
      };

      // 根据选择的安排类型设置日期信息
      if (scheduleType === 'single') {
        data.scheduleDate = values.date?.format('YYYY-MM-DD');
      } else if (scheduleType === 'range') {
        data.startDate = values.dateRange?.[0]?.format('YYYY-MM-DD');
        data.endDate = values.dateRange?.[1]?.format('YYYY-MM-DD');
      } else if (scheduleType === 'multiple') {
        data.dates = values.multipleDates?.map(date => date.format('YYYY-MM-DD'));
      }

      const res = await saveDayTourSchedule(data);
      if (res.code === 1) {
        message.success('保存成功');
        form.resetFields();
        setVisible(false);
        fetchSchedules(selectedDayTour);
      } else {
        message.error(res.msg || '保存失败');
      }
    } catch (error) {
      message.error('表单填写有误，请检查');
    }
  };

  return (
    <div className="schedule-management">
      <Card 
        title={
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span>
              {selectedDayTourInfo ? `${selectedDayTourInfo.name} - 日程安排管理` : '一日游日程安排管理'}
            </span>
            <Button onClick={handleBack}>返回列表</Button>
          </div>
        }
      >
        {!selectedDayTour && (
          <Row gutter={16} style={{ marginBottom: '20px' }}>
            <Col span={8}>
              <Select
                placeholder="请选择一日游"
                style={{ width: '100%' }}
                onChange={handleDayTourChange}
                value={selectedDayTour}
              >
                {dayTours.map(tour => (
                  <Option key={tour.id} value={tour.id}>{tour.name}</Option>
                ))}
              </Select>
            </Col>
          </Row>
        )}

        <Row gutter={16} style={{ marginBottom: '20px' }}>
          <Col span={24} style={{ textAlign: 'right' }}>
            <Button 
              type="primary" 
              onClick={() => setVisible(true)}
              disabled={!selectedDayTour}
            >
              添加日程安排
            </Button>
          </Col>
        </Row>

        <Table
          columns={columns}
          dataSource={schedules}
          rowKey="id"
          pagination={{ pageSize: 10 }}
          loading={loading}
        />
      </Card>

      <Modal
        title="添加日程安排"
        visible={visible}
        onOk={handleSave}
        onCancel={() => {
          setVisible(false);
          form.resetFields();
        }}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
        >
          <Form.Item
            name="scheduleType"
            label="安排类型"
            initialValue="single"
          >
            <Select onChange={(value) => setScheduleType(value)}>
              <Option value="single">单个日期</Option>
              <Option value="range">日期范围</Option>
              <Option value="multiple">多个日期</Option>
            </Select>
          </Form.Item>

          {scheduleType === 'single' && (
            <Form.Item
              name="date"
              label="安排日期"
              rules={[{ required: true, message: '请选择日期' }]}
            >
              <DatePicker style={{ width: '100%' }} />
            </Form.Item>
          )}

          {scheduleType === 'range' && (
            <Form.Item
              name="dateRange"
              label="日期范围"
              rules={[{ required: true, message: '请选择日期范围' }]}
            >
              <RangePicker style={{ width: '100%' }} />
            </Form.Item>
          )}

          {scheduleType === 'multiple' && (
            <Form.Item
              name="multipleDates"
              label="多个日期"
              rules={[{ required: true, message: '请选择日期' }]}
            >
              <DatePicker.Multiple style={{ width: '100%' }} />
            </Form.Item>
          )}

          <Form.Item
            name="availableSeats"
            label="可用座位数"
            rules={[{ required: true, message: '请输入可用座位数' }]}
          >
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item
            name="status"
            label="状态"
            initialValue={1}
          >
            <Select>
              <Option value={0}>未开放</Option>
              <Option value={1}>开放预订</Option>
              <Option value={2}>已满座</Option>
              <Option value={3}>已结束</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="remarks"
            label="备注"
          >
            <Input.TextArea rows={3} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default ScheduleManagement; 