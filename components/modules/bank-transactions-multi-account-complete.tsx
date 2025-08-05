"use client"

import * as React from "react"
import { 
  CreditCard, 
  TrendingUp, 
  DollarSign, 
  Filter, 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  X,
  Save
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { 
  getBankAccounts, 
  getTransactionsByBankAccount,
  addTransactionWithBankAccount,
  deleteDocument, 
  updateDocument, 
  getAccounts, 
  getProjects, 
  getCategories
} from "@/lib/firebase-utils"
import type { Transaction, Account, Project, BankAccount, Category } from "@/lib/data"
import { useAuth } from "@/components/auth/auth-context"
import { RoleLevels, UserRoles } from "@/lib/data"
import { useToast } from "@/hooks/use-toast"

interface TransactionFormData {
  date: string
  description: string
  description2: string
  expense: string
  income: string
  status: "Completed" | "Pending" | "Draft"
  payer?: string
  projectid?: string
  projectName?: string
  category?: string
  bankAccountId?: string
}

/**
 * 完整功能多银行账户银行交易组件
 * 支持通过Tab界面管理多个银行账户的交易，包含完整的CRUD功能
 */
export function BankTransactionsMultiAccountComplete() {
  const { currentUser, hasPermission } = useAuth()
  const { toast } = useToast()
  
  // 银行账户状态
  const [bankAccounts, setBankAccounts] = React.useState<BankAccount[]>([])
  const [selectedBankAccountId, setSelectedBankAccountId] = React.useState<string>("")
  const [bankAccountsLoading, setBankAccountsLoading] = React.useState(true)
  
  // 交易状态
  const [transactions, setTransactions] = React.useState<Transaction[]>([])
  const [filteredTransactions, setFilteredTransactions] = React.useState<Transaction[]>([])
  const [accounts, setAccounts] = React.useState<Account[]>([])
  const [projects, setProjects] = React.useState<Project[]>([])
  const [categories, setCategories] = React.useState<Category[]>([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  // 搜索和筛选状态
  const [searchTerm, setSearchTerm] = React.useState("")
  const [statusFilter, setStatusFilter] = React.useState("all")
  const [dateFilter, setDateFilter] = React.useState("all")
  const [projectFilter, setProjectFilter] = React.useState("all")
  const [categoryFilter, setCategoryFilter] = React.useState("all")

  // 表单状态
  const [isFormOpen, setIsFormOpen] = React.useState(false)
  const [isEditMode, setIsEditMode] = React.useState(false)
  const [editingTransaction, setEditingTransaction] = React.useState<Transaction | null>(null)
  const [formData, setFormData] = React.useState<TransactionFormData>({
    date: "",
    description: "",
    description2: "",
    expense: "",
    income: "",
    status: "Completed",
    payer: "",
    projectid: "",
    projectName: "",
    category: ""
  })
  const [submitting, setSubmitting] = React.useState(false)

  // 删除确认状态
  const [deletingTransaction, setDeletingTransaction] = React.useState<Transaction | null>(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false)

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
      setFilteredTransactions(transactions)
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

  // 筛选交易
  React.useEffect(() => {
    let filtered = transactions

    // 搜索筛选
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase()
      filtered = filtered.filter(transaction =>
        transaction.description?.toLowerCase().includes(searchLower) ||
        transaction.description2?.toLowerCase().includes(searchLower) ||
        transaction.payer?.toLowerCase().includes(searchLower) ||
        transaction.projectName?.toLowerCase().includes(searchLower) ||
        transaction.category?.toLowerCase().includes(searchLower)
      )
    }

    // 状态筛选
    if (statusFilter !== "all") {
      filtered = filtered.filter(transaction => transaction.status === statusFilter)
    }

    // 项目筛选
    if (projectFilter !== "all") {
      filtered = filtered.filter(transaction => transaction.projectid === projectFilter)
    }

    // 分类筛选
    if (categoryFilter !== "all") {
      filtered = filtered.filter(transaction => transaction.category === categoryFilter)
    }

    setFilteredTransactions(filtered)
  }, [transactions, searchTerm, statusFilter, projectFilter, categoryFilter])

  // 处理银行账户切换
  const handleBankAccountChange = (bankAccountId: string) => {
    setSelectedBankAccountId(bankAccountId)
    // 重置筛选条件
    setSearchTerm("")
    setStatusFilter("all")
    setDateFilter("all")
    setProjectFilter("all")
    setCategoryFilter("all")
  }

  // 重置表单
  const resetForm = () => {
    setFormData({
      date: "",
      description: "",
      description2: "",
      expense: "",
      income: "",
      status: "Completed",
      payer: "",
      projectid: "",
      projectName: "",
      category: ""
    })
    setIsEditMode(false)
    setEditingTransaction(null)
  }

  // 打开添加表单
  const handleAddTransaction = () => {
    resetForm()
    setFormData(prev => ({
      ...prev,
      date: new Date().toISOString().split('T')[0],
      bankAccountId: selectedBankAccountId
    }))
    setIsFormOpen(true)
  }

  // 打开编辑表单
  const handleEditTransaction = (transaction: Transaction) => {
    setEditingTransaction(transaction)
    setIsEditMode(true)
    setFormData({
      date: typeof transaction.date === "string" 
        ? transaction.date 
        : new Date(transaction.date.seconds * 1000).toISOString().split('T')[0],
      description: transaction.description || "",
      description2: transaction.description2 || "",
      expense: transaction.expense?.toString() || "",
      income: transaction.income?.toString() || "",
      status: transaction.status || "Completed",
      payer: transaction.payer || "",
      projectid: transaction.projectid || "",
      projectName: transaction.projectName || "",
      category: transaction.category || "",
      bankAccountId: transaction.bankAccountId || selectedBankAccountId
    })
    setIsFormOpen(true)
  }

  // 处理表单提交
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!currentUser || !selectedBankAccountId) return

    // 表单验证
    if (!formData.date || !formData.description) {
      toast({
        title: "验证失败",
        description: "请填写必填字段",
        variant: "destructive",
      })
      return
    }

    if (!formData.expense && !formData.income) {
      toast({
        title: "验证失败",
        description: "请填写支出或收入金额",
        variant: "destructive",
      })
      return
    }

    setSubmitting(true)

    try {
      const transactionData = {
        date: formData.date,
        description: formData.description,
        description2: formData.description2,
        expense: formData.expense ? parseFloat(formData.expense) : 0,
        income: formData.income ? parseFloat(formData.income) : 0,
        status: formData.status,
        payer: formData.payer,
        projectid: formData.projectid,
        projectName: formData.projectName,
        category: formData.category,
        bankAccountId: selectedBankAccountId,
        bankAccountName: bankAccounts.find(acc => acc.id === selectedBankAccountId)?.name,
        createdByUid: currentUser.uid
      }

      if (isEditMode && editingTransaction) {
        // 更新交易
        await updateDocument('transactions', editingTransaction.id!, transactionData)
        toast({
          title: "更新成功",
          description: "交易已成功更新",
        })
      } else {
        // 添加新交易
        await addTransactionWithBankAccount(transactionData, selectedBankAccountId)
        toast({
          title: "添加成功",
          description: "交易已成功添加",
        })
      }

      // 重新加载交易数据
      await fetchTransactions(selectedBankAccountId)
      
      // 关闭表单
      setIsFormOpen(false)
      resetForm()
    } catch (error) {
      console.error("Error saving transaction:", error)
      toast({
        title: "保存失败",
        description: "无法保存交易",
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
    }
  }

  // 处理删除交易
  const handleDeleteTransaction = async (transaction: Transaction) => {
    setDeletingTransaction(transaction)
    setIsDeleteDialogOpen(true)
  }

  // 确认删除
  const confirmDelete = async () => {
    if (!deletingTransaction) return

    try {
      await deleteDocument('transactions', deletingTransaction.id!)
      toast({
        title: "删除成功",
        description: "交易已成功删除",
      })
      
      // 重新加载交易数据
      await fetchTransactions(selectedBankAccountId)
    } catch (error) {
      console.error("Error deleting transaction:", error)
      toast({
        title: "删除失败",
        description: "无法删除交易",
        variant: "destructive",
      })
    } finally {
      setIsDeleteDialogOpen(false)
      setDeletingTransaction(null)
    }
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
              <BankAccountTransactionsTabComplete 
                bankAccount={account}
                transactions={filteredTransactions}
                loading={loading}
                error={error}
                onRefresh={() => fetchTransactions(account.id!)}
                hasPermission={hasPermission}
                accounts={accounts}
                projects={projects}
                categories={categories}
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
                statusFilter={statusFilter}
                setStatusFilter={setStatusFilter}
                projectFilter={projectFilter}
                setProjectFilter={setProjectFilter}
                categoryFilter={categoryFilter}
                setCategoryFilter={setCategoryFilter}
                onAddTransaction={handleAddTransaction}
                onEditTransaction={handleEditTransaction}
                onDeleteTransaction={handleDeleteTransaction}
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

      {/* 交易表单对话框 */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {isEditMode ? "编辑交易" : "添加交易"}
            </DialogTitle>
            <DialogDescription>
              {isEditMode ? "修改交易信息" : "添加新的交易记录"}
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleFormSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="date">日期 *</Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="status">状态</Label>
                <Select value={formData.status} onValueChange={(value) => setFormData(prev => ({ ...prev, status: value as any }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Completed">已完成</SelectItem>
                    <SelectItem value="Pending">待处理</SelectItem>
                    <SelectItem value="Draft">草稿</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="description">描述 *</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="交易描述"
                required
              />
            </div>

            <div>
              <Label htmlFor="description2">描述2</Label>
              <Input
                id="description2"
                value={formData.description2}
                onChange={(e) => setFormData(prev => ({ ...prev, description2: e.target.value }))}
                placeholder="额外描述"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="expense">支出金额</Label>
                <Input
                  id="expense"
                  type="number"
                  step="0.01"
                  value={formData.expense}
                  onChange={(e) => setFormData(prev => ({ ...prev, expense: e.target.value }))}
                  placeholder="0.00"
                />
              </div>
              
              <div>
                <Label htmlFor="income">收入金额</Label>
                <Input
                  id="income"
                  type="number"
                  step="0.01"
                  value={formData.income}
                  onChange={(e) => setFormData(prev => ({ ...prev, income: e.target.value }))}
                  placeholder="0.00"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="payer">付款人</Label>
                <Input
                  id="payer"
                  value={formData.payer}
                  onChange={(e) => setFormData(prev => ({ ...prev, payer: e.target.value }))}
                  placeholder="付款人"
                />
              </div>
              
              <div>
                <Label htmlFor="category">分类</Label>
                <Select value={formData.category} onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="选择分类" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">无分类</SelectItem>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.name}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="project">项目</Label>
              <Select value={formData.projectid} onValueChange={(value) => {
                const project = projects.find(p => p.id === value)
                setFormData(prev => ({ 
                  ...prev, 
                  projectid: value,
                  projectName: project?.name || ""
                }))
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="选择项目" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">无项目</SelectItem>
                  {projects.map((project) => (
                    <SelectItem key={project.id} value={project.id!}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsFormOpen(false)
                  resetForm()
                }}
              >
                取消
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    保存中...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    {isEditMode ? "更新" : "添加"}
                  </>
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* 删除确认对话框 */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除</AlertDialogTitle>
            <AlertDialogDescription>
              您确定要删除这笔交易吗？此操作无法撤销。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700">
              删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

/**
 * 完整功能单个银行账户交易Tab组件
 */
function BankAccountTransactionsTabComplete({
  bankAccount,
  transactions,
  loading,
  error,
  onRefresh,
  hasPermission,
  accounts,
  projects,
  categories,
  searchTerm,
  setSearchTerm,
  statusFilter,
  setStatusFilter,
  projectFilter,
  setProjectFilter,
  categoryFilter,
  setCategoryFilter,
  onAddTransaction,
  onEditTransaction,
  onDeleteTransaction
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
  searchTerm: string
  setSearchTerm: (term: string) => void
  statusFilter: string
  setStatusFilter: (filter: string) => void
  projectFilter: string
  setProjectFilter: (filter: string) => void
  categoryFilter: string
  setCategoryFilter: (filter: string) => void
  onAddTransaction: () => void
  onEditTransaction: (transaction: Transaction) => void
  onDeleteTransaction: (transaction: Transaction) => void
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

      {/* 搜索和筛选工具栏 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>交易记录</CardTitle>
              <CardDescription>
                {bankAccount.name} - 共 {transactions.length} 笔交易
              </CardDescription>
            </div>
            
            {hasPermission(RoleLevels[UserRoles.ASSISTANT_VICE_PRESIDENT]) && (
              <Button onClick={onAddTransaction}>
                <Plus className="h-4 w-4 mr-2" />
                添加交易
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {/* 搜索和筛选 */}
          <div className="space-y-4 mb-6">
            <div className="flex items-center space-x-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="搜索交易..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
                {searchTerm && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSearchTerm("")}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <Label>状态筛选</Label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">全部状态</SelectItem>
                    <SelectItem value="Completed">已完成</SelectItem>
                    <SelectItem value="Pending">待处理</SelectItem>
                    <SelectItem value="Draft">草稿</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>项目筛选</Label>
                <Select value={projectFilter} onValueChange={setProjectFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">全部项目</SelectItem>
                    {projects.map((project) => (
                      <SelectItem key={project.id} value={project.id!}>
                        {project.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>分类筛选</Label>
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">全部分类</SelectItem>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.name}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-end">
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchTerm("")
                    setStatusFilter("all")
                    setProjectFilter("all")
                    setCategoryFilter("all")
                  }}
                >
                  <Filter className="h-4 w-4 mr-2" />
                  清除筛选
                </Button>
              </div>
            </div>
          </div>

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
                                onClick={() => onEditTransaction(transaction)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => onDeleteTransaction(transaction)}
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