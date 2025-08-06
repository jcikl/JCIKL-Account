# 银行交易多账户高级组件 - 批量设定功能实现

## 🎯 功能概述

为银行交易多账户高级组件添加了批量设定功能，用户可以选择多笔交易进行批量编辑，包括设置付款人、项目户口和收支分类。

## ✅ 实现的功能

### 1. 批量操作状态管理
- ✅ 添加批量编辑对话框状态管理
- ✅ 添加批量表单数据状态管理
- ✅ 添加项目年份筛选状态管理

### 2. 批量更新功能
- ✅ 实现批量更新交易记录的核心逻辑
- ✅ 支持付款人、项目户口、收支分类的批量设置
- ✅ 支持"保持不变"和"清空"选项
- ✅ 完整的错误处理和用户反馈

### 3. 项目年份筛选
- ✅ 在批量编辑对话框中添加项目年份筛选
- ✅ 支持按年份筛选项目户口选项
- ✅ 年份按降序排列（最新年份在前）

### 4. 用户界面优化
- ✅ 在批量操作工具栏中添加"批量设定"按钮
- ✅ 完整的批量编辑对话框界面
- ✅ 支持账号户口和项目户口的分类显示
- ✅ 直观的操作反馈和状态重置

## 📁 修改的文件

### 主要实现文件
- `components/modules/bank-transactions-multi-account-advanced.tsx` - 主要功能实现

### 新增文件
- `app/test-bank-transactions-multi-account-advanced-batch-edit/page.tsx` - 测试页面
- `docs/bank-transactions-multi-account-advanced-batch-edit-feature.md` - 本文档

## 🔧 技术实现细节

### 状态管理
```typescript
const [isBatchEditOpen, setIsBatchEditOpen] = React.useState(false)
const [batchFormData, setBatchFormData] = React.useState({
  payer: "none",
  projectid: "none",
  category: "none"
})
const [batchProjectYearFilter, setBatchProjectYearFilter] = React.useState("all")
```

### 批量更新逻辑
```typescript
const handleBatchUpdate = async () => {
  if (!currentUser || selectedTransactions.size === 0) return

  const updateData: any = {}
  
  if (batchFormData.payer !== "none") {
    updateData.payer = batchFormData.payer === "empty" ? "" : batchFormData.payer
  }
  if (batchFormData.projectid !== "none") {
    if (batchFormData.projectid === "empty") {
      updateData.projectid = ""
      updateData.projectName = ""
    } else {
      updateData.projectid = batchFormData.projectid
      // 确定项目名称
      const selectedAccount = accounts.find(a => a.code === batchFormData.projectid)
      if (selectedAccount) {
        updateData.projectName = selectedAccount.name
      } else {
        const selectedProject = projects.find(p => p.projectid === batchFormData.projectid)
        updateData.projectName = selectedProject?.name || ""
      }
    }
  }
  if (batchFormData.category !== "none") {
    updateData.category = batchFormData.category === "empty" ? "" : batchFormData.category
  }

  // 执行批量更新
  for (const transactionId of selectedTransactions) {
    await updateDocument("transactions", transactionId, updateData)
  }
}
```

### 项目筛选逻辑
```typescript
const getFilteredProjectsForBatchEdit = () => {
  let filteredProjects = projects
  
  if (batchProjectYearFilter !== "all") {
    filteredProjects = projects.filter(project => {
      const projectYear = project.projectid.split('_')[0]
      return projectYear === batchProjectYearFilter
    })
  }
  
  // 按项目代码排序
  return filteredProjects.sort((a, b) => {
    // 首先按年份排序（降序）
    const yearA = a.projectid.split('_')[0]
    const yearB = b.projectid.split('_')[0]
    if (yearA !== yearB) {
      return parseInt(yearB) - parseInt(yearA)
    }
    
    // 然后按项目代码排序（升序）
    return a.projectid.localeCompare(b.projectid)
  })
}
```

## 🎨 用户界面特性

### 批量操作工具栏
- 显示已选择的交易数量
- "批量设定"按钮（新增）
- "批量删除"按钮
- "取消选择"按钮

### 批量编辑对话框
- 项目年份筛选下拉框
- 付款人输入框
- 项目户口选择（支持账号户口和项目户口分类）
- 收支分类选择
- 操作按钮（取消/批量更新）

### 项目户口分类显示
- 账号户口按类型分组
- 项目户口按BOD分类分组
- 支持"保持不变"和"清空"选项

## 🚀 使用方法

1. **选择交易**：在交易表格中勾选要批量编辑的交易
2. **打开批量设定**：点击"批量设定"按钮
3. **设置筛选**：可选择项目年份进行筛选
4. **编辑字段**：
   - 付款人：直接输入或留空
   - 项目户口：选择账号户口或项目户口
   - 收支分类：选择分类或清空
5. **执行更新**：点击"批量更新"按钮

## 🔍 测试页面

访问 `/test-bank-transactions-multi-account-advanced-batch-edit` 页面可以测试完整的批量设定功能。

## 📝 注意事项

1. **权限控制**：批量设定功能需要相应的用户权限
2. **数据验证**：确保至少选择一个字段进行更新
3. **状态重置**：操作完成后自动重置所有状态
4. **错误处理**：完整的错误处理和用户反馈机制
5. **性能优化**：批量操作使用循环更新，避免一次性大量数据操作

## 🎉 总结

成功为银行交易多账户高级组件添加了完整的批量设定功能，提供了与基础银行交易组件相同的批量编辑能力，同时保持了高级组件的所有特性和优化。
