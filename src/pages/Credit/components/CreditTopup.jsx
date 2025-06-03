import React, { useState, useEffect } from 'react'
import { Modal, Form, Input, InputNumber, Button, Select, Spin, message, Divider, Result, Steps } from 'antd'
import { DollarOutlined, CheckCircleOutlined, InfoCircleOutlined } from '@ant-design/icons'
import { topupAgentCredit, getAgentList, getAgentCreditDetail } from '../../../apis/credit'

const { TextArea } = Input
const { Option } = Select
const { Step } = Steps

const CreditTopup = ({ visible, agentId, onClose }) => {
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [agents, setAgents] = useState([])
  const [agentLoading, setAgentLoading] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)
  const [topupSuccess, setTopupSuccess] = useState(false)
  const [agentCredit, setAgentCredit] = useState(null)
  const [agentCreditLoading, setAgentCreditLoading] = useState(false)
  const [selectedAmount, setSelectedAmount] = useState(0)

  // 加载代理商列表
  useEffect(() => {
    if (visible) {
      fetchAgents()
      
      // 重置表单状态
      form.resetFields()
      setCurrentStep(0)
      setTopupSuccess(false)
      
      // 设置默认初始值
      const initialValues = {
        amount: 1000,
        note: '管理员充值'
      };
      
      // 如果传入了agentId，设置为默认值
      if (agentId) {
        console.log('收到代理商ID:', agentId, typeof agentId);
        // 确保agentId是数字类型
        const validAgentId = parseInt(agentId);
        if (!isNaN(validAgentId)) {
          console.log('设置默认代理商ID:', validAgentId);
          initialValues.agentId = validAgentId;
          
          // 设置表单值
          form.setFieldsValue(initialValues);
          
          // 获取代理商信用额度详情
          fetchAgentCreditDetail(validAgentId);
        }
      } else {
        // 没有传入agentId，只设置其他默认值
        form.setFieldsValue(initialValues);
      }
    }
  }, [visible, agentId, form])

  // 获取代理商列表
  const fetchAgents = async () => {
    try {
      setAgentLoading(true)
      const res = await getAgentList()
      if (res && res.code === 1 && res.data) {
        console.log('代理商列表数据:', res.data);
        setAgents(res.data)
      } else {
        message.error('获取代理商列表失败')
      }
    } catch (error) {
      console.error('获取代理商列表失败:', error)
      message.error('获取代理商列表失败')
    } finally {
      setAgentLoading(false)
    }
  }

  // 获取代理商信用额度详情
  const fetchAgentCreditDetail = async (id) => {
    try {
      // 确保ID是有效数字
      if (!id || isNaN(parseInt(id))) {
        console.warn('无效的代理商ID:', id);
        return;
      }
      
      console.log('正在获取代理商信用额度详情，ID:', id);
      setAgentCreditLoading(true)
      const res = await getAgentCreditDetail(parseInt(id))
      if (res && res.code === 1 && res.data) {
        console.log('获取到代理商信用额度详情:', res.data);
        setAgentCredit(res.data)
        
        // 检查账户是否被冻结
        if (res.data.isFrozen === 1 || res.data.isFrozen === true) {
          message.warning('该代理商账户已被冻结，可以充值但请注意该账户无法使用信用额度进行交易', 5);
        }
      } else {
        console.error('获取代理商信用额度详情失败:', res);
        // 明确展示错误信息
        message.error(res?.msg || '获取代理商信用额度信息失败，该代理商可能尚未分配信用额度');
        // 清空代理商信用额度信息
        setAgentCredit(null);
      }
    } catch (error) {
      console.error('获取代理商信用额度详情失败:', error)
      message.error('获取代理商信用额度详情失败');
    } finally {
      setAgentCreditLoading(false)
    }
  }

  // 处理代理商选择
  const handleAgentChange = (value) => {
    if (value && !isNaN(parseInt(value))) {
      fetchAgentCreditDetail(parseInt(value))
    } else {
      setAgentCredit(null)
    }
  }

  // 处理金额变更
  const handleAmountChange = (value) => {
    setSelectedAmount(value || 0)
  }

  // 下一步
  const handleNext = async () => {
    try {
      // 获取当前表单值
      const currentValues = form.getFieldsValue();
      console.log('验证前的表单值:', currentValues);
      
      // 如果没有代理商ID但有传入的agentId，则使用传入的值
      if (!currentValues.agentId && agentId) {
        const validAgentId = parseInt(agentId);
        if (!isNaN(validAgentId)) {
          console.log('使用传入的代理商ID:', validAgentId);
          form.setFieldsValue({
            ...currentValues,
            agentId: validAgentId
          });
        }
      }
      
      // 验证表单字段
      await form.validateFields();
      
      // 再次获取表单值，确认验证后的值
      const validatedValues = form.getFieldsValue();
      console.log('验证后的表单值:', validatedValues);
      
      // 确保有有效的代理商ID和金额
      if (!validatedValues.agentId) {
        message.error('请选择代理商');
        return;
      }
      
      if (!validatedValues.amount || validatedValues.amount <= 0) {
        message.error('请输入有效的充值金额');
        return;
      }
      
      // 所有验证通过，进入下一步
      setCurrentStep(1);
    } catch (error) {
      console.error('表单验证失败:', error);
      // 显示具体的验证错误信息
      if (error.errorFields && error.errorFields.length > 0) {
        const errorMsg = error.errorFields[0].errors[0] || '表单验证失败';
        message.error(errorMsg);
      } else {
        message.error('表单验证失败，请检查输入');
      }
    }
  }

  // 返回上一步
  const handlePrevious = () => {
    setCurrentStep(0)
  }

  // 处理表单提交
  const handleSubmit = async () => {
    try {
      // 在验证前先检查一下表单当前值
      const currentValues = form.getFieldsValue();
      console.log('当前表单值(验证前):', currentValues);
      
      if (!currentValues.agentId) {
        // 如果表单中没有agentId，但有传入的agentId，则尝试使用传入的值
        if (agentId) {
          const validAgentId = parseInt(agentId);
          if (!isNaN(validAgentId)) {
            console.log('使用传入的agentId:', validAgentId);
            // 重新设置表单字段值
            form.setFieldsValue({
              ...currentValues,
              agentId: validAgentId
            });
          }
        } else {
          message.error('请选择代理商');
          return;
        }
      }
      
      // 强制更新一下表单
      await form.validateFields();
      
      // 获取表单值 (使用多种方式尝试获取)
      let values = form.getFieldsValue(true);
      console.log('获取所有表单数据:', values);
      
      // 手动获取各个字段的值
      const directAgentId = form.getFieldValue('agentId');
      const directAmount = form.getFieldValue('amount');
      const directNote = form.getFieldValue('note');
      
      console.log('直接获取字段值:', {
        agentId: directAgentId,
        amount: directAmount,
        note: directNote
      });
      
      // 使用手动获取的值重新构建data
      const agentIdValue = directAgentId || (agentId ? parseInt(agentId) : null);
      
      if (!agentIdValue || isNaN(agentIdValue)) {
        message.error('请选择有效的代理商');
        return;
      }
      
      if (!directAmount || directAmount <= 0) {
        message.error('请输入有效的充值金额');
        return;
      }
      
      // 构建提交数据
      const data = {
        agentId: agentIdValue,
        amount: directAmount,
        note: directNote || '管理员充值'
      };
      
      console.log('准备发送充值请求:', data);
      setLoading(true);
      
      const res = await topupAgentCredit(data);
      console.log('充值结果:', res);
      
      if (res && res.code === 1) {
        setTopupSuccess(true);
        setCurrentStep(2);
        message.success('充值成功');
      } else {
        // 显示更具体的错误信息
        if (res?.msg && res.msg.includes("不存在")) {
          message.error('代理商信用额度信息不存在，请联系系统管理员先为该代理商分配信用额度');
      } else {
        message.error(res?.msg || '充值失败');
        }
      }
    } catch (error) {
      console.error('充值失败:', error);
      if (error.message) {
        message.error(error.message);
      } else {
        message.error('充值操作失败，请稍后重试');
      }
    } finally {
      setLoading(false);
    }
  }

  // 关闭并重置
  const handleClose = (refresh = false) => {
    setCurrentStep(0)
    setTopupSuccess(false)
    setAgentCredit(null)
    form.resetFields()
    onClose(refresh)
  }

  // 渲染步骤内容
  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        // 打印当前表单值，以便调试
        const currentFormValues = form.getFieldsValue();
        console.log('渲染表单时的当前值:', currentFormValues);

  return (
      <Form
        form={form}
        layout="vertical"
        initialValues={{
              amount: 1000,
              note: '管理员充值',
              agentId: agentId ? parseInt(agentId) : undefined
        }}
      >
        <Form.Item
          name="agentId"
          label="选择代理商"
          rules={[{ required: true, message: '请选择代理商' }]}
              validateTrigger={['onChange', 'onBlur']}
        >
          <Select
            placeholder="请选择要充值的代理商"
            loading={agentLoading}
            showSearch
                onChange={(value) => {
                  console.log('选择的代理商ID:', value);
                  handleAgentChange(value);
                }}
            filterOption={(input, option) =>
              option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
            }
            disabled={!!agentId} // 如果传入了agentId，则禁用选择
          >
            {agents.map(agent => (
              <Option key={agent.id} value={agent.id}>
                    {agent.companyName || agent.name || `代理商(ID: ${agent.id})`}
              </Option>
            ))}
          </Select>
        </Form.Item>

            {agentCredit && (
              <div className="agent-credit-info">
                <Spin spinning={agentCreditLoading}>
                  {agentCredit.isFrozen === 1 || agentCredit.isFrozen === true ? (
                    <div className="info-item frozen-warning" style={{ background: '#fffbe6', padding: '10px', borderRadius: '4px', marginBottom: '10px', border: '1px solid #ffe58f' }}>
                      <InfoCircleOutlined style={{ color: '#faad14' }} /> 该代理商账户已被冻结，可以充值但账户无法使用信用额度进行交易！
                    </div>
                  ) : null}
                  <div className="info-item">
                    <span className="label">当前信用额度:</span>
                    <span className="value">¥{agentCredit.totalCredit?.toFixed(2) || '0.00'}</span>
                    <span className="note">(总额度不可变，仅可由管理员调整)</span>
                  </div>
                  <div className="info-item">
                    <span className="label">已使用额度:</span>
                    <span className="value">¥{agentCredit.usedCredit?.toFixed(2) || '0.00'}</span>
                  </div>
                  <div className="info-item">
                    <span className="label">预存余额:</span>
                    <span className="value deposit">¥{agentCredit.depositBalance?.toFixed(2) || '0.00'}</span>
                  </div>
                  <div className="info-item">
                    <span className="label">可用额度:</span>
                    <span className="value available">¥{agentCredit.availableCredit?.toFixed(2) || '0.00'}</span>
                    <span className="note">(可用额度 = 总额度 - 已用额度 + 预存余额)</span>
                  </div>
                </Spin>
              </div>
            )}

        <Form.Item
          name="amount"
          label="充值金额"
          rules={[
            { required: true, message: '请输入充值金额' },
            {
              type: 'number',
              min: 0.01,
              message: '充值金额必须大于0'
            }
          ]}
        >
          <InputNumber
            style={{ width: '100%' }}
            min={0.01}
            step={1000}
            precision={2}
            placeholder="请输入充值金额"
            addonBefore="￥"
                onChange={(value) => {
                  console.log('输入的充值金额:', value);
                  handleAmountChange(value);
                }}
          />
        </Form.Item>

        <Form.Item
          name="note"
          label="充值备注"
          rules={[{ required: true, message: '请输入充值备注' }]}
        >
          <TextArea
            rows={4}
            placeholder="请输入充值备注"
                onChange={(e) => console.log('输入的备注:', e.target.value)}
          />
        </Form.Item>
          </Form>
        )
      
      case 1:
        // 确认信息
        const formValues = form.getFieldsValue();
        console.log('确认页面的表单值:', formValues);
        
        // 获取代理商信息
        const selectedAgent = agents.find(a => a.id === formValues.agentId);
        const agentName = selectedAgent 
          ? (selectedAgent.companyName || selectedAgent.name || `代理商(ID: ${selectedAgent.id})`) 
          : '未知代理商';
        
        console.log('选中的代理商:', selectedAgent);
        
        return (
          <div className="confirm-info">
            <div className="confirm-title">请确认以下信息</div>
            <Divider style={{ margin: '12px 0' }} />
            {agentCredit && (agentCredit.isFrozen === 1 || agentCredit.isFrozen === true) && (
              <div className="confirm-warning" style={{ background: '#fffbe6', padding: '10px', borderRadius: '4px', marginBottom: '10px', border: '1px solid #ffe58f' }}>
                <InfoCircleOutlined style={{ color: '#faad14' }} /> 警告：该代理商账户已被冻结，可以充值但账户无法使用信用额度进行交易！
              </div>
            )}
            <div className="confirm-item">
              <span className="label">代理商:</span>
              <span className="value">{agentName}</span>
            </div>
            <div className="confirm-item">
              <span className="label">充值金额:</span>
              <span className="value amount">¥{formValues.amount?.toFixed(2) || '0.00'}</span>
            </div>
            {agentCredit && (
              <>
                <div className="confirm-item">
                  <span className="label">当前可用额度:</span>
                  <span className="value">¥{agentCredit.availableCredit?.toFixed(2) || '0.00'}</span>
                </div>
                <div className="confirm-item">
                  <span className="label">已使用额度:</span>
                  <span className="value">¥{agentCredit.usedCredit?.toFixed(2) || '0.00'}</span>
                </div>
                <div className="confirm-item">
                  <span className="label">预存余额:</span>
                  <span className="value">¥{agentCredit.depositBalance?.toFixed(2) || '0.00'}</span>
                </div>
                <div className="confirm-item">
                  <span className="label">充值后可用额度:</span>
                  <span className="value available">
                    ¥{(agentCredit.availableCredit + (formValues.amount || 0))?.toFixed(2) || '0.00'}
                  </span>
                  <div className="note">
                    充值金额将优先用于减少已使用额度，剩余部分将增加预存余额。总信用额度保持不变。
                  </div>
                </div>
              </>
            )}
            <div className="confirm-item">
              <span className="label">备注:</span>
              <span className="value note">{formValues.note || '-'}</span>
            </div>
            <Divider style={{ margin: '12px 0' }} />
            <div className="confirm-warning">
              <InfoCircleOutlined /> 请仔细核对信息，确认无误后点击"确认充值"按钮
            </div>
          </div>
        )
      
      case 2:
        // 成功结果
        return (
          <Result
            status="success"
            title="充值成功"
            subTitle={`已成功为代理商充值 ¥${form.getFieldValue('amount')?.toFixed(2) || '0.00'}`}
            extra={[
              <Button type="primary" key="done" onClick={() => handleClose(true)}>
                完成
              </Button>
            ]}
          />
        )
      
      default:
        return null
    }
  }

  // 渲染底部按钮
  const renderFooter = () => {
    if (currentStep === 2) {
      return null // 成功页面没有底部按钮
    }

    return (
      <>
        {currentStep === 1 && (
          <Button 
            style={{ marginRight: 8 }} 
            onClick={handlePrevious}
            disabled={loading}
          >
            上一步
          </Button>
        )}
        
        {currentStep === 0 ? (
          <Button 
            type="primary" 
            onClick={handleNext}
            disabled={loading}
          >
            下一步
          </Button>
        ) : (
          <Button 
            type="primary" 
            onClick={handleSubmit}
            loading={loading}
          >
            确认充值
          </Button>
        )}
      </>
    )
  }

  return (
    <Modal
      title={
        <div className="credit-topup-title">
          <Steps size="small" current={currentStep} className="topup-steps">
            <Step title="填写信息" />
            <Step title="确认信息" />
            <Step title="充值完成" />
          </Steps>
        </div>
      }
      open={visible}
      onCancel={() => handleClose(false)}
      width={550}
      footer={
        <div style={{ textAlign: 'right' }}>
          <Button 
            onClick={() => handleClose(topupSuccess)}
            style={{ marginRight: 8 }} 
            disabled={loading}
          >
            取消
          </Button>
          {renderFooter()}
        </div>
      }
      maskClosable={false}
      destroyOnClose={true}
      className="credit-topup-modal"
    >
      <div className="credit-topup-content">
        {renderStepContent()}
      </div>
    </Modal>
  )
}

export default CreditTopup 