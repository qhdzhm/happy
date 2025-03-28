import React, { useEffect, useState } from 'react';
import { Modal, Button, Select, Form, Radio, message, Tooltip } from 'antd';
import { QuestionCircleOutlined } from '@ant-design/icons';
import { getAvailableEmployees, getEmployeeById } from '@/apis/Employee';
import { assignVehicleToDriver, unassignVehicleFromDriver } from '@/apis/VehicleDriver';

const { Option } = Select;

/**
 * 车辆驾驶员分配组件
 */
const VehicleDriverAssign = ({ 
  visible, 
  onCancel, 
  onSuccess, 
  vehicleId, 
  vehicleInfo, 
  currentDrivers = [] 
}) => {
  const [form] = Form.useForm();
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [confirmMessage, setConfirmMessage] = useState('');
  const [pendingAction, setPendingAction] = useState(null);

  // 加载可用员工列表
  useEffect(() => {
    if (visible) {
      loadEmployees();
    }
  }, [visible]);

  // 加载可用员工
  const loadEmployees = async () => {
    try {
      const res = await getAvailableEmployees();
      if (res.code === 1) {
        // 过滤掉已经分配给这个车辆的员工
        const filteredEmployees = res.data.filter(emp => 
          !currentDrivers.find(driver => driver.id === emp.id)
        );
        setEmployees(filteredEmployees);
      }
    } catch (error) {
      console.error('加载员工列表失败', error);
      message.error('加载员工列表失败');
    }
  };

  // 提交分配
  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);
      
      // 获取员工详情
      const employeeInfo = await getEmployeeById(values.employeeId);
      
      // 检查员工状态
      if (employeeInfo.data.workStatus === 1) { // 忙碌
        showConfirm('该员工当前处于忙碌状态，是否继续分配车辆？', values);
        return;
      } else if (employeeInfo.data.workStatus === 2) { // 休假
        showConfirm('该员工当前处于休假状态，是否继续分配车辆？', values);
        return;
      } else if (employeeInfo.data.workStatus === 3) { // 出团
        showConfirm('该员工当前处于出团状态，是否继续分配车辆？', values);
        return;
      }
      
      // 如果员工已经有分配的车辆
      if (employeeInfo.data.assignedVehicle) {
        showConfirm('该员工已分配车辆，是否继续分配？', values);
        return;
      }
      
      // 如果没有警告，直接提交
      submitAssignment(values);
      
    } catch (error) {
      console.error('表单验证失败', error);
    } finally {
      setLoading(false);
    }
  };

  // 显示确认框
  const showConfirm = (msg, values) => {
    setConfirmMessage(msg);
    setPendingAction(() => () => submitAssignment({...values, forceAssign: true}));
    setConfirmVisible(true);
  };

  // 确认后提交
  const handleConfirm = () => {
    if (pendingAction) {
      pendingAction();
    }
    setConfirmVisible(false);
    setPendingAction(null);
  };

  // 取消确认
  const handleCancelConfirm = () => {
    setConfirmVisible(false);
    setPendingAction(null);
    setLoading(false);
  };

  // 提交分配请求
  const submitAssignment = async (values) => {
    try {
      setLoading(true);
      const res = await assignVehicleToDriver({
        vehicleId,
        employeeId: values.employeeId,
        isPrimary: values.isPrimary,
        forceAssign: values.forceAssign
      });
      
      if (res.code === 1) {
        message.success('分配成功');
        form.resetFields();
        if (onSuccess) onSuccess();
      } else if (res.code === 2) {
        // 处理警告确认
        showConfirm(res.msg, values);
      } else {
        message.error(res.msg || '分配失败');
      }
    } catch (error) {
      console.error('分配失败', error);
      message.error('分配失败');
    } finally {
      setLoading(false);
    }
  };

  // 取消分配
  const handleUnassign = async (employeeId) => {
    Modal.confirm({
      title: '确认取消分配',
      content: '确定要取消该驾驶员的分配吗？',
      onOk: async () => {
        try {
          setLoading(true);
          const res = await unassignVehicleFromDriver({
            vehicleId,
            employeeId
          });
          
          if (res.code === 1) {
            message.success('取消分配成功');
            if (onSuccess) onSuccess();
          } else {
            message.error(res.msg || '取消分配失败');
          }
        } catch (error) {
          console.error('取消分配失败', error);
          message.error('取消分配失败');
        } finally {
          setLoading(false);
        }
      }
    });
  };

  return (
    <>
      <Modal
        title="分配驾驶员"
        open={visible}
        onCancel={onCancel}
        footer={null}
        destroyOnClose
      >
        <div style={{ marginBottom: 16 }}>
          <p><strong>车牌号:</strong> {vehicleInfo?.licensePlate}</p>
          <p><strong>车辆类型:</strong> {vehicleInfo?.vehicleType}</p>
          <p><strong>最大驾驶员数:</strong> {vehicleInfo?.maxDrivers || 3}</p>
          <p>
            <strong>分配情况:</strong> {currentDrivers.length}/{vehicleInfo?.maxDrivers || 3}
            {currentDrivers.length >= (vehicleInfo?.maxDrivers || 3) && 
              <span style={{ color: 'red', marginLeft: 8 }}>已满</span>
            }
          </p>
        </div>
        
        {currentDrivers.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <h4>已分配驾驶员:</h4>
            <ul style={{ listStyle: 'none', padding: 0 }}>
              {currentDrivers.map(driver => (
                <li key={driver.id} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span>
                    {driver.name} ({driver.isPrimary === 1 ? '主驾驶' : '副驾驶'})
                    {driver.workStatus === 1 && <span style={{ color: 'orange', marginLeft: 8 }}>忙碌</span>}
                    {driver.workStatus === 2 && <span style={{ color: 'red', marginLeft: 8 }}>休假</span>}
                    {driver.workStatus === 3 && <span style={{ color: 'blue', marginLeft: 8 }}>出团</span>}
                    {driver.workStatus === 4 && <span style={{ color: 'green', marginLeft: 8 }}>待命</span>}
                  </span>
                  <Button 
                    type="link" 
                    danger 
                    onClick={() => handleUnassign(driver.id)}
                    disabled={loading}
                  >
                    取消分配
                  </Button>
                </li>
              ))}
            </ul>
          </div>
        )}
        
        {currentDrivers.length < (vehicleInfo?.maxDrivers || 3) && (
          <Form
            form={form}
            layout="vertical"
          >
            <Form.Item
              name="employeeId"
              label="选择驾驶员"
              rules={[{ required: true, message: '请选择驾驶员' }]}
            >
              <Select 
                placeholder="请选择驾驶员" 
                style={{ width: '100%' }}
                loading={loading}
              >
                {employees.map(emp => (
                  <Option key={emp.id} value={emp.id}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>{emp.name}</span>
                      <span>
                        {emp.workStatus === 0 && <span style={{ color: 'green' }}>空闲</span>}
                        {emp.workStatus === 1 && (
                          <Tooltip title="员工忙碌中，分配后需确认">
                            <span style={{ color: 'orange' }}>
                              忙碌 <QuestionCircleOutlined />
                            </span>
                          </Tooltip>
                        )}
                        {emp.workStatus === 2 && (
                          <Tooltip title="员工休假中，分配后需确认">
                            <span style={{ color: 'red' }}>
                              休假 <QuestionCircleOutlined />
                            </span>
                          </Tooltip>
                        )}
                        {emp.workStatus === 3 && (
                          <Tooltip title="员工出团中，分配后需确认">
                            <span style={{ color: 'blue' }}>
                              出团 <QuestionCircleOutlined />
                            </span>
                          </Tooltip>
                        )}
                        {emp.workStatus === 4 && <span style={{ color: 'green' }}>待命</span>}
                      </span>
                    </div>
                  </Option>
                ))}
              </Select>
            </Form.Item>
            
            <Form.Item
              name="isPrimary"
              label="驾驶类型"
              rules={[{ required: true, message: '请选择驾驶类型' }]}
              initialValue={0}
            >
              <Radio.Group>
                <Radio value={1}>主驾驶</Radio>
                <Radio value={0}>副驾驶</Radio>
              </Radio.Group>
            </Form.Item>
            
            <Form.Item>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <Button onClick={onCancel}>取消</Button>
                <Button type="primary" onClick={handleSubmit} loading={loading}>
                  分配
                </Button>
              </div>
            </Form.Item>
          </Form>
        )}
      </Modal>
      
      {/* 确认弹窗 */}
      <Modal
        title="分配确认"
        open={confirmVisible}
        onOk={handleConfirm}
        onCancel={handleCancelConfirm}
        okText="继续分配"
        cancelText="取消"
      >
        <p>{confirmMessage}</p>
      </Modal>
    </>
  );
};

export default VehicleDriverAssign; 