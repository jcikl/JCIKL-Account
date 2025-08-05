"use client"

import * as React from "react"
import { 
  CreditCard, 
  TrendingUp, 
  DollarSign, 
  Copy, 
  Download, 
  FileSpreadsheet, 
  Filter, 
  Plus, 
  Upload, 
  Search, 
  Edit, 
  Trash2, 
  Calendar, 
  Tag, 
  FolderOpen, 
  Building2, 
  CheckSquare, 
  Square, 
  GripVertical 
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { 
  getBankAccounts, 
  getTransactionsByBankAccount,
  getAccounts, 
  getProjects, 
  getCategories
} from "@/lib/firebase-utils"
import type { Transaction, Account, Project, BankAccount, Category } from "@/lib/data"
import { useAuth } from "@/components/auth/auth-context"
import { RoleLevels, UserRoles } from "@/lib/data"
import { useToast } from "@/hooks/use-toast"

/**
 * 增强版多银行账户银行交易组件
 * 支持通过Tab界面管理多个银行账户的交易，集成完整的交易表格功能
 */
export function BankTransactionsMultiAccountEnhanced() {
  const { currentUser, hasPermission } = useAuth()
  const { toast } = useToast()
  
  // 银行账户状态
  const [bankAccounts, setBankAccounts] = React.useState<BankAccount[]>([])
  const [selectedBankAccountId, setSelectedBankAccountId] = React.useState<string>("")
  const [bankAccountsLoading, setBankAccountsLoading] = React.useState(true)
  
  // 交易状态
  const [transactions, setTransactions] = React.useState<Transaction[]>([])
  const [accounts, setAccounts] = React.useState<Account[]>([])
  const [projects, setProjects] = React.useState<Project[]>([])
  const [categories, setCategories] = React.useState<Category[]>([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  // 加载银行账户
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
    const initializeData = async () => {
      if (!currentUser) return
      
      try {
        // 并行加载数据
        await Promise.all([
          fetchBankAccounts(),
          getAccounts().then(setAccounts),
          getProjects().then(setProjects),
          getCategories().then(setCategories)
        ])
      } catch (error) {
        console.error("Error initializing data:", error)
        setError("Failed to initialize data")
      }
    }

    initializeData()
  }, [currentUser, fetchBankAccounts])

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
              <BankAccountTransactionsTabEnhanced 
                bankAccount={account}
                transactions={transactions}
                loading={loading}
                error={error}
                onRefresh={() => fetchTransactions(account.id!)}
                hasPermission={hasPermission}
                accounts={accounts}
                projects={projects}
                categories={categories}
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
 * 增强版单个银行账户交易Tab组件
 */
function BankAccountTransactionsTabEnhanced({
  bankAccount,
  transactions,
  loading,
  error,
  onRefresh,
  hasPermission,
  accounts,
  projects,
  categories
}: {
  bankAccount: BankAccount
  transactions: Transaction[]
  loading: boolean
  error: string | null
  onRefresh: () => void
  hasPermission: (level: number) => boolean
  accounts: Account[]
  projects: Project[]
  categories: Category[]
}) {
  const { toast } = useToast()
  
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

  // 计算净额
  const calculateNetAmount = (transaction: Transaction): number => {
    const expense = parseFloat(transaction.expense?.toString() || "0")
    const income = parseFloat(transaction.income?.toString() || "0")
    return income - expense
  }

  // 格式化净额
  const formatNetAmount = (transaction: Transaction): string => {
    const netAmount = calculateNetAmount(transaction)
    return netAmount >= 0 ? `+${netAmount.toFixed(2)}` : `${netAmount.toFixed(2)}`
  }

  // 格式化日期
  const formatDate = (date: string | { seconds: number; nanoseconds: number }): string => {
    if (typeof date === "string") {
      return new Date(date).toLocaleDateString("zh-CN")
    } else {
      return new Date(date.seconds * 1000).toLocaleDateString("zh-CN")
    }
  }

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
              ¥{accountStats.totalIncome.toFixed(2)}
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
              ¥{accountStats.totalExpense.toFixed(2)}
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
              {accountStats.netAmount >= 0 ? '+' : ''}¥{accountStats.netAmount.toFixed(2)}
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
              ¥{accountStats.currentBalance.toFixed(2)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 交易表格 */}
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
              {/* 交易表格 */}
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>日期</TableHead>
                      <TableHead>描述</TableHead>
                      <TableHead>描述2</TableHead>
                      <TableHead className="text-right">支出</TableHead>
                      <TableHead className="text-right">收入</TableHead>
                      <TableHead className="text-right">净额</TableHead>
                      <TableHead>状态</TableHead>
                      <TableHead>付款人</TableHead>
                      <TableHead>项目</TableHead>
                      <TableHead>分类</TableHead>
                      {hasPermission(RoleLevels[UserRoles.ASSISTANT_VICE_PRESIDENT]) && (
                        <TableHead className="w-20">操作</TableHead>
                      )}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transactions.map((transaction) => (
                      <TableRow key={transaction.id}>
                        <TableCell className="font-medium">{formatDate(transaction.date)}</TableCell>
                        <TableCell className="max-w-xs truncate">{transaction.description}</TableCell>
                        <TableCell className="max-w-xs truncate">{transaction.description2}</TableCell>
                        <TableCell className="text-right">
                          {transaction.expense ? `¥${parseFloat(transaction.expense.toString()).toFixed(2)}` : "-"}
                        </TableCell>
                        <TableCell className="text-right">
                          {transaction.income ? `¥${parseFloat(transaction.income.toString()).toFixed(2)}` : "-"}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          <span className={calculateNetAmount(transaction) >= 0 ? "text-green-600" : "text-red-600"}>
                            {formatNetAmount(transaction)}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge variant={transaction.status === "Completed" ? "default" : "secondary"}>
                            {transaction.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{transaction.payer || "-"}</TableCell>
                        <TableCell className="max-w-xs truncate">{transaction.projectName || "-"}</TableCell>
                        <TableCell>{transaction.category || "-"}</TableCell>
                        {hasPermission(RoleLevels[UserRoles.ASSISTANT_VICE_PRESIDENT]) && (
                          <TableCell className="w-20">
                            <div className="flex items-center space-x-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  // TODO: 实现编辑功能
                                  toast({
                                    title: "编辑功能",
                                    description: "编辑功能将在后续版本中实现",
                                  })
                                }}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  // TODO: 实现删除功能
                                  toast({
                                    title: "删除功能",
                                    description: "删除功能将在后续版本中实现",
                                  })
                                }}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        )}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
} 