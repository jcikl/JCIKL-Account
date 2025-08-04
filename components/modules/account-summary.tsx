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

export function AccountSummary({ accounts, onRefresh }: AccountSummaryProps) {
  const [activeTab, setActiveTab] = React.useState("overview")
  const [showDetails, setShowDetails] = React.useState(false)

  const stats = React.useMemo((): EnhancedAccountStats => {
    const totalAccounts = accounts.length
    const totalBalance = accounts.reduce((sum, account) => sum + account.balance, 0)
    const positiveAccounts = accounts.filter(account => account.balance > 0).length
    const negativeAccounts = accounts.filter(account => account.balance < 0).length
    const zeroBalanceAccounts = accounts.filter(account => account.balance === 0).length

    const assets = accounts.filter(account => account.type === "Asset")
    const liabilities = accounts.filter(account => account.type === "Liability")
    const equity = accounts.filter(account => account.type === "Equity")

    const totalAssets = assets.reduce((sum, account) => sum + account.balance, 0)
    const totalLiabilities = liabilities.reduce((sum, account) => sum + account.balance, 0)
    const totalEquity = equity.reduce((sum, account) => sum + account.balance, 0)
    
    const currentRatio = totalLiabilities !== 0 ? totalAssets / Math.abs(totalLiabilities) : 0
    const debtToEquityRatio = totalEquity > 0 ? Math.abs(totalLiabilities) / totalEquity : 0
    const assetUtilization = totalAssets > 0 ? (Math.abs(totalLiabilities) + totalEquity) / totalAssets : 0

    const healthyAccounts = accounts.filter(account => {
      if (account.type === "Asset") return account.balance >= 0
      if (account.type === "Liability") return account.balance <= 0
      if (account.type === "Equity") return account.balance >= 0
      return true
    }).length

    const warningAccounts = accounts.filter(account => {
      if (account.type === "Asset" && account.balance < 0) return true
      if (account.type === "Liability" && account.balance > 0) return true
      if (account.type === "Equity" && account.balance < 0) return true
      return false
    }).length

    const criticalAccounts = accounts.filter(account => {
      if (account.type === "Asset" && account.balance < -1000) return true
      if (account.type === "Liability" && account.balance > 1000) return true
      if (account.type === "Equity" && account.balance < -1000) return true
      return false
    }).length

    const accountTypes = ["Asset", "Liability", "Equity", "Revenue", "Expense"]
    const typeStats = accountTypes.map(type => {
      const accountsOfType = accounts.filter(account => account.type === type)
      const totalBalanceOfType = accountsOfType.reduce((sum, account) => sum + account.balance, 0)
      const balances = accountsOfType.map(account => account.balance)
      
      return {
        type,
        count: accountsOfType.length,
        totalBalance: totalBalanceOfType,
        percentage: (accountsOfType.length / totalAccounts) * 100,
        averageBalance: accountsOfType.length > 0 ? totalBalanceOfType / accountsOfType.length : 0,
        maxBalance: balances.length > 0 ? Math.max(...balances) : 0,
        minBalance: balances.length > 0 ? Math.min(...balances) : 0
      }
    })

    const financialStatements = [...new Set(accounts.map(account => account.financialStatement).filter(Boolean))] as string[]
    const financialStatementStats = financialStatements.map(statement => {
      const accountsOfStatement = accounts.filter(account => account.financialStatement === statement)
      const totalBalanceOfStatement = accountsOfStatement.reduce((sum, account) => sum + account.balance, 0)
      
      return {
        statement,
        count: accountsOfStatement.length,
        totalBalance: totalBalanceOfStatement,
        percentage: (accountsOfStatement.length / totalAccounts) * 100
      }
    })

    const balanceDistribution = {
      veryHigh: accounts.filter(account => Math.abs(account.balance) > 100000).length,
      high: accounts.filter(account => Math.abs(account.balance) > 10000 && Math.abs(account.balance) <= 100000).length,
      medium: accounts.filter(account => Math.abs(account.balance) > 1000 && Math.abs(account.balance) <= 10000).length,
      low: accounts.filter(account => Math.abs(account.balance) > 100 && Math.abs(account.balance) <= 1000).length,
      veryLow: accounts.filter(account => Math.abs(account.balance) <= 100).length
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

  const getHealthColor = (type: string, balance: number) => {
    if (type === "Asset" && balance < 0) return "text-red-600"
    if (type === "Liability" && balance > 0) return "text-red-600"
    if (type === "Equity" && balance < 0) return "text-red-600"
    return "text-green-600"
  }

  const getHealthIcon = (type: string, balance: number) => {
    if (type === "Asset" && balance < 0) return XCircle
    if (type === "Liability" && balance > 0) return XCircle
    if (type === "Equity" && balance < 0) return XCircle
    return CheckCircle
  }

  const getRatioStatus = (ratio: number, threshold: number) => {
    if (ratio >= threshold) return { color: "text-green-600", status: "良好" }
    if (ratio >= threshold * 0.8) return { color: "text-yellow-600", status: "注意" }
    return { color: "text-red-600", status: "风险" }
  }

  return React.createElement("div", { className: "space-y-6" },
    React.createElement("div", { className: "flex items-center justify-between" },
      React.createElement("div", null,
        React.createElement("h2", { className: "text-2xl font-bold" }, "账户摘要分析"),
        React.createElement("p", { className: "text-muted-foreground" }, "全面的账户财务状况分析")
      ),
      React.createElement("div", { className: "flex gap-2" },
        React.createElement(Button, { 
          variant: "outline", 
          onClick: () => setShowDetails(!showDetails) 
        },
          React.createElement(Eye, { className: "h-4 w-4 mr-2" }),
          showDetails ? "隐藏详情" : "显示详情"
        ),
        onRefresh && React.createElement(Button, { 
          variant: "outline", 
          onClick: onRefresh 
        },
          React.createElement(RefreshCw, { className: "h-4 w-4 mr-2" }),
          "刷新"
        )
      )
    ),

    React.createElement("div", { className: "grid gap-4 grid-cols-2 md:grid-cols-4" },
      React.createElement(Card, null,
        React.createElement(CardHeader, { className: "flex flex-row items-center justify-between space-y-0 pb-2" },
          React.createElement(CardTitle, { className: "text-sm font-medium" }, "总账户数"),
          React.createElement(Hash, { className: "h-4 w-4 text-muted-foreground" })
        ),
        React.createElement(CardContent, null,
          React.createElement("div", { className: "text-2xl font-bold" }, stats.totalAccounts),
          React.createElement("p", { className: "text-xs text-muted-foreground" }, "活跃账户")
        )
      ),

      React.createElement(Card, null,
        React.createElement(CardHeader, { className: "flex flex-row items-center justify-between space-y-0 pb-2" },
          React.createElement(CardTitle, { className: "text-sm font-medium" }, "总余额"),
          React.createElement(DollarSign, { className: "h-4 w-4 text-muted-foreground" })
        ),
        React.createElement(CardContent, null,
          React.createElement("div", { className: "text-2xl font-bold" }, `$${stats.totalBalance.toLocaleString()}`),
          React.createElement("p", { className: "text-xs text-muted-foreground" }, "所有账户余额总和")
        )
      ),

      React.createElement(Card, null,
        React.createElement(CardHeader, { className: "flex flex-row items-center justify-between space-y-0 pb-2" },
          React.createElement(CardTitle, { className: "text-sm font-medium" }, "健康账户"),
          React.createElement(CheckCircle, { className: "h-4 w-4 text-green-600" })
        ),
        React.createElement(CardContent, null,
          React.createElement("div", { className: "text-2xl font-bold text-green-600" }, stats.healthyAccounts),
          React.createElement("p", { className: "text-xs text-muted-foreground" },
            `${((stats.healthyAccounts / stats.totalAccounts) * 100).toFixed(1)}% 的账户`
          )
        )
      ),

      React.createElement(Card, null,
        React.createElement(CardHeader, { className: "flex flex-row items-center justify-between space-y-0 pb-2" },
          React.createElement(CardTitle, { className: "text-sm font-medium" }, "风险账户"),
          React.createElement(AlertTriangle, { className: "h-4 w-4 text-red-600" })
        ),
        React.createElement(CardContent, null,
          React.createElement("div", { className: "text-2xl font-bold text-red-600" }, stats.criticalAccounts),
          React.createElement("p", { className: "text-xs text-muted-foreground" }, "需要关注")
        )
      )
    ),

    React.createElement(Tabs, { value: activeTab, onValueChange: setActiveTab, className: "space-y-4" },
      React.createElement(TabsList, { className: "grid w-full grid-cols-4" },
        React.createElement(TabsTrigger, { value: "overview" }, "概览"),
        React.createElement(TabsTrigger, { value: "ratios" }, "财务比率"),
        React.createElement(TabsTrigger, { value: "distribution" }, "分布分析"),
        React.createElement(TabsTrigger, { value: "health" }, "健康度")
      ),

      React.createElement(TabsContent, { value: "overview", className: "space-y-4" },
        React.createElement("div", { className: "grid gap-4 md:grid-cols-2" },
          React.createElement(Card, null,
            React.createElement(CardHeader, null,
              React.createElement(CardTitle, { className: "flex items-center gap-2" },
                React.createElement(PieChart, { className: "h-4 w-4" }),
                "账户类型分布"
              ),
              React.createElement(CardDescription, null, "按账户类型分组的统计信息")
            ),
            React.createElement(CardContent, null,
              React.createElement("div", { className: "space-y-4" },
                stats.typeStats.map((typeStat) =>
                  React.createElement("div", { key: typeStat.type, className: "space-y-2" },
                    React.createElement("div", { className: "flex items-center justify-between" },
                      React.createElement("div", { className: "flex items-center space-x-2" },
                        React.createElement(Badge, { variant: "outline" }, typeStat.type),
                        React.createElement("span", { className: "text-sm font-medium" }, `${typeStat.count} 个账户`)
                      ),
                      React.createElement("span", { className: "text-sm font-mono" }, `$${typeStat.totalBalance.toLocaleString()}`)
                    ),
                    React.createElement(Progress, { value: typeStat.percentage, className: "h-2" }),
                    React.createElement("p", { className: "text-xs text-muted-foreground" },
                      `${typeStat.percentage.toFixed(1)}% 的账户 | 平均余额: $${typeStat.averageBalance.toLocaleString()}`
                    )
                  )
                )
              )
            )
          ),

          stats.financialStatementStats.length > 0 && React.createElement(Card, null,
            React.createElement(CardHeader, null,
              React.createElement(CardTitle, { className: "flex items-center gap-2" },
                React.createElement(BarChart3, { className: "h-4 w-4" }),
                "财务报表分类"
              ),
              React.createElement(CardDescription, null, "按财务报表分类的账户分布")
            ),
            React.createElement(CardContent, null,
              React.createElement("div", { className: "space-y-4" },
                stats.financialStatementStats.map((statementStat) =>
                  React.createElement("div", { key: statementStat.statement, className: "space-y-2" },
                    React.createElement("div", { className: "flex items-center justify-between" },
                      React.createElement("span", { className: "text-sm font-medium" }, statementStat.statement),
                      React.createElement("span", { className: "text-sm font-mono" }, `$${statementStat.totalBalance.toLocaleString()}`)
                    ),
                    React.createElement(Progress, { value: statementStat.percentage, className: "h-2" }),
                    React.createElement("p", { className: "text-xs text-muted-foreground" },
                      `${statementStat.count} 个账户 (${statementStat.percentage.toFixed(1)}%)`
                    )
                  )
                )
              )
            )
          )
        ),

        React.createElement(Card, null,
          React.createElement(CardHeader, null,
            React.createElement(CardTitle, { className: "flex items-center gap-2" },
              React.createElement(Target, { className: "h-4 w-4" }),
              "余额分布"
            ),
            React.createElement(CardDescription, null, "按余额大小分组的账户分布")
          ),
          React.createElement(CardContent, null,
            React.createElement("div", { className: "grid gap-4 md:grid-cols-5" },
              React.createElement("div", { className: "text-center" },
                React.createElement("div", { className: "text-2xl font-bold text-red-600" }, stats.balanceDistribution.veryHigh),
                React.createElement("p", { className: "text-xs text-muted-foreground" }, "极高余额\n(>100,000)")
              ),
              React.createElement("div", { className: "text-center" },
                React.createElement("div", { className: "text-2xl font-bold text-orange-600" }, stats.balanceDistribution.high),
                React.createElement("p", { className: "text-xs text-muted-foreground" }, "高余额\n(10,000-100,000)")
              ),
              React.createElement("div", { className: "text-center" },
                React.createElement("div", { className: "text-2xl font-bold text-yellow-600" }, stats.balanceDistribution.medium),
                React.createElement("p", { className: "text-xs text-muted-foreground" }, "中等余额\n(1,000-10,000)")
              ),
              React.createElement("div", { className: "text-center" },
                React.createElement("div", { className: "text-2xl font-bold text-blue-600" }, stats.balanceDistribution.low),
                React.createElement("p", { className: "text-xs text-muted-foreground" }, "低余额\n(100-1,000)")
              ),
              React.createElement("div", { className: "text-center" },
                React.createElement("div", { className: "text-2xl font-bold text-gray-600" }, stats.balanceDistribution.veryLow),
                React.createElement("p", { className: "text-xs text-muted-foreground" }, "极低余额\n(<100)")
              )
            )
          )
        )
      )
    )
  )
} 