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
import { addDocument, getTransactions, deleteDocument, updateDocument, getAccounts, getProjects, addTransactionWithSequence, reorderTransactions } from "@/lib/firebase-utils"
import type { Transaction, Account, Project } from "@/lib/data"
import { useAuth } from "@/components/auth/auth-context"
import { RoleLevels, UserRoles, BODCategories } from "@/lib/data"
import { useToast } from "@/hooks/use-toast"
import { TransactionImportDialog } from "./transaction-import-dialog"
import { PasteImportDialog } from "./paste-import-dialog"
import { getCategories } from "@/lib/firebase-utils"
import { type Category } from "@/lib/data"
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



interface TransactionFormData {
  date: string
  description: string
  description2: string
  expense: string
  income: string
  status: "Completed" | "Pending" | "Draft"
  projectid?: string // 从 reference 改为 projectid
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
        ${transaction.expense.toFixed(2)}
      </TableCell>
      <TableCell className="text-green-600 font-medium">
        ${transaction.income.toFixed(2)}
      </TableCell>
      <TableCell
        className={
          runningBalance >= 0 
            ? "text-green-600 font-medium" 
            : "text-red-600 font-medium"
        }
      >
        {runningBalance >= 0 ? `+$${runningBalance.toFixed(2)}` : `-$${Math.abs(runningBalance).toFixed(2)}`}
      </TableCell>
      <TableCell>
        <Badge variant={transaction.status === "Completed" ? "default" : "secondary"}>
          {transaction.status}
        </Badge>
      </TableCell>
      <TableCell>{transaction.projectid || "-"}</TableCell>
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
    projectid: "none",
    category: "none"
  })
  const [batchProjectYearFilter, setBatchProjectYearFilter] = React.useState("all")
  
  // 新增表格标题行筛选状态
  const [tableDateFilter, setTableDateFilter] = React.useState("")
  const [descriptionFilter, setDescriptionFilter] = React.useState("")
  const [description2Filter, setDescription2Filter] = React.useState("")
  const [expenseFilter, setExpenseFilter] = React.useState("")
  const [incomeFilter, setIncomeFilter] = React.useState("")
  const [balanceFilter, setBalanceFilter] = React.useState("")
  const [tableStatusFilter, setTableStatusFilter] = React.useState("all")
  const [projectFilter, setProjectFilter] = React.useState("all")
  const [categoryFilter, setCategoryFilter] = React.useState("")
  
  // 新增年份月份过滤状态
  const [yearFilter, setYearFilter] = React.useState(new Date().getFullYear().toString())
  const [monthFilter, setMonthFilter] = React.useState("all")

  
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
    toast({
      title: "已重置",
      description: "交易顺序已重置为原始顺序"
    })
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
      const updateData: any = {}
      
      if (batchFormData.projectid !== "none") {
        updateData.projectid = batchFormData.projectid === "empty" ? "" : batchFormData.projectid
      }
      if (batchFormData.category !== "none") {
        updateData.category = batchFormData.category === "empty" ? "" : batchFormData.category
      }

      if (Object.keys(updateData).length === 0) {
        toast({
          title: "警告",
          description: "请至少选择一个字段进行更新",
          variant: "destructive"
        })
        return
      }

      let updatedCount = 0
      for (const transactionId of selectedTransactions) {
        await updateDocument("transactions", transactionId, updateData)
        updatedCount++
      }

      await fetchTransactions()
      setSelectedTransactions(new Set())
      setIsBatchEditOpen(false)
      setBatchFormData({ projectid: "none", category: "none" })
      setBatchProjectYearFilter("all")
      
      toast({
        title: "成功",
        description: `已批量更新 ${updatedCount} 笔交易`
      })
    } catch (err: any) {
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

  // 根据年份筛选项目
  const getFilteredProjects = () => {
    if (batchProjectYearFilter === "all") {
      return projects
    }
    return projects.filter(project => {
      const projectYear = project.projectid.split('_')[0]
      return projectYear === batchProjectYearFilter
    })
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
        (transaction.projectid && transaction.projectid.toLowerCase().includes(searchTerm.toLowerCase())) ||
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
  }, [transactions, yearFilter, monthFilter, searchTerm, tableDateFilter, descriptionFilter, description2Filter, expenseFilter, incomeFilter, balanceFilter, tableStatusFilter, projectFilter, categoryFilter])

  const resetForm = () => {
    setFormData({
      date: new Date().toISOString().split("T")[0],
      description: "",
      description2: "",
      expense: "",
      income: "",
      status: "Pending",
      projectid: "none",
      category: "none"
    })
  }

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentUser) return

    try {
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

      // 只有当projectid有值且不是"none"时才添加
      if (formData.projectid && formData.projectid !== "none" && formData.projectid.trim()) {
        transactionData.projectid = formData.projectid
      }

      // 只有当category有值且不是"none"时才添加
      if (formData.category && formData.category !== "none" && formData.category.trim()) {
        transactionData.category = formData.category
      }

      if (isEditMode && editingTransaction?.id) {
        await updateDocument("transactions", editingTransaction.id, transactionData)
        toast({
          title: "成功",
          description: "交易已更新"
        })
      } else {
        // 使用新的序号系统添加交易
        await addTransactionWithSequence(transactionData)
        toast({
          title: "成功",
          description: "交易已添加并分配序号"
        })
      }

      await fetchTransactions()
      setIsFormOpen(false)
      setIsEditMode(false)
      setEditingTransaction(null)
      resetForm()
    } catch (err: any) {
      toast({
        title: "错误",
        description: "保存交易失败: " + err.message,
        variant: "destructive"
      })
    }
  }

  const handleEditTransaction = (transaction: Transaction) => {
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
    
    setFormData({
      date: dateStr,
      description: transaction.description,
      description2: transaction.description2 || "",
      expense: transaction.expense.toString(),
      income: transaction.income.toString(),
      status: transaction.status,
      projectid: transaction.projectid || "none",
      category: transaction.category || "none"
    })
    setIsEditMode(true)
    setIsFormOpen(true)
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

      return transactionData
    })

    try {
      for (const data of newTransactionsData) {
        // 使用序号系统添加新交易
        await addTransactionWithSequence(data)
      }
      await fetchTransactions()
      setIsImportOpen(false)
      toast({
        title: "成功",
        description: `已导入 ${newTransactionsData.length} 笔交易并分配序号`
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

        // 只有当projectid有值时才添加
        if (parsed.projectid && parsed.projectid.trim()) {
          transactionData.projectid = parsed.projectid
        }

        // 只有当category有值时才添加
        if (parsed.category && parsed.category.trim()) {
          transactionData.category = parsed.category
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
          // 使用序号系统添加新交易
          await addTransactionWithSequence(transactionData)
          addedCount++
        }
      }

      await fetchTransactions()
      toast({
        title: "导入成功",
        description: `已导入 ${addedCount} 笔新交易，更新 ${updatedCount} 笔交易`
      })
    } catch (err: any) {
      setError("导入交易失败: " + err.message)
      console.error("Error importing transactions:", err)
    }
  }

  const handleDeleteTransaction = async (id: string) => {
    if (!confirm("您确定要删除此交易吗？")) return
    try {
      await deleteDocument("transactions", id)
      await fetchTransactions()
      toast({
        title: "成功",
        description: "交易已删除"
      })
    } catch (err: any) {
      setError("删除交易失败: " + err.message)
      console.error("Error deleting transaction:", err)
    }
  }

  const exportTransactions = () => {
    const csvContent = [
      ["日期", "描述", "描述2", "支出金额", "收入金额", "状态", "参考", "分类", "项目账户分类"].join(","),
      ...filteredTransactions.map(t => [
        typeof t.date === 'string' ? t.date : new Date(t.date.seconds * 1000).toISOString().split("T")[0],
        t.description,
        t.description2 || "",
        t.expense.toFixed(2),
        t.income.toFixed(2),
        t.status,
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
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 grid-cols-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">总支出</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">${totalExpenses.toFixed(2)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">总收入</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">${totalIncome.toFixed(2)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">盈余/赤字</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${netAmount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              ${netAmount >= 0 ? '+' : ''}${netAmount.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {netAmount >= 0 ? '盈余' : '赤字'}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">累计余额</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${totalRunningBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              ${totalRunningBalance.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              初始余额: ${initialBalance.toFixed(2)} • 净额: ${totalNetAmount.toFixed(2)}
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
                      <div className="font-medium">项目户口</div>
                      <Select value={projectFilter} onValueChange={setProjectFilter}>
                        <SelectTrigger className="h-6 text-xs">
                          <SelectValue placeholder="选择项目户口" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">所有项目户口</SelectItem>
                          <SelectItem value="-">无项目户口</SelectItem>
                          {getAvailableProjects().map((projectId) => (
                            <SelectItem key={projectId} value={projectId}>
                              {projectId}
                            </SelectItem>
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
                    {sortedTransactions.map((transaction, index) => {
                      // 使用缓存的累计余额（性能优化）
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
                          isSortEditMode={isSortEditMode}
                        />
                      )
                    })}
                    </SortableContext>
                  </DndContext>
                ) : (
                  <>
                    {sortedTransactions.map((transaction, index) => {
                      // 使用缓存的累计余额（性能优化）
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
                          isSortEditMode={isSortEditMode}
                        />
                      )
                    })}
                  </>
                )}
              </TableBody>
            </Table>
        </CardContent>
      </Card>

      {/* Batch Edit Dialog */}
      <Dialog open={isBatchEditOpen} onOpenChange={setIsBatchEditOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>批量编辑交易</DialogTitle>
            <DialogDescription>
              为选中的 {selectedTransactions.size} 笔交易设置项目户口和收支分类
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
              <Label htmlFor="batch-reference">项目户口</Label>
              <Select value={batchFormData.projectid} onValueChange={(value) => 
                setBatchFormData({ ...batchFormData, projectid: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="选择项目户口" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">保持不变</SelectItem>
                  <SelectItem value="empty">无项目</SelectItem>
                  {getFilteredProjects().map((project) => (
                    <SelectItem key={project.id} value={project.name}>
                      {project.name} ({project.projectid})
                    </SelectItem>
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
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="reference">项目户口</Label>
                <Select value={formData.projectid} onValueChange={(value) => 
                  setFormData({ ...formData, projectid: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="选择项目户口" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">无项目</SelectItem>
                    {projects.map((project) => (
                      <SelectItem key={project.id} value={project.name}>
                        {project.name} ({project.projectid})
                      </SelectItem>
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
      />
    </div>
  )
}
