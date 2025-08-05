"use client"

import React, { useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Transaction, BankAccount } from "@/lib/data"
import { formatCurrency } from "@/lib/utils"

interface BankTransactionsChartsProps {
  transactions: Transaction[]
  bankAccount: BankAccount | null
  className?: string
}

interface ChartData {
  monthlyTrend: {
    month: string
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
    if (!transactions.length) {
      return {
        monthlyTrend: [],
        categoryDistribution: [],
        projectStats: [],
        statusDistribution: []
      }
    }

    // 月度趋势数据
    const monthlyData = new Map<string, { income: number; expense: number; net: number }>()
    
    transactions.forEach(transaction => {
      const date = new Date(transaction.date)
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      const monthLabel = `${date.getFullYear()}年${date.getMonth() + 1}月`
      
      if (!monthlyData.has(monthKey)) {
        monthlyData.set(monthKey, { income: 0, expense: 0, net: 0 })
      }
      
      const data = monthlyData.get(monthKey)!
      if (transaction.type === 'income') {
        data.income += transaction.amount
        data.net += transaction.amount
      } else {
        data.expense += transaction.amount
        data.net -= transaction.amount
      }
    })

    const monthlyTrend = Array.from(monthlyData.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, data]) => {
        const [year, month] = key.split('-')
        return {
          month: `${year}年${month}月`,
          income: data.income,
          expense: data.expense,
          net: data.net
        }
      })

    // 分类分布数据
    const categoryData = new Map<string, { amount: number; count: number }>()
    
    transactions.forEach(transaction => {
      const category = transaction.category || '未分类'
      if (!categoryData.has(category)) {
        categoryData.set(category, { amount: 0, count: 0 })
      }
      
      const data = categoryData.get(category)!
      data.amount += transaction.amount
      data.count += 1
    })

    const categoryDistribution = Array.from(categoryData.entries())
      .map(([category, data]) => ({
        category,
        amount: data.amount,
        count: data.count
      }))
      .sort((a, b) => b.amount - a.amount)

    // 项目统计数据
    const projectData = new Map<string, { totalAmount: number; transactionCount: number }>()
    
    transactions.forEach(transaction => {
      const project = transaction.project || '未分配项目'
      if (!projectData.has(project)) {
        projectData.set(project, { totalAmount: 0, transactionCount: 0 })
      }
      
      const data = projectData.get(project)!
      data.totalAmount += transaction.amount
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

    // 状态分布数据
    const statusData = new Map<string, { count: number; amount: number }>()
    
    transactions.forEach(transaction => {
      const status = transaction.status || '未确认'
      if (!statusData.has(status)) {
        statusData.set(status, { count: 0, amount: 0 })
      }
      
      const data = statusData.get(status)!
      data.count += 1
      data.amount += transaction.amount
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

  const totalIncome = useMemo(() => 
    transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0), [transactions])

  const totalExpense = useMemo(() => 
    transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0), [transactions])

  const netAmount = totalIncome - totalExpense

  if (!transactions.length) {
    return (
      <div className={`space-y-6 ${className}`}>
        <Card>
          <CardHeader>
            <CardTitle>数据可视化</CardTitle>
            <CardDescription>
              {bankAccount ? `${bankAccount.name} - 暂无交易数据` : '暂无交易数据'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-muted-foreground">
              暂无数据可显示
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* 总体统计 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">总收入</CardTitle>
            <Badge variant="secondary" className="text-green-600">收入</Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(totalIncome)}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">总支出</CardTitle>
            <Badge variant="secondary" className="text-red-600">支出</Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {formatCurrency(totalExpense)}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">净额</CardTitle>
            <Badge variant={netAmount >= 0 ? "secondary" : "destructive"}>
              {netAmount >= 0 ? "盈余" : "亏损"}
            </Badge>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${netAmount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(Math.abs(netAmount))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 月度趋势 */}
      {chartData.monthlyTrend.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>月度趋势</CardTitle>
            <CardDescription>收入和支出趋势分析</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {chartData.monthlyTrend.map((month, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <div className="font-medium">{month.month}</div>
                    <div className="text-sm text-muted-foreground">
                      净额: {formatCurrency(month.net)}
                    </div>
                  </div>
                  <div className="flex space-x-4 text-sm">
                    <div className="text-green-600">
                      收入: {formatCurrency(month.income)}
                    </div>
                    <div className="text-red-600">
                      支出: {formatCurrency(month.expense)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 分类分布 */}
      {chartData.categoryDistribution.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>分类分布</CardTitle>
            <CardDescription>按分类统计的交易金额</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {chartData.categoryDistribution.slice(0, 10).map((category, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <div className="font-medium">{category.category}</div>
                    <div className="text-sm text-muted-foreground">
                      {category.count} 笔交易
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">{formatCurrency(category.amount)}</div>
                    <div className="text-sm text-muted-foreground">
                      {((category.amount / (totalIncome + totalExpense)) * 100).toFixed(1)}%
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 项目统计 */}
      {chartData.projectStats.length > 0 && (
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
      {chartData.statusDistribution.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>状态分布</CardTitle>
            <CardDescription>交易状态统计</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {chartData.statusDistribution.map((status, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <div className="font-medium">{status.status}</div>
                    <div className="text-sm text-muted-foreground">
                      总金额: {formatCurrency(status.amount)}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">{status.count} 笔</div>
                    <div className="text-sm text-muted-foreground">
                      {((status.count / transactions.length) * 100).toFixed(1)}%
                    </div>
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