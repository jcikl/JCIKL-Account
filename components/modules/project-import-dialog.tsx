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
import { Clipboard, Upload, AlertCircle, CheckCircle, XCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import type { Project } from "@/lib/data"
import { BODCategories } from "@/lib/data"
import { generateProjectCode, getBODDisplayName } from "@/lib/project-utils"

const projectImportFormSchema = z.object({
  data: z.string().min(1, "请输入要导入的项目数据"),
  format: z.enum(["csv", "excel", "tsv"], {
    required_error: "请选择数据格式"
  }),
  skipHeader: z.boolean().default(true),
  updateExisting: z.boolean().default(false),
  validateData: z.boolean().default(true)
})

type ProjectImportFormData = z.infer<typeof projectImportFormSchema>

interface ParsedProject {
  name: string
  bodCategory: keyof typeof BODCategories
  eventDate: string
  projectid?: string
  isValid: boolean
  errors: string[]
  isUpdate?: boolean // 标识是否为更新现有项目
}

interface ProjectImportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  existingProjects: Project[]
  onImport: (projects: ParsedProject[]) => void
}

export function ProjectImportDialog({
  open,
  onOpenChange,
  existingProjects,
  onImport
}: ProjectImportDialogProps) {
  const [parsedProjects, setParsedProjects] = React.useState<ParsedProject[]>([])
  const [isParsing, setIsParsing] = React.useState(false)
  const [parseError, setParseError] = React.useState<string>("")

  const form = useForm<ProjectImportFormData>({
    resolver: zodResolver(projectImportFormSchema),
    defaultValues: {
      data: "",
      format: "csv",
      skipHeader: true,
      updateExisting: false,
      validateData: true
    }
  })

  // 解析粘贴的项目数据
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
            // Excel格式通常也是CSV格式，但可能包含更多格式
            fields = line.split(',').map(field => field.trim().replace(/^["']|["']$/g, ''))
            break
          default:
            throw new Error(`不支持的数据格式: ${format}`)
        }

        // 验证字段数量（需要3个必需字段：项目名称、BOD分类、活动日期）
        if (fields.length < 3) {
          errors.push(`字段数量不足，需要至少3个字段（项目名称、BOD分类、活动日期），当前只有${fields.length}个`)
        }

        // 解析字段（只取前3个字段）
        const [name, bodCategory, eventDate] = fields

        // 验证项目名称（转换为大写）
        const normalizedName = name ? name.trim().toUpperCase() : ''
        if (!normalizedName) {
          errors.push("项目名称不能为空")
        }

        // 验证BOD分类（不区分大小写，转换为大写）
        const normalizedBODCategory = bodCategory ? bodCategory.trim().toUpperCase() : ''
        if (!normalizedBODCategory || !Object.keys(BODCategories).includes(normalizedBODCategory)) {
          errors.push(`无效的BOD分类: ${bodCategory}，有效值: ${Object.keys(BODCategories).join(', ')}`)
        }

        // 验证活动日期
        if (!eventDate || !isValidDate(eventDate)) {
          errors.push(`无效的活动日期: ${eventDate}`)
        }

        // 检查重复的项目名称和BOD分类组合（使用标准化的大写值）
        const existingProject = existingProjects.find(p => 
          p.name.toUpperCase() === normalizedName && p.bodCategory.toUpperCase() === normalizedBODCategory
        )
        
        if (existingProject) {
          if (!updateExisting) {
            errors.push("项目已存在，请勾选'更新现有项目'选项来更新")
          } else {
            console.log(`项目 ${normalizedName} 已存在，将更新现有项目`)
          }
        }

        // 生成项目代码
        let code: string | undefined
        if (!errors.length) {
          try {
            code = generateProjectCode(normalizedName, normalizedBODCategory as keyof typeof BODCategories, existingProjects)
          } catch (error) {
            errors.push(`生成项目代码失败: ${error}`)
          }
        }

        return {
          name: normalizedName,
          bodCategory: (normalizedBODCategory as keyof typeof BODCategories) || 'P',
          eventDate: eventDate || new Date().toISOString(),
          code,
          isValid: errors.length === 0,
          errors,
          isUpdate: existingProject ? true : false
        }
      })

      setParsedProjects(projects)
      setParseError("")
    } catch (error) {
      console.error('解析数据时出错:', error)
      setParseError(error instanceof Error ? error.message : '解析数据时出错')
      setParsedProjects([])
    } finally {
      setIsParsing(false)
    }
  }, [existingProjects, form])

  // 验证日期格式
  const isValidDate = (dateString: string): boolean => {
    const date = new Date(dateString)
    return !isNaN(date.getTime())
  }

  // 监听数据变化，自动解析
  React.useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name === 'data' && value.data) {
        const format = form.getValues('format')
        const skipHeader = form.getValues('skipHeader')
        parseData(value.data, format, skipHeader)
      }
    })
    return () => subscription.unsubscribe()
  }, [form, parseData])

  // 处理粘贴事件
  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText()
      form.setValue('data', text)
    } catch (error) {
      console.error('读取剪贴板失败:', error)
      setParseError('无法读取剪贴板内容，请手动粘贴数据')
    }
  }

  // 处理导入
  const handleImport = () => {
    const validProjects = parsedProjects.filter(project => project.isValid)
    if (validProjects.length === 0) {
      setParseError('没有有效的项目数据可以导入')
      return
    }
    onImport(validProjects)
  }

  // 处理取消
  const handleCancel = () => {
    form.reset()
    setParsedProjects([])
    setParseError("")
    onOpenChange(false)
  }

  // 统计信息
  const validCount = parsedProjects.filter(p => p.isValid).length
  const invalidCount = parsedProjects.filter(p => !p.isValid).length
  const newCount = parsedProjects.filter(p => p.isValid && !p.isUpdate).length
  const updateCount = parsedProjects.filter(p => p.isValid && p.isUpdate).length

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>项目数据导入</DialogTitle>
          <DialogDescription>
            粘贴项目数据到下面的文本框中，系统会自动解析并验证数据格式
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
                    <FormLabel>数据格式</FormLabel>
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
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex items-center space-x-4">
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
                        <FormLabel>更新现有项目</FormLabel>
                        <FormDescription>
                          如果项目已存在，更新而不是创建新项目
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
                  <FormLabel>项目数据</FormLabel>
                  <div className="relative">
                    <FormControl>
                      <Textarea
                        placeholder="粘贴项目数据到这里...&#10;格式: 项目名称,BOD分类,开始日期"
                        className="min-h-[200px] font-mono text-sm"
                        {...field}
                      />
                    </FormControl>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="absolute top-2 right-2"
                      onClick={handlePaste}
                    >
                      <Clipboard className="h-4 w-4 mr-2" />
                      粘贴
                    </Button>
                  </div>
                  <FormDescription>
                    支持CSV、TSV和Excel格式。字段顺序：项目名称, BOD分类, 开始日期。BOD分类不区分大小写，所有数据将以大写格式存储。
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* 解析状态 */}
            {isParsing && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>正在解析数据...</AlertDescription>
              </Alert>
            )}

            {parseError && (
              <Alert variant="destructive">
                <XCircle className="h-4 w-4" />
                <AlertDescription>{parseError}</AlertDescription>
              </Alert>
            )}

            {/* 解析结果统计 */}
            {parsedProjects.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">解析结果</h3>
                  <div className="flex items-center space-x-4">
                    <Badge variant="outline">
                      总计: {parsedProjects.length}
                    </Badge>
                    <Badge variant="default" className="bg-green-100 text-green-800">
                      有效: {validCount}
                    </Badge>
                    {invalidCount > 0 && (
                      <Badge variant="destructive">
                        无效: {invalidCount}
                      </Badge>
                    )}
                    <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                      新增: {newCount}
                    </Badge>
                    <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                      更新: {updateCount}
                    </Badge>
                  </div>
                </div>

                <Separator />

                {/* 项目预览表格 */}
                <div className="max-h-[300px] overflow-y-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>状态</TableHead>
                        <TableHead>项目名称</TableHead>
                        <TableHead>BOD分类</TableHead>
                        <TableHead>开始日期</TableHead>
                        <TableHead>项目代码</TableHead>
                        <TableHead>操作</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {parsedProjects.map((project, index) => (
                        <TableRow key={index}>
                          <TableCell>
                            {project.isValid ? (
                              <CheckCircle className="h-4 w-4 text-green-600" />
                            ) : (
                              <XCircle className="h-4 w-4 text-red-600" />
                            )}
                          </TableCell>
                          <TableCell className="font-medium">{project.name}</TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {getBODDisplayName(project.bodCategory)}
                            </Badge>
                          </TableCell>
                          <TableCell>{new Date(project.startDate).toLocaleDateString()}</TableCell>
                          <TableCell className="font-mono text-sm">{project.projectid || '待生成'}</TableCell>
                          <TableCell>
                            {project.isUpdate && (
                              <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                                更新
                              </Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* 错误详情 */}
                {parsedProjects.some(p => !p.isValid) && (
                  <div className="space-y-2">
                    <h4 className="font-medium text-red-600">错误详情:</h4>
                    {parsedProjects.map((project, index) => (
                      project.errors.length > 0 && (
                        <Alert key={index} variant="destructive">
                          <AlertCircle className="h-4 w-4" />
                          <AlertDescription>
                            <strong>第{index + 1}行 - {project.name}:</strong>
                            <ul className="mt-1 list-disc list-inside">
                              {project.errors.map((error, errorIndex) => (
                                <li key={errorIndex}>{error}</li>
                              ))}
                            </ul>
                          </AlertDescription>
                        </Alert>
                      )
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* 操作按钮 */}
            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={handleCancel}>
                取消
              </Button>
              <Button
                type="button"
                onClick={handleImport}
                disabled={validCount === 0 || isParsing}
              >
                <Upload className="h-4 w-4 mr-2" />
                导入项目 ({newCount} 新增, {updateCount} 更新)
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
} 