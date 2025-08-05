# 第六阶段：高级功能扩展

## 概述

第六阶段实现了多银行账户交易管理的高级功能扩展，包括分页、排序、批量操作、导入导出、高级筛选和数据可视化等企业级功能。

## 实现内容

### 1. 新组件创建

#### `components/modules/bank-transactions-multi-account-advanced.tsx`
- **功能**: 高级功能多银行账户交易管理组件
- **主要特性**:
  - 银行账户选择器
  - 高级搜索和筛选功能
  - 分页显示和分页控件
  - 多字段排序功能
  - 批量选择和批量删除
  - CSV导出功能
  - 数据可视化框架
  - 响应式设计

### 2. 核心功能实现

#### 2.1 分页功能
```typescript
interface PaginationConfig {
  currentPage: number
  pageSize: number
  totalItems: number
}

// 分页状态管理
const [pagination, setPagination] = React.useState<PaginationConfig>({
  currentPage: 1,
  pageSize: 20,
  totalItems: 0
})

// 获取当前页的交易
const getCurrentPageTransactions = () => {
  const startIndex = (pagination.currentPage - 1) * pagination.pageSize
  const endIndex = startIndex + pagination.pageSize
  return filteredTransactions.slice(startIndex, endIndex)
}
```

#### 2.2 排序功能
```typescript
interface SortConfig {
  key: keyof Transaction
  direction: 'asc' | 'desc'
}

// 排序状态管理
const [sortConfig, setSortConfig] = React.useState<SortConfig>({
  key: 'date',
  direction: 'desc'
})

// 处理排序
const handleSort = (key: keyof Transaction) => {
  setSortConfig(prev => ({
    key,
    direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
  }))
}
```

#### 2.3 批量操作功能
```typescript
// 批量操作状态
const [selectedTransactions, setSelectedTransactions] = React.useState<Set<string>>(new Set())
const [isSelectAll, setIsSelectAll] = React.useState(false)

// 批量删除
const handleBatchDelete = async () => {
  if (selectedTransactions.size === 0) {
    toast({
      title: "提示",
      description: "请选择要删除的交易",
      variant: "destructive",
    })
    return
  }

  try {
    const deletePromises = Array.from(selectedTransactions).map(id => 
      deleteDocument('transactions', id)
    )
    await Promise.all(deletePromises)
    
    toast({
      title: "批量删除成功",
      description: `已删除 ${selectedTransactions.size} 笔交易`,
    })
    
    setSelectedTransactions(new Set())
    setIsSelectAll(false)
    await fetchTransactions(selectedBankAccountId)
  } catch (error) {
    console.error("Error batch deleting transactions:", error)
    toast({
      title: "批量删除失败",
      description: "无法删除选中的交易",
      variant: "destructive",
    })
  }
}
```

#### 2.4 高级筛选功能
```typescript
interface AdvancedFilters {
  dateRange: {
    start: string
    end: string
  }
  amountRange: {
    min: string
    max: string
  }
  status: string
  project: string
  category: string
}

// 高级筛选状态
const [advancedFilters, setAdvancedFilters] = React.useState<AdvancedFilters>({
  dateRange: { start: "", end: "" },
  amountRange: { min: "", max: "" },
  status: "all",
  project: "all",
  category: "all"
})
```

#### 2.5 导出功能
```typescript
// 导出功能
const handleExport = () => {
  const currentTransactions = getCurrentPageTransactions()
  const csvContent = generateCSV(currentTransactions)
  downloadCSV(csvContent, `transactions_${selectedBankAccountId}_${new Date().toISOString().split('T')[0]}.csv`)
  
  toast({
    title: "导出成功",
    description: `已导出 ${currentTransactions.length} 笔交易`,
  })
}

// 生成CSV内容
const generateCSV = (transactions: Transaction[]) => {
  const headers = ['日期', '描述', '描述2', '支出', '收入', '净额', '状态', '付款人', '项目', '分类']
  const rows = transactions.map(t => [
    formatDate(t.date),
    t.description,
    t.description2 || '',
    t.expense || 0,
    t.income || 0,
    (t.income || 0) - (t.expense || 0),
    t.status,
    t.payer || '',
    t.projectName || '',
    t.category || ''
  ])
  
  return [headers, ...rows].map(row => 
    row.map(cell => `"${cell}"`).join(',')
  ).join('\n')
}

// 下载CSV文件
const downloadCSV = (content: string, filename: string) => {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = filename
  link.click()
}
```

### 3. 用户界面特性

#### 3.1 银行账户选择器
- 下拉选择银行账户
- 切换账户时自动重置筛选和选择状态
- 显示账户名称

#### 3.2 高级筛选面板
- 搜索功能：支持按描述、付款人、项目、分类搜索
- 日期范围筛选：开始日期和结束日期
- 金额范围筛选：最小值和最大值
- 状态筛选：全部、已完成、待处理、草稿
- 项目筛选：按项目筛选
- 分类筛选：按分类筛选
- 清除筛选功能

#### 3.3 批量操作工具栏
- 显示已选择的交易数量
- 取消选择功能
- 批量删除功能
- 全选/取消全选功能

#### 3.4 交易表格
- 复选框选择功能
- 可排序的表头（日期、描述、状态）
- 排序指示器（升序/降序箭头）
- 分页显示
- 操作按钮（编辑、删除）

#### 3.5 分页控件
- 上一页/下一页按钮
- 页码按钮（最多显示5页）
- 每页显示数量选择器（10、20、50、100）
- 显示当前页信息和总记录数

#### 3.6 数据可视化框架
- 图表显示开关
- 月度趋势图表（开发中）
- 分类分布图表（开发中）
- 项目统计图表（开发中）

### 4. 测试页面

#### `app/test-bank-transactions-multi-account-advanced/page.tsx`
- **功能**: 测试高级功能多银行账户交易组件的页面
- **访问路径**: `/test-bank-transactions-multi-account-advanced`

## 技术特性

### 1. 状态管理
- 银行账户列表和选择状态
- 交易数据和筛选状态
- 分页配置状态
- 排序配置状态
- 批量选择状态
- 高级筛选状态
- 搜索状态
- 加载和错误状态

### 2. 数据处理
- 实时筛选和排序
- 分页计算
- CSV数据生成
- 日期格式化
- 金额计算和格式化

### 3. 用户体验
- 响应式设计
- 加载状态指示
- 错误处理和重试机制
- 空状态处理
- 批量操作确认
- 实时反馈

### 4. 权限控制
- 基于用户角色的功能访问控制
- 批量操作权限控制
- 导出功能权限控制

## 功能特性

### 1. 分页功能
- ✅ **分页显示**: 支持自定义每页显示数量
- ✅ **分页控件**: 上一页、下一页、页码导航
- ✅ **分页状态管理**: 当前页、总页数、总记录数
- ✅ **每页数量选择**: 10、20、50、100条记录

### 2. 排序功能
- ✅ **多字段排序**: 日期、描述、状态
- ✅ **升序降序切换**: 点击表头切换排序方向
- ✅ **排序指示器**: 显示当前排序状态
- ✅ **智能排序**: 支持字符串、数字、日期排序

### 3. 批量操作
- ✅ **批量选择**: 单个选择和全选功能
- ✅ **批量删除**: 批量删除选中的交易
- ✅ **选择状态管理**: 跟踪选中状态
- ✅ **操作确认**: 批量操作前的确认提示

### 4. 高级筛选
- ✅ **文本搜索**: 支持多字段搜索
- ✅ **日期范围筛选**: 开始日期和结束日期
- ✅ **金额范围筛选**: 最小值和最大值
- ✅ **状态筛选**: 按交易状态筛选
- ✅ **项目筛选**: 按项目筛选
- ✅ **分类筛选**: 按分类筛选
- ✅ **清除筛选**: 一键清除所有筛选条件

### 5. 导入导出功能
- ✅ **CSV导出**: 导出当前页交易数据
- ✅ **文件命名**: 自动生成带时间戳的文件名
- ✅ **数据格式化**: 正确的CSV格式
- ✅ **导出反馈**: 导出成功提示

### 6. 数据可视化框架
- ✅ **图表开关**: 显示/隐藏图表功能
- ✅ **图表容器**: 为图表预留空间
- ✅ **图表分类**: 月度趋势、分类分布、项目统计
- ⏳ **图表实现**: 图表功能开发中

## 测试建议

### 1. 功能测试
- 测试银行账户切换功能
- 测试搜索和高级筛选功能
- 测试分页功能（切换页面、改变每页数量）
- 测试排序功能（点击表头排序）
- 测试批量选择功能（单个选择、全选）
- 测试批量删除功能
- 测试导出功能
- 测试数据可视化开关

### 2. 用户体验测试
- 测试响应式布局
- 测试加载状态
- 测试错误处理
- 测试空状态显示
- 测试批量操作交互
- 测试分页控件交互

### 3. 性能测试
- 测试大量数据的分页性能
- 测试筛选和排序的性能
- 测试批量操作的性能
- 测试内存使用情况

### 4. 集成测试
- 测试与Firebase的集成
- 测试与权限系统的集成
- 测试与其他组件的集成

## 下一步计划

### 第七阶段：数据可视化完善
1. **图表库集成**
   - 集成Chart.js或Recharts
   - 实现月度趋势图表
   - 实现分类分布饼图
   - 实现项目统计柱状图

2. **实时数据更新**
   - 图表数据实时更新
   - 数据变化时的动画效果
   - 交互式图表功能

3. **高级分析功能**
   - 趋势分析
   - 对比分析
   - 预测分析

### 第八阶段：导入功能完善
1. **CSV导入功能**
   - 文件上传和解析
   - 数据验证和错误处理
   - 批量导入确认

2. **Excel导入功能**
   - 支持Excel文件格式
   - 多工作表处理
   - 数据映射功能

3. **导入模板**
   - 提供标准导入模板
   - 模板下载功能
   - 导入说明文档

## 总结

第六阶段成功实现了多银行账户交易管理的高级功能扩展，为企业级应用提供了完整的数据管理解决方案。

**主要成就：**
- ✅ 实现了完整的分页功能
- ✅ 实现了多字段排序功能
- ✅ 实现了批量操作功能
- ✅ 实现了高级筛选功能
- ✅ 实现了CSV导出功能
- ✅ 建立了数据可视化框架
- ✅ 提供了优秀的用户体验
- ✅ 保持了与现有系统的兼容性

**技术亮点：**
- 高效的状态管理和数据处理
- 响应式设计和用户友好的界面
- 完善的错误处理和加载状态
- 灵活的筛选和排序机制
- 可扩展的架构设计

第六阶段为多银行账户交易管理提供了企业级的功能支持，为后续的数据可视化和导入功能扩展奠定了坚实的基础。 