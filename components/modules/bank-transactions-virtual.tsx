"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar, Plus, Upload, Download, Search, Filter, Edit, Trash2, Save, X, Loader2 } from "lucide-react"
import { useAuth } from "@/components/auth/auth-context"
import { useToast } from "@/hooks/use-toast"
import { VirtualTable } from "@/components/ui/virtual-table"
import { Pagination } from "@/lib/pagination-utils"
import { usePaginatedTransactions } from "@/hooks/use-paginated-data"
import type { Transaction } from "@/lib/data"

// 虚拟滚动银行交易页面
export function BankTransactionsVirtual() {
  const { currentUser, hasPermission } = useAuth()
  const { toast } = useToast()
  
  // 使用分页数据Hook
  const {
    data: transactions,
    loading,
    error,
    pagination,
    refresh,
    loadData
  } = usePaginatedTransactions({
    initialPageSize: 100,
    autoLoad: true,
    sortBy: 'date',
    sortOrder: 'desc'
  })

  // 筛选状态
  const [filters, setFilters] = React.useState({
    search: "",
    projectid: "",
    category: "",
    status: "",
    dateFrom: "",
    dateTo: ""
  })

  // 表格列定义
  const columns = React.useMemo(() => [
    { 
      key: "date", 
      header: "日期", 
      width: 120,
      render: (transaction: Transaction) => {
        const formatDate = (date: string | { seconds: number; nanoseconds: number }): string => {
          if (typeof date === 'string') {
            return new Date(date).toLocaleDateString()
          } else if (date?.seconds) {
            return new Date(date.seconds * 1000).toLocaleDateString()
          }
          return 'N/A'
        }
        return formatDate(transaction.date)
      }
    },
    { 
      key: "description", 
      header: "描述", 
      width: 200,
      render: (transaction: Transaction) => transaction.description
    },
    { 
      key: "description2", 
      header: "描述2", 
      width: 150,
      render: (transaction: Transaction) => transaction.description2 || "-"
    },
    { 
      key: "expense", 
      header: "支出", 
      width: 120,
      render: (transaction: Transaction) => 
        transaction.expense ? `$${transaction.expense.toFixed(2)}` : "-"
    },
    { 
      key: "income", 
      header: "收入", 
      width: 120,
      render: (transaction: Transaction) => 
        transaction.income ? `$${transaction.income.toFixed(2)}` : "-"
    },
    { 
      key: "netAmount", 
      header: "净额", 
      width: 120,
      render: (transaction: Transaction) => {
        const calculateNetAmount = (transaction: Transaction): number => {
          const expense = transaction.expense || 0
          const income = transaction.income || 0
          return income - expense
        }
        const formatNetAmount = (transaction: Transaction): string => {
          const netAmount = calculateNetAmount(transaction)
          return netAmount >= 0 ? `+$${netAmount.toFixed(2)}` : `-$${Math.abs(netAmount).toFixed(2)}`
        }
        return formatNetAmount(transaction)
      }
    },
    { 
      key: "status", 
      header: "状态", 
      width: 100,
      render: (transaction: Transaction) => (
        <Badge variant={
          transaction.status === "Completed" ? "default" :
          transaction.status === "Pending" ? "secondary" : "outline"
        }>
          {transaction.status}
        </Badge>
      )
    },
    { 
      key: "projectid", 
      header: "项目", 
      width: 120,
      render: (transaction: Transaction) => transaction.projectid || "-"
    },
    { 
      key: "category", 
      header: "分类", 
      width: 120,
      render: (transaction: Transaction) => transaction.category || "-"
    }
  ], [])

  // 应用筛选
  const applyFilters = React.useCallback(() => {
    const filterParams = Object.fromEntries(
      Object.entries(filters).filter(([_, value]) => value !== "")
    )
    pagination.updateFilters(filterParams)
  }, [filters, pagination])

  // 清除筛选
  const clearFilters = React.useCallback(() => {
    setFilters({
      search: "",
      projectid: "",
      category: "",
      status: "",
      dateFrom: "",
      dateTo: ""
    })
    pagination.clearFilters()
  }, [pagination])

  // 处理筛选变化
  const handleFilterChange = React.useCallback((key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }, [])

  // 处理行点击
  const handleRowClick = React.useCallback((transaction: Transaction, index: number) => {
    // 可以在这里添加行点击处理逻辑
    console.log('点击了交易:', transaction)
  }, [])

  // 处理页面变化
  const handlePageChange = React.useCallback((page: number) => {
    pagination.goToPage(page)
  }, [pagination])

  // 处理页面大小变化
  const handlePageSizeChange = React.useCallback((pageSize: number) => {
    pagination.changePageSize(pageSize)
  }, [pagination])

  // 处理排序变化
  const handleSortChange = React.useCallback((sortBy: string, sortOrder: 'asc' | 'desc') => {
    pagination.updatePagination({ page: 1 })
    // 这里可以添加排序逻辑
  }, [pagination])

  // 刷新数据
  const handleRefresh = React.useCallback(async () => {
    await refresh()
    toast({
      title: "刷新成功",
      description: "数据已更新",
    })
  }, [refresh, toast])

  // 错误处理
  React.useEffect(() => {
    if (error) {
      toast({
        title: "加载失败",
        description: error,
        variant: "destructive",
      })
    }
  }, [error, toast])

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">银行交易记录</h1>
          <p className="text-muted-foreground">
            管理银行交易记录，支持虚拟滚动和分页
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleRefresh} disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            刷新
          </Button>
          {hasPermission('write') && (
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              新增交易
            </Button>
          )}
        </div>
      </div>

      {/* 筛选器 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            筛选条件
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div>
              <Label>搜索</Label>
              <Input
                placeholder="搜索描述..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
              />
            </div>
            <div>
              <Label>项目ID</Label>
              <Input
                placeholder="项目ID"
                value={filters.projectid}
                onChange={(e) => handleFilterChange('projectid', e.target.value)}
              />
            </div>
            <div>
              <Label>分类</Label>
              <Input
                placeholder="分类"
                value={filters.category}
                onChange={(e) => handleFilterChange('category', e.target.value)}
              />
            </div>
            <div>
              <Label>状态</Label>
              <Input
                placeholder="状态"
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
              />
            </div>
            <div>
              <Label>开始日期</Label>
              <Input
                type="date"
                value={filters.dateFrom}
                onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
              />
            </div>
            <div>
              <Label>结束日期</Label>
              <Input
                type="date"
                value={filters.dateTo}
                onChange={(e) => handleFilterChange('dateTo', e.target.value)}
              />
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <Button onClick={applyFilters} disabled={loading}>
              应用筛选
            </Button>
            <Button variant="outline" onClick={clearFilters}>
              清除筛选
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 统计信息 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">总交易数</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pagination.pagination.total}</div>
            <p className="text-xs text-muted-foreground">
              当前页: {pagination.pagination.page}/{pagination.pagination.totalPages}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">总收入</CardTitle>
            <Download className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              ${transactions.reduce((sum, t) => sum + (t.income || 0), 0).toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              当前页数据
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">总支出</CardTitle>
            <Upload className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              ${transactions.reduce((sum, t) => sum + (t.expense || 0), 0).toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              当前页数据
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">净额</CardTitle>
            <Search className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              ${transactions.reduce((sum, t) => sum + ((t.income || 0) - (t.expense || 0)), 0).toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              当前页数据
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 虚拟滚动表格 */}
      <Card>
        <CardHeader>
          <CardTitle>交易记录</CardTitle>
          {loading && (
            <div className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm text-muted-foreground">加载中...</span>
            </div>
          )}
        </CardHeader>
        <CardContent>
          {error ? (
            <div className="text-center py-8">
              <p className="text-red-600">加载失败: {error}</p>
              <Button onClick={refresh} className="mt-2">
                重试
              </Button>
            </div>
          ) : (
            <>
              <VirtualTable
                data={transactions}
                columns={columns}
                height={600}
                itemHeight={50}
                onRowClick={handleRowClick}
                getRowId={(transaction) => transaction.id || ''}
              />
              
              {/* 分页控件 */}
              <div className="mt-4">
                <Pagination
                  pagination={pagination.pagination}
                  onPageChange={handlePageChange}
                  onPageSizeChange={handlePageSizeChange}
                  pageSizeOptions={[20, 50, 100, 200]}
                  showPageSizeSelector={true}
                  showTotal={true}
                />
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
} 