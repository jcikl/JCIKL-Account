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
  Save,
  Download,
  Upload,
  ChevronUp,
  ChevronDown,
  CheckSquare,
  Square,
  Calendar,
  BarChart3,
  PieChart,
  FileSpreadsheet
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
import { Checkbox } from "@/components/ui/checkbox"
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
import { BankTransactionsCharts } from "./bank-transactions-charts"
import { BankTransactionsMultiAccountImportDialog } from "./bank-transactions-multi-account-import-dialog"

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

interface SortConfig {
  key: keyof Transaction
  direction: 'asc' | 'desc'
}

interface PaginationConfig {
  currentPage: number
  pageSize: number
  totalItems: number
}

interface AdvancedFilters {
  dateRange: {
    start: string
    end: string
  }
  amountRange: {
    min: string
    max: string
  }
  status: string
  project: string
  category: string
}

/**
 * 高级功能多银行账户银行交易组件
 * 支持分页、排序、批量操作、导入导出、高级筛选和数据可视化
 */
export function BankTransactionsMultiAccountAdvanced() {
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

  // ====== 初始余额和期末余额计算逻辑（整合，可直接插入组件顶部） ======
  const currentAccount = bankAccounts.find(acc => acc.id === selectedBankAccountId)
  const initialBalance = currentAccount?.balance ?? 0

  const totalIncome = transactions.reduce((sum, t) => sum + (parseFloat(t.income?.toString() || "0")), 0)
  const totalExpense = transactions.reduce((sum, t) => sum + (parseFloat(t.expense?.toString() || "0")), 0)
  const netAmount = totalIncome - totalExpense
  const endingBalance = initialBalance + netAmount
  // ====== 以上为初始余额和期末余额计算逻辑 ======

  // 搜索和筛选状态
  const [searchTerm, setSearchTerm] = React.useState("")
  const [advancedFilters, setAdvancedFilters] = React.useState<AdvancedFilters>({
    dateRange: { start: "", end: "" },
    amountRange: { min: "", max: "" },
    status: "all",
    project: "all",
    category: "all"
  })

  // 排序状态
  const [sortConfig, setSortConfig] = React.useState<SortConfig>({
    key: 'date',
    direction: 'desc'
  })

  // 分页状态
  const [pagination, setPagination] = React.useState<PaginationConfig>({
    currentPage: 1,
    pageSize: 20,
    totalItems: 0
  })

  // 批量操作状态
  const [selectedTransactions, setSelectedTransactions] = React.useState<Set<string>>(new Set())
  const [isSelectAll, setIsSelectAll] = React.useState(false)

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
    category: "",
    bankAccountId: selectedBankAccountId
  })
  const [submitting, setSubmitting] = React.useState(false)

  // 删除确认状态
  const [deletingTransaction, setDeletingTransaction] = React.useState<Transaction | null>(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false)

  // 导入导出状态
  const [isImportOpen, setIsImportOpen] = React.useState(false)
  const [isExportOpen, setIsExportOpen] = React.useState(false)

  // 数据可视化状态
  const [showCharts, setShowCharts] = React.useState(false)

  // 加载交易数据
  const fetchTransactions = React.useCallback(async () => {
    if (!currentUser || !selectedBankAccountId) return
    
    try {
      setLoading(true)
      const transactions = await getTransactionsByBankAccount(selectedBankAccountId)
      setTransactions(transactions)
      setFilteredTransactions(transactions)
      setPagination(prev => ({
        ...prev,
        totalItems: transactions.length
      }))
    } catch (error) {
      console.error("Error fetching transactions:", error)
      setError("Failed to load transactions")
    } finally {
      setLoading(false)
    }
  }, [currentUser, selectedBankAccountId])

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
      fetchTransactions()
    }
  }, [selectedBankAccountId, fetchTransactions])

  // 高级筛选和排序
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

    // 高级筛选
    if (advancedFilters.status !== "all") {
      filtered = filtered.filter(transaction => transaction.status === advancedFilters.status)
    }

    if (advancedFilters.project !== "all") {
      filtered = filtered.filter(transaction => transaction.projectid === advancedFilters.project)
    }

    if (advancedFilters.category !== "all") {
      filtered = filtered.filter(transaction => transaction.category === advancedFilters.category)
    }

    // 日期范围筛选
    if (advancedFilters.dateRange.start) {
      filtered = filtered.filter(transaction => {
        const transactionDate = typeof transaction.date === "string" 
          ? new Date(transaction.date) 
          : new Date(transaction.date.seconds * 1000)
        return transactionDate >= new Date(advancedFilters.dateRange.start)
      })
    }

    if (advancedFilters.dateRange.end) {
      filtered = filtered.filter(transaction => {
        const transactionDate = typeof transaction.date === "string" 
          ? new Date(transaction.date) 
          : new Date(transaction.date.seconds * 1000)
        return transactionDate <= new Date(advancedFilters.dateRange.end)
      })
    }

    // 金额范围筛选
    if (advancedFilters.amountRange.min) {
      const minAmount = parseFloat(advancedFilters.amountRange.min)
      filtered = filtered.filter(transaction => {
        const netAmount = (transaction.income || 0) - (transaction.expense || 0)
        return netAmount >= minAmount
      })
    }

    if (advancedFilters.amountRange.max) {
      const maxAmount = parseFloat(advancedFilters.amountRange.max)
      filtered = filtered.filter(transaction => {
        const netAmount = (transaction.income || 0) - (transaction.expense || 0)
        return netAmount <= maxAmount
      })
    }

    // 排序
    filtered.sort((a, b) => {
      let aValue: any = a[sortConfig.key]
      let bValue: any = b[sortConfig.key]

      // 处理日期字段
      if (sortConfig.key === 'date') {
        aValue = typeof aValue === "string" ? new Date(aValue) : new Date(aValue.seconds * 1000)
        bValue = typeof bValue === "string" ? new Date(bValue) : new Date(bValue.seconds * 1000)
      }

      // 处理数字字段
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortConfig.direction === 'asc' ? aValue - bValue : bValue - aValue
      }

      // 处理字符串字段
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortConfig.direction === 'asc' 
          ? aValue.localeCompare(bValue) 
          : bValue.localeCompare(aValue)
      }

      // 处理日期字段
      if (aValue instanceof Date && bValue instanceof Date) {
        return sortConfig.direction === 'asc' 
          ? aValue.getTime() - bValue.getTime() 
          : bValue.getTime() - aValue.getTime()
      }

      return 0
    })

    setFilteredTransactions(filtered)
    setPagination(prev => ({ ...prev, totalItems: filtered.length, currentPage: 1 }))
  }, [transactions, searchTerm, advancedFilters, sortConfig])

  // 获取当前页的交易
  const getCurrentPageTransactions = () => {
    const startIndex = (pagination.currentPage - 1) * pagination.pageSize
    const endIndex = startIndex + pagination.pageSize
    return filteredTransactions.slice(startIndex, endIndex)
  }

  // 处理排序
  const handleSort = (key: keyof Transaction) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }))
  }

  // 处理分页
  const handlePageChange = (page: number) => {
    setPagination(prev => ({ ...prev, currentPage: page }))
  }

  // 处理批量选择
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const allIds = new Set(getCurrentPageTransactions().map(t => t.id!))
      setSelectedTransactions(allIds)
      setIsSelectAll(true)
    } else {
      setSelectedTransactions(new Set())
      setIsSelectAll(false)
    }
  }

  // 处理单个选择
  const handleSelectTransaction = (transactionId: string, checked: boolean) => {
    const newSelected = new Set(selectedTransactions)
    if (checked) {
      newSelected.add(transactionId)
    } else {
      newSelected.delete(transactionId)
    }
    setSelectedTransactions(newSelected)
    
    // 更新全选状态
    const currentPageIds = getCurrentPageTransactions().map(t => t.id!)
    setIsSelectAll(currentPageIds.every(id => newSelected.has(id)))
  }

  // 批量删除
  const handleBatchDelete = async () => {
    if (selectedTransactions.size === 0) {
      toast({
        title: "提示",
        description: "请选择要删除的交易",
        variant: "destructive",
      })
      return
    }

    try {
      const deletePromises = Array.from(selectedTransactions).map(id => 
        deleteDocument('transactions', id)
      )
      await Promise.all(deletePromises)
      
      toast({
        title: "批量删除成功",
        description: `已删除 ${selectedTransactions.size} 笔交易`,
      })
      
      setSelectedTransactions(new Set())
      setIsSelectAll(false)
      await fetchTransactions()
    } catch (error) {
      console.error("Error batch deleting transactions:", error)
      toast({
        title: "批量删除失败",
        description: "无法删除选中的交易",
        variant: "destructive",
      })
    }
  }

  // 处理导入
  const handleImport = async (parsedTransactions: Array<{
    date: string
    description: string
    description2?: string
    expense: number
    income: number
    status: "Completed" | "Pending" | "Draft"
    payer?: string
    projectid?: string
    projectName?: string
    category?: string
    bankAccountId: string
    isValid: boolean
    errors: string[]
    isUpdate?: boolean
    originalId?: string
  }>) => {
    if (!currentUser) return

    try {
      let addedCount = 0
      let updatedCount = 0

      for (const parsedTransaction of parsedTransactions) {
        if (!parsedTransaction.isValid) continue

        const transactionData: Omit<Transaction, "id"> = {
          date: parsedTransaction.date,
          description: parsedTransaction.description,
          description2: parsedTransaction.description2,
          expense: parsedTransaction.expense,
          income: parsedTransaction.income,
          status: parsedTransaction.status,
          payer: parsedTransaction.payer,
          projectid: parsedTransaction.projectid,
          projectName: parsedTransaction.projectName,
          category: parsedTransaction.category,
          bankAccountId: parsedTransaction.bankAccountId,
          createdByUid: currentUser.uid
        }

        if (parsedTransaction.isUpdate && parsedTransaction.originalId) {
          // 更新现有交易
          await updateDocument("transactions", parsedTransaction.originalId, transactionData)
          updatedCount++
        } else {
          // 添加新交易
          await addTransactionWithBankAccount(transactionData, parsedTransaction.bankAccountId)
          addedCount++
        }
      }

      // 重新加载数据
      await fetchTransactions()
      
      toast({
        title: "成功",
        description: `已导入 ${addedCount} 笔新交易，更新 ${updatedCount} 笔交易`
      })
    } catch (err: any) {
      setError("导入交易失败: " + err.message)
      console.error("Error importing transactions:", err)
      throw err
    }
  }

  // 导出功能
  const handleExport = () => {
    const currentTransactions = getCurrentPageTransactions()
    const csvContent = generateCSV(currentTransactions)
    downloadCSV(csvContent, `transactions_${selectedBankAccountId}_${new Date().toISOString().split('T')[0]}.csv`)
    
    toast({
      title: "导出成功",
      description: `已导出 ${currentTransactions.length} 笔交易`,
    })
  }

  // 生成CSV内容
  const generateCSV = (transactions: Transaction[]) => {
    const headers = ['日期', '描述', '描述2', '支出', '收入', '净额', '状态', '付款人', '项目', '分类']
    const rows = transactions.map(t => [
      formatDate(t.date),
      t.description,
      t.description2 || '',
      t.expense || 0,
      t.income || 0,
      (t.income || 0) - (t.expense || 0),
      t.status,
      t.payer || '',
      t.projectName || '',
      t.category || ''
    ])
    
    return [headers, ...rows].map(row => 
      row.map(cell => `"${cell}"`).join(',')
    ).join('\n')
  }

  // 下载CSV文件
  const downloadCSV = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = filename
    link.click()
  }

  // 格式化日期
  const formatDate = (date: string | { seconds: number; nanoseconds: number }): string => {
    if (typeof date === "string") {
      return new Date(date).toLocaleDateString("zh-CN")
    } else {
      return new Date(date.seconds * 1000).toLocaleDateString("zh-CN")
    }
  }

  // 计算总页数
  const totalPages = Math.ceil(pagination.totalItems / pagination.pageSize)

  return (
    <div className="space-y-6">
             <div className="flex items-center justify-between">
         <div>
           <h2 className="text-3xl font-bold tracking-tight">高级银行交易管理</h2>
           <p className="text-muted-foreground">
             支持分页、排序、批量操作、导入导出、高级筛选和数据可视化
           </p>
         </div>

         {/* 银行账户选择 */}
         {bankAccounts.length > 0 && (
           <div className="flex items-center space-x-4">
             <div>
               <Label className="text-sm">选择银行账户</Label>
               <Select 
                 value={selectedBankAccountId} 
                 onValueChange={(value) => {
                   setSelectedBankAccountId(value)
                   setSelectedTransactions(new Set())
                   setIsSelectAll(false)
                 }}
               >
                 <SelectTrigger className="w-48">
                   <SelectValue />
                 </SelectTrigger>
                 <SelectContent>
                   {bankAccounts.map((account) => (
                     <SelectItem key={account.id} value={account.id!}>
                       {account.name}
                     </SelectItem>
                   ))}
                 </SelectContent>
               </Select>
             </div>
           </div>
         )}
        
        {hasPermission(RoleLevels[UserRoles.ASSISTANT_VICE_PRESIDENT]) && (
          <div className="flex items-center space-x-2">
            <Button
              onClick={() => {
                setIsEditMode(false)
                setEditingTransaction(null)
                setFormData({
                  date: new Date().toISOString().split('T')[0],
                  description: "",
                  description2: "",
                  expense: "",
                  income: "",
                  status: "Completed",
                  payer: "",
                  projectid: "",
                  projectName: "",
                  category: "",
                  bankAccountId: selectedBankAccountId
                })
                setIsFormOpen(true)
              }}
            >
              <Plus className="h-4 w-4 mr-2" />
              新增交易
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowCharts(!showCharts)}
            >
              <BarChart3 className="h-4 w-4 mr-2" />
              {showCharts ? "隐藏图表" : "显示图表"}
            </Button>
            <Button
              variant="outline"
              onClick={handleExport}
            >
              <Download className="h-4 w-4 mr-2" />
              导出
            </Button>
            <Button
              variant="outline"
              onClick={() => setIsImportOpen(true)}
            >
              <Upload className="h-4 w-4 mr-2" />
              导入
            </Button>
          </div>
        )}
      </div>

             {/* 加载状态 */}
       {loading && (
         <Card>
           <CardContent className="pt-6">
             <div className="flex items-center justify-center p-8">
               <div className="text-center">
                 <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
                 <p className="text-gray-600">加载交易数据中...</p>
               </div>
             </div>
           </CardContent>
         </Card>
       )}

       {/* 错误状态 */}
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

       {/* 高级筛选面板 */}
       <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Filter className="h-4 w-4 mr-2" />
            高级筛选
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* 搜索功能 */}
          <div className="mb-4">
            <Label>搜索交易</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="搜索描述、付款人、项目、分类..."
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

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <Label>日期范围 - 开始</Label>
              <Input
                type="date"
                value={advancedFilters.dateRange.start}
                onChange={(e) => setAdvancedFilters(prev => ({
                  ...prev,
                  dateRange: { ...prev.dateRange, start: e.target.value }
                }))}
              />
            </div>
            <div>
              <Label>日期范围 - 结束</Label>
              <Input
                type="date"
                value={advancedFilters.dateRange.end}
                onChange={(e) => setAdvancedFilters(prev => ({
                  ...prev,
                  dateRange: { ...prev.dateRange, end: e.target.value }
                }))}
              />
            </div>
            <div>
              <Label>金额范围 - 最小值</Label>
              <Input
                type="number"
                placeholder="0"
                value={advancedFilters.amountRange.min}
                onChange={(e) => setAdvancedFilters(prev => ({
                  ...prev,
                  amountRange: { ...prev.amountRange, min: e.target.value }
                }))}
              />
            </div>
            <div>
              <Label>金额范围 - 最大值</Label>
              <Input
                type="number"
                placeholder="10000"
                value={advancedFilters.amountRange.max}
                onChange={(e) => setAdvancedFilters(prev => ({
                  ...prev,
                  amountRange: { ...prev.amountRange, max: e.target.value }
                }))}
              />
            </div>
            <div>
              <Label>状态筛选</Label>
              <Select 
                value={advancedFilters.status} 
                onValueChange={(value) => setAdvancedFilters(prev => ({ ...prev, status: value }))}
              >
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
              <Select 
                value={advancedFilters.project} 
                onValueChange={(value) => setAdvancedFilters(prev => ({ ...prev, project: value }))}
              >
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
              <Select 
                value={advancedFilters.category} 
                onValueChange={(value) => setAdvancedFilters(prev => ({ ...prev, category: value }))}
              >
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
          </div>
          
          <div className="flex items-center justify-between mt-4">
            <div className="text-sm text-muted-foreground">
              找到 {filteredTransactions.length} 笔交易
            </div>
            <Button
              variant="outline"
              onClick={() => setAdvancedFilters({
                dateRange: { start: "", end: "" },
                amountRange: { min: "", max: "" },
                status: "all",
                project: "all",
                category: "all"
              })}
            >
              <Filter className="h-4 w-4 mr-2" />
              清除筛选
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 批量操作工具栏 */}
      {selectedTransactions.size > 0 && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <span className="text-sm font-medium">
                  已选择 {selectedTransactions.size} 笔交易
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedTransactions(new Set())}
                >
                  取消选择
                </Button>
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleBatchDelete}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  批量删除
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 交易表格 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>交易记录</CardTitle>
              <CardDescription>
                共 {pagination.totalItems} 笔交易，当前第 {pagination.currentPage} 页，共 {totalPages} 页
              </CardDescription>
            </div>
            
            <div className="flex items-center space-x-2">
              <Select 
                value={pagination.pageSize.toString()} 
                onValueChange={(value) => setPagination(prev => ({ 
                  ...prev, 
                  pageSize: parseInt(value),
                  currentPage: 1
                }))}
              >
                <SelectTrigger className="w-20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="20">20</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
                     {filteredTransactions.length === 0 ? (
             <div className="text-center py-8">
               <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-4" />
               <h3 className="text-lg font-medium text-gray-900 mb-2">暂无交易记录</h3>
               <p className="text-gray-600">没有找到符合条件的交易记录</p>
             </div>
           ) : (
             <div className="rounded-md border">
               <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={isSelectAll}
                      onCheckedChange={handleSelectAll}
                    />
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer"
                    onClick={() => handleSort('date')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>日期</span>
                      {sortConfig.key === 'date' && (
                        sortConfig.direction === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
                      )}
                    </div>
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer"
                    onClick={() => handleSort('description')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>描述</span>
                      {sortConfig.key === 'description' && (
                        sortConfig.direction === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
                      )}
                    </div>
                  </TableHead>
                  <TableHead>描述2</TableHead>
                  <TableHead className="text-right">支出</TableHead>
                  <TableHead className="text-right">收入</TableHead>
                  <TableHead className="text-right">净额</TableHead>
                  <TableHead 
                    className="cursor-pointer"
                    onClick={() => handleSort('status')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>状态</span>
                      {sortConfig.key === 'status' && (
                        sortConfig.direction === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
                      )}
                    </div>
                  </TableHead>
                  <TableHead>付款人</TableHead>
                  <TableHead>项目</TableHead>
                  <TableHead>分类</TableHead>
                  {hasPermission(RoleLevels[UserRoles.ASSISTANT_VICE_PRESIDENT]) && (
                    <TableHead className="w-20">操作</TableHead>
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {getCurrentPageTransactions().map((transaction) => (
                  <TableRow key={transaction.id}>
                    <TableCell>
                      <Checkbox
                        checked={selectedTransactions.has(transaction.id!)}
                        onCheckedChange={(checked) => 
                          handleSelectTransaction(transaction.id!, checked as boolean)
                        }
                      />
                    </TableCell>
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
                      <span className={(transaction.income || 0) - (transaction.expense || 0) >= 0 ? "text-green-600" : "text-red-600"}>
                        {(transaction.income || 0) - (transaction.expense || 0) >= 0 ? '+' : ''}¥{((transaction.income || 0) - (transaction.expense || 0)).toFixed(2)}
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
                            onClick={() => {/* TODO: 编辑功能 */}}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {/* TODO: 删除功能 */}}
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
           )}

                     {/* 分页控件 */}
           {totalPages > 1 && filteredTransactions.length > 0 && (
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-muted-foreground">
                显示第 {((pagination.currentPage - 1) * pagination.pageSize) + 1} - {Math.min(pagination.currentPage * pagination.pageSize, pagination.totalItems)} 条，共 {pagination.totalItems} 条
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(pagination.currentPage - 1)}
                  disabled={pagination.currentPage === 1}
                >
                  上一页
                </Button>
                <div className="flex items-center space-x-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const page = i + 1
                    return (
                      <Button
                        key={page}
                        variant={pagination.currentPage === page ? "default" : "outline"}
                        size="sm"
                        onClick={() => handlePageChange(page)}
                      >
                        {page}
                      </Button>
                    )
                  })}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(pagination.currentPage + 1)}
                  disabled={pagination.currentPage === totalPages}
                >
                  下一页
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 数据可视化 */}
      {showCharts && (
        <BankTransactionsCharts 
          transactions={transactions}
          bankAccount={bankAccounts.find(acc => acc.id === selectedBankAccountId) || null}
        />
      )}

      {/* 导入对话框 */}
      <BankTransactionsMultiAccountImportDialog
        open={isImportOpen}
        onOpenChange={setIsImportOpen}
        existingTransactions={transactions}
        bankAccounts={bankAccounts}
        selectedBankAccountId={selectedBankAccountId}
        onImport={handleImport}
      />
    </div>
  )
} 