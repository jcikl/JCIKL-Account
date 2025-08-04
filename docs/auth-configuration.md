# 认证系统配置指南

## 概述

本项目支持两种认证模式：
1. **模拟认证** (Mock Auth) - 用于开发和测试
2. **真实 Firebase 认证** - 用于生产环境

## 当前配置

### 默认设置
- 默认使用**模拟认证** (`NEXT_PUBLIC_USE_MOCK_AUTH=true`)
- 模拟认证已修复持久化问题，支持页面刷新后保持登录状态

### 环境变量配置

创建 `.env.local` 文件并设置：

```bash
# 使用模拟认证（开发/测试）
NEXT_PUBLIC_USE_MOCK_AUTH=true

# 使用真实 Firebase 认证（生产）
NEXT_PUBLIC_USE_MOCK_AUTH=false
```

## 认证系统特性

### 模拟认证 (Mock Auth) ✅ 已修复
- ✅ 支持 localStorage 持久化
- ✅ 24小时自动过期
- ✅ 页面刷新后保持登录状态
- ✅ 测试用户账户
- ✅ 自动恢复认证状态

**测试账户：**
- 管理员: `admin@jcikl.com` / `admin123`
- 用户: `user@jcikl.com` / `user123`
- 经理: `manager@jcikl.com` / `manager123`

### 真实 Firebase 认证
- ✅ Firebase Auth 持久化
- ✅ 自动会话管理
- ✅ 生产环境就绪

## 修复内容

### 问题描述
之前点击F5刷新页面后会要求重新登入，原因是模拟认证系统没有持久化存储机制。

### 解决方案
1. **添加 localStorage 持久化**：
   - 在 `lib/mock-auth.ts` 中添加了 localStorage 存储功能
   - 实现了 `saveToStorage()` 和 `restoreFromStorage()` 方法
   - 添加了24小时过期机制

2. **改进认证上下文**：
   - 在 `components/auth/auth-context.tsx` 中添加了过期检查
   - 确保页面加载时正确恢复认证状态

3. **测试页面**：
   - 创建了 `/performance-test` 页面用于测试持久化功能

## 测试方法

### 1. 基本测试
1. 访问应用并登录
2. 刷新页面 (F5)
3. 检查是否仍保持登录状态

### 2. 详细测试
1. 访问 `/performance-test` 页面
2. 查看认证状态信息
3. 使用测试账户登录
4. 刷新页面验证持久化

### 3. 过期测试
1. 登录后等待24小时
2. 刷新页面检查是否自动登出

## 切换认证模式

### 启用模拟认证
1. 创建 `.env.local` 文件
2. 添加 `NEXT_PUBLIC_USE_MOCK_AUTH=true`
3. 重启开发服务器

### 启用真实 Firebase 认证
1. 创建 `.env.local` 文件
2. 添加 `NEXT_PUBLIC_USE_MOCK_AUTH=false`
3. 配置 Firebase 环境变量
4. 重启开发服务器

## 故障排除

### 页面刷新后需要重新登录
**已修复** - 模拟认证现在支持持久化存储

**如果仍有问题：**
1. 检查浏览器是否支持 localStorage
2. 清除浏览器数据后重试
3. 确认环境变量配置正确

### 认证状态不一致
**解决方案：**
1. 清除浏览器 localStorage
2. 重新登录
3. 检查认证上下文配置

## 开发建议

1. **开发阶段**：使用模拟认证 (`NEXT_PUBLIC_USE_MOCK_AUTH=true`)
2. **测试阶段**：使用真实 Firebase 认证
3. **生产环境**：必须使用真实 Firebase 认证

## 文件结构

```
components/auth/
├── auth-context.tsx          # 主认证上下文 (已修复)
├── custom-auth-context.tsx   # 自定义认证上下文
└── auth-form.tsx            # 认证表单

lib/
├── mock-auth.ts             # 模拟认证系统 (已修复)
├── custom-auth.ts          # 自定义认证系统
└── firebase.ts             # Firebase 配置

app/
└── performance-test/
    └── page.tsx            # 认证测试页面 (新增)
```

## 技术细节

### localStorage 键名
- `mock_auth_user` - 存储用户信息
- `mock_auth_timestamp` - 存储登录时间戳

### 过期机制
- 默认24小时过期
- 自动清理过期认证信息
- 页面加载时检查过期状态 