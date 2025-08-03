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
import type { Transaction } from "@/lib/data"

const pasteImportFormSchema = z.object({
  data: z.string().min(1, "请输入要导入的数据"),
  format: z.enum(["csv", "tsv", "excel"], {
    required_error: "请选择数据格式"
  }),
  skipHeader: z.boolean().default(true),
  updateExisting: z.boolean().default(false),
  validateData: z.boolean().default(true)
})

type PasteImportFormData = z.infer<typeof pasteImportFormSchema>

interface ParsedTransaction {
  date: string
  description: string
  description2?: string
  expense: number
  income: number
  status: "Completed" | "Pending" | "Draft"
  projectid?: string
  category?: string
  isValid: boolean
  errors: string[]
  isUpdate?: boolean
}

interface PasteImportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  existingTransactions: Transaction[]
  onImport: (transactions: ParsedTransaction[]) => void
}

export function PasteImportDialog({
  open,
  onOpenChange,
  existingTransactions,
  onImport
}: PasteImportDialogProps) {
  const { toast } = useToast()
  const [parsedTransactions, setParsedTransactions] = React.useState<ParsedTransaction[]>([])
  const [isParsing, setIsParsing] = React.useState(false)
  const [parseError, setParseError] = React.useState<string>("")

  const form = useForm<PasteImportFormData>({
    resolver: zodResolver(pasteImportFormSchema),
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
      
      // 获取当前表单的更新现有交易选项
      const updateExisting = form.getValues("updateExisting")
      
      const transactions: ParsedTransaction[] = dataLines.map((line, index) => {
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

        // 智能解析字段 - 支持多种格式
        let dateStr, description, description2, expenseStr, incomeStr, statusStr, projectid, category
        
        if (fields.length >= 8) {
          // 完整格式：日期,描述,描述2,支出金额,收入金额,状态,项目户口,分类
          [dateStr, description, description2, expenseStr, incomeStr, statusStr, projectid, category] = fields
        } else if (fields.length >= 7) {
          // 简化格式：日期,描述,支出金额,收入金额,状态,项目户口,分类
          [dateStr, description, expenseStr, incomeStr, statusStr, projectid, category] = fields
          description2 = "" // 描述2为空
        } else if (fields.length >= 5) {
          // 最小格式：日期,描述,描述2(可选),支出金额,收入金额(可选)
          [dateStr, description, description2, expenseStr, incomeStr] = fields
          statusStr = "Pending" // 默认状态
          projectid = "" // 默认项目户口
          category = "" // 默认分类
        } else {
          // 字段严重不足的情况
          dateStr = fields[0] || ""
          description = fields[1] || ""
          description2 = fields[2] || ""
          expenseStr = fields[3] || ""
          incomeStr = fields[4] || ""
          statusStr = "Pending" // 默认状态
          projectid = "" // 默认项目户口
          category = "" // 默认分类
          
          if (fields.length < 3) {
            errors.push(`字段数量严重不足，需要至少3个字段（日期、描述、支出金额），当前只有${fields.length}个`)
          }
        }

        // 验证日期
        let date = ""
        if (dateStr) {
          const parsedDate = new Date(dateStr)
          if (isNaN(parsedDate.getTime())) {
            errors.push("日期格式无效")
          } else {
            // 使用本地时区格式化日期，避免时区偏移问题
            const year = parsedDate.getFullYear()
            const month = String(parsedDate.getMonth() + 1).padStart(2, '0')
            const day = String(parsedDate.getDate()).padStart(2, '0')
            date = `${year}-${month}-${day}`
          }
        } else {
          errors.push("日期不能为空")
        }

        // 验证描述
        if (!description || description.trim() === "") {
          errors.push("描述不能为空")
        }

        // 验证金额
        let expense = 0
        let income = 0
        
        if (expenseStr) {
          const parsedExpense = parseFloat(expenseStr)
          if (isNaN(parsedExpense)) {
            errors.push("支出金额格式无效")
          } else {
            expense = parsedExpense
          }
        }

        if (incomeStr) {
          const parsedIncome = parseFloat(incomeStr)
          if (isNaN(parsedIncome)) {
            errors.push("收入金额格式无效")
          } else {
            income = parsedIncome
          }
        }

        // 验证状态
        let status: "Completed" | "Pending" | "Draft" = "Pending"
        if (statusStr) {
          const statusLower = statusStr.toLowerCase()
          if (statusLower === "completed" || statusLower === "已完成") {
            status = "Completed"
          } else if (statusLower === "pending" || statusLower === "待处理") {
            status = "Pending"
          } else if (statusLower === "draft" || statusLower === "草稿") {
            status = "Draft"
          } else {
            errors.push("状态格式无效，应为 Completed/Pending/Draft")
          }
        }

        // 检查是否为更新现有交易
        let isUpdate = false
        if (updateExisting && description) {
          const existingTransaction = existingTransactions.find(t => 
            t.description === description && 
            t.date === date
          )
          if (existingTransaction) {
            isUpdate = true
          }
        }

        return {
          date,
          description: description || "",
          description2: description2 || "",
          expense,
          income,
          status,
          projectid: projectid || "",
          category: category || "",
          isValid: errors.length === 0,
          errors,
          isUpdate
        }
      })

      setParsedTransactions(transactions)
      console.log(`解析完成，共${transactions.length}条记录`)
    } catch (error: any) {
      setParseError(error.message || "解析数据时发生错误")
      console.error("解析错误:", error)
    } finally {
      setIsParsing(false)
    }
  }, [form, existingTransactions])

  // 监听表单数据变化，自动解析
  React.useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name === "data" || name === "format" || name === "skipHeader") {
        if (value.data && value.format) {
          parseData(value.data, value.format, value.skipHeader ?? true)
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
    const validTransactions = parsedTransactions.filter(transaction => transaction.isValid)
    if (validTransactions.length === 0) {
      toast({
        title: "导入失败",
        description: "没有有效的交易数据可以导入",
        variant: "destructive",
      })
      return
    }
    
    onImport(validTransactions)
    onOpenChange(false)
    form.reset()
    setParsedTransactions([])
    toast({
      title: "导入成功",
      description: `成功导入 ${validTransactions.length} 条交易记录`,
    })
  }

  const handleCancel = () => {
    onOpenChange(false)
    form.reset()
    setParsedTransactions([])
    setParseError("")
  }

  const validTransactions = parsedTransactions.filter(transaction => transaction.isValid)
  const invalidTransactions = parsedTransactions.filter(transaction => !transaction.isValid)
  const newTransactions = validTransactions.filter(transaction => !transaction.isUpdate)
  const updateTransactions = validTransactions.filter(transaction => transaction.isUpdate)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>粘贴导入交易数据</DialogTitle>
          <DialogDescription>
            从剪贴板粘贴交易数据，支持CSV、TSV和Excel格式
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
                          如果找到相同的交易记录，将更新而不是创建新记录
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
                  <FormLabel>交易数据 *</FormLabel>
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
                        placeholder="粘贴您的交易数据，格式：日期,描述,描述2,支出金额,收入金额,状态,项目户口,分类"
                        className="min-h-[120px] font-mono text-sm"
                        {...field}
                      />
                    </FormControl>
                                         <FormDescription>
                       支持多种格式：
                       <br />
                       • 完整格式：日期,描述,描述2,支出金额,收入金额,状态,项目户口,分类
                       <br />
                       • 简化格式：日期,描述,支出金额,收入金额,状态,项目户口,分类
                       <br />
                       • 最小格式：日期,描述,描述2(可选),支出金额,收入金额(可选)
                       <br />
                       示例：2024-01-15,办公室用品,办公用品,245.00,0.00,Pending,项目A,办公用品
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

            {parsedTransactions.length > 0 && !isParsing && (
              <div className="space-y-4">
                <Separator />
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-medium">解析结果</h4>
                  <div className="flex gap-2">
                    <Badge variant="default" className="flex items-center gap-1">
                      <CheckCircle className="h-3 w-3" />
                      {validTransactions.length} 个有效
                    </Badge>
                    {newTransactions.length > 0 && (
                      <Badge variant="default" className="flex items-center gap-1 bg-green-100 text-green-800">
                        <CheckCircle className="h-3 w-3" />
                        {newTransactions.length} 个新增
                      </Badge>
                    )}
                    {updateTransactions.length > 0 && (
                      <Badge variant="secondary" className="flex items-center gap-1 bg-yellow-100 text-yellow-800">
                        <CheckCircle className="h-3 w-3" />
                        {updateTransactions.length} 个更新
                      </Badge>
                    )}
                    {invalidTransactions.length > 0 && (
                      <Badge variant="destructive" className="flex items-center gap-1">
                        <XCircle className="h-3 w-3" />
                        {invalidTransactions.length} 个无效
                      </Badge>
                    )}
                  </div>
                </div>

                {/* 有效交易预览 */}
                {validTransactions.length > 0 && (
                  <div className="space-y-2">
                    <h5 className="text-sm font-medium text-green-600">有效交易</h5>
                    <div className="max-h-40 overflow-y-auto space-y-1">
                      {validTransactions.slice(0, 10).map((transaction, index) => (
                        <div key={index} className="flex items-center gap-2 text-sm p-2 bg-green-50 rounded">
                          <CheckCircle className="h-3 w-3 text-green-600" />
                          <span className="font-mono">{transaction.date}</span>
                          <span className="max-w-20 truncate">{transaction.description}</span>
                          {transaction.description2 && (
                            <span className="max-w-20 truncate text-gray-600">({transaction.description2})</span>
                          )}
                          <span className="text-red-600">-${transaction.expense.toFixed(2)}</span>
                          <span className="text-green-600">+${transaction.income.toFixed(2)}</span>
                          <Badge variant="outline" className="text-xs">
                            {transaction.status === "Completed" ? "已完成" : 
                             transaction.status === "Pending" ? "待处理" : "草稿"}
                          </Badge>
                          {transaction.isUpdate && (
                            <Badge variant="secondary" className="text-xs">更新</Badge>
                          )}
                        </div>
                      ))}
                      {validTransactions.length > 10 && (
                        <div className="text-xs text-gray-500 text-center">
                          还有 {validTransactions.length - 10} 条记录...
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* 无效交易预览 */}
                {invalidTransactions.length > 0 && (
                  <div className="space-y-2">
                    <h5 className="text-sm font-medium text-red-600">无效交易</h5>
                    <div className="max-h-40 overflow-y-auto space-y-1">
                      {invalidTransactions.slice(0, 5).map((transaction, index) => (
                        <div key={index} className="flex items-start gap-2 text-sm p-2 bg-red-50 rounded">
                          <XCircle className="h-3 w-3 text-red-600 mt-0.5" />
                          <div className="flex-1">
                            <div className="font-mono">{transaction.date || "无日期"}</div>
                            <div className="text-xs text-red-600">
                              {transaction.errors.join(", ")}
                            </div>
                          </div>
                        </div>
                      ))}
                      {invalidTransactions.length > 5 && (
                        <div className="text-xs text-gray-500 text-center">
                          还有 {invalidTransactions.length - 5} 条无效记录...
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
                disabled={validTransactions.length === 0 || isParsing}
              >
                导入 {validTransactions.length > 0 ? `(${validTransactions.length} 条)` : ""}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
} 