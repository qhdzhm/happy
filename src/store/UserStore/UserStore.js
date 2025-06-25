import { clearToken, getToken, instance, setToken } from "@/utils";
import { clearCsrfToken } from "@/utils/request";
import { createSlice } from "@reduxjs/toolkit";
import { message } from "antd";

const userStore = createSlice({
  name:'user',
  initialState: {
    user:{},
    token: getToken() || ''
  },
  reducers:{
    setUserInfo(state,action){
      state.user = action.payload
      setToken(state.user.token)
    },
    clearUserInfo(state,action){
      state.user = {}
      state.token = ''
      clearToken();
      clearCsrfToken();
    }
  }
})

const {setUserInfo,clearUserInfo} = userStore.actions

const userReducer = userStore.reducer

const fetchLogin = (LoginForm)=>{
  
  return async (dispatch)=>{
    try {
      const res = await instance.post('/admin/employee/login',LoginForm)
      console.log('登录响应:', res.data)
      
      // 判断返回数据格式：可能直接返回用户对象，也可能是 {code, data} 格式
      if(res.data && (res.data.code === 1 || res.data.token)) {
        // 登录成功后清除CSRF Token缓存，确保下次获取最新的token
        clearCsrfToken();
        
        // 如果直接返回用户对象
        if(res.data.token) {
          dispatch(setUserInfo(res.data))
          message.success('登录成功')
          return { code: 1, data: res.data }
        } 
        // 如果返回 {code, data} 格式
        else {
          dispatch(setUserInfo(res.data.data))
          message.success('登录成功')
          return res.data
        }
      } else {
        message.error(res.data?.msg || '登录失败')
        clearToken()
        clearCsrfToken();
        return { code: 0, msg: res.data?.msg || '登录失败' }
      }
    } catch (error) {
      console.error('登录请求出错:', error)
      message.error('登录请求失败')
      clearToken()
      clearCsrfToken();
      return { code: 0, msg: '网络错误' }
    }
  }
}
export {fetchLogin ,clearUserInfo }
export default userReducer
