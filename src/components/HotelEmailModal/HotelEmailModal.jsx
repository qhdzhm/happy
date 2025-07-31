import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Modal, Form, Input, Button, message, Space, Typography, Divider } from 'antd';
import { sendHotelBookingEmail } from '../../apis/hotel';

const { TextArea } = Input;
const { Text, Title } = Typography;

const HotelEmailModal = ({ visible, onCancel, onSuccess, bookingData }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const emailStatusHandlerRef = useRef(null);

  // 英文邮件模板
  const generateEmailTemplate = (data) => {
    if (!data) return '';
    
    const {
      bookingReference,
      hotelName,
      contactPerson: hotelContact,
      guestName,
      guestPhone,
      guestEmail,
      checkInDate,
      checkOutDate,
      nights,
      roomCount,
      roomType,
      adultCount,
      childCount
    } = data;

    // 格式化日期 (MM/DD)
    const formatDate = (dateStr) => {
      const date = new Date(dateStr);
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${month}/${day}`;
    };

    const checkIn = formatDate(checkInDate);
    const checkOut = formatDate(checkOutDate);

    return `Dear Team

Hope this email finds you well.

Would you help book ${roomCount} ${roomType} with breakfast for ${adultCount + childCount} people as following:

Check-in: ${checkInDate}
Check-out: ${checkOutDate}

Guest Name: ${guestName}${guestPhone ? `
Phone: ${guestPhone}` : ''}${guestEmail ? `
Email: ${guestEmail}` : ''}

Thank you for your assistance.

Kind regards,

Travel Consultant
Happy Tassie Holiday`;
  };

  // WebSocket邮件状态监听器 - 必须在其他useEffect之前定义
  const handleEmailStatus = useCallback((data) => {
    console.log('收到邮件状态更新:', data);
    if (data.data && data.data.bookingId === bookingData?.id) {
      const { status, message: statusMessage, error } = data.data;
      
      // 🔥 清除超时定时器（如果存在）
      if (window.emailTimeoutRef) {
        clearTimeout(window.emailTimeoutRef);
        window.emailTimeoutRef = null;
      }
      
      switch (status) {
        case 'success':
          setLoading(false);
          message.success('邮件发送成功！');
          onSuccess && onSuccess();
          onCancel();
          break;
        case 'failed':
          setLoading(false);
          message.error(`邮件发送失败：${error || statusMessage}`);
          break;
        case 'sending':
          // 保持loading状态，显示发送中
          message.info('邮件正在发送中，请稍候...');
          break;
        default:
          break;
      }
      
      // 移除监听器
      if (status === 'success' || status === 'failed') {
        window.adminWebSocket?.off('message', handleEmailStatus);
      }
    }
  }, [bookingData?.id, onSuccess, onCancel]);

  // 初始化表单数据
  useEffect(() => {
    if (visible && bookingData) {
      const emailContent = generateEmailTemplate(bookingData);
      
      // 格式化日期 (MM/DD)
      const formatDate = (dateStr) => {
        const date = new Date(dateStr);
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${month}/${day}`;
      };

      const checkIn = formatDate(bookingData.checkInDate);
      const checkOut = formatDate(bookingData.checkOutDate);
      const subject = `${checkIn}-${checkOut} ${bookingData.roomCount} ${bookingData.roomType} #${bookingData.bookingReference}`;
      
      form.setFieldsValue({
        to: bookingData.hotelEmail || '',
        subject: subject,
        content: emailContent
      });
    }
  }, [visible, bookingData, form]);

  // 清理WebSocket监听器
  useEffect(() => {
    return () => {
      if (window.adminWebSocket) {
        window.adminWebSocket.off('message', handleEmailStatus);
      }
    };
  }, [handleEmailStatus]);

  // 发送邮件
  const handleSendEmail = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      const emailData = {
        bookingId: bookingData.id,
        to: values.to,
        subject: values.subject,
        content: values.content
      };

      console.log('发送邮件请求:', emailData);
      
      // 🔥 添加超时兜底机制（30秒）
      window.emailTimeoutRef = setTimeout(() => {
        setLoading(false);
        message.warning('邮件发送超时，但可能仍在后台处理中。请检查预订状态或稍后重试。');
        window.adminWebSocket?.off('message', handleEmailStatus);
        window.emailTimeoutRef = null;
        onCancel();
      }, 30000);
      
      // 添加WebSocket监听器
      if (window.adminWebSocket && window.adminWebSocket.isConnected()) {
        window.adminWebSocket.on('message', handleEmailStatus);
      }
      
      // 发送邮件请求
      const response = await sendHotelBookingEmail(emailData);
      
      console.log('邮件发送响应:', response);
      
      if (response.code === 1) {
        message.info('邮件已提交发送，请等待发送完成...');
        // 不立即关闭弹窗，等待WebSocket状态更新
        
        // 🔥 如果没有WebSocket连接，直接认为成功
        if (!window.adminWebSocket || !window.adminWebSocket.isConnected()) {
          if (window.emailTimeoutRef) {
            clearTimeout(window.emailTimeoutRef);
            window.emailTimeoutRef = null;
          }
          setLoading(false);
          message.success('邮件发送请求已提交！');
          onSuccess && onSuccess();
          onCancel();
        }
      } else {
        if (window.emailTimeoutRef) {
          clearTimeout(window.emailTimeoutRef);
          window.emailTimeoutRef = null;
        }
        setLoading(false);
        message.error(response.msg || '邮件提交失败');
        window.adminWebSocket?.off('message', handleEmailStatus);
      }
    } catch (error) {
      console.error('邮件发送错误:', error);
      setLoading(false);
      message.error('邮件发送失败：' + (error.message || '未知错误'));
      // 移除监听器
      window.adminWebSocket?.off('message', handleEmailStatus);
    }
  };

  // 预览数据
  const renderBookingPreview = () => {
    if (!bookingData) return null;

    return (
      <div style={{ marginBottom: 16, padding: 12, backgroundColor: '#f5f5f5', borderRadius: 6 }}>
        <Title level={5}>Booking Preview</Title>
        <Space direction="vertical" size={4}>
          <Text><strong>Booking Ref:</strong> {bookingData.bookingReference}</Text>
          <Text><strong>Hotel:</strong> {bookingData.hotelName}</Text>
          <Text><strong>Guest:</strong> {bookingData.guestName}</Text>
          <Text><strong>Dates:</strong> {bookingData.checkInDate} to {bookingData.checkOutDate}</Text>
          <Text><strong>Room:</strong> {bookingData.roomType} × {bookingData.roomCount}</Text>
        </Space>
      </div>
    );
  };

  return (
    <Modal
      title="Send Hotel Booking Email"
      open={visible}
      onCancel={onCancel}
      width={800}
      footer={[
        <Button key="cancel" onClick={onCancel}>
          Cancel
        </Button>,
        <Button key="send" type="primary" loading={loading} onClick={handleSendEmail}>
          Send Email
        </Button>
      ]}
    >
      {renderBookingPreview()}
      
      <Form
        form={form}
        layout="vertical"
        preserve={false}
      >
        <Form.Item
          name="to"
          label="To (Hotel Email)"
          rules={[
            { required: true, message: 'Please enter hotel email address' },
            { type: 'email', message: 'Please enter a valid email address' }
          ]}
        >
          <Input placeholder="hotel@example.com" />
        </Form.Item>

        <Form.Item
          name="subject"
          label="Subject"
          rules={[{ required: true, message: 'Please enter email subject' }]}
        >
          <Input placeholder="Email subject" />
        </Form.Item>

        <Form.Item
          name="content"
          label="Email Content"
          rules={[{ required: true, message: 'Please enter email content' }]}
        >
          <TextArea
            rows={20}
            placeholder="Email content..."
            style={{ fontFamily: 'monospace', fontSize: '12px' }}
          />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default HotelEmailModal; 