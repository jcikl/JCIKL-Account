# 银行交易记录日期范围过滤功能

## 功能概述

为了提供更顺畅的使用体验，银行交易记录页面现在支持自定义日期范围过滤。用户可以选择特定的开始和结束日期来查看指定期间的交易记录，也可以快速切换到最近30天的默认视图。

## 实现的功能

### 1. 日期范围过滤
- 支持自定义开始日期和结束日期
- 默认显示最近30天的交易记录
- 自动计算日期范围并过滤交易
- 支持字符串日期和Firestore时间戳格式

### 2. 用户控制
- 启用/禁用日期范围过滤的切换按钮
- 两个日期输入框用于设置开始和结束日期
- "最近30天"快捷按钮快速设置默认范围
- 实时更新过滤结果

### 3. UI改进
- 在搜索栏旁边添加了日期范围控制面板
- 卡片标题显示当前过滤的日期范围
- 交易数量统计会显示过滤信息
- 紧凑的日期选择器设计

## 技术实现

### 状态管理
```typescript
const [dateRangeFilter, setDateRangeFilter] = React.useState({
  enabled: true,
  startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0], // 30天前
  endDate: new Date().toISOString().split("T")[0] // 今天
})
```

### 过滤逻辑
```typescript
// 日期范围过滤
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
```

### UI组件
```typescript
<div className="flex items-center gap-2">
  <Label htmlFor="date-filter-toggle" className="text-sm font-medium">
    日期范围:
  </Label>
  <Button
    variant={dateRangeFilter.enabled ? "default" : "outline"}
    size="sm"
    onClick={() => setDateRangeFilter(prev => ({ ...prev, enabled: !prev.enabled }))}
  >
    <Calendar className="h-4 w-4 mr-2" />
    {dateRangeFilter.enabled ? "启用" : "禁用"}
  </Button>
  
  {dateRangeFilter.enabled && (
    <div className="flex items-center gap-2">
      <Input
        type="date"
        value={dateRangeFilter.startDate}
        onChange={(e) => setDateRangeFilter(prev => ({ ...prev, startDate: e.target.value }))}
      />
      <Input
        type="date"
        value={dateRangeFilter.endDate}
        onChange={(e) => setDateRangeFilter(prev => ({ ...prev, endDate: e.target.value }))}
      />
      <Button onClick={() => {/* 设置最近30天 */}}>
        最近30天
      </Button>
    </div>
  )}
</div>
```

## 用户体验

### 默认行为
- 用户首次访问页面时看到最近30天的交易
- 减少页面加载时间和数据量
- 提供更相关的近期交易信息

### 灵活性
- 用户可以设置任意日期范围
- 支持禁用日期过滤查看全部交易
- 快速切换到最近30天的快捷方式
- 保持所有现有功能不变

### 视觉反馈
- 按钮状态清晰显示当前过滤模式
- 交易数量统计包含日期范围信息
- 界面保持简洁和直观

## 测试验证

创建了测试脚本 `scripts/test-date-range-filter.js` 来验证日期范围过滤逻辑的正确性。

## 兼容性

- 支持所有现有的交易记录格式
- 与现有的搜索和过滤功能完全兼容
- 不影响其他模块的功能

## 未来改进

可以考虑添加的功能：
- 预设日期范围（本周、本月、本季度等）
- 记住用户的日期范围偏好
- 日期范围验证（确保开始日期不晚于结束日期）
- 导出指定日期范围的交易记录 