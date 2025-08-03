# 银行交易记录年份月份过滤功能

## 📋 功能概述

根据用户要求，将银行交易记录页面的日期范围过滤功能修改为年份和月份下拉选择功能，提供更直观和便捷的筛选体验。

## 🔄 主要修改

### 1. 状态管理修改
将原来的日期范围过滤状态替换为年份和月份过滤状态：

```typescript
// 原来的日期范围过滤状态
const [dateRangeFilter, setDateRangeFilter] = React.useState({
  enabled: true,
  startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0], // 30天前
  endDate: new Date().toISOString().split("T")[0] // 今天
})

// 修改为年份月份过滤状态
const [yearFilter, setYearFilter] = React.useState(new Date().getFullYear().toString())
const [monthFilter, setMonthFilter] = React.useState("all")
```

### 2. 过滤逻辑修改
将日期范围过滤逻辑修改为年份月份过滤逻辑：

```typescript
// 原来的日期范围过滤
if (dateRangeFilter.enabled) {
  const startDate = new Date(dateRangeFilter.startDate)
  const endDate = new Date(dateRangeFilter.endDate)
  endDate.setHours(23, 59, 59, 999) // 设置为当天的最后一刻
  
  filtered = filtered.filter(transaction => {
    const transactionDate = typeof transaction.date === 'string' 
      ? new Date(transaction.date) 
      : new Date(transaction.date.seconds * 1000)
    return transactionDate >= startDate && transactionDate <= endDate
  })
}

// 修改为年份月份过滤
if (yearFilter && monthFilter) {
  const selectedYear = parseInt(yearFilter)
  const selectedMonth = parseInt(monthFilter)
  
  filtered = filtered.filter(transaction => {
    const transactionDate = typeof transaction.date === 'string' 
      ? new Date(transaction.date) 
      : new Date(transaction.date.seconds * 1000)
    
    // 如果选择的是全年（monthFilter为"all"），只过滤年份
    if (monthFilter === "all") {
      return transactionDate.getFullYear() === selectedYear
    }
    
    // 否则过滤特定年份和月份
    return transactionDate.getFullYear() === selectedYear && 
           transactionDate.getMonth() + 1 === selectedMonth
  })
}
```

### 3. UI界面修改
将原来的日期范围选择器替换为年份和月份下拉选择器：

```typescript
{/* 年份月份过滤 */}
<div className="flex items-center gap-2">
  <div className="flex items-center gap-2">
    <Label htmlFor="year-filter" className="text-sm font-medium">
      年份月份:
    </Label>
    <Select value={yearFilter} onValueChange={setYearFilter}>
      <SelectTrigger className="w-24 h-8 text-xs">
        <SelectValue placeholder="年份" />
      </SelectTrigger>
      <SelectContent>
        {Array.from({ length: 10 }, (_, i) => {
          const year = new Date().getFullYear() - 5 + i
          return (
            <SelectItem key={year} value={year.toString()}>
              {year}
            </SelectItem>
          )
        })}
      </SelectContent>
    </Select>
    <Select value={monthFilter} onValueChange={setMonthFilter}>
      <SelectTrigger className="w-24 h-8 text-xs">
        <SelectValue placeholder="月份" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">全年</SelectItem>
        {Array.from({ length: 12 }, (_, i) => {
          const month = (i + 1).toString().padStart(2, '0')
          const monthNames = ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月']
          return (
            <SelectItem key={month} value={month}>
              {monthNames[i]}
            </SelectItem>
          )
        })}
      </SelectContent>
    </Select>
  </div>
</div>
```

### 4. 显示信息修改
将交易数量显示中的日期范围信息修改为年份月份信息：

```typescript
<CardDescription>
  {filteredTransactions.length} 笔交易
  {yearFilter && monthFilter && (
    <span className="text-muted-foreground ml-2">
      ({yearFilter}年{monthFilter === "all" ? "全年" : monthFilter + "月"})
    </span>
  )}
</CardDescription>
```

### 5. 依赖数组更新
更新useEffect的依赖数组，将dateRangeFilter替换为yearFilter和monthFilter：

```typescript
}, [transactions, yearFilter, monthFilter, searchTerm, tableDateFilter, descriptionFilter, description2Filter, expenseFilter, incomeFilter, balanceFilter, tableStatusFilter, referenceFilter, categoryFilter])
```

## ✨ 功能特点

1. **年份选择**: 提供当前年份前后5年的选择范围
2. **月份选择**: 提供"全年"选项和1-12月的选择，使用中文月份名称显示
3. **默认值**: 默认选择当前年份和"全年"
4. **实时过滤**: 选择年份或月份后立即过滤交易记录
5. **显示信息**: 在交易数量旁显示当前选择的年份和月份（或全年）

## 🎯 用户体验改进

- 更直观的年份月份选择方式
- 减少了日期输入的复杂性
- 提供了中文月份名称，更符合用户习惯
- 保持了原有的实时过滤功能
- 界面更加简洁明了 