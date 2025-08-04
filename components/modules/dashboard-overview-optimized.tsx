import React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { 
  DollarSign, 
  CreditCard, 
  TrendingUp, 
  Building2, 
  Users, 
  Calendar,
  RefreshCw
} from "lucide-react"
import { useAuth } from "@/components/auth/auth-context"
import { 
  getTransactionsBatch, 
  getProjectsSpentAmounts,
  clearCache 
} from "@/lib/firebase-utils"
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

export function DashboardOverviewOptimized() {
  const { currentUser, hasPermission } = useAuth()
  const [transactions, setTransactions] = React.useState<Transaction[]>([])
  const [projects, setProjects] = React.useState<Project[]>([])
  const [projectSpentAmounts, setProjectSpentAmounts] = React.useState<Record<string, number>>({})
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [refreshing, setRefreshing] = React.useState(false)

  // 优化的数据加载函数
  const fetchData = React.useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true)
    } else {
      setLoading(true)
    }
    setError(null)
    
    try {
      // 并行加载所有数据
      const [transactionsData, projectsData] = await Promise.all([
        getTransactionsBatch(100, {
          dateRange: {
            start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 最近30天
            end: new Date()
          }
        }),
        import("@/lib/firebase-utils").then(m => m.getProjects())
      ])
      
      setTransactions(transactionsData)
      setProjects(projectsData)
      
      // 并行计算项目花费金额
      if (projectsData.length > 0) {
        const projectIds = projectsData.map(p => p.id!).filter(Boolean)
        const spentAmounts = await getProjectsSpentAmounts(projectIds)
        setProjectSpentAmounts(spentAmounts)
      }
    } catch (err: any) {
      setError("无法加载数据: " + err.message)
      console.error("Error fetching dashboard data:", err)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  // 优化的统计数据计算
  const dashboardStats = React.useMemo(() => {
    const totalRevenue = transactions
      .filter((t) => {
        const amountStr = typeof t.amount === 'string' ? t.amount : String(t.amount)
        return amountStr.startsWith("+")
      })
      .reduce((sum, t) => {
        const amountStr = typeof t.amount === 'string' ? t.amount : String(t.amount)
        return sum + Number.parseFloat(amountStr.replace(/[^0-9.-]+/g, ""))
      }, 0)

    const totalExpenses = transactions
      .filter((t) => {
        const amountStr = typeof t.amount === 'string' ? t.amount : String(t.amount)
        return amountStr.startsWith("-")
      })
      .reduce((sum, t) => {
        const amountStr = typeof t.amount === 'string' ? t.amount : String(t.amount)
        return sum + Number.parseFloat(amountStr.replace(/[^0-9.-]+/g, ""))
      }, 0)

    const netProfit = totalRevenue + totalExpenses
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
    return projects
      .filter(p => p.status === "Active")
      .slice(0, 6) // 只显示前6个活跃项目
      .map(project => ({
        project,
        spentAmount: projectSpentAmounts[project.id!] || 0,
        budget: project.budget || 0
      }))
  }, [projects, projectSpentAmounts])

  // 初始加载
  React.useEffect(() => {
    fetchData()
  }, [fetchData])

  // 刷新数据
  const handleRefresh = React.useCallback(() => {
    clearCache()
    fetchData(true)
  }, [fetchData])

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
        <Button onClick={() => fetchData()} className="mt-2">重试</Button>
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
      <div className="grid gap-4 grid-cols-4 md:grid-cols-4">
        {dashboardStats.map((stat, index) => (
          <StatCard key={index} {...stat} />
        ))}
      </div>

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
            最近交易 (最近30天)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {transactions.slice(0, 5).map((transaction) => (
              <div key={transaction.id} className="flex items-center justify-between p-2 border rounded">
                <div>
                  <p className="font-medium">{transaction.description}</p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(typeof transaction.date === 'string' ? transaction.date : transaction.date.seconds * 1000).toLocaleDateString()}
                  </p>
                </div>
                <div className="text-right">
                  <p className={`font-medium ${
                    (transaction.income && parseFloat(transaction.income) > 0) ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {transaction.income && parseFloat(transaction.income) > 0 
                      ? `+$${parseFloat(transaction.income).toFixed(2)}`
                      : transaction.expense 
                        ? `-$${parseFloat(transaction.expense).toFixed(2)}`
                        : '$0.00'
                    }
                  </p>
                  <Badge variant="outline" className="text-xs">
                    {transaction.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
          {transactions.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              暂无交易记录
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
} 