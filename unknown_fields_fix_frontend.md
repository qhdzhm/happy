# 前端修复"未知"字段显示问题 - 完整解决方案

## 🔍 **问题确认**

用户反馈：即使在**拖拽前**，订单数据就已经显示"未知"，说明问题出现在前端数据处理和显示逻辑上。

### 根本原因分析
1. **数据传递丢失** - `formatApiDataForSchedule`函数中订单字段传递不完整
2. **显示逻辑不当** - 前端组件优先显示"未知"而不是有效数据
3. **字段访问错误** - 组件中访问订单数据的路径不正确

## 💡 **已实施的解决方案**

### 1. **修复数据传递问题**
**文件：** `sky-admin-react/src/pages/TourArrangement/index.js`

**问题：** 在第620-627行，order对象构建时重要字段被丢失
```javascript
// 修复前 - 字段传递不完整
order: {
  ...order,
  tourId: tourId,
  orderNumber: order.orderNumber || '',
  specialRequests: order.specialRequests || ''
}

// 修复后 - 显式保留所有重要字段
order: {
  // 保持原始订单的所有字段
  ...order,
  // 确保关键字段不被覆盖
  tourId: tourId,
  orderNumber: order.orderNumber || '',
  specialRequests: order.specialRequests || '',
  // 显式保留重要字段，确保它们不会丢失
  flightNumber: order.flightNumber || null,
  returnFlightNumber: order.returnFlightNumber || null,
  hotelRoomCount: order.hotelRoomCount || null,
  roomDetails: order.roomDetails || null,
  roomType: order.roomType || null,
  passengerContact: order.passengerContact || null,
  agentName: order.agentName || null,
  operatorName: order.operatorName || null,
  contactPerson: order.contactPerson || null,
  contactPhone: order.contactPhone || null,
  pickupLocation: order.pickupLocation || null,
  dropoffLocation: order.dropoffLocation || null,
  itineraryDetails: order.itineraryDetails || null
}
```

### 2. **修复字段访问路径**
**文件：** `sky-admin-react/src/pages/TourArrangement/components/TourScheduleTable/index.js`

**问题：** `renderDetailContent`函数中订单数据访问路径错误
```javascript
// 修复前
const order = location.order || locationData.order || {};

// 修复后 - 正确的数据访问路径
const order = locationData.order || locationData.location?.order || {};
```

### 3. **优化显示逻辑**
**改进项：**
- 优先显示有效数据而不是"未知"
- 添加更多字段的显示支持
- 只在数据确实缺失时才显示默认值

```javascript
// 修复前 - 容易显示"未知"
tourName: order.tourName || location.name || '未知产品',

// 修复后 - 优先显示有效数据
tourName: order.tourName || locationData.name || '未知产品',
flightNumber: order.flightNumber || '暂无',  // 用"暂无"代替"未知"
agentName: order.agentName || '未知代理商',
```

### 4. **新增字段显示**
在订单详情面板中添加了以下字段：
- ✅ 代理商名称 (`agentName`)
- ✅ 航班号 (`flightNumber`) 
- ✅ 返程航班号 (`returnFlightNumber`)
- ✅ 酒店房间信息 (`hotelRoomCount`, `roomDetails`)

### 5. **添加调试工具**
在开发环境中添加了调试信息面板，帮助查看实际接收的数据结构。

## 🧪 **测试验证步骤**

### 1. 重新启动前端
```bash
cd sky-admin-react
npm start
```

### 2. 检查订单数据显示
1. 打开行程排列页面
2. 查看订单卡片，确认以下字段不再显示"未知"：
   - 代理商名称应显示："塔斯旅游"
   - 航班号应显示："jq123" 
   - 返程航班应显示："jq212"
   - 房间信息应显示："1间 (标准双人间)"

### 3. 使用调试工具
在开发环境中，点击订单详情中的"🔍 调试信息"展开，查看：
- **原始Order数据** - 确认包含完整字段
- **LocationData** - 确认数据传递正确

### 4. 验证数据来源
通过浏览器开发者工具Network面板：
1. 查看订单API响应 (`/api/order/pageQuery`)
2. 确认后端返回包含：
   ```json
   {
     "flightNumber": "jq123",
     "returnFlightNumber": "jq212", 
     "hotelRoomCount": 1,
     "agentName": "塔斯旅游",
     "roomDetails": "标准双人间"
   }
   ```

## 🎯 **预期结果**

### 修复前的显示
```
代理商: 未知
航班号: 未知
房间数: 未知
```

### 修复后的显示
```
🏢 代理商: 塔斯旅游
✈️ 航班号: jq123  
🛬 返程航班: jq212
🏨 房间: 1间 (标准双人间)
```

## 🔧 **如果问题仍然存在**

### A. 检查后端数据
确认后端API返回的字段名称与前端期望一致：
```javascript
// 确认字段名称匹配
console.log('后端返回字段:', Object.keys(order));
```

### B. 检查字段名称映射
可能需要在前端添加字段名称映射：
```javascript
// 如果后端字段名不同，添加映射
const fieldMapping = {
  agentName: order.agent_name || order.agentName,
  flightNumber: order.flight_number || order.flightNumber
};
```

### C. 检查数据类型
确认数据类型正确：
```javascript
// 确保数据类型正确
hotelRoomCount: parseInt(order.hotelRoomCount) || 0,
```

## 📝 **文件修改清单**

- ✅ `sky-admin-react/src/pages/TourArrangement/index.js` (第620-640行)
- ✅ `sky-admin-react/src/pages/TourArrangement/components/TourScheduleTable/index.js` (第1250-1330行)

## ⚡ **立即验证**

1. **重启前端服务**
2. **打开行程排列页面**  
3. **查看订单卡片详情**
4. **确认字段不再显示"未知"**

现在前端应该能正确显示所有订单字段，不再出现"未知"的问题了！ 