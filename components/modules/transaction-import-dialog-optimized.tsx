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
import { Clipboard, Upload, AlertCircle, CheckCircle, XCircle, TrendingUp, TrendingDown, DollarSign } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
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

// 优化的格式选项组件
const FormatOption = React.memo(({ 
  value, 
  label, 
  description 
}: { 
  value: string
  label: string
  description: string 
}) => (
  <SelectItem value={value}>
    <div className="flex flex-col">
      <span className="font-medium">{label}</span>
      <span className="text-xs text-muted-foreground">{description}</span>
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

// 优化的交易验证状态组件
const TransactionValidationStatus = React.memo(({ 
  transaction 
}: { 
  transaction: ParsedTransaction 
}) => (
  <div className="flex items-center space-x-2">
    {transaction.isValid ? (
      <CheckCircle className="h-4 w-4 text-green-600" />
    ) : (
      <XCircle className="h-4 w-4 text-red-600" />
    )}
    <span className={`text-sm ${transaction.isValid ? 'text-green-600' : 'text-red-600'}`}>
      {transaction.date} - {transaction.description}
    </span>
  </div>
))

// 优化的统计卡片组件
const StatCard = React.memo(({ 
  title, 
  value, 
  icon: Icon, 
  color = "" 
}: { 
  title: string
  value: string | number
  icon: React.ComponentType<{ className?: string }>
  color?: string
}) => (
  <Card>
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium">{title}</CardTitle>
      <Icon className={`h-4 w-4 text-muted-foreground ${color}`} />
    </CardHeader>
    <CardContent>
      <div className={`text-2xl font-bold ${color}`}>{value}</div>
    </CardContent>
  </Card>
))

// 优化的交易行组件
const TransactionRow = React.memo(({ 
  transaction 
}: { 
  transaction: ParsedTransaction 
}) => (
  <TableRow>
    <TableCell className="font-medium">{transaction.date}</TableCell>
    <TableCell>{transaction.description}</TableCell>
    <TableCell>
      <Badge variant="outline">{transaction.category || '未分类'}</Badge>
    </TableCell>
    <TableCell className="text-right text-green-600">
      ${transaction.income.toFixed(2)}
    </TableCell>
    <TableCell className="text-right text-red-600">
      ${transaction.expense.toFixed(2)}
    </TableCell>
    <TableCell className="text-right font-medium">
      ${(transaction.income - transaction.expense).toFixed(2)}
    </TableCell>

  </TableRow>
))

export function TransactionImportDialogOptimized({
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

  // 优化的数据解析函数
  const parseData = React.useCallback((data: string, format: string, skipHeader: boolean) => {
    setIsParsing(true)
    setParseError("")
    
    try {
      const lines = data.trim().split('\n')
      if (lines.length === 0) {
        throw new Error("没有找到有效的数据行")
      }

      const dataLines = skipHeader ? lines.slice(1) : lines
      const updateExisting = form.getValues("updateExisting")
      
      const transactions: ParsedTransaction[] = dataLines.map((line, index) => {
        const errors: string[] = []
        let fields: string[]

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
            throw new Error(`不支持的数据格式: ${format}`)
        }

        // 智能解析字段 - 支持多种格式（已移除状态字段）
        let date, description, description2, expenseStr, incomeStr, category, reference
        
        if (fields.length >= 7) {
          // 完整格式：日期,描述,描述2,支出金额,收入金额,项目户口,分类
          [date, description, description2, expenseStr, incomeStr, category, reference] = fields
        } else if (fields.length >= 6) {
          // 简化格式：日期,描述,支出金额,收入金额,项目户口,分类
          [date, description, expenseStr, incomeStr, category, reference] = fields
          description2 = "" // 描述2为空
        } else if (fields.length >= 5) {
          // 最小格式：日期,描述,描述2(可选),支出金额,收入金额(可选)
          [date, description, description2, expenseStr, incomeStr] = fields
          category = "" // 默认分类
          reference = "" // 默认参考
        } else if (fields.length >= 4) {
          // 更小格式：日期,描述,支出金额,收入金额
          [date, description, expenseStr, incomeStr] = fields
          description2 = "" // 描述2为空
          category = "" // 默认分类
          reference = "" // 默认参考
        } else {
          errors.push("数据字段不足，至少需要日期、描述、支出金额")
          date = fields[0] || ""
          description = fields[1] || ""
          description2 = fields[2] || ""
          expenseStr = fields[3] || ""
          incomeStr = fields[4] || ""
          category = ""
          reference = ""
        }

        // 验证必填字段
        if (!date) errors.push("日期不能为空")
        if (!description) errors.push("描述不能为空")
        if (!expenseStr && !incomeStr) errors.push("支出或收入至少填写一项")

        // 验证日期格式
        if (date && isNaN(Date.parse(date))) {
          errors.push("日期格式无效")
        }

        // 验证金额
        const expense = parseFloat(expenseStr) || 0
        const income = parseFloat(incomeStr) || 0
        
        if (expense < 0) errors.push("支出不能为负数")
        if (income < 0) errors.push("收入不能为负数")

        // 检查重复交易
        const existingTransaction = existingTransactions.find(t => 
          t.date === date && t.description === description && 
          t.income === income && t.expense === expense
        )
        if (existingTransaction && !updateExisting) {
          errors.push("交易记录已存在")
        }

        return {
          date: date || '',
          description: description || '',
          description2: description2 || '',
          income,
          expense,
          status: "Completed" as const,
          category: category || '',
          reference: reference || '',
          isValid: errors.length === 0,
          errors,
          isUpdate: existingTransaction && updateExisting
        }
      })

      setParsedTransactions(transactions)
      setParseError("")
    } catch (error) {
      setParseError(error instanceof Error ? error.message : "解析数据时发生错误")
      setParsedTransactions([])
    } finally {
      setIsParsing(false)
    }
  }, [existingTransactions, form])

  // 优化的粘贴处理
  const handlePaste = React.useCallback(async () => {
    try {
      const text = await navigator.clipboard.readText()
      form.setValue("data", text)
      const format = form.getValues("format")
      const skipHeader = form.getValues("skipHeader")
      parseData(text, format, skipHeader)
    } catch (error) {
      console.error('粘贴失败:', error)
      setParseError("无法从剪贴板读取数据")
    }
  }, [form, parseData])

  // 优化的导入处理
  const handleImport = React.useCallback(() => {
    const validTransactions = parsedTransactions.filter(transaction => transaction.isValid)
    if (validTransactions.length > 0) {
      onImport(validTransactions)
      onOpenChange(false)
      // 延迟重置表单
      setTimeout(() => {
        form.reset()
        setParsedTransactions([])
        setParseError("")
      }, 100)
    }
  }, [parsedTransactions, onImport, onOpenChange, form])

  // 优化的取消处理
  const handleCancel = React.useCallback(() => {
    onOpenChange(false)
    // 延迟重置表单
    setTimeout(() => {
      form.reset()
      setParsedTransactions([])
      setParseError("")
    }, 100)
  }, [onOpenChange, form])

  // 优化的格式选项
  const formatOptions = React.useMemo(() => [
    { value: "csv", label: "CSV", description: "逗号分隔值格式" },
    { value: "tsv", label: "TSV", description: "制表符分隔值格式" },
    { value: "excel", label: "Excel", description: "Excel表格格式" }
  ], [])

  // 优化的统计数据
  const stats = React.useMemo(() => {
    const total = parsedTransactions.length
    const valid = parsedTransactions.filter(t => t.isValid).length
    const invalid = total - valid
    const updates = parsedTransactions.filter(t => t.isUpdate).length
    const newTransactions = valid - updates

    const totalIncome = validTransactions.reduce((sum, t) => sum + t.income, 0)
    const totalExpense = validTransactions.reduce((sum, t) => sum + t.expense, 0)
    const netAmount = totalIncome - totalExpense

    return { 
      total, 
      valid, 
      invalid, 
      updates, 
      newTransactions,
      totalIncome,
      totalExpense,
      netAmount
    }
  }, [parsedTransactions])

  // 优化的有效交易列表
  const validTransactions = React.useMemo(() => 
    parsedTransactions.filter(transaction => transaction.isValid), 
    [parsedTransactions]
  )

  // 优化的无效交易列表
  const invalidTransactions = React.useMemo(() => 
    parsedTransactions.filter(transaction => !transaction.isValid), 
    [parsedTransactions]
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>导入交易数据</DialogTitle>
          <DialogDescription>
            从剪贴板或文件导入交易数据，支持CSV、TSV和Excel格式
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
                        {formatOptions.map((option) => (
                          <FormatOption
                            key={option.value}
                            value={option.value}
                            label={option.label}
                            description={option.description}
                          />
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      选择要导入的数据格式
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="space-y-4">
                <CheckboxOption
                  control={form.control}
                  name="skipHeader"
                  label="跳过标题行"
                  description="如果数据包含标题行，请勾选此项"
                />

                <CheckboxOption
                  control={form.control}
                  name="updateExisting"
                  label="更新现有交易"
                  description="如果交易记录已存在，更新现有记录"
                />

                <CheckboxOption
                  control={form.control}
                  name="validateData"
                  label="验证数据"
                  description="导入前验证数据格式和完整性"
                />
              </div>
            </div>

            <FormField
              control={form.control}
              name="data"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>数据内容</FormLabel>
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handlePaste}
                        disabled={isParsing}
                      >
                        <Clipboard className="h-4 w-4 mr-2" />
                        从剪贴板粘贴
                      </Button>
                    </div>
                    <FormControl>
                      <Textarea
                        placeholder="粘贴或输入要导入的数据..."
                        className="min-h-[200px] font-mono text-sm"
                        {...field}
                        onChange={(e) => {
                          field.onChange(e)
                          const format = form.getValues("format")
                          const skipHeader = form.getValues("skipHeader")
                          parseData(e.target.value, format, skipHeader)
                        }}
                      />
                    </FormControl>
                  </div>
                  <FormDescription>
                                            支持格式：日期,描述,描述2,支出金额,收入金额,项目户口,分类
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {parseError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{parseError}</AlertDescription>
              </Alert>
            )}

            {parsedTransactions.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">解析结果</h3>
                  <div className="flex gap-2">
                    <StatCard
                      title="总计"
                      value={stats.total}
                      icon={Upload}
                    />
                    <StatCard
                      title="有效"
                      value={stats.valid}
                      icon={CheckCircle}
                      color="text-green-600"
                    />
                    <StatCard
                      title="无效"
                      value={stats.invalid}
                      icon={XCircle}
                      color="text-red-600"
                    />
                    <StatCard
                      title="新增"
                      value={stats.newTransactions}
                      icon={Upload}
                      color="text-blue-600"
                    />
                    <StatCard
                      title="更新"
                      value={stats.updates}
                      icon={Upload}
                      color="text-orange-600"
                    />
                  </div>
                </div>

                {/* 金额统计 */}
                {validTransactions.length > 0 && (
                  <div className="grid grid-cols-3 gap-4">
                    <StatCard
                      title="总收入"
                      value={`$${stats.totalIncome.toFixed(2)}`}
                      icon={TrendingUp}
                      color="text-green-600"
                    />
                    <StatCard
                      title="总支出"
                      value={`$${stats.totalExpense.toFixed(2)}`}
                      icon={TrendingDown}
                      color="text-red-600"
                    />
                    <StatCard
                      title="净额"
                      value={`$${stats.netAmount.toFixed(2)}`}
                      icon={DollarSign}
                      color={stats.netAmount >= 0 ? "text-green-600" : "text-red-600"}
                    />
                  </div>
                )}

                {validTransactions.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-medium text-green-600">有效交易 ({validTransactions.length})</h4>
                    <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto">
                      {validTransactions.map((transaction, index) => (
                        <TransactionValidationStatus key={index} transaction={transaction} />
                      ))}
                    </div>
                  </div>
                )}

                {invalidTransactions.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-medium text-red-600">无效交易 ({invalidTransactions.length})</h4>
                    <div className="space-y-1 max-h-32 overflow-y-auto">
                      {invalidTransactions.map((transaction, index) => (
                        <div key={index} className="text-sm">
                          <div className="flex items-center space-x-2">
                            <XCircle className="h-4 w-4 text-red-600" />
                            <span className="text-red-600">{transaction.date} - {transaction.description}</span>
                          </div>
                          <div className="ml-6 text-xs text-red-500">
                            {transaction.errors.join(', ')}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 交易预览表格 */}
                {validTransactions.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>交易预览</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>日期</TableHead>
                            <TableHead>描述</TableHead>
                            <TableHead>分类</TableHead>
                            <TableHead className="text-right">收入</TableHead>
                            <TableHead className="text-right">支出</TableHead>
                            <TableHead className="text-right">净额</TableHead>
        
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {validTransactions.slice(0, 10).map((transaction, index) => (
                            <TransactionRow key={index} transaction={transaction} />
                          ))}
                        </TableBody>
                      </Table>
                      {validTransactions.length > 10 && (
                        <p className="text-sm text-muted-foreground mt-2">
                          显示前10条记录，共{validTransactions.length}条
                        </p>
                      )}
                    </CardContent>
                  </Card>
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
              >
                <Upload className="h-4 w-4 mr-2" />
                导入 {validTransactions.length > 0 ? `(${validTransactions.length} 条交易)` : ''}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
} 