# 项目详情功能实现总结

## 🎯 功能概述

根据用户需求，项目详情功能已实现显示项目对应的银行交易记录，包括总收入、总支出、收支明细等信息。用户可以通过项目详情页面查看完整的财务信息和相关交易记录。

## 🔧 主要功能

### 1. 项目基本信息显示

#### 基本信息卡片
- **项目名称**: 显示项目完整名称
- **项目代码**: 显示项目唯一标识符
- **BOD分类**: 显示项目所属的BOD分类
- **项目状态**: 进行中、已完成、暂停（带颜色标识）
- **开始日期**: 项目开始日期
- **结束日期**: 项目结束日期（可选）
- **预算**: 项目总预算金额
- **已花费**: 项目已支出金额
- **项目描述**: 项目详细描述（如果有）

#### 界面特点
```tsx
<Card>
  <CardHeader>
    <CardTitle className="text-lg">项目基本信息</CardTitle>
  </CardHeader>
  <CardContent>
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {/* 基本信息字段 */}
    </div>
  </CardContent>
</Card>
```

### 2. 财务统计

#### 统计卡片
- **总收入**: 绿色显示，包含所有收入交易
- **总支出**: 红色显示，包含所有支出交易
- **净收入**: 根据正负值显示不同颜色
- **交易笔数**: 相关交易记录总数

#### 统计计算逻辑
```tsx
const calculateTransactionStats = (transactions: Transaction[]) => {
  const stats: ProjectTransactionStats = {
    totalIncome: 0,
    totalExpense: 0,
    netAmount: 0,
    transactionCount: transactions.length,
    incomeByCategory: {},
    expenseByCategory: {}
  }
  
  transactions.forEach(transaction => {
    stats.totalIncome += transaction.income
    stats.totalExpense += transaction.expense
    
    // 按分类统计收入
    if (transaction.income > 0) {
      const category = transaction.category || "未分类"
      stats.incomeByCategory[category] = (stats.incomeByCategory[category] || 0) + transaction.income
    }
    
    // 按分类统计支出
    if (transaction.expense > 0) {
      const category = transaction.category || "未分类"
      stats.expenseByCategory[category] = (stats.expenseByCategory[category] || 0) + transaction.expense
    }
  })
  
  stats.netAmount = stats.totalIncome - stats.totalExpense
  return stats
}
```

### 3. 收支明细

#### 标签页设计
- **收入明细**: 按分类显示收入统计
- **支出明细**: 按分类显示支出统计

#### 明细显示
```tsx
<Tabs defaultValue="income" className="w-full">
  <TabsList className="grid w-full grid-cols-2">
    <TabsTrigger value="income">收入明细</TabsTrigger>
    <TabsTrigger value="expense">支出明细</TabsTrigger>
  </TabsList>
  
  <TabsContent value="income">
    {/* 收入分类统计 */}
  </TabsContent>
  
  <TabsContent value="expense">
    {/* 支出分类统计 */}
  </TabsContent>
</Tabs>
```

### 4. 银行交易记录

#### 筛选功能
- **搜索**: 支持描述和描述2搜索
- **状态筛选**: 已完成、待处理、草稿
- **分类筛选**: 销售收入、服务收入、水电费、办公用品、其他费用

#### 表格显示
- **日期**: 格式化显示交易日期
- **描述**: 交易主要描述
- **描述2**: 交易次要描述
- **收入**: 收入金额（右对齐）
- **支出**: 支出金额（右对齐）
- **净额**: 净收入/支出（带颜色）
- **状态**: 交易状态（带徽章）
- **分类**: 交易分类
- **参考**: 交易参考号

#### 导出功能
- **格式**: CSV文件
- **文件名**: `{项目名称}_交易记录_{日期}.csv`
- **字段**: 日期、描述、描述2、收入、支出、净额、状态、分类、参考

## 📊 数据筛选逻辑

### 1. 项目交易匹配
```tsx
const projectTransactions = allTransactions.filter(transaction => {
  // 检查交易描述中是否包含项目名称
  const descriptionMatch = transaction.description.toLowerCase().includes(project.name.toLowerCase()) ||
                         (transaction.description2 && transaction.description2.toLowerCase().includes(project.name.toLowerCase()))
  
  // 检查交易分类是否匹配项目BOD分类
  const categoryMatch = transaction.category === BODCategories[project.bodCategory]
  
  return descriptionMatch || categoryMatch
})
```

### 2. 筛选应用
```tsx
React.useEffect(() => {
  let filtered = transactions
  
  // 搜索筛选
  if (filters.search) {
    const searchLower = filters.search.toLowerCase()
    filtered = filtered.filter(transaction =>
      transaction.description.toLowerCase().includes(searchLower) ||
      (transaction.description2 && transaction.description2.toLowerCase().includes(searchLower))
    )
  }
  
  // 状态筛选
  if (filters.status !== "all") {
    filtered = filtered.filter(transaction => transaction.status === filters.status)
  }
  
  // 分类筛选
  if (filters.category !== "all") {
    filtered = filtered.filter(transaction => transaction.category === filters.category)
  }
  
  setFilteredTransactions(filtered)
}, [transactions, filters])
```

## 🎯 示例数据格式

### 银行交易记录示例
```
4 Feb 2025	JUNIOR CHAMBER INTE*Intertransfer	ss	$21270.00	$0.00	+$59819.82	Pending	Open Day	水电费	未知项目
5 Feb 2025	OOI KEN HEAN *	IAB ipoh willi	$0.00	$188.00	+$60007.82	Pending	Open Day	-	未知项目
4 Feb 2025	HUAN HUI YI *Area Conventio	-	$0.00	$503.00	+$60510.82	Pending	Open Day	销售收入	未知项目
```

### 统计示例
- **总收入**: $859
- **总支出**: $21,270
- **净收入**: -$20,411
- **交易笔数**: 3

### 收支明细示例
**收入项目:**
- 销售收入 = $503
- 未明细 = $356

**支出项目:**
- 未明细 = $21,270

## 🎨 界面设计

### 1. 响应式布局
- **最大宽度**: `max-w-6xl`
- **最大高度**: `max-h-[90vh]`
- **滚动支持**: `overflow-y-auto`

### 2. 颜色编码
- **收入**: 绿色 (`text-green-600`)
- **支出**: 红色 (`text-red-600`)
- **净收入**: 根据正负值动态颜色
- **状态徽章**: 不同状态不同颜色

### 3. 卡片布局
- **项目基本信息**: 网格布局显示基本信息
- **财务统计**: 4个统计卡片
- **收支明细**: 标签页切换
- **交易记录**: 表格形式

## 🔧 技术实现

### 1. 组件结构
```tsx
export function ProjectDetailsDialog({
  open,
  onOpenChange,
  project
}: ProjectDetailsDialogProps) {
  // 状态管理
  const [transactions, setTransactions] = React.useState<Transaction[]>([])
  const [filteredTransactions, setFilteredTransactions] = React.useState<Transaction[]>([])
  const [loading, setLoading] = React.useState(false)
  const [stats, setStats] = React.useState<ProjectTransactionStats>({...})
  
  // 筛选状态
  const [filters, setFilters] = React.useState({...})
  
  // 数据获取和计算
  const fetchProjectTransactions = React.useCallback(async () => {...})
  const calculateTransactionStats = (transactions: Transaction[]) => {...}
  
  // 导出功能
  const exportProjectTransactions = () => {...}
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        {/* 界面内容 */}
      </DialogContent>
    </Dialog>
  )
}
```

### 2. 辅助函数
```tsx
// 格式化项目日期
const formatProjectDate = (date: string | { seconds: number; nanoseconds: number }): string => {
  if (typeof date === 'string') {
    return new Date(date).toLocaleDateString()
  } else if (date?.seconds) {
    return new Date(date.seconds * 1000).toLocaleDateString()
  }
  return 'N/A'
}

// 格式化交易日期
const formatTransactionDate = (date: string | { seconds: number; nanoseconds: number }): string => {
  if (typeof date === 'string') {
    return new Date(date).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    })
  } else if (date?.seconds) {
    return new Date(date.seconds * 1000).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    })
  }
  return 'N/A'
}

// 计算净金额
const calculateNetAmount = (transaction: Transaction): number => {
  return transaction.income - transaction.expense
}

// 格式化净金额
const formatNetAmount = (transaction: Transaction): string => {
  const netAmount = calculateNetAmount(transaction)
  return netAmount >= 0 ? `+$${netAmount.toFixed(2)}` : `-$${Math.abs(netAmount).toFixed(2)}`
}
```

## 💡 使用方法

### 1. 访问项目详情
1. 在项目账户页面找到目标项目
2. 点击项目的"查看"按钮
3. 系统自动打开项目详情对话框

### 2. 查看财务信息
1. **基本信息**: 查看项目的基本信息和状态
2. **财务统计**: 查看总收入、总支出、净收入、交易笔数
3. **收支明细**: 切换标签页查看收入和支出的分类统计

### 3. 浏览交易记录
1. **筛选交易**: 使用搜索框和筛选器查找特定交易
2. **查看详情**: 在表格中查看每笔交易的详细信息
3. **导出数据**: 点击"导出"按钮下载CSV文件

## 🎉 总结

项目详情功能已成功实现，提供了完整的项目财务信息展示：

1. **完整信息**: 显示项目基本信息和详细财务数据
2. **智能筛选**: 自动匹配项目相关的银行交易记录
3. **统计分析**: 提供总收入、总支出、净收入等关键指标
4. **明细分类**: 按分类显示收入和支出的详细统计
5. **交互功能**: 支持搜索、筛选、导出等操作
6. **用户友好**: 响应式设计，颜色编码，清晰布局

用户现在可以通过项目详情页面全面了解项目的财务状况和相关交易记录，为项目管理提供有力的数据支持。 