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
import { Clipboard, Upload, AlertCircle, CheckCircle, XCircle, FileText, Settings, Database } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { Account, GlobalGLSettings } from "@/lib/data"

const importFormSchema = z.object({
  data: z.string().min(1, "请输入要导入的数据"),
  format: z.enum(["csv", "excel", "tsv", "json"], {
    required_error: "请选择数据格式"
  }),
  skipHeader: z.boolean().default(true),
  updateExisting: z.boolean().default(false),
  validateData: z.boolean().default(true),
  importGLSettings: z.boolean().default(false),
  importTransactionMappings: z.boolean().default(false)
})

type ImportFormData = z.infer<typeof importFormSchema>

interface ParsedAccount {
  code: string
  name: string
  type: "Asset" | "Liability" | "Equity" | "Revenue" | "Expense"
  financialStatement: string
  description?: string
  balance?: number
  parent?: string
  isValid: boolean
  errors: string[]
  isUpdate?: boolean
}

interface ImportedData {
  accounts: ParsedAccount[]
  glSettings?: Partial<GlobalGLSettings>
  transactionMappings?: Record<string, string>
  metadata?: {
    version: string
    description: string
    totalAccounts: number
    accountTypes: Record<string, number>
  }
}

interface ImportDialogEnhancedProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  existingAccounts: Account[]
  onImport: (accounts: ParsedAccount[]) => void
  onImportGLSettings?: (settings: Partial<GlobalGLSettings>) => void
  onImportTransactionMappings?: (mappings: Record<string, string>) => void
}

export function ImportDialogEnhanced({
  open,
  onOpenChange,
  existingAccounts,
  onImport,
  onImportGLSettings,
  onImportTransactionMappings
}: ImportDialogEnhancedProps) {
  const [importedData, setImportedData] = React.useState<ImportedData | null>(null)
  const [isParsing, setIsParsing] = React.useState(false)
  const [parseError, setParseError] = React.useState<string>("")

  const form = useForm<ImportFormData>({
    resolver: zodResolver(importFormSchema),
    defaultValues: {
      data: "",
      format: "json",
      skipHeader: true,
      updateExisting: false,
      validateData: true,
      importGLSettings: true,
      importTransactionMappings: true
    }
  })

  // 解析JSON格式的导入数据
  const parseJSONData = React.useCallback((data: string) => {
    try {
      const jsonData = JSON.parse(data)
      
      if (!jsonData.accounts || !Array.isArray(jsonData.accounts)) {
        throw new Error("JSON文件必须包含 'accounts' 数组")
      }

      const updateExisting = form.getValues("updateExisting")
      
      const accounts: ParsedAccount[] = jsonData.accounts.map((account: any) => {
        const errors: string[] = []

        if (!account.code) errors.push("账户代码不能为空")
        if (!account.name) errors.push("账户名称不能为空")
        if (!account.type) errors.push("账户类型不能为空")

        const validTypes = ["Asset", "Liability", "Equity", "Revenue", "Expense"]
        if (account.type && !validTypes.includes(account.type)) {
          errors.push(`账户类型必须是以下之一: ${validTypes.join(', ')}`)
        }

        const existingAccount = existingAccounts.find(acc => acc.code === account.code)
        if (existingAccount && !updateExisting) {
          errors.push("账户代码已存在，请勾选'更新现有账户'选项来更新")
        }

        return {
          code: account.code || "",
          name: account.name || "",
          type: account.type || "Asset",
          financialStatement: account.financialStatement || (() => {
            const balanceSheetTypes = ["Asset", "Liability", "Equity"]
            return balanceSheetTypes.includes(account.type) ? "Balance Sheet" : "Income Statement"
          })(),
          description: account.description || "",
          balance: account.balance || 0,
          parent: account.parent || "",
          isValid: errors.length === 0,
          errors,
          isUpdate: existingAccount ? true : false
        }
      })

      return {
        accounts,
        glSettings: jsonData.glSettings,
        transactionMappings: jsonData.transactionMappings,
        metadata: jsonData.metadata
      }
    } catch (error) {
      throw new Error(`JSON解析失败: ${error instanceof Error ? error.message : '未知错误'}`)
    }
  }, [existingAccounts, form])

  // 解析数据
  const parseData = React.useCallback((data: string, format: string, skipHeader: boolean) => {
    setIsParsing(true)
    setParseError("")
    
    try {
      let result: ImportedData

      if (format === "json") {
        result = parseJSONData(data)
      } else {
        // 简化的CSV解析逻辑
        const lines = data.trim().split('\n')
        const dataLines = skipHeader ? lines.slice(1) : lines
        const updateExisting = form.getValues("updateExisting")
        
        const accounts: ParsedAccount[] = dataLines.map((line) => {
          const fields = line.split(',').map(field => field.trim().replace(/^["']|["']$/g, ''))
          const [code, type, name, financialStatement = "", description = "", balance = "0", parent = ""] = fields
          
          const errors: string[] = []
          if (!code) errors.push("账户代码不能为空")
          if (!name) errors.push("账户名称不能为空")
          
          const validTypes = ["Asset", "Liability", "Equity", "Revenue", "Expense"]
          if (!type || !validTypes.includes(type)) {
            errors.push(`账户类型必须是以下之一: ${validTypes.join(', ')}`)
          }

          const existingAccount = existingAccounts.find(acc => acc.code === code)
          if (existingAccount && !updateExisting) {
            errors.push("账户代码已存在，请勾选'更新现有账户'选项来更新")
          }

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
            balance: parseFloat(balance) || 0,
            parent: parent || "",
            isValid: errors.length === 0,
            errors,
            isUpdate: existingAccount ? true : false
          }
        })

        result = { accounts }
      }

      setImportedData(result)
    } catch (error) {
      setParseError(error instanceof Error ? error.message : "解析数据时发生错误")
      setImportedData(null)
    } finally {
      setIsParsing(false)
    }
  }, [parseJSONData, existingAccounts, form])

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

  // 处理文件上传
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      const content = e.target?.result as string
      form.setValue("data", content)
      
      const extension = file.name.split('.').pop()?.toLowerCase()
      if (extension === 'json') {
        form.setValue("format", "json")
      } else if (extension === 'csv') {
        form.setValue("format", "csv")
      } else if (extension === 'tsv') {
        form.setValue("format", "tsv")
      }
    }
    reader.readAsText(file)
  }

  // 处理导入
  const handleImport = () => {
    if (!importedData?.accounts) return

    const validAccounts = importedData.accounts.filter(account => account.isValid)
    if (validAccounts.length === 0) {
      alert("没有有效的账户数据可以导入")
      return
    }

    onImport(validAccounts)

    if (importedData.glSettings && form.getValues("importGLSettings") && onImportGLSettings) {
      onImportGLSettings(importedData.glSettings)
    }

    if (importedData.transactionMappings && form.getValues("importTransactionMappings") && onImportTransactionMappings) {
      onImportTransactionMappings(importedData.transactionMappings)
    }

    onOpenChange(false)
  }

  // 处理取消
  const handleCancel = () => {
    setImportedData(null)
    setParseError("")
    form.reset()
    onOpenChange(false)
  }

  const validAccounts = importedData?.accounts?.filter(acc => acc.isValid) || []
  const invalidAccounts = importedData?.accounts?.filter(acc => !acc.isValid) || []

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>导入GL账户数据</DialogTitle>
          <DialogDescription>
            支持JSON、CSV、TSV格式的账户数据导入，包括GL设置和交易映射关系
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form className="space-y-6">
            <Tabs defaultValue="import" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="import">数据导入</TabsTrigger>
                <TabsTrigger value="preview">数据预览</TabsTrigger>
                <TabsTrigger value="settings">导入设置</TabsTrigger>
              </TabsList>

              <TabsContent value="import" className="space-y-4">
                <div className="space-y-4">
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
                            <SelectItem value="json">JSON格式 (推荐)</SelectItem>
                            <SelectItem value="csv">CSV格式</SelectItem>
                            <SelectItem value="tsv">TSV格式</SelectItem>
                            <SelectItem value="excel">Excel格式</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          JSON格式支持完整的GL设置和交易映射导入
                        </FormDescription>
                      </FormItem>
                    )}
                  />

                  <div className="flex gap-2">
                    <Button type="button" variant="outline" onClick={handlePaste}>
                      <Clipboard className="h-4 w-4 mr-2" />
                      从剪贴板粘贴
                    </Button>
                    <div className="relative">
                      <input
                        type="file"
                        accept=".json,.csv,.tsv,.xlsx,.xls"
                        onChange={handleFileUpload}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      />
                      <Button type="button" variant="outline">
                        <Upload className="h-4 w-4 mr-2" />
                        选择文件
                      </Button>
                    </div>
                  </div>

                  <FormField
                    control={form.control}
                    name="data"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>数据内容</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="粘贴或输入要导入的数据..."
                            className="min-h-[200px] font-mono text-sm"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {form.watch("format") !== "json" && (
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
                  )}
                </div>
              </TabsContent>

              <TabsContent value="preview" className="space-y-4">
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

                {importedData && (
                  <div className="space-y-4">
                    {/* 元数据信息 */}
                    {importedData.metadata && (
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <FileText className="h-4 w-4" />
                            文件信息
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="font-medium">版本:</span> {importedData.metadata.version}
                            </div>
                            <div>
                              <span className="font-medium">描述:</span> {importedData.metadata.description}
                            </div>
                            <div>
                              <span className="font-medium">总账户数:</span> {importedData.metadata.totalAccounts}
                            </div>
                            <div>
                              <span className="font-medium">账户类型分布:</span>
                              <div className="mt-1">
                                {Object.entries(importedData.metadata.accountTypes).map(([type, count]) => (
                                  <Badge key={type} variant="outline" className="mr-1 mb-1">
                                    {type}: {count}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {/* 有效账户 */}
                    {validAccounts.length > 0 && (
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <CheckCircle className="h-4 w-4 text-green-600" />
                            有效账户 ({validAccounts.length})
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2 max-h-60 overflow-y-auto">
                            {validAccounts.map((account, index) => (
                              <div key={index} className="flex items-center justify-between p-2 border rounded">
                                <div>
                                  <div className="font-medium">{account.code} - {account.name}</div>
                                  <div className="text-sm text-muted-foreground">
                                    {account.type} • {account.financialStatement}
                                  </div>
                                </div>
                                <Badge variant={account.isUpdate ? "secondary" : "default"}>
                                  {account.isUpdate ? "更新" : "新增"}
                                </Badge>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {/* 无效账户 */}
                    {invalidAccounts.length > 0 && (
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <XCircle className="h-4 w-4 text-red-600" />
                            无效账户 ({invalidAccounts.length})
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2 max-h-60 overflow-y-auto">
                            {invalidAccounts.map((account, index) => (
                              <div key={index} className="p-2 border border-red-200 rounded bg-red-50">
                                <div className="font-medium">{account.code} - {account.name}</div>
                                <div className="text-sm text-red-600">
                                  {account.errors.join(', ')}
                                </div>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {/* GL设置预览 */}
                    {importedData.glSettings && (
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <Settings className="h-4 w-4" />
                            GL设置配置
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            {Object.entries(importedData.glSettings).map(([key, value]) => (
                              <div key={key}>
                                <span className="font-medium">{key}:</span> {value}
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {/* 交易映射预览 */}
                    {importedData.transactionMappings && (
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <Database className="h-4 w-4" />
                            交易映射关系 ({Object.keys(importedData.transactionMappings).length})
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-2 gap-2 text-sm max-h-40 overflow-y-auto">
                            {Object.entries(importedData.transactionMappings).map(([transaction, accountCode]) => (
                              <div key={transaction} className="p-1 border rounded">
                                <div className="font-medium">{transaction}</div>
                                <div className="text-muted-foreground">→ {accountCode}</div>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="settings" className="space-y-4">
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
                          如果账户代码已存在，更新现有账户信息而不是跳过
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
                          导入前验证数据格式和完整性
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />

                {form.watch("format") === "json" && (
                  <>
                    <Separator />
                    <div className="space-y-4">
                      <h4 className="font-medium">JSON格式特有选项</h4>
                      
                      <FormField
                        control={form.control}
                        name="importGLSettings"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                              <FormLabel>导入GL设置</FormLabel>
                              <FormDescription>
                                同时导入GL设置配置（商品管理、项目账户等）
                              </FormDescription>
                            </div>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="importTransactionMappings"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                              <FormLabel>导入交易映射</FormLabel>
                              <FormDescription>
                                同时导入交易类型与GL账户的映射关系
                              </FormDescription>
                            </div>
                          </FormItem>
                        )}
                      />
                    </div>
                  </>
                )}
              </TabsContent>
            </Tabs>

            <Separator />

            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={handleCancel}>
                取消
              </Button>
              <Button 
                type="button" 
                onClick={handleImport}
                disabled={!importedData || validAccounts.length === 0 || isParsing}
              >
                导入数据 ({validAccounts.length} 个账户)
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
} 