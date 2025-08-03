"use client"
import * as React from "react"
import { Building2, CreditCard, DollarSign, TrendingUp } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { getTransactions, getProjects, getProjectSpentAmount, type Transaction, type Project } from "@/lib/firebase-utils"
import { useAuth } from "@/components/auth/auth-context"
import { RoleLevels, UserRoles } from "@/lib/data"

export function DashboardOverview() {
  const { currentUser, hasPermission } = useAuth()
  const [transactions, setTransactions] = React.useState<Transaction[]>([])
  const [projects, setProjects] = React.useState<Project[]>([])
  const [projectSpentAmounts, setProjectSpentAmounts] = React.useState<Record<string, number>>({})
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      setError(null)
      try {
        const fetchedTransactions = await getTransactions()
        const fetchedProjects = await getProjects()
        setTransactions(fetchedTransactions)
        setProjects(fetchedProjects)
        
        // 计算每个项目的已花费金额
        const spentAmounts: Record<string, number> = {}
        for (const project of fetchedProjects) {
          try {
            const spent = await getProjectSpentAmount(project.id!)
            spentAmounts[project.id!] = spent
          } catch (error) {
            console.error(`Error calculating spent amount for project ${project.id}:`, error)
            spentAmounts[project.id!] = 0
          }
        }
        setProjectSpentAmounts(spentAmounts)
      } catch (err: any) {
        setError("无法加载数据: " + err.message)
        console.error("Error fetching dashboard data:", err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  // Calculate dashboard stats based on fetched data
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
  const netProfit = totalRevenue + totalExpenses // Expenses are negative, so add them
  const activeProjectsCount = projects.filter((p) => p.status === "Active").length

  const dashboardStats = [
    {
      title: "总收入",
      value: `$${totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      change: "+12.5%", // Placeholder, needs actual calculation
      trend: "up",
      icon: DollarSign,
    },
    {
      title: "总支出",
      value: `$${Math.abs(totalExpenses).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      change: "-3.2%", // Placeholder
      trend: "down",
      icon: CreditCard,
    },
    {
      title: "净利润",
      value: `$${netProfit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      change: "+8.7%", // Placeholder
      trend: netProfit >= 0 ? "up" : "down",
      icon: TrendingUp,
    },
    {
      title: "活跃项目",
      value: activeProjectsCount.toString(),
      change: "+2", // Placeholder
      trend: "up",
      icon: Building2,
    },
  ]

  if (loading) {
    return <div className="p-6 text-center">加载仪表板数据...</div>
  }

  if (error) {
    return <div className="p-6 text-center text-red-500">{error}</div>
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">仪表板概览</h1>
          <p className="text-muted-foreground">欢迎回来！这是您账户的最新情况。</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">导出</Button>
          {hasPermission(RoleLevels[UserRoles.VICE_PRESIDENT]) && <Button>新条目</Button>}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {dashboardStats.map((stat, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className={`text-xs ${stat.trend === "up" ? "text-green-600" : "text-red-600"}`}>
                {stat.change} 比上月
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="transactions" className="space-y-4">
        <TabsList>
          <TabsTrigger value="transactions">最近交易</TabsTrigger>
          <TabsTrigger value="projects">项目账户</TabsTrigger>
          <TabsTrigger value="analytics">分析</TabsTrigger>
        </TabsList>

        <TabsContent value="transactions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>最近交易</CardTitle>
              <CardDescription>您的最新财务交易和条目。</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>交易ID</TableHead>
                    <TableHead>日期</TableHead>
                    <TableHead>描述</TableHead>
                    <TableHead>账户</TableHead>
                    <TableHead>金额</TableHead>
                    <TableHead>状态</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.slice(0, 5).map((transaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell className="font-medium">{transaction.id}</TableCell>
                      <TableCell>
                        {typeof transaction.date === 'string' 
                          ? transaction.date 
                          : transaction.date?.seconds 
                            ? new Date(transaction.date.seconds * 1000).toLocaleDateString()
                            : 'N/A'
                        }
                      </TableCell>
                      <TableCell>{transaction.description}</TableCell>
                      <TableCell>{transaction.account}</TableCell>
                      <TableCell className={
                        (typeof transaction.amount === 'string' ? transaction.amount : String(transaction.amount)).startsWith("+") 
                          ? "text-green-600" 
                          : "text-red-600"
                      }>
                        {typeof transaction.amount === 'string' ? transaction.amount : String(transaction.amount)}
                      </TableCell>
                      <TableCell>
                        <Badge variant={transaction.status === "Completed" ? "default" : "secondary"}>
                          {transaction.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="projects" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>项目账户摘要</CardTitle>
              <CardDescription>项目预算和支出的概览。</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>项目</TableHead>
                    <TableHead>预算</TableHead>
                    <TableHead>已花费</TableHead>
                    <TableHead>剩余</TableHead>
                    <TableHead>状态</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {projects.slice(0, 3).map((project) => (
                    <TableRow key={project.id}>
                      <TableCell className="font-medium">{project.name}</TableCell>
                      <TableCell>${project.budget.toLocaleString()}</TableCell>
                      <TableCell>${(projectSpentAmounts[project.id!] || 0).toLocaleString()}</TableCell>
                      <TableCell>${project.remaining.toLocaleString()}</TableCell>
                      <TableCell>
                        <Badge variant={project.status === "Active" ? "default" : "secondary"}>{project.status}</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>收入趋势</CardTitle>
                <CardDescription>过去6个月的月收入</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[200px] flex items-center justify-center bg-muted/50 rounded">
                  <p className="text-muted-foreground">收入图表占位符</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>支出明细</CardTitle>
                <CardDescription>本月按类别划分的支出</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[200px] flex items-center justify-center bg-muted/50 rounded">
                  <p className="text-muted-foreground">支出图表占位符</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
