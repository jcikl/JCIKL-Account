"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Plus, Upload, Download, Search, Filter, Edit, Trash2, Loader2, BookOpen, DollarSign, TrendingUp, TrendingDown } from "lucide-react"
import { useAuth } from "@/components/auth/auth-context"
import { useToast } from "@/hooks/use-toast"
import { VirtualTable } from "@/components/ui/virtual-table"
import { Pagination } from "@/lib/pagination-utils"
import { usePaginatedAccounts } from "@/hooks/use-paginated-data"
import type { Account } from "@/lib/data"

// 虚拟滚动账户图表页面
export function AccountChartVirtual() {
  const { currentUser, hasPermission } = useAuth()
  const { toast } = useToast()
  
  // 使用分页数据Hook
  const {
    data: accounts,
    loading,
    error,
    pagination,
    refresh,
    loadData
  } = usePaginatedAccounts({
    initialPageSize: 100,
    autoLoad: true,
    sortBy: 'code',
    sortOrder: 'asc'
  })

  // 筛选状态
  const [filters, setFilters] = React.useState({
    search: "",
    type: "",
    financialStatement: ""
  })

  // 表格列定义
  const columns = React.useMemo(() => [
    { 
      key: "code", 
      header: "账户代码", 
      width: 120,
      render: (account: Account) => account.code
    },
    { 
      key: "name", 
      header: "账户名称", 
      width: 200,
      render: (account: Account) => account.name
    },
    { 
      key: "type", 
      header: "账户类型", 
      width: 120,
      render: (account: Account) => (
        <Badge variant={
          account.type === "Asset" ? "default" :
          account.type === "Liability" ? "secondary" :
          account.type === "Equity" ? "outline" :
          account.type === "Revenue" ? "destructive" : "default"
        }>
          {account.type}
        </Badge>
      )
    },
    { 
      key: "financialStatement", 
      header: "财务报表", 
      width: 150,
      render: (account: Account) => account.financialStatement || "-"
    },
    { 
      key: "description", 
      header: "描述", 
      width: 200,
      render: (account: Account) => account.description || "-"
    },
    { 
      key: "balance", 
      header: "余额", 
      width: 120,
      render: (account: Account) => {
        const balance = account.balance || 0
        const isPositive = balance >= 0
        return (
          <span className={isPositive ? "text-green-600" : "text-red-600"}>
            ${Math.abs(balance).toFixed(2)}
          </span>
        )
      }
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
      type: "",
      financialStatement: ""
    })
    pagination.clearFilters()
  }, [pagination])

  // 处理筛选变化
  const handleFilterChange = React.useCallback((key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }, [])

  // 处理行点击
  const handleRowClick = React.useCallback((account: Account, index: number) => {
    console.log('点击了账户:', account)
  }, [])

  // 处理页面变化
  const handlePageChange = React.useCallback((page: number) => {
    pagination.goToPage(page)
  }, [pagination])

  // 处理页面大小变化
  const handlePageSizeChange = React.useCallback((pageSize: number) => {
    pagination.changePageSize(pageSize)
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

  // 计算统计数据
  const stats = React.useMemo(() => {
    const totalAccounts = accounts.length
    const totalBalance = accounts.reduce((sum, acc) => sum + (acc.balance || 0), 0)
    const assetAccounts = accounts.filter(acc => acc.type === 'Asset').length
    const liabilityAccounts = accounts.filter(acc => acc.type === 'Liability').length

    return {
      totalAccounts,
      totalBalance,
      assetAccounts,
      liabilityAccounts
    }
  }, [accounts])

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">账户图表</h1>
          <p className="text-muted-foreground">
            管理会计账户，支持虚拟滚动和分页
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
              新增账户
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label>搜索</Label>
              <Input
                placeholder="搜索账户代码或名称..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
              />
            </div>
            <div>
              <Label>账户类型</Label>
              <Input
                placeholder="账户类型"
                value={filters.type}
                onChange={(e) => handleFilterChange('type', e.target.value)}
              />
            </div>
            <div>
              <Label>财务报表</Label>
              <Input
                placeholder="财务报表"
                value={filters.financialStatement}
                onChange={(e) => handleFilterChange('financialStatement', e.target.value)}
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
            <CardTitle className="text-sm font-medium">总账户数</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
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
            <CardTitle className="text-sm font-medium">总余额</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              ${stats.totalBalance.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              当前页数据
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">资产账户</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {stats.assetAccounts}
            </div>
            <p className="text-xs text-muted-foreground">
              当前页数据
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">负债账户</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {stats.liabilityAccounts}
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
          <CardTitle>账户列表</CardTitle>
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
                data={accounts}
                columns={columns}
                height={600}
                itemHeight={50}
                onRowClick={handleRowClick}
                getRowId={(account) => account.id || ''}
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