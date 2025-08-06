import React from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel"
import { 
  DollarSign, 
  CreditCard, 
  TrendingUp, 
  Building2, 
  Users, 
  Calendar,
  RefreshCw,
  BarChart3,
  PieChart,
  X
} from "lucide-react"
import { useAuth } from "@/components/auth/auth-context"
import { 
  clearCache 
} from "@/lib/firebase-utils"
import { 
  useOptimizedTransactions, 
  useOptimizedProjects, 
  useOptimizedProjectSpentAmounts 
} from "@/hooks/use-optimized-data"
import type { Transaction, Project } from "@/lib/data"

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
  trend: "up" | "down"
  icon: React.ComponentType<{ className?: string }>
}) => (
  <Card>
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium">{title}</CardTitle>
      <Icon className="h-4 w-4 text-muted-foreground" />
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold">{value}</div>
      <p className={`text-xs ${trend === "up" ? "text-green-600" : "text-red-600"}`}>
        {change}
      </p>
    </CardContent>
  </Card>
))

// 优化的项目卡片组件
const ProjectCard = React.memo(({ 
  project, 
  spentAmount, 
  budget 
}: { 
  project: Project
  spentAmount: number
  budget: number
}) => {
  const remaining = budget - spentAmount
  const progress = budget > 0 ? (spentAmount / budget) * 100 : 0
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{project.name}</CardTitle>
        <Badge variant={
          project.status === "Active" ? "default" :
          project.status === "Completed" ? "secondary" : "outline"
        }>
          {project.status}
        </Badge>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>预算:</span>
            <span>${budget.toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>已花费:</span>
            <span>${spentAmount.toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-sm font-medium">
            <span>剩余:</span>
            <span className={remaining >= 0 ? "text-green-600" : "text-red-600"}>
              ${remaining.toLocaleString()}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className={`h-2 rounded-full ${progress > 100 ? 'bg-red-500' : 'bg-blue-500'}`}
              style={{ width: `${Math.min(progress, 100)}%` }}
            ></div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
})

// 交易项目组件
const TransactionItem = React.memo(({ transaction }: { transaction: Transaction }) => (
  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
    <div className="flex-1">
      <p className="font-medium text-sm">{transaction.description}</p>
      <p className="text-xs text-gray-500">
        {new Date(typeof transaction.date === 'string' ? transaction.date : transaction.date.seconds * 1000).toLocaleDateString()}
      </p>
    </div>
    <div className="text-right">
      {transaction.income > 0 && (
        <p className="text-sm font-semibold text-green-600">+${transaction.income.toFixed(2)}</p>
      )}
      {transaction.expense > 0 && (
        <p className="text-sm font-semibold text-red-600">-${transaction.expense.toFixed(2)}</p>
      )}
    </div>
  </div>
))

// 项目统计卡片组件
const ProjectStatsCard = React.memo(({ 
  project, 
  isDeficit 
}: { 
  project: any
  isDeficit: boolean
}) => (
  <Card className={`shadow-sm border-0 hover:shadow-md transition-all duration-200 hover:scale-[1.02] h-full ${
    isDeficit 
      ? 'bg-gradient-to-br from-red-50 to-red-100/50 dark:from-red-950/20 dark:to-red-900/20 border-red-200 dark:border-red-800' 
      : 'bg-gradient-to-br from-white to-gray-50/50'
  }`}>
    <CardHeader className="pb-2">
      <div className="flex items-center justify-between">
        <CardTitle className={`text-sm font-medium truncate ${
          isDeficit 
            ? 'text-red-900 dark:text-red-100' 
            : 'text-gray-900 dark:text-gray-100'
        }`}>
          {project.name}
          {isDeficit && (
            <span className="ml-2 text-xs bg-red-200 text-red-800 dark:bg-red-800 dark:text-red-200 px-1.5 py-0.5 rounded">
              赤字
            </span>
          )}
        </CardTitle>
        <Badge variant={project.status === 'Active' ? 'default' : 'secondary'} className="text-xs">
          {project.status === 'Active' ? '进行中' : project.status === 'Completed' ? '已完成' : '暂停'}
        </Badge>
      </div>
    </CardHeader>
    <CardContent className="pt-0 space-y-1.5">
      <div className="flex justify-between items-center">
        <span className="text-xs text-gray-500 dark:text-gray-400">总收入</span>
        <span className="text-sm font-semibold text-green-600 dark:text-green-400">
          ¥{project.totalIncome.toFixed(2)}
        </span>
      </div>
      <div className="flex justify-between items-center">
        <span className="text-xs text-gray-500 dark:text-gray-400">总支出</span>
        <span className="text-sm font-semibold text-red-600 dark:text-red-400">
          ¥{project.totalExpense.toFixed(2)}
        </span>
      </div>
      <div className="flex justify-between items-center">
        <span className="text-xs text-gray-500 dark:text-gray-400">净额</span>
        <span className={`text-sm font-semibold ${project.netAmount >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
          {project.netAmount >= 0 ? '+' : ''}¥{Math.abs(project.netAmount).toFixed(2)}
        </span>
      </div>
      <div className="flex justify-between items-center">
        <span className="text-xs text-gray-500 dark:text-gray-400">交易数</span>
        <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">
          {project.transactionCount} 笔
        </span>
      </div>
    </CardContent>
  </Card>
))

export function DashboardOverviewOptimized() {
  const { currentUser, hasPermission } = useAuth()
  const [refreshing, setRefreshing] = React.useState(false)

  // 项目统计筛选状态 - 年份默认为当前年份
  const [projectStatsFilters, setProjectStatsFilters] = React.useState({
    year: new Date().getFullYear().toString(),
    bodCategory: "all",
    status: "all",
    project: "all" // 新增项目筛选
  })

  // 智能筛选更新函数
  const updateProjectStatsFilters = React.useCallback((updates: Partial<typeof projectStatsFilters>) => {
    setProjectStatsFilters(prev => {
      const newFilters = { ...prev, ...updates }
      
      // 智能重置逻辑
      // 如果年份改变，重置项目选择（因为项目可能不在新年份中）
      if (updates.year && updates.year !== prev.year) {
        newFilters.project = "all"
      }
      
      // 如果BOD分类改变，重置项目选择（因为项目可能不在新BOD分类中）
      if (updates.bodCategory && updates.bodCategory !== prev.bodCategory) {
        newFilters.project = "all"
      }
      
      // 如果状态改变，重置项目选择（因为项目可能不在新状态中）
      if (updates.status && updates.status !== prev.status) {
        newFilters.project = "all"
      }
      
      return newFilters
    })
  }, [])

  // 使用优化的数据hooks
  const { 
    data: transactions, 
    loading: transactionsLoading, 
    error: transactionsError,
    refetch: refetchTransactions 
  } = useOptimizedTransactions()

  const { 
    data: projects, 
    loading: projectsLoading, 
    error: projectsError,
    refetch: refetchProjects 
  } = useOptimizedProjects()

  const { 
    data: projectSpentAmounts, 
    loading: spentAmountsLoading, 
    error: spentAmountsError,
    refetch: refetchSpentAmounts 
  } = useOptimizedProjectSpentAmounts()

  // 计算加载状态
  const loading = transactionsLoading || projectsLoading || spentAmountsLoading
  const error = transactionsError || projectsError || spentAmountsError

  // 优化的项目统计计算逻辑 - 使用所有交易数据
  const calculateProjectStats = React.useCallback((projectsToCalculate: Project[], transactionsToUse: Transaction[]) => {
    return projectsToCalculate.map(project => {
      // 改进的匹配逻辑：优先匹配projectid，其次匹配projectName，最后匹配项目代码
      const projectTransactions = transactionsToUse.filter(t => {
        // 精确匹配projectid
        if (t.projectid === project.projectid) return true
        // 匹配项目名称
        if (t.projectName === project.name) return true
        // 匹配项目代码（从projectid中提取）
        const projectCode = project.projectid?.split('_').slice(2).join('_')
        if (projectCode && t.projectName?.includes(projectCode)) return true
        return false
      })
      
      const totalIncome = projectTransactions.reduce((sum, t) => sum + (t.income || 0), 0)
      const totalExpense = projectTransactions.reduce((sum, t) => sum + (t.expense || 0), 0)
      const netAmount = totalIncome - totalExpense
      const transactionCount = projectTransactions.length
      
      // 优化平均金额计算
      const avgIncome = transactionCount > 0 ? totalIncome / transactionCount : 0
      const avgExpense = transactionCount > 0 ? totalExpense / transactionCount : 0
      const avgTransactionAmount = transactionCount > 0 ? (totalIncome + totalExpense) / transactionCount : 0
      
      return {
        ...project,
        totalIncome,
        totalExpense,
        netAmount,
        transactionCount,
        avgIncome,
        avgExpense,
        avgTransactionAmount
      }
    }).sort((a, b) => b.netAmount - a.netAmount)
  }, [])

  // 缓存的项目统计数据
  const projectStats = React.useMemo(() => {
    if (!projects || !transactions) return []
    return calculateProjectStats(projects, transactions)
  }, [calculateProjectStats, projects, transactions])

  // 缓存筛选后的项目统计数据
  const filteredProjectStats = React.useMemo(() => {
    if (!projects || !transactions) return []
    
    let filteredProjects = projects
    
    // 按年份筛选
    if (projectStatsFilters.year !== "all") {
      filteredProjects = filteredProjects.filter(project => {
        const projectYear = project.projectid?.split('_')[0]
        return projectYear === projectStatsFilters.year
      })
    }
    
    // 按BOD分类筛选
    if (projectStatsFilters.bodCategory !== "all") {
      filteredProjects = filteredProjects.filter(project => 
        project.bodCategory === projectStatsFilters.bodCategory
      )
    }
    
    // 按状态筛选
    if (projectStatsFilters.status !== "all") {
      filteredProjects = filteredProjects.filter(project => 
        project.status === projectStatsFilters.status
      )
    }
    
    // 按项目筛选
    if (projectStatsFilters.project !== "all") {
      filteredProjects = filteredProjects.filter(project => 
        project.projectid === projectStatsFilters.project
      )
    }
    
    const stats = calculateProjectStats(filteredProjects, transactions)
    
    // 按BOD分组，然后按活动日期排序（如果活动日期为空则按项目名称排序）
    const groupedByBOD = stats.reduce((groups, project) => {
      const bodCategory = project.bodCategory || '未分类'
      if (!groups[bodCategory]) {
        groups[bodCategory] = []
      }
      groups[bodCategory].push(project)
      return groups
    }, {} as Record<string, typeof stats>)
    
    // 对每个BOD组内的项目进行排序
    Object.keys(groupedByBOD).forEach(bodCategory => {
      groupedByBOD[bodCategory].sort((a, b) => {
        // 优先按活动日期排序（如果存在）
        const aDate = a.eventDate ? new Date(typeof a.eventDate === 'string' ? a.eventDate : a.eventDate.seconds * 1000).getTime() : 0
        const bDate = b.eventDate ? new Date(typeof b.eventDate === 'string' ? b.eventDate : b.eventDate.seconds * 1000).getTime() : 0
        
        if (aDate && bDate) {
          return bDate - aDate // 降序排列，最新的在前
        } else if (aDate && !bDate) {
          return -1 // 有日期的排在前面
        } else if (!aDate && bDate) {
          return 1
        } else {
          // 如果都没有日期，按项目名称排序
          return a.name.localeCompare(b.name)
        }
      })
    })
    
    // 将分组后的项目展平为数组
    return Object.values(groupedByBOD).flat()
  }, [calculateProjectStats, projects, transactions, projectStatsFilters])

  // 获取可用项目年份 - 根据当前筛选条件动态更新
  const getAvailableProjectYears = React.useCallback(() => {
    if (!projects) return []
    
    // 根据当前筛选条件过滤项目
    let filteredProjects = projects
    
    // 按BOD分类筛选
    if (projectStatsFilters.bodCategory !== "all") {
      filteredProjects = filteredProjects.filter(project => 
        project.bodCategory === projectStatsFilters.bodCategory
      )
    }
    
    // 按状态筛选
    if (projectStatsFilters.status !== "all") {
      filteredProjects = filteredProjects.filter(project => 
        project.status === projectStatsFilters.status
      )
    }
    
    // 按项目筛选
    if (projectStatsFilters.project !== "all") {
      filteredProjects = filteredProjects.filter(project => 
        project.projectid === projectStatsFilters.project
      )
    }
    
    const years = new Set<string>()
    filteredProjects.forEach(project => {
      const year = project.projectid?.split('_')[0]
      if (year) years.add(year)
    })
    return Array.from(years).sort((a, b) => parseInt(b) - parseInt(a))
  }, [projects, projectStatsFilters.bodCategory, projectStatsFilters.status, projectStatsFilters.project])

  // 获取按BOD分组的项目选项 - 根据当前筛选条件动态更新
  const getProjectsGroupedByBOD = React.useCallback(() => {
    if (!projects) return []
    
    // 根据当前筛选条件过滤项目
    let filteredProjects = projects
    
    // 按年份筛选
    if (projectStatsFilters.year !== "all") {
      filteredProjects = filteredProjects.filter(project => {
        const projectYear = project.projectid?.split('_')[0]
        return projectYear === projectStatsFilters.year
      })
    }
    
    // 按状态筛选
    if (projectStatsFilters.status !== "all") {
      filteredProjects = filteredProjects.filter(project => 
        project.status === projectStatsFilters.status
      )
    }
    
    // 按BOD分类分组项目
    const groupedProjects = filteredProjects.reduce((acc, project) => {
      const bodCategory = project.bodCategory
      if (!acc[bodCategory]) {
        acc[bodCategory] = []
      }
      acc[bodCategory].push(project)
      return acc
    }, {} as Record<string, Project[]>)
    
    // 转换为选项数组
    const options: Array<{ group: string; projects: Project[] }> = []
    
    // BOD分类顺序
    const bodOrder = ['P', 'VPI', 'VPE', 'VPM', 'VPPR', 'SAA', 'T', 'S']
    
    bodOrder.forEach(bod => {
      if (groupedProjects[bod]) {
        options.push({
          group: bod,
          projects: groupedProjects[bod].sort((a, b) => a.name.localeCompare(b.name))
        })
      }
    })
    
    return options
  }, [projects, projectStatsFilters.year, projectStatsFilters.status])

  // 获取可用的BOD分类选项 - 根据当前筛选条件动态更新
  const getAvailableBODCategories = React.useCallback(() => {
    if (!projects) return []
    
    // 根据当前筛选条件过滤项目
    let filteredProjects = projects
    
    // 按年份筛选
    if (projectStatsFilters.year !== "all") {
      filteredProjects = filteredProjects.filter(project => {
        const projectYear = project.projectid?.split('_')[0]
        return projectYear === projectStatsFilters.year
      })
    }
    
    // 按状态筛选
    if (projectStatsFilters.status !== "all") {
      filteredProjects = filteredProjects.filter(project => 
        project.status === projectStatsFilters.status
      )
    }
    
    // 按项目筛选
    if (projectStatsFilters.project !== "all") {
      filteredProjects = filteredProjects.filter(project => 
        project.projectid === projectStatsFilters.project
      )
    }
    
    const categories = new Set<string>()
    filteredProjects.forEach(project => {
      if (project.bodCategory) {
        categories.add(project.bodCategory)
      }
    })
    return Array.from(categories).sort()
  }, [projects, projectStatsFilters.year, projectStatsFilters.status, projectStatsFilters.project])

  // 获取可用的项目状态选项 - 根据当前筛选条件动态更新
  const getAvailableProjectStatuses = React.useCallback(() => {
    if (!projects) return []
    
    // 根据当前筛选条件过滤项目
    let filteredProjects = projects
    
    // 按年份筛选
    if (projectStatsFilters.year !== "all") {
      filteredProjects = filteredProjects.filter(project => {
        const projectYear = project.projectid?.split('_')[0]
        return projectYear === projectStatsFilters.year
      })
    }
    
    // 按BOD分类筛选
    if (projectStatsFilters.bodCategory !== "all") {
      filteredProjects = filteredProjects.filter(project => 
        project.bodCategory === projectStatsFilters.bodCategory
      )
    }
    
    // 按项目筛选
    if (projectStatsFilters.project !== "all") {
      filteredProjects = filteredProjects.filter(project => 
        project.projectid === projectStatsFilters.project
      )
    }
    
    const statuses = new Set<string>()
    filteredProjects.forEach(project => {
      if (project.status) {
        statuses.add(project.status)
      }
    })
    return Array.from(statuses).sort()
  }, [projects, projectStatsFilters.year, projectStatsFilters.bodCategory, projectStatsFilters.project])

  // 优化的统计数据计算
  const dashboardStats = React.useMemo(() => {
    if (!transactions || !projects) return []

    const totalRevenue = transactions
      .filter((t) => t.income > 0)
      .reduce((sum, t) => sum + t.income, 0)

    const totalExpenses = transactions
      .filter((t) => t.expense > 0)
      .reduce((sum, t) => sum + t.expense, 0)

    const netProfit = totalRevenue - totalExpenses
    const activeProjectsCount = projects.filter((p) => p.status === "Active").length

    return [
      {
        title: "总收入",
        value: `$${totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        change: "+12.5%",
        trend: "up" as const,
        icon: DollarSign,
      },
      {
        title: "总支出",
        value: `$${Math.abs(totalExpenses).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        change: "-3.2%",
        trend: "down" as const,
        icon: CreditCard,
      },
      {
        title: "净利润",
        value: `$${netProfit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        change: "+8.7%",
        trend: netProfit >= 0 ? "up" as const : "down" as const,
        icon: TrendingUp,
      },
      {
        title: "活跃项目",
        value: activeProjectsCount.toString(),
        change: "+2",
        trend: "up" as const,
        icon: Building2,
      },
    ]
  }, [transactions, projects])



  // 优化的刷新数据函数
  const handleRefresh = React.useCallback(async () => {
    setRefreshing(true)
    try {
      await clearCache()
      await Promise.all([
        refetchTransactions(),
        refetchProjects(),
        refetchSpentAmounts()
      ])
    } catch (err) {
      console.error("Error refreshing data:", err)
    } finally {
      setRefreshing(false)
    }
  }, [refetchTransactions, refetchProjects, refetchSpentAmounts])

  if (loading) {
    return (
      <div className="p-6 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
        <p className="mt-2">加载仪表板数据...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6 text-center text-red-600">
        <p>错误: {error}</p>
        <Button onClick={handleRefresh} className="mt-2">重试</Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* 标题和刷新按钮 */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">仪表板概览</h1>
        <Button 
          onClick={handleRefresh} 
          disabled={refreshing}
          variant="outline"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          {refreshing ? "刷新中..." : "刷新数据"}
        </Button>
      </div>

      {/* 统计卡片 */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {dashboardStats.map((stat, index) => (
          <StatCard key={index} {...stat} />
        ))}
      </div>

      {/* 项目统计分析 */}
      {projects && projects.length > 0 && (
        <Card className="shadow-sm border-0 bg-gradient-to-r from-white to-gray-50/50">
          <CardHeader className="pb-3 bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-950/20 dark:to-indigo-950/20">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 text-lg font-semibold text-purple-900 dark:text-purple-100">
                  <BarChart3 className="h-5 w-5 text-purple-600" />
                  项目统计分析
                </CardTitle>
                <CardDescription className="text-purple-700 dark:text-purple-300">
                  按项目统计的交易情况和财务表现
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-700">
                  <PieChart className="h-3 w-3 mr-1" />
                  {filteredProjectStats.length} / {projects.length} 个项目
                </Badge>
                {(projectStatsFilters.year !== "all" || 
                  projectStatsFilters.bodCategory !== "all" || 
                  projectStatsFilters.status !== "all" || 
                  projectStatsFilters.project !== "all") && (
                  <Badge variant="secondary" className="bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-700">
                    筛选中
                  </Badge>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            {/* 筛选控制面板 */}
            <div className="mb-4 p-4 bg-gray-50/50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
              {/* 快速筛选按钮 */}
              <div className="mb-3 flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => updateProjectStatsFilters({ 
                    year: new Date().getFullYear().toString(), 
                    status: "Active",
                    bodCategory: "all",
                    project: "all"
                  })}
                  className="h-7 text-xs"
                >
                  当前年份活跃项目
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => updateProjectStatsFilters({ 
                    year: "all", 
                    status: "Active",
                    bodCategory: "all",
                    project: "all"
                  })}
                  className="h-7 text-xs"
                >
                  所有活跃项目
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => updateProjectStatsFilters({ 
                    year: new Date().getFullYear().toString(), 
                    status: "all",
                    bodCategory: "all",
                    project: "all"
                  })}
                  className="h-7 text-xs"
                >
                  当前年份所有项目
                </Button>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1">
                  <Label htmlFor="project-year-filter" className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1 block">
                    年份筛选
                  </Label>
                  <Select 
                    value={projectStatsFilters.year} 
                    onValueChange={(value) => updateProjectStatsFilters({ year: value })}
                  >
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue placeholder="选择年份" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">所有年份</SelectItem>
                      {getAvailableProjectYears().map((year) => (
                        <SelectItem key={year} value={year}>
                          {year}年
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex-1">
                  <Label htmlFor="project-bod-filter" className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1 block">
                    BOD分类
                  </Label>
                  <Select 
                    value={projectStatsFilters.bodCategory} 
                    onValueChange={(value) => updateProjectStatsFilters({ bodCategory: value })}
                  >
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue placeholder="选择BOD分类" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">所有分类</SelectItem>
                      {getAvailableBODCategories().map((category) => (
                        <SelectItem key={category} value={category}>
                          {category === 'P' && '主席 (P)'}
                          {category === 'VPI' && '副主席 (VPI)'}
                          {category === 'VPE' && '副主席 (VPE)'}
                          {category === 'VPM' && '副主席 (VPM)'}
                          {category === 'VPPR' && '副主席 (VPPR)'}
                          {category === 'SAA' && '秘书 (SAA)'}
                          {category === 'T' && '财务 (T)'}
                          {category === 'S' && '秘书 (S)'}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex-1">
                  <Label htmlFor="project-status-filter" className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1 block">
                    项目状态
                  </Label>
                  <Select 
                    value={projectStatsFilters.status} 
                    onValueChange={(value) => updateProjectStatsFilters({ status: value })}
                  >
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue placeholder="选择状态" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">所有状态</SelectItem>
                      {getAvailableProjectStatuses().map((status) => (
                        <SelectItem key={status} value={status}>
                          {status === 'Active' && '进行中'}
                          {status === 'Completed' && '已完成'}
                          {status === 'On Hold' && '暂停'}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex-1">
                  <Label htmlFor="project-filter" className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1 block">
                    选择项目
                  </Label>
                  <Select 
                    value={projectStatsFilters.project} 
                    onValueChange={(value) => updateProjectStatsFilters({ project: value })}
                  >
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue placeholder="选择项目" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">所有项目</SelectItem>
                      {getProjectsGroupedByBOD().map((group) => (
                        <div key={group.group}>
                          <div className="px-2 py-1.5 text-xs font-semibold text-gray-500 bg-gray-100 dark:bg-gray-800">
                            {group.group === 'P' && '主席 (P)'}
                            {group.group === 'VPI' && '副主席 (VPI)'}
                            {group.group === 'VPE' && '副主席 (VPE)'}
                            {group.group === 'VPM' && '副主席 (VPM)'}
                            {group.group === 'VPPR' && '副主席 (VPPR)'}
                            {group.group === 'SAA' && '秘书 (SAA)'}
                            {group.group === 'T' && '财务 (T)'}
                            {group.group === 'S' && '秘书 (S)'}
                          </div>
                          {group.projects.map((project) => (
                            <SelectItem key={project.id} value={project.projectid}>
                              {project.name}
                            </SelectItem>
                          ))}
                        </div>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex items-end">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setProjectStatsFilters({ year: new Date().getFullYear().toString(), bodCategory: "all", status: "all", project: "all" })}
                    className="h-8 text-xs"
                  >
                    <X className="h-3 w-3 mr-1" />
                    重置筛选
                  </Button>
                </div>
              </div>
            </div>

            {/* 项目统计卡片 - Carousel版本 */}
            <div className="mb-4">
              <Carousel
                opts={{
                  align: "start",
                  loop: true,
                }}
                className="w-full"
              >
                <CarouselContent className="-ml-2 md:-ml-4">
                  {filteredProjectStats.map((project) => {
                    const isDeficit = project.netAmount < 0
                    return (
                      <CarouselItem key={project.id} className="pl-2 md:pl-4 md:basis-1/2 lg:basis-1/3">
                        <ProjectStatsCard project={project} isDeficit={isDeficit} />
                      </CarouselItem>
                    )
                  })}
                </CarouselContent>
                <div className="flex justify-center mt-4 space-x-2">
                  <CarouselPrevious className="relative translate-y-0 w-8 h-8 bg-white border border-gray-200 hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-700 dark:hover:bg-gray-700" />
                  <CarouselNext className="relative translate-y-0 w-8 h-8 bg-white border border-gray-200 hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-700 dark:hover:bg-gray-700" />
                </div>
              </Carousel>
            </div>

            {/* 项目详细统计表格 */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">项目详细统计</h3>
                <Badge variant="outline" className="bg-gray-100 dark:bg-gray-800">
                  共 {filteredProjectStats.length} 个项目
                </Badge>
              </div>
              
              <div className="rounded-md border border-gray-200 dark:border-gray-700 overflow-hidden">
                <Table>
                  <TableHeader className="bg-gray-50 dark:bg-gray-800">
                    <TableRow>
                      <TableHead className="font-semibold text-gray-900 dark:text-gray-100">项目名称</TableHead>
                      <TableHead className="font-semibold text-gray-900 dark:text-gray-100">状态</TableHead>
                      <TableHead className="font-semibold text-gray-900 dark:text-gray-100 text-right">总收入</TableHead>
                      <TableHead className="font-semibold text-gray-900 dark:text-gray-100 text-right">总支出</TableHead>
                      <TableHead className="font-semibold text-gray-900 dark:text-gray-100 text-right">净额</TableHead>
                      <TableHead className="font-semibold text-gray-900 dark:text-gray-100 text-right">交易数</TableHead>
                      <TableHead className="font-semibold text-gray-900 dark:text-gray-100 text-right">平均金额</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredProjectStats.map((project) => (
                      <TableRow key={project.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors">
                        <TableCell className="font-medium text-gray-900 dark:text-gray-100">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                            {project.name}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={project.status === 'Active' ? 'default' : 'secondary'} className="text-xs">
                            {project.status === 'Active' ? '进行中' : project.status === 'Completed' ? '已完成' : '暂停'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-semibold text-green-600 dark:text-green-400">
                          {project.totalIncome.toFixed(2)}
                        </TableCell>
                        <TableCell className="text-right font-semibold text-red-600 dark:text-red-400">
                          {project.totalExpense.toFixed(2)}
                        </TableCell>
                        <TableCell className={`text-right font-semibold ${project.netAmount >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                          {project.netAmount >= 0 ? '+' : ''}{project.netAmount.toFixed(2)}
                        </TableCell>
                        <TableCell className="text-right font-semibold text-blue-600 dark:text-blue-400">
                          {project.transactionCount}
                        </TableCell>
                        <TableCell className="text-right font-semibold text-gray-600 dark:text-gray-400">
                          {project.avgTransactionAmount.toFixed(2)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          </CardContent>
        </Card>
      )}


    </div>
  )
} 