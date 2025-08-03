"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Clipboard, AlertCircle, CheckCircle, XCircle, Loader2 } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import type { Project, BODCategory } from "@/lib/data"
import { BODCategories } from "@/lib/data"

const projectPasteImportFormSchema = z.object({
  data: z.string().min(1, "请输入要导入的数据"),
  format: z.enum(["csv", "tsv", "excel"], {
    required_error: "请选择数据格式"
  }),
  skipHeader: z.boolean().default(true),
  updateExisting: z.boolean().default(false),
  validateData: z.boolean().default(true)
})

type ProjectPasteImportFormData = z.infer<typeof projectPasteImportFormSchema>

interface ParsedProject {
  projectYear: number
  name: string
  projectid: string
  bodCategory: BODCategory
  budget: number
  status: "Active" | "Completed" | "On Hold"
  eventDate?: string
  description?: string
  isValid: boolean
  errors: string[]
  isUpdate?: boolean
}

interface ProjectPasteImportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  existingProjects: Project[]
  onImport: (projects: ParsedProject[]) => void
}

export function ProjectPasteImportDialog({
  open,
  onOpenChange,
  existingProjects,
  onImport
}: ProjectPasteImportDialogProps) {
  const { toast } = useToast()
  const [parsedProjects, setParsedProjects] = React.useState<ParsedProject[]>([])
  const [isParsing, setIsParsing] = React.useState(false)
  const [parseError, setParseError] = React.useState<string>("")

  const form = useForm<ProjectPasteImportFormData>({
    resolver: zodResolver(projectPasteImportFormSchema),
    defaultValues: {
      data: "",
      format: "csv",
      skipHeader: true,
      updateExisting: false,
      validateData: true
    }
  })

  // 解析粘贴的数据
  const parseData = React.useCallback((data: string, format: string, skipHeader: boolean) => {
    setIsParsing(true)
    setParseError("")
    
    try {
      const lines = data.trim().split('\n')
      if (lines.length === 0) {
        throw new Error("没有找到有效的数据行")
      }

      // 跳过标题行
      const dataLines = skipHeader ? lines.slice(1) : lines
      
      // 获取当前表单的更新现有项目选项
      const updateExisting = form.getValues("updateExisting")
      
      const projects: ParsedProject[] = dataLines.map((line, index) => {
        const errors: string[] = []
        let fields: string[]

        // 根据格式解析字段
        switch (format) {
          case "csv":
            fields = line.split(',').map(field => field.trim().replace(/^["']|["']$/g, ''))
            break
          case "tsv":
            fields = line.split('\t').map(field => field.trim())
            break
          case "excel":
            fields = line.split(',').map(field => field.trim().replace(/^["']|["']$/g, ''))
            break
          default:
            fields = line.split(',').map(field => field.trim().replace(/^["']|["']$/g, ''))
        }

        // 检查字段数量 - 新格式：项目年份,项目名称,BOD分类,预算,状态,活动日期,描述
        // 只有前3个字段是必需的：项目年份,项目名称,BOD分类
        if (fields.length < 3) {
          errors.push(`字段数量不足，需要至少3个字段（项目年份,项目名称,BOD分类），当前只有${fields.length}个`)
        }

        // 解析各个字段 - 新格式：项目年份,项目名称,BOD分类,预算,状态,活动日期,描述
        const [projectYearStr, name, bodCategoryStr, budgetStr, statusStr, eventDateStr, description] = fields

        // 验证项目年份
        let projectYear = new Date().getFullYear()
        if (projectYearStr) {
          const parsedYear = parseInt(projectYearStr)
          if (isNaN(parsedYear) || parsedYear < 2020 || parsedYear > 2030) {
            errors.push("项目年份无效，应在2020-2030之间")
          } else {
            projectYear = parsedYear
          }
        } else {
          errors.push("项目年份不能为空")
        }

        // 验证项目名称
        if (!name || name.trim() === "") {
          errors.push("项目名称不能为空")
        }

        // 验证BOD分类
        let bodCategory: BODCategory = "P"
        if (bodCategoryStr) {
          const categoryKey = Object.keys(BODCategories).find(key => 
            BODCategories[key as BODCategory] === bodCategoryStr || key === bodCategoryStr
          )
          if (categoryKey) {
            bodCategory = categoryKey as BODCategory
          } else {
            errors.push("BOD分类无效")
          }
        }

        // 验证预算（选填）
        let budget = 0
        if (budgetStr && budgetStr.trim() !== "") {
          const parsedBudget = parseFloat(budgetStr)
          if (isNaN(parsedBudget) || parsedBudget < 0) {
            errors.push("预算金额格式无效")
          } else {
            budget = parsedBudget
          }
        }
        // 如果预算为空或无效，使用默认值0

        // 验证状态（选填）
        let status: "Active" | "Completed" | "On Hold" = "Active"
        if (statusStr && statusStr.trim() !== "") {
          const statusLower = statusStr.toLowerCase()
          if (statusLower === "active" || statusLower === "活跃" || statusLower === "进行中") {
            status = "Active"
          } else if (statusLower === "completed" || statusLower === "已完成" || statusLower === "完成") {
            status = "Completed"
          } else if (statusLower === "on hold" || statusLower === "暂停" || statusLower === "搁置") {
            status = "On Hold"
          } else {
            errors.push("状态格式无效，应为 Active/Completed/On Hold")
          }
        }
        // 如果状态为空或无效，使用默认值"Active"

        // 验证活动日期（可选）
        let eventDate: string | undefined = undefined
        if (eventDateStr && eventDateStr.trim() !== "") {
          const parsedDate = new Date(eventDateStr)
          if (isNaN(parsedDate.getTime())) {
            errors.push("活动日期格式无效")
          } else {
            eventDate = parsedDate.toISOString().split('T')[0]
          }
        }

        // 自动生成项目代码
        let projectid = ""
        if (projectYear && name && bodCategory) {
          const baseCode = `${projectYear}_${bodCategory}_${name}`
          
          // 检查代码是否已存在，如果存在则添加序号
          let finalCode = baseCode
          let counter = 1
          while (existingProjects.some(p => p.projectid === finalCode)) {
            finalCode = `${baseCode}_${counter}`
            counter++
          }
          projectid = finalCode
        }

        // 检查是否为更新现有项目（基于项目名称和BOD分类）
        let isUpdate = false
        if (updateExisting && name && bodCategory) {
          const existingProject = existingProjects.find(p => 
            p.name === name && p.bodCategory === bodCategory
          )
          if (existingProject) {
            isUpdate = true
            projectid = existingProject.projectid // 使用现有项目的代码
          }
        }

        return {
          projectYear,
          name: name || "",
          projectid,
          bodCategory,
          budget,
          status,
          eventDate,
          description: description || "",
          isValid: errors.length === 0,
          errors,
          isUpdate
        }
      })

      setParsedProjects(projects)
      console.log(`解析完成，共${projects.length}条记录`)
    } catch (error: any) {
      setParseError(error.message || "解析数据时发生错误")
      console.error("解析错误:", error)
    } finally {
      setIsParsing(false)
    }
  }, [form, existingProjects])

  // 监听表单数据变化，自动解析
  React.useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name === "data" || name === "format" || name === "skipHeader") {
        if (value.data && value.format) {
          parseData(value.data, value.format, value.skipHeader || true)
        }
      }
    })
    return () => subscription.unsubscribe()
  }, [form, parseData])

  // 处理粘贴事件
  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText()
      form.setValue("data", text)
      toast({
        title: "粘贴成功",
        description: "数据已从剪贴板粘贴到文本框中",
      })
    } catch (error) {
      console.error("无法访问剪贴板:", error)
      toast({
        title: "粘贴失败",
        description: "请手动粘贴数据到文本框中，或检查浏览器权限设置",
        variant: "destructive",
      })
    }
  }

  // 处理导入
  const handleImport = () => {
    const validProjects = parsedProjects.filter(project => project.isValid)
    if (validProjects.length === 0) {
      toast({
        title: "导入失败",
        description: "没有有效的项目数据可以导入",
        variant: "destructive",
      })
      return
    }
    
    onImport(validProjects)
    onOpenChange(false)
    form.reset()
    setParsedProjects([])
    toast({
      title: "导入成功",
      description: `成功导入 ${validProjects.length} 个项目`,
    })
  }

  const handleCancel = () => {
    onOpenChange(false)
    form.reset()
    setParsedProjects([])
    setParseError("")
  }

  const validProjects = parsedProjects.filter(project => project.isValid)
  const invalidProjects = parsedProjects.filter(project => !project.isValid)
  const newProjects = validProjects.filter(project => !project.isUpdate)
  const updateProjects = validProjects.filter(project => project.isUpdate)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>粘贴导入项目数据</DialogTitle>
          <DialogDescription>
            从剪贴板粘贴项目数据，支持CSV、TSV和Excel格式
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="format"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>数据格式 *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="选择数据格式" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="csv">CSV (逗号分隔)</SelectItem>
                        <SelectItem value="tsv">TSV (制表符分隔)</SelectItem>
                        <SelectItem value="excel">Excel (CSV格式)</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      选择您粘贴的数据格式
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="skipHeader"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>跳过标题行</FormLabel>
                        <FormDescription>
                          如果数据包含标题行，请勾选此项
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="updateExisting"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>更新现有记录</FormLabel>
                        <FormDescription>
                          如果找到相同的项目代码，将更新而不是创建新记录
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <FormField
              control={form.control}
              name="data"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>项目数据 *</FormLabel>
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handlePaste}
                        className="flex items-center gap-2"
                      >
                        <Clipboard className="h-4 w-4" />
                        从剪贴板粘贴
                      </Button>
                    </div>
                    <FormControl>
                                             <Textarea
                         placeholder="粘贴您的项目数据，格式：项目年份,项目名称,BOD分类,预算,状态,活动日期,描述（前3个字段必需）"
                         className="min-h-[120px] font-mono text-sm"
                         {...field}
                       />
                     </FormControl>
                     <FormDescription>
                       支持格式：项目年份,项目名称,BOD分类,预算,状态,活动日期,描述
                       <br />
                       <strong>必需字段</strong>：项目年份,项目名称,BOD分类（项目代码将自动生成）
                       <br />
                       <strong>选填字段</strong>：预算,状态,活动日期,描述（留空使用默认值）
                       <br />
                       示例：2024,年度晚宴,P,50000.00,Active,2024-12-31,年度会员晚宴活动
                     </FormDescription>
                    <FormMessage />
                  </div>
                </FormItem>
              )}
            />

            {/* 解析结果 */}
            {isParsing && (
              <Alert>
                <Loader2 className="h-4 w-4 animate-spin" />
                <AlertDescription>正在解析数据...</AlertDescription>
              </Alert>
            )}

            {parseError && (
              <Alert variant="destructive">
                <XCircle className="h-4 w-4" />
                <AlertDescription>{parseError}</AlertDescription>
              </Alert>
            )}

            {parsedProjects.length > 0 && !isParsing && (
              <div className="space-y-4">
                <Separator />
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-medium">解析结果</h4>
                  <div className="flex gap-2">
                    <Badge variant="default" className="flex items-center gap-1">
                      <CheckCircle className="h-3 w-3" />
                      {validProjects.length} 个有效
                    </Badge>
                    {newProjects.length > 0 && (
                      <Badge variant="default" className="flex items-center gap-1 bg-green-100 text-green-800">
                        <CheckCircle className="h-3 w-3" />
                        {newProjects.length} 个新增
                      </Badge>
                    )}
                    {updateProjects.length > 0 && (
                      <Badge variant="secondary" className="flex items-center gap-1 bg-yellow-100 text-yellow-800">
                        <CheckCircle className="h-3 w-3" />
                        {updateProjects.length} 个更新
                      </Badge>
                    )}
                    {invalidProjects.length > 0 && (
                      <Badge variant="destructive" className="flex items-center gap-1">
                        <XCircle className="h-3 w-3" />
                        {invalidProjects.length} 个无效
                      </Badge>
                    )}
                  </div>
                </div>

                {/* 有效项目预览 */}
                {validProjects.length > 0 && (
                  <div className="space-y-2">
                    <h5 className="text-sm font-medium text-green-600">有效项目</h5>
                    <div className="max-h-40 overflow-y-auto space-y-1">
                      {validProjects.slice(0, 10).map((project, index) => (
                        <div key={index} className="flex items-center gap-2 text-sm p-2 bg-green-50 rounded">
                          <CheckCircle className="h-3 w-3 text-green-600" />
                          <span className="font-medium">{project.name}</span>
                          <span className="text-xs text-gray-600">{project.projectYear}</span>
                          <span className="font-mono text-xs">{project.projectid}</span>
                          <span className="text-xs text-gray-600">{BODCategories[project.bodCategory]}</span>
                          <span className="text-green-600">${project.budget.toLocaleString()}</span>
                          <Badge variant="outline" className="text-xs">
                            {project.status === "Active" ? "活跃" : 
                             project.status === "Completed" ? "已完成" : "暂停"}
                          </Badge>
                          {project.isUpdate && (
                            <Badge variant="secondary" className="text-xs">更新</Badge>
                          )}
                        </div>
                      ))}
                      {validProjects.length > 10 && (
                        <div className="text-xs text-gray-500 text-center">
                          还有 {validProjects.length - 10} 条记录...
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* 无效项目预览 */}
                {invalidProjects.length > 0 && (
                  <div className="space-y-2">
                    <h5 className="text-sm font-medium text-red-600">无效项目</h5>
                    <div className="max-h-40 overflow-y-auto space-y-1">
                      {invalidProjects.slice(0, 5).map((project, index) => (
                        <div key={index} className="flex items-start gap-2 text-sm p-2 bg-red-50 rounded">
                          <XCircle className="h-3 w-3 text-red-600 mt-0.5" />
                          <div className="flex-1">
                            <div className="font-medium">{project.name || "无名称"}</div>
                            <div className="text-xs text-red-600">
                              {project.errors.join(", ")}
                            </div>
                          </div>
                        </div>
                      ))}
                      {invalidProjects.length > 5 && (
                        <div className="text-xs text-gray-500 text-center">
                          还有 {invalidProjects.length - 5} 条无效记录...
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={handleCancel}>
                取消
              </Button>
              <Button 
                type="button" 
                onClick={handleImport}
                disabled={validProjects.length === 0 || isParsing}
              >
                导入 {validProjects.length > 0 ? `(${validProjects.length} 个)` : ""}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
} 