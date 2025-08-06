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

  // 项目统计筛选状态
  const [projectStatsFilters, setProjectStatsFilters] = React.useState({
    year: "all",
    bodCategory: "all",
    status: "all"
  })

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
    
    return calculateProjectStats(filteredProjects, transactions)
  }, [calculateProjectStats, projects, transactions, projectStatsFilters])

  // 获取可用项目年份
  const getAvailableProjectYears = React.useCallback(() => {
    if (!projects) return []
    const years = new Set<string>()
    projects.forEach(project => {
      const year = project.projectid?.split('_')[0]
      if (year) years.add(year)
    })
    return Array.from(years).sort((a, b) => parseInt(b) - parseInt(a))
  }, [projects])

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

  // 优化的项目列表
  const activeProjects = React.useMemo(() => {
    if (!projects || !projectSpentAmounts) return []
    
    return projects
      .filter(p => p.status === "Active")
      .slice(0, 6) // 只显示前6个活跃项目
      .map(project => ({
        project,
        spentAmount: projectSpentAmounts[project.id!] || 0,
        budget: project.budget || 0
      }))
  }, [projects, projectSpentAmounts])

  // 优化的最近交易列表
  const recentTransactions = React.useMemo(() => {
    if (!transactions) return []
    
    return transactions
      .slice(0, 5) // 只显示最近5笔交易
  }, [transactions])

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
              <Badge variant="outline" className="bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-700">
                <PieChart className="h-3 w-3 mr-1" />
                {projects.length} 个项目
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            {/* 筛选控制面板 */}
            <div className="mb-4 p-4 bg-gray-50/50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1">
                  <Label htmlFor="project-year-filter" className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1 block">
                    年份筛选
                  </Label>
                  <Select 
                    value={projectStatsFilters.year} 
                    onValueChange={(value) => setProjectStatsFilters(prev => ({ ...prev, year: value }))}
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
                    onValueChange={(value) => setProjectStatsFilters(prev => ({ ...prev, bodCategory: value }))}
                  >
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue placeholder="选择BOD分类" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">所有分类</SelectItem>
                      <SelectItem value="P">主席 (P)</SelectItem>
                      <SelectItem value="VPI">副主席 (VPI)</SelectItem>
                      <SelectItem value="VPE">副主席 (VPE)</SelectItem>
                      <SelectItem value="VPM">副主席 (VPM)</SelectItem>
                      <SelectItem value="VPPR">副主席 (VPPR)</SelectItem>
                      <SelectItem value="SAA">秘书 (SAA)</SelectItem>
                      <SelectItem value="T">财务 (T)</SelectItem>
                      <SelectItem value="S">秘书 (S)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex-1">
                  <Label htmlFor="project-status-filter" className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1 block">
                    项目状态
                  </Label>
                  <Select 
                    value={projectStatsFilters.status} 
                    onValueChange={(value) => setProjectStatsFilters(prev => ({ ...prev, status: value }))}
                  >
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue placeholder="选择状态" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">所有状态</SelectItem>
                      <SelectItem value="Active">进行中</SelectItem>
                      <SelectItem value="Completed">已完成</SelectItem>
                      <SelectItem value="On Hold">暂停</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex items-end">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setProjectStatsFilters({ year: "all", bodCategory: "all", status: "all" })}
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

      {/* 活跃项目 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            活跃项目
          </CardTitle>
        </CardHeader>
        <CardContent>
          {activeProjects.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {activeProjects.map(({ project, spentAmount, budget }) => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  spentAmount={spentAmount}
                  budget={budget}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              暂无活跃项目
            </div>
          )}
        </CardContent>
      </Card>

      {/* 最近交易 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            最近交易
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {recentTransactions.map((transaction) => (
              <TransactionItem key={transaction.id} transaction={transaction} />
            ))}
          </div>
          {recentTransactions.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              暂无交易记录
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
} 