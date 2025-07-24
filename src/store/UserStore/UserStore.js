import { clearToken, getToken, setToken, setUserInfo as setUserInfoToStorage, getUserInfo, shouldUseCookieAuth, debugAuthStatus, ADMIN_PREFIX } from "@/utils/token";
import { clearCsrfToken } from "@/utils/request";
import { createSlice } from "@reduxjs/toolkit";
import { message } from "antd";
import { instance } from "@/utils";

const userStore = createSlice({
  name:'user',
  initialState: {
    user: getUserInfo() || {},
    token: getToken() || '',
    userType: 'admin', // 管理后台固定为admin类型
    cookieMode: shouldUseCookieAuth() // 标识当前是否为Cookie模式
  },
  reducers:{
    setUserInfo(state, action){
      const userData = action.payload;
      state.user = userData;
      
      // 设置token（根据模式选择存储方式）
      if (userData.token) {
        setToken(userData.token);
        state.token = userData.token;
      }
      
      // 设置用户信息到存储
      setUserInfoToStorage(userData);
      state.userType = 'admin';
      state.cookieMode = shouldUseCookieAuth();
      
      console.log('✅ 管理后台用户信息已设置:', {
        userId: userData.id,
        username: userData.userName || userData.username,
        cookieMode: state.cookieMode,
        hasToken: !!userData.token
      });
    },
    
    clearUserInfo(state, action){
      console.log('🧹 清理管理后台用户信息');
      
      state.user = {};
      state.token = '';
      state.userType = 'admin';
      
      // 清除所有管理后台认证信息
      clearToken();
      clearCsrfToken();
      
      console.log('✅ 管理后台用户信息已清理');
    },
    
    // 新增：更新认证模式
    updateAuthMode(state, action) {
      state.cookieMode = shouldUseCookieAuth();
      console.log('🔄 管理后台认证模式已更新:', state.cookieMode ? 'Cookie-only' : 'localStorage');
    },
    
    // 新增：从Cookie同步用户信息
    syncFromCookie(state, action) {
      if (shouldUseCookieAuth()) {
        const cookieUserInfo = getUserInfo();
        if (cookieUserInfo) {
          state.user = cookieUserInfo;
          console.log('🔄 从Cookie同步管理后台用户信息:', cookieUserInfo);
        }
      }
    }
  }
})

const {setUserInfo, clearUserInfo, updateAuthMode, syncFromCookie} = userStore.actions;
const userReducer = userStore.reducer;

// 管理员登录逻辑
const fetchLogin = (LoginForm) => {
  return async (dispatch) => {
    try {
      console.log('🚀 管理后台登录开始:', {
        username: LoginForm.username,
        cookieMode: shouldUseCookieAuth()
      });
      
      const res = await instance.post('/admin/employee/login', LoginForm);
      console.log('📝 管理后台登录响应:', res.data);
      
      // 判断返回数据格式：可能直接返回用户对象，也可能是 {code, data} 格式
      if(res.data && (res.data.code === 1 || res.data.token)) {
        // 登录成功后清除CSRF Token缓存，确保下次获取最新的token
        clearCsrfToken();
        
        let userData;
        
        // 如果直接返回用户对象
        if(res.data.token) {
          userData = res.data;
        } 
        // 如果返回 {code, data} 格式
        else {
          userData = res.data.data;
        }
        
        // 设置用户信息
        dispatch(setUserInfo(userData));
        
        // 如果是Cookie模式，等待一下让Cookie生效
        if (shouldUseCookieAuth()) {
          setTimeout(() => {
            dispatch(syncFromCookie());
            // 调试：显示认证状态
            console.log('🔍 登录成功后的认证状态调试:');
            debugAuthStatus();
          }, 100);
        }
        
        message.success('管理后台登录成功');
        console.log('✅ 管理后台登录成功:', {
          userId: userData.id,
          username: userData.userName || userData.username,
          cookieMode: shouldUseCookieAuth()
        });
        
        return { code: 1, data: userData };
      } else {
        const errorMsg = res.data?.msg || '管理后台登录失败';
        message.error(errorMsg);
        clearToken();
        clearCsrfToken();
        
        console.error('❌ 管理后台登录失败:', errorMsg);
        return { code: 0, msg: errorMsg };
      }
    } catch (error) {
      console.error('❌ 管理后台登录请求出错:', error);
      
      const errorMsg = error.response?.data?.msg || error.msg || '网络错误';
      message.error('管理后台登录请求失败: ' + errorMsg);
      
      clearToken();
      clearCsrfToken();
      
      return { code: 0, msg: errorMsg };
    }
  }
}

// 管理员登出逻辑
const fetchLogout = () => {
  return async (dispatch) => {
    try {
      console.log('🚀 管理后台登出开始');
      
      // 调用后端登出接口（清理服务端Cookie）
      try {
        await instance.post('/admin/employee/logout');
        console.log('✅ 管理后台服务端登出成功');
      } catch (error) {
        console.warn('⚠️ 管理后台服务端登出失败（忽略）:', error.message);
      }
      
      // 清理前端状态
      dispatch(clearUserInfo());
      
      message.success('管理后台登出成功');
      console.log('✅ 管理后台登出完成');
      
      return { code: 1 };
    } catch (error) {
      console.error('❌ 管理后台登出失败:', error);
      
      // 即使登出失败，也清理本地状态
      dispatch(clearUserInfo());
      
      return { code: 0, msg: error.message || '登出失败' };
    }
  }
}

// 检查管理后台认证状态
const checkAuthStatus = () => {
  return async (dispatch) => {
    try {
      const token = getToken();
      
      if (!token) {
        console.log('📝 管理后台无认证信息');
        dispatch(clearUserInfo());
        return { code: 0, msg: '未登录' };
      }
      
      if (shouldUseCookieAuth()) {
        // Cookie模式：尝试同步Cookie中的用户信息
        dispatch(syncFromCookie());
        console.log('🔄 Cookie模式：已同步用户信息');
        return { code: 1 };
      } else {
        // localStorage模式：验证token有效性（可选）
        console.log('🔄 localStorage模式：使用本地token');
        return { code: 1 };
      }
    } catch (error) {
      console.error('❌ 管理后台认证状态检查失败:', error);
      dispatch(clearUserInfo());
      return { code: 0, msg: '认证状态异常' };
    }
  }
}

export { 
  fetchLogin, 
  fetchLogout,
  checkAuthStatus,
  clearUserInfo, 
  updateAuthMode,
  syncFromCookie
};
export default userReducer;
