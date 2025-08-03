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

// 辅助函数：处理日期格式
const formatProjectDate = (date: string | { seconds: number; nanoseconds: number }): string => {
  if (typeof date === 'string') {
    return new Date(date).toLocaleDateString()
  } else if (date?.seconds) {
    return new Date(date.seconds * 1000).toLocaleDateString()
  }
  return 'N/A'
}

// 辅助函数：格式化交易日期
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

// 辅助函数：计算净金额
const calculateNetAmount = (transaction: Transaction): number => {
  return transaction.income - transaction.expense
}

// 辅助函数：格式化净金额
const formatNetAmount = (transaction: Transaction): string => {
  const netAmount = calculateNetAmount(transaction)
  return netAmount >= 0 ? `+$${netAmount.toFixed(2)}` : `-$${Math.abs(netAmount).toFixed(2)}`
}

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

export function ProjectDetailsDialog({
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
  
  // 筛选状态
  const [filters, setFilters] = React.useState({
    search: "",
    dateRange: "all",
    category: "all",
    status: "all"
  })

  // 获取项目相关的交易记录
  const fetchProjectTransactions = React.useCallback(async () => {
    if (!project) return
    
    setLoading(true)
    try {
      const allTransactions = await getTransactions()
      
      // 调试信息：检查项目和交易数据
      console.log('🔍 调试项目匹配信息:', {
        projectName: project.name,
        projectId: project.projectid,
        totalTransactions: allTransactions.length
      })
      
      // 显示所有交易的projectid
      console.log('📊 所有交易的projectid:', allTransactions.map(t => ({
        description: t.description,
        projectid: t.projectid,
        income: t.income,
        expense: t.expense
      })))
      
      // 显示匹配测试
      console.log('🧪 匹配测试:', {
        projectName: project.name,
        projectId: project.projectid,
        projectNameLower: project.name.toLowerCase(),
        projectCodeKey: project.projectid ? project.projectid.toLowerCase().split('_').pop() : null
      })
      
      // 根据projectid匹配银行交易记录（支持多种匹配方式）
      const projectTransactions = allTransactions.filter(transaction => {
        // 1. 精确匹配：检查交易的项目户口是否匹配项目的projectid
        const exactMatch = transaction.projectid === project.projectid
        
        // 2. 项目名称匹配：检查交易projectid是否包含项目名称
        const nameMatch = transaction.projectid && 
                         transaction.projectid.toLowerCase().includes(project.name.toLowerCase())
        
        // 3. 项目代码匹配：检查交易projectid是否包含项目代码的关键部分
        const codeMatch = transaction.projectid && 
                         project.projectid && 
                         transaction.projectid.toLowerCase().includes(project.projectid.toLowerCase().split('_').pop() || '')
        
        const isMatch = exactMatch || nameMatch || codeMatch
        
        // 调试信息
        if (isMatch) {
          console.log(`✅ 匹配到交易: ${transaction.description}`, {
            projectName: project.name,
            projectId: project.projectid,
            transactionProjectId: transaction.projectid,
            transactionDescription: transaction.description,
            transactionAmount: `收入: $${transaction.income}, 支出: $${transaction.expense}`,
            matchType: exactMatch ? '精确匹配' : nameMatch ? '名称匹配' : '代码匹配'
          })
        }
        
        return isMatch
      })
      
      console.log(`📈 匹配结果: 找到 ${projectTransactions.length} 笔相关交易`)
      
      setTransactions(projectTransactions)
      setFilteredTransactions(projectTransactions)
      
      // 计算统计数据
      calculateTransactionStats(projectTransactions)
      
    } catch (error) {
      console.error("Error fetching project transactions:", error)
      toast({
        title: "错误",
        description: "无法加载项目交易记录",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }, [project, toast])

  // 计算交易统计数据
  const calculateTransactionStats = (transactions: Transaction[]) => {
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
        const category = transaction.category || "未分类"
        stats.incomeByCategory[category] = (stats.incomeByCategory[category] || 0) + transaction.income
      }
      
      // 按分类统计支出
      if (transaction.expense > 0) {
        const category = transaction.category || "未分类"
        stats.expenseByCategory[category] = (stats.expenseByCategory[category] || 0) + transaction.expense
      }
    })
    
    stats.netAmount = stats.totalIncome - stats.totalExpense
    setStats(stats)
  }

  // 应用筛选
  React.useEffect(() => {
    let filtered = transactions
    
    // 搜索筛选
    if (filters.search) {
      const searchLower = filters.search.toLowerCase()
      filtered = filtered.filter(transaction =>
        transaction.description.toLowerCase().includes(searchLower) ||
        (transaction.description2 && transaction.description2.toLowerCase().includes(searchLower))
      )
    }
    
    // 状态筛选
    if (filters.status !== "all") {
      filtered = filtered.filter(transaction => transaction.status === filters.status)
    }
    
    // 分类筛选
    if (filters.category !== "all") {
      filtered = filtered.filter(transaction => transaction.category === filters.category)
    }
    
    setFilteredTransactions(filtered)
  }, [transactions, filters])

  // 当项目变化时重新获取数据
  React.useEffect(() => {
    if (open && project) {
      fetchProjectTransactions()
    }
  }, [open, project, fetchProjectTransactions])

  // 导出项目交易记录
  const exportProjectTransactions = () => {
    if (!project || filteredTransactions.length === 0) return
    
    const csvContent = [
      ["日期", "描述", "描述2", "收入", "支出", "净额", "状态", "分类", "参考"],
      ...filteredTransactions.map(transaction => [
        formatTransactionDate(transaction.date),
        transaction.description,
        transaction.description2 || "",
        transaction.income.toFixed(2),
        transaction.expense.toFixed(2),
        calculateNetAmount(transaction).toFixed(2),
        transaction.status,
        transaction.category || "",
        transaction.projectid || ""
      ])
    ].map(row => row.join(",")).join("\n")
    
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    link.setAttribute("download", `${project.name}_交易记录_${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  if (!project) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            项目详情 - {project.name}
          </DialogTitle>
          <DialogDescription>
            查看项目的详细信息和相关银行交易记录
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* 项目基本信息 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">项目基本信息</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <Label className="text-sm font-medium">项目名称</Label>
                  <p className="text-sm text-muted-foreground">{project.name}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">项目代码</Label>
                  <p className="text-sm text-muted-foreground">{project.projectid}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">BOD分类</Label>
                  <p className="text-sm text-muted-foreground">{BODCategories[project.bodCategory]}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">项目状态</Label>
                  <Badge
                    variant={
                      project.status === "Active"
                        ? "default"
                        : project.status === "Completed"
                          ? "secondary"
                          : "outline"
                    }
                  >
                    {project.status === "Active" ? "进行中" : 
                     project.status === "Completed" ? "已完成" : "暂停"}
                  </Badge>
                </div>
                <div>
                  <Label className="text-sm font-medium">开始日期</Label>
                  <p className="text-sm text-muted-foreground">{formatProjectDate(project.startDate)}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">结束日期</Label>
                  <p className="text-sm text-muted-foreground">
                    {project.endDate ? formatProjectDate(project.endDate) : "未设置"}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium">预算</Label>
                  <p className="text-sm font-mono">${project.budget.toLocaleString()}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">已花费</Label>
                  <p className="text-sm font-mono">${stats.totalExpense.toLocaleString()}</p>
                </div>
              </div>
              
              {project.description && (
                <div className="mt-4">
                  <Label className="text-sm font-medium">项目描述</Label>
                  <p className="text-sm text-muted-foreground">{project.description}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* 财务统计 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">财务统计</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 border rounded-lg bg-green-50">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-green-600" />
                    <span className="text-sm font-medium text-green-600">总收入</span>
                  </div>
                  <p className="text-2xl font-bold text-green-600">${stats.totalIncome.toLocaleString()}</p>
                </div>
                <div className="p-4 border rounded-lg bg-red-50">
                  <div className="flex items-center gap-2">
                    <TrendingDown className="h-4 w-4 text-red-600" />
                    <span className="text-sm font-medium text-red-600">总支出</span>
                  </div>
                  <p className="text-2xl font-bold text-red-600">${stats.totalExpense.toLocaleString()}</p>
                </div>
                <div className="p-4 border rounded-lg bg-blue-50">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-blue-600" />
                    <span className="text-sm font-medium text-blue-600">净收入</span>
                  </div>
                  <p className={`text-2xl font-bold ${stats.netAmount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    ${stats.netAmount.toLocaleString()}
                  </p>
                </div>
                <div className="p-4 border rounded-lg bg-gray-50">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-600" />
                    <span className="text-sm font-medium text-gray-600">交易笔数</span>
                  </div>
                  <p className="text-2xl font-bold text-gray-600">{stats.transactionCount}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 收支明细 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">收支明细</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* 收入明细 */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-green-600" />
                    <h3 className="font-medium text-green-600">收入明细</h3>
                  </div>
                  {Object.keys(stats.incomeByCategory).length > 0 ? (
                    <div className="space-y-2">
                      {Object.entries(stats.incomeByCategory).map(([category, amount]) => (
                        <div key={category} className="flex items-center justify-between p-3 border rounded-lg bg-green-50">
                          <span className="font-medium">{category}</span>
                          <span className="text-green-600 font-mono">${amount.toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-center py-4">暂无收入记录</p>
                  )}
                </div>
                
                {/* 支出明细 */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <TrendingDown className="h-4 w-4 text-red-600" />
                    <h3 className="font-medium text-red-600">支出明细</h3>
                  </div>
                  {Object.keys(stats.expenseByCategory).length > 0 ? (
                    <div className="space-y-2">
                      {Object.entries(stats.expenseByCategory).map(([category, amount]) => (
                        <div key={category} className="flex items-center justify-between p-3 border rounded-lg bg-red-50">
                          <span className="font-medium">{category}</span>
                          <span className="text-red-600 font-mono">${amount.toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-center py-4">暂无支出记录</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 交易记录 */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">银行交易记录</CardTitle>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={exportProjectTransactions}
                    disabled={filteredTransactions.length === 0}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    导出
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {/* 筛选器 */}
              <div className="flex flex-wrap gap-4 mb-4">
                <div className="flex-1 min-w-[200px]">
                  <Input
                    placeholder="搜索交易记录..."
                    value={filters.search}
                    onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                  />
                </div>
                <Select value={filters.status} onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="状态" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">全部状态</SelectItem>
                    <SelectItem value="Completed">已完成</SelectItem>
                    <SelectItem value="Pending">待处理</SelectItem>
                    <SelectItem value="Draft">草稿</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={filters.category} onValueChange={(value) => setFilters(prev => ({ ...prev, category: value }))}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="分类" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">全部分类</SelectItem>
                    <SelectItem value="销售收入">销售收入</SelectItem>
                    <SelectItem value="服务收入">服务收入</SelectItem>
                    <SelectItem value="水电费">水电费</SelectItem>
                    <SelectItem value="办公用品">办公用品</SelectItem>
                    <SelectItem value="其他费用">其他费用</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* 交易记录表格 */}
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin mr-2" />
                  加载中...
                </div>
              ) : filteredTransactions.length > 0 ? (
                <div className="max-h-[400px] overflow-y-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>日期</TableHead>
                        <TableHead>描述</TableHead>
                        <TableHead>描述2</TableHead>
                        <TableHead className="text-right">收入</TableHead>
                        <TableHead className="text-right">支出</TableHead>
                        <TableHead className="text-right">净额</TableHead>
                        <TableHead>状态</TableHead>
                        <TableHead>分类</TableHead>
                        <TableHead>参考</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredTransactions.map((transaction) => (
                        <TableRow key={transaction.id}>
                          <TableCell className="font-mono text-sm">
                            {formatTransactionDate(transaction.date)}
                          </TableCell>
                          <TableCell className="max-w-[200px] truncate">
                            {transaction.description}
                          </TableCell>
                          <TableCell className="max-w-[200px] truncate">
                            {transaction.description2 || "-"}
                          </TableCell>
                          <TableCell className="text-right font-mono">
                            {transaction.income > 0 ? `$${transaction.income.toFixed(2)}` : "-"}
                          </TableCell>
                          <TableCell className="text-right font-mono">
                            {transaction.expense > 0 ? `$${transaction.expense.toFixed(2)}` : "-"}
                          </TableCell>
                          <TableCell className={`text-right font-mono ${calculateNetAmount(transaction) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {formatNetAmount(transaction)}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                transaction.status === "Completed"
                                  ? "default"
                                  : transaction.status === "Pending"
                                    ? "secondary"
                                    : "outline"
                              }
                            >
                              {transaction.status === "Completed" ? "已完成" : 
                               transaction.status === "Pending" ? "待处理" : "草稿"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {transaction.category || "未分类"}
                          </TableCell>
                                                  <TableCell className="font-mono text-sm">
                          {transaction.projectid || "-"}
                        </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  暂无相关的银行交易记录
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-end space-x-2 pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            关闭
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
} 