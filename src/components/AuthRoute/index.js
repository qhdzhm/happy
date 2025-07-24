import { getToken } from "@/utils"
import { Navigate } from "react-router-dom"

const AuthRoute = ({children})=>{
  const token = getToken();
  
  console.log('🔐 AuthRoute认证检查:', {
    hasToken: !!token,
    tokenPreview: token ? token.substring(0, 20) + '...' : 'null'
  });

  if(token){
    console.log('✅ AuthRoute认证通过，允许访问');
    return <>{children}</>
  }
  else{
    console.log('❌ AuthRoute认证失败，重定向到登录页');
    return <Navigate to='/login' replace/>
  }
}
export default AuthRoute