"use client"

import * as React from "react"
import { Calendar, Download, TrendingDown, TrendingUp, DollarSign, Loader2, BarChart3 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { useOptimizedAccounts } from "@/hooks/use-optimized-data"
import { useAuth } from "@/components/auth/auth-context"
import { RoleLevels, UserRoles } from "@/lib/data"

// 优化的账户行组件
const AccountRow = React.memo(({ 
  account, 
  accountType 
}: { 
  account: any
  accountType: "revenue" | "expense"
}) => {
  const formatBalance = React.useCallback((balance: number) => {
    return `$${Math.abs(balance).toLocaleString()}`
  }, [])

  const getAccountTypeColor = React.useCallback((type: string) => {
    switch (type) {
      case "Revenue": return "bg-green-100 text-green-800"
      case "Expense": return "bg-red-100 text-red-800"
      default: return "bg-gray-100 text-gray-800"
    }
  }, [])

  return (
    <TableRow>
      <TableCell className="font-medium">{account.code}</TableCell>
      <TableCell>{account.name}</TableCell>
      <TableCell className="text-right font-mono">
        {formatBalance(account.balance)}
      </TableCell>
      <TableCell>
        <Badge className={getAccountTypeColor(account.type)}>
          {account.type}
        </Badge>
      </TableCell>
    </TableRow>
  )
}, (prevProps, nextProps) => {
  return prevProps.account.id === nextProps.account.id &&
         prevProps.account.balance === nextProps.account.balance &&
         prevProps.accountType === nextProps.accountType
})

// 优化的统计卡片组件
const StatCard = React.memo(({ 
  title, 
  value, 
  change, 
  trend, 
  icon: Icon 
}: { 
  title: string
  value: string
  change: string
  trend: "up" | "down" | "neutral"
  icon: React.ComponentType<{ className?: string }>
}) => (
  <Card>
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium">{title}</CardTitle>
      <Icon className="h-4 w-4 text-muted-foreground" />
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold">{value}</div>
      <p className={`text-xs ${
        trend === "up" ? "text-green-600" : 
        trend === "down" ? "text-red-600" : "text-gray-600"
      }`}>
        {change}
      </p>
    </CardContent>
  </Card>
))

// 优化的财务指标组件
const FinancialMetric = React.memo(({ 
  title, 
  value, 
  description, 
  status 
}: { 
  title: string
  value: string
  description: string
  status: "good" | "warning" | "poor" | "neutral"
}) => {
  const getStatusColor = React.useCallback((status: string) => {
    switch (status) {
      case "good": return "text-green-600"
      case "warning": return "text-yellow-600"
      case "poor": return "text-red-600"
      case "neutral": return "text-gray-600"
      default: return "text-gray-600"
    }
  }, [])

  return (
    <div className="flex items-center justify-between p-3 border rounded-lg">
      <div>
        <h4 className="font-medium">{title}</h4>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <div className="text-right">
        <p className={`text-lg font-bold ${getStatusColor(status)}`}>{value}</p>
      </div>
    </div>
  )
})

export function ProfitLossOptimized() {
  const { hasPermission } = useAuth()
  
  // 使用优化的数据 hooks
  const { 
    data: accounts, 
    loading: accountsLoading, 
    error: accountsError,
    refetch: refetchAccounts 
  } = useOptimizedAccounts()
  
  const [period, setPeriod] = React.useState("current-month")
  const [startDate, setStartDate] = React.useState("2024-01-01")
  const [endDate, setEndDate] = React.useState("2024-01-31")

  // 优化的损益表数据计算
  const profitLossData = React.useMemo(() => {
    if (!accounts) return { revenueAccounts: [], expenseAccounts: [], totalRevenue: 0, totalExpenses: 0, netIncome: 0, grossMargin: 0 }

    const revenueAccounts = accounts.filter((account) => account.type === "Revenue")
    const expenseAccounts = accounts.filter((account) => account.type === "Expense")

    const totalRevenue = revenueAccounts.reduce((sum, account) => sum + account.balance, 0)
    const totalExpenses = expenseAccounts.reduce((sum, account) => sum + account.balance, 0)
    const netIncome = totalRevenue - totalExpenses
    const grossMargin = totalRevenue > 0 ? ((totalRevenue - totalExpenses) / totalRevenue) * 100 : 0

    return {
      revenueAccounts,
      expenseAccounts,
      totalRevenue,
      totalExpenses,
      netIncome,
      grossMargin
    }
  }, [accounts])

  // 优化的财务指标计算
  const financialMetrics = React.useMemo(() => {
    const { totalRevenue, totalExpenses, netIncome, grossMargin } = profitLossData
    
    if (totalRevenue === 0) return {}

    const expenseRatio = totalExpenses / totalRevenue
    const profitMargin = netIncome / totalRevenue

    return {
      expenseRatio: {
        value: (expenseRatio * 100).toFixed(1) + "%",
        status: (expenseRatio < 0.7 ? "good" : expenseRatio < 0.9 ? "warning" : "poor") as "good" | "warning" | "poor" | "neutral"
      },
      profitMargin: {
        value: (profitMargin * 100).toFixed(1) + "%",
        status: (profitMargin > 0.3 ? "good" : profitMargin > 0.1 ? "warning" : "poor") as "good" | "warning" | "poor" | "neutral"
      },
      grossMargin: {
        value: grossMargin.toFixed(1) + "%",
        status: (grossMargin > 50 ? "good" : grossMargin > 30 ? "warning" : "poor") as "good" | "warning" | "poor" | "neutral"
      }
    }
  }, [profitLossData])

  // 优化的统计数据计算
  const stats = React.useMemo(() => {
    if (!accounts) return { totalAccounts: 0, revenueAccounts: 0, expenseAccounts: 0 }

    const totalAccounts = accounts.length
    const revenueAccounts = accounts.filter(account => account.type === "Revenue").length
    const expenseAccounts = accounts.filter(account => account.type === "Expense").length

    return {
      totalAccounts,
      revenueAccounts,
      expenseAccounts
    }
  }, [accounts])

  // 优化的期间变化处理
  const handlePeriodChange = React.useCallback((newPeriod: string) => {
    setPeriod(newPeriod)
    
    // 根据期间设置日期范围
    const now = new Date()
    let start: Date, end: Date
    
    switch (newPeriod) {
      case "current-month":
        start = new Date(now.getFullYear(), now.getMonth(), 1)
        end = new Date(now.getFullYear(), now.getMonth() + 1, 0)
        break
      case "last-month":
        start = new Date(now.getFullYear(), now.getMonth() - 1, 1)
        end = new Date(now.getFullYear(), now.getMonth(), 0)
        break
      case "current-quarter":
        const quarter = Math.floor(now.getMonth() / 3)
        start = new Date(now.getFullYear(), quarter * 3, 1)
        end = new Date(now.getFullYear(), (quarter + 1) * 3, 0)
        break
      case "current-year":
        start = new Date(now.getFullYear(), 0, 1)
        end = new Date(now.getFullYear(), 11, 31)
        break
      default:
        return
    }
    
    setStartDate(start.toISOString().split('T')[0])
    setEndDate(end.toISOString().split('T')[0])
  }, [])

  // 优化的刷新函数
  const handleRefresh = React.useCallback(async () => {
    try {
      await refetchAccounts()
    } catch (error) {
      console.error("刷新损益表失败:", error)
    }
  }, [refetchAccounts])

  // 加载状态
  if (accountsLoading) {
    return (
      <div className="p-6 text-center">
        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
        <p className="text-muted-foreground">加载损益表...</p>
      </div>
    )
  }

  // 错误状态
  if (accountsError) {
    return (
      <div className="p-6 text-center">
        <div className="text-red-500 mb-4">
          <h3 className="text-lg font-semibold">加载失败</h3>
          <p className="text-sm text-muted-foreground">
            {(accountsError as any)?.message || '未知错误'}
          </p>
        </div>
        <Button onClick={handleRefresh} variant="outline">
          重试
        </Button>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">损益表</h1>
          <p className="text-muted-foreground">查看您公司的收入、支出和盈利能力。</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleRefresh}>
            <Calendar className="h-4 w-4 mr-2" />
            比较期间
          </Button>
          {hasPermission(RoleLevels[UserRoles.VICE_PRESIDENT]) && (
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              导出PDF
            </Button>
          )}
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
        <StatCard
          title="总收入"
          value={`$${profitLossData.totalRevenue.toLocaleString()}`}
          change={`${stats.revenueAccounts} 个收入账户`}
          trend="up"
          icon={TrendingUp}
        />
        <StatCard
          title="总支出"
          value={`$${profitLossData.totalExpenses.toLocaleString()}`}
          change={`${stats.expenseAccounts} 个支出账户`}
          trend="down"
          icon={TrendingDown}
        />
        <StatCard
          title="净收入"
          value={`$${profitLossData.netIncome.toLocaleString()}`}
          change={`${profitLossData.grossMargin.toFixed(1)}% 毛利率`}
          trend={profitLossData.netIncome > 0 ? "up" : "down"}
          icon={DollarSign}
        />
        <StatCard
          title="毛利率"
          value={`${profitLossData.grossMargin.toFixed(1)}%`}
          change={profitLossData.grossMargin > 50 ? "优秀" : profitLossData.grossMargin > 30 ? "良好" : "需改善"}
          trend={profitLossData.grossMargin > 50 ? "up" : profitLossData.grossMargin > 30 ? "neutral" : "down"}
          icon={BarChart3}
        />
      </div>

      {/* 报告期间选择 */}
      <Card>
        <CardHeader>
          <CardTitle>报告期间</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div>
              <Label htmlFor="period">期间</Label>
              <Select value={period} onValueChange={handlePeriodChange}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="current-month">本月</SelectItem>
                  <SelectItem value="last-month">上月</SelectItem>
                  <SelectItem value="current-quarter">本季度</SelectItem>
                  <SelectItem value="current-year">本年度</SelectItem>
                  <SelectItem value="custom">自定义范围</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {period === "custom" && (
              <>
                <div>
                  <Label htmlFor="start-date">开始日期</Label>
                  <Input
                    id="start-date"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="end-date">结束日期</Label>
                  <Input
                    id="end-date"
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 损益表详情 */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* 收入部分 */}
        <Card>
          <CardHeader>
            <CardTitle>收入</CardTitle>
            <CardDescription>收入账户明细</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>账户代码</TableHead>
                  <TableHead>账户名称</TableHead>
                  <TableHead className="text-right">金额</TableHead>
                  <TableHead>类型</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {profitLossData.revenueAccounts.map((account) => (
                  <AccountRow
                    key={account.id}
                    account={account}
                    accountType="revenue"
                  />
                ))}
                <TableRow className="font-bold border-t-2">
                  <TableCell colSpan={2}>总收入</TableCell>
                  <TableCell className="text-right font-mono">
                    ${profitLossData.totalRevenue.toLocaleString()}
                  </TableCell>
                  <TableCell></TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* 支出部分 */}
        <Card>
          <CardHeader>
            <CardTitle>支出</CardTitle>
            <CardDescription>支出账户明细</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>账户代码</TableHead>
                  <TableHead>账户名称</TableHead>
                  <TableHead className="text-right">金额</TableHead>
                  <TableHead>类型</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {profitLossData.expenseAccounts.map((account) => (
                  <AccountRow
                    key={account.id}
                    account={account}
                    accountType="expense"
                  />
                ))}
                <TableRow className="font-bold border-t-2">
                  <TableCell colSpan={2}>总支出</TableCell>
                  <TableCell className="text-right font-mono">
                    ${profitLossData.totalExpenses.toLocaleString()}
                  </TableCell>
                  <TableCell></TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* 净收入汇总 */}
      <Card>
        <CardHeader>
          <CardTitle>净收入汇总</CardTitle>
          <CardDescription>收入减去支出的最终结果</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-4 border rounded-lg">
              <div>
                <h4 className="font-medium">总收入</h4>
                <p className="text-sm text-muted-foreground">所有收入账户的总和</p>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-green-600">
                  ${profitLossData.totalRevenue.toLocaleString()}
                </p>
              </div>
            </div>
            
            <div className="flex justify-between items-center p-4 border rounded-lg">
              <div>
                <h4 className="font-medium">总支出</h4>
                <p className="text-sm text-muted-foreground">所有支出账户的总和</p>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-red-600">
                  -${profitLossData.totalExpenses.toLocaleString()}
                </p>
              </div>
            </div>
            
            <div className="flex justify-between items-center p-4 border-2 rounded-lg bg-muted">
              <div>
                <h4 className="font-medium">净收入</h4>
                <p className="text-sm text-muted-foreground">总收入减去总支出</p>
              </div>
              <div className="text-right">
                <p className={`text-xl font-bold ${profitLossData.netIncome > 0 ? "text-green-600" : "text-red-600"}`}>
                  {profitLossData.netIncome > 0 ? "+" : ""}${profitLossData.netIncome.toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 财务指标分析 */}
      <Card>
        <CardHeader>
          <CardTitle>财务指标分析</CardTitle>
          <CardDescription>关键盈利能力和效率指标</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <FinancialMetric
              title="毛利率"
              value={financialMetrics.grossMargin?.value || "N/A"}
              description="(收入 - 支出) / 收入"
              status={financialMetrics.grossMargin?.status || "neutral"}
            />
            <FinancialMetric
              title="支出比率"
              value={financialMetrics.expenseRatio?.value || "N/A"}
              description="支出 / 收入"
              status={financialMetrics.expenseRatio?.status || "neutral"}
            />
            <FinancialMetric
              title="利润率"
              value={financialMetrics.profitMargin?.value || "N/A"}
              description="净收入 / 收入"
              status={financialMetrics.profitMargin?.status || "neutral"}
            />
          </div>
        </CardContent>
      </Card>

      {/* 收入支出结构分析 */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>收入结构</CardTitle>
            <CardDescription>收入构成分析</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>总收入</span>
                  <span>${profitLossData.totalRevenue.toLocaleString()}</span>
                </div>
                <Progress value={100} className="h-2" />
              </div>
              <div className="text-xs text-muted-foreground">
                <p>• 收入账户数: {stats.revenueAccounts}</p>
                <p>• 平均收入: ${(profitLossData.totalRevenue / stats.revenueAccounts || 1).toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>支出结构</CardTitle>
            <CardDescription>支出构成分析</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>总支出</span>
                  <span>${profitLossData.totalExpenses.toLocaleString()}</span>
                </div>
                <Progress 
                  value={(profitLossData.totalExpenses / (profitLossData.totalRevenue || 1)) * 100} 
                  className="h-2" 
                />
              </div>
              <div className="text-xs text-muted-foreground">
                <p>• 支出账户数: {stats.expenseAccounts}</p>
                <p>• 平均支出: ${(profitLossData.totalExpenses / stats.expenseAccounts || 1).toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 盈利能力状态 */}
      {profitLossData.netIncome < 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="text-red-800">亏损警告</CardTitle>
            <CardDescription className="text-red-600">
              当前期间出现亏损，需要关注支出控制和收入增长
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <p><strong>亏损金额:</strong> ${Math.abs(profitLossData.netIncome).toLocaleString()}</p>
              <p><strong>亏损率:</strong> {((Math.abs(profitLossData.netIncome) / profitLossData.totalRevenue) * 100).toFixed(1)}%</p>
              <p><strong>建议:</strong> 检查支出结构，寻找收入增长机会</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
} 