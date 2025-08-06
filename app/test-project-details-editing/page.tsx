"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ProjectDetailsDialogOptimized } from "@/components/modules/project-details-dialog-optimized"
import { getProjects, getTransactions } from "@/lib/firebase-utils"
import { type Project, type Transaction } from "@/lib/data"
import { useToast } from "@/hooks/use-toast"
import { Eye, Plus, Loader2 } from "lucide-react"

export default function TestProjectDetailsEditingPage() {
  const { toast } = useToast()
  const [projects, setProjects] = React.useState<Project[]>([])
  const [selectedProject, setSelectedProject] = React.useState<Project | null>(null)
  const [isDialogOpen, setIsDialogOpen] = React.useState(false)
  const [loading, setLoading] = React.useState(false)

  // 加载项目数据
  const loadProjects = React.useCallback(async () => {
    setLoading(true)
    try {
      const projectsData = await getProjects()
      setProjects(projectsData)
    } catch (error) {
      console.error('加载项目数据失败:', error)
      toast({
        title: "加载失败",
        description: "无法加载项目数据",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }, [toast])

  // 打开项目详情对话框
  const handleOpenProjectDetails = React.useCallback((project: Project) => {
    setSelectedProject(project)
    setIsDialogOpen(true)
  }, [])

  // 关闭项目详情对话框
  const handleCloseProjectDetails = React.useCallback(() => {
    setIsDialogOpen(false)
    setSelectedProject(null)
  }, [])

  // 加载初始数据
  React.useEffect(() => {
    loadProjects()
  }, [loadProjects])

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">项目详情编辑功能测试</h1>
          <p className="text-muted-foreground mt-2">
            测试项目详情对话框中的交易记录单条和批量编辑功能
          </p>
        </div>
      </div>

      {/* 功能说明 */}
      <Card>
        <CardHeader>
          <CardTitle>功能说明</CardTitle>
          <CardDescription>
            本项目详情对话框包含以下编辑功能：
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-lg mb-2">单条编辑功能</h3>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                <li>点击交易记录行的编辑按钮进入编辑模式</li>
                <li>可以修改日期、描述、分类、收入和支出</li>
                <li>实时计算净额显示</li>
                <li>支持保存和取消操作</li>
                <li>可以删除单条交易记录</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-lg mb-2">批量编辑功能</h3>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                <li>点击"批量编辑"按钮进入批量模式</li>
                <li>可以选择多条交易记录</li>
                <li>支持全选/取消全选</li>
                <li>批量修改分类、收入、支出字段</li>
                <li>一次性更新所有选中的记录</li>
                <li>显示选中记录数量和更新进度</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-lg mb-2">其他功能</h3>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                <li>实时数据同步和缓存更新</li>
                <li>筛选和导出功能</li>
                <li>统计图表和预算使用情况</li>
                <li>响应式设计和移动端适配</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 项目列表 */}
      <Card>
        <CardHeader>
          <CardTitle>选择项目进行测试</CardTitle>
          <CardDescription>
            点击项目查看详情并测试编辑功能
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin mr-2" />
              <span>加载项目中...</span>
            </div>
          ) : projects.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {projects.map((project) => (
                <Card key={project.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg">{project.name}</h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          项目代码: {project.projectid}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          BOD分类: {project.bodCategory}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            project.status === 'Active' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {project.status}
                          </span>
                          {project.budget > 0 && (
                            <span className="text-xs text-muted-foreground">
                              预算: ${project.budget.toFixed(2)}
                            </span>
                          )}
                        </div>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => handleOpenProjectDetails(project)}
                        className="ml-4"
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        查看详情
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground">暂无项目数据</p>
              <Button onClick={loadProjects} className="mt-2">
                重新加载
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 使用说明 */}
      <Card>
        <CardHeader>
          <CardTitle>使用说明</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">测试单条编辑：</h4>
              <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
                <li>选择一个项目并打开详情对话框</li>
                <li>在交易记录表格中找到要编辑的记录</li>
                <li>点击该行的编辑按钮（铅笔图标）</li>
                <li>修改相关字段（日期、描述、分类、收入、支出）</li>
                <li>点击保存按钮确认修改，或点击取消按钮放弃修改</li>
              </ol>
            </div>
            <div>
              <h4 className="font-medium mb-2">测试批量编辑：</h4>
              <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
                <li>在项目详情对话框中点击"批量编辑"按钮</li>
                <li>使用复选框选择要批量修改的交易记录</li>
                <li>可以使用表头的全选按钮快速选择所有记录</li>
                <li>在批量编辑面板中设置要修改的字段（分类、收入、支出）</li>
                <li>点击"批量更新"按钮执行批量修改</li>
                <li>完成后点击"退出批量模式"返回正常视图</li>
              </ol>
            </div>
            <div>
              <h4 className="font-medium mb-2">注意事项：</h4>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                <li>编辑操作会实时同步到数据库</li>
                <li>批量编辑时，未填写的字段将保持原值不变</li>
                <li>删除操作会永久移除交易记录，请谨慎操作</li>
                <li>所有操作都有相应的成功/失败提示</li>
                <li>编辑过程中会显示加载状态</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 项目详情对话框 */}
      <ProjectDetailsDialogOptimized
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        project={selectedProject}
      />
    </div>
  )
}
