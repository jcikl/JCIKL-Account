# 交易记录存储到指定银行账户指南

## 概述

本指南详细说明如何将交易记录存储到指定的银行账户。系统支持多银行账户管理，每个交易记录都可以关联到特定的银行账户。

## 核心功能

### 1. 银行账户管理
- 支持创建多个银行账户
- 每个账户可以设置不同的货币类型
- 账户状态管理（活跃/停用）

### 2. 交易记录存储
- 交易记录与银行账户关联
- 自动生成序号
- 支持项目分类和付款人信息

## 技术实现

### 核心函数

#### `addTransactionWithBankAccount`
```typescript
export async function addTransactionWithBankAccount(
  transactionData: Omit<Transaction, "id" | "sequenceNumber">,
  bankAccountId: string
): Promise<string>
```

**功能：** 将交易记录存储到指定的银行账户

**参数：**
- `transactionData`: 交易数据（不包含id和序号）
- `bankAccountId`: 目标银行账户ID

**返回值：** 新创建的交易记录ID

**示例：**
```typescript
const transactionData: Omit<Transaction, "id" | "sequenceNumber"> = {
  date: "2025-01-15",
  description: "办公用品采购",
  description2: "",
  expense: 150.00,
  income: 0,
  status: "Completed",
  payer: "张三",
  projectid: "2025_P_办公项目",
  projectName: "办公项目",
  category: "办公用品",
  bankAccountId: "bank_account_123",
  bankAccountName: "工商银行",
  createdByUid: "user_123"
}

const transactionId = await addTransactionWithBankAccount(transactionData, "bank_account_123")
```

#### `getTransactionsByBankAccount`
```typescript
export async function getTransactionsByBankAccount(bankAccountId: string): Promise<Transaction[]>
```

**功能：** 获取指定银行账户的所有交易记录

**参数：**
- `bankAccountId`: 银行账户ID

**返回值：** 交易记录数组

**示例：**
```typescript
const transactions = await getTransactionsByBankAccount("bank_account_123")
```

## 使用步骤

### 1. 创建银行账户

首先需要创建银行账户：

```typescript
import { addBankAccount } from "@/lib/firebase-utils"

const bankAccountData = {
  name: "工商银行",
  bankName: "中国工商银行",
  accountNumber: "1234567890",
  balance: 10000.00,
  currency: "CNY",
  isActive: true,
  createdByUid: "user_123",
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
}

const bankAccountId = await addBankAccount(bankAccountData)
```

### 2. 添加交易记录到指定账户

```typescript
import { addTransactionWithBankAccount } from "@/lib/firebase-utils"

// 准备交易数据
const transactionData = {
  date: "2025-01-15",
  description: "办公用品采购",
  description2: "",
  expense: 150.00,
  income: 0,
  status: "Completed",
  payer: "张三",
  projectid: "2025_P_办公项目",
  projectName: "办公项目",
  category: "办公用品",
  bankAccountId: bankAccountId,
  bankAccountName: "工商银行",
  createdByUid: "user_123"
}

// 存储到指定银行账户
const transactionId = await addTransactionWithBankAccount(transactionData, bankAccountId)
```

### 3. 查询指定账户的交易记录

```typescript
import { getTransactionsByBankAccount } from "@/lib/firebase-utils"

// 获取指定银行账户的所有交易
const transactions = await getTransactionsByBankAccount(bankAccountId)

// 显示交易记录
transactions.forEach(transaction => {
  console.log(`交易: ${transaction.description}, 金额: ${transaction.expense || transaction.income}`)
})
```

## 数据模型

### Transaction 接口
```typescript
interface Transaction {
  id?: string
  date: string
  description: string
  description2: string
  expense: number
  income: number
  status: "Completed" | "Pending" | "Draft"
  payer?: string
  projectid?: string
  projectName?: string
  category?: string
  bankAccountId?: string      // 关联的银行账户ID
  bankAccountName?: string    // 银行账户名称
  sequenceNumber?: number     // 序号
  createdByUid: string
  createdAt?: string
  updatedAt?: string
}
```

### BankAccount 接口
```typescript
interface BankAccount {
  id?: string
  name: string
  bankName: string
  accountNumber: string
  balance: number
  currency: string
  isActive: boolean
  createdByUid: string
  createdAt?: string
  updatedAt?: string
}
```

## 前端组件使用

### 1. 银行账户选择组件

```typescript
import { getBankAccounts } from "@/lib/firebase-utils"

const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([])
const [selectedBankAccountId, setSelectedBankAccountId] = useState<string>("")

// 加载银行账户
const loadBankAccounts = async () => {
  const accounts = await getBankAccounts()
  setBankAccounts(accounts)
  if (accounts.length > 0) {
    setSelectedBankAccountId(accounts[0].id!)
  }
}
```

### 2. 交易表单组件

```typescript
import { addTransactionWithBankAccount } from "@/lib/firebase-utils"

const handleAddTransaction = async (formData: any) => {
  const transactionData = {
    ...formData,
    bankAccountId: selectedBankAccountId,
    bankAccountName: bankAccounts.find(acc => acc.id === selectedBankAccountId)?.name,
    createdByUid: currentUser.uid
  }

  await addTransactionWithBankAccount(transactionData, selectedBankAccountId)
}
```

### 3. 交易列表组件

```typescript
import { getTransactionsByBankAccount } from "@/lib/firebase-utils"

const [transactions, setTransactions] = useState<Transaction[]>([])

const loadTransactions = async (bankAccountId: string) => {
  const transactions = await getTransactionsByBankAccount(bankAccountId)
  setTransactions(transactions)
}
```

## 多账户管理

### 1. 多账户标签页

系统支持通过标签页管理多个银行账户：

```typescript
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

<Tabs value={selectedBankAccountId} onValueChange={setSelectedBankAccountId}>
  <TabsList>
    {bankAccounts.map((account) => (
      <TabsTrigger key={account.id} value={account.id!}>
        {account.name}
      </TabsTrigger>
    ))}
  </TabsList>
  
  {bankAccounts.map((account) => (
    <TabsContent key={account.id} value={account.id!}>
      <TransactionList bankAccountId={account.id!} />
    </TabsContent>
  ))}
</Tabs>
```

### 2. 账户统计

每个银行账户都有独立的统计信息：

```typescript
const calculateAccountStats = (transactions: Transaction[]) => {
  const totalIncome = transactions.reduce((sum, t) => sum + t.income, 0)
  const totalExpense = transactions.reduce((sum, t) => sum + t.expense, 0)
  const netAmount = totalIncome - totalExpense
  
  return { totalIncome, totalExpense, netAmount }
}
```

## 演示页面

访问 `http://localhost:3001/transaction-storage-demo` 查看完整的演示功能。

该页面包含：
- 银行账户选择
- 交易记录添加表单
- 交易记录列表显示
- 实时数据更新

## 注意事项

1. **银行账户必须先存在**：在添加交易记录之前，目标银行账户必须已经创建。

2. **自动序号生成**：系统会自动为新交易记录生成序号，确保交易顺序正确。

3. **货币一致性**：交易记录的货币应该与银行账户的货币类型一致。

4. **数据完整性**：每个交易记录都会包含银行账户ID和名称，便于查询和管理。

5. **权限控制**：只有有权限的用户才能添加交易记录到指定账户。

## 错误处理

```typescript
try {
  await addTransactionWithBankAccount(transactionData, bankAccountId)
  toast({
    title: "添加成功",
    description: "交易记录已成功存储到指定银行账户",
  })
} catch (error) {
  console.error("Error adding transaction:", error)
  toast({
    title: "添加失败",
    description: "无法添加交易记录",
    variant: "destructive",
  })
}
```

## 总结

通过使用 `addTransactionWithBankAccount` 函数，可以轻松地将交易记录存储到指定的银行账户。系统会自动处理序号生成、数据关联等细节，确保数据的完整性和一致性。 