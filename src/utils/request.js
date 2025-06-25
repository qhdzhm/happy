import axios from "axios";
import { clearToken, getToken } from "./token";

// 获取API地址，支持开发环境配置
const getBaseURL = () => {
  // 本地开发环境 - 临时直接访问后端
  if (process.env.NODE_ENV === 'development') {
    return "http://localhost:8080"; // 直接访问后端，需要后端CORS支持
  }
  // 生产环境
  return window.location.origin;
};

const instance = axios.create({
  baseURL: getBaseURL(),
  timeout: 60000, // 增加到60秒，适合图片上传
  withCredentials: true, // 确保发送cookies
});

// CSRF Token缓存
let csrfToken = null;
let csrfTokenPromise = null;

// 获取CSRF Token
const getCsrfToken = async () => {
  if (csrfToken) {
    return csrfToken;
  }
  
  if (csrfTokenPromise) {
    return csrfTokenPromise;
  }
  
  csrfTokenPromise = (async () => {
    try {
      console.log('【获取CSRF Token】开始请求');
      const response = await axios.get('/auth/csrf-token', {
        baseURL: getBaseURL(),
        withCredentials: true,
      });
      
      if (response.data && response.data.code === 1 && response.data.data) {
        csrfToken = response.data.data.csrfToken;
        console.log('【获取CSRF Token】成功:', csrfToken);
        return csrfToken;
      } else {
        throw new Error('获取CSRF Token失败');
      }
    } catch (error) {
      console.error('【获取CSRF Token】失败:', error);
      csrfTokenPromise = null;
      throw error;
    }
  })();
  
  return csrfTokenPromise;
};

// 清除CSRF Token缓存
const clearCsrfToken = () => {
  csrfToken = null;
  csrfTokenPromise = null;
};

// 添加请求调试信息
instance.interceptors.request.use(
  async function (config) {
    const token = getToken();
    if (token) {
      config.headers["token"] = `${token}`;
    }
    
    // 对于需要CSRF保护的请求方法，添加CSRF Token
    const method = config.method.toUpperCase();
    if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(method)) {
      // 排除不需要CSRF Token的路径
      const excludedPaths = [
        '/user/login',
        '/user/register', 

        '/agent/login',
        '/admin/employee/login',
        '/auth/csrf-token',
        '/auth/refresh',
        '/auth/logout',
        '/chatbot/message',
        '/chatbot/health',
        '/user/bookings/tour/calculate-price'
      ];
      
      const needsCsrf = !excludedPaths.some(path => config.url.includes(path));
      
      if (needsCsrf) {
        try {
          const csrf = await getCsrfToken();
          config.headers["X-CSRF-Token"] = csrf;
          console.log('【CSRF Token】已添加到请求头:', csrf);
        } catch (error) {
          console.error('【CSRF Token】获取失败，请求可能会被拒绝:', error);
        }
      }
    }
    
    // 输出请求信息，方便调试
    console.log(`【API请求】${config.method.toUpperCase()} ${config.url}`, {
      params: config.params,
      data: config.data,
      headers: config.headers
    });
    
    return config;
  },
  function (error) {
    console.error('【API请求错误】', error);
    return Promise.reject(error);
  }
);

// 添加响应调试信息
instance.interceptors.response.use(
  function (response) {
    // 输出响应信息，方便调试
    console.log(`【API响应】${response.config.method.toUpperCase()} ${response.config.url}`, response.data);
    
    // 检查是否是标准响应格式
    if (response.data && (response.data.code !== undefined || response.data.status !== undefined)) {
      // 后端返回的标准响应结构，直接返回
      return response.data;
    } else {
      // 非标准响应，构造标准格式
      return {
        code: 1,
        data: response.data,
        msg: null
      };
    }
  },
  function (error) {
    console.error('【API响应错误】', error);
    
    if (error.response) {
      const status = error.response.status;
      
      // 401: 未授权，清除token并跳转登录
      if (status === 401) {
      clearToken();
        clearCsrfToken();
      window.location.href = '/login';
      }
      // 403: 可能是CSRF Token失效，清除缓存并重试一次
      else if (status === 403 && error.response.data && 
               error.response.data.msg && 
               error.response.data.msg.includes('CSRF')) {
        console.warn('【CSRF Token】可能已失效，清除缓存');
        clearCsrfToken();
      }
    }
    
    // 构造统一的错误响应
    return Promise.reject({
      code: 0,
      data: null,
      msg: (error.response && error.response.data && error.response.data.message) || 
           (error.response && error.response.data && error.response.data.msg) || 
           error.message || '请求失败'
    });
  }
);

// 导出工具函数
export { clearCsrfToken };
export default instance;
