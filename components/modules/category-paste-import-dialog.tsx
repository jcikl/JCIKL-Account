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
import type { Category } from "@/lib/data"

const categoryPasteImportFormSchema = z.object({
  data: z.string().min(1, "请输入要导入的数据"),
  format: z.enum(["csv", "tsv", "excel"], {
    required_error: "请选择数据格式"
  }),
  skipHeader: z.boolean().default(true),
  updateExisting: z.boolean().default(false),
  validateData: z.boolean().default(true)
})

type CategoryPasteImportFormData = z.infer<typeof categoryPasteImportFormSchema>

interface ParsedCategory {
  code: string
  name: string
  type: "Income" | "Expense"
  description?: string
  isActive: boolean
  isValid: boolean
  errors: string[]
  isUpdate?: boolean
}

interface CategoryPasteImportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  existingCategories: Category[]
  onImport: (categories: ParsedCategory[]) => void
}

export function CategoryPasteImportDialog({
  open,
  onOpenChange,
  existingCategories,
  onImport
}: CategoryPasteImportDialogProps) {
  const { toast } = useToast()
  const [parsedCategories, setParsedCategories] = React.useState<ParsedCategory[]>([])
  const [isParsing, setIsParsing] = React.useState(false)
  const [parseError, setParseError] = React.useState<string>("")

  const form = useForm<CategoryPasteImportFormData>({
    resolver: zodResolver(categoryPasteImportFormSchema),
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
      
      // 获取当前表单的更新现有分类选项
      const updateExisting = form.getValues("updateExisting")
      
      const categories: ParsedCategory[] = dataLines.map((line, index) => {
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

        // 检查字段数量
        if (fields.length < 3) {
          errors.push(`字段数量不足，需要至少3个字段，当前只有${fields.length}个`)
        }

        // 解析各个字段
        const [code, name, typeStr, description, isActiveStr] = fields

        // 验证分类代码
        if (!code || code.trim() === "") {
          errors.push("分类代码不能为空")
        }

        // 验证分类名称
        if (!name || name.trim() === "") {
          errors.push("分类名称不能为空")
        }

        // 验证分类类型
        let type: "Income" | "Expense" = "Expense"
        if (typeStr) {
          const typeLower = typeStr.toLowerCase()
          if (typeLower === "income" || typeLower === "收入") {
            type = "Income"
          } else if (typeLower === "expense" || typeLower === "支出") {
            type = "Expense"
          } else {
            errors.push("分类类型无效，应为 Income/Expense")
          }
        }

        // 验证是否启用
        let isActive = true
        if (isActiveStr) {
          const isActiveLower = isActiveStr.toLowerCase()
          if (isActiveLower === "false" || isActiveLower === "否" || isActiveLower === "0") {
            isActive = false
          } else if (isActiveLower === "true" || isActiveLower === "是" || isActiveLower === "1") {
            isActive = true
          } else {
            errors.push("启用状态格式无效，应为 true/false")
          }
        }

        // 检查是否为更新现有分类
        let isUpdate = false
        if (updateExisting && code) {
          const existingCategory = existingCategories.find(c => c.code === code)
          if (existingCategory) {
            isUpdate = true
          }
        }

        return {
          code: code || "",
          name: name || "",
          type,
          description: description || "",
          isActive,
          isValid: errors.length === 0,
          errors,
          isUpdate
        }
      })

      setParsedCategories(categories)
      console.log(`解析完成，共${categories.length}条记录`)
    } catch (error: any) {
      setParseError(error.message || "解析数据时发生错误")
      console.error("解析错误:", error)
    } finally {
      setIsParsing(false)
    }
  }, [form, existingCategories])

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
    const validCategories = parsedCategories.filter(category => category.isValid)
    if (validCategories.length === 0) {
      toast({
        title: "导入失败",
        description: "没有有效的分类数据可以导入",
        variant: "destructive",
      })
      return
    }
    
    onImport(validCategories)
    onOpenChange(false)
    form.reset()
    setParsedCategories([])
    toast({
      title: "导入成功",
      description: `成功导入 ${validCategories.length} 个分类`,
    })
  }

  const handleCancel = () => {
    onOpenChange(false)
    form.reset()
    setParsedCategories([])
    setParseError("")
  }

  const validCategories = parsedCategories.filter(category => category.isValid)
  const invalidCategories = parsedCategories.filter(category => !category.isValid)
  const newCategories = validCategories.filter(category => !category.isUpdate)
  const updateCategories = validCategories.filter(category => category.isUpdate)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>粘贴导入分类数据</DialogTitle>
          <DialogDescription>
            从剪贴板粘贴分类数据，支持CSV、TSV和Excel格式
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
                          如果找到相同的分类代码，将更新而不是创建新记录
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
                  <FormLabel>分类数据 *</FormLabel>
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
                        placeholder="粘贴您的分类数据，格式：分类代码,分类名称,分类类型,描述,是否启用"
                        className="min-h-[120px] font-mono text-sm"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      支持格式：分类代码,分类名称,分类类型,描述,是否启用
                      <br />
                      示例：EXP001,办公用品,Expense,办公用品和文具费用,true
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

            {parsedCategories.length > 0 && !isParsing && (
              <div className="space-y-4">
                <Separator />
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-medium">解析结果</h4>
                  <div className="flex gap-2">
                    <Badge variant="default" className="flex items-center gap-1">
                      <CheckCircle className="h-3 w-3" />
                      {validCategories.length} 个有效
                    </Badge>
                    {newCategories.length > 0 && (
                      <Badge variant="default" className="flex items-center gap-1 bg-green-100 text-green-800">
                        <CheckCircle className="h-3 w-3" />
                        {newCategories.length} 个新增
                      </Badge>
                    )}
                    {updateCategories.length > 0 && (
                      <Badge variant="secondary" className="flex items-center gap-1 bg-yellow-100 text-yellow-800">
                        <CheckCircle className="h-3 w-3" />
                        {updateCategories.length} 个更新
                      </Badge>
                    )}
                    {invalidCategories.length > 0 && (
                      <Badge variant="destructive" className="flex items-center gap-1">
                        <XCircle className="h-3 w-3" />
                        {invalidCategories.length} 个无效
                      </Badge>
                    )}
                  </div>
                </div>

                {/* 有效分类预览 */}
                {validCategories.length > 0 && (
                  <div className="space-y-2">
                    <h5 className="text-sm font-medium text-green-600">有效分类</h5>
                    <div className="max-h-40 overflow-y-auto space-y-1">
                      {validCategories.slice(0, 10).map((category, index) => (
                        <div key={index} className="flex items-center gap-2 text-sm p-2 bg-green-50 rounded">
                          <CheckCircle className="h-3 w-3 text-green-600" />
                          <span className="font-mono text-xs">{category.code}</span>
                          <span className="font-medium">{category.name}</span>
                          <Badge variant="outline" className="text-xs">
                            {category.type === "Income" ? "收入" : "支出"}
                          </Badge>
                          <Badge variant={category.isActive ? "default" : "secondary"} className="text-xs">
                            {category.isActive ? "启用" : "禁用"}
                          </Badge>
                          {category.isUpdate && (
                            <Badge variant="secondary" className="text-xs">更新</Badge>
                          )}
                        </div>
                      ))}
                      {validCategories.length > 10 && (
                        <div className="text-xs text-gray-500 text-center">
                          还有 {validCategories.length - 10} 条记录...
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* 无效分类预览 */}
                {invalidCategories.length > 0 && (
                  <div className="space-y-2">
                    <h5 className="text-sm font-medium text-red-600">无效分类</h5>
                    <div className="max-h-40 overflow-y-auto space-y-1">
                      {invalidCategories.slice(0, 5).map((category, index) => (
                        <div key={index} className="flex items-start gap-2 text-sm p-2 bg-red-50 rounded">
                          <XCircle className="h-3 w-3 text-red-600 mt-0.5" />
                          <div className="flex-1">
                            <div className="font-medium">{category.name || "无名称"}</div>
                            <div className="text-xs text-red-600">
                              {category.errors.join(", ")}
                            </div>
                          </div>
                        </div>
                      ))}
                      {invalidCategories.length > 5 && (
                        <div className="text-xs text-gray-500 text-center">
                          还有 {invalidCategories.length - 5} 条无效记录...
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
                disabled={validCategories.length === 0 || isParsing}
              >
                导入 {validCategories.length > 0 ? `(${validCategories.length} 个)` : ""}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
} 