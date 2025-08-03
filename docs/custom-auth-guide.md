# 自定义认证系统使用指南

## 概述

本项目实现了一个自定义的简单认证系统，基于邮箱和密码直接查询 Firestore 数据库，使用 localStorage 保存登录状态，不依赖 Firebase Authentication 服务。

## 系统特点

### ✅ 优势
- **简单直接**: 不依赖 Firebase Authentication 服务
- **数据存储**: 用户数据直接存储在 Firestore 的 `users` 集合中
- **本地持久化**: 使用 localStorage 保存登录状态，支持页面刷新
- **自动过期**: 登录状态24小时后自动过期
- **角色权限**: 完整的用户角色和权限管理系统

### ⚠️ 安全考虑
- 密码使用简单哈希存储（生产环境建议使用 bcrypt）
- 没有 JWT 令牌机制
- 依赖客户端存储，安全性相对较低

## 文件结构

```
lib/
├── custom-auth.ts          # 自定义认证核心逻辑
components/auth/
├── custom-auth-context.tsx # 自定义认证上下文
├── custom-auth-form.tsx    # 自定义认证表单
app/
├── custom-auth/page.tsx    # 自定义认证页面
scripts/
├── test-custom-auth.js     # 测试脚本
```

## 使用方法

### 1. 基本使用

```tsx
import { CustomAuthProvider } from "@/components/auth/custom-auth-context"
import { useCustomAuth } from "@/components/auth/custom-auth-context"

function App() {
  return (
    <CustomAuthProvider>
      <YourApp />
    </CustomAuthProvider>
  )
}

function YourComponent() {
  const { login, signup, logout, currentUser, isAuthenticated } = useCustomAuth()
  
  // 使用认证功能
}
```

### 2. 登录

```tsx
const { login } = useCustomAuth()

try {
  await login(email, password)
  // 登录成功
} catch (error) {
  // 处理错误
}
```

### 3. 注册

```tsx
const { signup } = useCustomAuth()

try {
  await signup(email, password, displayName, role)
  // 注册成功
} catch (error) {
  // 处理错误
}
```

### 4. 登出

```tsx
const { logout } = useCustomAuth()

await logout()
```

## 数据模型

### Firestore 用户文档结构

```typescript
interface UserDocument {
  uid: string                    // 用户唯一ID
  email: string                  // 邮箱地址
  displayName: string            // 显示名称
  role: UserRoles               // 用户角色
  createdAt: string             // 创建时间
  lastLogin: string             // 最后登录时间
  passwordHash: string          // 密码哈希（不返回给前端）
}
```

### 用户角色

```typescript
enum UserRoles {
  TREASURER = 'TREASURER',                    // 财政长
  PRESIDENT = 'PRESIDENT',                     // 会长
  SECRETARY = 'SECRETARY',                     // 秘书
  VICE_PRESIDENT = 'VICE_PRESIDENT',          // 副会长
  ASSISTANT_VICE_PRESIDENT = 'ASSISTANT_VICE_PRESIDENT', // 副会长助理
  PROJECT_CHAIRMAN = 'PROJECT_CHAIRMAN'       // 项目主席
}
```

## 测试

### 运行测试脚本

```bash
node scripts/test-custom-auth.js
```

### 测试内容
- 用户注册功能
- 用户登录功能
- 密码验证
- 错误处理
- 数据清理

## 安全建议

### 生产环境改进

1. **密码哈希**: 使用 bcrypt 或 Argon2 替代简单哈希
2. **JWT 令牌**: 实现基于 JWT 的认证机制
3. **HTTPS**: 确保所有通信使用 HTTPS
4. **输入验证**: 加强输入验证和清理
5. **速率限制**: 实现登录尝试速率限制
6. **审计日志**: 记录登录和操作日志

### 示例改进代码

```typescript
// 使用 bcrypt 进行密码哈希
import bcrypt from 'bcrypt'

private async hashPassword(password: string): Promise<string> {
  const saltRounds = 12
  return await bcrypt.hash(password, saltRounds)
}

private async verifyPassword(password: string, hash: string): Promise<boolean> {
  return await bcrypt.compare(password, hash)
}
```

## 故障排除

### 常见问题

1. **登录失败**
   - 检查邮箱和密码是否正确
   - 确认用户已在 Firestore 中创建
   - 检查网络连接

2. **localStorage 错误**
   - 检查浏览器是否支持 localStorage
   - 确认没有隐私模式限制

3. **Firestore 连接问题**
   - 检查 Firebase 配置
   - 确认 Firestore 规则允许读写

### 调试技巧

```javascript
// 检查 localStorage 中的认证数据
console.log('Auth data:', localStorage.getItem('jcikl_auth_user'))
console.log('Auth timestamp:', localStorage.getItem('jcikl_auth_timestamp'))

// 检查 Firestore 中的用户数据
const usersRef = collection(db, 'users')
const q = query(usersRef, where('email', '==', 'test@example.com'))
const snapshot = await getDocs(q)
console.log('Users:', snapshot.docs.map(doc => doc.data()))
```

## 迁移指南

### 从 Firebase Auth 迁移

1. 导出现有用户数据
2. 为每个用户生成密码哈希
3. 导入到 Firestore users 集合
4. 更新前端代码使用自定义认证
5. 测试所有功能

### 数据迁移脚本示例

```javascript
// 迁移脚本示例
async function migrateUsers() {
  // 从 Firebase Auth 获取用户列表
  const authUsers = await auth.listUsers()
  
  for (const authUser of authUsers.users) {
    // 创建 Firestore 用户文档
    const userDoc = {
      uid: authUser.uid,
      email: authUser.email,
      displayName: authUser.displayName || 'Migrated User',
      role: 'ASSISTANT_VICE_PRESIDENT', // 默认角色
      createdAt: authUser.metadata.creationTime,
      lastLogin: authUser.metadata.lastSignInTime,
      passwordHash: 'migrated' // 需要用户重新设置密码
    }
    
    await setDoc(doc(db, 'users', authUser.uid), userDoc)
  }
}
``` 