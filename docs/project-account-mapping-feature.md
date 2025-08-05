# 项目户口分类功能说明

## 功能概述

在银行交易编辑对话框中，项目户口下拉功能现在支持两种类型的选项：

1. **账号户口**：按账户类别分类显示
2. **项目户口**：按BOD分类进行二次分类显示

## 分类结构

### 账号户口分类
```
账号户口
├── Asset (资产)
│   ├── 1000 - 现金
│   ├── 1100 - 银行存款
│   └── 1200 - 应收账款
├── Liability (负债)
│   ├── 2000 - 应付账款
│   └── 2100 - 预收款项
├── Equity (权益)
│   ├── 3000 - 实收资本
│   └── 3100 - 未分配利润
├── Revenue (收入)
│   ├── 4000 - 主营业务收入
│   └── 4100 - 其他收入
└── Expense (支出)
    ├── 5000 - 主营业务成本
    └── 5100 - 管理费用
```

### 项目户口分类
```
项目户口
├── President (主席)
│   ├── 2024_P_项目A
│   └── 2024_P_项目B
├── GLC (政府关联公司)
│   ├── 2024_GLC_项目C
│   └── 2024_GLC_项目D
├── Secretary (秘书)
│   ├── 2024_S_项目E
│   └── 2024_S_项目F
└── Treasurer (财务)
    ├── 2024_T_项目G
    └── 2024_T_项目H
```

## 技术实现

### 1. 数据识别逻辑
- **账户户口**：通过 `accounts.find(a => a.code === value)` 识别
- **项目户口**：通过 `projects.find(p => p.projectid === value)` 识别

### 2. 分类显示逻辑
```typescript
// 账号户口分类
const accountGroups: Record<string, Account[]> = {}
accounts.forEach(account => {
  const type = account.type
  if (!accountGroups[type]) {
    accountGroups[type] = []
  }
  accountGroups[type].push(account)
})

// 项目户口分类
const projectGroups = getGroupedProjects(filteredProjects)
```

### 3. 表单处理逻辑
```typescript
onValueChange={(value) => {
  // 检查是否是账户户口
  const selectedAccount = accounts.find(a => a.code === value)
  if (selectedAccount) {
    setFormData(prev => ({ 
      ...prev, 
      projectid: value,
      projectName: selectedAccount.name
    }))
  } else {
    // 检查是否是项目户口
    const selectedProject = projects.find(p => p.projectid === value)
    setFormData(prev => ({ 
      ...prev, 
      projectid: value,
      projectName: selectedProject?.name || ""
    }))
  }
}}
```

## 使用场景

### 1. 财务报表映射
- 选择账户户口可以正确映射到财务报表的相应科目
- 便于生成准确的财务报表

### 2. 项目成本核算
- 选择项目户口可以追踪特定项目的收入和支出
- 支持项目级别的成本核算和预算管理

### 3. 数据一致性
- 统一的分类标准确保数据的一致性和可追溯性
- 便于后续的数据分析和报表生成

## 测试验证

### 1. 功能测试
- 访问 `/test-bank-transactions-multi-account-advanced` 页面
- 点击"新增交易"或编辑现有交易
- 验证项目户口下拉框的分类显示

### 2. 数据测试
- 运行 `node scripts/test-account-project-mapping.js` 脚本
- 验证账户和项目数据的分类是否正确

### 3. 集成测试
- 测试选择不同类型的户口后保存交易
- 验证数据在数据库中的存储格式
- 确认报表生成时的数据映射正确

## 注意事项

1. **数据格式**：账户户口使用 `code` 字段，项目户口使用 `projectid` 字段
2. **显示格式**：账户户口显示为 "代码 - 名称"，项目户口显示为 "项目名称"
3. **年份筛选**：项目户口支持按年份筛选，账户户口不受年份影响
4. **数据验证**：确保选择的户口在系统中存在且有效

## 后续优化

1. **搜索功能**：为下拉框添加搜索功能，便于快速定位
2. **最近使用**：显示最近使用的户口选项
3. **批量操作**：支持批量设置户口
4. **数据导入**：支持从Excel导入户口映射关系 