# 时间格式修复说明

## 问题描述

在导游分配功能中遇到了400错误，具体错误信息：
```
Cannot deserialize value of type `java.time.LocalTime` from String "08:00": Failed to deserialize java.time.LocalTime
```

## 问题原因

后端Java的`LocalTime`类型期望的时间格式是`HH:mm:ss`（例如：08:00:00），但前端发送的是`HH:mm`格式（例如：08:00）。

## 修复内容

已修复以下文件中的时间格式问题：

### 1. GuideVehicleAssignModal/index.js

#### 修复的函数：
- **loadAvailableResources**: 查询可用资源时的时间参数
- **handleAutoAssign**: 自动分配时的时间字段
- **handleManualAssign**: 手动分配时的时间字段
- **初始值设置**: 表单默认时间值

#### 具体修改：
```javascript
// 修改前
startTime: values.startTime.format('HH:mm')     // 输出: "08:00"
endTime: values.endTime.format('HH:mm')         // 输出: "18:00"

// 修改后  
startTime: values.startTime.format('HH:mm:ss')  // 输出: "08:00:00"
endTime: values.endTime.format('HH:mm:ss')      // 输出: "18:00:00"
```

```javascript
// 修改前
startTime: moment('08:00', 'HH:mm')
endTime: moment('18:00', 'HH:mm')

// 修改后
startTime: moment('08:00:00', 'HH:mm:ss')
endTime: moment('18:00:00', 'HH:mm:ss')
```

## 验证方法

### 1. 重新测试分配功能
1. 打开前端应用：http://localhost:3000
2. 找到导游分配功能
3. 尝试进行手动分配或自动分配
4. 确认不再出现400错误

### 2. 检查API请求
打开浏览器开发者工具 → Network标签：
- 查看POST请求到`/admin/guide-assignment/manual-assign`
- 确认请求体中的`startTime`和`endTime`字段格式为`HH:mm:ss`

### 3. 预期的请求格式
```json
{
  "assignmentDate": "2024-01-15",
  "startTime": "08:00:00",
  "endTime": "18:00:00",
  "location": "霍巴特",
  "totalPeople": 6,
  "guideId": 1,
  "vehicleId": 1,
  "tourScheduleOrderIds": [1, 2, 3],
  "priority": 1,
  "assignmentStatus": "confirmed",
  "remarks": "备注信息"
}
```

## 注意事项

1. **UI界面显示**: TimePicker组件仍然显示`HH:mm`格式（用户友好），但提交时会转换为`HH:mm:ss`
2. **向后兼容**: 修改不会影响其他功能，只影响与后端LocalTime字段的交互
3. **一致性**: 所有时间相关的API调用现在都使用统一的`HH:mm:ss`格式

## 相关文件

- `/src/components/GuideVehicleAssignModal/index.js` - 主要修复文件
- `/src/api/guideAssignment.js` - API调用函数（无需修改）

## 测试状态

- [x] 修复时间格式问题
- [ ] 验证手动分配功能正常
- [ ] 验证自动分配功能正常
- [ ] 验证查询可用资源功能正常

请按照上述验证方法测试功能是否正常工作。如果仍有问题，请检查后端是否正常运行，以及数据库连接是否正常。 