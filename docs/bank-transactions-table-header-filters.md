# 银行交易记录表格标题行筛选功能

## 📋 功能概述

根据用户要求，将银行交易记录页面的筛选功能从独立的筛选卡片改为在表格标题行进行筛选，提供更直观和便捷的筛选体验。

## 🔄 主要修改

### 1. 移除独立筛选卡片
- 移除了原有的筛选卡片，包含搜索框、状态筛选、日期范围筛选、收支分类筛选和项目账户分类筛选
- 简化了页面布局，减少了视觉干扰

### 2. 新增表格标题行筛选状态
```typescript
// 新增表格标题行筛选状态
const [tableDateFilter, setTableDateFilter] = React.useState("")
const [descriptionFilter, setDescriptionFilter] = React.useState("")
const [description2Filter, setDescription2Filter] = React.useState("")
const [expenseFilter, setExpenseFilter] = React.useState("")
const [incomeFilter, setIncomeFilter] = React.useState("")
const [balanceFilter, setBalanceFilter] = React.useState("")
const [tableStatusFilter, setTableStatusFilter] = React.useState("all")
const [referenceFilter, setReferenceFilter] = React.useState("")
const [categoryFilter, setCategoryFilter] = React.useState("")
const [tableProjectCategoryFilter, setTableProjectCategoryFilter] = React.useState("all")
```

### 3. 修改表格标题行结构
每个表格列标题现在包含：
- 列标题文字
- 对应的筛选输入框或下拉选择

```typescript
<TableHead>
  <div className="space-y-2">
    <div className="font-medium">日期</div>
    <Input
      placeholder="筛选日期..."
      value={tableDateFilter}
      onChange={(e) => setTableDateFilter(e.target.value)}
      className="h-6 text-xs"
    />
  </div>
</TableHead>
```

### 4. 更新筛选逻辑
修改了 `useEffect` 中的筛选逻辑，支持所有表格标题行的筛选条件：

```typescript
// 表格标题行筛选
if (tableDateFilter) {
  filtered = filtered.filter(transaction => {
    const transactionDate = typeof transaction.date === 'string' 
      ? new Date(transaction.date) 
      : new Date(transaction.date.seconds * 1000)
    const formattedDate = transactionDate.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    })
    return formattedDate.toLowerCase().includes(tableDateFilter.toLowerCase())
  })
}

if (descriptionFilter) {
  filtered = filtered.filter(transaction => 
    transaction.description.toLowerCase().includes(descriptionFilter.toLowerCase())
  )
}

// ... 其他筛选逻辑
```

### 5. 添加搜索框
在视图模式切换按钮旁边添加了搜索框，保持全局搜索功能：

```typescript
<div className="flex items-center justify-between">
  <div className="flex items-center gap-4">
    <div className="relative">
      <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
      <Input
        placeholder="搜索描述、项目或分类..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="pl-8 w-64"
      />
    </div>
  </div>
  {/* 视图模式切换按钮 */}
</div>
```

## 📊 筛选功能详情

### 支持的筛选列
1. **日期** - 输入框筛选，支持日期格式匹配
2. **描述** - 输入框筛选，支持文本匹配
3. **描述2** - 输入框筛选，支持文本匹配
4. **支出金额** - 输入框筛选，支持数字匹配
5. **收入金额** - 输入框筛选，支持数字匹配
6. **户口余额** - 输入框筛选，支持金额格式匹配
7. **状态** - 下拉选择，支持"所有状态"、"已完成"、"待处理"、"草稿"
8. **项目户口** - 输入框筛选，支持文本匹配
9. **收支分类** - 输入框筛选，支持文本匹配
10. **项目账户分类** - 下拉选择，支持所有项目账户分类

### 筛选特性
- **实时筛选** - 输入时立即生效
- **多条件组合** - 支持同时使用多个筛选条件
- **大小写不敏感** - 文本筛选忽略大小写
- **部分匹配** - 支持部分文本匹配
- **格式兼容** - 日期筛选支持格式化后的日期显示

## 🎯 用户体验改进

### 优势
1. **更直观** - 筛选条件直接显示在对应的列标题下
2. **更便捷** - 无需滚动到筛选卡片，直接在表格中操作
3. **更清晰** - 每个筛选条件对应具体的列，逻辑更清晰
4. **更高效** - 减少了页面元素，提升了操作效率

### 界面优化
- 筛选输入框使用小尺寸（`h-6 text-xs`），不影响表格整体布局
- 保持表格标题的字体样式（`font-medium`）
- 搜索框与视图模式切换按钮合理布局

## 🔧 技术实现

### 状态管理
- 为每个筛选列创建独立的状态变量
- 使用 `useEffect` 监听所有筛选状态的变化
- 支持筛选条件的组合应用

### 筛选逻辑
- 支持字符串和数字的模糊匹配
- 日期筛选基于格式化后的显示文本
- 状态筛选使用精确匹配
- 项目账户分类使用下拉选择

### 性能优化
- 筛选逻辑在 `useEffect` 中统一处理
- 避免重复的筛选计算
- 支持大量数据的快速筛选

## 📝 测试验证

运行测试脚本 `scripts/test-table-header-filters.js` 验证：

1. ✅ 日期筛选功能正常
2. ✅ 描述筛选功能正常
3. ✅ 金额筛选功能正常
4. ✅ 状态筛选功能正常
5. ✅ 项目户口筛选功能正常
6. ✅ 收支分类筛选功能正常
7. ✅ 多条件组合筛选功能正常
8. ✅ 筛选状态管理正确

## 🎉 总结

表格标题行筛选功能的实现成功地将筛选功能从独立的卡片集成到了表格标题行中，提供了更加直观和便捷的用户体验。用户现在可以直接在表格中看到和操作筛选条件，大大提升了数据筛选的效率和用户体验。 