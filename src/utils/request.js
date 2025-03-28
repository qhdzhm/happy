import axios from "axios";
import { clearToken, getToken } from "./token";

const instance = axios.create({
  baseURL: "//localhost:8080",
  timeout: 5000,
});

instance.interceptors.request.use(
  function (config) {
    const token = getToken();
    if (token) {
      config.headers["token"] = `${token}`;
    }
    return config;
  },
  function (error) {
    return Promise.reject(error);
  }
);

instance.interceptors.response.use(
  function (response) {
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
