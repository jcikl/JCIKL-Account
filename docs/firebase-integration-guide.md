# Firebase 账户图表集成指南

## 🎯 概述

本指南介绍如何将账户图表与 Firebase 集成，实现实时数据存储和同步功能。

## 🚀 快速开始

### 1. 访问 Firebase 演示页面

```
http://localhost:3000/firebase-account-demo
```

### 2. 启动开发服务器

```bash
npm run dev
```

### 3. 测试 Firebase 集成

```bash
node scripts/test-firebase-integration.js
```

## 🔧 技术实现

### Firebase 配置

项目使用 Firebase Firestore 作为数据库，配置文件位于 `lib/firebase.ts`：

```typescript
const firebaseConfig = {
  apiKey: "AIzaSyA0S70IlVSW8tzBnMHJTONdjd4PDnXpG7c",
  authDomain: "jcikl-account.firebaseapp.com",
  projectId: "jcikl-account",
  storageBucket: "jcikl-account.firebasestorage.app",
  messagingSenderId: "337297956797",
  appId: "1:337297956797:web:7cf09cb5972f5b83afbcd4",
}
```

### 数据库结构

Firestore 集合结构：

```
accounts/
├── {accountId}/
│   ├── code: string
│   ├── name: string
│   ├── type: "Asset" | "Liability" | "Equity" | "Revenue" | "Expense"
│   ├── balance: number
│   ├── financialStatement: string
│   ├── description?: string
│   ├── parent?: string
│   ├── createdAt: string (ISO date)
│   └── updatedAt: string (ISO date)
```

## 📚 API 参考

### 账户操作函数

#### 添加账户

```typescript
import { addAccount } from "@/lib/firebase-utils"

const accountData = {
  code: "1001",
  name: "现金",
  type: "Asset",
  balance: 50000,
  financialStatement: "Balance Sheet",
  description: "主要现金账户"
}

const accountId = await addAccount(accountData)
```

#### 获取所有账户

```typescript
import { getAccounts } from "@/lib/firebase-utils"

const accounts = await getAccounts()
```

#### 根据 ID 获取账户

```typescript
import { getAccountById } from "@/lib/firebase-utils"

const account = await getAccountById("account-id")
```

#### 更新账户

```typescript
import { updateAccount } from "@/lib/firebase-utils"

const updateData = {
  balance: 75000,
  description: "更新后的描述"
}

await updateAccount("account-id", updateData)
```

#### 删除账户

```typescript
import { deleteAccount } from "@/lib/firebase-utils"

await deleteAccount("account-id")
```

#### 根据类型获取账户

```typescript
import { getAccountsByType } from "@/lib/firebase-utils"

const assetAccounts = await getAccountsByType("Asset")
const liabilityAccounts = await getAccountsByType("Liability")
```

#### 根据财务报表获取账户

```typescript
import { getAccountsByFinancialStatement } from "@/lib/firebase-utils"

const balanceSheetAccounts = await getAccountsByFinancialStatement("Balance Sheet")
const incomeStatementAccounts = await getAccountsByFinancialStatement("Income Statement")
```

#### 搜索账户

```typescript
import { searchAccounts } from "@/lib/firebase-utils"

const searchResults = await searchAccounts("现金")
```

#### 分页获取账户

```typescript
import { getAccountsWithPagination } from "@/lib/firebase-utils"

const result = await getAccountsWithPagination(50, lastDoc)
// result.accounts - 账户列表
// result.lastDoc - 最后一个文档引用
// result.hasMore - 是否还有更多数据
```

## 🎨 组件使用

### 启用 Firebase 的账户图表

```typescript
import { AccountChart } from "@/components/modules/account-chart"

<AccountChart 
  enableFirebase={true}
  onAccountSelect={(account) => console.log('选择账户:', account)}
  onAccountEdit={(account) => console.log('编辑账户:', account)}
  onAccountDelete={(accountId) => console.log('删除账户:', accountId)}
  onAccountAdd={() => console.log('添加账户')}
/>
```

### 禁用 Firebase 的账户图表

```typescript
<AccountChart 
  enableFirebase={false}
  accounts={localAccounts}
  onAccountAdd={(accountData) => {
    // 处理本地账户添加
  }}
/>
```

## 🔍 功能特性

### ✅ 已实现功能

1. **实时数据同步**
   - 自动从 Firebase 加载账户数据
   - 实时保存到 Firebase
   - 支持离线操作

2. **完整的 CRUD 操作**
   - 创建账户 (Create)
   - 读取账户 (Read)
   - 更新账户 (Update)
   - 删除账户 (Delete)

3. **高级查询功能**
   - 按类型筛选
   - 按财务报表筛选
   - 全文搜索
   - 分页加载

4. **错误处理**
   - 网络错误处理
   - 数据验证错误
   - 用户友好的错误提示

5. **性能优化**
   - 批量操作支持
   - 缓存机制
   - 懒加载

### 🔄 数据流程

```
用户操作 → 组件事件 → Firebase 函数 → Firestore 数据库
                ↓
        本地状态更新 → UI 重新渲染
```

## 🧪 测试

### 运行测试脚本

```bash
# 测试 Firebase 集成
node scripts/test-firebase-integration.js

# 测试账户类型
node scripts/test-account-types.js

# 测试账户添加
node scripts/test-account-add.js
```

### 测试页面

- **Firebase 演示**: http://localhost:3000/firebase-account-demo
- **简单测试**: http://localhost:3000/simple-account-test
- **调试页面**: http://localhost:3000/debug-account-creation

## 🛠️ 开发指南

### 添加新的 Firebase 操作

1. 在 `lib/firebase-utils.ts` 中添加新函数
2. 添加错误处理和日志记录
3. 更新类型定义
4. 编写测试用例

### 示例：添加批量操作

```typescript
export async function addAccountsBatch(accountsData: Omit<Account, "id">[]): Promise<string[]> {
  try {
    console.log('批量添加账户到 Firebase:', accountsData.length)
    
    const batch = writeBatch(db)
    const accountIds: string[] = []
    
    accountsData.forEach(accountData => {
      const docRef = doc(collection(db, "accounts"))
      batch.set(docRef, {
        ...accountData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      })
      accountIds.push(docRef.id)
    })
    
    await batch.commit()
    console.log('批量添加账户成功:', accountIds.length)
    
    return accountIds
  } catch (error) {
    console.error('批量添加账户失败:', error)
    throw new Error(`批量添加账户失败: ${error}`)
  }
}
```

## 🔒 安全规则

### Firestore 安全规则示例

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // 账户集合规则
    match /accounts/{accountId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && 
                   request.resource.data.code is string &&
                   request.resource.data.name is string &&
                   request.resource.data.type in ['Asset', 'Liability', 'Equity', 'Revenue', 'Expense'];
    }
  }
}
```

## 📊 监控和日志

### 控制台日志

所有 Firebase 操作都会在控制台输出详细日志：

```
📝 添加账户: { code: "1001", name: "现金", ... }
✅ 账户添加成功: 1001
📝 获取所有账户: { count: 5 }
```

### 错误监控

```typescript
// 错误处理示例
try {
  await addAccount(accountData)
} catch (error) {
  console.error('Firebase 操作失败:', error)
  // 显示用户友好的错误消息
  toast({
    title: "操作失败",
    description: `保存账户时出错: ${error}`,
    variant: "destructive",
  })
}
```

## 🚀 部署

### 生产环境配置

1. 更新 Firebase 配置
2. 设置安全规则
3. 配置 CORS 策略
4. 启用监控和日志

### 环境变量

```env
# .env.local
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
```

## 📞 技术支持

### 常见问题

**Q: Firebase 连接失败？**
A: 检查网络连接和 Firebase 配置是否正确

**Q: 数据不同步？**
A: 确认 Firebase 安全规则允许读写操作

**Q: 性能问题？**
A: 使用分页加载和缓存机制优化性能

### 获取帮助

1. 查看控制台错误信息
2. 运行测试脚本验证功能
3. 检查 Firebase 控制台日志
4. 参考 Firebase 官方文档

---

**状态**: ✅ 已完成并测试通过  
**最后更新**: 2024年12月  
**版本**: v1.0.0 