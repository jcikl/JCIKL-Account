# 银行交易记录格式支持

## 📋 概述

根据您提供的银行交易记录参考，我们已经更新了银行交易导入功能，以支持多种银行记录格式，包括您提供的实际银行交易记录格式。

## 🎯 支持的日期格式

### 1. 标准格式
- **yyyy-mm-dd** - ISO标准格式 (如: 2025-02-05)
- **yyyy/mm/dd** - 斜杠分隔格式 (如: 2025/02/05)
- **dd/mm/yyyy** - 欧洲日期格式 (如: 05/02/2025)
- **mm/dd/yyyy** - 美国日期格式 (如: 02/05/2025)

### 2. 银行记录格式
- **DD Mon YYYY** - 银行记录格式 (如: 5 Feb 2025)

## 📊 支持的银行记录列结构

基于您提供的银行交易记录，我们支持以下列结构：

| 列名 | 描述 | 示例 |
|------|------|------|
| DATE | 交易日期 | "5 Feb 2025" |
| Description 1 | 主要描述 | "iab jcikl tan kok yoTAN KOK YONG *Sent from Amon" |
| Description 2 | 次要描述 | "ss" 或空 |
| DEBIT | 借方金额 | "21270" 或空 |
| CREDIT | 贷方金额 | "168.00" 或空 |
| Balance | 账户余额 | "30,036.21" |
| NAME 1 | 交易方姓名 | "TAN KOK YONG" |
| DESCRIPTION | 详细描述 | "2025 JCI KL IAB_Ticketing (Member)" |
| Project | 项目名称 | "2025 EVP_JCI KL IAB" |
| Cat | 分类 | "2025 Project" |
| Type of Fund | 资金类型 | "Incomes" |

## 🔄 数据转换逻辑

### 日期转换
```typescript
// 支持 "DD Mon YYYY" 格式转换
// 输入: "5 Feb 2025"
// 输出: "2025-02-05"
```

### 金额处理
```typescript
// 借方金额 -> 支出金额 (expense)
// 贷方金额 -> 收入金额 (income)
// 净额 = 收入 - 支出
```

### 字段映射
```typescript
// 银行记录字段 -> 系统字段
// Description 1 -> description
// Description 2 -> description2 (可选)
// NAME 1 -> reference (可选)
// Cat -> category (可选)
```

## 📝 使用指南

### 1. 粘贴导入银行记录
1. 打开银行交易页面
2. 点击"粘贴导入"按钮
3. 复制银行记录数据并粘贴
4. 系统会自动识别日期格式并转换
5. 确认导入后，数据将以标准格式存储到Firebase

### 2. 支持的数据格式示例

#### 标准CSV格式
```
日期,描述,描述2,支出金额,收入金额,状态,参考,分类
2025-02-05,办公室用品,办公用品,245.00,0.00,Completed,INV-001,办公用品
```

#### 银行记录格式
```
DATE,Description 1,Description 2,DEBIT,CREDIT,Balance,NAME 1,DESCRIPTION,Project,Cat,Type of Fund
5 Feb 2025,iab jcikl tan kok yoTAN KOK YONG *Sent from Amon,,,168.00,30036.21,TAN KOK YONG,2025 JCI KL IAB_Ticketing (Member),2025 EVP_JCI KL IAB,2025 Project,Incomes
```

## ✅ 功能特点

### 1. 智能日期识别
- 自动识别多种日期格式
- 统一转换为 yyyy-mm-dd 格式
- 支持银行记录特有的日期格式

### 2. 灵活的数据处理
- 支持不同列结构的银行记录
- 自动处理空值和undefined值
- 智能字段映射

### 3. 错误处理
- 无效日期使用当前日期作为默认值
- 空值自动过滤，不存储到Firebase
- 提供详细的错误提示

### 4. 数据一致性
- 所有日期都以统一格式存储
- 确保Firebase存储的数据格式正确
- 保持数据的完整性和准确性

## 🧪 测试验证

### 测试脚本
- `scripts/test-bank-record-format.js` - 银行记录格式测试
- `scripts/test-undefined-fix.js` - undefined值修复测试
- `scripts/test-date-format.js` - 日期格式处理测试

### 测试覆盖
- ✅ 银行记录日期格式 ("DD Mon YYYY")
- ✅ 多种标准日期格式
- ✅ 借方/贷方金额处理
- ✅ 空值和undefined值处理
- ✅ 字段映射和转换

## 🎉 完成状态

✅ **已完成**: 银行交易导入功能已更新，支持您提供的银行记录格式。

### 主要改进
1. **新增日期格式支持**: 支持 "DD Mon YYYY" 格式
2. **智能字段映射**: 自动识别银行记录字段并映射到系统字段
3. **undefined值修复**: 确保所有存储到Firebase的数据都是有效的
4. **多格式兼容**: 支持多种银行记录格式的导入
5. **数据完整性**: 确保导入数据的准确性和一致性

### 使用建议
- 可以直接复制银行记录表格数据并粘贴导入
- 系统会自动处理日期格式转换
- 空字段会被自动过滤，不会影响数据存储
- 所有数据都会以标准格式存储到Firebase 