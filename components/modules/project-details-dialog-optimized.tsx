"use client"

import * as React from "react"
import { Calendar, DollarSign, TrendingDown, TrendingUp, Eye, Filter, Loader2, Download, FileSpreadsheet } from "lucide-react"
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
  getProjectStats
} from "@/lib/firebase-utils"
import { useAuth } from "@/components/auth/auth-context"
import { RoleLevels, UserRoles, BODCategories, type Project, type Transaction } from "@/lib/data"
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

// 优化的日期格式化函数
const formatProjectDate = React.useCallback((date: string | { seconds: number; nanoseconds: number }): string => {
  if (typeof date === 'string') {
    return new Date(date).toLocaleDateString()
  } else if (date?.seconds) {
    return new Date(date.seconds * 1000).toLocaleDateString()
  }
  return 'N/A'
}, [])

// 优化的交易日期格式化函数
const formatTransactionDate = React.useCallback((date: string | { seconds: number; nanoseconds: number }): string => {
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
}, [])

// 优化的净金额计算函数
const calculateNetAmount = React.useCallback((transaction: Transaction): number => {
  return transaction.income - transaction.expense
}, [])

// 优化的净金额格式化函数
const formatNetAmount = React.useCallback((transaction: Transaction): string => {
  const netAmount = calculateNetAmount(transaction)
  return netAmount >= 0 ? `+$${netAmount.toFixed(2)}` : `-$${Math.abs(netAmount).toFixed(2)}`
}, [calculateNetAmount])

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

// 优化的交易行组件
const TransactionRow = React.memo(({ 
  transaction 
}: { 
  transaction: Transaction 
}) => (
  <TableRow>
    <TableCell className="font-medium">
      {formatTransactionDate(transaction.date)}
    </TableCell>
    <TableCell>{transaction.description}</TableCell>
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
  </TableRow>
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

export function ProjectDetailsDialogOptimized({
  open,
  onOpenChange,
  project
}: ProjectDetailsDialogProps) {
  const { currentUser, hasPermission } = useAuth()
  const { toast } = useToast()
  
  const [transactions, setTransactions] = React.useState<Transaction[]>([])
  const [filteredTransactions, setFilteredTransactions] = React.useState<Transaction[]>([])
  const [loading, setLoading] = React.useState(false)
  const [stats, setStats] = React.useState<ProjectTransactionStats>({
    totalIncome: 0,
    totalExpense: 0,
    netAmount: 0,
    transactionCount: 0,
    incomeByCategory: {},
    expenseByCategory: {}
  })
  
  // 优化的筛选状态
  const [filters, setFilters] = React.useState({
    category: "all",
    dateFrom: "",
    dateTo: "",
    amountMin: "",
    amountMax: ""
  })

  // 优化的数据加载
  const loadProjectData = React.useCallback(async () => {
    if (!project) return
    
    setLoading(true)
    try {
      const projectTransactions = await getTransactions({ projectid: project.projectid })
      setTransactions(projectTransactions)
      setFilteredTransactions(projectTransactions)
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
  const calculateTransactionStats = React.useCallback((transactions: Transaction[]) => {
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
      if (transaction.income > 0) {
        stats.incomeByCategory[transaction.category] = 
          (stats.incomeByCategory[transaction.category] || 0) + transaction.income
      }
      
      // 按分类统计支出
      if (transaction.expense > 0) {
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
    }, 100)
  }, [onOpenChange])

  // 优化的统计数据
  const currentStats = React.useMemo(() => 
    calculateTransactionStats(filteredTransactions), 
    [filteredTransactions, calculateTransactionStats]
  )

  // 优化的分类选项
  const categoryOptions = React.useMemo(() => {
    const categories = [...new Set(transactions.map(t => t.category))]
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
    }
  }, [open, project, loadProjectData])

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
              <CardTitle>交易记录 ({filteredTransactions.length})</CardTitle>
              {loading && (
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm text-muted-foreground">加载中...</span>
                </div>
              )}
            </CardHeader>
            <CardContent>
              {filteredTransactions.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>日期</TableHead>
                      <TableHead>描述</TableHead>
                      <TableHead>分类</TableHead>
                      <TableHead className="text-right">收入</TableHead>
                      <TableHead className="text-right">支出</TableHead>
                      <TableHead className="text-right">净额</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTransactions.map((transaction, index) => (
                      <TransactionRow key={index} transaction={transaction} />
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