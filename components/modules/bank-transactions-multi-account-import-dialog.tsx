"use client"

import * as React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  Upload, 
  FileText, 
  AlertCircle, 
  CheckCircle, 
  XCircle, 
  RefreshCw,
  Download,
  Copy,
  Clipboard
} from "lucide-react"
import type { Transaction, BankAccount } from "@/lib/data"
import { useAuth } from "@/components/auth/auth-context"
import { useToast } from "@/hooks/use-toast"

// 导入表单数据验证模式
const importFormSchema = z.object({
  data: z.string().min(1, "请输入数据"),
  format: z.enum(["csv", "tsv", "excel"]),
  skipHeader: z.boolean(),
  updateExisting: z.boolean(),
  validateData: z.boolean(),
  bankAccountId: z.string().min(1, "请选择银行账户")
})

type ImportFormData = z.infer<typeof importFormSchema>

// 解析后的交易数据接口
interface ParsedTransaction {
  date: string
  description: string
  description2?: string
  expense: number
  income: number
  status: "Completed" | "Pending" | "Draft"
  payer?: string
  projectid?: string
  projectName?: string
  category?: string
  bankAccountId: string
  isValid: boolean
  errors: string[]
  isUpdate?: boolean
  originalId?: string
}

interface BankTransactionsMultiAccountImportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  existingTransactions: Transaction[]
  bankAccounts: BankAccount[]
  selectedBankAccountId: string
  onImport: (transactions: ParsedTransaction[]) => void
}

export function BankTransactionsMultiAccountImportDialog({
  open,
  onOpenChange,
  existingTransactions,
  bankAccounts,
  selectedBankAccountId,
  onImport
}: BankTransactionsMultiAccountImportDialogProps) {
  const [parsedTransactions, setParsedTransactions] = React.useState<ParsedTransaction[]>([])
  const [isParsing, setIsParsing] = React.useState(false)
  const [parseError, setParseError] = React.useState<string>("")
  const [isImporting, setIsImporting] = React.useState(false)
  const { currentUser } = useAuth()
  const { toast } = useToast()

  const form = useForm<ImportFormData>({
    resolver: zodResolver(importFormSchema),
    defaultValues: {
      data: "",
      format: "csv",
      skipHeader: true,
      updateExisting: false,
      validateData: true,
      bankAccountId: selectedBankAccountId
    }
  })

  // 当选择的银行账户改变时更新表单
  React.useEffect(() => {
    form.setValue("bankAccountId", selectedBankAccountId)
  }, [selectedBankAccountId, form])

  // 解析粘贴的数据
  const parseData = React.useCallback((data: string, format: string, skipHeader: boolean, bankAccountId: string) => {
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
        const lineNumber = skipHeader ? index + 2 : index + 1
        const errors: string[] = []
        
        // 根据格式确定分隔符
        let delimiter = ","
        if (format === "tsv") delimiter = "\t"
        
        const values = line.split(delimiter).map(v => v.trim().replace(/"/g, ""))
        
        // 验证字段数量
        if (values.length < 5) {
          errors.push(`第${lineNumber}行: 字段数量不足，至少需要5个字段`)
          return {
            date: "",
            description: "",
            expense: 0,
            income: 0,
            status: "Pending" as const,
            bankAccountId,
            isValid: false,
            errors,
            isUpdate: false
          }
        }

        const [date, description, description2, expenseStr, incomeStr, status, payer, projectName, category] = values

        // 验证日期
        if (!date) {
          errors.push(`第${lineNumber}行: 日期不能为空`)
        } else {
          const dateObj = new Date(date)
          if (isNaN(dateObj.getTime())) {
            errors.push(`第${lineNumber}行: 日期格式无效，请使用YYYY-MM-DD格式`)
          }
        }

        // 验证描述
        if (!description) {
          errors.push(`第${lineNumber}行: 描述不能为空`)
        } else if (description.length > 200) {
          errors.push(`第${lineNumber}行: 描述长度不能超过200个字符`)
        }

        // 验证金额
        const expense = parseFloat(expenseStr || "0")
        const income = parseFloat(incomeStr || "0")
        
        if (isNaN(expense) || expense < 0) {
          errors.push(`第${lineNumber}行: 支出金额无效`)
        }
        if (isNaN(income) || income < 0) {
          errors.push(`第${lineNumber}行: 收入金额无效`)
        }
        if (expense > 0 && income > 0) {
          errors.push(`第${lineNumber}行: 支出和收入不能同时大于0`)
        }

        // 验证状态
        let validStatus: "Completed" | "Pending" | "Draft" = "Pending"
        if (status) {
          const statusLower = status.toLowerCase()
          if (statusLower === "completed" || statusLower === "已完成") {
            validStatus = "Completed"
          } else if (statusLower === "pending" || statusLower === "待处理") {
            validStatus = "Pending"
          } else if (statusLower === "draft" || statusLower === "草稿") {
            validStatus = "Draft"
          } else {
            errors.push(`第${lineNumber}行: 状态值无效，应为Completed/Pending/Draft或已完成/待处理/草稿`)
          }
        }

        // 检查重复交易
        let isUpdate = false
        let originalId: string | undefined
        
        if (updateExisting) {
          const existingTransaction = existingTransactions.find(t => 
            t.date === date && 
            t.description === description &&
            t.bankAccountId === bankAccountId
          )
          
          if (existingTransaction) {
            isUpdate = true
            originalId = existingTransaction.id
          }
        }

        return {
          date,
          description,
          description2: description2 || undefined,
          expense,
          income,
          status: validStatus,
          payer: payer || undefined,
          projectid: "", // 需要根据项目名称查找项目ID
          projectName: projectName || undefined,
          category: category || undefined,
          bankAccountId,
          isValid: errors.length === 0,
          errors,
          isUpdate,
          originalId
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

  // 处理表单提交
  const onSubmit = (data: ImportFormData) => {
    parseData(data.data, data.format, data.skipHeader, data.bankAccountId)
  }

  // 处理导入
  const handleImport = async () => {
    if (!currentUser) {
      toast({
        title: "错误",
        description: "用户未登录",
        variant: "destructive"
      })
      return
    }

    const validTransactions = parsedTransactions.filter(t => t.isValid)
    if (validTransactions.length === 0) {
      toast({
        title: "错误",
        description: "没有有效的交易数据可导入",
        variant: "destructive"
      })
      return
    }

    setIsImporting(true)
    try {
      await onImport(validTransactions)
      toast({
        title: "成功",
        description: `已导入 ${validTransactions.length} 笔交易`
      })
      onOpenChange(false)
      form.reset()
      setParsedTransactions([])
    } catch (error) {
      toast({
        title: "错误",
        description: `导入失败: ${error instanceof Error ? error.message : "未知错误"}`,
        variant: "destructive"
      })
    } finally {
      setIsImporting(false)
    }
  }

  // 清空数据
  const handleClear = () => {
    form.reset()
    setParsedTransactions([])
    setParseError("")
  }

  // 获取示例数据
  const getSampleData = () => {
    const sampleData = `日期,描述,描述2,支出金额,收入金额,状态,付款人,项目名称,分类
2024-01-15,办公室用品,办公用品,245.00,0.00,Pending,张三,项目A,办公用品
2024-01-16,销售收入,产品销售,0.00,1500.00,Completed,李四,项目B,销售收入
2024-01-17,交通费,出差费用,120.00,0.00,Completed,王五,项目C,交通费`
    
    form.setValue("data", sampleData)
    parseData(sampleData, "csv", true, selectedBankAccountId)
  }

  // 统计信息
  const stats = React.useMemo(() => {
    const total = parsedTransactions.length
    const valid = parsedTransactions.filter(t => t.isValid).length
    const invalid = total - valid
    const updates = parsedTransactions.filter(t => t.isUpdate).length
    const newRecords = valid - updates

    return { total, valid, invalid, updates, newRecords }
  }, [parsedTransactions])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            导入银行交易数据
          </DialogTitle>
          <DialogDescription>
            支持CSV、TSV、Excel格式的数据导入，可自动验证数据格式并检测重复记录
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* 银行账户选择 */}
          <div className="space-y-2">
            <Label htmlFor="bankAccountId">选择银行账户</Label>
            <Select
              value={form.watch("bankAccountId")}
              onValueChange={(value) => form.setValue("bankAccountId", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="选择银行账户" />
              </SelectTrigger>
              <SelectContent>
                {bankAccounts.map((account) => (
                  <SelectItem key={account.id} value={account.id}>
                    {account.name} - {account.accountNumber}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 导入选项 */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="format">数据格式</Label>
              <Select
                value={form.watch("format")}
                onValueChange={(value) => form.setValue("format", value as "csv" | "tsv" | "excel")}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="csv">CSV (逗号分隔)</SelectItem>
                  <SelectItem value="tsv">TSV (制表符分隔)</SelectItem>
                  <SelectItem value="excel">Excel (CSV格式)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="skipHeader">跳过标题行</Label>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="skipHeader"
                  checked={form.watch("skipHeader")}
                  onCheckedChange={(checked) => form.setValue("skipHeader", checked as boolean)}
                />
                <Label htmlFor="skipHeader" className="text-sm font-normal">
                  第一行是标题行
                </Label>
              </div>
            </div>
          </div>

          {/* 高级选项 */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="updateExisting">更新现有记录</Label>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="updateExisting"
                  checked={form.watch("updateExisting")}
                  onCheckedChange={(checked) => form.setValue("updateExisting", checked as boolean)}
                />
                <Label htmlFor="updateExisting" className="text-sm font-normal">
                  如果发现重复记录则更新
                </Label>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="validateData">数据验证</Label>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="validateData"
                  checked={form.watch("validateData")}
                  onCheckedChange={(checked) => form.setValue("validateData", checked as boolean)}
                />
                <Label htmlFor="validateData" className="text-sm font-normal">
                  严格验证数据格式
                </Label>
              </div>
            </div>
          </div>

          {/* 数据输入 */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="data">数据内容</Label>
              <div className="flex items-center space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={getSampleData}
                >
                  <FileText className="h-4 w-4 mr-1" />
                  示例数据
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    navigator.clipboard.readText().then(text => {
                      form.setValue("data", text)
                    })
                  }}
                >
                  <Clipboard className="h-4 w-4 mr-1" />
                  粘贴
                </Button>
              </div>
            </div>
            <Textarea
              id="data"
              placeholder="请粘贴或输入数据，格式：日期,描述,描述2,支出金额,收入金额,状态,付款人,项目名称,分类"
              className="min-h-[200px] font-mono text-sm"
              {...form.register("data")}
            />
            {form.formState.errors.data && (
              <p className="text-sm text-red-600">{form.formState.errors.data.message}</p>
            )}
          </div>

          {/* 操作按钮 */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Button
                type="button"
                onClick={form.handleSubmit(onSubmit)}
                disabled={isParsing}
              >
                {isParsing ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    解析中...
                  </>
                ) : (
                  <>
                    <FileText className="h-4 w-4 mr-2" />
                    解析数据
                  </>
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={handleClear}
              >
                清空
              </Button>
            </div>

            <Button
              type="button"
              onClick={handleImport}
              disabled={parsedTransactions.filter(t => t.isValid).length === 0 || isImporting}
            >
              {isImporting ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    导入中...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                    导入数据
                </>
              )}
            </Button>
          </div>

          {/* 错误信息 */}
          {parseError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{parseError}</AlertDescription>
            </Alert>
          )}

          {/* 解析结果统计 */}
          {parsedTransactions.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">解析结果</CardTitle>
                <CardDescription>
                  共解析 {stats.total} 条记录，有效 {stats.valid} 条，无效 {stats.invalid} 条
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
                    <div className="text-sm text-muted-foreground">总记录</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{stats.valid}</div>
                    <div className="text-sm text-muted-foreground">有效记录</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600">{stats.newRecords}</div>
                    <div className="text-sm text-muted-foreground">新增记录</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">{stats.updates}</div>
                    <div className="text-sm text-muted-foreground">更新记录</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* 解析结果列表 */}
          {parsedTransactions.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>数据预览</CardTitle>
                <CardDescription>
                  预览解析结果，绿色表示有效，红色表示无效
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-[300px] overflow-y-auto">
                  {parsedTransactions.map((transaction, index) => (
                    <div
                      key={index}
                      className={`p-3 border rounded-lg ${
                        transaction.isValid ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          {transaction.isValid ? (
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          ) : (
                            <XCircle className="h-4 w-4 text-red-600" />
                          )}
                          <div className="flex items-center space-x-2">
                            <span className="font-medium">{transaction.date}</span>
                            <span className="text-sm text-muted-foreground">-</span>
                            <span className="max-w-xs truncate">{transaction.description}</span>
                            {transaction.isUpdate && (
                              <Badge variant="secondary" className="text-xs">
                                更新
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm">
                            {transaction.expense > 0 ? (
                              <span className="text-red-600">-¥{transaction.expense.toFixed(2)}</span>
                            ) : (
                              <span className="text-green-600">+¥{transaction.income.toFixed(2)}</span>
                            )}
                          </div>
                          <div className="text-xs text-muted-foreground">{transaction.status}</div>
                        </div>
                      </div>
                      
                      {transaction.errors.length > 0 && (
                        <div className="mt-2 text-sm text-red-600">
                          {transaction.errors.map((error, errorIndex) => (
                            <div key={errorIndex}>• {error}</div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
} 