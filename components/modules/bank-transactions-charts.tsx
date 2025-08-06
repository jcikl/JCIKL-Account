"use client"

import React, { useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Transaction, BankAccount } from "@/lib/data"
import { formatCurrency } from "@/lib/utils"
import { 
  ChartContainer, 
  ChartTooltip, 
  ChartTooltipContent, 
  ChartLegend, 
  ChartLegendContent 
} from "@/components/ui/chart"
import { 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  ResponsiveContainer,
  Tooltip,
  Legend,
  Area,
  AreaChart
} from "recharts"
import { TrendingUp, TrendingDown, DollarSign, Calendar, BarChart3, PieChart } from "lucide-react"

interface BankTransactionsChartsProps {
  transactions: Transaction[]
  bankAccount: BankAccount | null
  className?: string
}

interface ChartData {
  monthlyTrend: {
    month: string
    monthShort: string
    income: number
    expense: number
    net: number
  }[]
  categoryDistribution: {
    category: string
    amount: number
    count: number
  }[]
  projectStats: {
    project: string
    totalAmount: number
    transactionCount: number
    avgAmount: number
  }[]
  statusDistribution: {
    status: string
    count: number
    amount: number
  }[]
}

export function BankTransactionsCharts({ transactions, bankAccount, className }: BankTransactionsChartsProps) {
  const chartData = useMemo((): ChartData => {
    if (!transactions?.length) {
      return {
        monthlyTrend: [],
        categoryDistribution: [],
        projectStats: [],
        statusDistribution: []
      }
    }

    // 月度趋势数据 - 修正计算逻辑
    const monthlyData = new Map<string, { income: number; expense: number; net: number }>()
    
    transactions.forEach(transaction => {
      const date = typeof transaction.date === 'string' 
        ? new Date(transaction.date) 
        : new Date(transaction.date.seconds * 1000)
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      
      if (!monthlyData.has(monthKey)) {
        monthlyData.set(monthKey, { income: 0, expense: 0, net: 0 })
      }
      
      const data = monthlyData.get(monthKey)!
      // 使用正确的字段名称：income 和 expense
      data.income += transaction.income || 0
      data.expense += transaction.expense || 0
      data.net = data.income - data.expense
    })

    const monthlyTrend = Array.from(monthlyData.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, data]) => {
        const [year, month] = key.split('-')
        return {
          month: `${year}年${month}月`,
          monthShort: `${month}月`,
          income: data.income,
          expense: data.expense,
          net: data.net
        }
      })

    // 分类分布数据 - 修正计算逻辑
    const categoryData = new Map<string, { amount: number; count: number }>()
    
    transactions.forEach(transaction => {
      const category = transaction.category || '未分类'
      if (!categoryData.has(category)) {
        categoryData.set(category, { amount: 0, count: 0 })
      }
      const data = categoryData.get(category)!
      data.amount += (transaction.income || 0) + (transaction.expense || 0)
      data.count += 1
    })

    const categoryDistribution = Array.from(categoryData.entries())
      .map(([category, data]) => ({
        category,
        amount: data.amount,
        count: data.count
      }))
      .sort((a, b) => b.amount - a.amount)

    // 项目统计数据 - 修正计算逻辑
    const projectData = new Map<string, { totalAmount: number; transactionCount: number }>()
    
    transactions.forEach(transaction => {
      const project = transaction.projectName || transaction.projectid || '未分配项目'
      if (!projectData.has(project)) {
        projectData.set(project, { totalAmount: 0, transactionCount: 0 })
      }
      const data = projectData.get(project)!
      data.totalAmount += (transaction.income || 0) + (transaction.expense || 0)
      data.transactionCount += 1
    })

    const projectStats = Array.from(projectData.entries())
      .map(([project, data]) => ({
        project,
        totalAmount: data.totalAmount,
        transactionCount: data.transactionCount,
        avgAmount: data.totalAmount / data.transactionCount
      }))
      .sort((a, b) => b.totalAmount - a.totalAmount)

    // 状态分布数据 - 修正计算逻辑
    const statusData = new Map<string, { count: number; amount: number }>()
    
    transactions.forEach(transaction => {
      const status = transaction.status || '未知'
      if (!statusData.has(status)) {
        statusData.set(status, { count: 0, amount: 0 })
      }
      const data = statusData.get(status)!
      data.count += 1
      data.amount += (transaction.income || 0) + (transaction.expense || 0)
    })

    const statusDistribution = Array.from(statusData.entries())
      .map(([status, data]) => ({
        status,
        count: data.count,
        amount: data.amount
      }))
      .sort((a, b) => b.count - a.count)

    return {
      monthlyTrend,
      categoryDistribution,
      projectStats,
      statusDistribution
    }
  }, [transactions])

  const totalIncome = chartData.monthlyTrend?.reduce((sum, month) => sum + month.income, 0)
  const totalExpense = chartData.monthlyTrend?.reduce((sum, month) => sum + month.expense, 0)
  const netAmount = totalIncome - totalExpense

  // 图表配置
  const chartConfig = {
    income: {
      label: "收入",
      color: "hsl(var(--chart-1))",
    },
    expense: {
      label: "支出", 
      color: "hsl(var(--chart-2))",
    },
    net: {
      label: "净额",
      color: "hsl(var(--chart-3))",
    },
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* 总体统计卡片 */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-green-800">总收入</CardTitle>
            <Badge variant="secondary" className="text-green-600 bg-green-200">
              <TrendingUp className="h-3 w-3 mr-1" />
              收入
            </Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-700">
              {formatCurrency(totalIncome)}
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-red-800">总支出</CardTitle>
            <Badge variant="secondary" className="text-red-600 bg-red-200">
              <TrendingDown className="h-3 w-3 mr-1" />
              支出
            </Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-700">
              {formatCurrency(totalExpense)}
            </div>
          </CardContent>
        </Card>
        
        <Card className={`bg-gradient-to-br ${netAmount >= 0 ? 'from-green-50 to-green-100 border-green-200' : 'from-red-50 to-red-100 border-red-200'}`}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className={`text-sm font-medium ${netAmount >= 0 ? 'text-green-800' : 'text-red-800'}`}>净额</CardTitle>
            <Badge variant={netAmount >= 0 ? "secondary" : "destructive"} className={netAmount >= 0 ? "text-green-600 bg-green-200" : "text-red-600 bg-red-200"}>
              <DollarSign className="h-3 w-3 mr-1" />
              {netAmount >= 0 ? "盈余" : "亏损"}
            </Badge>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${netAmount >= 0 ? 'text-green-700' : 'text-red-700'}`}>
              {formatCurrency(Math.abs(netAmount))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 月度趋势 - 增强版 */}
      {chartData.monthlyTrend?.length > 0 && (
        <Card className="shadow-lg border-0 bg-gradient-to-br from-white to-gray-50">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-100">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 text-blue-900">
                  <BarChart3 className="h-5 w-5" />
                  月度趋势分析
                </CardTitle>
                <CardDescription className="text-blue-700">
                  收入和支出趋势分析，帮助您了解财务状况变化
                </CardDescription>
              </div>
              <Badge variant="outline" className="bg-blue-100 text-blue-700 border-blue-200">
                <Calendar className="h-3 w-3 mr-1" />
                {chartData.monthlyTrend.length} 个月
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            {/* 图表区域 */}
            <div className="mb-6">
              <ChartContainer config={chartConfig} className="h-[300px]">
                <AreaChart data={chartData.monthlyTrend}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis 
                    dataKey="monthShort" 
                    tick={{ fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis 
                    tickFormatter={(value) => formatCurrency(value)}
                    tick={{ fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip 
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-white p-3 border rounded-lg shadow-lg">
                            <p className="font-medium text-gray-900">{label}</p>
                            {payload.map((entry: any, index: number) => (
                              <p key={index} className="text-sm" style={{ color: entry.color }}>
                                {entry.name}: {formatCurrency(entry.value)}
                              </p>
                            ))}
                          </div>
                        )
                      }
                      return null
                    }}
                  />
                  <Legend />
                  <Area 
                    type="monotone" 
                    dataKey="income" 
                    stackId="1" 
                    stroke="#10b981" 
                    fill="#10b981" 
                    fillOpacity={0.6}
                    name="收入"
                  />
                  <Area 
                    type="monotone" 
                    dataKey="expense" 
                    stackId="1" 
                    stroke="#ef4444" 
                    fill="#ef4444" 
                    fillOpacity={0.6}
                    name="支出"
                  />
                </AreaChart>
              </ChartContainer>
            </div>

            {/* 月度数据表格 */}
            <div className="grid gap-3">
              {chartData.monthlyTrend.map((month, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex-1">
                    <div className="font-semibold text-gray-900 flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-blue-500" />
                      {month.month}
                    </div>
                    <div className="text-sm text-gray-500 mt-1">
                      净额: <span className={`font-medium ${month.net >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatCurrency(month.net)}
                      </span>
                    </div>
                  </div>
                  <div className="flex space-x-6 text-sm">
                    <div className="text-center">
                      <div className="text-green-600 font-semibold">
                        {formatCurrency(month.income)}
                      </div>
                      <div className="text-gray-500 text-xs">收入</div>
                    </div>
                    <div className="text-center">
                      <div className="text-red-600 font-semibold">
                        {formatCurrency(month.expense)}
                      </div>
                      <div className="text-gray-500 text-xs">支出</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 分类分布 */}
      {chartData.categoryDistribution?.length > 0 && (
        <Card className="relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-indigo-50/50 dark:from-blue-950/10 dark:to-indigo-950/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 relative">
            <CardTitle className="flex items-center gap-2">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg shadow-sm">
                <PieChart className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              分类分布
            </CardTitle>
            <CardDescription>按分类统计的交易金额和占比分析</CardDescription>
          </CardHeader>
          <CardContent className="pt-6 relative">
            {/* 饼图可视化 */}
            <div className="mb-6">
              <div className="flex justify-center">
                <div className="relative w-32 h-32">
                  <svg className="w-32 h-32 transform -rotate-90 drop-shadow-lg" viewBox="0 0 32 32">
                    {chartData.categoryDistribution.slice(0, 8).map((category, index) => {
                      const percentage = ((category.amount / (totalIncome + totalExpense)) * 100)
                      const colorVariants = [
                        '#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', 
                        '#EC4899', '#6366F1', '#EF4444', '#F97316'
                      ]
                      const color = colorVariants[index % colorVariants.length]
                      
                      // 计算饼图角度
                      const totalPercentage = chartData.categoryDistribution.slice(0, 8).reduce((sum, cat, i) => {
                        if (i <= index) {
                          return sum + ((cat.amount / (totalIncome + totalExpense)) * 100)
                        }
                        return sum
                      }, 0)
                      
                      const startAngle = (totalPercentage - percentage) * 3.6
                      const endAngle = totalPercentage * 3.6
                      const radius = 14
                      const centerX = 16
                      const centerY = 16
                      
                      const x1 = centerX + radius * Math.cos((startAngle - 90) * Math.PI / 180)
                      const y1 = centerY + radius * Math.sin((startAngle - 90) * Math.PI / 180)
                      const x2 = centerX + radius * Math.cos((endAngle - 90) * Math.PI / 180)
                      const y2 = centerY + radius * Math.sin((endAngle - 90) * Math.PI / 180)
                      
                      const largeArcFlag = percentage > 50 ? 1 : 0
                      
                      const pathData = [
                        `M ${centerX} ${centerY}`,
                        `L ${x1} ${y1}`,
                        `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
                        'Z'
                      ].join(' ')
                      
                      return (
                        <path
                          key={index}
                          d={pathData}
                          fill={color}
                          className="transition-all duration-300 hover:opacity-80 cursor-pointer hover:drop-shadow-lg"
                        />
                      )
                    })}
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center bg-white/80 dark:bg-gray-900/80 rounded-full p-2 shadow-sm">
                      <div className="text-lg font-bold text-foreground">
                        {chartData.categoryDistribution?.length}
                      </div>
                      <div className="text-xs text-muted-foreground">分类</div>
                    </div>
                  </div>
                </div>
              </div>
              {/* 图例 */}
              <div className="mt-4 flex flex-wrap justify-center gap-2">
                {chartData.categoryDistribution.slice(0, 8).map((category, index) => {
                  const colorVariants = [
                    '#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', 
                    '#EC4899', '#6366F1', '#EF4444', '#F97316'
                  ]
                  const color = colorVariants[index % colorVariants.length]
                  
                  return (
                    <div key={index} className="flex items-center gap-1 text-xs bg-white/60 dark:bg-gray-800/60 px-2 py-1 rounded-full shadow-sm">
                      <div 
                        className="w-3 h-3 rounded-full shadow-sm" 
                        style={{ backgroundColor: color }}
                      ></div>
                      <span className="text-muted-foreground truncate max-w-16 font-medium">
                        {category.category || '未分类'}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>

            <div className="space-y-4">
              {chartData.categoryDistribution.slice(0, 10).map((category, index) => {
                const percentage = ((category.amount / (totalIncome + totalExpense)) * 100)
                const colorVariants = [
                  { bg: 'bg-blue-500', text: 'text-blue-600', light: 'bg-blue-50', dark: 'dark:bg-blue-900/20' },
                  { bg: 'bg-green-500', text: 'text-green-600', light: 'bg-green-50', dark: 'dark:bg-green-900/20' },
                  { bg: 'bg-yellow-500', text: 'text-yellow-600', light: 'bg-yellow-50', dark: 'dark:bg-yellow-900/20' },
                  { bg: 'bg-purple-500', text: 'text-purple-600', light: 'bg-purple-50', dark: 'dark:bg-purple-900/20' },
                  { bg: 'bg-pink-500', text: 'text-pink-600', light: 'bg-pink-50', dark: 'dark:bg-pink-900/20' },
                  { bg: 'bg-indigo-500', text: 'text-indigo-600', light: 'bg-indigo-50', dark: 'dark:bg-indigo-900/20' },
                  { bg: 'bg-red-500', text: 'text-red-600', light: 'bg-red-50', dark: 'dark:bg-red-900/20' },
                  { bg: 'bg-orange-500', text: 'text-orange-600', light: 'bg-orange-50', dark: 'dark:bg-orange-900/20' },
                  { bg: 'bg-teal-500', text: 'text-teal-600', light: 'bg-teal-50', dark: 'dark:bg-teal-900/20' },
                  { bg: 'bg-cyan-500', text: 'text-cyan-600', light: 'bg-cyan-50', dark: 'dark:bg-cyan-900/20' }
                ]
                const color = colorVariants[index % colorVariants.length]
                
                return (
                  <div key={index} className="group relative overflow-hidden rounded-xl border bg-card p-4 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5 hover:border-primary/30 hover:-translate-y-1">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className={`h-4 w-4 rounded-full ${color.bg} flex-shrink-0 shadow-sm`}></div>
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-foreground truncate flex items-center gap-2">
                            {category.category || '未分类'}
                            {index < 3 && (
                              <Badge variant="secondary" className="text-xs px-2 py-0.5 animate-pulse">
                                {index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}
                              </Badge>
                            )}
                          </div>
                          <div className="text-sm text-muted-foreground flex items-center gap-2 mt-1">
                            <span className="flex items-center gap-1">
                              <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/40"></div>
                              {category.count} 笔交易
                            </span>
                            <span className="text-xs text-muted-foreground/60">•</span>
                            <span className="flex items-center gap-1">
                              <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/40"></div>
                              平均 {formatCurrency(category.amount / category.count)}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0 ml-4">
                        <div className="font-bold text-lg text-foreground">
                          {formatCurrency(category.amount)}
                        </div>
                        <div className="text-sm font-medium text-muted-foreground">
                          {percentage.toFixed(1)}%
                        </div>
                      </div>
                    </div>
                    
                    {/* Progress Bar */}
                    <div className="relative h-2.5 bg-muted rounded-full overflow-hidden">
                      <div 
                        className={`h-full ${color.bg} transition-all duration-700 ease-out rounded-full shadow-sm`}
                        style={{ width: `${Math.min(percentage, 100)}%` }}
                      >
                        <div className="h-full w-full bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse"></div>
                      </div>
                    </div>
                    
                    {/* Hover Effect */}
                    <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-primary/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none rounded-xl"></div>
                  </div>
                )
              })}
              
              {/* Summary Stats */}
              {chartData.categoryDistribution?.length > 0 && (
                <div className="mt-8 pt-6 border-t border-dashed">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center p-4 rounded-lg bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/20 dark:to-blue-900/20 border border-blue-200/50 dark:border-blue-800/50 hover:shadow-md transition-shadow">
                      <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                        {chartData.categoryDistribution?.length}
                      </div>
                      <div className="text-sm text-muted-foreground font-medium">分类总数</div>
                    </div>
                    <div className="text-center p-4 rounded-lg bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/20 dark:to-green-900/20 border border-green-200/50 dark:border-green-800/50 hover:shadow-md transition-shadow">
                      <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                        {formatCurrency(chartData.categoryDistribution.reduce((sum, cat) => sum + cat.amount, 0))}
                      </div>
                      <div className="text-sm text-muted-foreground font-medium">总金额</div>
                    </div>
                    <div className="text-center p-4 rounded-lg bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950/20 dark:to-purple-900/20 border border-purple-200/50 dark:border-purple-800/50 hover:shadow-md transition-shadow">
                      <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                        {chartData.categoryDistribution.reduce((sum, cat) => sum + cat.count, 0)}
                      </div>
                      <div className="text-sm text-muted-foreground font-medium">总交易数</div>
                    </div>
                    <div className="text-center p-4 rounded-lg bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950/20 dark:to-orange-900/20 border border-orange-200/50 dark:border-orange-800/50 hover:shadow-md transition-shadow">
                      <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                        {formatCurrency(chartData.categoryDistribution.reduce((sum, cat) => sum + cat.amount, 0) / chartData.categoryDistribution.reduce((sum, cat) => sum + cat.count, 0))}
                      </div>
                      <div className="text-sm text-muted-foreground font-medium">平均金额</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 项目统计 */}
      {chartData.projectStats?.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>项目统计</CardTitle>
            <CardDescription>按项目统计的交易情况</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {chartData.projectStats.slice(0, 10).map((project, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <div className="font-medium">{project.project}</div>
                    <div className="text-sm text-muted-foreground">
                      {project.transactionCount} 笔交易，平均 {formatCurrency(project.avgAmount)}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">{formatCurrency(project.totalAmount)}</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 状态分布 */}
      {chartData.statusDistribution?.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>状态分布</CardTitle>
            <CardDescription>按交易状态统计的数量和金额</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {chartData.statusDistribution.map((status, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <div className="font-medium">{status.status}</div>
                    <div className="text-sm text-muted-foreground">
                      {status.count} 笔交易
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">{formatCurrency(status.amount)}</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
} 