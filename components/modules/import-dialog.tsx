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
import type { Account } from "@/lib/data"

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

interface ParsedAccount {
  code: string
  name: string
  type: "Asset" | "Liability" | "Equity" | "Revenue" | "Expense"
  financialStatement: string
  description?: string
  isValid: boolean
  errors: string[]
  isUpdate?: boolean // 标识是否为更新现有账户
}

interface ImportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  existingAccounts: Account[]
  onImport: (accounts: ParsedAccount[]) => void
}

export function ImportDialog({
  open,
  onOpenChange,
  existingAccounts,
  onImport
}: ImportDialogProps) {
  const [parsedAccounts, setParsedAccounts] = React.useState<ParsedAccount[]>([])
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
      
      // 获取当前表单的更新现有账户选项
      const updateExisting = form.getValues("updateExisting")
      
      const accounts: ParsedAccount[] = dataLines.map((line, index) => {
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
            fields = line.split(',').map(field => field.trim())
        }

        // 验证字段数量
        if (fields.length < 3) {
          errors.push("字段数量不足，需要至少：账户代码、账户类型、账户名称")
        }

        const [code, type, name, financialStatement = "", description = ""] = fields

        // 验证账户代码
        if (!code || code.length === 0) {
          errors.push("账户代码不能为空")
        } else if (code.length > 10) {
          errors.push("账户代码不能超过10个字符")
        }

        // 验证账户名称
        if (!name || name.length === 0) {
          errors.push("账户名称不能为空")
        } else if (name.length > 100) {
          errors.push("账户名称不能超过100个字符")
        }

        // 验证账户类型
        const validTypes = ["Asset", "Liability", "Equity", "Revenue", "Expense"]
        if (!type || !validTypes.includes(type)) {
          errors.push(`账户类型必须是以下之一: ${validTypes.join(', ')}`)
        }

        // 检查重复的账户代码
        const existingAccount = existingAccounts.find(acc => acc.code === code)
        if (existingAccount) {
          if (!updateExisting) {
            errors.push("账户代码已存在，请勾选'更新现有账户'选项来更新")
          } else {
            // 如果选择更新现有账户，添加提示信息但不作为错误
            console.log(`账户代码 ${code} 已存在，将更新现有账户`)
          }
        }

        // 自动生成财务报表分类
        const autoFinancialStatement = financialStatement || (() => {
          const balanceSheetTypes = ["Asset", "Liability", "Equity"]
          return balanceSheetTypes.includes(type) ? "Balance Sheet" : "Income Statement"
        })()

        return {
          code: code || "",
          name: name || "",
          type: (type as any) || "Asset",
          financialStatement: autoFinancialStatement,
          description: description || "",
          isValid: errors.length === 0,
          errors,
          isUpdate: existingAccount ? true : false // 判断是否为更新现有账户
        }
      })

      setParsedAccounts(accounts)
    } catch (error) {
      setParseError(error instanceof Error ? error.message : "解析数据时发生错误")
      setParsedAccounts([])
    } finally {
      setIsParsing(false)
    }
  }, [existingAccounts, form])

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
      // 如果无法访问剪贴板，提示用户手动粘贴
      alert("请手动粘贴数据到文本框中")
    }
  }

  // 处理导入
  const handleImport = () => {
    const validAccounts = parsedAccounts.filter(account => account.isValid)
    if (validAccounts.length === 0) {
      alert("没有有效的账户数据可以导入")
      return
    }
    
    onImport(validAccounts)
    onOpenChange(false)
    form.reset()
    setParsedAccounts([])
  }

  const handleCancel = () => {
    onOpenChange(false)
    form.reset()
    setParsedAccounts([])
    setParseError("")
  }

  const validAccounts = parsedAccounts.filter(account => account.isValid)
  const invalidAccounts = parsedAccounts.filter(account => !account.isValid)
  const newAccounts = validAccounts.filter(account => !account.isUpdate)
  const updateAccounts = validAccounts.filter(account => account.isUpdate)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>粘贴导入账户数据</DialogTitle>
          <DialogDescription>
            从剪贴板粘贴账户数据，支持CSV、TSV和Excel格式
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
                        <FormLabel>更新现有账户</FormLabel>
                        <FormDescription>
                          如果账户代码已存在，是否更新现有账户
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
                  <FormLabel>账户数据 *</FormLabel>
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
                        placeholder="粘贴您的账户数据，格式：账户代码,账户类型,账户名称,财务报表分类"
                        className="min-h-[120px] font-mono text-sm"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      支持格式：代码,类型,名称,财务报表分类,描述
                      <br />
                      示例：1001,Asset,现金,资产负债表,用于日常现金收支
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

            {parsedAccounts.length > 0 && !isParsing && (
              <div className="space-y-4">
                <Separator />
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-medium">解析结果</h4>
                  <div className="flex gap-2">
                    <Badge variant="default" className="flex items-center gap-1">
                      <CheckCircle className="h-3 w-3" />
                      {validAccounts.length} 个有效
                    </Badge>
                    {newAccounts.length > 0 && (
                      <Badge variant="default" className="flex items-center gap-1 bg-green-100 text-green-800">
                        <CheckCircle className="h-3 w-3" />
                        {newAccounts.length} 个新增
                      </Badge>
                    )}
                    {updateAccounts.length > 0 && (
                      <Badge variant="secondary" className="flex items-center gap-1 bg-yellow-100 text-yellow-800">
                        <CheckCircle className="h-3 w-3" />
                        {updateAccounts.length} 个更新
                      </Badge>
                    )}
                    {invalidAccounts.length > 0 && (
                      <Badge variant="destructive" className="flex items-center gap-1">
                        <XCircle className="h-3 w-3" />
                        {invalidAccounts.length} 个无效
                      </Badge>
                    )}
                  </div>
                </div>

                {/* 有效账户预览 */}
                {validAccounts.length > 0 && (
                  <div className="space-y-2">
                    <h5 className="text-sm font-medium text-green-600">有效账户</h5>
                    <div className="max-h-40 overflow-y-auto space-y-1">
                      {validAccounts.slice(0, 10).map((account, index) => (
                        <div key={index} className="flex items-center gap-2 text-sm p-2 bg-green-50 rounded">
                          <CheckCircle className="h-3 w-3 text-green-600" />
                          <span className="font-mono">{account.code}</span>
                          <Badge variant="outline" className="text-xs">{account.type}</Badge>
                          <span>{account.name}</span>
                          <span className="text-blue-600">{account.financialStatement}</span>
                          {account.description && (
                            <span className="text-gray-600 text-xs">({account.description})</span>
                          )}
                                                     {account.isUpdate && (
                             <Badge variant="secondary" className="text-xs bg-yellow-100 text-yellow-800">更新</Badge>
                           )}
                        </div>
                      ))}
                      {validAccounts.length > 10 && (
                        <div className="text-sm text-muted-foreground">
                          还有 {validAccounts.length - 10} 个账户...
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* 无效账户预览 */}
                {invalidAccounts.length > 0 && (
                  <div className="space-y-2">
                    <h5 className="text-sm font-medium text-red-600">无效账户</h5>
                    <div className="max-h-40 overflow-y-auto space-y-1">
                      {invalidAccounts.slice(0, 5).map((account, index) => (
                        <div key={index} className="space-y-1 p-2 bg-red-50 rounded">
                          <div className="flex items-center gap-2 text-sm">
                            <XCircle className="h-3 w-3 text-red-600" />
                            <span className="font-mono">{account.code}</span>
                            <Badge variant="outline" className="text-xs">{account.type}</Badge>
                            <span>{account.name}</span>
                            <span className="text-blue-600">{account.financialStatement}</span>
                            {account.description && (
                              <span className="text-gray-600 text-xs">({account.description})</span>
                            )}
                          </div>
                          <div className="text-xs text-red-600 ml-5">
                            {account.errors.join(', ')}
                          </div>
                        </div>
                      ))}
                      {invalidAccounts.length > 5 && (
                        <div className="text-sm text-muted-foreground">
                          还有 {invalidAccounts.length - 5} 个无效账户...
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
                disabled={validAccounts.length === 0 || isParsing}
                className="flex items-center gap-2"
              >
                <Upload className="h-4 w-4" />
                导入 {validAccounts.length > 0 ? `(${newAccounts.length} 新增, ${updateAccounts.length} 更新)` : ''}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
} 