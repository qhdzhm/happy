# 🔧 订单乘客人数统计修复方案

## 📋 问题说明

### 问题现象
- 在后台管理系统中，添加或删除乘客后，订单的人数显示没有更新
- 订单表中的 `adultCount` 和 `childCount` 字段与实际乘客数量不一致

### 问题原因
在 `PassengerServiceImpl` 的以下方法中，只处理了乘客信息和关联关系，但没有自动更新订单表中的人数字段：
- `addPassengerToBooking()` - 添加乘客到订单
- `removePassengerFromBooking()` - 从订单中移除乘客
- `updatePassengerBookingInfo()` - 更新乘客信息

## 🔧 解决方案

### 1. 自动更新机制
在 `PassengerServiceImpl.java` 中添加了 `updateBookingPassengerCount()` 方法：
- 自动根据实际乘客数据重新计算成人和儿童数量
- 在添加、删除、更新乘客时自动调用
- 同时更新 `adultCount`、`childCount` 和 `groupSize` 字段

### 2. 批量修复功能
- **接口**: `POST /admin/passengers/fix-passenger-counts`
- **功能**: 批量检查和修复所有订单的人数统计
- **返回**: 修复的订单数量

### 3. 管理工具页面
- **访问路径**: `/fix-passenger-counts.html`
- **功能**: 提供可视化界面执行批量修复操作
- **特性**: 实时日志显示、错误处理、进度提示

## 📊 数据库结构

### 相关表
1. **`tour_bookings`** - 订单表
   - `adultCount` - 成人数量
   - `childCount` - 儿童数量
   - `groupSize` - 团队总人数

2. **`passengers`** - 乘客表
   - `isChild` - 是否为儿童

3. **`booking_passenger_relation`** - 关联表
   - `bookingId` - 订单ID
   - `passengerId` - 乘客ID
   - `isPrimary` - 是否为主要联系人

### 修复逻辑
```sql
-- 统计逻辑
SELECT 
  COUNT(CASE WHEN p.is_child = 0 OR p.is_child IS NULL THEN 1 END) as adult_count,
  COUNT(CASE WHEN p.is_child = 1 THEN 1 END) as child_count
FROM passengers p
JOIN booking_passenger_relation bpr ON p.passenger_id = bpr.passenger_id
WHERE bpr.booking_id = ?
  AND p.full_name IS NOT NULL 
  AND p.full_name != '';
```

## 🚀 使用方法

### 自动修复（推荐）
从现在开始，所有乘客的添加、删除、修改操作都会自动更新订单人数，无需手动干预。

### 批量修复历史数据
1. 打开管理后台
2. 访问 `/fix-passenger-counts.html`
3. 点击"开始修复订单人数统计"按钮
4. 等待修复完成，查看修复报告

### API调用方式
```javascript
// POST请求
fetch('/admin/passengers/fix-passenger-counts', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json'
    }
})
.then(response => response.json())
.then(data => {
    console.log('修复结果:', data);
});
```

## 🔍 技术细节

### 修复策略
- **智能检测**: 只修复实际存在数据不一致的订单
- **事务安全**: 使用 `@Transactional` 确保数据一致性
- **错误处理**: 个别订单修复失败不影响整体进程
- **详细日志**: 记录每个修复过程的详细信息

### 性能考虑
- 批量操作使用分页处理，避免内存溢出
- 只查询必要字段，提高查询效率
- 增量修复，跳过数据正确的订单

## ⚠️ 注意事项

1. **数据备份**: 建议在执行批量修复前备份数据库
2. **业务影响**: 修复过程不会影响正常业务操作
3. **执行时机**: 建议在业务低峰期执行批量修复
4. **权限控制**: 修复功能只对管理员开放

## 📈 效果验证

修复完成后可以通过以下方式验证：

1. **前端验证**: 在订单管理页面查看人数显示是否正确
2. **数据库验证**: 直接查询数据库对比订单表和乘客关联数据
3. **日志验证**: 查看修复日志了解具体修复了哪些订单

## 🐛 问题排查

如果修复后仍有问题：

1. 检查乘客表中的 `isChild` 字段是否正确
2. 确认 `booking_passenger_relation` 关联关系是否完整
3. 查看后端日志中的详细错误信息
4. 检查乘客的 `fullName` 字段是否为空（空姓名的乘客不计入统计）

---

**修复方案版本**: v1.0  
**更新时间**: 2024年12月  
**维护人员**: 系统开发团队 