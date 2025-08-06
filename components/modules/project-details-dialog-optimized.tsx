"use client"

import * as React from "react"
import { Calendar, DollarSign, TrendingDown, TrendingUp, Eye, Filter, Loader2, Download, FileSpreadsheet, Edit, Save, X, CheckSquare, Square, Trash2, Edit3 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Progress } from "@/components/ui/progress"
import { 
  getTransactions, 
  getProjects,
  getProjectStats,
  updateDocument,
  getCategories
} from "@/lib/firebase-utils"
import { useAuth } from "@/components/auth/auth-context"
import { RoleLevels, UserRoles, BODCategories, type Project, type Transaction, type Category } from "@/lib/data"
import { useToast } from "@/hooks/use-toast"

interface ProjectDetailsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  project: Project | null
}

interface ProjectTransactionStats {
  totalIncome: number
  totalExpense: number
  netAmount: number
  transactionCount: number
  incomeByCategory: Record<string, number>
  expenseByCategory: Record<string, number>
}

interface EditingTransaction extends Transaction {
  isEditing?: boolean
  originalData?: Partial<Transaction>
}

// 日期格式化函数
const formatProjectDate = (date: string | { seconds: number; nanoseconds: number }): string => {
  if (typeof date === 'string') {
    return new Date(date).toLocaleDateString()
  } else if (date?.seconds) {
    return new Date(date.seconds * 1000).toLocaleDateString()
  }
  return 'N/A'
}

// 交易日期格式化函数
const formatTransactionDate = (date: string | { seconds: number; nanoseconds: number }): string => {
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

// 净金额计算函数
const calculateNetAmount = (transaction: Transaction): number => {
  return transaction.income - transaction.expense
}

// 净金额格式化函数
const formatNetAmount = (transaction: Transaction): string => {
  const netAmount = calculateNetAmount(transaction)
  return netAmount >= 0 ? `+$${netAmount.toFixed(2)}` : `-$${Math.abs(netAmount).toFixed(2)}`
}

// 优化的统计卡片组件
const StatCard = React.memo(({ 
  title, 
  value, 
  description, 
  icon: Icon, 
  color = "" 
}: { 
  title: string
  value: string | number
  description: string
  icon: React.ComponentType<{ className?: string }>
  color?: string
}) => (
  <Card>
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium">{title}</CardTitle>
      <Icon className={`h-4 w-4 text-muted-foreground ${color}`} />
    </CardHeader>
    <CardContent>
      <div className={`text-2xl font-bold ${color}`}>{value}</div>
      <p className="text-xs text-muted-foreground">{description}</p>
    </CardContent>
  </Card>
))

// 优化的分类统计项组件
const CategoryStatItem = React.memo(({ 
  category, 
  amount, 
  type 
}: { 
  category: string
  amount: number
  type: 'income' | 'expense'
}) => (
  <div className="flex items-center justify-between">
    <span className="text-sm font-medium">{category}</span>
    <span className={`text-sm font-mono ${type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
      ${amount.toFixed(2)}
    </span>
  </div>
))

// 优化的筛选选项组件
const FilterOption = React.memo(({ 
  value, 
  label 
}: { 
  value: string
  label: string 
}) => (
  <SelectItem value={value}>
    {label}
  </SelectItem>
))

// 内联编辑的交易行组件
const EditableTransactionRow = React.memo(({ 
  transaction,
  categories,
  onEdit,
  onSave,
  onCancel,
  isSelected,
  onSelect,
  isBatchMode
}: { 
  transaction: EditingTransaction
  categories: Category[]
  onEdit: (transaction: Transaction) => void
  onSave: (transaction: Transaction) => Promise<void>
  onCancel: (transaction: Transaction) => void
  isSelected: boolean
  onSelect: (transactionId: string | undefined, selected: boolean) => void
  isBatchMode: boolean
}) => {
  const [editData, setEditData] = React.useState<Partial<Transaction>>({
    description: transaction.description,
    category: transaction.category,
    income: transaction.income,
    expense: transaction.expense
  })
  const [isSaving, setIsSaving] = React.useState(false)

  const handleSave = async () => {
    if (!transaction.id) return
    
    setIsSaving(true)
    try {
      await onSave({
        ...transaction,
        ...editData
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancel = () => {
    setEditData({
      description: transaction.description,
      category: transaction.category,
      income: transaction.income,
      expense: transaction.expense
    })
    onCancel(transaction)
  }



  if (transaction.isEditing) {
    return (
      <TableRow className="bg-muted/50">
        <TableCell>
          <Input
            type="date"
            value={typeof transaction.date === 'string' ? transaction.date : ''}
            onChange={(e) => setEditData(prev => ({ ...prev, date: e.target.value }))}
            className="w-32"
          />
        </TableCell>
        <TableCell>
          <Input
            value={editData.description || ''}
            onChange={(e) => setEditData(prev => ({ ...prev, description: e.target.value }))}
            placeholder="交易描述"
          />
        </TableCell>
        <TableCell>
          <Select value={editData.category || ''} onValueChange={(value) => setEditData(prev => ({ ...prev, category: value }))}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {categories.map((category) => (
                <SelectItem key={category.code} value={category.name}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </TableCell>
        <TableCell>
          <Input
            type="number"
            step="0.01"
            value={editData.income || 0}
            onChange={(e) => setEditData(prev => ({ ...prev, income: parseFloat(e.target.value) || 0 }))}
            className="text-right"
          />
        </TableCell>
        <TableCell>
          <Input
            type="number"
            step="0.01"
            value={editData.expense || 0}
            onChange={(e) => setEditData(prev => ({ ...prev, expense: parseFloat(e.target.value) || 0 }))}
            className="text-right"
          />
        </TableCell>
        <TableCell className="text-right font-medium">
          ${((editData.income || 0) - (editData.expense || 0)).toFixed(2)}
        </TableCell>
        <TableCell>
          <div className="flex gap-1">
            <Button size="sm" onClick={handleSave} disabled={isSaving}>
              {isSaving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
            </Button>
            <Button size="sm" variant="outline" onClick={handleCancel}>
              <X className="h-3 w-3" />
            </Button>
          </div>
        </TableCell>
      </TableRow>
    )
  }

  return (
    <TableRow className={isSelected ? "bg-muted/30" : ""}>
      <TableCell>
        {isBatchMode && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onSelect(transaction.id, !isSelected)}
            className="p-0 h-4 w-4 mr-2"
          >
            {isSelected ? <CheckSquare className="h-3 w-3" /> : <Square className="h-3 w-3" />}
          </Button>
        )}
        {formatTransactionDate(transaction.date)}
      </TableCell>
      <TableCell className="font-medium">{transaction.description}</TableCell>
      <TableCell>
        <Badge variant="outline">{transaction.category}</Badge>
      </TableCell>
      <TableCell className="text-right text-green-600">
        ${transaction.income.toFixed(2)}
      </TableCell>
      <TableCell className="text-right text-red-600">
        ${transaction.expense.toFixed(2)}
      </TableCell>
      <TableCell className="text-right font-medium">
        {formatNetAmount(transaction)}
      </TableCell>
              <TableCell>
          <div className="flex gap-1">
            <Button size="sm" variant="outline" onClick={() => onEdit(transaction)}>
              <Edit3 className="h-3 w-3" />
            </Button>
          </div>
        </TableCell>
    </TableRow>
  )
})

export function ProjectDetailsDialogOptimized({
  open,
  onOpenChange,
  project
}: ProjectDetailsDialogProps) {
  const { currentUser, hasPermission } = useAuth()
  const { toast } = useToast()
  
  const [transactions, setTransactions] = React.useState<EditingTransaction[]>([])
  const [filteredTransactions, setFilteredTransactions] = React.useState<EditingTransaction[]>([])
  const [loading, setLoading] = React.useState(false)
  const [categories, setCategories] = React.useState<Category[]>([])
  const [stats, setStats] = React.useState<ProjectTransactionStats>({
    totalIncome: 0,
    totalExpense: 0,
    netAmount: 0,
    transactionCount: 0,
    incomeByCategory: {},
    expenseByCategory: {}
  })
  
  // 编辑状态
  const [editingTransactionId, setEditingTransactionId] = React.useState<string | null>(null)
  const [isBatchMode, setIsBatchMode] = React.useState(false)
  const [selectedTransactions, setSelectedTransactions] = React.useState<Set<string>>(new Set())
  const [batchEditData, setBatchEditData] = React.useState<Partial<Transaction>>({})
  const [isBatchEditing, setIsBatchEditing] = React.useState(false)
  
  // 优化的筛选状态
  const [filters, setFilters] = React.useState({
    category: "all",
    dateFrom: "",
    dateTo: "",
    amountMin: "",
    amountMax: ""
  })

  // 加载分类数据
  const loadCategories = React.useCallback(async () => {
    try {
      const categoriesData = await getCategories()
      setCategories(categoriesData)
    } catch (error) {
      console.error('加载分类数据失败:', error)
    }
  }, [])

  // 优化的数据加载
  const loadProjectData = React.useCallback(async () => {
    if (!project) return
    
    setLoading(true)
    try {
      const projectTransactions = await getTransactions({ projectid: project.projectid })
      const transactionsWithEditState = projectTransactions.map(t => ({ ...t, isEditing: false }))
      setTransactions(transactionsWithEditState)
      setFilteredTransactions(transactionsWithEditState)
    } catch (error) {
      console.error('加载项目数据失败:', error)
      toast({
        title: "加载失败",
        description: "无法加载项目交易数据",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }, [project, toast])

  // 优化的交易统计计算
  const calculateTransactionStats = React.useCallback((transactions: EditingTransaction[]) => {
    const stats: ProjectTransactionStats = {
      totalIncome: 0,
      totalExpense: 0,
      netAmount: 0,
      transactionCount: transactions.length,
      incomeByCategory: {},
      expenseByCategory: {}
    }

    transactions.forEach(transaction => {
      stats.totalIncome += transaction.income
      stats.totalExpense += transaction.expense
      
      // 按分类统计收入
      if (transaction.income > 0 && transaction.category) {
        stats.incomeByCategory[transaction.category] = 
          (stats.incomeByCategory[transaction.category] || 0) + transaction.income
      }
      
      // 按分类统计支出
      if (transaction.expense > 0 && transaction.category) {
        stats.expenseByCategory[transaction.category] = 
          (stats.expenseByCategory[transaction.category] || 0) + transaction.expense
      }
    })

    stats.netAmount = stats.totalIncome - stats.totalExpense
    return stats
  }, [])

  // 优化的筛选处理
  const handleFilterChange = React.useCallback((key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }, [])

  // 优化的筛选应用
  const applyFilters = React.useCallback(() => {
    let filtered = transactions

    // 分类筛选
    if (filters.category !== "all") {
      filtered = filtered.filter(t => t.category === filters.category)
    }

    // 日期筛选
    if (filters.dateFrom) {
      const fromDate = new Date(filters.dateFrom)
      filtered = filtered.filter(t => {
        const transactionDate = typeof t.date === 'string' ? new Date(t.date) : new Date(t.date.seconds * 1000)
        return transactionDate >= fromDate
      })
    }

    if (filters.dateTo) {
      const toDate = new Date(filters.dateTo)
      filtered = filtered.filter(t => {
        const transactionDate = typeof t.date === 'string' ? new Date(t.date) : new Date(t.date.seconds * 1000)
        return transactionDate <= toDate
      })
    }

    // 金额筛选
    if (filters.amountMin) {
      const minAmount = parseFloat(filters.amountMin)
      filtered = filtered.filter(t => calculateNetAmount(t) >= minAmount)
    }

    if (filters.amountMax) {
      const maxAmount = parseFloat(filters.amountMax)
      filtered = filtered.filter(t => calculateNetAmount(t) <= maxAmount)
    }

    setFilteredTransactions(filtered)
  }, [transactions, filters, calculateNetAmount])

  // 优化的筛选重置
  const resetFilters = React.useCallback(() => {
    setFilters({
      category: "all",
      dateFrom: "",
      dateTo: "",
      amountMin: "",
      amountMax: ""
    })
    setFilteredTransactions(transactions)
  }, [transactions])

  // 优化的导出功能
  const exportProjectTransactions = React.useCallback(() => {
    if (!project || filteredTransactions.length === 0) return

    try {
      const csvContent = [
        ['日期', '描述', '分类', '收入', '支出', '净额'],
        ...filteredTransactions.map(t => [
          formatTransactionDate(t.date),
          t.description,
          t.category,
          t.income.toFixed(2),
          t.expense.toFixed(2),
          calculateNetAmount(t).toFixed(2)
        ])
      ].map(row => row.join(',')).join('\n')

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      const url = URL.createObjectURL(blob)
      link.setAttribute('href', url)
      link.setAttribute('download', `${project.name}_transactions.csv`)
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      toast({
        title: "导出成功",
        description: `已导出 ${filteredTransactions.length} 条交易记录`,
      })
    } catch (error) {
      console.error('导出失败:', error)
      toast({
        title: "导出失败",
        description: "导出交易数据时发生错误",
        variant: "destructive",
      })
    }
  }, [project, filteredTransactions, formatTransactionDate, calculateNetAmount, toast])

  // 优化的关闭处理
  const handleClose = React.useCallback(() => {
    onOpenChange(false)
    // 延迟重置状态
    setTimeout(() => {
      setTransactions([])
      setFilteredTransactions([])
      setStats({
        totalIncome: 0,
        totalExpense: 0,
        netAmount: 0,
        transactionCount: 0,
        incomeByCategory: {},
        expenseByCategory: {}
      })
      setFilters({
        category: "all",
        dateFrom: "",
        dateTo: "",
        amountMin: "",
        amountMax: ""
      })
      setEditingTransactionId(null)
      setIsBatchMode(false)
      setSelectedTransactions(new Set())
      setBatchEditData({})
    }, 100)
  }, [onOpenChange])

  // 编辑交易记录
  const handleEditTransaction = React.useCallback((transaction: Transaction) => {
    setEditingTransactionId(transaction.id || null)
    setTransactions(prev => prev.map(t => 
      t.id === transaction.id 
        ? { ...t, isEditing: true, originalData: { ...t } }
        : { ...t, isEditing: false }
    ))
    setFilteredTransactions(prev => prev.map(t => 
      t.id === transaction.id 
        ? { ...t, isEditing: true, originalData: { ...t } }
        : { ...t, isEditing: false }
    ))
  }, [])

  // 保存交易记录
  const handleSaveTransaction = React.useCallback(async (updatedTransaction: Transaction) => {
    if (!updatedTransaction.id) return

    try {
      await updateDocument('transactions', updatedTransaction.id, {
        description: updatedTransaction.description,
        category: updatedTransaction.category,
        income: updatedTransaction.income,
        expense: updatedTransaction.expense,
        date: updatedTransaction.date
      })

      setTransactions(prev => prev.map(t => 
        t.id === updatedTransaction.id 
          ? { ...updatedTransaction, isEditing: false }
          : t
      ))
      setFilteredTransactions(prev => prev.map(t => 
        t.id === updatedTransaction.id 
          ? { ...updatedTransaction, isEditing: false }
          : t
      ))
      setEditingTransactionId(null)

      toast({
        title: "更新成功",
        description: "交易记录已更新",
      })
    } catch (error) {
      console.error('更新交易记录失败:', error)
      toast({
        title: "更新失败",
        description: "无法更新交易记录",
        variant: "destructive",
      })
    }
  }, [toast])

  // 取消编辑
  const handleCancelEdit = React.useCallback((transaction: Transaction) => {
    setEditingTransactionId(null)
    setTransactions(prev => prev.map(t => 
      t.id === transaction.id 
        ? { ...t, isEditing: false }
        : t
    ))
    setFilteredTransactions(prev => prev.map(t => 
      t.id === transaction.id 
        ? { ...t, isEditing: false }
        : t
    ))
  }, [])



  // 批量选择
  const handleSelectTransaction = React.useCallback((transactionId: string | undefined, selected: boolean) => {
    if (!transactionId) return
    setSelectedTransactions(prev => {
      const newSet = new Set(prev)
      if (selected) {
        newSet.add(transactionId)
      } else {
        newSet.delete(transactionId)
      }
      return newSet
    })
  }, [])

  // 全选/取消全选
  const handleSelectAll = React.useCallback((selected: boolean) => {
    if (selected) {
      const allIds = new Set(filteredTransactions.map(t => t.id).filter((id): id is string => Boolean(id)))
      setSelectedTransactions(allIds)
    } else {
      setSelectedTransactions(new Set())
    }
  }, [filteredTransactions])

  // 批量编辑
  const handleBatchEdit = React.useCallback(async () => {
    if (selectedTransactions.size === 0) return

    setIsBatchEditing(true)
    try {
      const updatePromises = Array.from(selectedTransactions).map(async (transactionId) => {
        await updateDocument('transactions', transactionId, batchEditData)
      })

      await Promise.all(updatePromises)

      // 更新本地状态
      setTransactions(prev => prev.map(t => 
        t.id && selectedTransactions.has(t.id)
          ? { ...t, ...batchEditData }
          : t
      ))
      setFilteredTransactions(prev => prev.map(t => 
        t.id && selectedTransactions.has(t.id)
          ? { ...t, ...batchEditData }
          : t
      ))

      // 重置批量编辑状态
      setSelectedTransactions(new Set())
      setBatchEditData({})
      setIsBatchMode(false)

      toast({
        title: "批量更新成功",
        description: `已更新 ${selectedTransactions.size} 条交易记录`,
      })
    } catch (error) {
      console.error('批量更新失败:', error)
      toast({
        title: "批量更新失败",
        description: "无法批量更新交易记录",
        variant: "destructive",
      })
    } finally {
      setIsBatchEditing(false)
    }
  }, [selectedTransactions, batchEditData, toast])

  // 优化的统计数据
  const currentStats = React.useMemo(() => 
    calculateTransactionStats(filteredTransactions), 
    [filteredTransactions, calculateTransactionStats]
  )

  // 优化的分类选项
  const categoryOptions = React.useMemo(() => {
    const categories = [...new Set(transactions.map(t => t.category).filter((cat): cat is string => Boolean(cat)))]
    return [
      { value: "all", label: "所有分类" },
      ...categories.map(cat => ({ value: cat, label: cat }))
    ]
  }, [transactions])

  // 优化的收入分类统计
  const incomeCategories = React.useMemo(() => 
    Object.entries(currentStats.incomeByCategory)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5), 
    [currentStats.incomeByCategory]
  )

  // 优化的支出分类统计
  const expenseCategories = React.useMemo(() => 
    Object.entries(currentStats.expenseByCategory)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5), 
    [currentStats.expenseByCategory]
  )

  // 优化的预算使用率
  const budgetUsage = React.useMemo(() => {
    if (!project || project.budget <= 0) return 0
    return (currentStats.totalExpense / project.budget) * 100
  }, [project, currentStats.totalExpense])

  // 加载项目数据
  React.useEffect(() => {
    if (open && project) {
      loadProjectData()
      loadCategories()
    }
  }, [open, project, loadProjectData, loadCategories])

  // 应用筛选
  React.useEffect(() => {
    applyFilters()
  }, [applyFilters])

  // 更新统计
  React.useEffect(() => {
    setStats(currentStats)
  }, [currentStats])

  if (!project) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            项目详情: {project.name}
          </DialogTitle>
          <DialogDescription>
            查看项目的详细信息和交易记录
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* 项目基本信息 */}
          <Card>
            <CardHeader>
              <CardTitle>项目信息</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <Label className="text-sm font-medium">项目代码</Label>
                  <p className="text-sm text-muted-foreground">{project.projectid}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">BOD分类</Label>
                  <p className="text-sm text-muted-foreground">{project.bodCategory}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">状态</Label>
                  <Badge variant={project.status === 'Active' ? 'default' : 'secondary'}>
                    {project.status}
                  </Badge>
                </div>
                <div>
                  <Label className="text-sm font-medium">活动日期</Label>
                  <p className="text-sm text-muted-foreground">
                    {project.eventDate ? formatProjectDate(project.eventDate) : '未设置'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 统计概览 */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard
              title="总收入"
              value={`$${currentStats.totalIncome.toFixed(2)}`}
              description="项目总收入"
              icon={TrendingUp}
              color="text-green-600"
            />
            <StatCard
              title="总支出"
              value={`$${currentStats.totalExpense.toFixed(2)}`}
              description="项目总支出"
              icon={TrendingDown}
              color="text-red-600"
            />
            <StatCard
              title="净额"
              value={`$${currentStats.netAmount.toFixed(2)}`}
              description="收入减去支出"
              icon={DollarSign}
              color={currentStats.netAmount >= 0 ? "text-green-600" : "text-red-600"}
            />
            <StatCard
              title="交易数"
              value={currentStats.transactionCount}
              description="交易记录数量"
              icon={Calendar}
            />
          </div>

          {/* 预算使用情况 */}
          {project.budget > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>预算使用情况</CardTitle>
                <CardDescription>
                  预算: ${project.budget.toFixed(2)} | 已使用: ${currentStats.totalExpense.toFixed(2)}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Progress value={Math.min(budgetUsage, 100)} className="h-2" />
                <p className="text-sm text-muted-foreground mt-2">
                  使用率: {budgetUsage.toFixed(1)}%
                </p>
              </CardContent>
            </Card>
          )}

          {/* 筛选器 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-4 w-4" />
                筛选交易
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div>
                  <Label>分类</Label>
                  <Select value={filters.category} onValueChange={(value) => handleFilterChange('category', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {categoryOptions.map((option) => (
                        <FilterOption
                          key={option.value}
                          value={option.value}
                          label={option.label}
                        />
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>开始日期</Label>
                  <Input
                    type="date"
                    value={filters.dateFrom}
                    onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
                  />
                </div>
                <div>
                  <Label>结束日期</Label>
                  <Input
                    type="date"
                    value={filters.dateTo}
                    onChange={(e) => handleFilterChange('dateTo', e.target.value)}
                  />
                </div>
                <div>
                  <Label>最小金额</Label>
                  <Input
                    type="number"
                    placeholder="0.00"
                    value={filters.amountMin}
                    onChange={(e) => handleFilterChange('amountMin', e.target.value)}
                  />
                </div>
                <div>
                  <Label>最大金额</Label>
                  <Input
                    type="number"
                    placeholder="0.00"
                    value={filters.amountMax}
                    onChange={(e) => handleFilterChange('amountMax', e.target.value)}
                  />
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <Button variant="outline" onClick={resetFilters}>
                  重置筛选
                </Button>
                <Button onClick={exportProjectTransactions} disabled={filteredTransactions.length === 0}>
                  <Download className="h-4 w-4 mr-2" />
                  导出数据
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* 分类统计 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-green-600">收入分类统计</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {incomeCategories.map(([category, amount]) => (
                    <CategoryStatItem
                      key={category}
                      category={category}
                      amount={amount}
                      type="income"
                    />
                  ))}
                  {incomeCategories.length === 0 && (
                    <p className="text-sm text-muted-foreground">暂无收入记录</p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-red-600">支出分类统计</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {expenseCategories.map(([category, amount]) => (
                    <CategoryStatItem
                      key={category}
                      category={category}
                      amount={amount}
                      type="expense"
                    />
                  ))}
                  {expenseCategories.length === 0 && (
                    <p className="text-sm text-muted-foreground">暂无支出记录</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 交易记录表格 */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>交易记录 ({filteredTransactions.length})</CardTitle>
                <div className="flex items-center gap-2">
                  {loading && (
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span className="text-sm text-muted-foreground">加载中...</span>
                    </div>
                  )}
                  <Button
                    variant={isBatchMode ? "default" : "outline"}
                    size="sm"
                    onClick={() => {
                      setIsBatchMode(!isBatchMode)
                      if (isBatchMode) {
                        setSelectedTransactions(new Set())
                        setBatchEditData({})
                      }
                    }}
                  >
                    {isBatchMode ? "退出批量模式" : "批量编辑"}
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {/* 批量编辑面板 */}
              {isBatchMode && selectedTransactions.size > 0 && (
                <div className="mb-4 p-4 border rounded-lg bg-muted/30">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">已选择 {selectedTransactions.size} 条记录</span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleSelectAll(false)}
                      >
                        取消全选
                      </Button>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <Label>分类</Label>
                      <Select 
                        value={batchEditData.category || ''} 
                        onValueChange={(value) => setBatchEditData(prev => ({ ...prev, category: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="选择分类" />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map((category) => (
                            <SelectItem key={category.code} value={category.name}>
                              {category.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>收入</Label>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="保持原值"
                        value={batchEditData.income?.toString() || ''}
                        onChange={(e) => setBatchEditData(prev => ({ 
                          ...prev, 
                          income: e.target.value ? parseFloat(e.target.value) : undefined 
                        }))}
                      />
                    </div>
                    <div>
                      <Label>支出</Label>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="保持原值"
                        value={batchEditData.expense?.toString() || ''}
                        onChange={(e) => setBatchEditData(prev => ({ 
                          ...prev, 
                          expense: e.target.value ? parseFloat(e.target.value) : undefined 
                        }))}
                      />
                    </div>
                    <div className="flex items-end">
                      <Button 
                        onClick={handleBatchEdit} 
                        disabled={isBatchEditing || Object.keys(batchEditData).length === 0}
                        className="w-full"
                      >
                        {isBatchEditing ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            更新中...
                          </>
                        ) : (
                          <>
                            <Edit className="h-4 w-4 mr-2" />
                            批量更新
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {filteredTransactions.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      {isBatchMode && (
                        <TableHead className="w-12">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleSelectAll(selectedTransactions.size !== filteredTransactions.length)}
                            className="p-0 h-4 w-4"
                          >
                            {selectedTransactions.size === filteredTransactions.length ? 
                              <CheckSquare className="h-3 w-3" /> : 
                              <Square className="h-3 w-3" />
                            }
                          </Button>
                        </TableHead>
                      )}
                      <TableHead>日期</TableHead>
                      <TableHead>描述</TableHead>
                      <TableHead>分类</TableHead>
                      <TableHead className="text-right">收入</TableHead>
                      <TableHead className="text-right">支出</TableHead>
                      <TableHead className="text-right">净额</TableHead>
                      <TableHead className="w-24">操作</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTransactions.map((transaction, index) => (
                      <EditableTransactionRow
                        key={transaction.id || `transaction-${index}-${transaction.date}-${transaction.description}`}
                        transaction={transaction}
                        categories={categories}
                        onEdit={handleEditTransaction}
                        onSave={handleSaveTransaction}
                        onCancel={handleCancelEdit}
                        isSelected={transaction.id ? selectedTransactions.has(transaction.id) : false}
                        onSelect={handleSelectTransaction}
                        isBatchMode={isBatchMode}
                      />
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">暂无交易记录</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-end">
          <Button onClick={handleClose}>
            关闭
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
} 