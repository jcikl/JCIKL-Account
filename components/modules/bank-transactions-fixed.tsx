import React from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Calendar, Plus, Upload, Download, Search, Filter, Edit, Trash2, Save, X } from "lucide-react"
import { useAuth } from "@/components/auth/auth-context"
import { useToast } from "@/hooks/use-toast"
import { 
  getTransactions, 
  getAccounts, 
  getProjects, 
  getCategories,
  addDocument, 
  updateDocument, 
  deleteDocument 
} from "@/lib/firebase-utils"
import type { Transaction, Account, Project, Category } from "@/lib/data"

// 优化的交易行组件
const TransactionRow = React.memo(({ 
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
}) => {
  const calculateNetAmount = React.useMemo(() => {
    const expense = parseFloat(transaction.expense || "0")
    const income = parseFloat(transaction.income || "0")
    return income - expense
  }, [transaction.expense, transaction.income])

  const formatNetAmount = React.useMemo(() => {
    return calculateNetAmount >= 0 ? `+$${calculateNetAmount.toFixed(2)}` : `-$${Math.abs(calculateNetAmount).toFixed(2)}`
  }, [calculateNetAmount])

  return (
    <TableRow className={isSelected ? "bg-muted" : ""}>
      <TableCell>
        <input
          type="checkbox"
          checked={isSelected}
          onChange={() => onSelect(transaction.id!)}
          className="rounded"
        />
      </TableCell>
      <TableCell>{formatDate(transaction.date)}</TableCell>
      <TableCell>{transaction.description}</TableCell>
      <TableCell>{transaction.description2 || "-"}</TableCell>
      <TableCell className="text-right">
        {transaction.expense ? `$${parseFloat(transaction.expense).toFixed(2)}` : "-"}
      </TableCell>
      <TableCell className="text-right">
        {transaction.income ? `$${parseFloat(transaction.income).toFixed(2)}` : "-"}
      </TableCell>
      <TableCell className="text-right font-medium">
        {formatNetAmount}
      </TableCell>
      <TableCell className="text-right font-medium">
        ${runningBalance.toFixed(2)}
      </TableCell>
      <TableCell>
        <Badge variant={
          transaction.status === "Completed" ? "default" :
          transaction.status === "Pending" ? "secondary" : "outline"
        }>
          {transaction.status}
        </Badge>
      </TableCell>
      <TableCell>{transaction.reference || "-"}</TableCell>
      <TableCell>{transaction.category || "-"}</TableCell>
      {hasPermission && (
        <TableCell>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEdit(transaction)}
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete(transaction.id!)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </TableCell>
      )}
    </TableRow>
  )
})

export function BankTransactionsFixed() {
  const { currentUser, hasPermission } = useAuth()
  const { toast } = useToast()
  const [transactions, setTransactions] = React.useState<Transaction[]>([])
  const [accounts, setAccounts] = React.useState<Account[]>([])
  const [projects, setProjects] = React.useState<Project[]>([])
  const [categories, setCategories] = React.useState<Category[]>([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [searchTerm, setSearchTerm] = React.useState("")
  const [statusFilter, setStatusFilter] = React.useState("all")
  const [selectedTransactions, setSelectedTransactions] = React.useState<Set<string>>(new Set())
  
  // 优化的日期范围过滤状态
  const [dateRangeFilter, setDateRangeFilter] = React.useState({
    enabled: true,
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    endDate: new Date().toISOString().split("T")[0]
  })

  // 优化的数据加载
  const fetchData = React.useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      // 并行加载所有数据
      const [transactionsData, accountsData, projectsData, categoriesData] = await Promise.all([
        getTransactions(),
        getAccounts(),
        getProjects(),
        getCategories()
      ])
      
      setTransactions(transactionsData)
      setAccounts(accountsData)
      setProjects(projectsData)
      setCategories(categoriesData)
    } catch (err: any) {
      setError("无法加载数据: " + err.message)
      console.error("Error fetching data:", err)
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    fetchData()
  }, [fetchData])

  // 优化的过滤逻辑 - 使用useMemo避免不必要的重新计算
  const filteredTransactions = React.useMemo(() => {
    let filtered = transactions

    // 日期范围过滤 - 优化后的逻辑
    if (dateRangeFilter.enabled) {
      const startDate = new Date(dateRangeFilter.startDate)
      const endDate = new Date(dateRangeFilter.endDate)
      endDate.setHours(23, 59, 59, 999)
      
      filtered = filtered.filter(transaction => {
        const transactionDate = typeof transaction.date === 'string' 
          ? new Date(transaction.date) 
          : new Date(transaction.date.seconds * 1000)
        return transactionDate >= startDate && transactionDate <= endDate
      })
    }

    // 搜索过滤
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase()
      filtered = filtered.filter(transaction =>
        transaction.description.toLowerCase().includes(searchLower) ||
        (transaction.description2 && transaction.description2.toLowerCase().includes(searchLower)) ||
        (transaction.projectid && transaction.projectid.toLowerCase().includes(searchLower)) ||
        (transaction.category && transaction.category.toLowerCase().includes(searchLower))
      )
    }

    // 状态过滤
    if (statusFilter !== 'all') {
      filtered = filtered.filter(transaction => transaction.status === statusFilter)
    }

    return filtered
  }, [transactions, dateRangeFilter, searchTerm, statusFilter])

  // 优化的运行余额计算
  const runningBalances = React.useMemo(() => {
    const balances: { transaction: Transaction; runningBalance: number }[] = []
    let runningBalance = 0

    filteredTransactions.forEach(transaction => {
      const expense = parseFloat(transaction.expense || "0")
      const income = parseFloat(transaction.income || "0")
      const netAmount = income - expense
      runningBalance += netAmount
      
      balances.push({
        transaction,
        runningBalance
      })
    })

    return balances
  }, [filteredTransactions])

  // 优化的日期格式化函数
  const formatDate = React.useCallback((date: string | { seconds: number; nanoseconds: number }): string => {
    if (typeof date === 'string') {
      return new Date(date).toLocaleDateString('zh-CN')
    } else {
      return new Date(date.seconds * 1000).toLocaleDateString('zh-CN')
    }
  }, [])

  // 优化的选择处理函数
  const handleSelectTransaction = React.useCallback((transactionId: string) => {
    setSelectedTransactions(prev => {
      const newSet = new Set(prev)
      if (newSet.has(transactionId)) {
        newSet.delete(transactionId)
      } else {
        newSet.add(transactionId)
      }
      return newSet
    })
  }, [])

  const handleSelectAll = React.useCallback(() => {
    if (selectedTransactions.size === filteredTransactions.length) {
      setSelectedTransactions(new Set())
    } else {
      setSelectedTransactions(new Set(filteredTransactions.map(t => t.id!)))
    }
  }, [selectedTransactions.size, filteredTransactions])

  // 优化的日期范围处理函数
  const handleDateRangeChange = React.useCallback((field: 'startDate' | 'endDate', value: string) => {
    setDateRangeFilter(prev => ({ ...prev, [field]: value }))
  }, [])

  const handleDateRangeToggle = React.useCallback(() => {
    setDateRangeFilter(prev => ({ ...prev, enabled: !prev.enabled }))
  }, [])

  const handleResetDateRange = React.useCallback(() => {
    setDateRangeFilter({
      enabled: true,
      startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      endDate: new Date().toISOString().split("T")[0]
    })
  }, [])

  if (loading) {
    return (
      <div className="p-6 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
        <p className="mt-2">加载交易数据...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6 text-center text-red-600">
        <p>错误: {error}</p>
        <Button onClick={fetchData} className="mt-2">重试</Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* 控制面板 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>银行交易记录 (优化版)</span>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              添加交易
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* 搜索和过滤 */}
          <div className="flex flex-wrap gap-4 mb-4">
            <div className="flex-1 min-w-[200px]">
              <Label htmlFor="search">搜索</Label>
              <Input
                id="search"
                placeholder="搜索描述、项目、类别..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="mt-1"
              />
            </div>
            
            <div>
              <Label htmlFor="status-filter">状态</Label>
              <select
                id="status-filter"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2"
              >
                <option value="all">全部</option>
                <option value="Completed">已完成</option>
                <option value="Pending">待处理</option>
                <option value="Draft">草稿</option>
              </select>
            </div>

            {/* 优化的日期范围控制 */}
            <div className="flex items-center gap-2">
              <Label htmlFor="date-filter-toggle" className="text-sm font-medium">
                日期范围:
              </Label>
              <Button
                variant={dateRangeFilter.enabled ? "default" : "outline"}
                size="sm"
                onClick={handleDateRangeToggle}
              >
                <Calendar className="h-4 w-4 mr-2" />
                {dateRangeFilter.enabled ? "启用" : "禁用"}
              </Button>
              
              {dateRangeFilter.enabled && (
                <div className="flex items-center gap-2">
                  <Input
                    type="date"
                    value={dateRangeFilter.startDate}
                    onChange={(e) => handleDateRangeChange('startDate', e.target.value)}
                    className="w-32"
                  />
                  <span className="text-sm">至</span>
                  <Input
                    type="date"
                    value={dateRangeFilter.endDate}
                    onChange={(e) => handleDateRangeChange('endDate', e.target.value)}
                    className="w-32"
                  />
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={handleResetDateRange}
                  >
                    重置
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* 统计信息 */}
          <div className="flex justify-between items-center mb-4">
            <div className="text-sm text-muted-foreground">
              显示 {filteredTransactions.length} 条交易记录
              {selectedTransactions.size > 0 && ` (已选择 ${selectedTransactions.size} 条)`}
            </div>
            <div className="text-sm text-muted-foreground">
              总记录数: {transactions.length}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 交易表格 */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>
                  <input
                    type="checkbox"
                    checked={selectedTransactions.size === filteredTransactions.length && filteredTransactions.length > 0}
                    onChange={handleSelectAll}
                    className="rounded"
                  />
                </TableHead>
                <TableHead>日期</TableHead>
                <TableHead>描述</TableHead>
                <TableHead>描述2</TableHead>
                <TableHead className="text-right">支出</TableHead>
                <TableHead className="text-right">收入</TableHead>
                <TableHead className="text-right">净额</TableHead>
                <TableHead className="text-right">余额</TableHead>
                <TableHead>状态</TableHead>
                <TableHead>参考号</TableHead>
                <TableHead>类别</TableHead>
                {hasPermission && <TableHead>操作</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {runningBalances.map(({ transaction, runningBalance }) => (
                <TransactionRow
                  key={transaction.id}
                  transaction={transaction}
                  runningBalance={runningBalance}
                  onSelect={handleSelectTransaction}
                  onEdit={() => {}} // 待实现
                  onDelete={() => {}} // 待实现
                  hasPermission={hasPermission}
                  isSelected={selectedTransactions.has(transaction.id!)}
                  formatDate={formatDate}
                  isSortEditMode={false}
                />
              ))}
            </TableBody>
          </Table>
          
          {filteredTransactions.length === 0 && (
            <div className="p-8 text-center text-muted-foreground">
              没有找到匹配的交易记录
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
} 