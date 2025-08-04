"use client"

import * as React from "react"
import { Download, RefreshCw, Loader2, TrendingUp, TrendingDown, DollarSign, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useOptimizedAccounts } from "@/hooks/use-optimized-data"
import { useAuth } from "@/components/auth/auth-context"
import { RoleLevels, UserRoles } from "@/lib/data"

// 优化的账户行组件
const AccountRow = React.memo(({ 
  account, 
  accountType 
}: { 
  account: any
  accountType: "debit" | "credit"
}) => {
  const formatBalance = React.useCallback((balance: number) => {
    return `$${Math.abs(balance).toLocaleString()}`
  }, [])

  return (
    <TableRow>
      <TableCell className="font-medium">{account.code}</TableCell>
      <TableCell>{account.name}</TableCell>
      <TableCell className="text-right font-mono">
        {accountType === "debit" ? formatBalance(account.balance) : "-"}
      </TableCell>
      <TableCell className="text-right font-mono">
        {accountType === "credit" ? formatBalance(account.balance) : "-"}
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

export function TrialBalanceOptimized() {
  const { hasPermission } = useAuth()
  
  // 使用优化的数据 hooks
  const { 
    data: accounts, 
    loading: accountsLoading, 
    error: accountsError,
    refetch: refetchAccounts 
  } = useOptimizedAccounts()
  
  const [asOfDate, setAsOfDate] = React.useState(new Date().toISOString().split("T")[0])

  // 优化的试算平衡计算
  const trialBalanceData = React.useMemo(() => {
    if (!accounts) return { debits: [], credits: [], totalDebits: 0, totalCredits: 0, isBalanced: false }

    const debitAccounts = accounts.filter((account) => ["Asset", "Expense"].includes(account.type))
    const creditAccounts = accounts.filter((account) => ["Liability", "Equity", "Revenue"].includes(account.type))

    const totalDebits = debitAccounts.reduce((sum, account) => sum + Math.abs(account.balance), 0)
    const totalCredits = creditAccounts.reduce((sum, account) => sum + Math.abs(account.balance), 0)

    const isBalanced = Math.abs(totalDebits - totalCredits) < 0.01

    return {
      debits: debitAccounts,
      credits: creditAccounts,
      totalDebits,
      totalCredits,
      isBalanced
    }
  }, [accounts])

  // 优化的统计数据计算
  const stats = React.useMemo(() => {
    if (!accounts) return { totalAccounts: 0, activeAccounts: 0, zeroBalanceAccounts: 0 }

    const totalAccounts = accounts.length
    const activeAccounts = accounts.filter(account => account.balance !== 0).length
    const zeroBalanceAccounts = accounts.filter(account => account.balance === 0).length

    return {
      totalAccounts,
      activeAccounts,
      zeroBalanceAccounts
    }
  }, [accounts])

  // 优化的余额差异计算
  const balanceDifference = React.useMemo(() => {
    return Math.abs(trialBalanceData.totalDebits - trialBalanceData.totalCredits)
  }, [trialBalanceData.totalDebits, trialBalanceData.totalCredits])

  // 优化的刷新函数
  const handleRefresh = React.useCallback(async () => {
    try {
      await refetchAccounts()
    } catch (error) {
      console.error("刷新试算平衡表失败:", error)
    }
  }, [refetchAccounts])

  // 优化的日期变化处理
  const handleDateChange = React.useCallback((newDate: string) => {
    setAsOfDate(newDate)
    // 这里可以添加基于日期的数据过滤逻辑
  }, [])

  // 加载状态
  if (accountsLoading) {
    return (
      <div className="p-6 text-center">
        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
        <p className="text-muted-foreground">加载试算平衡表...</p>
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
          <h1 className="text-3xl font-bold tracking-tight">试算平衡表</h1>
          <p className="text-muted-foreground">验证所有账户的借方总额是否等于贷方总额。</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleRefresh}>
            <RefreshCw className="h-4 w-4 mr-2" />
            刷新
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
          title="总账户数"
          value={stats.totalAccounts.toString()}
          change={`${stats.activeAccounts} 个活跃账户`}
          trend="neutral"
          icon={DollarSign}
        />
        <StatCard
          title="借方总额"
          value={`$${trialBalanceData.totalDebits.toLocaleString()}`}
          change={`${trialBalanceData.debits.length} 个借方账户`}
          trend="up"
          icon={TrendingUp}
        />
        <StatCard
          title="贷方总额"
          value={`$${trialBalanceData.totalCredits.toLocaleString()}`}
          change={`${trialBalanceData.credits.length} 个贷方账户`}
          trend="down"
          icon={TrendingDown}
        />
        <StatCard
          title="余额差异"
          value={`$${balanceDifference.toLocaleString()}`}
          change={trialBalanceData.isBalanced ? "平衡" : "不平衡"}
          trend={trialBalanceData.isBalanced ? "neutral" : "down"}
          icon={AlertTriangle}
        />
      </div>

      {/* 平衡状态警告 */}
      {!trialBalanceData.isBalanced && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            试算平衡表不平衡！借方总额与贷方总额相差 ${balanceDifference.toLocaleString()}。
            请检查账户余额和交易记录。
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>试算平衡表报告</CardTitle>
              <CardDescription>截至 {asOfDate}</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Label htmlFor="asof-date">截至日期:</Label>
              <Input
                id="asof-date"
                type="date"
                value={asOfDate}
                onChange={(e) => handleDateChange(e.target.value)}
                className="w-[150px]"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>账户代码</TableHead>
                <TableHead>账户名称</TableHead>
                <TableHead className="text-right">借方</TableHead>
                <TableHead className="text-right">贷方</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {/* 借方账户 */}
              {trialBalanceData.debits.map((account) => (
                <AccountRow
                  key={account.id}
                  account={account}
                  accountType="debit"
                />
              ))}
              
              {/* 贷方账户 */}
              {trialBalanceData.credits.map((account) => (
                <AccountRow
                  key={account.id}
                  account={account}
                  accountType="credit"
                />
              ))}
              
              {/* 总计行 */}
              <TableRow className="font-bold border-t-2">
                <TableCell colSpan={2}>总计</TableCell>
                <TableCell className="text-right font-mono">
                  ${trialBalanceData.totalDebits.toLocaleString()}
                </TableCell>
                <TableCell className="text-right font-mono">
                  ${trialBalanceData.totalCredits.toLocaleString()}
                </TableCell>
              </TableRow>
              
              {/* 差异行 */}
              {!trialBalanceData.isBalanced && (
                <TableRow className="bg-red-50">
                  <TableCell colSpan={2} className="text-red-600 font-medium">
                    差异
                  </TableCell>
                  <TableCell className="text-right font-mono text-red-600">
                    ${balanceDifference.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right font-mono text-red-600">
                    ${balanceDifference.toLocaleString()}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* 账户类型分布 */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>借方账户 (资产 + 费用)</CardTitle>
            <CardDescription>按账户类型分组的借方账户</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {["Asset", "Expense"].map((type) => {
                const accountsOfType = trialBalanceData.debits.filter(account => account.type === type)
                const totalBalance = accountsOfType.reduce((sum, account) => sum + Math.abs(account.balance), 0)
                
                return (
                  <div key={type} className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{type}</Badge>
                      <span className="text-sm text-muted-foreground">
                        {accountsOfType.length} 个账户
                      </span>
                    </div>
                    <span className="font-mono">${totalBalance.toLocaleString()}</span>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>贷方账户 (负债 + 权益 + 收入)</CardTitle>
            <CardDescription>按账户类型分组的贷方账户</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {["Liability", "Equity", "Revenue"].map((type) => {
                const accountsOfType = trialBalanceData.credits.filter(account => account.type === type)
                const totalBalance = accountsOfType.reduce((sum, account) => sum + Math.abs(account.balance), 0)
                
                return (
                  <div key={type} className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{type}</Badge>
                      <span className="text-sm text-muted-foreground">
                        {accountsOfType.length} 个账户
                      </span>
                    </div>
                    <span className="font-mono">${totalBalance.toLocaleString()}</span>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 零余额账户 */}
      {stats.zeroBalanceAccounts > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>零余额账户</CardTitle>
            <CardDescription>当前余额为零的账户列表</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2 md:grid-cols-3">
              {accounts
                ?.filter(account => account.balance === 0)
                .slice(0, 9)
                .map((account) => (
                  <div key={account.id} className="flex items-center gap-2 p-2 border rounded">
                    <Badge variant="secondary" className="text-xs">
                      {account.type}
                    </Badge>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{account.name}</p>
                      <p className="text-xs text-muted-foreground">{account.code}</p>
                    </div>
                  </div>
                ))}
            </div>
            {stats.zeroBalanceAccounts > 9 && (
              <p className="text-sm text-muted-foreground mt-2">
                还有 {stats.zeroBalanceAccounts - 9} 个零余额账户...
              </p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
} 