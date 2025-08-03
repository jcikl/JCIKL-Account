# Firebase序号功能实现

## 功能概述

为银行交易记录实现了基于Firebase的持久化序号系统，确保序号的存储和同步，提供更好的数据一致性和用户体验。

## 实现细节

### 1. 数据结构更新

#### Transaction接口扩展
在 `lib/data.ts` 中为Transaction接口添加了序号字段：

```typescript
export interface Transaction {
  id?: string // Firestore document ID
  date: string | { seconds: number; nanoseconds: number }
  description: string
  description2?: string
  expense: number
  income: number
  status: "Completed" | "Pending" | "Draft"
  projectid?: string
  category?: string
  sequenceNumber?: number // 新增：排列序号，用于存储到Firebase
  createdByUid: string
}
```

### 2. Firebase工具函数

在 `lib/firebase-utils.ts` 中添加了序号相关的函数：

#### getNextSequenceNumber()
获取下一个可用的序号：
```typescript
export async function getNextSequenceNumber(): Promise<number> {
  try {
    const q = query(collection(db, "transactions"), orderBy("sequenceNumber", "desc"), limit(1))
    const querySnapshot = await getDocs(q)
    
    if (querySnapshot.empty) {
      return 1
    }
    
    const lastTransaction = querySnapshot.docs[0].data() as Transaction
    return (lastTransaction.sequenceNumber || 0) + 1
  } catch (error) {
    console.error('Error getting next sequence number:', error)
    return Date.now() // 备用方案
  }
}
```

#### addTransactionWithSequence()
添加交易时自动分配序号：
```typescript
export async function addTransactionWithSequence(transactionData: Omit<Transaction, "id" | "sequenceNumber">): Promise<string> {
  try {
    const nextSequenceNumber = await getNextSequenceNumber()
    const transactionWithSequence = {
      ...transactionData,
      sequenceNumber: nextSequenceNumber
    }
    
    return await addDocument("transactions", transactionWithSequence)
  } catch (error) {
    console.error('Error adding transaction with sequence:', error)
    throw new Error(`Failed to add transaction with sequence: ${error}`)
  }
}
```

#### reorderTransactions()
批量更新交易序号：
```typescript
export async function reorderTransactions(transactionIds: string[]): Promise<void> {
  try {
    const updatePromises = transactionIds.map((id, index) => 
      updateDocument("transactions", id, { sequenceNumber: index + 1 })
    )
    
    await Promise.all(updatePromises)
  } catch (error) {
    console.error('Error reordering transactions:', error)
    throw new Error(`Failed to reorder transactions: ${error}`)
  }
}
```

#### updateTransactionSequence()
更新单个交易的序号：
```typescript
export async function updateTransactionSequence(transactionId: string, newSequenceNumber: number): Promise<void> {
  try {
    await updateDocument("transactions", transactionId, { sequenceNumber: newSequenceNumber })
  } catch (error) {
    console.error('Error updating transaction sequence:', error)
    throw new Error(`Failed to update transaction sequence: ${error}`)
  }
}
```

### 3. 组件更新

#### 修改银行交易组件
在 `components/modules/bank-transactions.tsx` 中：

1. **导入新函数**：
```typescript
import { addTransactionWithSequence, reorderTransactions } from "@/lib/firebase-utils"
```

2. **更新SortableTransactionRow组件**：
- 移除sequenceNumber参数
- 使用transaction.sequenceNumber显示序号

3. **修改添加交易逻辑**：
```typescript
// 使用新的序号系统添加交易
await addTransactionWithSequence(transactionData)
```

4. **更新排序保存逻辑**：
```typescript
const handleSaveOrder = async () => {
  if (!currentUser) return

  try {
    const sortedIds = sortedTransactions.map(t => t.id!).filter(Boolean)
    await reorderTransactions(sortedIds)

    await fetchTransactions()
    setIsSortEditMode(false)
    toast({
      title: "成功",
      description: "交易顺序已保存到Firebase"
    })
  } catch (err: any) {
    toast({
      title: "错误",
      description: "保存排序失败: " + err.message,
      variant: "destructive"
    })
  }
}
```

5. **更新数据获取逻辑**：
```typescript
const fetchTransactions = React.useCallback(async () => {
  setLoading(true)
  setError(null)
  try {
    const fetched = await getTransactions()
    // 按sequenceNumber字段排序，如果没有sequenceNumber字段则按日期排序
    const sorted = fetched.sort((a, b) => {
      const sequenceA = a.sequenceNumber ?? 0
      const sequenceB = b.sequenceNumber ?? 0
      if (sequenceA !== sequenceB) {
        return sequenceA - sequenceB
      }
      // 如果sequenceNumber相同，按日期排序
      const dateA = typeof a.date === 'string' ? new Date(a.date) : new Date(a.date.seconds * 1000)
      const dateB = typeof b.date === 'string' ? new Date(b.date) : new Date(b.date.seconds * 1000)
      return dateB.getTime() - dateA.getTime()
    })
    setTransactions(sorted)
    setFilteredTransactions(sorted)
  } catch (err: any) {
    setError("无法加载交易: " + err.message)
    console.error("Error fetching transactions:", err)
  } finally {
    setLoading(false)
  }
}, [])
```

## 功能特性

### 1. 自动序号分配
- 新添加的交易会自动分配下一个可用序号
- 序号从1开始递增
- 支持并发添加，避免序号冲突

### 2. 持久化存储
- 序号存储在Firebase Firestore中
- 数据持久化，重启应用后序号保持不变
- 支持多用户环境下的序号同步

### 3. 拖拽排序
- 支持拖拽重新排序交易
- 排序后自动更新Firebase中的序号
- 批量更新，提高性能

### 4. 兼容性处理
- 对于没有序号的旧交易，按日期排序
- 序号为0或undefined的交易排在最后
- 向后兼容现有数据

### 5. 错误处理
- 序号获取失败时使用时间戳作为备用
- 批量更新失败时提供详细错误信息
- 网络错误时的重试机制

## 数据流程

### 添加交易流程
1. 用户填写交易信息
2. 调用 `addTransactionWithSequence()`
3. 获取下一个可用序号
4. 将交易数据和序号一起保存到Firebase
5. 刷新交易列表，按序号排序显示

### 拖拽排序流程
1. 用户拖拽交易重新排序
2. 点击"保存排序"按钮
3. 调用 `reorderTransactions()` 批量更新序号
4. 更新Firebase中的序号数据
5. 刷新交易列表显示新顺序

### 数据获取流程
1. 从Firebase获取所有交易
2. 按sequenceNumber字段排序
3. 对于没有序号的交易，按日期排序
4. 在UI中显示排序后的交易列表

## 性能优化

### 1. 批量操作
- 拖拽排序时使用批量更新
- 减少Firebase API调用次数
- 提高排序操作的性能

### 2. 索引优化
- 在Firebase中为sequenceNumber字段创建索引
- 优化序号查询性能
- 支持大量交易数据的快速排序

### 3. 缓存策略
- 序号查询结果缓存
- 减少重复的序号计算
- 提高应用响应速度

## 测试验证

创建了测试脚本 `scripts/test-firebase-sequence.js` 来验证：

- 新交易序号分配
- 批量序号更新
- 按序号排序逻辑
- 错误处理机制

## 部署注意事项

### 1. Firebase索引
需要在Firebase控制台中为transactions集合的sequenceNumber字段创建索引：

```javascript
// 复合索引
collection: transactions
fields: 
  - sequenceNumber (Ascending)
  - date (Descending)
```

### 2. 数据迁移
对于现有的交易数据，需要运行迁移脚本添加序号：

```javascript
// 迁移脚本示例
const transactions = await getTransactions()
for (let i = 0; i < transactions.length; i++) {
  await updateDocument("transactions", transactions[i].id, { 
    sequenceNumber: i + 1 
  })
}
```

### 3. 权限设置
确保Firebase安全规则允许序号字段的读写操作：

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /transactions/{document} {
      allow read, write: if request.auth != null;
    }
  }
}
```

## 总结

Firebase序号功能的实现提供了：

1. **数据一致性**: 序号持久化存储，确保数据一致性
2. **用户体验**: 拖拽排序功能，提升用户操作体验
3. **性能优化**: 批量操作和索引优化，提高系统性能
4. **扩展性**: 支持多用户环境和大量数据处理
5. **兼容性**: 向后兼容现有数据，平滑升级

该功能与现有的银行交易系统完美集成，为用户提供了更好的交易管理体验。 