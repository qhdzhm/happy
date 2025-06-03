import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

// 由于后端已移除信用额度申请功能，将该页面重定向到代理商信用额度管理页面
const CreditRedirect = () => {
  const navigate = useNavigate();
  
  useEffect(() => {
    // 直接跳转到信用额度管理页面
    navigate('/credit', { replace: true });
  }, [navigate]);
  
  return null;
};

export default CreditRedirect; 