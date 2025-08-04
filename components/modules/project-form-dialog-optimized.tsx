"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Calendar, Loader2 } from "lucide-react"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { zhCN } from "date-fns/locale"
import { useToast } from "@/hooks/use-toast"
import type { Project, BODCategory } from "@/lib/data"
import { generateProjectCode, getBODOptions, getBODDisplayName } from "@/lib/project-utils"

const projectFormSchema = z.object({
  name: z.string().min(1, "项目名称不能为空").max(100, "项目名称不能超过100个字符"),
  projectYear: z.number().min(2020, "项目年份不能早于2020年").max(2030, "项目年份不能晚于2030年"),
  bodCategory: z.enum(["P", "HT", "EVP", "LS", "GLC", "VPI", "VPB", "VPIA", "VPC", "VPLOM"] as const, {
    required_error: "请选择BOD分类"
  }),
  budget: z.number().min(0, "预算不能为负数"),
  status: z.enum(["Active", "Completed", "On Hold"], {
    required_error: "请选择项目状态"
  }),
  eventDate: z.date().optional(),
  description: z.string().optional(),
  assignedToUid: z.string().optional(),
  projectid: z.string().optional()
})

type ProjectFormData = z.infer<typeof projectFormSchema>

interface ProjectFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  project?: Project | null
  existingProjects: Project[]
  onSave: (projectData: ProjectFormData) => Promise<void>
}

// 优化的BOD分类选项组件
const BODCategoryOption = React.memo(({ 
  value, 
  label 
}: { 
  value: string
  label: string 
}) => (
  <SelectItem value={value}>
    <div className="flex flex-col">
      <span className="font-medium">{label}</span>
      <span className="text-xs text-muted-foreground">{getBODDisplayName(value)}</span>
    </div>
  </SelectItem>
))

// 优化的项目状态选项组件
const ProjectStatusOption = React.memo(({ 
  value, 
  label 
}: { 
  value: string
  label: string 
}) => (
  <SelectItem value={value}>
    <span className={cn(
      "px-2 py-1 rounded text-xs",
      value === "Active" && "bg-green-100 text-green-800",
      value === "Completed" && "bg-blue-100 text-blue-800",
      value === "On Hold" && "bg-yellow-100 text-yellow-800"
    )}>
      {label}
    </span>
  </SelectItem>
))

// 优化的年份选项组件
const YearOption = React.memo(({ 
  year 
}: { 
  year: number 
}) => (
  <SelectItem value={year.toString()}>
    {year}年
  </SelectItem>
))

// 优化的日期选择器组件
const DatePickerField = React.memo(({ 
  field, 
  label 
}: { 
  field: any
  label: string 
}) => (
  <FormItem className="flex flex-col">
    <FormLabel>{label}</FormLabel>
    <Popover>
      <PopoverTrigger asChild>
        <FormControl>
          <Button
            variant={"outline"}
            className={cn(
              "w-full pl-3 text-left font-normal",
              !field.value && "text-muted-foreground"
            )}
          >
            {field.value ? (
              format(field.value, "PPP", { locale: zhCN })
            ) : (
              <span>选择日期</span>
            )}
            <Calendar className="ml-auto h-4 w-4 opacity-50" />
          </Button>
        </FormControl>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <CalendarComponent
          mode="single"
          selected={field.value}
          onSelect={field.onChange}
          disabled={(date) =>
            date > new Date() || date < new Date("1900-01-01")
          }
          initialFocus
        />
      </PopoverContent>
    </Popover>
    <FormMessage />
  </FormItem>
))

export function ProjectFormDialogOptimized({
  open,
  onOpenChange,
  project,
  existingProjects,
  onSave
}: ProjectFormDialogProps) {
  const { toast } = useToast()
  const [saving, setSaving] = React.useState(false)

  // 优化的日期转换函数
  const safeDateConversion = React.useCallback((dateValue: string | { seconds: number; nanoseconds: number } | undefined): Date => {
    if (!dateValue) return new Date()
    
    if (typeof dateValue === 'string') {
      const date = new Date(dateValue)
      return isNaN(date.getTime()) ? new Date() : date
    } else if (dateValue?.seconds) {
      return new Date(dateValue.seconds * 1000)
    }
    
    return new Date()
  }, [])

  // 优化的年份提取函数
  const extractYearFromProjectId = React.useCallback((projectid: string): number => {
    const parts = projectid.split('_')
    if (parts.length >= 3) {
      const year = parseInt(parts[0])
      if (!isNaN(year) && year >= 2020 && year <= 2030) {
        return year
      }
    }
    return new Date().getFullYear()
  }, [])

  const form = useForm<ProjectFormData>({
    resolver: zodResolver(projectFormSchema),
    defaultValues: {
      name: project?.name || "",
      projectYear: project?.projectid ? extractYearFromProjectId(project.projectid) : new Date().getFullYear(),
      bodCategory: project?.bodCategory || "P",
      budget: project?.budget || 0,
      status: project?.status || "Active",
      eventDate: project?.eventDate ? safeDateConversion(project.eventDate) : undefined,
      description: project?.description || "",
      assignedToUid: project?.assignedToUid || ""
    }
  })

  // 优化的表单重置
  const resetForm = React.useCallback(() => {
    if (project) {
      form.reset({
        name: project.name,
        projectYear: project.projectid ? extractYearFromProjectId(project.projectid) : new Date().getFullYear(),
        bodCategory: project.bodCategory,
        budget: project.budget,
        status: project.status,
        eventDate: project.eventDate ? safeDateConversion(project.eventDate) : undefined,
        description: project.description || "",
        assignedToUid: project.assignedToUid || ""
      })
    } else {
      form.reset({
        name: "",
        projectYear: new Date().getFullYear(),
        bodCategory: "P",
        budget: 0,
        status: "Active",
        eventDate: undefined,
        description: "",
        assignedToUid: ""
      })
    }
  }, [project, form, extractYearFromProjectId, safeDateConversion])

  React.useEffect(() => {
    resetForm()
  }, [resetForm])

  // 优化的提交处理
  const handleSubmit = React.useCallback(async (data: ProjectFormData) => {
    setSaving(true)
    try {
      await onSave(data)
      onOpenChange(false)
      toast({
        title: project ? "项目更新成功" : "项目创建成功",
        description: `项目 "${data.name}" 已${project ? '更新' : '创建'}`,
      })
      // 延迟重置表单
      setTimeout(() => {
        form.reset()
      }, 100)
    } catch (error) {
      console.error('保存项目失败:', error)
      toast({
        title: "保存失败",
        description: "保存项目时发生错误，请重试",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }, [onSave, onOpenChange, toast, project, form])

  // 优化的取消处理
  const handleCancel = React.useCallback(() => {
    onOpenChange(false)
    // 延迟重置表单
    setTimeout(() => {
      form.reset()
    }, 100)
  }, [onOpenChange, form])

  // 优化的BOD选项
  const bodOptions = React.useMemo(() => getBODOptions(), [])

  // 优化的年份选项
  const yearOptions = React.useMemo(() => {
    const currentYear = new Date().getFullYear()
    return Array.from({ length: 11 }, (_, i) => currentYear - 5 + i)
  }, [])

  // 优化的状态选项
  const statusOptions = React.useMemo(() => [
    { value: "Active", label: "进行中" },
    { value: "Completed", label: "已完成" },
    { value: "On Hold", label: "暂停" }
  ], [])

  // 优化的编辑状态
  const isEditing = React.useMemo(() => !!project, [project])

  // 优化的对话框标题和描述
  const dialogTitle = React.useMemo(() => 
    isEditing ? "编辑项目" : "创建新项目", 
    [isEditing]
  )

  const dialogDescription = React.useMemo(() => 
    isEditing ? "修改项目信息" : "创建新的项目记录", 
    [isEditing]
  )

  const submitButtonText = React.useMemo(() => 
    isEditing ? "保存修改" : "创建项目", 
    [isEditing]
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{dialogTitle}</DialogTitle>
          <DialogDescription>
            {dialogDescription}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>项目名称 *</FormLabel>
                    <FormControl>
                      <Input placeholder="项目名称" {...field} />
                    </FormControl>
                    <FormDescription>
                      项目的唯一标识名称
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="projectYear"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>项目年份 *</FormLabel>
                    <Select onValueChange={(value) => field.onChange(parseInt(value))} value={field.value.toString()}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="选择年份" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {yearOptions.map((year) => (
                          <YearOption key={year} year={year} />
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      项目所属的年份
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="bodCategory"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>BOD分类 *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="选择BOD分类" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {bodOptions.map((option) => (
                          <BODCategoryOption
                            key={option.value}
                            value={option.value}
                            label={option.label}
                          />
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      项目的BOD分类
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="budget"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>预算金额</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        placeholder="0.00" 
                        step="0.01"
                        {...field} 
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormDescription>
                      项目的预算金额
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>项目状态 *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="选择状态" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {statusOptions.map((option) => (
                          <ProjectStatusOption
                            key={option.value}
                            value={option.value}
                            label={option.label}
                          />
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      项目的当前状态
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="eventDate"
                render={({ field }) => (
                  <DatePickerField field={field} label="活动日期" />
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>项目描述</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="项目的详细描述..." 
                      className="resize-none"
                      {...field} 
                    />
                  </FormControl>
                  <FormDescription>
                      项目的详细说明（可选）
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="assignedToUid"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>负责人UID</FormLabel>
                  <FormControl>
                    <Input placeholder="负责人用户ID（可选）" {...field} />
                  </FormControl>
                  <FormDescription>
                      项目负责人的用户ID
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={handleCancel}>
                取消
              </Button>
              <Button type="submit" disabled={saving}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {submitButtonText}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
} 