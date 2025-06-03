import React, { useState, useEffect } from 'react';
import { Modal, Form, Input, InputNumber, Switch, DatePicker, Select, Button, message, Spin } from 'antd';
import { getAgentCreditDetail, updateAgentCredit } from '../../../apis/credit';
import moment from 'moment';

const { Option } = Select;
const { TextArea } = Input;

const CreditEdit = ({ visible, agentId, onClose }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [agentCredit, setAgentCredit] = useState(null);

  // 加载代理商信用额度详情
  useEffect(() => {
    if (visible && agentId) {
      fetchAgentCreditDetail(agentId);
    }
  }, [visible, agentId]);

  // 获取代理商信用额度详情
  const fetchAgentCreditDetail = async (id) => {
    try {
      setLoading(true);
      const res = await getAgentCreditDetail(id);
      if (res.code === 1 && res.data) {
        setAgentCredit(res.data);
        
        // 设置表单初始值
        form.setFieldsValue({
          totalCredit: res.data.totalCredit,
          creditRating: res.data.creditRating || 'B',
          interestRate: res.data.interestRate || 0,
          billingCycleDay: res.data.billingCycleDay || 1,
          lastSettlementDate: res.data.lastSettlementDate ? moment(res.data.lastSettlementDate) : null,
          isFrozen: res.data.isFrozen || false,
          overdraftCount: res.data.overdraftCount || 0,
          note: ''
        });
      } else {
        message.error(res?.msg || '获取代理商信用额度详情失败');
      }
    } catch (error) {
      console.error('获取代理商信用额度详情失败:', error);
      message.error('获取代理商信用额度详情失败');
    } finally {
      setLoading(false);
    }
  };

  // 提交表单
  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setSubmitting(true);
      
      const submitData = {
        ...values,
        agentId,
        lastSettlementDate: values.lastSettlementDate ? values.lastSettlementDate.format('YYYY-MM-DD') : null
      };
      
      const res = await updateAgentCredit(submitData);
      if (res.code === 1) {
        message.success('更新信用额度信息成功');
        onClose(true);
      } else {
        message.error(res?.msg || '更新信用额度信息失败');
      }
    } catch (error) {
      console.error('提交表单失败:', error);
      message.error('提交表单失败，请检查输入');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      title="编辑信用额度信息"
      open={visible}
      onCancel={() => onClose(false)}
      width={600}
      footer={[
        <Button key="cancel" onClick={() => onClose(false)}>
          取消
        </Button>,
        <Button
          key="submit"
          type="primary"
          loading={submitting}
          onClick={handleSubmit}
        >
          保存
        </Button>
      ]}
      className="credit-edit-modal"
    >
      <Spin spinning={loading}>
        {agentCredit && (
          <div className="credit-info-summary" style={{ marginBottom: '20px' }}>
            <p><strong>代理商: </strong>{agentCredit.agentName || `ID: ${agentCredit.agentId}`}</p>
            <p><strong>已使用额度: </strong>¥{agentCredit.usedCredit?.toFixed(2) || '0.00'}</p>
            <p><strong>预存余额: </strong>¥{agentCredit.depositBalance?.toFixed(2) || '0.00'}</p>
            <p><strong>可用额度: </strong>¥{agentCredit.availableCredit?.toFixed(2) || '0.00'}</p>
          </div>
        )}
        
        <Form
          form={form}
          layout="vertical"
        >
          <Form.Item
            name="totalCredit"
            label="总信用额度"
            rules={[
              { required: true, message: '请输入总信用额度' },
              { type: 'number', min: 0, message: '信用额度必须大于等于0' }
            ]}
          >
            <InputNumber
              style={{ width: '100%' }}
              placeholder="请输入总信用额度"
              min={0}
              step={1000}
              precision={2}
              addonBefore="¥"
            />
          </Form.Item>
          
          <Form.Item
            name="creditRating"
            label="信用评级"
            rules={[{ required: true, message: '请选择信用评级' }]}
          >
            <Select placeholder="请选择信用评级">
              <Option value="AAA">AAA - 极好</Option>
              <Option value="AA">AA - 优秀</Option>
              <Option value="A">A - 良好</Option>
              <Option value="BBB">BBB - 中上</Option>
              <Option value="BB">BB - 中等</Option>
              <Option value="B">B - 一般</Option>
              <Option value="CCC">CCC - 较差</Option>
              <Option value="CC">CC - 差</Option>
              <Option value="C">C - 很差</Option>
              <Option value="D">D - 极差</Option>
            </Select>
          </Form.Item>
          
          <Form.Item
            name="interestRate"
            label="信用利率(%)"
            rules={[
              { required: true, message: '请输入信用利率' },
              { type: 'number', min: 0, max: 100, message: '利率必须在0-100之间' }
            ]}
          >
            <InputNumber
              style={{ width: '100%' }}
              placeholder="请输入信用利率"
              min={0}
              max={100}
              step={0.01}
              precision={2}
              addonAfter="%"
            />
          </Form.Item>
          
          <Form.Item
            name="billingCycleDay"
            label="账单周期日(每月几号出账单)"
            rules={[
              { required: true, message: '请选择账单周期日' },
              { type: 'number', min: 1, max: 31, message: '账单周期日必须在1-31之间' }
            ]}
          >
            <InputNumber
              style={{ width: '100%' }}
              placeholder="请输入账单周期日"
              min={1}
              max={31}
              precision={0}
            />
          </Form.Item>
          
          <Form.Item
            name="lastSettlementDate"
            label="最后结算日期"
          >
            <DatePicker
              style={{ width: '100%' }}
              format="YYYY-MM-DD"
              placeholder="请选择最后结算日期"
            />
          </Form.Item>
          
          <Form.Item
            name="overdraftCount"
            label="透支次数"
            rules={[
              { required: true, message: '请输入透支次数' },
              { type: 'number', min: 0, message: '透支次数必须大于等于0' }
            ]}
          >
            <InputNumber
              style={{ width: '100%' }}
              placeholder="请输入透支次数"
              min={0}
              precision={0}
            />
          </Form.Item>
          
          <Form.Item
            name="isFrozen"
            label="是否冻结"
            valuePropName="checked"
          >
            <Switch checkedChildren="是" unCheckedChildren="否" />
          </Form.Item>
          
          <Form.Item
            name="note"
            label="修改备注"
            rules={[{ required: true, message: '请输入修改备注' }]}
          >
            <TextArea rows={4} placeholder="请输入修改备注" />
          </Form.Item>
        </Form>
      </Spin>
    </Modal>
  );
};

export default CreditEdit; 