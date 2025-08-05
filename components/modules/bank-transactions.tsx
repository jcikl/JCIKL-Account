"use client"

import * as React from "react"
import { Copy, Download, FileSpreadsheet, Filter, Plus, Upload, Search, Edit, Trash2, Calendar, DollarSign, Tag, FolderOpen, Building2, CheckSquare, Square, GripVertical, TrendingUp } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import { addDocument, getTransactions, deleteDocument, updateDocument, getAccounts, getProjects, addTransactionWithSequence, reorderTransactions, autoMatchAndUpdateProjectIds, getBankAccounts, getTransactionsByBankAccount, addTransactionWithBankAccount, initializeDefaultBankAccounts } from "@/lib/firebase-utils"
import type { Transaction, Account, Project, BankAccount } from "@/lib/data"
import { useAuth } from "@/components/auth/auth-context"
import { RoleLevels, UserRoles, BODCategories } from "@/lib/data"
import { useToast } from "@/hooks/use-toast"
import { TransactionImportDialog } from "./transaction-import-dialog"
import { PasteImportDialog } from "./paste-import-dialog"
import { getCategories } from "@/lib/firebase-utils"
import { type Category } from "@/lib/data"
import { matchProjectIdByName, batchMatchProjectIds } from "@/lib/project-utils"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CreditCard } from "lucide-react"
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import {
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Pagination } from "@/lib/pagination-utils"



interface TransactionFormData {
  date: string
  description: string
  description2: string
  expense: string
  income: string
  status: "Completed" | "Pending" | "Draft"
  payer?: string // 付款人
  projectid?: string // 从 reference 改为 projectid
  projectName?: string // 项目名称
  category?: string
}

// 可排序行组件
function SortableTransactionRow({ 
  transaction, 
  runningBalance, 
  onSelect, 
  onEdit, 
  onDelete, 
  hasPermission,
  isSelected,
  formatDate,
  formatCurrency,
  isSortEditMode
}: { 
  transaction: Transaction
  runningBalance: number
  onSelect: (id: string) => void
  onEdit: (transaction: Transaction) => void
  onDelete: (id: string) => void
  hasPermission: boolean
  isSelected: boolean
  formatDate: (date: string | { seconds: number; nanoseconds: number }) => string
  formatCurrency: (amount: number, currency?: string) => string
  isSortEditMode: boolean
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ 
    id: transaction.id!,
    disabled: !isSortEditMode
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <TableRow ref={setNodeRef} style={style} key={transaction.id}>
      <TableCell>
        <div className="flex items-center gap-2">
          {isSortEditMode && (
            <div
              {...attributes}
              {...listeners}
              className="cursor-grab active:cursor-grabbing p-1 hover:bg-gray-100 rounded"
            >
              <GripVertical className="h-4 w-4 text-gray-400" />
            </div>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => transaction.id && onSelect(transaction.id)}
            className="h-6 w-6 p-0"
          >
            {isSelected ? (
              <CheckSquare className="h-4 w-4" />
            ) : (
              <Square className="h-4 w-4" />
            )}
          </Button>
        </div>
      </TableCell>
      <TableCell className="text-center font-medium text-muted-foreground">
        {transaction.sequenceNumber || '-'}
      </TableCell>
      <TableCell>
        {formatDate(transaction.date)}
      </TableCell>
      <TableCell>{transaction.description}</TableCell>
      <TableCell>{transaction.description2 || "-"}</TableCell>
      <TableCell className="text-red-600 font-medium">
        {formatCurrency(transaction.expense)}
      </TableCell>
      <TableCell className="text-green-600 font-medium">
        {formatCurrency(transaction.income)}
      </TableCell>
      <TableCell
        className={
          runningBalance >= 0 
            ? "text-green-600 font-medium" 
            : "text-red-600 font-medium"
        }
      >
        {runningBalance >= 0 ? `+${formatCurrency(runningBalance)}` : `-${formatCurrency(Math.abs(runningBalance))}`}
      </TableCell>
      <TableCell>
        <Badge variant={transaction.status === "Completed" ? "default" : "secondary"}>
          {transaction.status}
        </Badge>
      </TableCell>
      <TableCell>{transaction.payer || "-"}</TableCell>
      <TableCell>{transaction.projectName || transaction.projectid || "-"}</TableCell>
      <TableCell>{transaction.category || "-"}</TableCell>
      {hasPermission && (
        <TableCell>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                •••
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit(transaction)}>
                <Edit className="h-4 w-4 mr-2" />
                编辑
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-red-600"
                onClick={() => transaction.id && onDelete(transaction.id)}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                删除
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </TableCell>
      )}
    </TableRow>
  )
}

export function BankTransactions() {
  const { currentUser, hasPermission } = useAuth()
  const { toast } = useToast()
  const [transactions, setTransactions] = React.useState<Transaction[]>([])
  const [accounts, setAccounts] = React.useState<Account[]>([])
  const [projects, setProjects] = React.useState<Project[]>([])
  const [categories, setCategories] = React.useState<Category[]>([])
  const [filteredTransactions, setFilteredTransactions] = React.useState<Transaction[]>([])
  const [sortedTransactions, setSortedTransactions] = React.useState<Transaction[]>([])
  const [isSortEditMode, setIsSortEditMode] = React.useState(false)
  const [isImportOpen, setIsImportOpen] = React.useState(false)
  const [isPasteImportOpen, setIsPasteImportOpen] = React.useState(false)
  const [isFormOpen, setIsFormOpen] = React.useState(false)
  const [isEditMode, setIsEditMode] = React.useState(false)
  const [editingTransaction, setEditingTransaction] = React.useState<Transaction | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [searchTerm, setSearchTerm] = React.useState("")
  const [statusFilter, setStatusFilter] = React.useState("all")
  const [dateFilter, setDateFilter] = React.useState("all")
  const [accountFilter, setAccountFilter] = React.useState("all")

  const [selectedTransactions, setSelectedTransactions] = React.useState<Set<string>>(new Set())
  const [isBatchEditOpen, setIsBatchEditOpen] = React.useState(false)
  const [isBatchDeleteOpen, setIsBatchDeleteOpen] = React.useState(false)
  const [batchFormData, setBatchFormData] = React.useState({
    payer: "none",
    projectid: "none",
    category: "none"
  })
  const [batchProjectYearFilter, setBatchProjectYearFilter] = React.useState("all")
  
  // 编辑交易表单的项目年份筛选
  const [editFormProjectYearFilter, setEditFormProjectYearFilter] = React.useState("all")
  
  // 新增表格标题行筛选状态
  const [tableDateFilter, setTableDateFilter] = React.useState("")
  const [descriptionFilter, setDescriptionFilter] = React.useState("")
  const [description2Filter, setDescription2Filter] = React.useState("")
  const [expenseFilter, setExpenseFilter] = React.useState("")
  const [incomeFilter, setIncomeFilter] = React.useState("")
  const [balanceFilter, setBalanceFilter] = React.useState("")
  const [tableStatusFilter, setTableStatusFilter] = React.useState("all")
  const [payerFilter, setPayerFilter] = React.useState("")
  const [projectFilter, setProjectFilter] = React.useState("all")
  const [categoryFilter, setCategoryFilter] = React.useState("")
  
  // 新增年份月份过滤状态
  const [yearFilter, setYearFilter] = React.useState(new Date().getFullYear().toString())
  const [monthFilter, setMonthFilter] = React.useState("all")

  // 分页状态
  const [currentPage, setCurrentPage] = React.useState(1)
  const [pageSize, setPageSize] = React.useState(50)
  const [totalPages, setTotalPages] = React.useState(1)
  
  // 银行账户管理状态
  const [bankAccounts, setBankAccounts] = React.useState<BankAccount[]>([])
  const [selectedBankAccountId, setSelectedBankAccountId] = React.useState<string>("")
  const [bankAccountsLoading, setBankAccountsLoading] = React.useState(true)
  
  // 项目匹配状态
  const [isMatchingProjects, setIsMatchingProjects] = React.useState(false)
  const [matchingResults, setMatchingResults] = React.useState<{
    updatedCount: number
    matchedTransactions: Array<{
      transactionId: string
      originalProjectId: string | null
      newProjectId: string
      confidence: 'exact' | 'partial' | 'code'
    }>
  } | null>(null)
  
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  // 拖拽传感器
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  // 拖拽结束处理
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (active.id !== over?.id) {
      setSortedTransactions((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id)
        const newIndex = items.findIndex((item) => item.id === over?.id)

        return arrayMove(items, oldIndex, newIndex)
      })
    }
  }

  // 保存排序顺序
  const handleSaveOrder = async () => {
    if (!currentUser) return

    try {
      // 使用新的序号系统保存排序
      const sortedIds = sortedTransactions.map(t => t.id!).filter(Boolean)
      await reorderTransactions(sortedIds)

      await fetchTransactions()
      setIsSortEditMode(false)
      setCurrentPage(1) // 重置到第一页
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

  // 重置排序
  const handleResetOrder = () => {
    setSortedTransactions([...filteredTransactions])
    setCurrentPage(1) // 重置到第一页
    toast({
      title: "已重置",
      description: "交易顺序已重置为原始顺序"
    })
  }

  // 自动匹配项目名称到项目序号
  const handleAutoMatchProjects = async () => {
    if (!currentUser) return

    try {
      setIsMatchingProjects(true)
      setMatchingResults(null)

      // 获取所有交易记录和项目
      const allTransactions = await getTransactions()
      const allProjects = await getProjects()

      // 执行自动匹配和更新
      const results = await autoMatchAndUpdateProjectIds(allTransactions, allProjects)

      setMatchingResults(results)

      // 刷新交易记录
      await fetchTransactions()

      // 显示结果
      if (results.updatedCount > 0) {
        toast({
          title: "项目匹配完成",
          description: `成功匹配并更新了 ${results.updatedCount} 笔交易的项目序号`,
        })
      } else {
        toast({
          title: "项目匹配完成",
          description: "没有找到需要更新的交易记录",
        })
      }
    } catch (error) {
      console.error('Error auto matching projects:', error)
      toast({
        title: "项目匹配失败",
        description: `匹配过程中出错: ${error}`,
        variant: "destructive",
      })
    } finally {
      setIsMatchingProjects(false)
    }
  }

  // 预览项目匹配结果
  const handlePreviewProjectMatch = () => {
    if (!transactions.length || !projects.length) {
      toast({
        title: "无法预览",
        description: "没有交易记录或项目数据",
        variant: "destructive",
      })
      return
    }

    const results = batchMatchProjectIds(transactions, projects)
    const matchedCount = results.filter(r => r.matchedProjectId).length

    if (matchedCount > 0) {
      toast({
        title: "匹配预览",
        description: `找到 ${matchedCount} 笔交易可以匹配到项目序号`,
      })
    } else {
      toast({
        title: "匹配预览",
        description: "没有找到可以匹配的交易记录",
      })
    }
  }

  // Form state
  const [formData, setFormData] = React.useState<TransactionFormData>({
    date: new Date().toISOString().split("T")[0],
    description: "",
    description2: "",
    expense: "",
    income: "",
    status: "Pending",
    projectid: "",
    category: ""
  })

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

  const fetchAccounts = React.useCallback(async () => {
    try {
      const fetched = await getAccounts()
      setAccounts(fetched)
    } catch (err: any) {
      console.error("Error fetching accounts:", err)
    }
  }, [])

  const fetchProjects = React.useCallback(async () => {
    try {
      const fetched = await getProjects()
      setProjects(fetched)
    } catch (err: any) {
      console.error("Error fetching projects:", err)
    }
  }, [])

  const fetchCategories = React.useCallback(async () => {
    try {
      const fetched = await getCategories()
      setCategories(fetched)
    } catch (err: any) {
      console.error("Error fetching categories:", err)
    }
  }, [])

  React.useEffect(() => {
    fetchTransactions()
    fetchAccounts()
    fetchProjects()
    fetchCategories()
  }, [fetchTransactions, fetchAccounts, fetchProjects, fetchCategories])

  // 加载银行账户
  React.useEffect(() => {
    if (currentUser) {
      loadBankAccounts()
    }
  }, [currentUser])

  // 当选择的银行账户改变时，重新加载交易
  React.useEffect(() => {
    if (selectedBankAccountId) {
      loadTransactionsByBankAccount(selectedBankAccountId)
    }
  }, [selectedBankAccountId])

  // 计算交易净额
  const calculateNetAmount = (transaction: Transaction): number => {
    return transaction.income - transaction.expense
  }

  // 格式化净额显示
  const formatNetAmount = (transaction: Transaction): string => {
    const netAmount = calculateNetAmount(transaction)
    return netAmount >= 0 ? `+$${netAmount.toFixed(2)}` : `-$${Math.abs(netAmount).toFixed(2)}`
  }

  // 计算累计余额
  const calculateRunningBalance = (transactions: Transaction[], initialBalance: number = 0): number => {
    return transactions.reduce((balance, transaction) => {
      return balance + calculateNetAmount(transaction)
    }, initialBalance)
  }

  // 计算每笔交易后的累计余额
  const calculateRunningBalances = (transactions: Transaction[], initialBalance: number = 0): { transaction: Transaction, runningBalance: number }[] => {
    let currentBalance = initialBalance
    return transactions.map(transaction => {
      const netAmount = calculateNetAmount(transaction)
      currentBalance += netAmount
      return { transaction, runningBalance: currentBalance }
    })
  }




  // Format date to "d mmm yyyy" format
  const formatDate = (date: string | { seconds: number; nanoseconds: number }): string => {
    if (typeof date === 'string') {
      return new Date(date).toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      })
    } else if (date?.seconds) {
      return new Date(date.seconds * 1000).toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      })
    }
    return 'N/A'
  }

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

  // Get project category for a transaction


  // Batch operations
  const handleSelectTransaction = (transactionId: string) => {
    const newSelected = new Set(selectedTransactions)
    if (newSelected.has(transactionId)) {
      newSelected.delete(transactionId)
    } else {
      newSelected.add(transactionId)
    }
    setSelectedTransactions(newSelected)
  }

  const handleSelectAll = () => {
    if (selectedTransactions.size === filteredTransactions.length) {
      setSelectedTransactions(new Set())
    } else {
      setSelectedTransactions(new Set(filteredTransactions.map(t => t.id!).filter(Boolean)))
    }
  }

  const handleBatchUpdate = async () => {
    if (!currentUser || selectedTransactions.size === 0) return

    try {
      console.log('=== 批量更新交易记录开始 ===')
      console.log('当前用户:', currentUser.uid)
      console.log('选中的交易数量:', selectedTransactions.size)
      console.log('选中的交易ID列表:', Array.from(selectedTransactions))
      console.log('批量表单数据:', batchFormData)
      
      const updateData: any = {}
      
      if (batchFormData.payer !== "none") {
        updateData.payer = batchFormData.payer === "empty" ? "" : batchFormData.payer
      }
      if (batchFormData.projectid !== "none") {
        if (batchFormData.projectid === "empty") {
          updateData.projectid = ""
          updateData.projectName = ""
        } else {
          updateData.projectid = batchFormData.projectid
          updateData.projectName = extractProjectName(batchFormData.projectid)
        }
      }
      if (batchFormData.category !== "none") {
        updateData.category = batchFormData.category === "empty" ? "" : batchFormData.category
      }

      console.log('=== 构建的批量更新数据 ===')
      console.log('更新数据:', updateData)
      console.log('更新数据键值:', Object.keys(updateData))

      if (Object.keys(updateData).length === 0) {
        console.log('没有要更新的数据，操作取消')
        toast({
          title: "警告",
          description: "请至少选择一个字段进行更新",
          variant: "destructive"
        })
        return
      }

      console.log('=== 开始批量更新 ===')
      let updatedCount = 0
      for (const transactionId of selectedTransactions) {
        console.log(`正在更新交易ID: ${transactionId}`)
        await updateDocument("transactions", transactionId, updateData)
        updatedCount++
        console.log(`交易ID ${transactionId} 更新完成，已更新 ${updatedCount} 笔`)
      }

      console.log('=== 批量更新完成，开始刷新数据 ===')
      await fetchTransactions()
      console.log('数据刷新完成')
      setSelectedTransactions(new Set())
      setIsBatchEditOpen(false)
      setBatchFormData({ payer: "none", projectid: "none", category: "none" })
      setBatchProjectYearFilter("all")
      
      console.log('=== 批量更新交易记录流程结束 ===')
      console.log(`总共更新了 ${updatedCount} 笔交易`)
      
      toast({
        title: "成功",
        description: `已批量更新 ${updatedCount} 笔交易`
      })
    } catch (err: any) {
      console.error('=== 批量更新交易记录失败 ===')
      console.error('错误详情:', err)
      console.error('错误消息:', err.message)
      console.error('错误堆栈:', err.stack)
      setError("批量更新失败: " + err.message)
      console.error("Error batch updating transactions:", err)
    }
  }

  // 批量删除处理
  // 获取可用的项目年份
  const getAvailableProjectYears = () => {
    const years = new Set<string>()
    projects.forEach(project => {
      const projectYear = project.projectid.split('_')[0]
      if (projectYear && !isNaN(parseInt(projectYear))) {
        years.add(projectYear)
      }
    })
    return Array.from(years).sort((a, b) => parseInt(b) - parseInt(a)) // 降序排列
  }

  // 根据年份筛选项目（用于批量编辑）
  const getFilteredProjects = () => {
    let filteredProjects = projects
    
    if (batchProjectYearFilter !== "all") {
      filteredProjects = projects.filter(project => {
        const projectYear = project.projectid.split('_')[0]
        return projectYear === batchProjectYearFilter
      })
    }
    
    // 按项目代码排序
    return filteredProjects.sort((a, b) => {
      // 首先按年份排序（降序）
      const yearA = a.projectid.split('_')[0]
      const yearB = b.projectid.split('_')[0]
      if (yearA !== yearB) {
        return parseInt(yearB) - parseInt(yearA)
      }
      
      // 然后按项目代码排序（升序）
      return a.projectid.localeCompare(b.projectid)
    })
  }

  // 根据年份筛选项目（用于编辑交易表单）
  const getEditFormFilteredProjects = () => {
    let filteredProjects = projects
    
    if (editFormProjectYearFilter !== "all") {
      filteredProjects = projects.filter(project => {
        const projectYear = project.projectid.split('_')[0]
        return projectYear === editFormProjectYearFilter
      })
    }
    
    // 按项目代码排序
    return filteredProjects.sort((a, b) => {
      // 首先按年份排序（降序）
      const yearA = a.projectid.split('_')[0]
      const yearB = b.projectid.split('_')[0]
      if (yearA !== yearB) {
        return parseInt(yearB) - parseInt(yearA)
      }
      
      // 然后按项目代码排序（升序）
      return a.projectid.localeCompare(b.projectid)
    })
  }

  // 按BOD分类分组项目
  const getGroupedProjects = (projectsToGroup: Project[]) => {
    const grouped: { [key: string]: Project[] } = {}
    
    projectsToGroup.forEach(project => {
      const bodCategory = project.bodCategory
      const bodDisplayName = BODCategories[bodCategory]
      
      if (!grouped[bodDisplayName]) {
        grouped[bodDisplayName] = []
      }
      grouped[bodDisplayName].push(project)
    })
    
    return grouped
  }

  // 获取可用的项目户口列表（用于筛选）
  const getAvailableProjects = () => {
    const projectIds = new Set<string>()
    transactions.forEach(transaction => {
      if (transaction.projectid && transaction.projectid.trim()) {
        projectIds.add(transaction.projectid)
      }
    })
    return Array.from(projectIds).sort()
  }

  // 从项目ID中提取项目名称
  const extractProjectName = (projectId: string): string => {
    const parts = projectId.split('_')
    if (parts.length >= 3) {
      return parts.slice(2).join('_') // 项目名称是第三部分开始
    } else if (parts.length >= 2) {
      return projectId // 如果没有项目名称部分，使用整个ID
    }
    return projectId
  }

  // 获取按BOD分组的项目列表（用于筛选下拉框）
  const getGroupedAvailableProjects = () => {
    const projectIds = new Set<string>()
    transactions.forEach(transaction => {
      if (transaction.projectid && transaction.projectid.trim()) {
        projectIds.add(transaction.projectid)
      }
    })
    
    // 将项目ID转换为项目对象，以便按BOD分组
    const projectObjects = Array.from(projectIds).map(projectId => {
      // 从项目ID中提取BOD分类和项目名称
      const parts = projectId.split('_')
      if (parts.length >= 3) {
        const bodCategory = parts[1] as keyof typeof BODCategories
        const projectName = parts.slice(2).join('_') // 项目名称是第三部分开始
        return {
          id: projectId,
          projectid: projectId,
          bodCategory: bodCategory,
          name: projectName,
          budget: 0,
          remaining: 0,
          status: "Active" as const
        }
      } else if (parts.length >= 2) {
        const bodCategory = parts[1] as keyof typeof BODCategories
        return {
          id: projectId,
          projectid: projectId,
          bodCategory: bodCategory,
          name: projectId, // 如果没有项目名称部分，使用整个ID
          budget: 0,
          remaining: 0,
          status: "Active" as const
        }
      }
      return {
        id: projectId,
        projectid: projectId,
        bodCategory: 'P' as keyof typeof BODCategories, // 默认分类
        name: projectId,
        budget: 0,
        remaining: 0,
        status: "Active" as const
      }
    })
    
    return getGroupedProjects(projectObjects)
  }

  const handleBatchDelete = async () => {
    if (!currentUser || selectedTransactions.size === 0) return

    try {
      let deletedCount = 0
      for (const transactionId of selectedTransactions) {
        await deleteDocument("transactions", transactionId)
        deletedCount++
      }

      await fetchTransactions()
      setSelectedTransactions(new Set())
      setIsBatchDeleteOpen(false)
      
      toast({
        title: "成功",
        description: `已批量删除 ${deletedCount} 笔交易`
      })
    } catch (err: any) {
      setError("批量删除失败: " + err.message)
      console.error("Error batch deleting transactions:", err)
    }
  }

  // Filter transactions based on search and filters
  React.useEffect(() => {
    let filtered = transactions

    // 年份月份过滤
    if (yearFilter && monthFilter) {
      const selectedYear = parseInt(yearFilter)
      const selectedMonth = parseInt(monthFilter)
      
      filtered = filtered.filter(transaction => {
        const transactionDate = typeof transaction.date === 'string' 
          ? new Date(transaction.date) 
          : new Date(transaction.date.seconds * 1000)
        
        // 如果选择的是全年（monthFilter为"all"），只过滤年份
        if (monthFilter === "all") {
          return transactionDate.getFullYear() === selectedYear
        }
        
        // 否则过滤特定年份和月份
        return transactionDate.getFullYear() === selectedYear && 
               transactionDate.getMonth() + 1 === selectedMonth
      })
    }

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(transaction =>
        transaction.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (transaction.description2 && transaction.description2.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (transaction.payer && transaction.payer.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (transaction.projectid && transaction.projectid.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (transaction.projectName && transaction.projectName.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (transaction.category && transaction.category.toLowerCase().includes(searchTerm.toLowerCase()))
      )
    }

    // Table header filters
    if (tableDateFilter) {
      filtered = filtered.filter(transaction => {
        const transactionDate = typeof transaction.date === 'string' 
          ? new Date(transaction.date) 
          : new Date(transaction.date.seconds * 1000)
        const formattedDate = transactionDate.toLocaleDateString('en-GB', {
          day: 'numeric',
          month: 'short',
          year: 'numeric'
        })
        return formattedDate.toLowerCase().includes(tableDateFilter.toLowerCase())
      })
    }

    if (descriptionFilter) {
      filtered = filtered.filter(transaction => 
        transaction.description.toLowerCase().includes(descriptionFilter.toLowerCase())
      )
    }

    if (description2Filter) {
      filtered = filtered.filter(transaction => 
        transaction.description2 && transaction.description2.toLowerCase().includes(description2Filter.toLowerCase())
      )
    }

    if (expenseFilter) {
      filtered = filtered.filter(transaction => 
        transaction.expense.toString().includes(expenseFilter)
      )
    }

    if (incomeFilter) {
      filtered = filtered.filter(transaction => 
        transaction.income.toString().includes(incomeFilter)
      )
    }

    if (balanceFilter) {
      filtered = filtered.filter(transaction => {
        const netAmount = formatNetAmount(transaction)
        return netAmount.toLowerCase().includes(balanceFilter.toLowerCase())
      })
    }

    if (tableStatusFilter !== "all") {
      filtered = filtered.filter(transaction => transaction.status === tableStatusFilter)
    }

    if (payerFilter) {
      filtered = filtered.filter(transaction => 
        transaction.payer && transaction.payer.toLowerCase().includes(payerFilter.toLowerCase())
      )
    }

    if (projectFilter !== "all") {
      if (projectFilter === "-") {
        // 筛选无项目户口的交易（projectid为空、null、undefined或"-"）
        filtered = filtered.filter(transaction => 
          !transaction.projectid || 
          transaction.projectid.trim() === "" || 
          transaction.projectid === "-"
        )
      } else {
        // 筛选特定项目户口的交易
        filtered = filtered.filter(transaction => 
          transaction.projectid === projectFilter
        )
      }
    }

    if (categoryFilter) {
      filtered = filtered.filter(transaction => 
        transaction.category && transaction.category.toLowerCase().includes(categoryFilter.toLowerCase())
      )
    }

    setFilteredTransactions(filtered)
    setSortedTransactions(filtered)
  }, [transactions, yearFilter, monthFilter, searchTerm, tableDateFilter, descriptionFilter, description2Filter, expenseFilter, incomeFilter, balanceFilter, tableStatusFilter, payerFilter, projectFilter, categoryFilter])

  const resetForm = () => {
    setFormData({
      date: new Date().toISOString().split("T")[0],
      description: "",
      description2: "",
      expense: "",
      income: "",
      status: "Pending",
      payer: "",
      projectid: "none",
      category: "none"
    })
    setEditFormProjectYearFilter("all") // 重置年份筛选
  }

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentUser) return

    try {
      console.log('=== 交易记录编辑/添加开始 ===')
      console.log('当前用户:', currentUser.uid)
      console.log('编辑模式:', isEditMode)
      console.log('编辑中的交易ID:', editingTransaction?.id)
      console.log('原始表单数据:', formData)
      
      const expense = parseFloat(formData.expense) || 0
      const income = parseFloat(formData.income) || 0
      
      if (expense < 0 || income < 0) {
        toast({
          title: "错误",
          description: "金额不能为负数",
          variant: "destructive"
        })
        return
      }

      const netAmount = income - expense
      
      // 确保日期格式为 yyyy-mm-dd
      let dateStr = formData.date
      if (dateStr) {
        // 尝试解析不同格式的日期
        let date: Date | null = null
        
        // 检查是否已经是 yyyy-mm-dd 格式
        if (/^\d{4}-\d{1,2}-\d{1,2}$/.test(dateStr)) {
          date = new Date(dateStr)
        }
        // 检查是否是 yyyy/mm/dd 格式
        else if (/^\d{4}\/\d{1,2}\/\d{1,2}$/.test(dateStr)) {
          const parts = dateStr.split('/')
          date = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]))
        }
        // 检查是否是 dd/mm/yyyy 格式
        else if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(dateStr)) {
          const parts = dateStr.split('/')
          date = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]))
        }
        // 检查是否是 mm/dd/yyyy 格式
        else if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(dateStr)) {
          const parts = dateStr.split('/')
          date = new Date(parseInt(parts[2]), parseInt(parts[0]) - 1, parseInt(parts[1]))
        }
        // 尝试通用解析
        else {
          date = new Date(dateStr)
        }
        
        if (date && !isNaN(date.getTime())) {
          dateStr = date.toISOString().split("T")[0] // 格式化为 yyyy-mm-dd
        } else {
          dateStr = new Date().toISOString().split("T")[0] // 使用当前日期作为默认值
        }
      }
      
      // 构建交易数据，只包含有值的字段
      const transactionData: any = {
        date: dateStr,
        description: formData.description,
        expense: expense,
        income: income,
        status: formData.status,
        createdByUid: currentUser.uid
      }

      // 只有当description2有值时才添加
      if (formData.description2 && formData.description2.trim()) {
        transactionData.description2 = formData.description2
      }

      // 只有当payer有值时才添加
      if (formData.payer && formData.payer.trim()) {
        transactionData.payer = formData.payer
      }

      // 只有当projectid有值且不是"none"时才添加
      if (formData.projectid && formData.projectid !== "none" && formData.projectid.trim()) {
        transactionData.projectid = formData.projectid
        // 同时设置项目名称
        transactionData.projectName = extractProjectName(formData.projectid)
      }

      // 只有当category有值且不是"none"时才添加
      if (formData.category && formData.category !== "none" && formData.category.trim()) {
        transactionData.category = formData.category
      }

      // 添加银行账户信息
      if (selectedBankAccountId) {
        transactionData.bankAccountId = selectedBankAccountId
        const selectedAccount = bankAccounts.find(acc => acc.id === selectedBankAccountId)
        transactionData.bankAccountName = selectedAccount?.name || ""
      }

      console.log('=== 构建的交易数据 ===')
      console.log('处理后的交易数据:', transactionData)
      console.log('日期格式:', dateStr)
      console.log('支出金额:', expense)
      console.log('收入金额:', income)
      console.log('净金额:', income - expense)
      console.log('状态:', formData.status)
      console.log('项目ID:', formData.projectid)
      console.log('分类:', formData.category)
      console.log('银行账户ID:', selectedBankAccountId)

      if (isEditMode && editingTransaction?.id) {
        console.log('=== 更新交易记录 ===')
        console.log('更新交易ID:', editingTransaction.id)
        console.log('更新数据:', transactionData)
        await updateDocument("transactions", editingTransaction.id, transactionData)
        console.log('交易更新完成')
        toast({
          title: "成功",
          description: "交易已更新"
        })
      } else {
        console.log('=== 添加新交易记录 ===')
        console.log('添加数据:', transactionData)
        
        if (selectedBankAccountId) {
          // 使用银行账户专用函数添加交易
          await addTransactionWithBankAccount(transactionData, selectedBankAccountId)
          console.log('交易添加完成（关联到银行账户）')
          toast({
            title: "成功",
            description: "交易已添加并关联到银行账户"
          })
        } else {
          // 使用原有的序号系统添加交易
          await addTransactionWithSequence(transactionData)
          console.log('交易添加完成')
          toast({
            title: "成功",
            description: "交易已添加并分配序号"
          })
        }
      }

      console.log('=== 操作完成，开始刷新数据 ===')
      if (selectedBankAccountId) {
        await loadTransactionsByBankAccount(selectedBankAccountId)
      } else {
        await fetchTransactions()
      }
      console.log('数据刷新完成')
      setIsFormOpen(false)
      setIsEditMode(false)
      setEditingTransaction(null)
      resetForm()
      console.log('=== 交易记录编辑/添加流程结束 ===')
    } catch (err: any) {
      console.error('=== 交易记录操作失败 ===')
      console.error('错误详情:', err)
      console.error('错误消息:', err.message)
      console.error('错误堆栈:', err.stack)
      toast({
        title: "错误",
        description: "保存交易失败: " + err.message,
        variant: "destructive"
      })
    }
  }

  const handleEditTransaction = (transaction: Transaction) => {
    console.log('=== 开始编辑交易记录 ===')
    console.log('要编辑的交易记录:', transaction)
    console.log('交易ID:', transaction.id)
    console.log('交易日期:', transaction.date)
    console.log('交易描述:', transaction.description)
    console.log('交易描述2:', transaction.description2)
    console.log('支出金额:', transaction.expense)
    console.log('收入金额:', transaction.income)
    console.log('交易状态:', transaction.status)
    console.log('项目ID:', transaction.projectid)
    console.log('分类:', transaction.category)
    console.log('序号:', transaction.sequenceNumber)
    
    setEditingTransaction(transaction)
    
    // 确保日期格式为 yyyy-mm-dd
    let dateStr = typeof transaction.date === 'string' ? transaction.date : new Date(transaction.date.seconds * 1000).toISOString().split("T")[0]
    if (dateStr) {
      // 尝试解析不同格式的日期
      let date: Date | null = null
      
      // 检查是否已经是 yyyy-mm-dd 格式
      if (/^\d{4}-\d{1,2}-\d{1,2}$/.test(dateStr)) {
        date = new Date(dateStr)
      }
      // 检查是否是 yyyy/mm/dd 格式
      else if (/^\d{4}\/\d{1,2}\/\d{1,2}$/.test(dateStr)) {
        const parts = dateStr.split('/')
        date = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]))
      }
      // 检查是否是 dd/mm/yyyy 格式
      else if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(dateStr)) {
        const parts = dateStr.split('/')
        date = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]))
      }
      // 检查是否是 mm/dd/yyyy 格式
      else if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(dateStr)) {
        const parts = dateStr.split('/')
        date = new Date(parseInt(parts[2]), parseInt(parts[0]) - 1, parseInt(parts[1]))
      }
      // 尝试通用解析
      else {
        date = new Date(dateStr)
      }
      
      if (date && !isNaN(date.getTime())) {
        dateStr = date.toISOString().split("T")[0] // 格式化为 yyyy-mm-dd
      } else {
        dateStr = new Date().toISOString().split("T")[0] // 使用当前日期作为默认值
      }
    }
    
    const formDataToSet = {
      date: dateStr,
      description: transaction.description,
      description2: transaction.description2 || "",
      expense: transaction.expense.toString(),
      income: transaction.income.toString(),
      status: transaction.status,
      payer: transaction.payer || "",
      projectid: transaction.projectid || "none",
      projectName: transaction.projectName || "",
      category: transaction.category || "none"
    }
    
    console.log('=== 设置表单数据 ===')
    console.log('处理后的表单数据:', formDataToSet)
    console.log('日期字符串:', dateStr)
    console.log('描述:', transaction.description)
    console.log('描述2:', transaction.description2 || "")
    console.log('支出字符串:', transaction.expense.toString())
    console.log('收入字符串:', transaction.income.toString())
    console.log('状态:', transaction.status)
    console.log('项目ID:', transaction.projectid || "none")
    console.log('分类:', transaction.category || "none")
    
    setFormData(formDataToSet)
    
    // 根据当前交易的项目设置年份筛选
    if (transaction.projectid) {
      const project = projects.find(p => p.name === transaction.projectid)
      if (project) {
        const projectYear = project.projectid.split('_')[0]
        if (projectYear && !isNaN(parseInt(projectYear))) {
          setEditFormProjectYearFilter(projectYear)
        } else {
          setEditFormProjectYearFilter("all")
        }
      } else {
        setEditFormProjectYearFilter("all")
      }
    } else {
      setEditFormProjectYearFilter("all")
    }
    
    setIsEditMode(true)
    setIsFormOpen(true)
    console.log('=== 编辑模式设置完成 ===')
    console.log('编辑模式状态:', true)
    console.log('表单打开状态:', true)
    console.log('编辑中的交易:', transaction)
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file && currentUser) {
      const reader = new FileReader()
      reader.onload = async (e) => {
        const text = e.target?.result as string
        await processCsvData(text)
      }
      reader.readAsText(file)
    }
  }

  const processCsvData = async (csvText: string) => {
    if (!currentUser) return
    const lines = csvText.trim().split("\n")
    const newTransactionsData: Omit<Transaction, "id">[] = lines.slice(1).map((line) => {
      const values = line.split(",").map((v) => v.trim().replace(/"/g, ""))
      const expense = Number.parseFloat(values[3] || "0")
      const income = Number.parseFloat(values[4] || "0")
      const netAmount = income - expense
      
      // 确保日期格式为 yyyy-mm-dd
      let dateStr = values[0] || new Date().toISOString().split("T")[0]
      if (dateStr) {
        // 尝试解析不同格式的日期
        let date: Date | null = null
        
        // 检查是否已经是 yyyy-mm-dd 格式
        if (/^\d{4}-\d{1,2}-\d{1,2}$/.test(dateStr)) {
          date = new Date(dateStr)
        }
        // 检查是否是 "DD Mon YYYY" 格式 (如 "5 Feb 2025")
        else if (/^\d{1,2}\s+[A-Za-z]{3}\s+\d{4}$/.test(dateStr)) {
          const months: { [key: string]: number } = {
            'Jan': 0, 'Feb': 1, 'Mar': 2, 'Apr': 3,
            'May': 4, 'Jun': 5, 'Jul': 6, 'Aug': 7,
            'Sep': 8, 'Oct': 9, 'Nov': 10, 'Dec': 11
          }
          const parts = dateStr.split(' ')
          const day = parseInt(parts[0])
          const month = months[parts[1]]
          const year = parseInt(parts[2])
          if (month !== undefined) {
            date = new Date(year, month, day)
          }
        }
        // 检查是否是 yyyy/mm/dd 格式
        else if (/^\d{4}\/\d{1,2}\/\d{1,2}$/.test(dateStr)) {
          const parts = dateStr.split('/')
          date = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]))
        }
        // 检查是否是 dd/mm/yyyy 格式
        else if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(dateStr)) {
          const parts = dateStr.split('/')
          date = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]))
        }
        // 检查是否是 mm/dd/yyyy 格式
        else if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(dateStr)) {
          const parts = dateStr.split('/')
          date = new Date(parseInt(parts[2]), parseInt(parts[0]) - 1, parseInt(parts[1]))
        }
        // 尝试通用解析
        else {
          date = new Date(dateStr)
        }
        
        if (date && !isNaN(date.getTime())) {
          dateStr = date.toISOString().split("T")[0] // 格式化为 yyyy-mm-dd
        } else {
          dateStr = new Date().toISOString().split("T")[0] // 使用当前日期作为默认值
        }
      }
      
      // 构建交易数据，只包含有值的字段
      const transactionData: any = {
        date: dateStr,
        description: values[1] || "Imported Transaction",
        expense: expense,
        income: income,
        status: "Pending",
        createdByUid: currentUser.uid,
      }

      // 只有当description2有值时才添加
      if (values[2] && values[2].trim()) {
        transactionData.description2 = values[2]
      }

      // 添加银行账户信息
      if (selectedBankAccountId) {
        transactionData.bankAccountId = selectedBankAccountId
        const selectedAccount = bankAccounts.find(acc => acc.id === selectedBankAccountId)
        transactionData.bankAccountName = selectedAccount?.name || ""
      }

      return transactionData
    })

    try {
      for (const data of newTransactionsData) {
        // 根据是否选中银行账户选择不同的添加方式
        if (selectedBankAccountId) {
          // 使用银行账户专用函数添加交易
          await addTransactionWithBankAccount(data, selectedBankAccountId)
        } else {
          // 使用序号系统添加新交易
          await addTransactionWithSequence(data)
        }
      }
      
      // 根据当前选中的银行账户刷新数据
      if (selectedBankAccountId) {
        await loadTransactionsByBankAccount(selectedBankAccountId)
      } else {
        await fetchTransactions()
      }
      
      setIsImportOpen(false)
      toast({
        title: "成功",
        description: `已导入 ${newTransactionsData.length} 笔交易${selectedBankAccountId ? ` 到 ${bankAccounts.find(acc => acc.id === selectedBankAccountId)?.name}` : ' 并分配序号'}`
      })
    } catch (err: any) {
      setError("导入交易失败: " + err.message)
      console.error("Error importing transactions:", err)
    }
  }

  const handleImportTransactions = async (parsedTransactions: Array<{
    date: string
    description: string
    description2?: string
    expense: number
    income: number
    status: "Completed" | "Pending" | "Draft"
    payer?: string
    projectid?: string
    category?: string
    isValid: boolean
    errors: string[]
    isUpdate?: boolean
  }>) => {
    if (!currentUser) return

    try {
      let addedCount = 0
      let updatedCount = 0

      for (const parsed of parsedTransactions) {
        if (!parsed.isValid) continue

        const netAmount = parsed.income - parsed.expense
        
        // 确保日期格式为 yyyy-mm-dd
        let dateStr = parsed.date
        if (dateStr) {
          // 尝试解析不同格式的日期
          let date: Date | null = null
          
          // 检查是否已经是 yyyy-mm-dd 格式
          if (/^\d{4}-\d{1,2}-\d{1,2}$/.test(dateStr)) {
            date = new Date(dateStr)
          }
          // 检查是否是 yyyy/mm/dd 格式
          else if (/^\d{4}\/\d{1,2}\/\d{1,2}$/.test(dateStr)) {
            const parts = dateStr.split('/')
            date = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]))
          }
          // 检查是否是 dd/mm/yyyy 格式
          else if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(dateStr)) {
            const parts = dateStr.split('/')
            date = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]))
          }
          // 检查是否是 mm/dd/yyyy 格式
          else if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(dateStr)) {
            const parts = dateStr.split('/')
            date = new Date(parseInt(parts[2]), parseInt(parts[0]) - 1, parseInt(parts[1]))
          }
          // 处理 "DD Mon YYYY" 格式 (如 "1 Jul 2023")
          else if (/^\d{1,2}\s+[A-Za-z]{3}\s+\d{4}$/.test(dateStr)) {
            date = new Date(dateStr)
          }
          // 尝试通用解析
          else {
            date = new Date(dateStr)
          }
          
          if (date && !isNaN(date.getTime())) {
            // 使用本地时区格式化日期，避免时区偏移问题
            const year = date.getFullYear()
            const month = String(date.getMonth() + 1).padStart(2, '0')
            const day = String(date.getDate()).padStart(2, '0')
            dateStr = `${year}-${month}-${day}`
          } else {
            // 使用当前日期作为默认值
            const now = new Date()
            const year = now.getFullYear()
            const month = String(now.getMonth() + 1).padStart(2, '0')
            const day = String(now.getDate()).padStart(2, '0')
            dateStr = `${year}-${month}-${day}`
          }
        }
        
        // 构建交易数据，只包含有值的字段
        const transactionData: any = {
          date: dateStr,
          description: parsed.description,
          expense: parsed.expense,
          income: parsed.income,
          status: parsed.status,
          createdByUid: currentUser.uid,
        }

        // 只有当description2有值时才添加
        if (parsed.description2 && parsed.description2.trim()) {
          transactionData.description2 = parsed.description2
        }

        // 只有当payer有值时才添加
        if (parsed.payer && parsed.payer.trim()) {
          transactionData.payer = parsed.payer
        }

        // 只有当projectid有值时才添加
        if (parsed.projectid && parsed.projectid.trim()) {
          transactionData.projectid = parsed.projectid
          // 同时设置项目名称
          transactionData.projectName = extractProjectName(parsed.projectid)
        }

        // 只有当category有值时才添加
        if (parsed.category && parsed.category.trim()) {
          transactionData.category = parsed.category
        }

        // 添加银行账户信息
        if (selectedBankAccountId) {
          transactionData.bankAccountId = selectedBankAccountId
          const selectedAccount = bankAccounts.find(acc => acc.id === selectedBankAccountId)
          transactionData.bankAccountName = selectedAccount?.name || ""
        }

        if (parsed.isUpdate) {
          // 查找现有交易进行更新
          const existingTransaction = transactions.find(t => 
            t.date === parsed.date && 
            t.description === parsed.description && 
            t.expense === parsed.expense && 
            t.income === parsed.income
          )
          if (existingTransaction?.id) {
            await updateDocument("transactions", existingTransaction.id, transactionData)
            updatedCount++
          }
        } else {
          // 根据是否选中银行账户选择不同的添加方式
          if (selectedBankAccountId) {
            // 使用银行账户专用函数添加交易
            await addTransactionWithBankAccount(transactionData, selectedBankAccountId)
            addedCount++
          } else {
            // 使用序号系统添加新交易
            await addTransactionWithSequence(transactionData)
            addedCount++
          }
        }
      }

      // 根据当前选中的银行账户刷新数据
      if (selectedBankAccountId) {
        await loadTransactionsByBankAccount(selectedBankAccountId)
      } else {
        await fetchTransactions()
      }
      
      toast({
        title: "导入成功",
        description: `已导入 ${addedCount} 笔新交易，更新 ${updatedCount} 笔交易${selectedBankAccountId ? ` 到 ${bankAccounts.find(acc => acc.id === selectedBankAccountId)?.name}` : ''}`
      })
    } catch (err: any) {
      setError("导入交易失败: " + err.message)
      console.error("Error importing transactions:", err)
    }
  }

  const handleDeleteTransaction = async (id: string) => {
    if (!confirm("您确定要删除此交易吗？")) return
    try {
      console.log('=== 删除交易记录开始 ===')
      console.log('要删除的交易ID:', id)
      
      await deleteDocument("transactions", id)
      console.log('交易删除完成')
      
      console.log('开始刷新数据')
      await fetchTransactions()
      console.log('数据刷新完成')
      
      console.log('=== 删除交易记录流程结束 ===')
      toast({
        title: "成功",
        description: "交易已删除"
      })
    } catch (err: any) {
      console.error('=== 删除交易记录失败 ===')
      console.error('错误详情:', err)
      console.error('错误消息:', err.message)
      console.error('错误堆栈:', err.stack)
      setError("删除交易失败: " + err.message)
      console.error("Error deleting transaction:", err)
    }
  }

  const exportTransactions = () => {
    const csvContent = [
      ["日期", "描述", "描述2", "支出金额", "收入金额", "状态", "付款人", "参考", "分类", "项目账户分类"].join(","),
      ...filteredTransactions.map(t => [
        typeof t.date === 'string' ? t.date : new Date(t.date.seconds * 1000).toISOString().split("T")[0],
        t.description,
        t.description2 || "",
        t.expense.toFixed(2),
        t.income.toFixed(2),
        t.status,
        t.payer || "",
        t.projectid || "",
        t.category || ""
      ].join(","))
    ].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    link.setAttribute("download", `transactions_${new Date().toISOString().split("T")[0]}.csv`)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Calculate summary statistics
  const totalExpenses = filteredTransactions.reduce((sum, t) => sum + t.expense, 0)
  const totalIncome = filteredTransactions.reduce((sum, t) => sum + t.income, 0)
  const netAmount = totalIncome - totalExpenses
  
  // 计算累计余额 (假设初始余额为0，可以通过设置调整)
  const initialBalance = 38887.57  // 可以从设置或配置中获取
  
  // 计算所有有效交易的累计余额（不受筛选影响，按日期顺序从最旧到最新）
  const sortedAllTransactions = [...transactions].sort((a, b) => {
    const dateA = typeof a.date === 'string' ? new Date(a.date).getTime() : new Date(a.date.seconds * 1000).getTime()
    const dateB = typeof b.date === 'string' ? new Date(b.date).getTime() : new Date(b.date.seconds * 1000).getTime()
    return dateA - dateB // 从最旧到最新排序
  })
  
  // 计算所有交易的总收入和总支出
  const allTransactionsTotalIncome = transactions.reduce((sum, t) => sum + t.income, 0)
  const allTransactionsTotalExpenses = transactions.reduce((sum, t) => sum + t.expense, 0)
  const totalNetAmount = allTransactionsTotalIncome - allTransactionsTotalExpenses
  
  // 计算所有交易按时间顺序的累计余额
  const totalRunningBalance = calculateRunningBalance(sortedAllTransactions, initialBalance)
  
  // 缓存累计余额计算结果（性能优化）
  const runningBalancesCache = React.useMemo(() => {
    return calculateRunningBalances(sortedAllTransactions, initialBalance)
  }, [sortedAllTransactions, initialBalance])

  // 获取交易的累计余额（从缓存中）
  const getRunningBalance = React.useCallback((transactionId: string): number => {
    const cached = runningBalancesCache.find(item => item.transaction.id === transactionId)
    return cached ? cached.runningBalance : 0
  }, [runningBalancesCache])
  
  // 验证计算一致性
  const expectedRunningBalance = initialBalance + totalNetAmount
  if (Math.abs(totalRunningBalance - expectedRunningBalance) > 0.01) {
    console.warn('累计余额计算不一致:', { totalRunningBalance, expectedRunningBalance })
  }

  // 分页计算
  const startIndex = (currentPage - 1) * pageSize
  const endIndex = startIndex + pageSize
  const paginatedTransactions = sortedTransactions.slice(startIndex, endIndex)
  
  // 更新总页数
  React.useEffect(() => {
    const newTotalPages = Math.ceil(sortedTransactions.length / pageSize)
    setTotalPages(Math.max(1, newTotalPages))
    // 如果当前页超出范围，重置到第一页
    if (currentPage > newTotalPages && newTotalPages > 0) {
      setCurrentPage(1)
    }
  }, [sortedTransactions.length, pageSize, currentPage])

  // 分页处理函数
  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  const handlePageSizeChange = (newPageSize: number) => {
    setPageSize(newPageSize)
    setCurrentPage(1) // 重置到第一页
  }

  // 加载银行账户
  const loadBankAccounts = React.useCallback(async () => {
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
      console.error("Error loading bank accounts:", error)
      setError("Failed to load bank accounts")
    } finally {
      setBankAccountsLoading(false)
    }
  }, [currentUser])

  // 加载指定银行账户的交易
  const loadTransactionsByBankAccount = React.useCallback(async (bankAccountId: string) => {
    if (!currentUser || !bankAccountId) return
    
    try {
      setLoading(true)
      const transactions = await getTransactionsByBankAccount(bankAccountId)
      setTransactions(transactions)
    } catch (error) {
      console.error("Error loading transactions:", error)
      setError("Failed to load transactions")
    } finally {
      setLoading(false)
    }
  }, [currentUser])

  // 处理银行账户切换
  const handleBankAccountChange = (bankAccountId: string) => {
    setSelectedBankAccountId(bankAccountId)
  }

  if (loading) {
    return <div className="p-6 text-center">加载银行交易...</div>
  }

  if (error) {
    return <div className="p-6 text-center text-red-500">{error}</div>
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">银行交易</h1>
          <p className="text-muted-foreground">轻松管理和导入您的银行交易，按项目账户分类管理。</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => window.location.href = "/bank-account-management"}>
            <CreditCard className="h-4 w-4 mr-2" />
            管理银行账户
          </Button>
        </div>
      </div>

      {/* 银行账户标签页 */}
      {bankAccounts.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">银行账户</h2>
          </div>
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
          </Tabs>
        </div>
      )}

      {/* 操作按钮 */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">交易管理</h2>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={exportTransactions}>
            <Download className="h-4 w-4 mr-2" />
            导出
          </Button>

          {/* Paste Import Dialog */}
          {hasPermission(RoleLevels[UserRoles.ASSISTANT_VICE_PRESIDENT]) && (
            <Button variant="outline" size="sm" onClick={() => setIsPasteImportOpen(true)}>
              <Copy className="h-4 w-4 mr-2" />
              粘贴导入
            </Button>
          )}

          {/* Excel Import Dialog */}
          {hasPermission(RoleLevels[UserRoles.ASSISTANT_VICE_PRESIDENT]) && (
            <Dialog open={isImportOpen} onOpenChange={setIsImportOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <FileSpreadsheet className="h-4 w-4 mr-2" />
                  导入Excel
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>从Excel/CSV导入</DialogTitle>
                  <DialogDescription>上传包含交易数据的CSV文件。预期列：日期、描述、描述2、支出金额、收入金额</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
                    <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground mb-2">点击上传或拖放您的CSV文件</p>
                    <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
                      选择文件
                    </Button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".csv,.xlsx,.xls"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          )}

          {hasPermission(RoleLevels[UserRoles.ASSISTANT_VICE_PRESIDENT]) && (
            <Button size="sm" onClick={() => {
              setIsEditMode(false)
              setEditingTransaction(null)
              resetForm()
              setIsFormOpen(true)
            }}>
              <Plus className="h-4 w-4 mr-2" />
              添加交易
            </Button>
          )}

          {/* 项目匹配按钮 */}
          {hasPermission(RoleLevels[UserRoles.ASSISTANT_VICE_PRESIDENT]) && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleAutoMatchProjects}
              disabled={isMatchingProjects}
            >
              <Tag className="h-4 w-4 mr-2" />
              {isMatchingProjects ? "匹配中..." : "自动匹配项目"}
            </Button>
          )}

          {/* 项目匹配预览按钮 */}
          {hasPermission(RoleLevels[UserRoles.ASSISTANT_VICE_PRESIDENT]) && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handlePreviewProjectMatch}
            >
              <Search className="h-4 w-4 mr-2" />
              预览匹配
            </Button>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 grid-cols-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {selectedBankAccountId ? '账户支出' : '总支出'}
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{formatCurrency(totalExpenses)}</div>
            {selectedBankAccountId && (
              <p className="text-xs text-muted-foreground mt-1">
                {bankAccounts.find(acc => acc.id === selectedBankAccountId)?.name}
              </p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {selectedBankAccountId ? '账户收入' : '总收入'}
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatCurrency(totalIncome)}</div>
            {selectedBankAccountId && (
              <p className="text-xs text-muted-foreground mt-1">
                {bankAccounts.find(acc => acc.id === selectedBankAccountId)?.name}
              </p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {selectedBankAccountId ? '账户净额' : '盈余/赤字'}
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${netAmount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {netAmount >= 0 ? '+' : ''}{formatCurrency(Math.abs(netAmount))}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {netAmount >= 0 ? '盈余' : '赤字'}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {selectedBankAccountId ? '账户余额' : '累计余额'}
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${totalRunningBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(totalRunningBalance)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              初始余额: {formatCurrency(initialBalance)} • 净额: {formatCurrency(totalNetAmount)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              当前页: {currentPage}/{totalPages}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Search and View Mode */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="搜索描述、项目或分类..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 w-64"
            />
          </div>
          
          {/* 年份月份过滤 */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2">
              <Label htmlFor="year-filter" className="text-sm font-medium">
                年份月份:
              </Label>
              <Select value={yearFilter} onValueChange={setYearFilter}>
                <SelectTrigger className="w-24 h-8 text-xs">
                  <SelectValue placeholder="年份" />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 10 }, (_, i) => {
                    const year = new Date().getFullYear() - 5 + i
                    return (
                      <SelectItem key={year} value={year.toString()}>
                        {year}
                      </SelectItem>
                    )
                  })}
                </SelectContent>
              </Select>
              <Select value={monthFilter} onValueChange={setMonthFilter}>
                <SelectTrigger className="w-24 h-8 text-xs">
                  <SelectValue placeholder="月份" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全年</SelectItem>
                  {Array.from({ length: 12 }, (_, i) => {
                    const month = (i + 1).toString().padStart(2, '0')
                    const monthNames = ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月']
                    return (
                      <SelectItem key={month} value={month}>
                        {monthNames[i]}
                      </SelectItem>
                    )
                  })}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

      </div>

      {/* Transactions Display */}
      <Card>
        <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>所有交易</CardTitle>
                <CardDescription>
                  {filteredTransactions.length} 笔交易
                  {yearFilter && monthFilter && (
                    <span className="text-muted-foreground ml-2">
                      ({yearFilter}年{monthFilter === "all" ? "全年" : monthFilter + "月"})
                    </span>
                  )}
                  <span className="text-muted-foreground ml-2">
                    当前页: {currentPage}/{totalPages}
                  </span>
                </CardDescription>
              </div>

              {selectedTransactions.size > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">
                    已选择 {selectedTransactions.size} 笔交易
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsBatchEditOpen(true)}
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    批量编辑
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => setIsBatchDeleteOpen(true)}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    批量删除
                  </Button>
                </div>
              )}
              <div className="flex items-center gap-2">
                {!isSortEditMode ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsSortEditMode(true)}
                  >
                    编辑排序
                  </Button>
                ) : (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleResetOrder}
                    >
                      重置排序
                    </Button>
                    <Button
                      variant="default"
                      size="sm"
                      onClick={handleSaveOrder}
                    >
                      保存排序
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsSortEditMode(false)}
                    >
                      退出编辑
                    </Button>
                  </>
                )}
              </div>
            </div>
        </CardHeader>
        <CardContent>
            {isSortEditMode && (
              <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center gap-2 text-blue-700">
                  <GripVertical className="h-4 w-4" />
                  <span className="text-sm font-medium">拖拽排序模式</span>
                </div>
                <p className="text-sm text-blue-600 mt-1">
                  使用左侧的拖拽手柄可以调整交易顺序。调整完成后点击"保存排序"按钮保存更改，或点击"退出编辑"取消更改。
                </p>
              </div>
            )}
            {isSortEditMode ? (
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={sortedTransactions.map(t => t.id!)}
                  strategy={verticalListSortingStrategy}
                >
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[80px]">
                          <div className="flex items-center gap-2">
                            <div className="w-4 h-4"></div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={handleSelectAll}
                              className="h-6 w-6 p-0"
                            >
                              {selectedTransactions.size === filteredTransactions.length && filteredTransactions.length > 0 ? (
                                <CheckSquare className="h-4 w-4" />
                              ) : (
                                <Square className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </TableHead>
                        <TableHead className="w-[60px]">
                          <div className="space-y-2">
                            <div className="font-medium">序号</div>
                          </div>
                        </TableHead>
                        <TableHead>
                  <div className="space-y-2">
                            <div className="font-medium">日期</div>
                      
                    </div>
                        </TableHead>
                        <TableHead>
                          <div className="space-y-2">
                            <div className="font-medium">描述</div>
                            <Input
                              placeholder="筛选描述..."
                              value={descriptionFilter}
                              onChange={(e) => setDescriptionFilter(e.target.value)}
                              className="h-6 text-xs"
                            />
                  </div>
                        </TableHead>
                        <TableHead>
                  <div className="space-y-2">
                            <div className="font-medium">描述2</div>
                            <Input
                              placeholder="筛选描述2..."
                              value={description2Filter}
                              onChange={(e) => setDescription2Filter(e.target.value)}
                              className="h-6 text-xs"
                            />
                          </div>
                        </TableHead>
                        <TableHead>
                          <div className="space-y-2">
                            <div className="font-medium">支出金额</div>
                            <Input
                              placeholder="筛选支出..."
                              value={expenseFilter}
                              onChange={(e) => setExpenseFilter(e.target.value)}
                              className="h-6 text-xs"
                            />
                          </div>
                        </TableHead>
                        <TableHead>
                          <div className="space-y-2">
                            <div className="font-medium">收入金额</div>
                            <Input
                              placeholder="筛选收入..."
                              value={incomeFilter}
                              onChange={(e) => setIncomeFilter(e.target.value)}
                              className="h-6 text-xs"
                            />
                          </div>
                        </TableHead>
                        <TableHead>
                          <div className="space-y-2">
                            <div className="font-medium">累计余额</div>
                            <Input
                              placeholder="筛选余额..."
                              value={balanceFilter}
                              onChange={(e) => setBalanceFilter(e.target.value)}
                              className="h-6 text-xs"
                            />
                          </div>
                        </TableHead>
                        <TableHead>
                          <div className="space-y-2">
                            <div className="font-medium">状态</div>
                            <Select value={tableStatusFilter} onValueChange={setTableStatusFilter}>
                              <SelectTrigger className="h-6 text-xs">
                                <SelectValue placeholder="所有状态" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="all">所有状态</SelectItem>
                                <SelectItem value="Completed">已完成</SelectItem>
                                <SelectItem value="Pending">待处理</SelectItem>
                                <SelectItem value="Draft">草稿</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </TableHead>
                        <TableHead>
                          <div className="space-y-2">
                            <div className="font-medium">付款人</div>
                            <Input
                              placeholder="筛选付款人..."
                              value={payerFilter}
                              onChange={(e) => setPayerFilter(e.target.value)}
                              className="h-6 text-xs"
                            />
                          </div>
                        </TableHead>
                        <TableHead>
                          <div className="space-y-2">
                            <div className="font-medium">项目户口</div>
                            <Select value={projectFilter} onValueChange={setProjectFilter}>
                              <SelectTrigger className="h-6 text-xs">
                                <SelectValue placeholder="选择项目户口" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="all">所有项目户口</SelectItem>
                                <SelectItem value="-">无项目户口</SelectItem>
                                {Object.entries(getGroupedAvailableProjects()).map(([bodCategory, projects]) => (
                                  <div key={bodCategory}>
                                    <div className="px-2 py-1.5 text-sm font-semibold text-muted-foreground bg-muted/50">
                                      {bodCategory}
                                    </div>
                                    {projects.map((project) => (
                                      <SelectItem key={project.id} value={project.projectid} className="ml-4">
                                        {project.name}
                                      </SelectItem>
                                    ))}
                                  </div>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </TableHead>
                        <TableHead>
                          <div className="space-y-2">
                            <div className="font-medium">收支分类</div>
                            <Input
                              placeholder="筛选收支分类..."
                              value={categoryFilter}
                              onChange={(e) => setCategoryFilter(e.target.value)}
                              className="h-6 text-xs"
                            />
                          </div>
                        </TableHead>

                        {hasPermission(RoleLevels[UserRoles.VICE_PRESIDENT]) && (
                          <TableHead className="w-[100px]">操作</TableHead>
                        )}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedTransactions.map((transaction, index) => {
                        const runningBalance = getRunningBalance(transaction.id!)
                        return (
                          <SortableTransactionRow 
                            key={transaction.id} 
                            transaction={transaction} 
                            runningBalance={runningBalance}
                            onSelect={handleSelectTransaction}
                            onEdit={handleEditTransaction}
                            onDelete={handleDeleteTransaction}
                            hasPermission={hasPermission(RoleLevels[UserRoles.VICE_PRESIDENT])}
                            isSelected={selectedTransactions.has(transaction.id!)}
                            formatDate={formatDate}
                            formatCurrency={formatCurrency}
                            isSortEditMode={isSortEditMode}
                          />
                        )
                      })}
                    </TableBody>
                  </Table>
                </SortableContext>
              </DndContext>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[80px]">
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4"></div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={handleSelectAll}
                          className="h-6 w-6 p-0"
                        >
                          {selectedTransactions.size === filteredTransactions.length && filteredTransactions.length > 0 ? (
                            <CheckSquare className="h-4 w-4" />
                          ) : (
                            <Square className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </TableHead>
                    <TableHead className="w-[60px]">
                      <div className="space-y-2">
                        <div className="font-medium">序号</div>
                      </div>
                    </TableHead>
                    <TableHead>
                      <div className="space-y-2">
                        <div className="font-medium">日期</div>
                      </div>
                    </TableHead>
                    <TableHead>
                      <div className="space-y-2">
                        <div className="font-medium">描述</div>
                        <Input
                          placeholder="筛选描述..."
                          value={descriptionFilter}
                          onChange={(e) => setDescriptionFilter(e.target.value)}
                          className="h-6 text-xs"
                        />
                      </div>
                    </TableHead>
                    <TableHead>
                      <div className="space-y-2">
                        <div className="font-medium">描述2</div>
                        <Input
                          placeholder="筛选描述2..."
                          value={description2Filter}
                          onChange={(e) => setDescription2Filter(e.target.value)}
                          className="h-6 text-xs"
                        />
                      </div>
                    </TableHead>
                    <TableHead>
                      <div className="space-y-2">
                        <div className="font-medium">支出金额</div>
                        <Input
                          placeholder="筛选支出..."
                          value={expenseFilter}
                          onChange={(e) => setExpenseFilter(e.target.value)}
                          className="h-6 text-xs"
                        />
                      </div>
                    </TableHead>
                    <TableHead>
                      <div className="space-y-2">
                        <div className="font-medium">收入金额</div>
                        <Input
                          placeholder="筛选收入..."
                          value={incomeFilter}
                          onChange={(e) => setIncomeFilter(e.target.value)}
                          className="h-6 text-xs"
                        />
                      </div>
                    </TableHead>
                    <TableHead>
                      <div className="space-y-2">
                        <div className="font-medium">累计余额</div>
                        <Input
                          placeholder="筛选余额..."
                          value={balanceFilter}
                          onChange={(e) => setBalanceFilter(e.target.value)}
                          className="h-6 text-xs"
                        />
                      </div>
                    </TableHead>
                    <TableHead>
                      <div className="space-y-2">
                        <div className="font-medium">状态</div>
                        <Select value={tableStatusFilter} onValueChange={setTableStatusFilter}>
                          <SelectTrigger className="h-6 text-xs">
                            <SelectValue placeholder="所有状态" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">所有状态</SelectItem>
                            <SelectItem value="Completed">已完成</SelectItem>
                            <SelectItem value="Pending">待处理</SelectItem>
                            <SelectItem value="Draft">草稿</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </TableHead>
                    <TableHead>
                      <div className="space-y-2">
                        <div className="font-medium">付款人</div>
                        <Input
                          placeholder="筛选付款人..."
                          value={payerFilter}
                          onChange={(e) => setPayerFilter(e.target.value)}
                          className="h-6 text-xs"
                        />
                      </div>
                    </TableHead>
                    <TableHead>
                      <div className="space-y-2">
                        <div className="font-medium">项目户口</div>
                        <Select value={projectFilter} onValueChange={setProjectFilter}>
                          <SelectTrigger className="h-6 text-xs">
                            <SelectValue placeholder="选择项目户口" />
                          </SelectTrigger>
                          <SelectContent>
                                                          <SelectItem value="all">所有项目户口</SelectItem>
                              <SelectItem value="-">无项目户口</SelectItem>
                              {Object.entries(getGroupedAvailableProjects()).map(([bodCategory, projects]) => (
                                <div key={bodCategory}>
                                  <div className="px-2 py-1.5 text-sm font-semibold text-muted-foreground bg-muted/50">
                                    {bodCategory}
                                  </div>
                                  {projects.map((project) => (
                                    <SelectItem key={project.id} value={project.projectid} className="ml-4">
                                      {project.name}
                                    </SelectItem>
                                  ))}
                                </div>
                              ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </TableHead>
                    <TableHead>
                      <div className="space-y-2">
                        <div className="font-medium">收支分类</div>
                        <Input
                          placeholder="筛选收支分类..."
                          value={categoryFilter}
                          onChange={(e) => setCategoryFilter(e.target.value)}
                          className="h-6 text-xs"
                        />
                      </div>
                    </TableHead>

                    {hasPermission(RoleLevels[UserRoles.VICE_PRESIDENT]) && (
                      <TableHead className="w-[100px]">操作</TableHead>
                    )}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedTransactions.map((transaction, index) => {
                    const runningBalance = getRunningBalance(transaction.id!)
                    return (
                      <SortableTransactionRow 
                        key={transaction.id} 
                        transaction={transaction} 
                        runningBalance={runningBalance}
                        onSelect={handleSelectTransaction}
                        onEdit={handleEditTransaction}
                        onDelete={handleDeleteTransaction}
                        hasPermission={hasPermission(RoleLevels[UserRoles.VICE_PRESIDENT])}
                        isSelected={selectedTransactions.has(transaction.id!)}
                        formatDate={formatDate}
                        formatCurrency={formatCurrency}
                        isSortEditMode={isSortEditMode}
                      />
                    )
                  })}
                </TableBody>
              </Table>
            )}
            
            {/* 分页控件 */}
            {totalPages > 1 && (
              <div className="mt-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm text-muted-foreground">
                    当前页: <span className="font-medium text-foreground">{currentPage}</span> / <span className="font-medium text-foreground">{totalPages}</span>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    共 <span className="font-medium text-foreground">{sortedTransactions.length}</span> 笔交易
                  </div>
                </div>
                <Pagination
                  pagination={{
                    page: currentPage,
                    pageSize: pageSize,
                    total: sortedTransactions.length,
                    totalPages: totalPages
                  }}
                  onPageChange={handlePageChange}
                  onPageSizeChange={handlePageSizeChange}
                  pageSizeOptions={[20, 50, 100, 200]}
                  showPageSizeSelector={true}
                  showTotal={true}
                />
              </div>
            )}
        </CardContent>
      </Card>

      {/* Batch Edit Dialog */}
      <Dialog open={isBatchEditOpen} onOpenChange={setIsBatchEditOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>批量编辑交易</DialogTitle>
            <DialogDescription>
              为选中的 {selectedTransactions.size} 笔交易设置付款人、项目户口和收支分类
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="batch-project-year">项目年份筛选</Label>
              <Select value={batchProjectYearFilter} onValueChange={(value) => 
                setBatchProjectYearFilter(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="选择项目年份" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">所有年份</SelectItem>
                  {getAvailableProjectYears().map((year) => (
                    <SelectItem key={year} value={year}>
                      {year}年
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="batch-payer">付款人</Label>
              <Input
                id="batch-payer"
                value={batchFormData.payer === "none" ? "" : batchFormData.payer === "empty" ? "" : batchFormData.payer}
                onChange={(e) => setBatchFormData({ ...batchFormData, payer: e.target.value })}
                placeholder="付款人姓名"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="batch-reference">项目户口</Label>
              <Select value={batchFormData.projectid} onValueChange={(value) => 
                setBatchFormData({ ...batchFormData, projectid: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="选择项目户口" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">保持不变</SelectItem>
                  <SelectItem value="empty">无项目</SelectItem>
                  {Object.entries(getGroupedProjects(getFilteredProjects())).map(([bodCategory, projects]) => (
                    <div key={bodCategory}>
                      <div className="px-2 py-1.5 text-sm font-semibold text-muted-foreground bg-muted/50">
                        {bodCategory}
                      </div>
                      {projects.map((project) => (
                        <SelectItem key={project.id} value={project.name} className="ml-4">
                          {project.name}
                        </SelectItem>
                      ))}
                    </div>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="batch-category">收支分类</Label>
              <Select value={batchFormData.category} onValueChange={(value) => 
                setBatchFormData({ ...batchFormData, category: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="选择收支分类" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">保持不变</SelectItem>
                  <SelectItem value="empty">无分类</SelectItem>
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
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => {
                setIsBatchEditOpen(false)
                setBatchProjectYearFilter("all")
              }}>
                取消
              </Button>
              <Button onClick={handleBatchUpdate}>
                确认更新
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Batch Delete Dialog */}
      <Dialog open={isBatchDeleteOpen} onOpenChange={setIsBatchDeleteOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>批量删除交易</DialogTitle>
            <DialogDescription>
              您确定要删除选中的 {selectedTransactions.size} 笔交易吗？此操作无法撤销。
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center gap-2 text-red-700">
                <Trash2 className="h-4 w-4" />
                <span className="text-sm font-medium">警告</span>
              </div>
              <p className="text-sm text-red-600 mt-1">
                删除操作将永久移除选中的交易记录，无法恢复。请确认您要删除的交易。
              </p>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsBatchDeleteOpen(false)}>
                取消
              </Button>
              <Button variant="destructive" onClick={handleBatchDelete}>
                确认删除
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Transaction Form Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{isEditMode ? "编辑交易" : "添加新交易"}</DialogTitle>
            <DialogDescription>
              {isEditMode ? "修改交易信息" : "输入新交易的详细信息，可选择项目账户分类"}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleFormSubmit} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="date">日期</Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  required
                  className="font-mono"
                  style={{
                    fontFamily: 'monospace',
                    fontSize: '14px'
                  }}
                />
                <div className="text-xs text-muted-foreground">
                  格式: {formData.date ? new Date(formData.date).toLocaleDateString('en-GB', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric'
                  }) : 'YYYY-MM-DD'}
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">状态</Label>
                <Select value={formData.status} onValueChange={(value: "Completed" | "Pending" | "Draft") => 
                  setFormData({ ...formData, status: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Pending">待处理</SelectItem>
                    <SelectItem value="Completed">已完成</SelectItem>
                    <SelectItem value="Draft">草稿</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">描述</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="交易描述"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description2">描述2</Label>
              <Input
                id="description2"
                value={formData.description2}
                onChange={(e) => setFormData({ ...formData, description2: e.target.value })}
                placeholder="描述2（可选）"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="payer">付款人</Label>
              <Input
                id="payer"
                value={formData.payer}
                onChange={(e) => setFormData({ ...formData, payer: e.target.value })}
                placeholder="付款人姓名（可选）"
              />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="expense">支出金额</Label>
                <Input
                  id="expense"
                  type="number"
                  step="0.01"
                  value={formData.expense}
                  onChange={(e) => setFormData({ ...formData, expense: e.target.value })}
                  placeholder="0.00"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="income">收入金额</Label>
                <Input
                  id="income"
                  type="number"
                  step="0.01"
                  value={formData.income}
                  onChange={(e) => setFormData({ ...formData, income: e.target.value })}
                  placeholder="0.00"
                />
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-4">
              <div className="space-y-2">
                <Label htmlFor="project-year-filter">项目年份</Label>
                <Select value={editFormProjectYearFilter} onValueChange={(value) => 
                  setEditFormProjectYearFilter(value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="选择项目年份" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">所有年份</SelectItem>
                    {getAvailableProjectYears().map((year) => (
                      <SelectItem key={year} value={year}>
                        {year}年
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="reference">项目户口</Label>
                <Select value={formData.projectid} onValueChange={(value) => 
                  setFormData({ ...formData, projectid: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="选择项目户口" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">无项目</SelectItem>
                    {Object.entries(getGroupedProjects(getEditFormFilteredProjects())).map(([bodCategory, projects]) => (
                      <div key={bodCategory}>
                        <div className="px-2 py-1.5 text-sm font-semibold text-muted-foreground bg-muted/50">
                          {bodCategory}
                        </div>
                        {projects.map((project) => (
                          <SelectItem key={project.id} value={project.name} className="ml-4">
                            {project.name}
                          </SelectItem>
                        ))}
                      </div>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">收支分类</Label>
                <Select value={formData.category} onValueChange={(value) => 
                  setFormData({ ...formData, category: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="选择收支分类" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">无分类</SelectItem>
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
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)}>
                取消
              </Button>
              <Button type="submit">
                {isEditMode ? "更新交易" : "添加交易"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Transaction Import Dialog */}
      <TransactionImportDialog
        open={isImportOpen}
        onOpenChange={setIsImportOpen}
        existingTransactions={transactions}
        onImport={handleImportTransactions}
      />

      {/* Paste Import Dialog */}
      <PasteImportDialog
        open={isPasteImportOpen}
        onOpenChange={setIsPasteImportOpen}
        existingTransactions={transactions}
        onImport={handleImportTransactions}
        selectedBankAccountId={selectedBankAccountId}
        bankAccounts={bankAccounts}
      />

      {/* 项目匹配结果对话框 */}
      <Dialog open={!!matchingResults} onOpenChange={() => setMatchingResults(null)}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>项目匹配结果</DialogTitle>
            <DialogDescription>
              自动匹配项目名称到项目序号的详细结果
            </DialogDescription>
          </DialogHeader>
          
          {matchingResults && (
            <div className="space-y-4">
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center gap-2 text-green-700">
                  <CheckSquare className="h-4 w-4" />
                  <span className="text-sm font-medium">匹配完成</span>
                </div>
                <p className="text-sm text-green-600 mt-1">
                  成功更新了 {matchingResults.updatedCount} 笔交易的项目序号
                </p>
              </div>

              {matchingResults.matchedTransactions.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-medium">匹配详情</h4>
                  <div className="border rounded-lg">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>交易描述</TableHead>
                          <TableHead>原项目序号</TableHead>
                          <TableHead>新项目序号</TableHead>
                          <TableHead>匹配置信度</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {matchingResults.matchedTransactions.map((match) => {
                          const transaction = transactions.find(t => t.id === match.transactionId)
                          return (
                            <TableRow key={match.transactionId}>
                              <TableCell className="max-w-xs truncate">
                                {transaction?.description || '未知交易'}
                              </TableCell>
                              <TableCell className="font-mono text-sm">
                                {match.originalProjectId || '-'}
                              </TableCell>
                              <TableCell className="font-mono text-sm">
                                {match.newProjectId}
                              </TableCell>
                              <TableCell>
                                <Badge variant={
                                  match.confidence === 'exact' ? 'default' :
                                  match.confidence === 'partial' ? 'secondary' : 'outline'
                                }>
                                  {match.confidence === 'exact' ? '精确匹配' :
                                   match.confidence === 'partial' ? '部分匹配' : '代码匹配'}
                                </Badge>
                              </TableCell>
                            </TableRow>
                          )
                        })}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setMatchingResults(null)}>
                  关闭
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
