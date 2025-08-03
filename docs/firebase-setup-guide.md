# Firebase 设置指南

## 问题诊断
当前遇到错误：`Firebase: Error (auth/configuration-not-found)`

这个错误表示Firebase项目中的认证服务没有正确配置。

## 解决步骤

### 1. 访问 Firebase 控制台
1. 打开浏览器，访问：https://console.firebase.google.com/
2. 使用Google账户登录
3. 选择项目：`jcikl-account`

### 2. 启用认证服务
1. 在左侧菜单中点击 **Authentication**
2. 点击 **Get started** 或 **开始使用**
3. 在 **Sign-in method** 标签页中
4. 找到 **Email/Password** 选项
5. 点击 **Edit** 或 **编辑**
6. 启用 **Email/Password** 认证
7. 点击 **Save** 或 **保存**

### 3. 检查项目设置
1. 点击左侧齿轮图标（⚙️）进入 **Project settings**
2. 在 **General** 标签页中
3. 确认项目ID为：`jcikl-account`
4. 在 **Your apps** 部分确认Web应用配置正确

### 4. 验证域名设置
1. 在 **Authentication** > **Settings** > **Authorized domains**
2. 确保包含：`localhost` 和 `jcikl-account.firebaseapp.com`

### 5. 检查安全规则
1. 在左侧菜单中点击 **Firestore Database**
2. 点击 **Rules** 标签页
3. 确保有基本的读取权限规则

## 测试步骤

完成上述设置后，运行以下命令测试：

```bash
# 测试Firebase配置
node scripts/test-firebase-auth.js

# 运行单元测试
npm test

# 启动开发服务器
npm run dev
```

## 常见问题

### Q: 仍然出现 configuration-not-found 错误
A: 检查以下项目：
- 确认项目ID正确
- 确认API密钥正确
- 确认已启用Email/Password认证
- 等待几分钟让设置生效

### Q: 认证成功但无法访问数据库
A: 检查Firestore安全规则：
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

## 备用解决方案

如果问题持续存在，可以：

1. **创建新的Firebase项目**
   - 创建新项目：`jcikl-account-new`
   - 重新配置认证和数据库
   - 更新 `lib/firebase.ts` 中的配置

2. **使用模拟认证进行开发**
   - 在测试环境中使用模拟的认证服务
   - 专注于功能开发，稍后配置真实认证

## 联系支持

如果问题无法解决，可以：
1. 查看 Firebase 官方文档
2. 在 Firebase 社区论坛寻求帮助
3. 联系 Firebase 支持团队 