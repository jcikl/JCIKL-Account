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

export function ProjectFormDialog({
  open,
  onOpenChange,
  project,
  existingProjects,
  onSave
}: ProjectFormDialogProps) {
  const { toast } = useToast()
  const [saving, setSaving] = React.useState(false)

  // 辅助函数：安全地转换日期
  const safeDateConversion = (dateValue: string | { seconds: number; nanoseconds: number } | undefined): Date => {
    if (!dateValue) return new Date()
    
    if (typeof dateValue === 'string') {
      const date = new Date(dateValue)
      return isNaN(date.getTime()) ? new Date() : date
    } else if (dateValue?.seconds) {
      return new Date(dateValue.seconds * 1000)
    }
    
    return new Date()
  }

  // 从projectid中提取年份的辅助函数
  const extractYearFromProjectId = (projectid: string): number => {
    const parts = projectid.split('_')
    if (parts.length >= 3) {
      const year = parseInt(parts[0])
      if (!isNaN(year) && year >= 2020 && year <= 2030) {
        return year
      }
    }
    return new Date().getFullYear()
  }

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

  // 重置表单当项目数据变化时
  React.useEffect(() => {
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
  }, [project, form])

  const handleSubmit = async (data: ProjectFormData) => {
    try {
      setSaving(true)
      
      // 自动生成项目代码，使用项目年份
      const projectCode = generateProjectCode(data.name, data.bodCategory, existingProjects, data.projectYear)
      
      // 添加生成的代码到数据中，确保包含所有必要字段
      const projectDataWithCode = {
        ...data,
        projectid: projectCode
      }
      
      await onSave(projectDataWithCode)
      toast({
        title: project ? "项目更新成功" : "项目创建成功",
        description: project ? "项目信息已更新" : `新项目已创建，代码: ${projectCode}`,
      })
      onOpenChange(false)
    } catch (error) {
      console.error('Error saving project:', error)
      toast({
        title: "操作失败",
        description: `保存项目时出错: ${error}`,
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{project ? "编辑项目" : "新建项目"}</DialogTitle>
          <DialogDescription>
            {project ? "修改项目信息" : "创建新的项目"}
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
                      <Input placeholder="输入项目名称" {...field} />
                    </FormControl>
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
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="2024"
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || new Date().getFullYear())}
                        min={2020}
                        max={2030}
                      />
                    </FormControl>
                    <FormDescription>
                      项目所属年份，用于生成项目代码
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
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="选择BOD分类" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {getBODOptions().map(option => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      项目代码将自动生成: 项目年份_BOD_项目名称
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
                    <FormLabel>项目预算 *</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="0.00"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormDescription>
                      项目的总预算金额
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
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="选择项目状态" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Active">进行中</SelectItem>
                        <SelectItem value="Completed">已完成</SelectItem>
                        <SelectItem value="On Hold">暂停</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="eventDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>活动日期</FormLabel>
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
                              <span>选择活动日期（可选）</span>
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
                            date < new Date("1900-01-01")
                          }
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormDescription>
                      项目活动日期
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
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
                      placeholder="输入项目描述..."
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    项目的详细描述和说明
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={saving}
              >
                取消
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    保存中...
                  </>
                ) : (
                  project ? "更新项目" : "创建项目"
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
} 