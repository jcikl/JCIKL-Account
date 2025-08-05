# GL账户格式和参数存储更新说明

## 📋 概述

为了支持我们生成的JSON导入文件，General Ledger账户的格式和参数存储需要进行以下更新：

## 🔄 需要更新的组件

### 1. **数据模型更新 (lib/data.ts)**

当前的Account接口已经支持我们的JSON格式，但建议添加一些可选字段：

```typescript
export interface Account {
  id?: string // Firestore document ID
  code: string
  name: string
  type: "Asset" | "Liability" | "Equity" | "Revenue" | "Expense"
  balance: number
  financialStatement?: string // 财务报表分类
  description?: string // 账户描述
  parent?: string
  // 新增可选字段
  createdAt?: string // 创建时间
  updatedAt?: string // 更新时间
  createdByUid?: string // 创建者UID
}
```

### 2. **GlobalGLSettings接口扩展**

需要扩展GlobalGLSettings接口以支持更多GL设置：

```typescript
export interface GlobalGLSettings {
  id?: string
  // 商品管理相关设置
  merchandiseAssetAccountId?: string
  merchandiseCostAccountId?: string
  merchandiseIncomeAccountId?: string
  
  // 项目账户相关设置
  projectIncomeAccountId?: string
  projectExpenseAccountId?: string
  projectBudgetAccountId?: string
  
  // 会员管理相关设置
  membershipIncomeAccountId?: string
  membershipExpenseAccountId?: string
  
  // 日常运作费用管理相关设置
  operationExpenseAccountId?: string
  
  // 新增：交易映射设置
  transactionMappings?: Record<string, string>
  
  // 系统字段
  createdAt: string
  updatedAt: string
  createdByUid: string
}
```

### 3. **导入对话框组件更新**

需要创建新的导入对话框组件 `ImportDialogEnhanced`，支持：

- JSON格式文件导入
- GL设置自动导入
- 交易映射关系导入
- 数据预览和验证
- 批量导入功能

### 4. **账户图表组件更新**

更新 `AccountChart` 组件的导入处理逻辑：

```typescript
// 在 handleImport 函数中添加对JSON格式的支持
const handleImport = async (importedData: {
  accounts: Array<{
    code: string
    name: string
    type: "Asset" | "Liability" | "Equity" | "Revenue" | "Expense"
    financialStatement: string
    description?: string
    balance?: number
    parent?: string
  }>
  glSettings?: Partial<GlobalGLSettings>
  transactionMappings?: Record<string, string>
}) => {
  // 处理账户导入
  // 处理GL设置导入
  // 处理交易映射导入
}
```

### 5. **Firebase工具函数更新**

更新 `firebase-utils.ts` 中的账户相关函数：

```typescript
// 添加批量导入账户的函数
export async function batchImportAccounts(
  accounts: Array<Omit<Account, "id">>,
  updateExisting: boolean = false
): Promise<{
  importedCount: number
  updatedCount: number
  errors: Array<{ code: string; error: string }>
}> {
  // 实现批量导入逻辑
}

// 添加GL设置导入函数
export async function importGLSettings(
  settings: Partial<GlobalGLSettings>
): Promise<void> {
  // 实现GL设置导入逻辑
}

// 添加交易映射导入函数
export async function importTransactionMappings(
  mappings: Record<string, string>
): Promise<void> {
  // 实现交易映射导入逻辑
}
```

## 📊 存储结构更新

### Firebase集合结构

```
/accounts
  - accountId
    - code: string
    - name: string
    - type: string
    - balance: number
    - financialStatement: string
    - description: string
    - parent: string
    - createdAt: timestamp
    - updatedAt: timestamp
    - createdByUid: string

/global_gl_settings
  - settingsId
    - merchandiseAssetAccountId: string
    - merchandiseCostAccountId: string
    - merchandiseIncomeAccountId: string
    - projectIncomeAccountId: string
    - projectExpenseAccountId: string
    - projectBudgetAccountId: string
    - membershipIncomeAccountId: string
    - membershipExpenseAccountId: string
    - operationExpenseAccountId: string
    - transactionMappings: object
    - createdAt: timestamp
    - updatedAt: timestamp
    - createdByUid: string
```

## 🔧 实现步骤

### 步骤1: 更新数据模型
1. 扩展Account接口
2. 扩展GlobalGLSettings接口
3. 添加新的类型定义

### 步骤2: 更新Firebase工具函数
1. 添加批量导入函数
2. 添加GL设置导入函数
3. 添加交易映射导入函数
4. 更新现有CRUD函数

### 步骤3: 创建增强版导入对话框
1. 创建ImportDialogEnhanced组件
2. 支持JSON格式解析
3. 添加数据预览功能
4. 添加验证和错误处理

### 步骤4: 更新账户图表组件
1. 集成新的导入对话框
2. 更新导入处理逻辑
3. 添加GL设置和交易映射处理

### 步骤5: 更新GL设置管理组件
1. 支持新的GL设置字段
2. 添加交易映射管理界面
3. 集成导入功能

## 🎯 新功能特性

### JSON格式支持
- 完整的账户数据结构
- GL设置配置
- 交易映射关系
- 元数据信息

### 批量导入
- 支持35个账户同时导入
- 自动验证数据完整性
- 错误处理和报告
- 进度显示

### 智能更新
- 检测现有账户
- 选择性更新
- 保留现有数据
- 冲突解决

### 数据预览
- 导入前预览
- 验证结果展示
- 错误信息显示
- 统计信息

## 📝 使用说明

### 导入JSON文件
1. 打开账户图表页面
2. 点击"导入"按钮
3. 选择"JSON格式"
4. 上传或粘贴JSON数据
5. 预览和验证数据
6. 确认导入

### 导入CSV文件
1. 选择"CSV格式"
2. 上传CSV文件
3. 配置导入选项
4. 预览数据
5. 确认导入

### 配置GL设置
1. 导入完成后
2. 进入GL设置页面
3. 配置各模块的默认账户
4. 保存设置

## ⚠️ 注意事项

1. **备份数据**: 导入前请备份现有数据
2. **验证格式**: 确保JSON格式正确
3. **账户代码**: 避免重复的账户代码
4. **权限检查**: 确保有足够的权限进行导入
5. **网络连接**: 确保Firebase连接稳定

## 🔄 兼容性

- 向后兼容现有的CSV导入功能
- 支持现有的账户数据结构
- 不影响现有的GL设置
- 保持现有的交易映射关系

## 📞 技术支持

如果在更新过程中遇到问题：

1. 检查控制台错误信息
2. 验证JSON格式正确性
3. 确认Firebase权限设置
4. 查看导入日志
5. 联系技术支持团队 