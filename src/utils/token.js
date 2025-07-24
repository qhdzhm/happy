//token handler - 管理后台专用，支持Cookie-only模式和localStorage前缀隔离

// 管理后台专用前缀，避免与用户端冲突
const ADMIN_PREFIX = 'admin_'
const TOKEN_KEY = ADMIN_PREFIX + 'token'
const USER_INFO_KEY = ADMIN_PREFIX + 'userInfo'
const USER_TYPE_KEY = ADMIN_PREFIX + 'userType'

/**
 * 检查是否应该使用Cookie认证模式
 */
const shouldUseCookieAuth = () => {
  // 管理后台默认启用Cookie-only模式
  return true;
}

/**
 * 从Cookie中获取管理员token
 */
const getTokenFromCookie = () => {
  if (!document.cookie) {
    console.log('📝 没有检测到任何Cookie');
    return null;
  }
  
  // 调试：显示所有Cookie
  console.log('🍪 当前所有Cookie:', document.cookie);
  
  // 管理后台专用Cookie名称，避免与用户端冲突
  const adminCookieNames = ['adminToken', 'adminAuthToken', 'admin_token'];
  
  // 解析所有Cookie
  const allCookies = {};
  document.cookie.split(';').forEach(cookie => {
    const [name, value] = cookie.trim().split('=');
    if (name && value) {
      allCookies[name] = value;
    }
  });
  
  console.log('🔍 解析后的Cookie对象:', allCookies);
  
  for (const cookieName of adminCookieNames) {
    const value = allCookies[cookieName];
    if (value && value !== 'undefined' && value !== 'null') {
      console.log(`✅ 从Cookie获取管理员token: ${cookieName} = ${value.substring(0, 20)}...`);
      return value;
    } else {
      console.log(`❌ 未找到Cookie: ${cookieName}`);
    }
  }
  
  console.log(`⚠️ 在${adminCookieNames.length}个候选Cookie名称中都未找到有效token`);
  return null;
}

/**
 * 从localStorage获取管理员token（带前缀）
 */
const getTokenFromLocalStorage = () => {
  return localStorage.getItem(TOKEN_KEY);
}

/**
 * 设置管理员token（优先使用Cookie模式）
 */
const setToken = (token) => {
  if (shouldUseCookieAuth()) {
    // Cookie-only模式：不存储到localStorage，只依赖Cookie
    console.log('💾 管理后台Cookie-only模式，token存储由后端Cookie处理');
    
    // 仅在localStorage中存储最小标识，用于状态检查
    localStorage.setItem(TOKEN_KEY + '_flag', 'cookie_mode');
  } else {
    // localStorage模式（备用）
    localStorage.setItem(TOKEN_KEY, token);
    console.log('💾 管理员token已存储到localStorage（带前缀）');
  }
}

/**
 * 获取管理员token（统一入口）
 */
const getToken = () => {
  if (shouldUseCookieAuth()) {
    // Cookie-only模式：检查是否有用户信息Cookie作为认证状态标识
    const userInfoFromCookie = getUserInfo();
    if (userInfoFromCookie && userInfoFromCookie.isAuthenticated) {
      console.log('✅ Cookie-only模式：通过adminUserInfo Cookie确认已认证');
      return 'cookie-auth-verified'; // 返回标识符表示已认证
    }
    
    // 检查是否处于Cookie模式但没有认证信息
    const isCookieMode = localStorage.getItem(TOKEN_KEY + '_flag') === 'cookie_mode';
    if (isCookieMode) {
      console.log('⚠️ Cookie模式但未找到有效的认证信息');
      return null;
    }
  }
  
  // 兜底：从localStorage获取（带前缀）
  return getTokenFromLocalStorage();
}

/**
 * 清除管理员token和相关信息
 */
const clearToken = () => {
  // 清除localStorage中的管理后台数据（带前缀）
  const adminKeys = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith(ADMIN_PREFIX)) {
      adminKeys.push(key);
    }
  }
  
  adminKeys.forEach(key => {
    localStorage.removeItem(key);
    console.log(`🧹 清除管理后台localStorage: ${key}`);
  });
  
  // 清除特定的管理后台数据
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(TOKEN_KEY + '_flag');
  localStorage.removeItem(USER_INFO_KEY);
  localStorage.removeItem(USER_TYPE_KEY);
  
  console.log('✅ 管理后台认证信息已清理（localStorage前缀隔离）');
}

/**
 * 设置管理员用户信息（带前缀）
 */
const setUserInfo = (userInfo) => {
  if (shouldUseCookieAuth()) {
    // Cookie模式：最小化localStorage存储
    localStorage.setItem(USER_INFO_KEY + '_flag', 'cookie_mode');
  } else {
    localStorage.setItem(USER_INFO_KEY, JSON.stringify(userInfo));
  }
  localStorage.setItem(USER_TYPE_KEY, 'admin');
}

/**
 * 获取管理员用户信息
 */
const getUserInfo = () => {
  if (shouldUseCookieAuth()) {
    // 从Cookie中解析用户信息（如果后端设置了userInfo Cookie）
    const cookies = document.cookie.split(';');
    for (let cookie of cookies) {
      const [name, value] = cookie.trim().split('=');
      if (name === 'adminUserInfo' && value) {
        try {
          console.log('🔍 找到adminUserInfo Cookie，开始解析...');
          // 解码URL编码的Cookie值
          const decodedUserInfo = decodeURIComponent(value);
          console.log('📝 解码后的用户信息:', decodedUserInfo);
          const userInfo = JSON.parse(decodedUserInfo);
          console.log('✅ 成功解析adminUserInfo Cookie:', userInfo);
          return userInfo;
        } catch (e) {
          console.error('❌ 解析管理员Cookie用户信息失败:', e);
          console.error('原始Cookie值:', value);
        }
      }
    }
    console.log('❌ 未找到adminUserInfo Cookie');
    return null;
  }
  
  const userInfo = localStorage.getItem(USER_INFO_KEY);
  return userInfo ? JSON.parse(userInfo) : null;
}

/**
 * 检查管理员认证状态
 */
const isAuthenticated = () => {
  const token = getToken();
  return !!token;
}

/**
 * 调试：显示完整的认证状态信息
 */
const debugAuthStatus = () => {
  console.log('🔍 管理后台认证状态调试:');
  console.log('  - shouldUseCookieAuth():', shouldUseCookieAuth());
  console.log('  - document.cookie:', document.cookie);
  console.log('  - getUserInfo():', getUserInfo());
  console.log('  - getToken():', getToken());
  console.log('  - isAuthenticated():', isAuthenticated());
  
  // 检查localStorage
  const adminKeys = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith(ADMIN_PREFIX)) {
      adminKeys.push({ key, value: localStorage.getItem(key) });
    }
  }
  console.log('  - localStorage admin keys:', adminKeys);
}

// 开发环境下挂载到window对象，方便调试
if (process.env.NODE_ENV === 'development') {
  window.debugAdminAuth = debugAuthStatus;
}

export {
  setToken,
  getToken,
  clearToken,
  setUserInfo,
  getUserInfo,
  isAuthenticated,
  shouldUseCookieAuth,
  debugAuthStatus,
  ADMIN_PREFIX
}