"use client"

import * as React from "react"
import { Download, Filter, Search, X, Calendar, DollarSign, FileText, FileSpreadsheet, Loader2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Separator } from "@/components/ui/separator"
import { useOptimizedAccounts, useOptimizedTransactions } from "@/hooks/use-optimized-data"
import type { Account, Transaction } from "@/lib/data"
import { useAuth } from "@/components/auth/auth-context"
import { RoleLevels, UserRoles } from "@/lib/data"
import { AccountChartOptimized } from "./account-chart-optimized"
import { GlSettingsManagement } from "./gl-settings-management"
import * as XLSX from 'xlsx'
import jsPDF from 'jspdf'

interface FilterState {
  dateFrom: string
  dateTo: string
  amountMin: string
  amountMax: string
  statuses: string[]
  categories: string[]
  accounts: string[]
}

// 优化的交易行组件
const TransactionRow = React.memo(({ transaction }: { transaction: Transaction }) => {
  const formatDate = React.useCallback((date: string | { seconds: number; nanoseconds: number }): string => {
    if (typeof date === 'string') return date
    if (date?.seconds) return new Date(date.seconds * 1000).toLocaleDateString()
    return 'N/A'
  }, [])

  return (
    <TableRow>
      <TableCell>{formatDate(transaction.date)}</TableCell>
      <TableCell className="font-medium">{transaction.id}</TableCell>
      <TableCell>{transaction.description}</TableCell>
      <TableCell>{transaction.description2 || '-'}</TableCell>
      <TableCell className="text-right font-mono">
        {transaction.expense > 0 ? `$${transaction.expense.toLocaleString()}` : "-"}
      </TableCell>
      <TableCell className="text-right font-mono">
        {transaction.income > 0 ? `$${transaction.income.toLocaleString()}` : "-"}
      </TableCell>
      <TableCell>
        <Badge variant={transaction.status === "Completed" ? "default" : "secondary"}>
          {transaction.status}
        </Badge>
      </TableCell>
    </TableRow>
  )
}, (prevProps, nextProps) => {
  return prevProps.transaction.id === nextProps.transaction.id &&
         prevProps.transaction.status === nextProps.transaction.status &&
         prevProps.transaction.expense === nextProps.transaction.expense &&
         prevProps.transaction.income === nextProps.transaction.income
})

// 优化的统计卡片组件
const StatCard = React.memo(({ type, accounts }: { type: string; accounts: Account[] }) => {
  const accountsOfType = React.useMemo(() => 
    accounts.filter((account) => account.type === type), 
    [accounts, type]
  )
  
  const totalBalance = React.useMemo(() => 
    accountsOfType.reduce((sum, account) => sum + account.balance, 0), 
    [accountsOfType]
  )

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">{type} 账户</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">${totalBalance.toLocaleString()}</div>
        <p className="text-xs text-muted-foreground">{accountsOfType.length} 个账户</p>
      </CardContent>
    </Card>
  )
}, (prevProps, nextProps) => {
  return prevProps.type === nextProps.type && 
         prevProps.accounts.length === nextProps.accounts.length
})

export function GeneralLedgerOptimized() {
  const { hasPermission } = useAuth()
  
  // 使用优化的数据 hooks
  const { data: accounts, loading: accountsLoading, error: accountsError } = useOptimizedAccounts()
  const { data: transactions, loading: transactionsLoading, error: transactionsError } = useOptimizedTransactions({ limit: 1000 })

  // 状态管理
  const [selectedAccount, setSelectedAccount] = React.useState("all")
  const [searchTerm, setSearchTerm] = React.useState("")
  const [showAdvancedFilter, setShowAdvancedFilter] = React.useState(false)
  const [showExportDialog, setShowExportDialog] = React.useState(false)
  const [exportFormat, setExportFormat] = React.useState<"csv" | "excel" | "pdf">("csv")
  const [exportProgress, setExportProgress] = React.useState(0)
  const [isExporting, setIsExporting] = React.useState(false)

  // 高级筛选状态
  const [filters, setFilters] = React.useState<FilterState>({
    dateFrom: "",
    dateTo: "",
    amountMin: "",
    amountMax: "",
    statuses: [],
    categories: [],
    accounts: []
  })

  // 获取所有可用的状态和类别
  const allStatuses = React.useMemo(() => {
    if (!transactions) return []
    const statuses = new Set(transactions.map(t => t.status))
    return Array.from(statuses)
  }, [transactions])

  const allCategories = React.useMemo(() => {
    if (!transactions) return []
    const categories = new Set(transactions.map(t => t.category).filter((category): category is string => Boolean(category)))
    return Array.from(categories)
  }, [transactions])

  // 优化的过滤逻辑
  const filteredTransactions = React.useMemo(() => {
    if (!transactions) return []
    
    return transactions.filter((transaction) => {
      const matchesSearch = transaction.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (transaction.description2 && transaction.description2.toLowerCase().includes(searchTerm.toLowerCase()))

      const matchesDateFrom = !filters.dateFrom || 
        (typeof transaction.date === 'string' && transaction.date >= filters.dateFrom)
      const matchesDateTo = !filters.dateTo || 
        (typeof transaction.date === 'string' && transaction.date <= filters.dateTo)
      
      const transactionAmount = transaction.expense > 0 ? transaction.expense : transaction.income
      const matchesAmountMin = !filters.amountMin || transactionAmount >= parseFloat(filters.amountMin)
      const matchesAmountMax = !filters.amountMax || transactionAmount <= parseFloat(filters.amountMax)
      
      const matchesStatus = filters.statuses.length === 0 || filters.statuses.includes(transaction.status)
      const matchesCategory = filters.categories.length === 0 || 
        (transaction.category && filters.categories.includes(transaction.category))
      const matchesAccountFilter = filters.accounts.length === 0

      return matchesSearch && matchesDateFrom && matchesDateTo && 
             matchesAmountMin && matchesAmountMax && matchesStatus && 
             matchesCategory && matchesAccountFilter
    })
  }, [transactions, selectedAccount, searchTerm, filters])

  // 优化的导出功能
  const exportData = React.useCallback(async (format: "csv" | "excel" | "pdf") => {
    setIsExporting(true)
    setExportProgress(0)

    try {
      const progressInterval = setInterval(() => {
        setExportProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval)
            return prev
          }
          return prev + Math.random() * 20
        })
      }, 200)

      const data = filteredTransactions.map(t => ({
        日期: typeof t.date === 'string' ? t.date : 
              t.date?.seconds ? new Date(t.date.seconds * 1000).toLocaleDateString() : 'N/A',
        交易ID: t.id,
        描述: t.description,
        描述2: t.description2 || '',
        支出: t.expense > 0 ? t.expense : '',
        收入: t.income > 0 ? t.income : '',
        净额: t.income - t.expense,
        状态: t.status,
        类别: t.category || '',
        项目ID: t.projectid || ''
      }))

      if (format === "csv") {
        await exportToCSV(data)
      } else if (format === "excel") {
        await exportToExcel(data)
      } else if (format === "pdf") {
        await exportToPDF(data)
      }

      clearInterval(progressInterval)
      setExportProgress(100)
      
      setTimeout(() => {
        setIsExporting(false)
        setShowExportDialog(false)
        setExportProgress(0)
      }, 1000)
    } catch (error) {
      console.error("Export error:", error)
      setIsExporting(false)
    }
  }, [filteredTransactions])

  const exportToCSV = React.useCallback(async (data: any[]) => {
    const headers = Object.keys(data[0] || {})
    const csvContent = [
      headers.join(','),
      ...data.map(row => headers.map(header => `"${row[header]}"`).join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `总账报表_${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }, [])

  const exportToExcel = React.useCallback(async (data: any[]) => {
    const worksheet = XLSX.utils.json_to_sheet(data)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, "总账报表")
    
    const columnWidths = [
      { wch: 12 }, { wch: 15 }, { wch: 30 }, { wch: 20 },
      { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 10 },
      { wch: 15 }, { wch: 15 }
    ]
    worksheet['!cols'] = columnWidths

    XLSX.writeFile(workbook, `总账报表_${new Date().toISOString().split('T')[0]}.xlsx`)
  }, [])

  const exportToPDF = React.useCallback(async (data: any[]) => {
    const doc = new jsPDF('landscape', 'mm', 'a4')
    
    doc.setFont('helvetica')
    doc.setFontSize(16)
    doc.text('总账报表', 140, 20, { align: 'center' })
    doc.setFontSize(10)
    doc.text(`生成时间: ${new Date().toLocaleString('zh-CN')}`, 140, 30, { align: 'center' })
    
    doc.setFontSize(8)
    let yPosition = 50
    
    // 表头
    const columns = [
      { header: '日期', width: 25 }, { header: '交易ID', width: 30 },
      { header: '描述', width: 50 }, { header: '支出', width: 25 },
      { header: '收入', width: 25 }, { header: '状态', width: 20 }
    ]
    
    let xPosition = 10
    columns.forEach(column => {
      doc.rect(xPosition, yPosition, column.width, 8)
      doc.text(column.header, xPosition + 2, yPosition + 5)
      xPosition += column.width
    })
    
    // 数据行
    yPosition += 8
    data.forEach((row) => {
      if (yPosition > 180) {
        doc.addPage()
        yPosition = 20
      }
      
      xPosition = 10
      columns.forEach(column => {
        doc.rect(xPosition, yPosition, column.width, 6)
        const cellText = row[column.header] || ''
        doc.text(cellText.toString(), xPosition + 1, yPosition + 4)
        xPosition += column.width
      })
      yPosition += 6
    })
    
    doc.setFontSize(8)
    doc.text(`共 ${data.length} 条记录`, 10, 200)
    doc.text(`第 1 页`, 140, 200, { align: 'center' })
    
    doc.save(`总账报表_${new Date().toISOString().split('T')[0]}.pdf`)
  }, [])

  const clearFilters = React.useCallback(() => {
    setFilters({
      dateFrom: "", dateTo: "", amountMin: "", amountMax: "",
      statuses: [], categories: [], accounts: []
    })
  }, [])

  const hasActiveFilters = React.useCallback(() => {
    return filters.dateFrom || filters.dateTo || filters.amountMin || filters.amountMax || 
           filters.statuses.length > 0 || filters.categories.length > 0 || filters.accounts.length > 0
  }, [filters])

  const handleAdvancedFilterClick = React.useCallback(() => {
    setShowAdvancedFilter(true)
  }, [])

  // 加载状态
  if (accountsLoading || transactionsLoading) {
    return (
      <div className="p-6 text-center">
        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
        <p className="text-muted-foreground">加载总账数据...</p>
      </div>
    )
  }

  // 错误状态
  if (accountsError || transactionsError) {
    return (
      <div className="p-6 text-center">
        <div className="text-red-500 mb-4">
          <h3 className="text-lg font-semibold">加载失败</h3>
          <p className="text-sm text-muted-foreground">
            {(accountsError as any)?.message || (transactionsError as any)?.message || '未知错误'}
          </p>
        </div>
        <Button onClick={() => window.location.reload()} variant="outline">
          重试
        </Button>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">总账</h1>
          <p className="text-muted-foreground">按账户记录所有财务交易的完整记录。</p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            className={hasActiveFilters() ? "border-blue-500 bg-blue-50" : ""}
            onClick={handleAdvancedFilterClick}
          >
            <Filter className="h-4 w-4 mr-2" />
            高级筛选
            {hasActiveFilters() && (
              <Badge variant="secondary" className="ml-2 text-xs">
                {filters.statuses.length + filters.categories.length + filters.accounts.length + 
                 (filters.dateFrom ? 1 : 0) + (filters.dateTo ? 1 : 0) + 
                 (filters.amountMin ? 1 : 0) + (filters.amountMax ? 1 : 0)}
              </Badge>
            )}
          </Button>

          {hasPermission(RoleLevels[UserRoles.VICE_PRESIDENT]) && (
            <Dialog open={showExportDialog} onOpenChange={setShowExportDialog}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  导出
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>导出总账数据</DialogTitle>
                  <DialogDescription>选择导出格式并下载筛选后的数据</DialogDescription>
                </DialogHeader>
                
                <div className="space-y-4">
                  <div className="space-y-3">
                    <Label>导出格式</Label>
                    <div className="grid grid-cols-3 gap-3">
                      {["csv", "excel", "pdf"].map((format) => (
                        <div key={format} className="flex items-center space-x-2">
                          <input
                            type="radio"
                            id={format}
                            name="exportFormat"
                            value={format}
                            checked={exportFormat === format}
                            onChange={(e) => setExportFormat(e.target.value as "csv" | "excel" | "pdf")}
                          />
                          <Label htmlFor={format} className="flex items-center gap-2">
                            <FileText className="h-4 w-4" />
                            {format.toUpperCase()}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>导出信息</Label>
                    <div className="text-sm text-muted-foreground">
                      <p>将导出 {filteredTransactions.length} 条交易记录</p>
                      <p>包含筛选条件：{hasActiveFilters() ? "是" : "否"}</p>
                    </div>
                  </div>

                  {isExporting && (
                    <div className="space-y-2">
                      <Label>导出进度</Label>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                          style={{ width: `${exportProgress}%` }}
                        ></div>
                      </div>
                      <p className="text-sm text-muted-foreground">{exportProgress}%</p>
                    </div>
                  )}

                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setShowExportDialog(false)}>
                      取消
                    </Button>
                    <Button 
                      onClick={() => exportData(exportFormat)}
                      disabled={isExporting}
                    >
                      {isExporting ? "导出中..." : "开始导出"}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      {/* 显示活跃的筛选条件 */}
      {hasActiveFilters() && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-800">活跃筛选条件：</span>
                <div className="flex flex-wrap gap-1">
                  {filters.dateFrom && (
                    <Badge variant="secondary" className="text-xs">
                      开始日期: {filters.dateFrom}
                    </Badge>
                  )}
                  {filters.dateTo && (
                    <Badge variant="secondary" className="text-xs">
                      结束日期: {filters.dateTo}
                    </Badge>
                  )}
                  {filters.amountMin && (
                    <Badge variant="secondary" className="text-xs">
                      最小金额: ${filters.amountMin}
                    </Badge>
                  )}
                  {filters.amountMax && (
                    <Badge variant="secondary" className="text-xs">
                      最大金额: ${filters.amountMax}
                    </Badge>
                  )}
                  {filters.statuses.map(status => (
                    <Badge key={status} variant="secondary" className="text-xs">
                      状态: {status}
                    </Badge>
                  ))}
                  {filters.categories.map(category => (
                    <Badge key={category} variant="secondary" className="text-xs">
                      类别: {category}
                    </Badge>
                  ))}
                  {filters.accounts.map(account => (
                    <Badge key={account} variant="secondary" className="text-xs">
                      账户: {account}
                    </Badge>
                  ))}
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="transactions" className="space-y-4">
        <TabsList>
          <TabsTrigger value="transactions">所有交易</TabsTrigger>
          <TabsTrigger value="accounts">账户图表</TabsTrigger>
          <TabsTrigger value="summary">账户摘要</TabsTrigger>
          <TabsTrigger value="settings">全局设置</TabsTrigger>
        </TabsList>

        <TabsContent value="transactions" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>交易历史</CardTitle>
                  <CardDescription>所有账户的所有交易</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="搜索交易..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-[250px] pl-8"
                    />
                  </div>
                  <Select value={selectedAccount} onValueChange={setSelectedAccount}>
                    <SelectTrigger className="w-[200px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">所有账户</SelectItem>
                      {accounts?.map((account) => (
                        <SelectItem key={account.id} value={account.name}>
                          {account.code} - {account.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>日期</TableHead>
                    <TableHead>交易ID</TableHead>
                    <TableHead>描述</TableHead>
                    <TableHead>描述2</TableHead>
                    <TableHead className="text-right">支出</TableHead>
                    <TableHead className="text-right">收入</TableHead>
                    <TableHead>状态</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTransactions.map((transaction) => (
                    <TransactionRow key={transaction.id} transaction={transaction} />
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="accounts" className="space-y-4">
          <AccountChartOptimized 
            accounts={accounts || []}
            onAccountSelect={(account) => {
              console.log('选择账户:', account)
              // 可以在这里添加选择账户后的逻辑
            }}
            onAccountEdit={(account) => {
              console.log('编辑账户:', account)
              // 可以在这里添加编辑账户后的逻辑
            }}
            onAccountDelete={(accountId) => {
              console.log('删除账户:', accountId)
              // 可以在这里添加删除账户后的逻辑
            }}
            onAccountAdd={(accountData) => {
              console.log('添加账户:', accountData)
              // 可以在这里添加创建账户后的逻辑
            }}
            enableFirebase={true}
          />
        </TabsContent>

        <TabsContent value="summary" className="space-y-4">
          <div className="grid gap-4 grid-cols-2 md:grid-cols-5">
            {["Asset", "Liability", "Equity", "Revenue", "Expense"].map((type) => (
              <StatCard key={type} type={type} accounts={accounts || []} />
            ))}
          </div>

          <Card>
            <CardHeader>
              <CardTitle>按账户类型划分的账户余额</CardTitle>
              <CardDescription>按账户类型分组的账户余额摘要</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>账户类型</TableHead>
                    <TableHead className="text-right">账户数量</TableHead>
                    <TableHead className="text-right">总余额</TableHead>
                    <TableHead className="text-right">平均余额</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {["Asset", "Liability", "Equity", "Revenue", "Expense"].map((type) => {
                    const accountsOfType = accounts?.filter((account) => account.type === type) || []
                    const totalBalance = accountsOfType.reduce((sum, account) => sum + account.balance, 0)
                    const averageBalance = accountsOfType.length > 0 ? totalBalance / accountsOfType.length : 0

                    return (
                      <TableRow key={type}>
                        <TableCell className="font-medium">{type}</TableCell>
                        <TableCell className="text-right">{accountsOfType.length}</TableCell>
                        <TableCell className="text-right font-mono">${totalBalance.toLocaleString()}</TableCell>
                        <TableCell className="text-right font-mono">${averageBalance.toLocaleString()}</TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <GlSettingsManagement />
        </TabsContent>
      </Tabs>
    </div>
  )
} 