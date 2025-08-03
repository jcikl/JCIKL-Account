# 账户图表粘贴导入功能文档

## 📊 功能概述

账户图表粘贴导入功能允许用户通过剪贴板快速导入大量账户数据，支持多种数据格式，提供实时验证和错误提示，大大提高了账户数据录入的效率。

## 🎯 主要特性

### 1. 多格式支持
- **CSV格式**: 逗号分隔值文件，最常用的数据交换格式
- **TSV格式**: 制表符分隔值文件，适合从Excel复制粘贴
- **Excel格式**: 支持从Excel表格复制的CSV格式数据

### 2. 智能数据解析
- 自动识别数据格式和分隔符
- 支持跳过标题行
- 智能处理引号和特殊字符
- 自动清理空白字符

### 3. 实时数据验证
- 账户代码格式验证（必填，最多10个字符）
- 账户名称验证（必填，最多100个字符）
- 账户类型验证（Asset/Liability/Equity/Revenue/Expense）
- 余额格式验证（数字格式）
- 重复账户代码检测

### 4. 用户友好的界面
- 一键从剪贴板粘贴数据
- 实时解析结果预览
- 有效和无效账户分类显示
- 详细的错误信息提示
- 导入进度和结果反馈

## 🔧 技术实现

### 组件结构

#### ImportDialog组件
```tsx
interface ImportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  existingAccounts: Account[]
  onImport: (accounts: ParsedAccount[]) => void
}
```

#### 数据解析接口
```tsx
interface ParsedAccount {
  code: string
  name: string
  type: "Asset" | "Liability" | "Equity" | "Revenue" | "Expense"
  balance: number
  description?: string
  parent?: string
  isValid: boolean
  errors: string[]
}
```

### 核心功能模块

#### 1. 数据解析引擎
```typescript
const parseData = (data: string, format: string, skipHeader: boolean) => {
  const lines = data.trim().split('\n')
  const dataLines = skipHeader ? lines.slice(1) : lines
  
  return dataLines.map(line => {
    const fields = parseFields(line, format)
    return createAccountFromFields(fields)
  })
}
```

#### 2. 数据验证器
```typescript
const validateAccount = (account: ParsedAccount, existingAccounts: Account[]) => {
  const errors: string[] = []
  
  // 验证账户代码
  if (!account.code || account.code.length === 0) {
    errors.push("账户代码不能为空")
  } else if (account.code.length > 10) {
    errors.push("账户代码不能超过10个字符")
  }
  
  // 验证账户名称
  if (!account.name || account.name.length === 0) {
    errors.push("账户名称不能为空")
  } else if (account.name.length > 100) {
    errors.push("账户名称不能超过100个字符")
  }
  
  // 验证账户类型
  const validTypes = ["Asset", "Liability", "Equity", "Revenue", "Expense"]
  if (!account.type || !validTypes.includes(account.type)) {
    errors.push(`账户类型必须是以下之一: ${validTypes.join(', ')}`)
  }
  
  // 检查重复账户
  const existingAccount = existingAccounts.find(acc => acc.code === account.code)
  if (existingAccount && !updateExisting) {
    errors.push("账户代码已存在")
  }
  
  return {
    ...account,
    isValid: errors.length === 0,
    errors
  }
}
```

#### 3. 剪贴板访问
```typescript
const handlePaste = async () => {
  try {
    const text = await navigator.clipboard.readText()
    form.setValue("data", text)
  } catch (error) {
    console.error("无法访问剪贴板:", error)
    alert("请手动粘贴数据到文本框中")
  }
}
```

## 📋 使用指南

### 导入操作流程

1. **打开导入对话框**
   - 点击账户图表工具栏中的"导入"按钮
   - 或使用快捷键 Ctrl+V (在支持的情况下)

2. **选择数据格式**
   - CSV: 逗号分隔的数据
   - TSV: 制表符分隔的数据
   - Excel: 从Excel复制的CSV格式数据

3. **配置导入选项**
   - **跳过标题行**: 如果数据包含标题行，请勾选
   - **更新现有账户**: 如果账户代码已存在，是否更新
   - **验证数据**: 导入前验证数据格式和有效性

4. **粘贴数据**
   - 点击"从剪贴板粘贴"按钮自动获取数据
   - 或手动在文本框中粘贴数据

5. **查看解析结果**
   - 系统会实时解析和验证数据
   - 查看有效账户和无效账户的预览
   - 检查错误信息并修正数据

6. **执行导入**
   - 确认有效账户后点击"导入"按钮
   - 系统会导入所有有效的账户数据

### 数据格式要求

#### 标准格式
```
账户代码,账户名称,账户类型,余额,描述,父账户
1001,现金,Asset,15000,公司现金账户,
2001,应付账款,Liability,-18000,供应商欠款,
3001,实收资本,Equity,100000,股东投资,
```

#### 字段说明
| 字段 | 类型 | 必填 | 长度限制 | 说明 |
|------|------|------|----------|------|
| 账户代码 | 字符串 | 是 | 最多10个字符 | 唯一的账户标识 |
| 账户名称 | 字符串 | 是 | 最多100个字符 | 账户的显示名称 |
| 账户类型 | 枚举 | 是 | - | Asset/Liability/Equity/Revenue/Expense |
| 余额 | 数字 | 否 | - | 账户的初始余额 |
| 描述 | 字符串 | 否 | - | 账户的详细说明 |
| 父账户 | 字符串 | 否 | - | 父账户的代码 |

#### 支持的账户类型
- **Asset**: 资产类账户
- **Liability**: 负债类账户
- **Equity**: 权益类账户
- **Revenue**: 收入类账户
- **Expense**: 费用类账户

### 数据验证规则

#### 账户代码验证
- 不能为空
- 长度不能超过10个字符
- 不能与现有账户代码重复（除非选择更新现有账户）

#### 账户名称验证
- 不能为空
- 长度不能超过100个字符

#### 账户类型验证
- 必须是预定义的类型之一
- 不区分大小写

#### 余额验证
- 必须是有效的数字格式
- 支持负数（负债和费用类账户）
- 自动清理货币符号和千分位分隔符

## 🚀 高级功能

### 1. 批量导入优化
- 支持一次性导入大量账户数据
- 智能分批处理，避免界面卡顿
- 实时显示导入进度

### 2. 错误处理机制
- 详细的错误信息提示
- 支持部分导入（只导入有效数据）
- 错误数据的详细报告

### 3. 数据预览功能
- 导入前预览所有账户数据
- 分类显示有效和无效账户
- 支持编辑和修正数据

### 4. 导入选项配置
- 灵活的导入选项设置
- 支持不同的数据格式
- 可配置的验证规则

## 📝 最佳实践

### 数据准备
1. **数据格式标准化**: 确保数据格式符合要求
2. **账户代码唯一性**: 检查账户代码是否重复
3. **数据类型正确性**: 确保账户类型和余额格式正确
4. **数据完整性**: 填写必要的字段信息

### 导入操作
1. **先验证后导入**: 使用预览功能检查数据
2. **分批导入**: 大量数据建议分批导入
3. **备份现有数据**: 导入前备份现有账户数据
4. **测试导入**: 先在测试环境中验证导入功能

### 错误处理
1. **查看错误信息**: 仔细阅读错误提示
2. **修正数据格式**: 根据错误信息修正数据
3. **重新验证**: 修正后重新验证数据
4. **联系支持**: 遇到技术问题及时联系支持

## 🔍 故障排除

### 常见问题

#### 1. 剪贴板访问失败
**问题**: 无法从剪贴板读取数据
**解决方案**: 
- 检查浏览器权限设置
- 手动粘贴数据到文本框
- 使用支持剪贴板API的现代浏览器

#### 2. 数据解析错误
**问题**: 数据格式无法正确解析
**解决方案**:
- 检查数据分隔符是否正确
- 确认是否选择了正确的数据格式
- 检查数据中是否包含特殊字符

#### 3. 验证失败
**问题**: 大量账户验证失败
**解决方案**:
- 检查账户代码是否重复
- 确认账户类型是否正确
- 验证必填字段是否完整

#### 4. 导入失败
**问题**: 导入过程中出现错误
**解决方案**:
- 检查网络连接
- 确认数据库权限
- 查看错误日志获取详细信息

### 性能优化建议

1. **数据量控制**: 单次导入建议不超过1000个账户
2. **网络优化**: 确保网络连接稳定
3. **浏览器选择**: 使用现代浏览器获得最佳性能
4. **内存管理**: 大量数据导入时关闭其他应用程序

## 🔗 相关功能

### 导出功能
- 支持导出账户数据为CSV、Excel、PDF格式
- 导出的数据可以直接用于其他系统的导入

### 账户管理
- 支持账户的增删改查操作
- 提供账户层级结构管理
- 支持账户余额调整

### 数据同步
- 支持与外部系统的数据同步
- 提供数据导入导出的API接口
- 支持定时数据同步任务

## 📞 技术支持

如果您在使用粘贴导入功能时遇到问题，请：

1. **查看文档**: 仔细阅读本文档的相关章节
2. **检查日志**: 查看浏览器控制台的错误信息
3. **联系支持**: 通过以下方式获取技术支持：
   - 邮箱: support@example.com
   - 电话: 400-123-4567
   - 在线客服: 工作日 9:00-18:00

## 📈 功能更新

### 版本历史
- **v1.0.0**: 基础粘贴导入功能
- **v1.1.0**: 增加TSV格式支持
- **v1.2.0**: 优化数据验证和错误提示
- **v1.3.0**: 增加批量导入和进度显示

### 计划功能
- 支持更多数据格式（JSON、XML等）
- 增加数据模板功能
- 支持拖拽文件导入
- 增加数据转换和映射功能 