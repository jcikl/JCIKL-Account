# 银行交易记录最近30天过滤功能

## 功能概述

为了提供更顺畅的使用体验，银行交易记录页面现在默认显示最近30天的交易记录，用户可以通过按钮切换查看全部交易记录。

## 实现的功能

### 1. 默认过滤
- 页面加载时默认只显示最近30天的交易记录
- 自动计算30天前的日期作为过滤条件
- 支持字符串日期和Firestore时间戳格式

### 2. 用户控制
- 添加了"最近30天/显示全部"切换按钮
- 按钮状态清晰显示当前过滤模式
- 提供视觉反馈和说明文字

### 3. UI改进
- 在搜索栏旁边添加了过滤切换按钮
- 卡片标题显示当前过滤状态
- 交易数量统计会显示过滤信息

## 技术实现

### 状态管理
```typescript
const [showLast30Days, setShowLast30Days] = React.useState(true)
```

### 过滤逻辑
```typescript
// 最近30天过滤
if (showLast30Days) {
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
  
  filtered = filtered.filter(transaction => {
    const transactionDate = typeof transaction.date === 'string' 
      ? new Date(transaction.date) 
      : new Date(transaction.date.seconds * 1000)
    return transactionDate >= thirtyDaysAgo
  })
}
```

### UI组件
```typescript
<Button
  variant={showLast30Days ? "default" : "outline"}
  size="sm"
  onClick={() => setShowLast30Days(!showLast30Days)}
>
  <Calendar className="h-4 w-4 mr-2" />
  {showLast30Days ? "最近30天" : "显示全部"}
</Button>
```

## 用户体验

### 默认行为
- 用户首次访问页面时看到最近30天的交易
- 减少页面加载时间和数据量
- 提供更相关的近期交易信息

### 灵活性
- 用户可以随时切换查看全部交易
- 保持所有现有功能不变
- 搜索和其他过滤功能正常工作

### 视觉反馈
- 按钮状态清晰显示当前模式
- 交易数量统计包含过滤信息
- 界面保持简洁和直观

## 测试验证

创建了测试脚本 `scripts/test-30-days-filter.js` 来验证过滤逻辑的正确性。

## 兼容性

- 支持所有现有的交易记录格式
- 与现有的搜索和过滤功能完全兼容
- 不影响其他模块的功能

## 未来改进

可以考虑添加的功能：
- 自定义天数选择（7天、14天、30天、90天等）
- 记住用户的过滤偏好
- 添加日期范围选择器 