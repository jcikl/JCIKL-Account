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
  isUpdate?: boolean
}

interface ImportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  existingAccounts: Account[]
  onImport: (accounts: ParsedAccount[]) => void
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

// 优化的账户验证状态组件
const AccountValidationStatus = React.memo(({ 
  account 
}: { 
  account: ParsedAccount 
}) => (
  <div className="flex items-center space-x-2">
    {account.isValid ? (
      <CheckCircle className="h-4 w-4 text-green-600" />
    ) : (
      <XCircle className="h-4 w-4 text-red-600" />
    )}
    <span className={`text-sm ${account.isValid ? 'text-green-600' : 'text-red-600'}`}>
      {account.code} - {account.name}
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
  value: number
  icon: React.ComponentType<{ className?: string }>
  color?: string
}) => (
  <div className="flex items-center space-x-2 p-2 border rounded">
    <Icon className={`h-4 w-4 ${color}`} />
    <span className="text-sm font-medium">{title}:</span>
    <span className="text-sm">{value}</span>
  </div>
))

export function ImportDialogOptimized({
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
      
      const accounts: ParsedAccount[] = dataLines.map((line, index) => {
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

        if (fields.length < 3) {
          errors.push("数据字段不足，至少需要代码、类型、名称")
        }

        const [code, type, name, financialStatement = '', description = ''] = fields

        // 验证必填字段
        if (!code) errors.push("账户代码不能为空")
        if (!name) errors.push("账户名称不能为空")
        if (!type) errors.push("账户类型不能为空")

        // 验证账户类型
        const validTypes = ["Asset", "Liability", "Equity", "Revenue", "Expense"]
        if (type && !validTypes.includes(type)) {
          errors.push(`无效的账户类型: ${type}`)
        }

        // 检查重复账户
        const existingAccount = existingAccounts.find(acc => acc.code === code)
        if (existingAccount && !updateExisting) {
          errors.push("账户代码已存在")
        }

        // 自动确定财务报表分类
        const autoFinancialStatement = financialStatement || (() => {
          const balanceSheetTypes = ['Asset', 'Liability', 'Equity']
          return balanceSheetTypes.includes(type) ? 'Balance Sheet' : 'Income Statement'
        })()

        return {
          code: code || '',
          name: name || '',
          type: type as any,
          financialStatement: autoFinancialStatement,
          description: description || '',
          isValid: errors.length === 0,
          errors,
          isUpdate: existingAccount && updateExisting
        }
      })

      setParsedAccounts(accounts)
      setParseError("")
    } catch (error) {
      setParseError(error instanceof Error ? error.message : "解析数据时发生错误")
      setParsedAccounts([])
    } finally {
      setIsParsing(false)
    }
  }, [existingAccounts, form])

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
    const validAccounts = parsedAccounts.filter(account => account.isValid)
    if (validAccounts.length > 0) {
      onImport(validAccounts)
      onOpenChange(false)
      // 延迟重置表单
      setTimeout(() => {
        form.reset()
        setParsedAccounts([])
        setParseError("")
      }, 100)
    }
  }, [parsedAccounts, onImport, onOpenChange, form])

  // 优化的取消处理
  const handleCancel = React.useCallback(() => {
    onOpenChange(false)
    // 延迟重置表单
    setTimeout(() => {
      form.reset()
      setParsedAccounts([])
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
    const total = parsedAccounts.length
    const valid = parsedAccounts.filter(acc => acc.isValid).length
    const invalid = total - valid
    const updates = parsedAccounts.filter(acc => acc.isUpdate).length
    const newAccounts = valid - updates

    return { total, valid, invalid, updates, newAccounts }
  }, [parsedAccounts])

  // 优化的有效账户列表
  const validAccounts = React.useMemo(() => 
    parsedAccounts.filter(account => account.isValid), 
    [parsedAccounts]
  )

  // 优化的无效账户列表
  const invalidAccounts = React.useMemo(() => 
    parsedAccounts.filter(account => !account.isValid), 
    [parsedAccounts]
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>导入账户数据</DialogTitle>
          <DialogDescription>
            从剪贴板或文件导入账户数据，支持CSV、TSV和Excel格式
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
                  label="更新现有账户"
                  description="如果账户代码已存在，更新现有账户信息"
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
                    支持格式：代码,类型,名称,财务报表,描述
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

            {parsedAccounts.length > 0 && (
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
                      value={stats.newAccounts}
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

                {validAccounts.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-medium text-green-600">有效账户 ({validAccounts.length})</h4>
                    <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto">
                      {validAccounts.map((account, index) => (
                        <AccountValidationStatus key={index} account={account} />
                      ))}
                    </div>
                  </div>
                )}

                {invalidAccounts.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-medium text-red-600">无效账户 ({invalidAccounts.length})</h4>
                    <div className="space-y-1 max-h-32 overflow-y-auto">
                      {invalidAccounts.map((account, index) => (
                        <div key={index} className="text-sm">
                          <div className="flex items-center space-x-2">
                            <XCircle className="h-4 w-4 text-red-600" />
                            <span className="text-red-600">{account.code} - {account.name}</span>
                          </div>
                          <div className="ml-6 text-xs text-red-500">
                            {account.errors.join(', ')}
                          </div>
                        </div>
                      ))}
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
              >
                <Upload className="h-4 w-4 mr-2" />
                导入 {validAccounts.length > 0 ? `(${validAccounts.length} 个账户)` : ''}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
} 