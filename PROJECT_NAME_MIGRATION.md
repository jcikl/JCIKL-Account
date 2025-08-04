# 银行交易记录项目名称存储功能

## 概述

本功能为银行交易记录添加了项目名称字段，使系统能够同时存储项目ID和项目名称，提高用户体验和搜索效率。

## 功能特性

### 1. 数据结构更新

- **Transaction接口**：添加了`projectName`字段
- **自动提取**：从项目ID中自动提取项目名称
- **向后兼容**：保持与现有数据的兼容性

### 2. 项目名称提取逻辑

```typescript
// 从项目ID中提取项目名称
const extractProjectName = (projectId: string): string => {
  const parts = projectId.split('_')
  if (parts.length >= 3) {
    return parts.slice(2).join('_') // 项目名称是第三部分开始
  } else if (parts.length >= 2) {
    return projectId // 如果没有项目名称部分，使用整个ID
  }
  return projectId
}
```

**示例**：
- `2025_P_项目A` → `项目A`
- `2024_HT_财务项目B` → `财务项目B`
- `2025_EVP_执行副主席项目C` → `执行副主席项目C`

### 3. 功能实现

#### 3.1 表单提交
- **新建交易**：自动提取并存储项目名称
- **编辑交易**：更新项目名称
- **批量编辑**：批量更新项目名称

#### 3.2 显示优化
- **表格显示**：优先显示项目名称，回退到项目ID
- **搜索功能**：支持按项目名称搜索
- **筛选功能**：保持现有的BOD分组功能

#### 3.3 数据导入
- **CSV导入**：自动为导入的交易添加项目名称
- **批量处理**：支持大量数据的项目名称提取

## 使用方法

### 1. 新交易创建

当创建新交易时，系统会自动：
1. 保存项目ID到`projectid`字段
2. 提取项目名称到`projectName`字段
3. 在表格中显示项目名称

### 2. 现有数据迁移

使用提供的迁移脚本为现有数据添加项目名称：

```bash
# 1. 配置Firebase连接信息
# 编辑 scripts/migrate-project-names.js 中的 firebaseConfig

# 2. 运行迁移脚本
node scripts/migrate-project-names.js
```

### 3. 搜索和筛选

- **搜索**：可以按项目名称搜索交易
- **筛选**：项目户口筛选下拉框显示项目名称
- **BOD分组**：保持按BOD分类的分组显示

## 技术实现

### 1. 数据模型

```typescript
export interface Transaction {
  id?: string
  date: string | { seconds: number; nanoseconds: number }
  description: string
  description2?: string
  expense: number
  income: number
  status: "Completed" | "Pending" | "Draft"
  projectid?: string        // 项目ID
  projectName?: string      // 项目名称（新增）
  category?: string
  sequenceNumber?: number
  createdByUid: string
}
```

### 2. 核心函数

#### 项目名称提取
```typescript
const extractProjectName = (projectId: string): string => {
  const parts = projectId.split('_')
  if (parts.length >= 3) {
    return parts.slice(2).join('_')
  } else if (parts.length >= 2) {
    return projectId
  }
  return projectId
}
```

#### 表单数据处理
```typescript
// 在表单提交时自动设置项目名称
if (formData.projectid && formData.projectid !== "none" && formData.projectid.trim()) {
  transactionData.projectid = formData.projectid
  transactionData.projectName = extractProjectName(formData.projectid)
}
```

### 3. 显示逻辑

```typescript
// 表格显示：优先显示项目名称
<TableCell>{transaction.projectName || transaction.projectid || "-"}</TableCell>

// 搜索功能：支持项目名称搜索
filtered = filtered.filter(transaction =>
  // ... 其他搜索条件
  (transaction.projectName && transaction.projectName.toLowerCase().includes(searchTerm.toLowerCase())) ||
  // ... 其他搜索条件
)
```

## 迁移脚本

### 脚本功能

`scripts/migrate-project-names.js` 提供以下功能：

1. **数据检查**：识别需要添加项目名称的交易
2. **批量更新**：为现有交易添加项目名称
3. **进度显示**：实时显示迁移进度
4. **结果统计**：提供详细的迁移统计信息

### 使用方法

1. **配置Firebase**：
   ```javascript
   const firebaseConfig = {
     apiKey: "your-api-key",
     authDomain: "your-project.firebaseapp.com",
     projectId: "your-project-id",
     storageBucket: "your-project.appspot.com",
     messagingSenderId: "123456789",
     appId: "your-app-id"
   }
   ```

2. **运行脚本**：
   ```bash
   node scripts/migrate-project-names.js
   ```

3. **查看结果**：
   - 脚本会显示迁移进度
   - 提供详细的统计信息
   - 显示迁移后的示例数据

## 优势

### 1. 用户体验
- **更直观**：显示项目名称而不是项目ID
- **更易搜索**：支持按项目名称搜索
- **更易理解**：用户可以直接看到项目名称

### 2. 系统性能
- **减少解析**：避免每次显示时解析项目ID
- **提高搜索效率**：直接搜索项目名称
- **数据完整性**：确保项目名称的一致性

### 3. 维护性
- **向后兼容**：不影响现有功能
- **数据一致性**：统一的项目名称格式
- **易于扩展**：为未来功能扩展提供基础

## 注意事项

1. **数据备份**：运行迁移脚本前请备份Firebase数据
2. **测试环境**：建议先在测试环境验证迁移脚本
3. **权限检查**：确保有足够的Firebase写入权限
4. **网络稳定**：迁移过程中保持网络连接稳定

## 未来扩展

1. **项目名称编辑**：允许用户手动编辑项目名称
2. **项目名称验证**：确保项目名称的唯一性和有效性
3. **多语言支持**：支持多语言项目名称
4. **项目名称历史**：记录项目名称的变更历史 