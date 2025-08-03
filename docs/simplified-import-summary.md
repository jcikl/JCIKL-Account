# 简化导入功能总结

## 概述
根据用户要求，将账户图表导入功能简化为只导入以下字段：
- 账户代码 (code)
- 账户类型 (type) 
- 账户名称 (name)
- 财务报表分类 (financialStatement)

不再导入以下字段：
- 余额 (balance)
- 描述 (description)
- 父账户 (parent)

## 修改的文件

### 1. `components/modules/import-dialog.tsx`

#### ParsedAccount 接口更新
```typescript
interface ParsedAccount {
  code: string
  name: string
  type: "Asset" | "Liability" | "Equity" | "Revenue" | "Expense"
  financialStatement: string  // 改为必需字段
  isValid: boolean
  errors: string[]
}
```

#### 解析逻辑更新
- 移除了余额验证逻辑
- 移除了描述和父账户字段处理
- 只解析前4个字段：`[code, type, name, financialStatement]`
- 财务报表分类字段现在是必需的

#### UI 更新
- 更新了占位符文本：`"粘贴您的账户数据，格式：账户代码,账户类型,账户名称,财务报表分类"`
- 更新了格式说明：`"支持格式：代码,类型,名称,财务报表分类"`
- 更新了示例：`"示例：1001,Asset,现金,资产负债表"`
- 移除了预览中的余额显示

### 2. `components/modules/account-chart.tsx`

#### AccountChartProps 接口更新
```typescript
onAccountsImport?: (accounts: Array<{
  code: string
  name: string
  type: "Asset" | "Liability" | "Equity" | "Revenue" | "Expense"
  financialStatement: string  // 改为必需字段
}>) => void
```

#### handleImport 函数更新
- 更新了参数类型以匹配新的 ParsedAccount 格式
- 移除了余额、描述、父账户字段

## 新的数据格式

### 输入格式
```
账户代码,账户类型,账户名称,财务报表分类
1001,Asset,现金,资产负债表
1002,Asset,银行存款,资产负债表
2001,Liability,应付账款,资产负债表
3001,Equity,实收资本,资产负债表
4001,Revenue,主营业务收入,利润表
5001,Expense,管理费用,利润表
```

### 验证规则
1. **字段数量**：必须至少有4个字段
2. **账户代码**：不能为空，不能超过10个字符
3. **账户名称**：不能为空，不能超过100个字符
4. **账户类型**：必须是 "Asset", "Liability", "Equity", "Revenue", "Expense" 之一
5. **财务报表分类**：不能为空

## 测试验证

创建了 `scripts/test-simplified-import.js` 来验证新格式：

### 测试结果
- ✅ 正确解析4个必需字段
- ✅ 验证所有字段的有效性
- ✅ 不包含余额、描述、父账户字段
- ✅ 正确处理错误情况（字段不足、无效类型等）

### 测试输出示例
```
账户 1:
  代码: 1001
  类型: Asset
  名称: 现金
  财务报表: 资产负债表
  有效: 是
```

## 优势

1. **简化数据输入**：用户只需要提供核心的账户信息
2. **减少错误**：减少了需要验证的字段数量
3. **提高效率**：导入过程更快，数据更简洁
4. **专注核心**：只关注账户的基本分类信息

## 兼容性

- 新格式与现有的账户数据结构兼容
- 导入的账户会自动设置默认值（如余额为0）
- 不影响现有的导出功能

## 使用说明

1. 准备数据文件，格式为：`代码,类型,名称,财务报表分类`
2. 在账户图表页面点击"导入"按钮
3. 粘贴或输入数据
4. 选择数据格式（CSV/TSV/Excel）
5. 预览解析结果
6. 确认导入

## 注意事项

- 财务报表分类字段现在是必需的
- 不再支持导入余额、描述、父账户信息
- 如果需要这些信息，可以在导入后手动编辑账户 