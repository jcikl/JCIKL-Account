# Firebase 复合索引配置

## 问题描述
当前遇到Firebase索引错误：
```
FirebaseError: [code=failed-precondition]: The query requires an index. You can create it here: https://console.firebase.google.com/v1/r/project/jcikl-account/firestore/indexes?create_composite=ClJwcm9qZWN0cy9qY2lrbC1hY2NvdW50L2RhdGFiYXNlcy8oZGVmYXVsdCkvY29sbGVjdGlvbkdyb3Vwcy90cmFuc2FjdGlvbnMvaW5kZXhlcy9fEAEaDAoIY2F0ZWdvcnkQARoICgRkYXRlEAIaDAoIX19uYW1lX18QAg
```

## 需要创建的索引

### 1. 交易记录按分类查询索引
**集合**: `transactions`  
**字段**: 
- `category` (Ascending)
- `date` (Descending)

**用途**: 支持 `getTransactionsByCategory()` 函数

### 2. 交易记录按日期范围查询索引
**集合**: `transactions`  
**字段**: 
- `date` (Ascending)
- `date` (Descending)

**用途**: 支持 `getTransactionsByDateRange()` 函数

### 3. 交易记录按状态查询索引
**集合**: `transactions`  
**字段**: 
- `status` (Ascending)
- `date` (Descending)

**用途**: 支持 `getTransactionsByStatus()` 函数

### 4. 交易记录按银行账户查询索引
**集合**: `transactions`  
**字段**: 
- `bankAccountId` (Ascending)
- `date` (Descending)

**用途**: 支持 `getTransactionsByBankAccount()` 函数

### 5. 交易记录按项目查询索引
**集合**: `transactions`  
**字段**: 
- `projectid` (Ascending)
- `date` (Descending)

**用途**: 支持 `getTransactionsByProject()` 函数

## 创建索引的方法

### 方法1: 使用Firebase控制台
1. 访问 [Firebase控制台](https://console.firebase.google.com/)
2. 选择项目 `jcikl-account`
3. 进入 Firestore Database
4. 点击 "索引" 标签
5. 点击 "创建索引"
6. 按上述配置创建索引

### 方法2: 使用Firebase CLI
创建 `firestore.indexes.json` 文件：

```json
{
  "indexes": [
    {
      "collectionGroup": "transactions",
      "queryScope": "COLLECTION",
      "fields": [
        {
          "fieldPath": "category",
          "order": "ASCENDING"
        },
        {
          "fieldPath": "date",
          "order": "DESCENDING"
        }
      ]
    },
    {
      "collectionGroup": "transactions",
      "queryScope": "COLLECTION",
      "fields": [
        {
          "fieldPath": "date",
          "order": "ASCENDING"
        },
        {
          "fieldPath": "date",
          "order": "DESCENDING"
        }
      ]
    },
    {
      "collectionGroup": "transactions",
      "queryScope": "COLLECTION",
      "fields": [
        {
          "fieldPath": "status",
          "order": "ASCENDING"
        },
        {
          "fieldPath": "date",
          "order": "DESCENDING"
        }
      ]
    },
    {
      "collectionGroup": "transactions",
      "queryScope": "COLLECTION",
      "fields": [
        {
          "fieldPath": "bankAccountId",
          "order": "ASCENDING"
        },
        {
          "fieldPath": "date",
          "order": "DESCENDING"
        }
      ]
    },
    {
      "collectionGroup": "transactions",
      "queryScope": "COLLECTION",
      "fields": [
        {
          "fieldPath": "projectid",
          "order": "ASCENDING"
        },
        {
          "fieldPath": "date",
          "order": "DESCENDING"
        }
      ]
    }
  ]
}
```

然后运行：
```bash
firebase deploy --only firestore:indexes
```

## 临时解决方案
如果无法立即创建索引，可以临时修改查询逻辑，避免使用复合索引：

```typescript
// 临时解决方案：移除orderBy子句
export async function getTransactionsByCategory(category: string): Promise<Transaction[]> {
  try {
    const q = query(
      collection(db, "transactions"),
      where("category", "==", category)
      // 临时移除 orderBy("date", "desc")
    )
    const querySnapshot = await getDocs(q)
    const transactions = querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as Transaction)
    
    // 客户端排序
    return transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  } catch (error) {
    throw new Error(`Failed to get transactions by category: ${error}`)
  }
}
```

## 注意事项
1. 索引创建可能需要几分钟到几小时
2. 索引会影响写入性能，但会显著提升查询性能
3. 建议在生产环境中创建所有必要的索引
4. 开发环境中可以使用临时解决方案快速解决问题
