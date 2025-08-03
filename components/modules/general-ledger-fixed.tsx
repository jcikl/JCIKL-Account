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

interface FilterState {
  dateFrom: string
  dateTo: string
  amountMin: string
  amountMax: string
  statuses: string[]
  categories: string[]
  accounts: string[]
}

export function GeneralLedgerFixed() {
  const { hasPermission } = useAuth()
  const [accounts, setAccounts] = React.useState<Account[]>([])
  const [transactions, setTransactions] = React.useState<Transaction[]>([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [selectedAccount, setSelectedAccount] = React.useState("all")
  const [searchTerm, setSearchTerm] = React.useState("")
  const [showAdvancedFilter, setShowAdvancedFilter] = React.useState(false)
  const [showExportDialog, setShowExportDialog] = React.useState(false)

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
      // 基础筛选
      const matchesAccount = selectedAccount === "all" || transaction.account.includes(selectedAccount)
      const matchesSearch =
        transaction.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        transaction.account.toLowerCase().includes(searchTerm.toLowerCase())

      // 高级筛选
      const matchesDateFrom = !filters.dateFrom || 
        (typeof transaction.date === 'string' && transaction.date >= filters.dateFrom)
      const matchesDateTo = !filters.dateTo || 
        (typeof transaction.date === 'string' && transaction.date <= filters.dateTo)
      
      const transactionAmount = transaction.debit > 0 ? transaction.debit : transaction.credit
      const matchesAmountMin = !filters.amountMin || transactionAmount >= parseFloat(filters.amountMin)
      const matchesAmountMax = !filters.amountMax || transactionAmount <= parseFloat(filters.amountMax)
      
      const matchesStatus = filters.statuses.length === 0 || filters.statuses.includes(transaction.status)
      const matchesCategory = filters.categories.length === 0 || 
        (transaction.category && filters.categories.includes(transaction.category))
      const matchesAccountFilter = filters.accounts.length === 0 || 
        filters.accounts.includes(transaction.account)

      return matchesAccount && matchesSearch && matchesDateFrom && matchesDateTo && 
             matchesAmountMin && matchesAmountMax && matchesStatus && 
             matchesCategory && matchesAccountFilter
    })
  }, [transactions, selectedAccount, searchTerm, filters])

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

  // 处理高级筛选按钮点击
  const handleAdvancedFilterClick = () => {
    console.log('高级筛选按钮被点击')
    setShowAdvancedFilter(true)
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
          <h1 className="text-3xl font-bold tracking-tight">总账 (修复版)</h1>
          <p className="text-muted-foreground">按账户记录所有财务交易的完整记录。</p>
        </div>
        <div className="flex gap-2">
          {/* 高级筛选按钮 */}
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

          {/* 导出按钮 */}
          {hasPermission(RoleLevels[UserRoles.VICE_PRESIDENT]) && (
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              导出
            </Button>
          )}
        </div>
      </div>

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

      {/* 基础筛选和表格 */}
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
                    <TableHead>账户</TableHead>
                    <TableHead className="text-right">借方</TableHead>
                    <TableHead className="text-right">贷方</TableHead>
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
                      <TableCell>{transaction.account}</TableCell>
                      <TableCell className="text-right font-mono">
                        {transaction.debit > 0 ? `$${transaction.debit.toLocaleString()}` : "-"}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {transaction.credit > 0 ? `$${transaction.credit.toLocaleString()}` : "-"}
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
          <Card>
            <CardHeader>
              <CardTitle>账户图表</CardTitle>
              <CardDescription>您会计系统中所有账户的完整列表</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>账户代码</TableHead>
                    <TableHead>账户名称</TableHead>
                    <TableHead>账户类型</TableHead>
                    <TableHead className="text-right">当前余额</TableHead>
                    <TableHead>状态</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {accounts.map((account) => (
                    <TableRow key={account.id}>
                      <TableCell className="font-medium">{account.code}</TableCell>
                      <TableCell>{account.name}</TableCell>
                      <TableCell>
                        <span
                          className={`px-2 py-1 rounded-full text-xs ${
                            account.type === "Asset"
                              ? "bg-blue-100 text-blue-800"
                              : account.type === "Liability"
                                ? "bg-red-100 text-red-800"
                                : account.type === "Equity"
                                  ? "bg-purple-100 text-purple-800"
                                  : account.type === "Revenue"
                                    ? "bg-green-100 text-green-800"
                                    : "bg-orange-100 text-orange-800"
                          }`}
                        >
                          {account.type}
                        </span>
                      </TableCell>
                      <TableCell className="text-right font-mono">${account.balance.toLocaleString()}</TableCell>
                      <TableCell>
                        <Badge variant="default">活跃</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="summary" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
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