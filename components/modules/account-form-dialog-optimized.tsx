"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import type { Account } from "@/lib/data"

const accountFormSchema = z.object({
  code: z.string().min(1, "账户代码不能为空").max(10, "账户代码不能超过10个字符"),
  name: z.string().min(1, "账户名称不能为空").max(100, "账户名称不能超过100个字符"),
  type: z.enum(["Asset", "Liability", "Equity", "Revenue", "Expense"], {
    required_error: "请选择账户类型"
  }),
  balance: z.coerce.number().default(0),
  description: z.string().optional(),
  parent: z.string().optional()
})

type AccountFormData = z.infer<typeof accountFormSchema>

interface AccountFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  account?: Account | null
  existingAccounts?: Account[]
  onSave: (account: AccountFormData) => void
  onCancel?: () => void
}

// 优化的账户类型选项组件
const AccountTypeOptions = React.memo(() => (
  <>
    <SelectItem value="Asset">资产 (Asset)</SelectItem>
    <SelectItem value="Liability">负债 (Liability)</SelectItem>
    <SelectItem value="Equity">权益 (Equity)</SelectItem>
    <SelectItem value="Revenue">收入 (Revenue)</SelectItem>
    <SelectItem value="Expense">费用 (Expense)</SelectItem>
  </>
))

export function AccountFormDialogOptimized({
  open,
  onOpenChange,
  account,
  onSave,
  onCancel
}: AccountFormDialogProps) {
  const form = useForm<AccountFormData>({
    resolver: zodResolver(accountFormSchema),
    defaultValues: {
      code: account?.code || "",
      name: account?.name || "",
      type: account?.type || "Asset",
      balance: account?.balance || 0,
      description: account?.description || "",
      parent: account?.parent || ""
    }
  })

  // 优化的表单重置
  const resetForm = React.useCallback(() => {
    if (account) {
      form.reset({
        code: account.code,
        name: account.name,
        type: account.type,
        balance: account.balance,
        description: account.description || "",
        parent: account.parent || ""
      })
    } else {
      form.reset({
        code: "",
        name: "",
        type: "Asset",
        balance: 0,
        description: "",
        parent: ""
      })
    }
  }, [account, form])

  React.useEffect(() => {
    resetForm()
  }, [resetForm])

  // 优化的提交处理
  const onSubmit = React.useCallback((data: AccountFormData) => {
    onSave(data)
    onOpenChange(false)
    // 延迟重置表单，确保对话框关闭后再重置
    setTimeout(() => {
      form.reset()
    }, 100)
  }, [onSave, onOpenChange, form])

  // 优化的取消处理
  const handleCancel = React.useCallback(() => {
    onCancel?.()
    onOpenChange(false)
    // 延迟重置表单，确保对话框关闭后再重置
    setTimeout(() => {
      form.reset()
    }, 100)
  }, [onCancel, onOpenChange, form])

  // 优化的编辑状态计算
  const isEditing = React.useMemo(() => !!account, [account])

  // 优化的对话框标题和描述
  const dialogTitle = React.useMemo(() => 
    isEditing ? "编辑账户" : "添加新账户", 
    [isEditing]
  )

  const dialogDescription = React.useMemo(() => 
    isEditing ? "修改账户信息" : "创建新的会计账户", 
    [isEditing]
  )

  const submitButtonText = React.useMemo(() => 
    isEditing ? "保存修改" : "创建账户", 
    [isEditing]
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{dialogTitle}</DialogTitle>
          <DialogDescription>
            {dialogDescription}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>账户代码 *</FormLabel>
                    <FormControl>
                      <Input placeholder="1001" {...field} />
                    </FormControl>
                    <FormDescription>
                      唯一的账户标识代码
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>账户名称 *</FormLabel>
                    <FormControl>
                      <Input placeholder="现金" {...field} />
                    </FormControl>
                    <FormDescription>
                      账户的显示名称
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>账户类型 *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="选择账户类型" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <AccountTypeOptions />
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      账户的会计分类
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="balance"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>初始余额</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        placeholder="0.00" 
                        step="0.01"
                        {...field} 
                      />
                    </FormControl>
                    <FormDescription>
                      账户的初始余额
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>描述</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="账户的详细描述..." 
                      className="resize-none"
                      {...field} 
                    />
                  </FormControl>
                  <FormDescription>
                    账户的详细说明（可选）
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="parent"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>父账户</FormLabel>
                  <FormControl>
                    <Input placeholder="父账户代码（可选）" {...field} />
                  </FormControl>
                  <FormDescription>
                    如果这是子账户，请输入父账户代码
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={handleCancel}>
                取消
              </Button>
              <Button type="submit">
                {submitButtonText}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
} 