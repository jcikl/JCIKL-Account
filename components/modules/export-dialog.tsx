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

export function ExportDialog({
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

  const onSubmit = (data: ExportFormData) => {
    onExport(data)
    onOpenChange(false)
  }

  const handleCancel = () => {
    onOpenChange(false)
  }

  const getFormatIcon = (format: string) => {
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
  }

  const getFormatDescription = (format: string) => {
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
  }

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
                      <SelectItem value="csv">
                        <div className="flex items-center space-x-2">
                          {getFormatIcon("csv")}
                          <span>CSV 文件</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="excel">
                        <div className="flex items-center space-x-2">
                          {getFormatIcon("excel")}
                          <span>Excel 文件</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="pdf">
                        <div className="flex items-center space-x-2">
                          {getFormatIcon("pdf")}
                          <span>PDF 文档</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    {getFormatDescription(form.watch("format"))}
                  </FormDescription>
                </FormItem>
              )}
            />

            <div className="space-y-4">
              <FormField
                control={form.control}
                name="includeStats"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>包含统计信息</FormLabel>
                      <FormDescription>
                        导出总账户数、总余额等统计信息
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="includeTypeDistribution"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>包含类型分布</FormLabel>
                      <FormDescription>
                        导出账户类型分布图表
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="includeDetails"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>包含详细信息</FormLabel>
                      <FormDescription>
                        导出完整的账户列表和详细信息
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />

              {selectedAccounts.size > 0 && (
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
                          仅导出已选择的 {selectedAccounts.size} 个账户
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