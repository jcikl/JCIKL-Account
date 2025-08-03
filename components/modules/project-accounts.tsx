"use client"
import * as React from "react"
import { Calendar, DollarSign, Plus, TrendingDown, TrendingUp, Search, Edit, Trash2, Eye, Filter, Loader2, Upload, Copy, MoreHorizontal } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { 
  getProjects, 
  addProject, 
  updateProject, 
  deleteProject, 
  getProjectsByBOD,
  getProjectStats,
  getProjectsWithPagination,
  getProjectSpentAmount
} from "@/lib/firebase-utils"
import { useAuth } from "@/components/auth/auth-context"
import { RoleLevels, UserRoles, BODCategories, type Project } from "@/lib/data"
import { useToast } from "@/hooks/use-toast"
import { ProjectFormDialog } from "./project-form-dialog"
import { ProjectImportDialog } from "./project-import-dialog"
import { ProjectPasteImportDialog } from "./project-paste-import-dialog"
import { ProjectDetailsDialog } from "./project-details-dialog"
import { getProjectStatsByBOD, getBODDisplayName } from "@/lib/project-utils"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

// 辅助函数：处理日期格式
const formatProjectDate = (date: string | { seconds: number; nanoseconds: number }): string => {
  if (typeof date === 'string') {
    return new Date(date).toLocaleDateString()
  } else if (date?.seconds) {
    return new Date(date.seconds * 1000).toLocaleDateString()
  }
  return 'N/A'
}

interface ProjectFilters {
  search: string
  status: string
  budgetRange: string
  bodCategory: string
}

export function ProjectAccounts() {
  const { currentUser, hasPermission } = useAuth()
  const { toast } = useToast()
  
  // 调试信息
  // console.log('ProjectAccounts - 当前用户:', currentUser)
  // console.log('ProjectAccounts - 用户角色:', currentUser?.role)
  // console.log('ProjectAccounts - 用户级别:', currentUser?.role ? RoleLevels[currentUser.role] : null)
  // console.log('ProjectAccounts - 导入权限 (TREASURER):', hasPermission(RoleLevels.TREASURER))
  // console.log('ProjectAccounts - 导入权限 (ASSISTANT_VICE_PRESIDENT):', hasPermission(RoleLevels[UserRoles.ASSISTANT_VICE_PRESIDENT]))
  // console.log('ProjectAccounts - 组合权限检查:', (hasPermission(RoleLevels[UserRoles.ASSISTANT_VICE_PRESIDENT]) || hasPermission(RoleLevels.TREASURER)))
  // console.log('ProjectAccounts - 添加项目权限:', hasPermission(RoleLevels[UserRoles.VICE_PRESIDENT]))
  const [projects, setProjects] = React.useState<Project[]>([])
  const [filteredProjects, setFilteredProjects] = React.useState<Project[]>([])
  const [loading, setLoading] = React.useState(true)
  const [saving, setSaving] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  
  // 表单和对话框状态
  const [showProjectForm, setShowProjectForm] = React.useState(false)
  const [showImportDialog, setShowImportDialog] = React.useState(false)
  const [showPasteImportDialog, setShowPasteImportDialog] = React.useState(false)
  const [editingProject, setEditingProject] = React.useState<Project | null>(null)
  const [showProjectDetails, setShowProjectDetails] = React.useState(false)
  const [selectedProject, setSelectedProject] = React.useState<Project | null>(null)
  const [projectSpentAmounts, setProjectSpentAmounts] = React.useState<Record<string, number>>({})
  
  // 筛选状态
  const [filters, setFilters] = React.useState<ProjectFilters>({
    search: "",
    status: "all",
    budgetRange: "all",
    bodCategory: "all"
  })

  const fetchProjects = React.useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const fetched = await getProjects()
      // Filter projects for Project Chairman
      const filteredProjects = currentUser?.role === UserRoles.PROJECT_CHAIRMAN 
        ? fetched.filter((p) => p.assignedToUid === currentUser.uid)
        : fetched
      
      setProjects(filteredProjects)
      
      // 计算每个项目的已花费金额
      const spentAmounts: Record<string, number> = {}
      for (const project of filteredProjects) {
        try {
          const spent = await getProjectSpentAmount(project.id!)
          spentAmounts[project.id!] = spent
        } catch (error) {
          // console.error(`Error calculating spent amount for project ${project.id}:`, error)
          spentAmounts[project.id!] = 0
        }
      }
      setProjectSpentAmounts(spentAmounts)
    } catch (err: any) {
      setError("无法加载项目: " + err.message)
      // console.error("Error fetching projects:", err)
    } finally {
      setLoading(false)
    }
  }, [currentUser])

  React.useEffect(() => {
    fetchProjects()
  }, [fetchProjects])

  // 筛选项目
  React.useEffect(() => {
    let filtered = projects

    // 搜索筛选
    if (filters.search) {
      filtered = filtered.filter(project =>
        project.name.toLowerCase().includes(filters.search.toLowerCase()) ||
        project.projectid.toLowerCase().includes(filters.search.toLowerCase())
      )
    }

    // 状态筛选
    if (filters.status !== "all") {
      filtered = filtered.filter(project => project.status === filters.status)
    }

    // BOD分类筛选
    if (filters.bodCategory !== "all") {
      filtered = filtered.filter(project => project.bodCategory === filters.bodCategory)
    }

    // 预算范围筛选
    if (filters.budgetRange !== "all") {
      filtered = filtered.filter(project => {
        switch (filters.budgetRange) {
          case "low":
            return project.budget <= 10000
          case "medium":
            return project.budget > 10000 && project.budget <= 100000
          case "high":
            return project.budget > 100000
          default:
            return true
        }
      })
    }

    setFilteredProjects(filtered)
  }, [projects, filters])

  // 处理添加项目
  const handleAddProject = () => {
    setEditingProject(null)
    setShowProjectForm(true)
  }

  // 处理编辑项目
  const handleEditProject = (project: Project) => {
    setEditingProject(project)
    setShowProjectForm(true)
  }

  // 处理删除项目
  const handleDeleteProject = async (projectId: string) => {
    if (!confirm("确定要删除这个项目吗？此操作不可撤销。")) {
      return
    }

    try {
      setSaving(true)
      await deleteProject(projectId)
      setProjects(prev => prev.filter(project => project.id !== projectId))
      
      toast({
        title: "项目删除成功",
        description: "项目已从系统中删除",
      })
    } catch (error) {
      // console.error('Error deleting project:', error)
      toast({
        title: "项目删除失败",
        description: `删除项目时出错: ${error}`,
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  // 处理查看项目详情
  const handleViewProject = (project: Project) => {
    setSelectedProject(project)
    setShowProjectDetails(true)
  }

  // 处理保存项目
  const handleSaveProject = async (projectData: any) => {
    try {
      setSaving(true)
      
      if (editingProject) {
        // 更新现有项目
        await updateProject(editingProject.id!, projectData)
        setProjects(prev => prev.map(project => 
          project.id === editingProject.id 
            ? { ...project, ...projectData, remaining: projectData.budget - (projectSpentAmounts[project.id!] || 0) }
            : project
        ))
        toast({
          title: "项目更新成功",
          description: "项目信息已更新",
        })
      } else {
        // 添加新项目
        const newProjectData = {
          ...projectData,
          remaining: projectData.budget,
          startDate: projectData.startDate.toISOString(),
          endDate: projectData.endDate?.toISOString()
        }
        
        const newProjectId = await addProject(newProjectData)
        const newProject: Project = {
          id: newProjectId,
          ...newProjectData
        }
        
        setProjects(prev => [...prev, newProject])
        toast({
          title: "项目创建成功",
          description: `项目 "${projectData.name}" 已创建`,
        })
      }
    } catch (error) {
      // console.error('Error saving project:', error)
      toast({
        title: "操作失败",
        description: `保存项目时出错: ${error}`,
        variant: "destructive",
      })
      throw error
    } finally {
      setSaving(false)
    }
  }

  // 处理项目导入
  const handleImportProjects = async (importedProjects: any[]) => {
    try {
      setSaving(true)
      // console.log('批量处理项目到 Firebase...')
      
      let importedCount = 0
      let updatedCount = 0
      
      for (const projectData of importedProjects) {
        try {
          // 检查项目是否已存在（基于名称和BOD分类，使用大写比较）
          const existingProject = projects.find(p => 
            p.name.toUpperCase() === projectData.name.toUpperCase() && 
            p.bodCategory.toUpperCase() === projectData.bodCategory.toUpperCase()
          )
          
          if (existingProject) {
            // 更新现有项目（只更新开始日期）
            const updateData = {
              startDate: projectData.startDate
            }
            
            await updateProject(existingProject.id!, updateData)
            updatedCount++
            // console.log(`✅ 项目已更新: ${projectData.name} - ${projectData.bodCategory}`)
          } else {
            // 添加新项目（只保存三个必需字段，所有数据以大写存储）
            const newProjectData = {
              name: projectData.name.toUpperCase(), // 转换为大写
              projectid: projectData.projectid,
              bodCategory: projectData.bodCategory.toUpperCase(), // 转换为大写
              startDate: projectData.startDate,
              budget: 0, // 默认值
              spent: 0, // 默认值
              remaining: 0, // 默认值
              status: "Active" as const, // 默认状态
              description: "", // 默认空描述
              assignedToUid: "" // 默认空负责人
            }
            
            await addProject(newProjectData)
            importedCount++
            // console.log(`✅ 新项目已添加: ${projectData.name} - ${projectData.bodCategory}`)
          }
        } catch (error) {
          // console.error(`❌ 处理项目失败: ${projectData.name}`, error)
        }
      }
      
      // 重新加载项目列表
      await fetchProjects()
      
      toast({
        title: "项目导入完成",
        description: `成功导入 ${importedCount} 个新项目，更新 ${updatedCount} 个现有项目`,
      })
      
      setShowImportDialog(false)
    } catch (error) {
      // console.error('Error importing projects:', error)
      toast({
        title: "导入失败",
        description: `导入项目时出错: ${error}`,
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const totalBudget = projects.reduce((sum, project) => sum + (project.budget || 0), 0)
  const totalSpent = projects.reduce((sum, project) => sum + (projectSpentAmounts[project.id!] || 0), 0)
  const totalRemaining = projects.reduce((sum, project) => sum + (project.remaining || 0), 0)
  const activeProjectsCount = projects.filter((p) => p.status === "Active").length

  if (loading) {
    return (
      <div className="p-6 text-center">
        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
        <p className="text-muted-foreground">加载项目账户...</p>
      </div>
    )
  }

  if (error) {
    return <div className="p-6 text-center text-red-500">{error}</div>
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">项目账户</h1>
          <p className="text-muted-foreground">按项目跟踪预算、支出和盈利能力。</p>
        </div>
        <div className="flex items-center space-x-2">
          {(hasPermission(RoleLevels[UserRoles.ASSISTANT_VICE_PRESIDENT]) || hasPermission(RoleLevels.TREASURER)) && (
            <Button
              variant="outline"
              onClick={() => setShowPasteImportDialog(true)}
            >
              <Copy className="h-4 w-4 mr-2" />
              粘贴导入
            </Button>
          )}
          {(hasPermission(RoleLevels[UserRoles.ASSISTANT_VICE_PRESIDENT]) || hasPermission(RoleLevels.TREASURER)) && (
            <Button
              variant="outline"
              onClick={() => setShowImportDialog(true)}
            >
              <Upload className="h-4 w-4 mr-2" />
              导入项目
            </Button>
          )}
          {hasPermission(RoleLevels[UserRoles.VICE_PRESIDENT]) && (
            <Button onClick={handleAddProject} disabled={saving}>
              {saving ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Plus className="h-4 w-4 mr-2" />
              )}
              新项目
            </Button>
          )}
        </div>
      </div>

      {/* Project Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">总预算</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalBudget.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">所有项目</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">总支出</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalSpent.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {totalBudget > 0 ? `${((totalSpent / totalBudget) * 100).toFixed(1)}%` : '0%'} 的预算
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">剩余预算</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalRemaining.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">可用于支出</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">活跃项目</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeProjectsCount}</div>
            <p className="text-xs text-muted-foreground">当前运行中</p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <CardTitle>搜索和筛选</CardTitle>
          <CardDescription>查找特定项目或按条件筛选</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="搜索项目名称或代码..."
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                className="pl-8"
              />
            </div>
            <Select value={filters.bodCategory} onValueChange={(value) => setFilters(prev => ({ ...prev, bodCategory: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="BOD分类" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">所有BOD分类</SelectItem>
                {Object.entries(BODCategories).map(([key, value]) => (
                  <SelectItem key={key} value={key}>
                    {key} - {value}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filters.status} onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="项目状态" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">所有状态</SelectItem>
                <SelectItem value="Active">进行中</SelectItem>
                <SelectItem value="Completed">已完成</SelectItem>
                <SelectItem value="On Hold">暂停</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filters.budgetRange} onValueChange={(value) => setFilters(prev => ({ ...prev, budgetRange: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="预算范围" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">所有预算</SelectItem>
                <SelectItem value="low">低预算 (≤10,000)</SelectItem>
                <SelectItem value="medium">中等预算 (10,000-100,000)</SelectItem>
                <SelectItem value="high">高预算 (&gt;100,000)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">项目概览</TabsTrigger>
          <TabsTrigger value="bod-stats">BOD统计</TabsTrigger>
          <TabsTrigger value="budget">预算分析</TabsTrigger>
          <TabsTrigger value="timeline">时间线</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>所有项目 ({filteredProjects.length})</CardTitle>
                  <CardDescription>项目预算和支出的完整概览。</CardDescription>
                </div>
                <div className="flex items-center space-x-2">
                  {(hasPermission(RoleLevels[UserRoles.ASSISTANT_VICE_PRESIDENT]) || hasPermission(RoleLevels.TREASURER)) && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowImportDialog(true)}
                    >
                      <Copy className="h-4 w-4 mr-2" />
                      粘贴导入
                    </Button>
                  )}
                  {(hasPermission(RoleLevels[UserRoles.ASSISTANT_VICE_PRESIDENT]) || hasPermission(RoleLevels.TREASURER)) && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowImportDialog(true)}
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      导入项目
                    </Button>
                  )}
                  {(hasPermission(RoleLevels[UserRoles.ASSISTANT_VICE_PRESIDENT]) || hasPermission(RoleLevels.TREASURER)) && (
                    <Button
                      size="sm"
                      onClick={handleAddProject}
                      disabled={saving}
                    >
                      {saving ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Plus className="h-4 w-4 mr-2" />
                      )}
                      新项目
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>项目信息</TableHead>
                    <TableHead>BOD分类</TableHead>
                    <TableHead>预算</TableHead>
                    <TableHead>已花费</TableHead>
                    <TableHead>剩余</TableHead>
                    <TableHead>进度</TableHead>
                    <TableHead>状态</TableHead>
                    <TableHead>开始日期</TableHead>
                    <TableHead className="text-right">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProjects.map((project) => {
                    const spentAmount = projectSpentAmounts[project.id!] || 0
                    const progressPercentage = project.budget > 0 ? (spentAmount / project.budget) * 100 : 0
                    return (
                      <TableRow key={project.id}>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="font-medium">{project.name}</div>
                            <div className="text-sm text-muted-foreground">{project.projectid}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {project.bodCategory} - {getBODDisplayName(project.bodCategory)}
                          </Badge>
                        </TableCell>
                        <TableCell>${(project.budget || 0).toLocaleString()}</TableCell>
                        <TableCell>${(projectSpentAmounts[project.id!] || 0).toLocaleString()}</TableCell>
                                                  <TableCell className={(project.remaining || 0) > 0 ? "text-green-600" : "text-red-600"}>
                            ${(project.remaining || 0).toLocaleString()}
                          </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Progress value={progressPercentage} className="w-[60px]" />
                            <span className="text-xs text-muted-foreground">{progressPercentage.toFixed(0)}%</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              project.status === "Active"
                                ? "default"
                                : project.status === "Completed"
                                  ? "secondary"
                                  : "outline"
                            }
                          >
                            {project.status === "Active" ? "进行中" : 
                             project.status === "Completed" ? "已完成" : "暂停"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {formatProjectDate(project.startDate)}
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleViewProject(project)}>
                                <Eye className="h-4 w-4 mr-2" />
                                查看详情
                              </DropdownMenuItem>
                              {hasPermission(RoleLevels[UserRoles.VICE_PRESIDENT]) && (
                                <>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem onClick={() => handleEditProject(project)}>
                                    <Edit className="h-4 w-4 mr-2" />
                                    编辑项目
                                  </DropdownMenuItem>
                                  <DropdownMenuItem 
                                    onClick={() => handleDeleteProject(project.id!)}
                                    className="text-red-600"
                                  >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    删除项目
                                  </DropdownMenuItem>
                                </>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="budget" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>预算利用率</CardTitle>
                <CardDescription>每个项目预算的使用情况</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {filteredProjects.map((project) => {
                  const spentAmount = projectSpentAmounts[project.id!] || 0
                  const utilizationPercentage = project.budget > 0 ? (spentAmount / project.budget) * 100 : 0
                  return (
                    <div key={project.id} className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <div>
                          <div className="font-medium">{project.name}</div>
                          <div className="text-xs text-muted-foreground">{project.projectid}</div>
                        </div>
                        <span>{utilizationPercentage.toFixed(1)}%</span>
                      </div>
                      <Progress value={utilizationPercentage} />
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>${spentAmount.toLocaleString()} 已花费</span>
                        <span>${(project.budget || 0).toLocaleString()} 预算</span>
                      </div>
                    </div>
                  )
                })}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>项目绩效</CardTitle>
                <CardDescription>预算与实际支出分析</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {filteredProjects.map((project) => {
                    const spentAmount = projectSpentAmounts[project.id!] || 0
                    const isOverBudget = spentAmount > project.budget
                    const variance = spentAmount - project.budget
                    return (
                      <div key={project.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <p className="font-medium">{project.name}</p>
                          <p className="text-sm text-muted-foreground">{project.projectid}</p>
                        </div>
                        <div className="text-right">
                          <p className={`font-medium ${isOverBudget ? "text-red-600" : "text-green-600"}`}>
                            {isOverBudget ? "+" : ""}${variance.toLocaleString()}
                          </p>
                          <p className="text-xs text-muted-foreground">{isOverBudget ? "超出预算" : "低于预算"}</p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="timeline" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>项目时间线</CardTitle>
              <CardDescription>项目开始日期和完成状态</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredProjects.map((project) => (
                  <div key={project.id} className="flex items-center gap-4 p-4 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-medium">{project.name}</h3>
                        <Badge
                          variant={
                            project.status === "Active"
                              ? "default"
                              : project.status === "Completed"
                                ? "secondary"
                                : "outline"
                          }
                        >
                          {project.status === "Active" ? "进行中" : 
                           project.status === "Completed" ? "已完成" : "暂停"}
                        </Badge>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">
                          代码: {project.projectid}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          开始: {formatProjectDate(project.startDate)}
                          {project.endDate && ` • 完成: ${formatProjectDate(project.endDate)}`}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">${(projectSpentAmounts[project.id!] || 0).toLocaleString()}</p>
                                              <p className="text-sm text-muted-foreground">of ${(project.budget || 0).toLocaleString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="bod-stats" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>BOD分类统计</CardTitle>
              <CardDescription>按BOD分类查看项目统计信息</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>BOD分类</TableHead>
                    <TableHead>项目数量</TableHead>
                    <TableHead>总预算</TableHead>
                    <TableHead>总支出</TableHead>
                    <TableHead>剩余预算</TableHead>
                    <TableHead>活跃项目</TableHead>
                    <TableHead>已完成</TableHead>
                    <TableHead>暂停</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(() => {
                    const bodStats = getProjectStatsByBOD(projects)
                    return Object.entries(bodStats).map(([category, stats]) => (
                      <TableRow key={category}>
                        <TableCell className="font-medium">
                          <Badge variant="outline">
                            {category} - {getBODDisplayName(category as any)}
                          </Badge>
                        </TableCell>
                        <TableCell>{stats.count}</TableCell>
                        <TableCell>${(stats.totalBudget || 0).toLocaleString()}</TableCell>
                        <TableCell>${(stats.totalSpent || 0).toLocaleString()}</TableCell>
                        <TableCell className={(stats.totalRemaining || 0) > 0 ? "text-green-600" : "text-red-600"}>
                          ${(stats.totalRemaining || 0).toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <Badge variant="default">{stats.activeCount}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">{stats.completedCount}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{stats.onHoldCount}</Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  })()}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Project Form Dialog */}
      <ProjectFormDialog
        open={showProjectForm}
        onOpenChange={setShowProjectForm}
        project={editingProject}
        existingProjects={projects}
        onSave={handleSaveProject}
      />

      {/* Project Import Dialog */}
      <ProjectImportDialog
        open={showImportDialog}
        onOpenChange={setShowImportDialog}
        existingProjects={projects}
        onImport={handleImportProjects}
      />

      {/* Project Paste Import Dialog */}
      <ProjectPasteImportDialog
        open={showPasteImportDialog}
        onOpenChange={setShowPasteImportDialog}
        existingProjects={projects}
        onImport={handleImportProjects}
      />

      {/* Project Details Dialog */}
      <ProjectDetailsDialog
        open={showProjectDetails}
        onOpenChange={setShowProjectDetails}
        project={selectedProject}
      />
    </div>
  )
}
