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
import type { Transaction } from "@/lib/data"

const importFormSchema = z.object({
  data: z.string().min(1, "请输入要导入的数据"),
  format: z.enum(["csv", "excel", "tsv"], {
    required_error: "请选择数据格式"
  }),
  skipHeader: z.boolean().default(true),
  updateExisting: z.boolean().default(false),
  validateData: z.boolean().default(true)
})

type ImportFormData = z.infer<typeof importFormSchema>

interface ParsedTransaction {
  date: string
  description: string
  description2?: string
  expense: number
  income: number
  status: "Completed" | "Pending" | "Draft"
  reference?: string
  category?: string
  isValid: boolean
  errors: string[]
  isUpdate?: boolean
}

interface TransactionImportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  existingTransactions: Transaction[]
  onImport: (transactions: ParsedTransaction[]) => void
}

export function TransactionImportDialog({
  open,
  onOpenChange,
  existingTransactions,
  onImport
}: TransactionImportDialogProps) {
  const [parsedTransactions, setParsedTransactions] = React.useState<ParsedTransaction[]>([])
  const [isParsing, setIsParsing] = React.useState(false)
  const [parseError, setParseError] = React.useState<string>("")

  const form = useForm<ImportFormData>({
    resolver: zodResolver(importFormSchema),
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
            fields = line.split(',').map(field => field.trim())
        }

        // 验证字段数量
        if (fields.length < 5) {
          errors.push("字段数量不足，需要至少：日期、描述、描述2、支出金额、收入金额")
        }

        const [date, description, description2, expenseStr, incomeStr, status = "Pending", reference = "", category = ""] = fields

        // 验证日期
        if (!date || date.length === 0) {
          errors.push("日期不能为空")
        } else {
          const dateObj = new Date(date)
          if (isNaN(dateObj.getTime())) {
            errors.push("日期格式无效，请使用 YYYY-MM-DD 格式")
          }
        }

        // 验证描述
        if (!description || description.length === 0) {
          errors.push("描述不能为空")
        } else if (description.length > 200) {
          errors.push("描述不能超过200个字符")
        }

        // 验证支出金额
        const expense = parseFloat(expenseStr || "0")
        if (isNaN(expense)) {
          errors.push("支出金额必须是有效数字")
        } else if (expense < 0) {
          errors.push("支出金额不能为负数")
        }

        // 验证收入金额
        const income = parseFloat(incomeStr || "0")
        if (isNaN(income)) {
          errors.push("收入金额必须是有效数字")
        } else if (income < 0) {
          errors.push("收入金额不能为负数")
        }

        // 验证状态
        const validStatuses = ["Completed", "Pending", "Draft"]
        if (status && !validStatuses.includes(status)) {
          errors.push(`状态必须是以下之一: ${validStatuses.join(', ')}`)
        }

        // 检查重复的交易（基于日期、描述和金额）
        const existingTransaction = existingTransactions.find(t => 
          t.date === date && 
          t.description === description && 
          t.expense === expense && 
          t.income === income
        )
        
        if (existingTransaction) {
          if (!updateExisting) {
            errors.push("交易已存在，请勾选'更新现有交易'选项来更新")
          } else {
            console.log(`交易已存在，将更新现有交易`)
          }
        }

        return {
          date: date || "",
          description: description || "",
          description2: description2 || "",
          expense: expense,
          income: income,
          status: (status as any) || "Pending",
          reference: reference || undefined,
          category: category || undefined,
          isValid: errors.length === 0,
          errors,
          isUpdate: existingTransaction ? true : false
        }
      })

      setParsedTransactions(transactions)
    } catch (error) {
      setParseError(error instanceof Error ? error.message : "解析数据时发生错误")
      setParsedTransactions([])
    } finally {
      setIsParsing(false)
    }
  }, [existingTransactions, form])

  // 监听数据变化，自动解析
  React.useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name === "data" || name === "format" || name === "skipHeader") {
        const data = form.getValues("data")
        const format = form.getValues("format")
        const skipHeader = form.getValues("skipHeader")
        
        if (data && data.trim().length > 0) {
          parseData(data, format, skipHeader)
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
    } catch (error) {
      console.error("无法访问剪贴板:", error)
      alert("请手动粘贴数据到文本框中")
    }
  }

  // 处理导入
  const handleImport = () => {
    const validTransactions = parsedTransactions.filter(transaction => transaction.isValid)
    if (validTransactions.length === 0) {
      alert("没有有效的交易数据可以导入")
      return
    }
    
    onImport(validTransactions)
    onOpenChange(false)
    form.reset()
    setParsedTransactions([])
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
                        <FormLabel>更新现有交易</FormLabel>
                        <FormDescription>
                          如果交易已存在，是否更新现有交易
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="validateData"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>验证数据</FormLabel>
                        <FormDescription>
                          导入前验证数据格式和有效性
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
                        placeholder="粘贴您的交易数据，格式：日期,描述,描述2,支出金额,收入金额,状态,参考,分类"
                        className="min-h-[120px] font-mono text-sm"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      支持格式：日期,描述,描述2,支出金额,收入金额,状态,参考,分类
                      <br />
                      示例：2024-01-15,办公室用品,办公用品,245.00,0.00,Pending,INV-001,办公用品
                    </FormDescription>
                    <FormMessage />
                  </div>
                </FormItem>
              )}
            />

            {/* 解析结果 */}
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
                          <Badge variant="outline" className="text-xs">{transaction.status}</Badge>
                          {transaction.category && (
                            <Badge variant="outline" className="text-xs bg-blue-100">{transaction.category}</Badge>
                          )}
                          {transaction.isUpdate && (
                            <Badge variant="secondary" className="text-xs bg-yellow-100 text-yellow-800">更新</Badge>
                          )}
                        </div>
                      ))}
                      {validTransactions.length > 10 && (
                        <div className="text-sm text-muted-foreground">
                          还有 {validTransactions.length - 10} 个交易...
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
                        <div key={index} className="space-y-1 p-2 bg-red-50 rounded">
                          <div className="flex items-center gap-2 text-sm">
                            <XCircle className="h-3 w-3 text-red-600" />
                            <span className="font-mono">{transaction.date}</span>
                            <span className="max-w-20 truncate">{transaction.description}</span>
                            {transaction.description2 && (
                              <span className="max-w-20 truncate text-gray-600">({transaction.description2})</span>
                            )}
                            <span className="text-red-600">-${transaction.expense.toFixed(2)}</span>
                            <span className="text-green-600">+${transaction.income.toFixed(2)}</span>
                            <Badge variant="outline" className="text-xs">{transaction.status}</Badge>
                          </div>
                          <div className="text-xs text-red-600 ml-5">
                            {transaction.errors.join(', ')}
                          </div>
                        </div>
                      ))}
                      {invalidTransactions.length > 5 && (
                        <div className="text-sm text-muted-foreground">
                          还有 {invalidTransactions.length - 5} 个无效交易...
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={handleCancel}>
                取消
              </Button>
              <Button
                type="button"
                onClick={handleImport}
                disabled={validTransactions.length === 0 || isParsing}
                className="flex items-center gap-2"
              >
                <Upload className="h-4 w-4" />
                导入 {validTransactions.length > 0 ? `(${newTransactions.length} 新增, ${updateTransactions.length} 更新)` : ''}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
} 