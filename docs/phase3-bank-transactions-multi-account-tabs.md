# 第三阶段：多银行账户Tab界面重构

## 概述

第三阶段实现了多银行账户的Tab界面，将原有的单一银行交易组件重构为支持多个银行账户的管理界面。

## 实现内容

### 1. 新组件创建

#### `components/modules/bank-transactions-multi-account.tsx`
- **功能**: 支持多银行账户Tab界面的银行交易管理组件
- **主要特性**:
  - 银行账户Tab切换
  - 每个银行账户独立的交易管理
  - 账户统计信息显示
  - 权限控制集成

#### 核心功能

1. **银行账户加载和管理**
   ```typescript
   const fetchBankAccounts = React.useCallback(async () => {
     if (!currentUser) return
     
     try {
       setBankAccountsLoading(true)
       const accounts = await getBankAccounts()
       setBankAccounts(accounts)
       
       // 如果有银行账户，选择第一个活跃的账户
       if (accounts.length > 0) {
         const activeAccount = accounts.find(acc => acc.isActive) || accounts[0]
         setSelectedBankAccountId(activeAccount.id!)
       }
     } catch (error) {
       console.error("Error fetching bank accounts:", error)
       setError("Failed to load bank accounts")
     } finally {
       setBankAccountsLoading(false)
     }
   }, [currentUser])
   ```

2. **交易数据加载**
   ```typescript
   const fetchTransactions = React.useCallback(async (bankAccountId: string) => {
     if (!currentUser || !bankAccountId) return
     
     try {
       setLoading(true)
       const transactions = await getTransactionsByBankAccount(bankAccountId)
       setTransactions(transactions)
     } catch (error) {
       console.error("Error fetching transactions:", error)
       setError("Failed to load transactions")
     } finally {
       setLoading(false)
     }
   }, [currentUser])
   ```

3. **Tab界面渲染**
   ```typescript
   const renderBankAccountTabs = () => {
     return (
       <Tabs value={selectedBankAccountId} onValueChange={handleBankAccountChange}>
         <TabsList className="grid w-full grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
           {bankAccounts.map((account) => (
             <TabsTrigger 
               key={account.id} 
               value={account.id!}
               className="flex items-center space-x-2"
               disabled={!account.isActive}
             >
               <CreditCard className="h-4 w-4" />
               <span className="truncate">{account.name}</span>
               {!account.isActive && (
                 <Badge variant="secondary" className="text-xs">已停用</Badge>
               )}
             </TabsTrigger>
           ))}
         </TabsList>
         
         {bankAccounts.map((account) => (
           <TabsContent key={account.id} value={account.id!} className="space-y-4">
             {account.id === selectedBankAccountId && (
               <BankAccountTransactionsTab 
                 bankAccount={account}
                 transactions={transactions}
                 loading={loading}
                 error={error}
                 onRefresh={() => fetchTransactions(account.id!)}
               />
             )}
           </TabsContent>
         ))}
       </Tabs>
     )
   }
   ```

### 2. 子组件实现

#### `BankAccountTransactionsTab` 组件
- **功能**: 单个银行账户的交易管理界面
- **特性**:
  - 账户统计信息卡片
  - 交易列表显示
  - 加载状态处理
  - 错误状态处理

#### 账户统计计算
```typescript
const accountStats = React.useMemo(() => {
  const totalTransactions = transactions.length
  const totalIncome = transactions.reduce((sum, t) => sum + parseFloat(t.income?.toString() || "0"), 0)
  const totalExpense = transactions.reduce((sum, t) => sum + parseFloat(t.expense?.toString() || "0"), 0)
  const netAmount = totalIncome - totalExpense
  const currentBalance = bankAccount.balance + netAmount
  
  return {
    totalTransactions,
    totalIncome,
    totalExpense,
    netAmount,
    currentBalance
  }
}, [transactions, bankAccount.balance])
```

### 3. 测试页面

#### `app/test-bank-transactions-multi-account/page.tsx`
- **功能**: 测试多银行账户交易组件的页面
- **访问路径**: `/test-bank-transactions-multi-account`

## 技术特性

### 1. 状态管理
- 银行账户列表状态
- 当前选中的银行账户
- 交易数据状态
- 加载和错误状态

### 2. 权限控制
- 集成 `useAuth` 钩子
- 基于用户角色的权限检查
- 银行账户管理权限控制

### 3. 用户体验
- 响应式Tab布局
- 加载状态指示
- 错误处理和重试机制
- 空状态处理

### 4. 数据流
1. 组件初始化时加载银行账户列表
2. 选择银行账户时加载对应的交易数据
3. 切换Tab时重新加载交易数据
4. 实时更新账户统计信息

## 与现有系统的集成

### 1. 数据模型兼容
- 使用现有的 `BankAccount` 和 `Transaction` 接口
- 兼容现有的Firebase数据结构
- 保持与现有组件的接口一致性

### 2. 权限系统集成
- 使用现有的 `useAuth` 钩子
- 集成现有的角色权限系统
- 保持权限检查的一致性

### 3. UI组件复用
- 使用现有的UI组件库
- 保持设计风格的一致性
- 复用现有的样式和布局

## 下一步计划

### 第四阶段：完整功能集成
1. **交易表格组件集成**
   - 将现有的交易表格功能集成到Tab界面
   - 支持交易编辑、删除、批量操作
   - 集成搜索、筛选、分页功能

2. **交易表单集成**
   - 添加新交易功能
   - 编辑现有交易功能
   - 表单验证和错误处理

3. **导入导出功能**
   - 集成现有的导入导出功能
   - 支持按银行账户导入导出
   - 批量操作功能

4. **高级功能**
   - 拖拽排序功能
   - 项目匹配功能
   - 批量编辑功能

## 测试建议

1. **功能测试**
   - 测试银行账户Tab切换
   - 测试交易数据加载
   - 测试权限控制

2. **用户体验测试**
   - 测试响应式布局
   - 测试加载状态
   - 测试错误处理

3. **性能测试**
   - 测试大量交易数据的加载
   - 测试Tab切换的性能
   - 测试内存使用情况

## 总结

第三阶段成功实现了多银行账户Tab界面的基础架构，为后续的完整功能集成奠定了坚实的基础。新组件具有良好的可扩展性和维护性，能够很好地支持多银行账户的管理需求。 