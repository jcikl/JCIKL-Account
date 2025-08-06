# JCIKL 会计系统模块关系意识图

## 🏗️ 系统架构概览

```
JCIKL 会计系统
├── 前端架构 (Next.js 15.2.4 + React 19)
├── 后端服务 (Firebase)
├── 数据存储 (Firestore)
├── 认证系统 (Firebase Auth + 自定义认证)
└── UI框架 (Radix UI + Tailwind CSS)
```

## 📊 核心数据模型

### 1. 用户管理模块
```
UserProfile
├── id: string (Firestore Document ID)
├── uid: string (Firebase Auth UID)
├── email: string
├── displayName: string
├── role: UserRole
├── createdAt: string
└── lastLogin: string

UserRole = "treasurer" | "president" | "secretary" | "vice_president" | "assistant_vice_president" | "project_chairman"
```

### 2. 账户管理模块
```
Account
├── id: string (Firestore Document ID)
├── code: string (账户代码)
├── name: string (账户名称)
├── type: "Asset" | "Liability" | "Equity" | "Revenue" | "Expense"
├── balance: number (账户余额)
├── financialStatement?: string (财务报表分类)
├── description?: string (账户描述)
└── parent?: string (父账户ID)
```

### 3. 银行账户模块
```
BankAccount
├── id: string (Firestore Document ID)
├── name: string (银行账户名称)
├── accountNumber?: string (银行账号)
├── bankName?: string (银行名称)
├── balance: number (账户余额)
├── currency: string (货币类型)
├── isActive: boolean (是否启用)
├── createdAt: string
├── updatedAt: string
└── createdByUid: string (创建者UID)
```

### 4. 交易记录模块
```
Transaction
├── id: string (Firestore Document ID)
├── date: string | FirebaseTimestamp
├── description: string (交易描述)
├── description2?: string (描述2)
├── expense: number (支出金额)
├── income: number (收入金额)
├── status: "Completed" | "Pending" | "Draft"
├── payer?: string (付款人)
├── projectid?: string (项目ID)
├── projectName?: string (项目名称)
├── category?: string (分类)
├── sequenceNumber?: number (排列序号)
├── bankAccountId?: string (银行账户ID)
├── bankAccountName?: string (银行账户名称)
└── createdByUid: string (创建者UID)
```

### 5. 项目管理模块
```
Project
├── id: string (Firestore Document ID)
├── name: string (项目名称)
├── projectid: string (项目代码)
├── bodCategory: BODCategory (BOD分类)
├── budget: number (预算)
├── remaining: number (剩余金额)
├── status: "Active" | "Completed" | "On Hold"
├── eventDate?: string | FirebaseTimestamp
├── description?: string (项目描述)
├── assignedToUid?: string (负责人UID)
├── createdAt?: string
└── updatedAt?: string
```

### 6. 分类管理模块
```
Category
├── id: string (Firestore Document ID)
├── code: string (分类代码)
├── name: string (分类名称)
├── type: "Income" | "Expense" (收入或支出分类)
├── description?: string (分类描述)
├── parentId?: string (父分类ID)
├── isActive: boolean (是否启用)
├── createdAt: string
├── updatedAt: string
└── createdByUid: string (创建者UID)
```

### 7. 日记账分录模块
```
JournalEntry
├── id: string (Firestore Document ID)
├── date: string (日期)
├── reference: string (参考号)
├── description: string (描述)
├── entries: Array<{
│   ├── account: string (账户)
│   ├── accountName: string (账户名称)
│   ├── debit: number (借方)
│   └── credit: number (贷方)
│   }>
├── status: "Posted" | "Draft"
└── createdByUid: string (创建者UID)
```

## 🔗 模块间链接关系

### 1. 认证与权限流
```
Authentication Flow
├── Firebase Auth
│   ├── 用户登录/注册
│   ├── 身份验证
│   └── 会话管理
├── Custom Auth (备用)
│   ├── 直接Firestore查询
│   ├── localStorage存储
│   └── 24小时过期机制
└── Role-Based Access Control
    ├── 6个用户角色
    ├── 3个权限级别
    └── 基于角色的功能访问控制
```

### 2. 数据流关系
```
Data Flow Relationships
├── UserProfile → 所有模块 (权限控制)
├── Account → JournalEntry (会计分录)
├── BankAccount → Transaction (银行交易)
├── Project → Transaction (项目交易)
├── Category → Transaction (交易分类)
├── Transaction → JournalEntry (自动生成分录)
└── GlobalGLSettings → 所有会计模块 (全局设置)
```

### 3. 组件依赖关系
```
Component Dependencies
├── AccountingDashboardOptimized (主仪表板)
│   ├── AppSidebar (侧边栏导航)
│   ├── AppHeader (顶部导航)
│   └── 动态模块加载
│       ├── 核心模块 (预加载)
│       │   ├── DashboardOverviewOptimized
│       │   ├── BankTransactionsMultiAccountAdvanced
│       │   └── ProjectAccountsOptimized
│       └── 次要模块 (懒加载)
│           ├── JournalEntriesOptimized
│           ├── TrialBalanceOptimized
│           ├── ProfitLossOptimized
│           ├── BalanceSheetOptimized
│           ├── GeneralLedgerOptimized
│           ├── AccountSettingsOptimized
│           ├── MerchandiseManagement
│           ├── MembershipFeeManagement
│           └── OperationExpenseManagement
```

## 💾 存储关系架构

### 1. Firebase Firestore 集合结构
```
Firestore Collections
├── users/ (用户集合)
│   └── {userId}/
│       ├── uid, email, displayName, role, createdAt, lastLogin
│       └── 索引: uid, email, role
├── accounts/ (账户集合)
│   └── {accountId}/
│       ├── code, name, type, balance, financialStatement, description, parent
│       └── 索引: code, type, financialStatement
├── bankAccounts/ (银行账户集合)
│   └── {bankAccountId}/
│       ├── name, accountNumber, bankName, balance, currency, isActive
│       └── 索引: name, isActive
├── transactions/ (交易集合)
│   └── {transactionId}/
│       ├── date, description, expense, income, status, projectid, category
│       ├── bankAccountId, sequenceNumber, createdByUid
│       └── 索引: date, status, projectid, bankAccountId, sequenceNumber
├── projects/ (项目集合)
│   └── {projectId}/
│       ├── name, projectid, bodCategory, budget, remaining, status
│       ├── assignedToUid, createdAt, updatedAt
│       └── 索引: projectid, bodCategory, status, assignedToUid
├── categories/ (分类集合)
│   └── {categoryId}/
│       ├── code, name, type, description, parentId, isActive
│       └── 索引: code, type, isActive
├── journalEntries/ (日记账集合)
│   └── {entryId}/
│       ├── date, reference, description, entries, status, createdByUid
│       └── 索引: date, status
├── merchandise/ (商品集合)
│   └── {merchandiseId}/
│       ├── name, sku, type, location, description, clothingSizes, clothingCut
│       └── 索引: sku, type
├── merchandiseTransactions/ (商品交易集合)
│   └── {transactionId}/
│       ├── merchandiseId, type, date, quantity, price, partnerName
│       ├── bankTransactionId, clothingSize, clothingCut
│       └── 索引: merchandiseId, type, date
├── members/ (会员集合)
│   └── {memberId}/
│       ├── name, phone, referrer, birthDate, nationality, senatorNumber
│       ├── membershipType, status, membershipYear
│       └── 索引: phone, membershipType, status
├── membershipPayments/ (会员费集合)
│   └── {paymentId}/
│       ├── memberId, amount, paymentDate, membershipYear, bankTransactionId
│       └── 索引: memberId, paymentDate
├── operationExpenses/ (运作费用集合)
│   └── {expenseId}/
│       ├── purpose, annotation1, annotation2, glAccountId
│       └── 索引: glAccountId
└── globalGLSettings/ (全局设置集合)
    └── {settingsId}/
        ├── merchandiseAssetAccountId, merchandiseCostAccountId
        ├── merchandiseIncomeAccountId, projectIncomeAccountId
        ├── projectExpenseAccountId, projectBudgetAccountId
        ├── membershipIncomeAccountId, membershipExpenseAccountId
        └── operationExpenseAccountId
```

### 2. 数据索引策略
```
Firebase Indexes
├── 复合索引
│   ├── transactions: date + status, projectid + date, bankAccountId + date
│   ├── projects: bodCategory + startDate, status + startDate, assignedToUid + startDate
│   └── journalEntries: date + status
├── 单字段索引
│   ├── accounts: code, type, financialStatement
│   ├── bankAccounts: name, isActive
│   ├── transactions: sequenceNumber, status, projectid, category
│   ├── projects: projectid, bodCategory, status
│   ├── categories: code, type, isActive
│   └── members: phone, membershipType, status
└── 全文搜索索引
    ├── transactions: description, projectName
    ├── projects: name, projectid
    ├── accounts: name, code
    └── categories: name, code
```

### 3. 缓存策略
```
Caching Strategy
├── 客户端缓存
│   ├── localStorage: 用户会话, 筛选条件, 偏好设置
│   ├── React Query: 数据查询缓存
│   └── 内存缓存: 频繁访问的数据
├── 服务端缓存
│   ├── Firebase 查询缓存
│   ├── 静态资源缓存
│   └── API 响应缓存
└── 缓存失效策略
    ├── TTL (Time To Live): 5分钟
    ├── 数据变更时自动失效
    └── 手动清除缓存
```

## 🔧 技术栈集成

### 1. 前端技术栈
```
Frontend Stack
├── Next.js 15.2.4 (React框架)
├── React 19 (UI库)
├── TypeScript 5 (类型系统)
├── Tailwind CSS (样式框架)
├── Radix UI (组件库)
├── React Hook Form (表单管理)
├── Zod (数据验证)
├── Lucide React (图标库)
├── Recharts (图表库)
├── React Virtual (虚拟化)
├── DND Kit (拖拽功能)
└── Sonner (通知系统)
```

### 2. 后端技术栈
```
Backend Stack
├── Firebase (BaaS平台)
│   ├── Firestore (NoSQL数据库)
│   ├── Authentication (用户认证)
│   ├── Storage (文件存储)
│   └── Hosting (静态托管)
├── Firebase Admin SDK (服务端SDK)
├── 自定义认证系统 (备用方案)
└── 安全规则 (Firestore Rules)
```

### 3. 开发工具链
```
Development Tools
├── Jest (测试框架)
├── React Testing Library (组件测试)
├── TypeScript (类型检查)
├── ESLint (代码检查)
├── Prettier (代码格式化)
├── Husky (Git钩子)
└── 自定义脚本 (自动化工具)
```

## 📈 性能优化策略

### 1. 前端性能优化
```
Frontend Performance
├── 代码分割
│   ├── 路由级分割
│   ├── 组件级懒加载
│   └── 动态导入
├── 虚拟化
│   ├── 大列表虚拟化
│   ├── 无限滚动
│   └── 按需渲染
├── 缓存优化
│   ├── 数据缓存
│   ├── 组件缓存
│   └── 静态资源缓存
└── 打包优化
    ├── Tree Shaking
    ├── 代码压缩
    └── 资源优化
```

### 2. 后端性能优化
```
Backend Performance
├── 数据库优化
│   ├── 索引策略
│   ├── 查询优化
│   ├── 分页加载
│   └── 批量操作
├── 缓存策略
│   ├── 查询缓存
│   ├── 结果缓存
│   └── 分布式缓存
└── 网络优化
    ├── 数据压缩
    ├── 连接复用
    └── 请求合并
```

## 🔐 安全架构

### 1. 认证安全
```
Authentication Security
├── Firebase Auth
│   ├── 多重身份验证
│   ├── 密码策略
│   └── 会话管理
├── 自定义认证
│   ├── 密码哈希
│   ├── 盐值加密
│   └── 过期机制
└── 权限控制
    ├── 基于角色的访问控制
    ├── 资源级权限
    └── 操作级权限
```

### 2. 数据安全
```
Data Security
├── Firestore 安全规则
│   ├── 读取权限控制
│   ├── 写入权限控制
│   └── 数据验证规则
├── 输入验证
│   ├── 客户端验证
│   ├── 服务端验证
│   └── 数据清理
└── 传输安全
    ├── HTTPS 加密
    ├── API 密钥管理
    └── 数据加密传输
```

## 🧪 测试架构

### 1. 测试策略
```
Testing Strategy
├── 单元测试
│   ├── 工具函数测试
│   ├── 组件测试
│   └── 钩子测试
├── 集成测试
│   ├── API 集成测试
│   ├── 数据库集成测试
│   └── 组件集成测试
├── 端到端测试
│   ├── 用户流程测试
│   ├── 跨浏览器测试
│   └── 性能测试
└── 测试工具
    ├── Jest (测试框架)
    ├── React Testing Library (组件测试)
    ├── Puppeteer (E2E测试)
    └── 自定义测试脚本
```

## 📊 监控与分析

### 1. 性能监控
```
Performance Monitoring
├── 前端监控
│   ├── 页面加载时间
│   ├── 组件渲染时间
│   ├── 用户交互响应时间
│   └── 错误率监控
├── 后端监控
│   ├── API 响应时间
│   ├── 数据库查询性能
│   ├── 错误日志
│   └── 资源使用情况
└── 用户行为分析
    ├── 功能使用统计
    ├── 用户路径分析
    ├── 错误追踪
    └── 性能瓶颈识别
```

## 🔄 部署架构

### 1. 部署流程
```
Deployment Pipeline
├── 开发环境
│   ├── 本地开发
│   ├── 热重载
│   └── 调试工具
├── 测试环境
│   ├── 自动化测试
│   ├── 集成测试
│   └── 性能测试
├── 预生产环境
│   ├── 用户验收测试
│   ├── 压力测试
│   └── 安全测试
└── 生产环境
    ├── 自动部署
    ├── 蓝绿部署
    ├── 回滚机制
    └── 监控告警
```

## 📋 模块功能矩阵

| 模块名称 | 核心功能 | 依赖模块 | 数据存储 | 权限要求 |
|---------|---------|---------|---------|---------|
| 用户认证 | 登录/注册/权限控制 | - | users | - |
| 账户管理 | 账户CRUD/分类管理 | 用户认证 | accounts | treasurer+ |
| 银行账户 | 银行账户管理 | 用户认证 | bankAccounts | treasurer+ |
| 交易管理 | 交易CRUD/批量操作 | 账户/项目/分类 | transactions | treasurer+ |
| 项目管理 | 项目CRUD/预算管理 | 用户认证 | projects | project_chairman+ |
| 分类管理 | 收支分类管理 | 用户认证 | categories | treasurer+ |
| 日记账 | 会计分录管理 | 账户/交易 | journalEntries | treasurer+ |
| 试算平衡 | 试算平衡表 | 账户 | accounts | treasurer+ |
| 损益表 | 损益表生成 | 账户/交易 | accounts/transactions | treasurer+ |
| 资产负债表 | 资产负债表生成 | 账户 | accounts | treasurer+ |
| 总账 | 总账查询/导出 | 账户/交易 | accounts/transactions | treasurer+ |
| 商品管理 | 商品CRUD/库存 | 用户认证 | merchandise | assistant_vice_president+ |
| 会员管理 | 会员CRUD/费用 | 用户认证 | members/membershipPayments | assistant_vice_president+ |
| 运作费用 | 运作费用管理 | 账户 | operationExpenses | assistant_vice_president+ |

## 🎯 系统特点总结

### 1. 技术特点
- **现代化架构**: Next.js + React + TypeScript
- **云原生**: 基于Firebase的BaaS架构
- **高性能**: 虚拟化、懒加载、缓存优化
- **可扩展**: 模块化设计、微服务架构
- **安全可靠**: 多重认证、权限控制、数据加密

### 2. 功能特点
- **完整会计系统**: 从基础记账到财务报表
- **多银行账户**: 支持多银行账户管理
- **项目管理**: 完整的项目预算和费用管理
- **商品管理**: 商品库存和交易管理
- **会员管理**: 会员信息和费用管理
- **权限控制**: 基于角色的细粒度权限控制

### 3. 用户体验
- **响应式设计**: 支持桌面和移动设备
- **直观界面**: 现代化的UI设计
- **高效操作**: 批量操作、导入导出、搜索筛选
- **实时同步**: 数据实时更新和同步
- **错误处理**: 完善的错误提示和恢复机制
