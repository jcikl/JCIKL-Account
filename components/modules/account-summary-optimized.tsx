"use client"

import * as React from "react"
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Hash, 
  Activity, 
  AlertTriangle,
  CheckCircle,
  XCircle,
  BarChart3,
  PieChart,
  Target,
  Calculator,
  Eye,
  RefreshCw
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import type { Account } from "@/lib/data"

interface AccountSummaryProps {
  accounts: Account[]
  onRefresh?: () => void
}

interface EnhancedAccountStats {
  totalAccounts: number
  totalBalance: number
  positiveAccounts: number
  negativeAccounts: number
  zeroBalanceAccounts: number
  currentRatio: number
  debtToEquityRatio: number
  assetUtilization: number
  healthyAccounts: number
  warningAccounts: number
  criticalAccounts: number
  typeStats: Array<{
    type: string
    count: number
    totalBalance: number
    percentage: number
    averageBalance: number
    maxBalance: number
    minBalance: number
  }>
  financialStatementStats: Array<{
    statement: string
    count: number
    totalBalance: number
    percentage: number
  }>
  balanceDistribution: {
    veryHigh: number
    high: number
    medium: number
    low: number
    veryLow: number
  }
  trends: {
    assetGrowth: number
    liabilityGrowth: number
    equityGrowth: number
  }
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

// 优化的类型统计项组件
const TypeStatItem = React.memo(({ typeStat }: { typeStat: EnhancedAccountStats['typeStats'][0] }) => (
  <div className="space-y-2">
    <div className="flex items-center justify-between">
      <div className="flex items-center space-x-2">
        <Badge variant="outline">{typeStat.type}</Badge>
        <span className="text-sm font-medium">{typeStat.count} 个账户</span>
      </div>
      <span className="text-sm font-mono">${typeStat.totalBalance.toLocaleString()}</span>
    </div>
    <Progress value={typeStat.percentage} className="h-2" />
    <p className="text-xs text-muted-foreground">
      {typeStat.percentage.toFixed(1)}% 的账户 | 平均余额: ${typeStat.averageBalance.toLocaleString()}
    </p>
  </div>
))

// 优化的财务报表统计项组件
const FinancialStatementItem = React.memo(({ statementStat }: { statementStat: EnhancedAccountStats['financialStatementStats'][0] }) => (
  <div className="space-y-2">
    <div className="flex items-center justify-between">
      <span className="text-sm font-medium">{statementStat.statement}</span>
      <span className="text-sm font-mono">${statementStat.totalBalance.toLocaleString()}</span>
    </div>
    <Progress value={statementStat.percentage} className="h-2" />
    <p className="text-xs text-muted-foreground">
      {statementStat.count} 个账户 ({statementStat.percentage.toFixed(1)}%)
    </p>
  </div>
))

// 优化的余额分布项组件
const BalanceDistributionItem = React.memo(({ 
  count, 
  label, 
  color 
}: { 
  count: number
  label: string
  color: string 
}) => (
  <div className="text-center">
    <div className={`text-2xl font-bold ${color}`}>{count}</div>
    <p className="text-xs text-muted-foreground">{label}</p>
  </div>
))

export function AccountSummaryOptimized({ accounts, onRefresh }: AccountSummaryProps) {
  const [activeTab, setActiveTab] = React.useState("overview")
  const [showDetails, setShowDetails] = React.useState(false)

  // 优化的统计数据计算
  const stats = React.useMemo((): EnhancedAccountStats => {
    const totalAccounts = accounts?.length || 0
    const totalBalance = accounts.reduce((sum, account) => sum + account.balance, 0)
    const positiveAccounts = accounts.filter(account => account.balance > 0)?.length || 0
    const negativeAccounts = accounts.filter(account => account.balance < 0)?.length || 0
    const zeroBalanceAccounts = accounts.filter(account => account.balance === 0)?.length || 0

    const assets = accounts.filter(account => account.type === "Asset")
    const liabilities = accounts.filter(account => account.type === "Liability")
    const equity = accounts.filter(account => account.type === "Equity")

    const totalAssets = assets.reduce((sum, account) => sum + account.balance, 0)
    const totalLiabilities = liabilities.reduce((sum, account) => sum + account.balance, 0)
    const totalEquity = equity.reduce((sum, account) => sum + account.balance, 0)
    
    const currentRatio = totalLiabilities !== 0 ? totalAssets / Math.abs(totalLiabilities) : 0
    const debtToEquityRatio = totalEquity > 0 ? Math.abs(totalLiabilities) / totalEquity : 0
    const assetUtilization = totalAssets > 0 ? (Math.abs(totalLiabilities) + totalEquity) / totalAssets : 0

    const healthyAccounts = accounts?.filter(account => {
      if (account.type === "Asset") return account.balance >= 0
      if (account.type === "Liability") return account.balance <= 0
      if (account.type === "Equity") return account.balance >= 0
      return true
    })?.length || 0

    const warningAccounts = accounts?.filter(account => {
      if (account.type === "Asset" && account.balance < 0) return true
      if (account.type === "Liability" && account.balance > 0) return true
      if (account.type === "Equity" && account.balance < 0) return true
      return false
    })?.length || 0

    const criticalAccounts = accounts?.filter(account => {
      if (account.type === "Asset" && account.balance < -1000) return true
      if (account.type === "Liability" && account.balance > 1000) return true
      if (account.type === "Equity" && account.balance < -1000) return true
      return false
    })?.length || 0

    const accountTypes = ["Asset", "Liability", "Equity", "Revenue", "Expense"]
    const typeStats = accountTypes.map(type => {
      const accountsOfType = accounts.filter(account => account.type === type)
      const totalBalanceOfType = accountsOfType.reduce((sum, account) => sum + account.balance, 0)
      const balances = accountsOfType.map(account => account.balance)
      
      return {
        type,
        count: accountsOfType?.length || 0,
        totalBalance: totalBalanceOfType,
        percentage: ((accountsOfType?.length || 0) / totalAccounts) * 100,
        averageBalance: (accountsOfType?.length || 0) > 0 ? totalBalanceOfType / (accountsOfType?.length || 1) : 0,
        maxBalance: balances?.length > 0 ? Math.max(...balances) : 0,
        minBalance: balances?.length > 0 ? Math.min(...balances) : 0
      }
    })

    const financialStatements = [...new Set(accounts.map(account => account.financialStatement).filter(Boolean))] as string[]
    const financialStatementStats = financialStatements.map(statement => {
      const accountsOfStatement = accounts.filter(account => account.financialStatement === statement)
      const totalBalanceOfStatement = accountsOfStatement.reduce((sum, account) => sum + account.balance, 0)
      
      return {
        statement,
        count: accountsOfStatement?.length || 0,
        totalBalance: totalBalanceOfStatement,
        percentage: ((accountsOfStatement?.length || 0) / totalAccounts) * 100
      }
    })

    const balanceDistribution = {
      veryHigh: accounts?.filter(account => Math.abs(account.balance) > 100000)?.length || 0,
      high: accounts?.filter(account => Math.abs(account.balance) > 10000 && Math.abs(account.balance) <= 100000)?.length || 0,
      medium: accounts?.filter(account => Math.abs(account.balance) > 1000 && Math.abs(account.balance) <= 10000)?.length || 0,
      low: accounts?.filter(account => Math.abs(account.balance) > 100 && Math.abs(account.balance) <= 1000)?.length || 0,
      veryLow: accounts?.filter(account => Math.abs(account.balance) <= 100)?.length || 0
    }

    const trends = {
      assetGrowth: totalAssets > 0 ? 100 : 0,
      liabilityGrowth: totalLiabilities > 0 ? 100 : 0,
      equityGrowth: totalEquity > 0 ? 100 : 0
    }

    return {
      totalAccounts,
      totalBalance,
      positiveAccounts,
      negativeAccounts,
      zeroBalanceAccounts,
      currentRatio,
      debtToEquityRatio,
      assetUtilization,
      healthyAccounts,
      warningAccounts,
      criticalAccounts,
      typeStats,
      financialStatementStats,
      balanceDistribution,
      trends
    }
  }, [accounts])

  // 优化的健康状态颜色获取
  const getHealthColor = React.useCallback((type: string, balance: number) => {
    if (type === "Asset" && balance < 0) return "text-red-600"
    if (type === "Liability" && balance > 0) return "text-red-600"
    if (type === "Equity" && balance < 0) return "text-red-600"
    return "text-green-600"
  }, [])

  // 优化的健康状态图标获取
  const getHealthIcon = React.useCallback((type: string, balance: number) => {
    if (type === "Asset" && balance < 0) return XCircle
    if (type === "Liability" && balance > 0) return XCircle
    if (type === "Equity" && balance < 0) return XCircle
    return CheckCircle
  }, [])

  // 优化的比率状态获取
  const getRatioStatus = React.useCallback((ratio: number, threshold: number) => {
    if (ratio >= threshold) return { color: "text-green-600", status: "良好" }
    if (ratio >= threshold * 0.8) return { color: "text-yellow-600", status: "注意" }
    return { color: "text-red-600", status: "风险" }
  }, [])

  // 优化的健康账户百分比
  const healthyAccountsPercentage = React.useMemo(() => 
    ((stats.healthyAccounts / stats.totalAccounts) * 100).toFixed(1), 
    [stats.healthyAccounts, stats.totalAccounts]
  )

  // 优化的余额分布数据
  const balanceDistributionData = React.useMemo(() => [
    { count: stats.balanceDistribution.veryHigh, label: "极高余额\n(>100,000)", color: "text-red-600" },
    { count: stats.balanceDistribution.high, label: "高余额\n(10,000-100,000)", color: "text-orange-600" },
    { count: stats.balanceDistribution.medium, label: "中等余额\n(1,000-10,000)", color: "text-yellow-600" },
    { count: stats.balanceDistribution.low, label: "低余额\n(100-1,000)", color: "text-blue-600" },
    { count: stats.balanceDistribution.veryLow, label: "极低余额\n(<100)", color: "text-gray-600" }
  ], [stats.balanceDistribution])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">账户摘要分析</h2>
          <p className="text-muted-foreground">全面的账户财务状况分析</p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={() => setShowDetails(!showDetails)}
          >
            <Eye className="h-4 w-4 mr-2" />
            {showDetails ? "隐藏详情" : "显示详情"}
          </Button>
          {onRefresh && (
            <Button 
              variant="outline" 
              onClick={onRefresh}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              刷新
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
        <StatCard
          title="总账户数"
          value={stats.totalAccounts}
          description="活跃账户"
          icon={Hash}
        />

        <StatCard
          title="总余额"
          value={`$${stats.totalBalance.toLocaleString()}`}
          description="所有账户余额总和"
          icon={DollarSign}
        />

        <StatCard
          title="健康账户"
          value={stats.healthyAccounts}
          description={`${healthyAccountsPercentage}% 的账户`}
          icon={CheckCircle}
          color="text-green-600"
        />

        <StatCard
          title="风险账户"
          value={stats.criticalAccounts}
          description="需要关注"
          icon={AlertTriangle}
          color="text-red-600"
        />
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">概览</TabsTrigger>
          <TabsTrigger value="ratios">财务比率</TabsTrigger>
          <TabsTrigger value="distribution">分布分析</TabsTrigger>
          <TabsTrigger value="health">健康度</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="h-4 w-4" />
                  账户类型分布
                </CardTitle>
                <CardDescription>按账户类型分组的统计信息</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {stats.typeStats.map((typeStat) => (
                    <TypeStatItem key={typeStat.type} typeStat={typeStat} />
                  ))}
                </div>
              </CardContent>
            </Card>

            {stats.financialStatementStats?.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-4 w-4" />
                    财务报表分类
                  </CardTitle>
                  <CardDescription>按财务报表分类的账户分布</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {stats.financialStatementStats.map((statementStat) => (
                      <FinancialStatementItem key={statementStat.statement} statementStat={statementStat} />
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-4 w-4" />
                余额分布
              </CardTitle>
              <CardDescription>按余额大小分组的账户分布</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-5">
                {balanceDistributionData.map((item, index) => (
                  <BalanceDistributionItem
                    key={index}
                    count={item.count}
                    label={item.label}
                    color={item.color}
                  />
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ratios" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calculator className="h-4 w-4" />
                  流动比率
                </CardTitle>
                <CardDescription>资产与负债的比率</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.currentRatio.toFixed(2)}</div>
                <p className="text-sm text-muted-foreground">
                  建议值: ≥ 1.0
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  资产负债率
                </CardTitle>
                <CardDescription>负债与权益的比率</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.debtToEquityRatio.toFixed(2)}</div>
                <p className="text-sm text-muted-foreground">
                  建议值: ≤ 2.0
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-4 w-4" />
                  资产利用率
                </CardTitle>
                <CardDescription>资产使用效率</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{(stats.assetUtilization * 100).toFixed(1)}%</div>
                <p className="text-sm text-muted-foreground">
                  资产使用情况
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="distribution" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>余额分布详情</CardTitle>
              <CardDescription>详细的余额分布统计</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {balanceDistributionData.map((item, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className={`w-3 h-3 rounded-full ${item.color.replace('text-', 'bg-')}`} />
                      <span className="text-sm">{item.label.split('\n')[0]}</span>
                    </div>
                    <span className="text-sm font-medium">{item.count} 个账户</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="health" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  健康账户
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{stats.healthyAccounts}</div>
                <p className="text-sm text-muted-foreground">
                  符合会计规范的账户
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-yellow-600" />
                  警告账户
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600">{stats.warningAccounts}</div>
                <p className="text-sm text-muted-foreground">
                  需要关注的账户
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <XCircle className="h-4 w-4 text-red-600" />
                  风险账户
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{stats.criticalAccounts}</div>
                <p className="text-sm text-muted-foreground">
                  严重异常的账户
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
} 