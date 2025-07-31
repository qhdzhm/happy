/**
 * 🎨 统一的颜色管理工具
 * 用于整个应用的颜色生成和管理
 */

// 地点颜色映射表
export const LOCATION_COLORS = {
  '霍巴特': '#13c2c2',
  '朗塞斯顿': '#722ed1',
  '摇篮山': '#7b68ee',
  '酒杯湾': '#ff9c6e',
  '亚瑟港': '#dc3545',
  '布鲁尼岛': '#87d068',
  '惠灵顿山': '#f56a00',
  '塔斯马尼亚': '#1890ff',
  '菲欣纳': '#3f8600',
  '菲欣纳国家公园': '#3f8600',
  '一日游': '#108ee9',
  '跟团游': '#fa8c16',
  '待安排': '#bfbfbf',
  '塔斯曼半岛': '#ff4d4f',
  '玛丽亚岛': '#ffaa00',
  '摩恩谷': '#9254de',
  '菲尔德山': '#237804',
  '非常湾': '#5cdbd3',
  '卡尔德': '#096dd9'
};

// 预设颜色数组（用于未匹配地点的颜色分配）
export const PRESET_COLORS = [
  '#1890ff', '#52c41a', '#faad14', '#f5222d', '#722ed1', 
  '#13c2c2', '#eb2f96', '#fa541c', '#a0d911', '#2f54eb',
  '#fa8c16', '#eb2f96', '#52c41a', '#1890ff', '#722ed1'
];

/**
 * 🎨 统一的颜色生成函数
 * @param {string} locationName - 地点名称
 * @returns {string} 颜色值
 */
export const getLocationColor = (locationName) => {
  if (!locationName) return '#1890ff';
  
  // 优先进行精确匹配
  if (LOCATION_COLORS[locationName]) {
    return LOCATION_COLORS[locationName];
  }
  
  // 查找包含关键词的地点名称
  for (const key in LOCATION_COLORS) {
    if (locationName.includes(key)) {
      return LOCATION_COLORS[key];
    }
  }
  
  // 如果没有匹配的固定颜色，使用哈希算法生成一致的颜色
  const hashCode = locationName.split('').reduce((acc, char) => {
    return char.charCodeAt(0) + ((acc << 5) - acc);
  }, 0);
  
  const h = Math.abs(hashCode) % 360;
  const s = 70 + Math.abs(hashCode % 20); // 70-90%饱和度
  const l = 55 + Math.abs((hashCode >> 4) % 15); // 55-70%亮度
  
  return `hsl(${h}, ${s}%, ${l}%)`;
};

/**
 * 🎨 生成订单组颜色
 * @param {Array} tourGroups - 行程组数据
 * @returns {Object} 订单ID到颜色的映射
 */
export const generateOrderGroupColors = (tourGroups) => {
  const colorMap = {};
  const usedOrderIds = new Set();
  
  tourGroups.forEach((group, index) => {
    // 使用订单ID作为分组依据，如果没有则使用group.id
    const orderId = group.orderId || group.customer?.orderId || group.id;
    
    if (!usedOrderIds.has(orderId)) {
      // 🎨 尝试从订单的第一个行程获取地点名称来生成颜色
      const firstLocation = group.segments?.[0]?.dates?.[Object.keys(group.segments[0].dates || {})[0]]?.name;
      if (firstLocation) {
        colorMap[orderId] = getLocationColor(firstLocation);
      } else {
        // 如果没有地点信息，使用预设的颜色数组
        colorMap[orderId] = PRESET_COLORS[usedOrderIds.size % PRESET_COLORS.length];
      }
      usedOrderIds.add(orderId);
    }
  });
  
  return colorMap;
};

/**
 * 🎨 获取颜色的透明度版本
 * @param {string} color - 原始颜色
 * @param {number} opacity - 透明度 (0-1)
 * @returns {string} 带透明度的颜色
 */
export const getColorWithOpacity = (color, opacity = 0.3) => {
  if (color.startsWith('#')) {
    // 处理十六进制颜色
    const r = parseInt(color.slice(1, 3), 16);
    const g = parseInt(color.slice(3, 5), 16);
    const b = parseInt(color.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  }
  
  // 如果是其他格式，直接返回原色
  return color;
};

// 特殊情况颜色配置
export const SPECIAL_SITUATION_COLORS = {
  '提前': { type: 'early_arrival', text: '提前到达', color: '#ff7a45' },
  '延后': { type: 'late_departure', text: '延后离开', color: '#722ed1' },
  '额外': { type: 'extra_service', text: '额外服务', color: '#13c2c2' },
  '接送机': { type: 'airport_transfer', text: '接送机', color: '#52c41a' },
  '早一天': { type: 'early_arrival', text: '提前到达', color: '#ff7a45' },
  '晚一天': { type: 'late_departure', text: '延后离开', color: '#722ed1' },
  '多一天': { type: 'extra_day', text: '额外天数', color: '#fa8c16' }
};

/**
 * 🚨 检测特殊情况
 * @param {string} specialRequests - 特殊要求
 * @param {string} remarks - 备注
 * @returns {Object|null} 特殊情况配置或null
 */
export const detectSpecialRequests = (specialRequests, remarks) => {
  if (!specialRequests && !remarks) return null;

  const content = `${specialRequests || ''} ${remarks || ''}`.toLowerCase();

  for (const [keyword, config] of Object.entries(SPECIAL_SITUATION_COLORS)) {
    if (content.includes(keyword)) {
      return config;
    }
  }

  return null;
};

// 将颜色工具设置为全局可访问（向后兼容）
if (typeof window !== 'undefined') {
  window.getLocationColor = getLocationColor;
  window.detectSpecialRequests = detectSpecialRequests;
} 