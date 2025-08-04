"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Plus, Upload, Download, Search, Filter, Edit, Trash2, Loader2, FolderOpen, DollarSign, Calendar, Target } from "lucide-react"
import { useAuth } from "@/components/auth/auth-context"
import { useToast } from "@/hooks/use-toast"
import { VirtualTable } from "@/components/ui/virtual-table"
import { Pagination } from "@/lib/pagination-utils"
import { usePaginatedProjects } from "@/hooks/use-paginated-data"
import type { Project } from "@/lib/data"

// 虚拟滚动项目账户页面
export function ProjectAccountsVirtual() {
  const { currentUser, hasPermission } = useAuth()
  const { toast } = useToast()
  
  // 使用分页数据Hook
  const {
    data: projects,
    loading,
    error,
    pagination,
    refresh,
    loadData
  } = usePaginatedProjects({
    initialPageSize: 100,
    autoLoad: true,
    sortBy: 'name',
    sortOrder: 'asc'
  })

  // 筛选状态
  const [filters, setFilters] = React.useState({
    search: "",
    status: "",
    year: "",
    category: ""
  })

  // 表格列定义
  const columns = React.useMemo(() => [
    { 
      key: "projectid", 
      header: "项目ID", 
      width: 120,
      render: (project: Project) => project.projectid
    },
    { 
      key: "name", 
      header: "项目名称", 
      width: 200,
      render: (project: Project) => project.name
    },
    { 
      key: "status", 
      header: "状态", 
      width: 100,
      render: (project: Project) => (
        <Badge variant={
          project.status === "Active" ? "default" :
          project.status === "Completed" ? "secondary" :
          project.status === "On Hold" ? "outline" : "destructive"
        }>
          {project.status}
        </Badge>
      )
    },
    { 
      key: "year", 
      header: "年度", 
      width: 80,
      render: (project: Project) => project.year || "-"
    },
    { 
      key: "category", 
      header: "分类", 
      width: 120,
      render: (project: Project) => project.category || "-"
    },
    { 
      key: "budget", 
      header: "预算", 
      width: 120,
      render: (project: Project) => 
        project.budget ? `$${project.budget.toFixed(2)}` : "-"
    },
    { 
      key: "spent", 
      header: "已花费", 
      width: 120,
      render: (project: Project) => 
        project.spent ? `$${project.spent.toFixed(2)}` : "-"
    },
    { 
      key: "remaining", 
      header: "剩余", 
      width: 120,
      render: (project: Project) => {
        const budget = project.budget || 0
        const spent = project.spent || 0
        const remaining = budget - spent
        const isOverBudget = remaining < 0
        
        return (
          <span className={isOverBudget ? "text-red-600" : "text-green-600"}>
            ${Math.abs(remaining).toFixed(2)}
            {isOverBudget && " (超支)"}
          </span>
        )
      }
    },
    { 
      key: "startDate", 
      header: "开始日期", 
      width: 120,
      render: (project: Project) => {
        if (!project.startDate) return "-"
        const date = typeof project.startDate === 'string' 
          ? new Date(project.startDate) 
          : new Date(project.startDate.seconds * 1000)
        return date.toLocaleDateString()
      }
    },
    { 
      key: "endDate", 
      header: "结束日期", 
      width: 120,
      render: (project: Project) => {
        if (!project.endDate) return "-"
        const date = typeof project.endDate === 'string' 
          ? new Date(project.endDate) 
          : new Date(project.endDate.seconds * 1000)
        return date.toLocaleDateString()
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
      status: "",
      year: "",
      category: ""
    })
    pagination.clearFilters()
  }, [pagination])

  // 处理筛选变化
  const handleFilterChange = React.useCallback((key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }, [])

  // 处理行点击
  const handleRowClick = React.useCallback((project: Project, index: number) => {
    console.log('点击了项目:', project)
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
    const totalProjects = projects.length
    const totalBudget = projects.reduce((sum, proj) => sum + (proj.budget || 0), 0)
    const totalSpent = projects.reduce((sum, proj) => sum + (proj.spent || 0), 0)
    const activeProjects = projects.filter(proj => proj.status === 'Active').length
    const completedProjects = projects.filter(proj => proj.status === 'Completed').length

    return {
      totalProjects,
      totalBudget,
      totalSpent,
      totalRemaining: totalBudget - totalSpent,
      activeProjects,
      completedProjects
    }
  }, [projects])

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">项目账户</h1>
          <p className="text-muted-foreground">
            管理项目账户，支持虚拟滚动和分页
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
              新增项目
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
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <Label>搜索</Label>
              <Input
                placeholder="搜索项目名称或ID..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
              />
            </div>
            <div>
              <Label>状态</Label>
              <Input
                placeholder="项目状态"
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
              />
            </div>
            <div>
              <Label>年度</Label>
              <Input
                placeholder="项目年度"
                value={filters.year}
                onChange={(e) => handleFilterChange('year', e.target.value)}
              />
            </div>
            <div>
              <Label>分类</Label>
              <Input
                placeholder="项目分类"
                value={filters.category}
                onChange={(e) => handleFilterChange('category', e.target.value)}
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
            <CardTitle className="text-sm font-medium">总项目数</CardTitle>
            <FolderOpen className="h-4 w-4 text-muted-foreground" />
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
            <CardTitle className="text-sm font-medium">总预算</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              ${stats.totalBudget.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              当前页数据
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">已花费</CardTitle>
            <Target className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              ${stats.totalSpent.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              当前页数据
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">剩余预算</CardTitle>
            <Calendar className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${stats.totalRemaining >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
              ${Math.abs(stats.totalRemaining).toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats.totalRemaining >= 0 ? '剩余' : '超支'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 虚拟滚动表格 */}
      <Card>
        <CardHeader>
          <CardTitle>项目列表</CardTitle>
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
                data={projects}
                columns={columns}
                height={600}
                itemHeight={50}
                onRowClick={handleRowClick}
                getRowId={(project) => project.id || ''}
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