"use client"

import * as React from "react"
import { Download, Filter, Search, X, Calendar, DollarSign, FileText, FileSpreadsheet } from "lucide-react"
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
import { getAccounts, getTransactions } from "@/lib/firebase-utils"
import type { Account, Transaction } from "@/lib/data"
import { useAuth } from "@/components/auth/auth-context"
import { RoleLevels, UserRoles } from "@/lib/data"
import { AccountChart } from "./account-chart"
import * as XLSX from 'xlsx'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'

interface FilterState {
  dateFrom: string
  dateTo: string
  amountMin: string
  amountMax: string
  statuses: string[]
  categories: string[]
  accounts: string[]
}

export function GeneralLedger() {
  const { hasPermission } = useAuth()
  const [accounts, setAccounts] = React.useState<Account[]>([])
  const [transactions, setTransactions] = React.useState<Transaction[]>([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
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

  const fetchData = React.useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const fetchedAccounts = await getAccounts()
      const fetchedTransactions = await getTransactions()
      setAccounts(fetchedAccounts)
      setTransactions(fetchedTransactions)
    } catch (err: any) {
      setError("无法加载总账数据: " + err.message)
      console.error("Error fetching general ledger data:", err)
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    fetchData()
  }, [fetchData])

  // 获取所有可用的状态和类别
  const allStatuses = React.useMemo(() => {
    const statuses = new Set(transactions.map(t => t.status))
    return Array.from(statuses)
  }, [transactions])

  const allCategories = React.useMemo(() => {
    const categories = new Set(transactions.map(t => t.category).filter((category): category is string => Boolean(category)))
    return Array.from(categories)
  }, [transactions])

  // 应用所有筛选条件
  const filteredTransactions = React.useMemo(() => {
    return transactions.filter((transaction) => {
      // 基础筛选 - 移除account筛选，因为Transaction接口不再包含account属性
      const matchesSearch =
        transaction.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (transaction.description2 && transaction.description2.toLowerCase().includes(searchTerm.toLowerCase()))

      // 高级筛选
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
      // 移除account筛选，因为Transaction接口不再包含account属性
      const matchesAccountFilter = filters.accounts.length === 0

      return matchesSearch && matchesDateFrom && matchesDateTo && 
             matchesAmountMin && matchesAmountMax && matchesStatus && 
             matchesCategory && matchesAccountFilter
    })
  }, [transactions, selectedAccount, searchTerm, filters])

  // 导出功能
  const exportData = async (format: "csv" | "excel" | "pdf") => {
    setIsExporting(true)
    setExportProgress(0)

    try {
      // 模拟进度更新
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

      // 根据格式执行导出
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
  }

  const exportToCSV = async (data: any[]) => {
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
  }

  const exportToExcel = async (data: any[]) => {
    // 使用XLSX库创建专业的Excel文件
    const worksheet = XLSX.utils.json_to_sheet(data)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, "总账报表")
    
    // 设置列宽
    const columnWidths = [
      { wch: 12 }, // 日期
      { wch: 15 }, // 交易ID
      { wch: 30 }, // 描述
      { wch: 20 }, // 描述2
      { wch: 12 }, // 支出
      { wch: 12 }, // 收入
      { wch: 12 }, // 净额
      { wch: 10 }, // 状态
      { wch: 15 }, // 类别
      { wch: 15 }, // 项目ID
    ]
    worksheet['!cols'] = columnWidths

    // 导出文件
    XLSX.writeFile(workbook, `总账报表_${new Date().toISOString().split('T')[0]}.xlsx`)
  }

  const exportToPDF = async (data: any[]) => {
    // 使用jsPDF创建专业的PDF报表
    const doc = new jsPDF('landscape', 'mm', 'a4')
    
    // 设置中文字体支持
    doc.setFont('helvetica')
    doc.setFontSize(12)
    
    // 添加标题
    doc.setFontSize(16)
    doc.text('总账报表', 140, 20, { align: 'center' })
    doc.setFontSize(10)
    doc.text(`生成时间: ${new Date().toLocaleString('zh-CN')}`, 140, 30, { align: 'center' })
    
    // 添加筛选条件信息
    if (hasActiveFilters()) {
      let filterText = '筛选条件: '
      if (filters.dateFrom) filterText += `开始日期: ${filters.dateFrom} `
      if (filters.dateTo) filterText += `结束日期: ${filters.dateTo} `
      if (filters.amountMin) filterText += `最小金额: $${filters.amountMin} `
      if (filters.amountMax) filterText += `最大金额: $${filters.amountMax} `
      if (filters.statuses.length > 0) filterText += `状态: ${filters.statuses.join(', ')} `
      
      doc.setFontSize(8)
      doc.text(filterText, 10, 40)
    }
    
    // 设置表格列宽
    const columns = [
      { header: '日期', dataKey: '日期', width: 25 },
      { header: '交易ID', dataKey: '交易ID', width: 30 },
      { header: '描述', dataKey: '描述', width: 50 },
      { header: '账户', dataKey: '账户', width: 35 },
      { header: '借方', dataKey: '借方', width: 25 },
      { header: '贷方', dataKey: '贷方', width: 25 },
      { header: '状态', dataKey: '状态', width: 20 },
      { header: '类别', dataKey: '类别', width: 25 }
    ]
    
    // 添加表格
    doc.setFontSize(8)
    let yPosition = 50
    
    // 表头
    let xPosition = 10
    columns.forEach(column => {
      doc.rect(xPosition, yPosition, column.width, 8)
      doc.text(column.header, xPosition + 2, yPosition + 5)
      xPosition += column.width
    })
    
    // 数据行
    yPosition += 8
    data.forEach((row, index) => {
      if (yPosition > 180) {
        doc.addPage()
        yPosition = 20
      }
      
      xPosition = 10
      columns.forEach(column => {
        doc.rect(xPosition, yPosition, column.width, 6)
        const cellText = row[column.dataKey] || ''
        doc.text(cellText.toString(), xPosition + 1, yPosition + 4)
        xPosition += column.width
      })
      yPosition += 6
    })
    
    // 添加页脚
    doc.setFontSize(8)
    doc.text(`共 ${data.length} 条记录`, 10, 200)
    doc.text(`第 1 页`, 140, 200, { align: 'center' })
    
    // 保存文件
    doc.save(`总账报表_${new Date().toISOString().split('T')[0]}.pdf`)
  }

  const clearFilters = () => {
    setFilters({
      dateFrom: "",
      dateTo: "",
      amountMin: "",
      amountMax: "",
      statuses: [],
      categories: [],
      accounts: []
    })
  }

  const hasActiveFilters = () => {
    return filters.dateFrom || filters.dateTo || filters.amountMin || filters.amountMax || 
           filters.statuses.length > 0 || filters.categories.length > 0 || filters.accounts.length > 0
  }

  // 调试函数
  const handleAdvancedFilterClick = () => {
    console.log('高级筛选按钮被点击')
    console.log('当前showAdvancedFilter状态:', showAdvancedFilter)
    setShowAdvancedFilter(true)
    console.log('设置showAdvancedFilter为true')
  }

  if (loading) {
    return <div className="p-6 text-center">加载总账...</div>
  }

  if (error) {
    return <div className="p-6 text-center text-red-500">{error}</div>
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">总账</h1>
          <p className="text-muted-foreground">按账户记录所有财务交易的完整记录。</p>
        </div>
        <div className="flex gap-2">
          {/* 简化的高级筛选按钮 */}
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

          {/* 高级筛选对话框 */}
          <Dialog open={showAdvancedFilter} onOpenChange={setShowAdvancedFilter}>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>高级筛选</DialogTitle>
                <DialogDescription>
                  设置详细的筛选条件来精确查找交易记录
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-6">
                {/* 日期范围筛选 */}
                <div className="space-y-3">
                  <Label className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    日期范围
                  </Label>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor="dateFrom">开始日期</Label>
                      <Input
                        id="dateFrom"
                        type="date"
                        value={filters.dateFrom}
                        onChange={(e) => setFilters(prev => ({ ...prev, dateFrom: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="dateTo">结束日期</Label>
                      <Input
                        id="dateTo"
                        type="date"
                        value={filters.dateTo}
                        onChange={(e) => setFilters(prev => ({ ...prev, dateTo: e.target.value }))}
                      />
                    </div>
                  </div>
                </div>

                <Separator />

                {/* 金额范围筛选 */}
                <div className="space-y-3">
                  <Label className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    金额范围
                  </Label>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor="amountMin">最小金额</Label>
                      <Input
                        id="amountMin"
                        type="number"
                        placeholder="0.00"
                        value={filters.amountMin}
                        onChange={(e) => setFilters(prev => ({ ...prev, amountMin: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="amountMax">最大金额</Label>
                      <Input
                        id="amountMax"
                        type="number"
                        placeholder="0.00"
                        value={filters.amountMax}
                        onChange={(e) => setFilters(prev => ({ ...prev, amountMax: e.target.value }))}
                      />
                    </div>
                  </div>
                </div>

                <Separator />

                {/* 状态筛选 */}
                <div className="space-y-3">
                  <Label>交易状态</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {allStatuses.map((status) => (
                      <div key={status} className="flex items-center space-x-2">
                        <Checkbox
                          id={`status-${status}`}
                          checked={filters.statuses.includes(status)}
                          onCheckedChange={(checked) => {
                            setFilters(prev => ({
                              ...prev,
                              statuses: checked 
                                ? [...prev.statuses, status]
                                : prev.statuses.filter(s => s !== status)
                            }))
                          }}
                        />
                        <Label htmlFor={`status-${status}`} className="text-sm">
                          {status}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                <Separator />

                {/* 类别筛选 */}
                {allCategories.length > 0 && (
                  <>
                    <div className="space-y-3">
                      <Label>交易类别</Label>
                      <div className="grid grid-cols-2 gap-2">
                        {allCategories.map((category) => (
                          <div key={category} className="flex items-center space-x-2">
                            <Checkbox
                              id={`category-${category}`}
                              checked={filters.categories.includes(category)}
                              onCheckedChange={(checked) => {
                                setFilters(prev => ({
                                  ...prev,
                                  categories: checked 
                                    ? [...prev.categories, category]
                                    : prev.categories.filter(c => c !== category)
                                }))
                              }}
                            />
                            <Label htmlFor={`category-${category}`} className="text-sm">
                              {category}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>
                    <Separator />
                  </>
                )}

                {/* 账户筛选 */}
                <div className="space-y-3">
                  <Label>账户筛选</Label>
                  <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto">
                    {accounts.map((account) => (
                      <div key={account.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`account-${account.id}`}
                          checked={filters.accounts.includes(account.name)}
                          onCheckedChange={(checked) => {
                            setFilters(prev => ({
                              ...prev,
                              accounts: checked 
                                ? [...prev.accounts, account.name]
                                : prev.accounts.filter(a => a !== account.name)
                            }))
                          }}
                        />
                        <Label htmlFor={`account-${account.id}`} className="text-sm">
                          {account.code} - {account.name}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                <Separator />

                {/* 操作按钮 */}
                <div className="flex justify-between">
                  <Button variant="outline" onClick={clearFilters}>
                    <X className="h-4 w-4 mr-2" />
                    清除所有筛选
                  </Button>
                  <Button onClick={() => setShowAdvancedFilter(false)}>
                    应用筛选
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

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
                  <DialogDescription>
                    选择导出格式并下载筛选后的数据
                  </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-4">
                  <div className="space-y-3">
                    <Label>导出格式</Label>
                    <div className="grid grid-cols-3 gap-3">
                      <div className="flex items-center space-x-2">
                        <input
                          type="radio"
                          id="csv"
                          name="exportFormat"
                          value="csv"
                          checked={exportFormat === "csv"}
                          onChange={(e) => setExportFormat(e.target.value as "csv")}
                        />
                        <Label htmlFor="csv" className="flex items-center gap-2">
                          <FileText className="h-4 w-4" />
                          CSV
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <input
                          type="radio"
                          id="excel"
                          name="exportFormat"
                          value="excel"
                          checked={exportFormat === "excel"}
                          onChange={(e) => setExportFormat(e.target.value as "excel")}
                        />
                        <Label htmlFor="excel" className="flex items-center gap-2">
                          <FileSpreadsheet className="h-4 w-4" />
                          Excel
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <input
                          type="radio"
                          id="pdf"
                          name="exportFormat"
                          value="pdf"
                          checked={exportFormat === "pdf"}
                          onChange={(e) => setExportFormat(e.target.value as "pdf")}
                        />
                        <Label htmlFor="pdf" className="flex items-center gap-2">
                          <FileText className="h-4 w-4" />
                          PDF
                        </Label>
                      </div>
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
                      {accounts.map((account) => (
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
                    <TableRow key={transaction.id}>
                      <TableCell>
                        {typeof transaction.date === 'string' 
                          ? transaction.date 
                          : transaction.date?.seconds 
                            ? new Date(transaction.date.seconds * 1000).toLocaleDateString()
                            : 'N/A'
                        }
                      </TableCell>
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
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="accounts" className="space-y-4">
          <AccountChart 
            accounts={accounts}
            onAccountSelect={(account) => {
              console.log('选择账户:', account)
              // 可以在这里添加账户选择逻辑
            }}
            onAccountEdit={(account) => {
              console.log('编辑账户:', account)
              // 可以在这里添加账户编辑逻辑
            }}
            onAccountDelete={(accountId) => {
              console.log('删除账户:', accountId)
              // 可以在这里添加账户删除逻辑
            }}
            onAccountAdd={() => {
              console.log('添加账户')
              // 这里可以打开添加账户的对话框或导航到添加账户页面
              // 由于AccountChart组件期望onAccountAdd是无参数的函数，我们在这里只做基本处理
            }}
          />
        </TabsContent>

        <TabsContent value="summary" className="space-y-4">
          <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
            {["Asset", "Liability", "Equity", "Revenue", "Expense"].map((type) => {
              const accountsOfType = accounts.filter((account) => account.type === type)
              const totalBalance = accountsOfType.reduce((sum, account) => sum + account.balance, 0)

              return (
                <Card key={type}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">{type} 账户</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">${totalBalance.toLocaleString()}</div>
                    <p className="text-xs text-muted-foreground">{accountsOfType.length} 个账户</p>
                  </CardContent>
                </Card>
              )
            })}
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
                    const accountsOfType = accounts.filter((account) => account.type === type)
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
      </Tabs>
    </div>
  )
}
