import React, { useState, useEffect } from 'react';
import {
  Form,
  Input,
  DatePicker,
  Select,
  InputNumber,
  Button,
  Row,
  Col,
  Card,
  message,
  Space,
  Divider
} from 'antd';
import dayjs from 'dayjs';
import * as tourAssignmentAPI from '@/api/tourAssignment';
import { getGuideList } from '@/api/guide';
import { getVehicleList } from '@/apis/vehicle';

const { Option } = Select;
const { TextArea } = Input;

const AssignmentForm = ({ initialValues, onSuccess, onCancel }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [guides, setGuides] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [guidesLoading, setGuidesLoading] = useState(false);
  const [vehiclesLoading, setVehiclesLoading] = useState(false);

  // 是否为编辑模式
  const isEdit = !!initialValues;

  useEffect(() => {
    loadGuides();
    loadVehicles();

    if (isEdit && initialValues) {
      // 编辑模式，设置表单值
      const formValues = {
        ...initialValues,
        assignmentDate: initialValues.assignmentDate ? dayjs(initialValues.assignmentDate) : null,
        guideId: initialValues.guide?.guideId,
        vehicleId: initialValues.vehicle?.vehicleId,
        bookingIds: initialValues.bookingIds || [],
        tourScheduleOrderIds: initialValues.tourScheduleOrderIds || [],
        passengerDetails: initialValues.passengerDetails || []
      };
      form.setFieldsValue(formValues);
    }
  }, [initialValues, isEdit]);

  // 加载导游列表
  const loadGuides = async () => {
    setGuidesLoading(true);
    try {
      const response = await getGuideList({ status: 'active' });
      if (response.code === 1) {
        setGuides(response.data || []);
      }
    } catch (error) {
      console.error('加载导游列表失败:', error);
    } finally {
      setGuidesLoading(false);
    }
  };

  // 加载车辆列表
  const loadVehicles = async () => {
    setVehiclesLoading(true);
    try {
      const response = await getVehicleList({ status: 'active' });
      if (response.code === 1) {
        setVehicles(response.data || []);
      }
    } catch (error) {
      console.error('加载车辆列表失败:', error);
    } finally {
      setVehiclesLoading(false);
    }
  };

  // 表单提交
  const handleSubmit = async (values) => {
    setLoading(true);
    try {
      let formData;
      
      if (isEdit) {
        // 编辑模式：保持原有数据，只更新表单中的字段
        formData = {
          ...initialValues, // 保持原有的所有字段
          ...values, // 覆盖表单中修改的字段
          assignmentDate: values.assignmentDate ? values.assignmentDate.format('YYYY-MM-DD') : null,
          // 字段映射：location -> destination
          destination: values.location || values.destination || initialValues.destination,
          bookingIds: values.bookingIds || initialValues.bookingIds || [],
          tourScheduleOrderIds: values.tourScheduleOrderIds || initialValues.tourScheduleOrderIds || [],
          passengerDetails: values.passengerDetails || initialValues.passengerDetails || []
        };
      } else {
        // 创建模式：只使用表单数据
        formData = {
          ...values,
          assignmentDate: values.assignmentDate ? values.assignmentDate.format('YYYY-MM-DD') : null,
          // 字段映射：location -> destination
          destination: values.location || values.destination,
          bookingIds: values.bookingIds || [],
          tourScheduleOrderIds: values.tourScheduleOrderIds || [],
          passengerDetails: values.passengerDetails || []
        };
      }

      let response;
      if (isEdit) {
        response = await tourAssignmentAPI.updateAssignment(initialValues.id, formData);
      } else {
        response = await tourAssignmentAPI.createAssignment(formData);
      }

      if (response.code === 1) {
        message.success(isEdit ? '更新成功' : '创建成功');
        onSuccess();
      } else {
        message.error(response.msg || (isEdit ? '更新失败' : '创建失败'));
      }
    } catch (error) {
      message.error(isEdit ? '更新失败' : '创建失败');
      console.error('表单提交失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // 检查导游可用性
  const checkGuideAvailability = async (guideId, date) => {
    if (!guideId || !date) return;
    
    try {
      const response = await tourAssignmentAPI.checkGuideAssigned(
        guideId, 
        date.format('YYYY-MM-DD')
      );
      
      if (response.code === 1 && response.data && !isEdit) {
        message.warning('该导游在选定日期已有分配');
      }
    } catch (error) {
      console.error('检查导游可用性失败:', error);
    }
  };

  // 检查车辆可用性
  const checkVehicleAvailability = async (vehicleId, date) => {
    if (!vehicleId || !date) return;
    
    try {
      const response = await tourAssignmentAPI.checkVehicleAssigned(
        vehicleId, 
        date.format('YYYY-MM-DD')
      );
      
      if (response.code === 1 && response.data && !isEdit) {
        message.warning('该车辆在选定日期已有分配');
      }
    } catch (error) {
      console.error('检查车辆可用性失败:', error);
    }
  };

  // 表单字段变化处理
  const handleFieldChange = (changedFields, allFields) => {
    const assignmentDate = form.getFieldValue('assignmentDate');
    
    changedFields.forEach(field => {
      if (field.name[0] === 'guideId' && field.value && assignmentDate) {
        checkGuideAvailability(field.value, assignmentDate);
      }
      if (field.name[0] === 'vehicleId' && field.value && assignmentDate) {
        checkVehicleAvailability(field.value, assignmentDate);
      }
      if (field.name[0] === 'assignmentDate' && field.value) {
        const guideId = form.getFieldValue('guideId');
        const vehicleId = form.getFieldValue('vehicleId');
        if (guideId) checkGuideAvailability(guideId, field.value);
        if (vehicleId) checkVehicleAvailability(vehicleId, field.value);
      }
    });
  };

  return (
    <div className="assignment-form">
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        onFieldsChange={handleFieldChange}
      >
        {/* 基本信息 */}
        <div className="form-section">
          <div className="section-title">基本信息</div>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="assignmentDate"
                label="分配日期"
                rules={[{ required: true, message: '请选择分配日期' }]}
              >
                <DatePicker 
                  style={{ width: '100%' }} 
                  placeholder="请选择日期"
                  disabledDate={(current) => current && current < dayjs().startOf('day')}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="destination"
                label="目的地"
                rules={[{ required: true, message: '请输入目的地' }]}
              >
                <Input placeholder="请输入目的地" />
              </Form.Item>
            </Col>
          </Row>
        </div>

        {/* 导游和车辆信息 */}
        <div className="form-section">
          <div className="section-title">导游和车辆</div>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="guideId"
                label="导游"
                rules={[{ required: true, message: '请选择导游' }]}
              >
                <Select
                  placeholder="请选择导游"
                  loading={guidesLoading}
                  showSearch
                  filterOption={(input, option) =>
                    option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
                  }
                >
                  {guides.map(guide => (
                    <Option key={guide.guideId} value={guide.guideId}>
                      {guide.name} - {guide.phone}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="vehicleId"
                label="车辆"
                rules={[{ required: true, message: '请选择车辆' }]}
              >
                <Select
                  placeholder="请选择车辆"
                  loading={vehiclesLoading}
                  showSearch
                  filterOption={(input, option) =>
                    option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
                  }
                >
                  {vehicles.map(vehicle => (
                    <Option key={vehicle.vehicleId} value={vehicle.vehicleId}>
                      {vehicle.licensePlate} - {vehicle.vehicleType} ({vehicle.seatCount}座)
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>
        </div>

        {/* 游客信息 */}
        <div className="form-section">
          <div className="section-title">游客信息</div>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="totalPeople"
                label="总人数"
                rules={[
                  { required: true, message: '请输入总人数' },
                  { type: 'number', min: 1, message: '总人数必须大于0' }
                ]}
              >
                <InputNumber 
                  style={{ width: '100%' }} 
                  placeholder="请输入总人数"
                  min={1}
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="adultCount"
                label="成人数量"
                rules={[
                  { required: true, message: '请输入成人数量' },
                  { type: 'number', min: 0, message: '成人数量不能小于0' }
                ]}
              >
                <InputNumber 
                  style={{ width: '100%' }} 
                  placeholder="请输入成人数量"
                  min={0}
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="childCount"
                label="儿童数量"
                rules={[
                  { type: 'number', min: 0, message: '儿童数量不能小于0' }
                ]}
              >
                <InputNumber 
                  style={{ width: '100%' }} 
                  placeholder="请输入儿童数量"
                  min={0}
                />
              </Form.Item>
            </Col>
          </Row>
        </div>

        {/* 联系信息 */}
        <div className="form-section">
          <div className="section-title">联系信息</div>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="contactPerson"
                label="联系人"
                rules={[{ required: true, message: '请输入联系人' }]}
              >
                <Input placeholder="请输入联系人姓名" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="contactPhone"
                label="联系电话"
                rules={[
                  { required: true, message: '请输入联系电话' },
                  { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号码' }
                ]}
              >
                <Input placeholder="请输入联系电话" />
              </Form.Item>
            </Col>
          </Row>
        </div>

        {/* 行程信息 */}
        <div className="form-section">
          <div className="section-title">行程信息</div>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="pickupMethod"
                label="接送方式"
              >
                <Select placeholder="请选择接送方式">
                  <Option value="hotel_pickup">酒店接送</Option>
                  <Option value="meeting_point">集合点接送</Option>
                  <Option value="self_drive">自驾</Option>
                  <Option value="other">其他</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="pickupLocation"
                label="接送地点"
              >
                <Input placeholder="请输入接送地点" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="dropoffLocation"
                label="结束地点"
              >
                <Input placeholder="请输入结束地点" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="nextDestination"
                label="下一个目的地"
              >
                <Input placeholder="请输入下一个目的地" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="languagePreference"
                label="语言偏好"
              >
                <Select placeholder="请选择语言偏好">
                  <Option value="chinese">中文</Option>
                  <Option value="english">English</Option>
                  <Option value="both">中英文</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
        </div>

        {/* 特殊需求 */}
        <div className="form-section">
          <div className="section-title">特殊需求</div>
          <Row gutter={16}>
            <Col span={24}>
              <Form.Item
                name="specialRequirements"
                label="特殊要求"
              >
                <TextArea 
                  rows={3} 
                  placeholder="请输入特殊要求（如轮椅、婴儿车等）" 
                />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="dietaryRestrictions"
                label="饮食限制"
              >
                <TextArea 
                  rows={2} 
                  placeholder="请输入饮食限制（如素食、过敏等）" 
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="emergencyContact"
                label="紧急联系人"
              >
                <TextArea 
                  rows={2} 
                  placeholder="请输入紧急联系人信息" 
                />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={24}>
              <Form.Item
                name="remarks"
                label="备注"
              >
                <TextArea 
                  rows={3} 
                  placeholder="请输入其他备注信息" 
                />
              </Form.Item>
            </Col>
          </Row>
        </div>

        {/* 表单操作按钮 */}
        <div className="form-actions">
          <Space>
            <Button onClick={onCancel}>取消</Button>
            <Button 
              type="primary" 
              htmlType="submit" 
              loading={loading}
            >
              {isEdit ? '更新' : '创建'}
            </Button>
          </Space>
        </div>
      </Form>
    </div>
  );
};

export default AssignmentForm; 