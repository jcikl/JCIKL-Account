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
  updateTransaction, 
  getAccounts, 
  getProjects, 
  getCategories
} from "@/lib/firebase-utils"
import type { Transaction, Account, Project, BankAccount, Category } from "@/lib/data"
import { useAuth } from "@/components/auth/auth-context"
import { RoleLevels, UserRoles } from "@/lib/data"
import { useToast } from "@/hooks/use-toast"
import { BankTransactionsCharts } from "./bank-transactions-charts"
import { PasteImportDialog } from "./paste-import-dialog"

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

  // 计算单笔交易的净额
  const calculateNetAmount = React.useCallback((transaction: Transaction): number => {
    return (transaction.income || 0) - (transaction.expense || 0)
  }, [])

  // 计算累计余额
  const calculateRunningBalance = React.useCallback((transactions: Transaction[], initialBalance: number = 0): number => {
    return transactions.reduce((balance, transaction) => {
      return balance + calculateNetAmount(transaction)
    }, initialBalance)
  }, [calculateNetAmount])

  // 计算每笔交易后的累计余额
  const calculateRunningBalances = React.useCallback((transactions: Transaction[], initialBalance: number = 0): { transaction: Transaction, runningBalance: number }[] => {
    let currentBalance = initialBalance
    return transactions.map(transaction => {
      const netAmount = calculateNetAmount(transaction)
      currentBalance += netAmount
      return { transaction, runningBalance: currentBalance }
    })
  }, [calculateNetAmount])

  // 按日期排序所有交易（从最旧到最新）
  const sortedAllTransactions = [...transactions].sort((a, b) => {
    const dateA = typeof a.date === 'string' ? new Date(a.date).getTime() : new Date(a.date.seconds * 1000).getTime()
    const dateB = typeof b.date === 'string' ? new Date(b.date).getTime() : new Date(b.date.seconds * 1000).getTime()
    return dateA - dateB // 从最旧到最新排序
  })

  // 计算所有交易的总收入和总支出
  const totalIncome = transactions.reduce((sum, t) => sum + (parseFloat(t.income?.toString() || "0")), 0)
  const totalExpense = transactions.reduce((sum, t) => sum + (parseFloat(t.expense?.toString() || "0")), 0)
  const cumulativeBalance = totalIncome - totalExpense
  
  // 计算所有交易按时间顺序的累计余额
  const totalRunningBalance = calculateRunningBalance(sortedAllTransactions, initialBalance)
  
  // 缓存累计余额计算结果（性能优化）
  const runningBalancesCache = React.useMemo(() => {
    return calculateRunningBalances(sortedAllTransactions, initialBalance)
  }, [sortedAllTransactions, initialBalance, calculateRunningBalances])

  // 获取交易的累计余额（从缓存中）
  const getRunningBalance = React.useCallback((transactionId: string): number => {
    const cached = runningBalancesCache.find(item => item.transaction.id === transactionId)
    return cached ? cached.runningBalance : 0
  }, [runningBalancesCache])
  
  // 验证计算一致性
  const expectedRunningBalance = initialBalance + cumulativeBalance
  if (Math.abs(totalRunningBalance - expectedRunningBalance) > 0.01) {
    console.warn('累计余额计算不一致:', { totalRunningBalance, expectedRunningBalance })
  }

  const endingBalance = totalRunningBalance
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

  // 为筛选后的交易计算累计余额
  const getFilteredRunningBalance = React.useCallback((transactionId: string): number => {
    // 累计余额应该是：初始余额 + 到该交易为止的所有交易的累计净额
    // 无论是否有筛选条件，都应该基于所有交易计算累计余额
    
    // 首先找到目标交易
    const targetTransaction = transactions.find(t => t.id === transactionId)
    if (!targetTransaction) {
      return 0
    }

    // 获取目标交易的日期
    const targetDate = typeof targetTransaction.date === 'string' 
      ? new Date(targetTransaction.date).getTime() 
      : new Date(targetTransaction.date.seconds * 1000).getTime()

    // 计算到目标交易日期为止的所有交易的累计净额
    const transactionsUpToTarget = sortedAllTransactions.filter(transaction => {
      const transactionDate = typeof transaction.date === 'string' 
        ? new Date(transaction.date).getTime() 
        : new Date(transaction.date.seconds * 1000).getTime()
      return transactionDate <= targetDate
    })

    // 计算累计余额：初始余额 + 到该交易为止的累计净额
    const runningBalance = calculateRunningBalance(transactionsUpToTarget, initialBalance)
    
    return runningBalance
  }, [transactions, sortedAllTransactions, initialBalance, calculateRunningBalance])

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
    bankAccountId: ""
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

  // 高级筛选显示状态
  const [showAdvancedFilters, setShowAdvancedFilters] = React.useState(false)

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

    // 金额范围筛选 - 修正：使用单笔交易的净额而不是累计余额
    if (advancedFilters.amountRange.min) {
      const minAmount = parseFloat(advancedFilters.amountRange.min)
      filtered = filtered.filter(transaction => {
        const netAmount = calculateNetAmount(transaction)
        return netAmount >= minAmount
      })
    }

    if (advancedFilters.amountRange.max) {
      const maxAmount = parseFloat(advancedFilters.amountRange.max)
      filtered = filtered.filter(transaction => {
        const netAmount = calculateNetAmount(transaction)
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
  }, [transactions, searchTerm, advancedFilters, sortConfig, calculateNetAmount])

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

  // 处理编辑交易
  const handleEditTransaction = (transaction: Transaction) => {
    console.log('=== 开始编辑交易记录 ===')
    console.log('要编辑的交易记录:', transaction)
    
    setEditingTransaction(transaction)
    setIsEditMode(true)
    
    // 确定项目ID和项目名称
    let projectId = transaction.projectid || ""
    let projectName = transaction.projectName || ""
    
    // 检查是否是账户户口
    const account = accounts.find(a => a.code === transaction.projectid)
    if (account) {
      projectId = account.code
      projectName = account.name
    }
    
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
      projectid: projectId,
      projectName: projectName,
      category: transaction.category || "",
      bankAccountId: transaction.bankAccountId || selectedBankAccountId
    })
    setIsFormOpen(true)
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
      await fetchTransactions()
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
      // 确定项目名称
      let finalProjectName = formData.projectName
      if (formData.projectid) {
        // 检查是否是账户户口
        const selectedAccount = accounts.find(a => a.code === formData.projectid)
        if (selectedAccount) {
          finalProjectName = selectedAccount.name
        } else {
          // 检查是否是项目户口
          const selectedProject = projects.find(p => p.projectid === formData.projectid)
          finalProjectName = selectedProject?.name || formData.projectName
        }
      }

      const transactionData = {
        date: formData.date,
        description: formData.description,
        description2: formData.description2,
        expense: formData.expense ? parseFloat(formData.expense) : 0,
        income: formData.income ? parseFloat(formData.income) : 0,
        status: formData.status,
        payer: formData.payer,
        projectid: formData.projectid,
        projectName: finalProjectName,
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
      await fetchTransactions()
      
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
      category: "",
      bankAccountId: selectedBankAccountId || ""
    })
    setIsEditMode(false)
    setEditingTransaction(null)
  }

  // 获取可用的项目年份
  const getAvailableProjectYears = () => {
    const years = new Set<number>()
    projects.forEach(project => {
      if (project.projectid) {
        const parts = project.projectid.split('_')
        if (parts.length >= 3) {
          const year = parseInt(parts[0])
          if (!isNaN(year)) {
            years.add(year)
          }
        }
      }
    })
    return Array.from(years).sort((a, b) => b - a) // 降序排列
  }

  // 根据项目年份筛选项目
  const getFilteredProjectsByYear = (year: string) => {
    if (!year || year === "all") {
      return projects
    }
    return projects.filter(project => {
      if (project.projectid) {
        const parts = project.projectid.split('_')
        return parts.length >= 3 && parts[0] === year
      }
      return false
    })
  }

  // 按BOD分类分组项目
  const getGroupedProjects = (projectsToGroup: Project[]) => {
    const grouped: Record<string, Project[]> = {}
    projectsToGroup.forEach(project => {
      const category = project.bodCategory || '其他'
      if (!grouped[category]) {
        grouped[category] = []
      }
      grouped[category].push(project)
    })
    return grouped
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
    bankAccountId?: string
    bankAccountName?: string
    isValid: boolean
    errors: string[]
    isUpdate?: boolean
    originalId?: string
    rowNumber?: number
  }>) => {
    if (!currentUser) return

    try {
      let addedCount = 0
      let updatedCount = 0

      for (const parsedTransaction of parsedTransactions) {
        if (!parsedTransaction.isValid) continue

        // 使用传入的银行账户ID或当前选中的银行账户ID
        const bankAccountId = parsedTransaction.bankAccountId || (selectedBankAccountId || "")
        if (!bankAccountId) {
          console.error("缺少银行账户ID")
          continue
        }

        const transactionData: Omit<Transaction, "id"> = {
          date: parsedTransaction.date,
          description: parsedTransaction.description,
          description2: parsedTransaction.description2 || "",
          expense: parsedTransaction.expense,
          income: parsedTransaction.income,
          status: parsedTransaction.status,
          payer: parsedTransaction.payer || "",
          projectid: parsedTransaction.projectid || "",
          projectName: parsedTransaction.projectName || "",
          category: parsedTransaction.category || "",
          bankAccountId: bankAccountId,
          createdByUid: currentUser.uid
        }

        if (parsedTransaction.isUpdate && parsedTransaction.originalId) {
          // 更新现有交易
          await updateTransaction(parsedTransaction.originalId, transactionData)
          updatedCount++
        } else {
          // 添加新交易
          await addTransactionWithBankAccount(transactionData, bankAccountId)
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
    downloadCSV(csvContent, `transactions_${selectedBankAccountId || "unknown"}_${new Date().toISOString().split('T')[0]}.csv`)
    
    toast({
      title: "导出成功",
      description: `已导出 ${currentTransactions.length} 笔交易`,
    })
  }

  // 生成CSV内容
  const generateCSV = (transactions: Transaction[]) => {
    const headers = ['日期', '描述', '描述2', '支出', '收入', '累计余额', '状态', '付款人', '项目', '分类']
    
    // 为当前页交易计算累计余额
    const sortedTransactions = [...transactions].sort((a, b) => {
      const dateA = typeof a.date === 'string' ? new Date(a.date).getTime() : new Date(a.date.seconds * 1000).getTime()
      const dateB = typeof b.date === 'string' ? new Date(b.date).getTime() : new Date(b.date.seconds * 1000).getTime()
      return dateA - dateB // 从最旧到最新排序
    })
    
    // 计算当前页交易的累计余额
    const pageRunningBalances = calculateRunningBalances(sortedTransactions, initialBalance)
    
    const rows = transactions.map(t => {
      // 找到当前交易在排序后列表中的累计余额
      const runningBalance = pageRunningBalances.find(item => item.transaction.id === t.id)?.runningBalance || 0
      
      return [
        formatDate(t.date),
        t.description,
        t.description2 || '',
        t.expense || 0,
        t.income || 0,
        runningBalance,
        t.status,
        t.payer || '',
        t.projectName || '',
        t.category || ''
      ]
    })
    
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
         </div>

      {/* 银行账户标签页 */}
         {bankAccounts.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">银行账户</h2>
          </div>
          <Tabs value={selectedBankAccountId} onValueChange={(value) => {
                   setSelectedBankAccountId(value)
                   setSelectedTransactions(new Set())
                   setIsSelectAll(false)
          }}>
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
          </Tabs>
             </div>
      )}

      {/* 交易管理操作按钮 */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">交易管理</h2>
           </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            导出
          </Button>
          
          {hasPermission(RoleLevels[UserRoles.ASSISTANT_VICE_PRESIDENT]) && (
            <Button variant="outline" size="sm" onClick={() => setIsImportOpen(true)}>
              <Upload className="h-4 w-4 mr-2" />
              导入
            </Button>
         )}
        
        {hasPermission(RoleLevels[UserRoles.ASSISTANT_VICE_PRESIDENT]) && (
            <Button
              onClick={() => {
                setIsEditMode(false)
                setEditingTransaction(null)
                resetForm()
                setFormData(prev => ({
                  ...prev,
                  date: new Date().toISOString().split('T')[0],
                  bankAccountId: selectedBankAccountId
                }))
                setIsFormOpen(true)
              }}
            >
              <Plus className="h-4 w-4 mr-2" />
              添加交易
            </Button>
          )}

            <Button
              variant="outline"
              onClick={() => setShowCharts(!showCharts)}
            >
              <BarChart3 className="h-4 w-4 mr-2" />
              {showCharts ? "隐藏图表" : "显示图表"}
            </Button>
          </div>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
         <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">总交易数</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{transactions.length}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">总收入</CardTitle>
              <DollarSign className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                ¥{totalIncome.toFixed(2)}
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
                ¥{totalExpense.toFixed(2)}
             </div>
           </CardContent>
         </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">累计余额</CardTitle>
              <DollarSign className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${cumulativeBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {cumulativeBalance >= 0 ? '+' : ''}¥{Math.abs(cumulativeBalance).toFixed(2)}
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
                ¥{endingBalance.toFixed(2)}
              </div>
              <p className="text-xs text-muted-foreground">
                初始余额:¥{initialBalance.toFixed(2)} • 累计余额:¥{cumulativeBalance.toFixed(2)}
              </p>
            </CardContent>
          </Card>
        </div>

      {/* 项目统计部分 */}
      {projects.length > 0 && (
        <Card className="shadow-lg border-0 bg-gradient-to-br from-white to-gray-50">
          <CardHeader className="bg-gradient-to-r from-purple-50 to-indigo-50 border-b border-purple-100">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 text-purple-900">
                  <BarChart3 className="h-5 w-5" />
                  项目统计分析
                </CardTitle>
                <CardDescription className="text-purple-700">
                  按项目统计的交易情况和财务表现
                </CardDescription>
              </div>
              <Badge variant="outline" className="bg-purple-100 text-purple-700 border-purple-200">
                <PieChart className="h-3 w-3 mr-1" />
                {projects.length} 个项目
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            {/* 项目统计卡片 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              {(() => {
                const projectStats = projects.map(project => {
                  const projectTransactions = transactions.filter(t => 
                    t.projectid === project.projectid || t.projectName === project.name
                  )
                  const totalIncome = projectTransactions.reduce((sum, t) => sum + (t.income || 0), 0)
                  const totalExpense = projectTransactions.reduce((sum, t) => sum + (t.expense || 0), 0)
                  const netAmount = totalIncome - totalExpense
                  const transactionCount = projectTransactions.length
                  
                  return {
                    ...project,
                    totalIncome,
                    totalExpense,
                    netAmount,
                    transactionCount
                  }
                }).sort((a, b) => b.netAmount - a.netAmount).slice(0, 3)

                return projectStats.map((project, index) => (
                  <Card key={project.id} className="bg-gradient-to-br from-white to-gray-50 border border-gray-200 hover:shadow-md transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-sm font-medium text-gray-900 truncate">
                          {project.name}
                        </CardTitle>
                        <Badge variant={project.status === 'Active' ? 'default' : 'secondary'} className="text-xs">
                          {project.status === 'Active' ? '进行中' : project.status === 'Completed' ? '已完成' : '暂停'}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-gray-500">总收入</span>
                        <span className="text-sm font-semibold text-green-600">
                          ¥{project.totalIncome.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-gray-500">总支出</span>
                        <span className="text-sm font-semibold text-red-600">
                          ¥{project.totalExpense.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-gray-500">净额</span>
                        <span className={`text-sm font-semibold ${project.netAmount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {project.netAmount >= 0 ? '+' : ''}¥{Math.abs(project.netAmount).toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-gray-500">交易数</span>
                        <span className="text-sm font-semibold text-blue-600">
                          {project.transactionCount} 笔
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                ))
              })()}
            </div>

            {/* 项目统计表格 */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">项目详细统计</h3>
                <Badge variant="outline" className="bg-gray-100">
                  共 {projects.length} 个项目
                </Badge>
              </div>
              
              <div className="rounded-md border border-gray-200 overflow-hidden">
                <Table>
                  <TableHeader className="bg-gray-50">
                    <TableRow>
                      <TableHead className="font-semibold text-gray-900">项目名称</TableHead>
                      <TableHead className="font-semibold text-gray-900">状态</TableHead>
                      <TableHead className="font-semibold text-gray-900 text-right">总收入</TableHead>
                      <TableHead className="font-semibold text-gray-900 text-right">总支出</TableHead>
                      <TableHead className="font-semibold text-gray-900 text-right">净额</TableHead>
                      <TableHead className="font-semibold text-gray-900 text-right">交易数</TableHead>
                      <TableHead className="font-semibold text-gray-900 text-right">平均金额</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(() => {
                      const projectStats = projects.map(project => {
                        const projectTransactions = transactions.filter(t => 
                          t.projectid === project.projectid || t.projectName === project.name
                        )
                        const totalIncome = projectTransactions.reduce((sum, t) => sum + (t.income || 0), 0)
                        const totalExpense = projectTransactions.reduce((sum, t) => sum + (t.expense || 0), 0)
                        const netAmount = totalIncome - totalExpense
                        const transactionCount = projectTransactions.length
                        const avgAmount = transactionCount > 0 ? (totalIncome + totalExpense) / transactionCount : 0
                        
                        return {
                          ...project,
                          totalIncome,
                          totalExpense,
                          netAmount,
                          transactionCount,
                          avgAmount
                        }
                      }).sort((a, b) => b.netAmount - a.netAmount)

                      return projectStats.map((project) => (
                        <TableRow key={project.id} className="hover:bg-gray-50">
                          <TableCell className="font-medium text-gray-900">
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                              {project.name}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={project.status === 'Active' ? 'default' : 'secondary'} className="text-xs">
                              {project.status === 'Active' ? '进行中' : project.status === 'Completed' ? '已完成' : '暂停'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right font-semibold text-green-600">
                            ¥{project.totalIncome.toFixed(2)}
                          </TableCell>
                          <TableCell className="text-right font-semibold text-red-600">
                            ¥{project.totalExpense.toFixed(2)}
                          </TableCell>
                          <TableCell className="text-right font-semibold">
                            <span className={project.netAmount >= 0 ? 'text-green-600' : 'text-red-600'}>
                              {project.netAmount >= 0 ? '+' : ''}¥{Math.abs(project.netAmount).toFixed(2)}
                            </span>
                          </TableCell>
                          <TableCell className="text-right font-semibold text-blue-600">
                            {project.transactionCount} 笔
                          </TableCell>
                          <TableCell className="text-right font-semibold text-gray-600">
                            ¥{project.avgAmount.toFixed(2)}
                          </TableCell>
                        </TableRow>
                      ))
                    })()}
                  </TableBody>
                </Table>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

       {/* 高级筛选面板 */}
       <Card>
        <CardHeader>
            <div className="flex items-center justify-between">
          <CardTitle className="flex items-center">
            <Filter className="h-4 w-4 mr-2" />
            高级筛选
          </CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              >
                {showAdvancedFilters ? (
                  <>
                    <ChevronUp className="h-4 w-4 mr-2" />
                    收起筛选
                  </>
                ) : (
                  <>
                    <ChevronDown className="h-4 w-4 mr-2" />
                    展开筛选
                  </>
                )}
              </Button>
            </div>
        </CardHeader>
          {showAdvancedFilters && (
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
          )}
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
                  <TableHead className="text-right">累计余额</TableHead>
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
                      <span className={getFilteredRunningBalance(transaction.id!) >= 0 ? "text-green-600" : "text-red-600"}>
                        ¥{getFilteredRunningBalance(transaction.id!).toFixed(2)}
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
                            onClick={() => handleEditTransaction(transaction)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteTransaction(transaction)}
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



      {/* 编辑交易对话框 */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{isEditMode ? "编辑交易" : "新增交易"}</DialogTitle>
            <DialogDescription>
              请填写交易详情。
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleFormSubmit} className="space-y-4">
            <div>
              <Label htmlFor="date">日期</Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                required
              />
            </div>
            <div>
              <Label htmlFor="description">描述</Label>
              <Input
                id="description"
                type="text"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                required
              />
            </div>
            <div>
              <Label htmlFor="description2">描述2</Label>
              <Input
                id="description2"
                type="text"
                value={formData.description2}
                onChange={(e) => setFormData(prev => ({ ...prev, description2: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="expense">支出</Label>
                <Input
                  id="expense"
                  type="number"
                  value={formData.expense}
                  onChange={(e) => setFormData(prev => ({ ...prev, expense: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="income">收入</Label>
                <Input
                  id="income"
                  type="number"
                  value={formData.income}
                  onChange={(e) => setFormData(prev => ({ ...prev, income: e.target.value }))}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="status">状态</Label>
              <Select
                value={formData.status}
                onValueChange={(value: "Completed" | "Pending" | "Draft") => setFormData(prev => ({ ...prev, status: value }))}
              >
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
            <div>
              <Label htmlFor="payer">付款人</Label>
              <Input
                id="payer"
                type="text"
                value={formData.payer}
                onChange={(e) => setFormData(prev => ({ ...prev, payer: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="project-year">项目年份</Label>
                <Select
                  value={formData.projectid ? (() => {
                    const parts = formData.projectid.split('_')
                    return parts.length >= 3 ? parts[0] : ""
                  })() : "no-year"}
                  onValueChange={(value) => {
                    // 当项目年份改变时，清空项目户口
                    setFormData(prev => ({ 
                      ...prev, 
                      projectid: "",
                      projectName: ""
                    }))
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="选择项目年份" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="no-year">无项目年份</SelectItem>
                    {getAvailableProjectYears().map(year => (
                      <SelectItem key={year} value={year.toString()}>
                        {year}年
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="projectid">项目户口</Label>
                <Select
                  value={formData.projectid}
                  onValueChange={(value) => {
                    // 检查是否是账户户口
                    const selectedAccount = accounts.find(a => a.code === value)
                    if (selectedAccount) {
                      setFormData(prev => ({ 
                        ...prev, 
                        projectid: value,
                        projectName: selectedAccount.name
                      }))
                    } else {
                      // 检查是否是项目户口
                      const selectedProject = projects.find(p => p.projectid === value)
                      setFormData(prev => ({ 
                        ...prev, 
                        projectid: value,
                        projectName: selectedProject?.name || ""
                      }))
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="选择项目户口" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="no-project">无项目</SelectItem>
                    
                    {/* 账号户口分类 */}
                    <div className="px-2 py-1.5 text-sm font-semibold text-muted-foreground bg-blue-50 border-b">
                      账号户口
                    </div>
                    {(() => {
                      const accountGroups: Record<string, Account[]> = {}
                      accounts.forEach(account => {
                        const type = account.type
                        if (!accountGroups[type]) {
                          accountGroups[type] = []
                        }
                        accountGroups[type].push(account)
                      })
                      
                      return Object.entries(accountGroups).map(([type, typeAccounts]) => (
                        <div key={`account-${type}`}>
                          <div className="px-2 py-1.5 text-sm font-semibold text-muted-foreground bg-muted/30">
                            {type}
                          </div>
                          {typeAccounts.map((account) => (
                            <SelectItem key={`account-${account.id}`} value={account.code} className="ml-4">
                              {account.code} - {account.name}
                            </SelectItem>
                          ))}
                        </div>
                      ))
                    })()}
                    
                    {/* 项目户口分类 */}
                    <div className="px-2 py-1.5 text-sm font-semibold text-muted-foreground bg-green-50 border-b mt-2">
                      项目户口
                    </div>
                    {(() => {
                      const currentYear = formData.projectid ? (() => {
                        const parts = formData.projectid.split('_')
                        return parts.length >= 3 ? parts[0] : ""
                      })() : ""
                      
                      const filteredProjects = currentYear 
                        ? getFilteredProjectsByYear(currentYear)
                        : projects
                      
                      return Object.entries(getGroupedProjects(filteredProjects)).map(([bodCategory, projects]) => (
                        <div key={`project-${bodCategory}`}>
                          <div className="px-2 py-1.5 text-sm font-semibold text-muted-foreground bg-muted/30">
                            {bodCategory}
                          </div>
                          {projects.map((project) => (
                            <SelectItem key={`project-${project.id}`} value={project.projectid} className="ml-4">
                              {project.name}
                            </SelectItem>
                          ))}
                        </div>
                      ))
                    })()}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="category">收支类型</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="选择收支类型" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="no-category">无分类</SelectItem>
                    {categories
                      .filter(category => category.isActive)
                      .map((category) => (
                        <SelectItem key={category.id} value={category.name}>
                          {category.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label htmlFor="bankAccountId">银行账户</Label>
              <Select
                value={selectedBankAccountId}
                onValueChange={(value) => setSelectedBankAccountId(value)}
                disabled
              >
                <SelectTrigger>
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
            <Button type="submit" disabled={submitting}>
              {submitting ? "保存中..." : isEditMode ? "更新交易" : "保存交易"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* 粘贴导入对话框 */}
      <PasteImportDialog
        open={isImportOpen}
        onOpenChange={setIsImportOpen}
        existingTransactions={transactions}
        onImport={handleImport}
        selectedBankAccountId={selectedBankAccountId}
        bankAccounts={bankAccounts}
      />

      {/* 删除确认对话框 */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确定要删除此交易吗？</AlertDialogTitle>
            <AlertDialogDescription>
              此操作无法撤销。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setIsDeleteDialogOpen(false)}>取消</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>删除</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
} 