# Firebase Authentication 快速设置指南

## 🚀 5分钟快速设置

### 第一步：Firebase 控制台设置

1. **访问 Firebase 控制台**
   - 打开：https://console.firebase.google.com/
   - 登录你的 Google 账户

2. **选择项目**
   - 选择项目：`jcikl-account`
   - 如果没有项目，点击"创建项目"

3. **启用认证服务**
   - 左侧菜单 → **Authentication**
   - 点击 **Get started**
   - 在 **Sign-in method** 标签页
   - 找到 **Email/Password**
   - 点击 **Edit** → 启用 → **Save**

### 第二步：测试配置

运行测试脚本验证配置：

```bash
# 安装依赖（如果还没安装）
npm install

# 测试 Firebase 认证
node scripts/test-firebase-auth.js
```

### 第三步：启动应用

```bash
# 启动开发服务器
npm run dev
```

访问：http://localhost:3000

## ✅ 验证清单

- [ ] Firebase 项目已创建
- [ ] Authentication 服务已启用
- [ ] Email/Password 登录方式已启用
- [ ] 测试脚本运行成功
- [ ] 应用可以正常启动
- [ ] 可以注册新用户
- [ ] 可以登录现有用户

## 🔧 常见问题

### 问题1：`auth/configuration-not-found` 错误
**解决方案：**
1. 确认在 Firebase 控制台启用了 Authentication
2. 检查项目ID是否正确
3. 等待几分钟让设置生效

### 问题2：无法注册用户
**解决方案：**
1. 检查密码强度（至少6位）
2. 确认邮箱格式正确
3. 检查网络连接

### 问题3：登录失败
**解决方案：**
1. 确认用户已注册
2. 检查邮箱和密码是否正确
3. 确认用户账户未被禁用

## 📱 测试用户

你可以使用以下测试账户：

```
邮箱: test@example.com
密码: TestPassword123!
```

## 🔐 安全提示

1. **生产环境**：使用环境变量存储 Firebase 配置
2. **密码策略**：实施强密码要求
3. **邮箱验证**：启用邮箱验证功能
4. **登录限制**：设置登录尝试次数限制

## 📞 获取帮助

如果遇到问题：

1. 查看详细设置指南：`docs/firebase-setup-guide.md`
2. 运行诊断脚本：`node scripts/diagnose-firebase.js`
3. 检查 Firebase 控制台错误日志
4. 查看 Firebase 官方文档

## 🎯 下一步

设置完成后，你可以：

1. 自定义登录界面
2. 添加其他登录方式（Google、GitHub等）
3. 实现密码重置功能
4. 添加邮箱验证
5. 设置用户权限管理 