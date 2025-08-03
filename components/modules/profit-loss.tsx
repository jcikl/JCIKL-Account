"use client"

import * as React from "react"
import { Calendar, Download, TrendingDown, TrendingUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { getAccounts, type Account } from "@/lib/firebase-utils"
import { useAuth } from "@/components/auth/auth-context"
import { RoleLevels, UserRoles } from "@/lib/data"

export function ProfitLoss() {
  const { hasPermission } = useAuth()
  const [accounts, setAccounts] = React.useState<Account[]>([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [period, setPeriod] = React.useState("current-month")
  const [startDate, setStartDate] = React.useState("2024-01-01")
  const [endDate, setEndDate] = React.useState("2024-01-31")

  const fetchAccounts = React.useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const fetched = await getAccounts()
      setAccounts(fetched)
    } catch (err: any) {
      setError("无法加载账户数据: " + err.message)
      console.error("Error fetching accounts for profit & loss:", err)
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    fetchAccounts()
  }, [fetchAccounts])

  // Sample P&L data based on fetched accounts
  const revenueAccounts = accounts.filter((account) => account.type === "Revenue")
  const expenseAccounts = accounts.filter((account) => account.type === "Expense")

  const totalRevenue = revenueAccounts.reduce((sum, account) => sum + account.balance, 0)
  const totalExpenses = expenseAccounts.reduce((sum, account) => sum + account.balance, 0)
  const netIncome = totalRevenue - totalExpenses

  const grossMargin = totalRevenue > 0 ? ((totalRevenue - totalExpenses) / totalRevenue) * 100 : 0

  if (loading) {
    return <div className="p-6 text-center">加载损益表...</div>
  }

  if (error) {
    return <div className="p-6 text-center text-red-500">{error}</div>
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">损益表</h1>
          <p className="text-muted-foreground">查看您公司的收入、支出和盈利能力。</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Calendar className="h-4 w-4 mr-2" />
            比较期间
          </Button>
          {hasPermission(RoleLevels[UserRoles.VICE_PRESIDENT]) && ( // Level 2 can export
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              导出PDF
            </Button>
          )}
        </div>
      </div>

      {/* Period Selection */}
      <Card>
        <CardHeader>
          <CardTitle>报告期间</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div>
              <Label htmlFor="period">期间</Label>
              <Select value={period} onValueChange={setPeriod}>
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
                  <Input id="start-date" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                </div>
                <div>
                  <Label htmlFor="end-date">结束日期</Label>
                  <Input id="end-date" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">总收入</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">${totalRevenue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">+12.5% 比上期</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">总支出</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">${totalExpenses.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">-3.2% 比上期</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">净利润</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${netIncome >= 0 ? "text-green-600" : "text-red-600"}`}>
              ${netIncome.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">{grossMargin.toFixed(1)}% 毛利率</p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed P&L Statement */}
      <Card>
        <CardHeader>
          <CardTitle>损益表</CardTitle>
          <CardDescription>
            期间 {startDate} 至 {endDate}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>账户</TableHead>
                <TableHead className="text-right">金额</TableHead>
                <TableHead className="text-right">占收入百分比</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {/* Revenue Section */}
              <TableRow className="bg-muted/50">
                <TableCell className="font-bold">收入</TableCell>
                <TableCell></TableCell>
                <TableCell></TableCell>
              </TableRow>
              {revenueAccounts.map((account) => (
                <TableRow key={account.id}>
                  <TableCell className="pl-6">{account.name}</TableCell>
                  <TableCell className="text-right font-mono">${account.balance.toLocaleString()}</TableCell>
                  <TableCell className="text-right">
                    {totalRevenue > 0 ? ((account.balance / totalRevenue) * 100).toFixed(1) : 0}%
                  </TableCell>
                </TableRow>
              ))}
              <TableRow className="border-t font-medium">
                <TableCell className="pl-6">总收入</TableCell>
                <TableCell className="text-right font-mono">${totalRevenue.toLocaleString()}</TableCell>
                <TableCell className="text-right">100.0%</TableCell>
              </TableRow>

              {/* Expenses Section */}
              <TableRow className="bg-muted/50">
                <TableCell className="font-bold">支出</TableCell>
                <TableCell></TableCell>
                <TableCell></TableCell>
              </TableRow>
              {expenseAccounts.map((account) => (
                <TableRow key={account.id}>
                  <TableCell className="pl-6">{account.name}</TableCell>
                  <TableCell className="text-right font-mono">${account.balance.toLocaleString()}</TableCell>
                  <TableCell className="text-right">
                    {totalRevenue > 0 ? ((account.balance / totalRevenue) * 100).toFixed(1) : 0}%
                  </TableCell>
                </TableRow>
              ))}
              <TableRow className="border-t font-medium">
                <TableCell className="pl-6">总支出</TableCell>
                <TableCell className="text-right font-mono">${totalExpenses.toLocaleString()}</TableCell>
                <TableCell className="text-right">
                  {totalRevenue > 0 ? ((totalExpenses / totalRevenue) * 100).toFixed(1) : 0}%
                </TableCell>
              </TableRow>

              {/* Net Income */}
              <TableRow className="border-t-2 font-bold text-lg">
                <TableCell>净利润</TableCell>
                <TableCell className={`text-right font-mono ${netIncome >= 0 ? "text-green-600" : "text-red-600"}`}>
                  ${netIncome.toLocaleString()}
                </TableCell>
                <TableCell className="text-right">
                  {totalRevenue > 0 ? ((netIncome / totalRevenue) * 100).toFixed(1) : 0}%
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
