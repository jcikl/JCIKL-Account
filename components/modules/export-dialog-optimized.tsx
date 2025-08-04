"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel } from "@/components/ui/form"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Download, FileText, FileSpreadsheet, FileType } from "lucide-react"
import type { Account } from "@/lib/data"

const exportFormSchema = z.object({
  format: z.enum(["csv", "excel", "pdf"], {
    required_error: "请选择导出格式"
  }),
  includeStats: z.boolean().default(true),
  includeTypeDistribution: z.boolean().default(true),
  includeDetails: z.boolean().default(true),
  selectedAccountsOnly: z.boolean().default(false)
})

type ExportFormData = z.infer<typeof exportFormSchema>

interface ExportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  accounts: Account[]
  selectedAccounts: Set<string>
  onExport: (data: ExportFormData) => void
}

// 优化的格式选项组件
const FormatOption = React.memo(({ 
  value, 
  icon, 
  label 
}: { 
  value: string
  icon: React.ReactNode
  label: string 
}) => (
  <SelectItem value={value}>
    <div className="flex items-center space-x-2">
      {icon}
      <span>{label}</span>
    </div>
  </SelectItem>
))

// 优化的复选框选项组件
const CheckboxOption = React.memo(({
  control,
  name,
  label,
  description
}: {
  control: any
  name: string
  label: string
  description: string
}) => (
  <FormField
    control={control}
    name={name}
    render={({ field }) => (
      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
        <FormControl>
          <Checkbox
            checked={field.value}
            onCheckedChange={field.onChange}
          />
        </FormControl>
        <div className="space-y-1 leading-none">
          <FormLabel>{label}</FormLabel>
          <FormDescription>
            {description}
          </FormDescription>
        </div>
      </FormItem>
    )}
  />
))

export function ExportDialogOptimized({
  open,
  onOpenChange,
  accounts,
  selectedAccounts,
  onExport
}: ExportDialogProps) {
  const form = useForm<ExportFormData>({
    resolver: zodResolver(exportFormSchema),
    defaultValues: {
      format: "excel",
      includeStats: true,
      includeTypeDistribution: true,
      includeDetails: true,
      selectedAccountsOnly: false
    }
  })

  // 优化的提交处理
  const onSubmit = React.useCallback((data: ExportFormData) => {
    onExport(data)
    onOpenChange(false)
  }, [onExport, onOpenChange])

  // 优化的取消处理
  const handleCancel = React.useCallback(() => {
    onOpenChange(false)
  }, [onOpenChange])

  // 优化的格式图标获取
  const getFormatIcon = React.useCallback((format: string) => {
    switch (format) {
      case "csv":
        return <FileText className="h-4 w-4" />
      case "excel":
        return <FileSpreadsheet className="h-4 w-4" />
      case "pdf":
        return <FileType className="h-4 w-4" />
      default:
        return <Download className="h-4 w-4" />
    }
  }, [])

  // 优化的格式描述获取
  const getFormatDescription = React.useCallback((format: string) => {
    switch (format) {
      case "csv":
        return "逗号分隔值文件，适合数据分析和导入其他系统"
      case "excel":
        return "Excel文件，包含格式化和图表，适合报告和演示"
      case "pdf":
        return "PDF文档，适合打印和正式报告"
      default:
        return ""
    }
  }, [])

  // 优化的格式选项
  const formatOptions = React.useMemo(() => [
    { value: "csv", icon: getFormatIcon("csv"), label: "CSV 文件" },
    { value: "excel", icon: getFormatIcon("excel"), label: "Excel 文件" },
    { value: "pdf", icon: getFormatIcon("pdf"), label: "PDF 文档" }
  ], [getFormatIcon])

  // 优化的当前格式描述
  const currentFormatDescription = React.useMemo(() => 
    getFormatDescription(form.watch("format")), 
    [form.watch("format"), getFormatDescription]
  )

  // 优化的选中账户数量
  const selectedAccountsCount = React.useMemo(() => 
    selectedAccounts.size, 
    [selectedAccounts.size]
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>导出账户数据</DialogTitle>
          <DialogDescription>
            选择导出格式和包含的内容
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="format"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>导出格式 *</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="选择导出格式" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {formatOptions.map((option) => (
                        <FormatOption
                          key={option.value}
                          value={option.value}
                          icon={option.icon}
                          label={option.label}
                        />
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    {currentFormatDescription}
                  </FormDescription>
                </FormItem>
              )}
            />

            <div className="space-y-4">
              <CheckboxOption
                control={form.control}
                name="includeStats"
                label="包含统计信息"
                description="导出总账户数、总余额等统计信息"
              />

              <CheckboxOption
                control={form.control}
                name="includeTypeDistribution"
                label="包含类型分布"
                description="导出账户类型分布图表"
              />

              <CheckboxOption
                control={form.control}
                name="includeDetails"
                label="包含详细信息"
                description="导出完整的账户列表和详细信息"
              />

              {selectedAccountsCount > 0 && (
                <FormField
                  control={form.control}
                  name="selectedAccountsOnly"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>仅导出选中账户</FormLabel>
                        <FormDescription>
                          仅导出已选择的 {selectedAccountsCount} 个账户
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />
              )}
            </div>

            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={handleCancel}>
                取消
              </Button>
              <Button type="submit">
                <Download className="h-4 w-4 mr-2" />
                导出数据
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
} 