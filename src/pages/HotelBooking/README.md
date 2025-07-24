# 酒店预订管理系统

## 功能概述

酒店预订管理系统是旅游地接社后台管理系统的重要组成部分，主要用于管理酒店预订业务，包括酒店信息管理、房型管理、预订管理等功能。

## 主要功能模块

### 1. 酒店预订列表 (HotelBookingList.jsx)

**功能特点：**
- 分页查询酒店预订记录
- 多条件搜索（客人姓名、电话、状态、入住日期等）
- 预订状态管理（待确认、已确认、已入住、已退房、已取消）
- 批量操作（批量删除、批量状态更新）
- 实时统计数据展示
- 支持导出功能

**操作说明：**
1. 点击"新增预订"按钮创建新的酒店预订
2. 使用搜索条件筛选预订记录
3. 点击预订参考号查看详情
4. 使用批量操作管理多个预订

### 2. 酒店预订详情 (HotelBookingDetail.jsx)

**功能特点：**
- 完整的预订信息展示
- 客人信息、酒店信息、入住信息分类显示
- 操作历史时间线
- 状态更新功能
- 关联排团订单信息
- 支持打印功能

**操作说明：**
1. 查看预订的详细信息
2. 点击"更新状态"修改预订状态
3. 点击"编辑预订"修改预订信息
4. 点击"打印"生成预订单

### 3. 酒店预订表单 (HotelBookingForm.jsx)

**功能特点：**
- 新增/编辑酒店预订
- 客人信息录入
- 酒店和房型选择
- 自动计算住宿天数和总金额
- 表单验证
- 支持关联排团订单

**操作说明：**
1. 填写客人基本信息
2. 选择酒店和房型
3. 设置入住和退房日期
4. 系统自动计算费用
5. 提交保存预订信息

### 4. 酒店管理 (HotelManagement.jsx)

**功能特点：**
- 酒店基础信息管理
- 房型信息管理
- 供应商信息管理
- 三个模块的增删改查功能
- 关联关系管理

**操作说明：**
1. **酒店管理**：添加、编辑、删除酒店信息
2. **房型管理**：为指定酒店管理房型信息
3. **供应商管理**：管理酒店供应商信息

## 数据结构

### 酒店预订表 (hotel_bookings)
- `id`: 主键ID
- `schedule_order_id`: 关联排团订单ID
- `hotel_id`: 酒店ID
- `room_type_id`: 房型ID
- `booking_reference`: 预订参考号
- `guest_name`: 客人姓名
- `guest_phone`: 客人电话
- `guest_email`: 客人邮箱
- `check_in_date`: 入住日期
- `check_out_date`: 退房日期
- `nights`: 住宿天数
- `number_of_rooms`: 房间数
- `total_guests`: 客人总数
- `room_rate`: 房价
- `total_amount`: 总金额
- `status`: 预订状态
- `special_requests`: 特殊要求

### 酒店表 (hotels)
- `id`: 主键ID
- `supplier_id`: 供应商ID
- `hotel_name`: 酒店名称
- `hotel_level`: 酒店等级
- `address`: 地址
- `contact_phone`: 联系电话
- `description`: 描述

### 房型表 (hotel_room_types)
- `id`: 主键ID
- `hotel_id`: 酒店ID
- `room_type`: 房型名称
- `base_price`: 基础价格
- `max_occupancy`: 最大入住人数
- `bed_type`: 床型
- `room_size`: 房间面积

### 供应商表 (hotel_suppliers)
- `id`: 主键ID
- `supplier_name`: 供应商名称
- `contact_person`: 联系人
- `contact_phone`: 联系电话
- `email`: 邮箱
- `address`: 地址

## API接口

### 酒店预订相关
- `GET /admin/hotel-bookings/page` - 分页查询预订
- `GET /admin/hotel-bookings/{id}` - 获取预订详情
- `POST /admin/hotel-bookings` - 新增预订
- `PUT /admin/hotel-bookings` - 更新预订
- `DELETE /admin/hotel-bookings/{id}` - 删除预订
- `PUT /admin/hotel-bookings/{id}/status` - 更新状态

### 酒店管理相关
- `GET /admin/hotels` - 获取酒店列表
- `POST /admin/hotels` - 新增酒店
- `PUT /admin/hotels` - 更新酒店
- `DELETE /admin/hotels/{id}` - 删除酒店

### 房型管理相关
- `GET /admin/hotels/{hotelId}/room-types` - 获取房型列表
- `POST /admin/hotel-room-types` - 新增房型
- `PUT /admin/hotel-room-types` - 更新房型
- `DELETE /admin/hotel-room-types/{id}` - 删除房型

## 业务流程

### 预订创建流程
1. 选择酒店和房型
2. 填写客人信息
3. 设置入住日期
4. 系统自动生成预订参考号
5. 计算总金额
6. 保存预订记录

### 状态管理流程
1. **待确认** → **已确认**：确认预订
2. **已确认** → **已入住**：客人入住
3. **已入住** → **已退房**：客人退房
4. **任意状态** → **已取消**：取消预订

### 与排团系统集成
- 支持从排团订单自动创建酒店预订
- 预订信息与排团信息关联
- 统一的客人信息管理

## 技术特点

### 前端技术
- React 18 + Hooks
- Ant Design 4.x UI组件库
- React Router 6 路由管理
- Day.js 日期处理
- CSS3 动画效果

### 后端技术
- Spring Boot 2.7
- MyBatis 数据访问
- MySQL 数据库
- RESTful API设计

### 功能特性
- 响应式设计，支持移动端
- 实时数据更新
- 表单验证
- 错误处理
- 加载状态管理
- 批量操作
- 数据导出

## 使用注意事项

1. **权限控制**：确保用户有相应的操作权限
2. **数据验证**：所有输入数据都会进行前后端验证
3. **状态管理**：预订状态变更有严格的流程控制
4. **关联数据**：删除酒店或房型前请确保没有关联的预订记录
5. **日期设置**：退房日期必须晚于入住日期
6. **金额计算**：总金额会根据房价、房间数和天数自动计算

## 扩展功能

未来可以考虑添加的功能：
- 房间库存管理
- 价格日历
- 预订确认邮件
- 移动端APP
- 第三方酒店API集成
- 财务对账功能
- 客户评价系统
- 优惠券管理

## 技术支持

如有问题或建议，请联系开发团队。 