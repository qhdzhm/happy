import axios from "axios";
import { clearToken, getToken } from "./token";

// 获取API地址，支持开发环境配置
const getBaseURL = () => {
  // 本地开发环境
  if (process.env.NODE_ENV === 'development') {
    return "//localhost:8080";
  }
  // 生产环境
  return window.location.origin;
};

const instance = axios.create({
  baseURL: getBaseURL(),
  timeout: 5000,
});

// 添加请求调试信息
instance.interceptors.request.use(
  function (config) {
    const token = getToken();
    if (token) {
      config.headers["token"] = `${token}`;
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
    
    if (error.response && error.response.status === 401) {
      clearToken();
      window.location.href = '/login';
    }
    
    // 构造统一的错误响应
    return Promise.reject({
      code: 0,
      data: null,
      msg: (error.response && error.response.data && error.response.data.message) || error.message || '请求失败'
    });
  }
);

export default instance;
