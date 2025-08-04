# 认证系统配置指南

## 概述

本项目支持两种认证模式：
1. **模拟认证** (Mock Auth) - 用于开发和测试
2. **真实 Firebase 认证** - 用于生产环境

## 当前配置

### 默认设置
- 默认使用**真实 Firebase 认证**
- 模拟认证需要手动启用

### 环境变量配置

创建 `.env.local` 文件并设置：

```bash
# 使用模拟认证（开发/测试）
NEXT_PUBLIC_USE_MOCK_AUTH=true

# 使用真实 Firebase 认证（生产）
NEXT_PUBLIC_USE_MOCK_AUTH=false
```

## 认证系统特性

### 模拟认证 (Mock Auth)
- ✅ 支持 localStorage 持久化
- ✅ 24小时自动过期
- ✅ 页面刷新后保持登录状态
- ✅ 测试用户账户

**测试账户：**
- 管理员: `admin@jcikl.com` / `admin123`
- 用户: `user@jcikl.com` / `user123`
- 经理: `manager@jcikl.com` / `manager123`

### 真实 Firebase 认证
- ✅ Firebase Auth 持久化
- ✅ 自动会话管理
- ✅ 生产环境就绪

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
**原因：** 认证系统没有正确持久化
**解决方案：**
1. 确保使用最新版本的认证系统
2. 检查 localStorage 是否可用
3. 验证环境变量配置

### 认证状态不一致
**原因：** 多个认证系统冲突
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
├── auth-context.tsx          # 主认证上下文
├── custom-auth-context.tsx   # 自定义认证上下文
└── auth-form.tsx            # 认证表单

lib/
├── mock-auth.ts             # 模拟认证系统
├── custom-auth.ts          # 自定义认证系统
└── firebase.ts             # Firebase 配置
``` 