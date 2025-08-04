"use client"

import * as React from "react"
import { Download, RefreshCw, Loader2, TrendingUp, TrendingDown, DollarSign, Building2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { useOptimizedAccounts } from "@/hooks/use-optimized-data"
import { useAuth } from "@/components/auth/auth-context"
import { RoleLevels, UserRoles } from "@/lib/data"

// 优化的账户行组件
const AccountRow = React.memo(({ 
  account, 
  showBalance = true 
}: { 
  account: any
  showBalance?: boolean
}) => {
  const formatBalance = React.useCallback((balance: number) => {
    return `$${balance.toLocaleString()}`
  }, [])

  const getAccountTypeColor = React.useCallback((type: string) => {
    switch (type) {
      case "Asset": return "bg-green-100 text-green-800"
      case "Liability": return "bg-red-100 text-red-800"
      case "Equity": return "bg-blue-100 text-blue-800"
      default: return "bg-gray-100 text-gray-800"
    }
  }, [])

  return (
    <TableRow>
      <TableCell className="font-medium">{account.code}</TableCell>
      <TableCell>{account.name}</TableCell>
      {showBalance && (
        <TableCell className="text-right font-mono">
          {formatBalance(account.balance)}
        </TableCell>
      )}
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
         prevProps.showBalance === nextProps.showBalance
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

// 优化的财务比率组件
const FinancialRatio = React.memo(({ 
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

export function BalanceSheetOptimized() {
  const { hasPermission } = useAuth()
  
  // 使用优化的数据 hooks
  const { 
    data: accounts, 
    loading: accountsLoading, 
    error: accountsError,
    refetch: refetchAccounts 
  } = useOptimizedAccounts()
  
  const [asOfDate, setAsOfDate] = React.useState(new Date().toISOString().split("T")[0])

  // 优化的资产负债表数据计算
  const balanceSheetData = React.useMemo(() => {
    if (!accounts) return { assets: [], liabilities: [], equity: [], totalAssets: 0, totalLiabilities: 0, totalEquity: 0, isBalanced: false }

    const assets = accounts.filter((account) => account.type === "Asset")
    const liabilities = accounts.filter((account) => account.type === "Liability")
    const equity = accounts.filter((account) => account.type === "Equity")

    const totalAssets = assets.reduce((sum, account) => sum + account.balance, 0)
    const totalLiabilities = liabilities.reduce((sum, account) => sum + account.balance, 0)
    const totalEquity = equity.reduce((sum, account) => sum + account.balance, 0)

    const isBalanced = Math.abs(totalAssets - (totalLiabilities + totalEquity)) < 0.01

    return {
      assets,
      liabilities,
      equity,
      totalAssets,
      totalLiabilities,
      totalEquity,
      isBalanced
    }
  }, [accounts])

  // 优化的财务比率计算
  const financialRatios = React.useMemo(() => {
    const { totalAssets, totalLiabilities, totalEquity } = balanceSheetData
    
    if (totalAssets === 0) return {}

    const debtToEquityRatio = totalLiabilities / totalEquity
    const debtToAssetRatio = totalLiabilities / totalAssets
    const equityRatio = totalEquity / totalAssets

    return {
      debtToEquity: {
        value: debtToEquityRatio.toFixed(2),
        status: (debtToEquityRatio < 1 ? "good" : debtToEquityRatio < 2 ? "warning" : "poor") as "good" | "warning" | "poor"
      },
      debtToAsset: {
        value: (debtToAssetRatio * 100).toFixed(1) + "%",
        status: (debtToAssetRatio < 0.5 ? "good" : debtToAssetRatio < 0.7 ? "warning" : "poor") as "good" | "warning" | "poor"
      },
      equityRatio: {
        value: (equityRatio * 100).toFixed(1) + "%",
        status: (equityRatio > 0.5 ? "good" : equityRatio > 0.3 ? "warning" : "poor") as "good" | "warning" | "poor"
      }
    }
  }, [balanceSheetData])

  // 优化的统计数据计算
  const stats = React.useMemo(() => {
    if (!accounts) return { totalAccounts: 0, assetAccounts: 0, liabilityAccounts: 0, equityAccounts: 0 }

    const totalAccounts = accounts.length
    const assetAccounts = accounts.filter(account => account.type === "Asset").length
    const liabilityAccounts = accounts.filter(account => account.type === "Liability").length
    const equityAccounts = accounts.filter(account => account.type === "Equity").length

    return {
      totalAccounts,
      assetAccounts,
      liabilityAccounts,
      equityAccounts
    }
  }, [accounts])

  // 优化的刷新函数
  const handleRefresh = React.useCallback(async () => {
    try {
      await refetchAccounts()
    } catch (error) {
      console.error("刷新资产负债表失败:", error)
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
        <p className="text-muted-foreground">加载资产负债表...</p>
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
          <h1 className="text-3xl font-bold tracking-tight">资产负债表</h1>
          <p className="text-muted-foreground">查看您公司的财务状况和净资产。</p>
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
          title="总资产"
          value={`$${balanceSheetData.totalAssets.toLocaleString()}`}
          change={`${stats.assetAccounts} 个资产账户`}
          trend="up"
          icon={TrendingUp}
        />
        <StatCard
          title="总负债"
          value={`$${balanceSheetData.totalLiabilities.toLocaleString()}`}
          change={`${stats.liabilityAccounts} 个负债账户`}
          trend="down"
          icon={TrendingDown}
        />
        <StatCard
          title="股东权益"
          value={`$${balanceSheetData.totalEquity.toLocaleString()}`}
          change={`${stats.equityAccounts} 个权益账户`}
          trend="neutral"
          icon={Building2}
        />
        <StatCard
          title="净资产"
          value={`$${(balanceSheetData.totalAssets - balanceSheetData.totalLiabilities).toLocaleString()}`}
          change={balanceSheetData.isBalanced ? "平衡" : "不平衡"}
          trend={balanceSheetData.isBalanced ? "neutral" : "down"}
          icon={DollarSign}
        />
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>资产负债表</CardTitle>
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
          <div className="grid gap-6 md:grid-cols-2">
            {/* 资产部分 */}
            <div>
              <h3 className="text-lg font-semibold mb-4">资产</h3>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>账户代码</TableHead>
                    <TableHead>账户名称</TableHead>
                    <TableHead className="text-right">余额</TableHead>
                    <TableHead>类型</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {balanceSheetData.assets.map((account) => (
                    <AccountRow
                      key={account.id}
                      account={account}
                      showBalance={true}
                    />
                  ))}
                  <TableRow className="font-bold border-t-2">
                    <TableCell colSpan={2}>总资产</TableCell>
                    <TableCell className="text-right font-mono">
                      ${balanceSheetData.totalAssets.toLocaleString()}
                    </TableCell>
                    <TableCell></TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>

            {/* 负债和权益部分 */}
            <div>
              <h3 className="text-lg font-semibold mb-4">负债和股东权益</h3>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>账户代码</TableHead>
                    <TableHead>账户名称</TableHead>
                    <TableHead className="text-right">余额</TableHead>
                    <TableHead>类型</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {/* 负债账户 */}
                  {balanceSheetData.liabilities.map((account) => (
                    <AccountRow
                      key={account.id}
                      account={account}
                      showBalance={true}
                    />
                  ))}
                  <TableRow className="font-bold border-t">
                    <TableCell colSpan={2}>总负债</TableCell>
                    <TableCell className="text-right font-mono">
                      ${balanceSheetData.totalLiabilities.toLocaleString()}
                    </TableCell>
                    <TableCell></TableCell>
                  </TableRow>
                  
                  {/* 权益账户 */}
                  {balanceSheetData.equity.map((account) => (
                    <AccountRow
                      key={account.id}
                      account={account}
                      showBalance={true}
                    />
                  ))}
                  <TableRow className="font-bold border-t">
                    <TableCell colSpan={2}>总股东权益</TableCell>
                    <TableCell className="text-right font-mono">
                      ${balanceSheetData.totalEquity.toLocaleString()}
                    </TableCell>
                    <TableCell></TableCell>
                  </TableRow>
                  
                  {/* 总计 */}
                  <TableRow className="font-bold border-t-2">
                    <TableCell colSpan={2}>负债和股东权益总计</TableCell>
                    <TableCell className="text-right font-mono">
                      ${(balanceSheetData.totalLiabilities + balanceSheetData.totalEquity).toLocaleString()}
                    </TableCell>
                    <TableCell></TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 财务比率分析 */}
      <Card>
        <CardHeader>
          <CardTitle>财务比率分析</CardTitle>
          <CardDescription>关键财务指标和比率</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <FinancialRatio
              title="负债权益比率"
              value={financialRatios.debtToEquity?.value || "N/A"}
              description="总负债 / 股东权益"
              status={financialRatios.debtToEquity?.status || "neutral"}
            />
            <FinancialRatio
              title="资产负债率"
              value={financialRatios.debtToAsset?.value || "N/A"}
              description="总负债 / 总资产"
              status={financialRatios.debtToAsset?.status || "neutral"}
            />
            <FinancialRatio
              title="权益比率"
              value={financialRatios.equityRatio?.value || "N/A"}
              description="股东权益 / 总资产"
              status={financialRatios.equityRatio?.status || "neutral"}
            />
          </div>
        </CardContent>
      </Card>

      {/* 资产结构分析 */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>资产结构</CardTitle>
            <CardDescription>资产构成分析</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>流动资产</span>
                  <span>${balanceSheetData.totalAssets.toLocaleString()}</span>
                </div>
                <Progress value={100} className="h-2" />
              </div>
              <div className="text-xs text-muted-foreground">
                <p>• 总资产: ${balanceSheetData.totalAssets.toLocaleString()}</p>
                <p>• 资产账户数: {stats.assetAccounts}</p>
                <p>• 平均资产余额: ${(balanceSheetData.totalAssets / stats.assetAccounts || 1).toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>负债结构</CardTitle>
            <CardDescription>负债构成分析</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>总负债</span>
                  <span>${balanceSheetData.totalLiabilities.toLocaleString()}</span>
                </div>
                <Progress 
                  value={(balanceSheetData.totalLiabilities / (balanceSheetData.totalLiabilities + balanceSheetData.totalEquity)) * 100} 
                  className="h-2" 
                />
              </div>
              <div className="text-xs text-muted-foreground">
                <p>• 总负债: ${balanceSheetData.totalLiabilities.toLocaleString()}</p>
                <p>• 负债账户数: {stats.liabilityAccounts}</p>
                <p>• 平均负债余额: ${(balanceSheetData.totalLiabilities / stats.liabilityAccounts || 1).toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 平衡状态检查 */}
      {!balanceSheetData.isBalanced && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="text-red-800">资产负债表不平衡</CardTitle>
            <CardDescription className="text-red-600">
              资产总额与负债和股东权益总额不相等
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <p><strong>资产总额:</strong> ${balanceSheetData.totalAssets.toLocaleString()}</p>
              <p><strong>负债和股东权益总额:</strong> ${(balanceSheetData.totalLiabilities + balanceSheetData.totalEquity).toLocaleString()}</p>
              <p><strong>差异:</strong> ${Math.abs(balanceSheetData.totalAssets - (balanceSheetData.totalLiabilities + balanceSheetData.totalEquity)).toLocaleString()}</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
} 