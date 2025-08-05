"use client"

import * as React from "react"
import { CreditCard, TrendingUp, DollarSign } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  getBankAccounts, 
  getTransactionsByBankAccount,
  initializeDefaultBankAccounts
} from "@/lib/firebase-utils"
import type { Transaction, BankAccount } from "@/lib/data"
import { useAuth } from "@/components/auth/auth-context"
import { RoleLevels, UserRoles } from "@/lib/data"
import { useToast } from "@/hooks/use-toast"

/**
 * 多银行账户银行交易组件
 * 支持通过Tab界面管理多个银行账户的交易
 */
export function BankTransactionsMultiAccount() {
  const { currentUser, hasPermission } = useAuth()
  const { toast } = useToast()
  
  // 货币格式化函数
  const formatCurrency = (amount: number, currency: string = "CNY"): string => {
    const currencySymbols: { [key: string]: string } = {
      'MYR': 'RM',
      'USD': '$',
      'EUR': '€',
      'GBP': '£',
      'JPY': '¥',
      'SGD': 'S$',
      'HKD': 'HK$',
      'KRW': '₩',
      'AUD': 'A$',
      'CAD': 'C$',
      'CHF': 'CHF',
      'CNY': '¥'
    }
    
    const symbol = currencySymbols[currency] || '¥'
    return `${symbol}${amount.toFixed(2)}`
  }

  // 银行账户状态
  const [bankAccounts, setBankAccounts] = React.useState<BankAccount[]>([])
  const [selectedBankAccountId, setSelectedBankAccountId] = React.useState<string>("")
  const [bankAccountsLoading, setBankAccountsLoading] = React.useState(true)
  
  // 交易状态
  const [transactions, setTransactions] = React.useState<Transaction[]>([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  // 加载银行账户
  const fetchBankAccounts = React.useCallback(async () => {
    if (!currentUser) return
    
    try {
      setBankAccountsLoading(true)
      let accounts = await getBankAccounts()
      
      // 如果没有银行账户，自动初始化默认账户
      if (accounts.length === 0) {
        console.log('没有找到银行账户，正在初始化默认账户...')
        await initializeDefaultBankAccounts(currentUser.uid)
        accounts = await getBankAccounts()
        console.log('默认银行账户初始化完成，账户数量:', accounts.length)
      }
      
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

  // 加载指定银行账户的交易
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

  // 初始化数据
  React.useEffect(() => {
    if (currentUser) {
      fetchBankAccounts()
    }
  }, [currentUser])

  // 当选择的银行账户改变时，重新加载交易
  React.useEffect(() => {
    if (selectedBankAccountId) {
      fetchTransactions(selectedBankAccountId)
    }
  }, [selectedBankAccountId, fetchTransactions])

  // 处理银行账户切换
  const handleBankAccountChange = (bankAccountId: string) => {
    setSelectedBankAccountId(bankAccountId)
  }

  // 渲染银行账户Tab
  const renderBankAccountTabs = () => {
    if (bankAccountsLoading) {
      return (
        <div className="flex items-center justify-center p-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
            <p className="text-gray-600">加载银行账户中...</p>
          </div>
        </div>
      )
    }

    if (bankAccounts.length === 0) {
      return (
        <div className="flex items-center justify-center p-8">
          <div className="text-center">
            <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">暂无银行账户</h3>
            <p className="text-gray-600 mb-4">请先创建银行账户以管理交易</p>
            <Button onClick={() => window.location.href = "/bank-account-management"}>
              管理银行账户
            </Button>
          </div>
        </div>
      )
    }

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
                formatCurrency={formatCurrency}
              />
            )}
          </TabsContent>
        ))}
      </Tabs>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">银行交易管理</h2>
          <p className="text-muted-foreground">
            管理多个银行账户的交易记录
          </p>
        </div>
        
        {hasPermission(RoleLevels[UserRoles.ASSISTANT_VICE_PRESIDENT]) && (
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              onClick={() => window.location.href = "/bank-account-management"}
            >
              管理银行账户
            </Button>
          </div>
        )}
      </div>

      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <div className="text-red-600">错误: {error}</div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setError(null)}
              >
                关闭
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {renderBankAccountTabs()}
    </div>
  )
}

/**
 * 单个银行账户交易Tab组件
 */
function BankAccountTransactionsTab({
  bankAccount,
  transactions,
  loading,
  error,
  onRefresh,
  formatCurrency
}: {
  bankAccount: BankAccount
  transactions: Transaction[]
  loading: boolean
  error: string | null
  onRefresh: () => void
  formatCurrency: (amount: number, currency?: string) => string
}) {
  const { hasPermission } = useAuth()
  
  // 计算账户统计
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

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">加载交易数据中...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="text-red-600">错误: {error}</div>
            <Button variant="outline" size="sm" onClick={onRefresh}>
              重试
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* 账户统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">总交易数</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{accountStats.totalTransactions}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">总收入</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(accountStats.totalIncome, bankAccount.currency)}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">总支出</CardTitle>
            <DollarSign className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {formatCurrency(accountStats.totalExpense, bankAccount.currency)}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">净额</CardTitle>
            <DollarSign className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${accountStats.netAmount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {accountStats.netAmount >= 0 ? '+' : ''}{formatCurrency(Math.abs(accountStats.netAmount), bankAccount.currency)}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">当前余额</CardTitle>
            <CreditCard className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {formatCurrency(accountStats.currentBalance, bankAccount.currency)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 交易列表 */}
      <Card>
        <CardHeader>
          <CardTitle>交易记录</CardTitle>
          <CardDescription>
            {bankAccount.name} - 共 {transactions.length} 笔交易
          </CardDescription>
        </CardHeader>
        <CardContent>
          {transactions.length === 0 ? (
            <div className="text-center py-8">
              <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">暂无交易记录</h3>
              <p className="text-gray-600">此银行账户还没有任何交易记录</p>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-gray-600">交易表格将在这里显示</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
} 