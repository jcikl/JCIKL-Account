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
import { useAuth } from "@/components/auth/auth-context"

// 商品类型定义
type MerchandiseType = "independent" | "clothing"
type ClothingSize = "XS" | "S" | "M" | "L" | "XL" | "XXL"
type ClothingCut = "Regular" | "Slim" | "Loose" | "Custom"

interface Merchandise {
  id?: string
  name: string
  sku: string
  type: MerchandiseType
  location: string
  description?: string
  clothingSizes?: ClothingSize[]
  clothingCut?: ClothingCut
  createdAt: string
  updatedAt: string
  createdByUid: string
}

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

interface ParsedMerchandise {
  name: string
  sku: string
  type: MerchandiseType
  location: string
  description?: string
  clothingSizes?: ClothingSize[]
  clothingCut?: ClothingCut
  isValid: boolean
  errors: string[]
  isUpdate?: boolean
  rowNumber?: number
}

interface MerchandisePasteImportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  existingMerchandise: Merchandise[]
  onImport: (merchandise: ParsedMerchandise[]) => void
}

export function MerchandisePasteImportDialog({
  open,
  onOpenChange,
  existingMerchandise,
  onImport
}: MerchandisePasteImportDialogProps) {
  const { toast } = useToast()
  const { currentUser } = useAuth()
  const [parsedMerchandise, setParsedMerchandise] = React.useState<ParsedMerchandise[]>([])
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
        setParseError("没有数据可以解析")
        return
      }

      // 跳过标题行
      const dataLines = skipHeader ? lines.slice(1) : lines
      if (dataLines.length === 0) {
        setParseError("跳过标题行后没有数据")
        return
      }

      const updateExisting = form.getValues("updateExisting")
      
      const merchandise: ParsedMerchandise[] = dataLines.map((line, index) => {
        const errors: string[] = []
        let fields: string[]

        // 根据格式分割字段
        if (format === "csv") {
          fields = line.split(',').map(field => field.trim().replace(/^"|"$/g, ''))
        } else if (format === "tsv") {
          fields = line.split('\t').map(field => field.trim())
        } else {
          // excel格式，假设是制表符分隔
          fields = line.split('\t').map(field => field.trim())
        }

        // 验证字段数量
        if (fields.length < 4) {
          errors.push("字段数量不足，至少需要：商品名称、SKU、类型、位置")
        }

        const [name, sku, type, location, description, clothingSizesStr, clothingCut] = fields

        // 验证必填字段
        if (!name || name.trim() === "") {
          errors.push("商品名称不能为空")
        }

        if (!sku || sku.trim() === "") {
          errors.push("SKU不能为空")
        }

        if (!type || !["independent", "clothing"].includes(type)) {
          errors.push("商品类型必须是 'independent' 或 'clothing'")
        }

        if (!location || location.trim() === "") {
          errors.push("位置不能为空")
        }

        // 验证衣服特有字段
        let clothingSizes: ClothingSize[] = []
        if (type === "clothing" && clothingSizesStr) {
          const sizes = clothingSizesStr.split(';').map(s => s.trim())
          for (const size of sizes) {
            if (!["XS", "S", "M", "L", "XL", "XXL"].includes(size)) {
              errors.push(`无效的尺寸: ${size}`)
            } else {
              clothingSizes.push(size as ClothingSize)
            }
          }
        }

        let finalClothingCut: ClothingCut = "Regular"
        if (type === "clothing" && clothingCut) {
          if (!["Regular", "Slim", "Loose", "Custom"].includes(clothingCut)) {
            errors.push(`无效的裁剪类型: ${clothingCut}`)
          } else {
            finalClothingCut = clothingCut as ClothingCut
          }
        }

        // 检查是否为更新
        let isUpdate = false
        if (updateExisting && name && sku) {
          const existingItem = existingMerchandise.find(m => 
            m.name === name && m.sku === sku
          )
          if (existingItem) {
            isUpdate = true
          }
        }

        return {
          name: name || "",
          sku: sku || "",
          type: (type as MerchandiseType) || "independent",
          location: location || "",
          description: description || "",
          clothingSizes: clothingSizes,
          clothingCut: finalClothingCut,
          isValid: errors.length === 0,
          errors,
          isUpdate,
          rowNumber: index + 1
        }
      })

      setParsedMerchandise(merchandise)
      console.log(`解析完成，共${merchandise.length}条记录`)
    } catch (error: any) {
      setParseError(error.message || "解析数据时发生错误")
      console.error("解析错误:", error)
    } finally {
      setIsParsing(false)
    }
  }, [form, existingMerchandise])

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
    const validMerchandise = parsedMerchandise.filter(item => item.isValid)
    if (validMerchandise.length === 0) {
      toast({
        title: "导入失败",
        description: "没有有效的商品数据可以导入",
        variant: "destructive",
      })
      return
    }
    
    onImport(validMerchandise)
    onOpenChange(false)
    form.reset()
    setParsedMerchandise([])
    toast({
      title: "导入成功",
      description: `成功导入 ${validMerchandise.length} 个商品`,
    })
  }

  const handleCancel = () => {
    onOpenChange(false)
    form.reset()
    setParsedMerchandise([])
    setParseError("")
  }

  const validMerchandise = parsedMerchandise.filter(item => item.isValid)
  const invalidMerchandise = parsedMerchandise.filter(item => !item.isValid)
  const newMerchandise = validMerchandise.filter(item => !item.isUpdate)
  const updateMerchandise = validMerchandise.filter(item => item.isUpdate)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>粘贴导入商品</DialogTitle>
          <DialogDescription>
            从剪贴板粘贴商品数据，支持CSV、TSV和Excel格式。
            <br />
            格式说明：商品名称, SKU, 类型(independent/clothing), 位置, 描述(可选), 尺寸(可选，用分号分隔), 裁剪类型(可选)
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="format"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>数据格式</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="选择格式" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="csv">CSV (逗号分隔)</SelectItem>
                        <SelectItem value="tsv">TSV (制表符分隔)</SelectItem>
                        <SelectItem value="excel">Excel (制表符分隔)</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

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
                      <FormLabel>更新现有商品</FormLabel>
                      <FormDescription>
                        如果商品名称和SKU已存在，则更新而不是创建新记录
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <FormLabel>数据内容</FormLabel>
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
              <FormField
                control={form.control}
                name="data"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Textarea
                        placeholder="请粘贴商品数据，格式：商品名称, SKU, 类型, 位置, 描述(可选), 尺寸(可选), 裁剪类型(可选)"
                        className="min-h-[200px] font-mono text-sm"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {parseError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{parseError}</AlertDescription>
              </Alert>
            )}

            {isParsing && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                正在解析数据...
              </div>
            )}

            {parsedMerchandise.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">解析结果</h3>
                  <div className="flex gap-2">
                    {validMerchandise.length > 0 && (
                      <Badge variant="default" className="bg-green-100 text-green-800">
                        有效: {validMerchandise.length}
                      </Badge>
                    )}
                    {invalidMerchandise.length > 0 && (
                      <Badge variant="destructive">
                        无效: {invalidMerchandise.length}
                      </Badge>
                    )}
                    {newMerchandise.length > 0 && (
                      <Badge variant="outline" className="bg-blue-100 text-blue-800">
                        新增: {newMerchandise.length}
                      </Badge>
                    )}
                    {updateMerchandise.length > 0 && (
                      <Badge variant="outline" className="bg-orange-100 text-orange-800">
                        更新: {updateMerchandise.length}
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="space-y-2 max-h-[300px] overflow-y-auto">
                  {parsedMerchandise.map((item, index) => (
                    <div
                      key={index}
                      className={`p-3 rounded border ${
                        item.isValid
                          ? "border-green-200 bg-green-50"
                          : "border-red-200 bg-red-50"
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            {item.isValid ? (
                              <CheckCircle className="h-4 w-4 text-green-600" />
                            ) : (
                              <XCircle className="h-4 w-4 text-red-600" />
                            )}
                            <span className="font-medium">
                              第 {item.rowNumber} 行: {item.name}
                            </span>
                            {item.isUpdate && (
                              <Badge variant="outline" className="text-xs">
                                更新
                              </Badge>
                            )}
                          </div>
                          <div className="text-sm text-gray-600 space-y-1">
                            <div>SKU: {item.sku}</div>
                            <div>类型: {item.type}</div>
                            <div>位置: {item.location}</div>
                            {item.description && <div>描述: {item.description}</div>}
                            {item.clothingSizes && item.clothingSizes.length > 0 && (
                              <div>尺寸: {item.clothingSizes.join(", ")}</div>
                            )}
                            {item.clothingCut && <div>裁剪: {item.clothingCut}</div>}
                          </div>
                        </div>
                      </div>
                      {item.errors.length > 0 && (
                        <div className="mt-2">
                          <div className="text-sm font-medium text-red-600 mb-1">错误:</div>
                          <ul className="text-sm text-red-600 space-y-1">
                            {item.errors.map((error, errorIndex) => (
                              <li key={errorIndex}>• {error}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </form>
        </Form>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={handleCancel}>
            取消
          </Button>
          <Button
            onClick={handleImport}
            disabled={validMerchandise.length === 0 || isParsing}
          >
            导入 {validMerchandise.length > 0 && `(${validMerchandise.length})`}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
} 