# 程序性能优化指南 - 数据加载速度改善方案

## 🚀 性能问题诊断

### 当前性能瓶颈

1. **数据加载问题**
   - 所有数据在组件挂载时一次性加载
   - 没有分页机制，大量数据影响性能
   - 重复的API调用没有缓存
   - 项目花费金额计算是串行的

2. **组件渲染问题**
   - 大量状态更新导致频繁重渲染
   - 没有使用React.memo优化组件
   - 复杂的过滤逻辑在每次渲染时重新计算

3. **Firebase查询问题**
   - 没有使用索引优化查询
   - 缺少查询限制和分页
   - 没有利用Firebase的实时监听功能

## 📊 性能优化方案

### 1. 数据加载优化

#### 1.1 实现分页加载
```typescript
// 新增分页状态
const [currentPage, setCurrentPage] = React.useState(1)
const [pageSize, setPageSize] = React.useState(50)
const [hasMore, setHasMore] = React.useState(true)
const [lastDoc, setLastDoc] = React.useState<any>(null)

// 分页加载函数
const loadMoreTransactions = React.useCallback(async () => {
  if (!hasMore || loading) return
  
  setLoading(true)
  try {
    const result = await getTransactionsWithPagination(pageSize, lastDoc)
    setTransactions(prev => [...prev, ...result.transactions])
    setLastDoc(result.lastDoc)
    setHasMore(result.hasMore)
  } catch (error) {
    console.error('Error loading more transactions:', error)
  } finally {
    setLoading(false)
  }
}, [pageSize, lastDoc, hasMore, loading])
```

#### 1.2 实现数据缓存
```typescript
// 使用React Query或SWR进行数据缓存
import { useQuery, useQueryClient } from '@tanstack/react-query'

const useTransactions = () => {
  return useQuery({
    queryKey: ['transactions'],
    queryFn: getTransactions,
    staleTime: 5 * 60 * 1000, // 5分钟缓存
    cacheTime: 10 * 60 * 1000, // 10分钟缓存
  })
}
```

#### 1.3 并行数据加载
```typescript
// 优化dashboard数据加载
const fetchDashboardData = async () => {
  setLoading(true)
  try {
    // 并行加载基础数据
    const [transactions, projects] = await Promise.all([
      getTransactions(),
      getProjects()
    ])
    
    setTransactions(transactions)
    setProjects(projects)
    
    // 并行计算项目花费金额
    const spentAmounts = await Promise.all(
      projects.map(async (project) => {
        try {
          const spent = await getProjectSpentAmount(project.id!)
          return { [project.id!]: spent }
        } catch (error) {
          console.error(`Error calculating spent amount for project ${project.id}:`, error)
          return { [project.id!]: 0 }
        }
      })
    )
    
    const combinedSpentAmounts = spentAmounts.reduce((acc, curr) => ({ ...acc, ...curr }), {})
    setProjectSpentAmounts(combinedSpentAmounts)
  } catch (error) {
    setError("无法加载数据: " + error.message)
  } finally {
    setLoading(false)
  }
}
```

### 2. 组件渲染优化

#### 2.1 使用React.memo优化组件
```typescript
// 优化交易行组件
const TransactionRow = React.memo(({ transaction, onEdit, onDelete }: TransactionRowProps) => {
  // 组件逻辑
}, (prevProps, nextProps) => {
  // 自定义比较函数
  return prevProps.transaction.id === nextProps.transaction.id &&
         prevProps.transaction.status === nextProps.transaction.status
})
```

#### 2.2 使用useMemo优化计算
```typescript
// 优化过滤逻辑
const filteredTransactions = React.useMemo(() => {
  let filtered = transactions

  // 搜索过滤
  if (searchTerm) {
    filtered = filtered.filter(t => 
      t.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.description2?.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }

  // 状态过滤
  if (statusFilter !== 'all') {
    filtered = filtered.filter(t => t.status === statusFilter)
  }

  // 日期范围过滤
  if (dateRangeFilter.enabled) {
    const startDate = new Date(dateRangeFilter.startDate)
    const endDate = new Date(dateRangeFilter.endDate)
    endDate.setHours(23, 59, 59, 999)
    
    filtered = filtered.filter(transaction => {
      const transactionDate = typeof transaction.date === 'string' 
        ? new Date(transaction.date) 
        : new Date(transaction.date.seconds * 1000)
      return transactionDate >= startDate && transactionDate <= endDate
    })
  }

  return filtered
}, [transactions, searchTerm, statusFilter, dateRangeFilter])
```

#### 2.3 使用useCallback优化函数
```typescript
// 优化事件处理函数
const handleEditTransaction = React.useCallback((transaction: Transaction) => {
  setEditingTransaction(transaction)
  setIsEditMode(true)
  setIsFormOpen(true)
  setFormData({
    date: typeof transaction.date === 'string' 
      ? transaction.date 
      : new Date(transaction.date.seconds * 1000).toISOString().split('T')[0],
    description: transaction.description,
    description2: transaction.description2 || '',
    expense: transaction.expense || '',
    income: transaction.income || '',
    status: transaction.status,
    projectid: transaction.projectid || '',
    category: transaction.category || ''
  })
}, [])
```

### 3. Firebase查询优化

#### 3.1 添加查询索引
```typescript
// 在Firebase控制台添加复合索引
// 集合: transactions
// 字段: status (Ascending), date (Descending)
// 字段: projectid (Ascending), date (Descending)
```

#### 3.2 优化查询函数
```typescript
// 优化getTransactions函数
export async function getTransactionsWithPagination(
  limitCount: number = 50, 
  lastDoc?: any,
  filters?: {
    status?: string
    dateRange?: { start: Date; end: Date }
    searchTerm?: string
  }
): Promise<{
  transactions: Transaction[]
  lastDoc: any
  hasMore: boolean
}> {
  try {
    let q = collection(db, "transactions")
    
    // 应用过滤器
    if (filters?.status && filters.status !== 'all') {
      q = query(q, where("status", "==", filters.status))
    }
    
    if (filters?.dateRange) {
      q = query(q, 
        where("date", ">=", filters.dateRange.start),
        where("date", "<=", filters.dateRange.end)
      )
    }
    
    // 添加排序和分页
    q = query(q, orderBy("date", "desc"), limit(limitCount))
    
    if (lastDoc) {
      q = query(q, startAfter(lastDoc))
    }
    
    const querySnapshot = await getDocs(q)
    const transactions = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Transaction[]
    
    const lastVisible = querySnapshot.docs[querySnapshot.docs.length - 1]
    
    return {
      transactions,
      lastDoc: lastVisible,
      hasMore: querySnapshot.docs.length === limitCount
    }
  } catch (error) {
    console.error('Error fetching transactions with pagination:', error)
    throw error
  }
}
```

#### 3.3 实现实时监听
```typescript
// 使用Firebase实时监听
import { onSnapshot } from 'firebase/firestore'

export function useTransactionsRealtime() {
  const [transactions, setTransactions] = React.useState<Transaction[]>([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    const q = query(collection(db, "transactions"), orderBy("date", "desc"))
    
    const unsubscribe = onSnapshot(q, 
      (querySnapshot) => {
        const fetchedTransactions = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Transaction[]
        setTransactions(fetchedTransactions)
        setLoading(false)
      },
      (error) => {
        console.error('Error listening to transactions:', error)
        setError(error.message)
        setLoading(false)
      }
    )

    return () => unsubscribe()
  }, [])

  return { transactions, loading, error }
}
```

### 4. 虚拟滚动优化

#### 4.1 实现虚拟滚动
```typescript
import { FixedSizeList as List } from 'react-window'

const VirtualizedTransactionList = ({ transactions }: { transactions: Transaction[] }) => {
  const Row = ({ index, style }: { index: number; style: React.CSSProperties }) => {
    const transaction = transactions[index]
    return (
      <div style={style}>
        <TransactionRow transaction={transaction} />
      </div>
    )
  }

  return (
    <List
      height={600}
      itemCount={transactions.length}
      itemSize={60}
      width="100%"
    >
      {Row}
    </List>
  )
}
```

### 5. 代码分割和懒加载

#### 5.1 组件懒加载
```typescript
// 懒加载大型组件
const BankTransactions = React.lazy(() => import('./modules/bank-transactions'))
const GeneralLedger = React.lazy(() => import('./modules/general-ledger'))

// 在路由中使用
<Suspense fallback={<div>加载中...</div>}>
  <BankTransactions />
</Suspense>
```

#### 5.2 动态导入
```typescript
// 动态导入大型库
const exportToExcel = async (data: any[]) => {
  const XLSX = await import('xlsx')
  // 导出逻辑
}
```

### 6. 内存优化

#### 6.1 清理不必要的状态
```typescript
// 清理大型对象
React.useEffect(() => {
  return () => {
    setTransactions([])
    setFilteredTransactions([])
  }
}, [])
```

#### 6.2 使用WeakMap缓存
```typescript
// 缓存计算结果
const calculationCache = new WeakMap()

const calculateRunningBalance = (transactions: Transaction[], initialBalance: number = 0): number => {
  if (calculationCache.has(transactions)) {
    return calculationCache.get(transactions)
  }
  
  const result = transactions.reduce((balance, transaction) => {
    const netAmount = calculateNetAmount(transaction)
    return balance + netAmount
  }, initialBalance)
  
  calculationCache.set(transactions, result)
  return result
}
```

## 🛠️ 实施步骤

### 第一阶段：基础优化
1. 实现数据分页加载
2. 添加React.memo和useMemo优化
3. 优化Firebase查询

### 第二阶段：高级优化
1. 实现数据缓存
2. 添加虚拟滚动
3. 实现实时监听

### 第三阶段：性能监控
1. 添加性能监控工具
2. 实现错误边界
3. 添加加载状态优化

## 📈 预期性能提升

- **初始加载时间**: 减少60-80%
- **数据过滤响应**: 减少70-90%
- **内存使用**: 减少40-60%
- **用户体验**: 显著改善

## 🔧 监控工具

### 添加性能监控
```typescript
// 性能监控工具
import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals'

function sendToAnalytics(metric: any) {
  console.log('Performance metric:', metric)
  // 发送到分析服务
}

getCLS(sendToAnalytics)
getFID(sendToAnalytics)
getFCP(sendToAnalytics)
getLCP(sendToAnalytics)
getTTFB(sendToAnalytics)
```

这个优化方案将显著改善您的应用程序性能和数据加载速度。建议按阶段实施，先解决最关键的瓶颈问题。 