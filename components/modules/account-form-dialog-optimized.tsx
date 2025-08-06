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
import { useToast } from "@/hooks/use-toast"
import type { Account } from "@/lib/data"

const accountFormSchema = z.object({
  code: z.string().min(1, "账户代码是必需的"),
  name: z.string().min(1, "账户名称是必需的"),
  type: z.enum(["Asset", "Liability", "Equity", "Revenue", "Expense"]),
  balance: z.number().min(0, "余额不能为负数"),
  description: z.string().optional(),
  parent: z.string().optional(), // 父账户代码
})

type AccountFormData = z.infer<typeof accountFormSchema>

interface AccountFormDialogOptimizedProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  account?: Account | null
  existingAccounts: Account[]
  onSave: (data: AccountFormData) => Promise<void>
}

export function AccountFormDialogOptimized({
  open,
  onOpenChange,
  account,
  existingAccounts,
  onSave
}: AccountFormDialogOptimizedProps) {
  const { toast } = useToast()
  const [saving, setSaving] = React.useState(false)

  const form = useForm<AccountFormData>({
    resolver: zodResolver(accountFormSchema),
    defaultValues: {
      code: account?.code || "",
      name: account?.name || "",
      type: account?.type || "Asset",
      balance: account?.balance || 0,
      description: account?.description || "",
      parent: account?.parent || "",
    },
  })

  // 当账户数据变化时重置表单
  React.useEffect(() => {
    if (account) {
      form.reset({
        code: account.code,
        name: account.name,
        type: account.type,
        balance: account.balance,
        description: account.description || "",
        parent: account.parent || "",
      })
    } else {
      form.reset({
        code: "",
        name: "",
        type: "Asset",
        balance: 0,
        description: "",
        parent: "",
      })
    }
  }, [account, form])

  // 获取可用的父账户选项（排除当前账户和其子账户）
  const availableParentAccounts = React.useMemo(() => {
    if (!account) {
      // 创建新账户时，所有现有账户都可以作为父账户
      return existingAccounts.filter(acc => acc.id !== account?.id)
    }
    
    // 编辑账户时，排除当前账户和其子账户
    const excludeIds = new Set([account.id])
    
    // 递归查找子账户
    const findChildAccounts = (parentId: string): string[] => {
      const children = existingAccounts.filter(acc => acc.parent === parentId)
      const childIds = children.map(child => child.id!)
      const grandChildIds = childIds.flatMap(findChildAccounts)
      return [...childIds, ...grandChildIds]
    }
    
    const childAccountIds = findChildAccounts(account.id!)
    childAccountIds.forEach(id => excludeIds.add(id))
    
    return existingAccounts.filter(acc => !excludeIds.has(acc.id!))
  }, [existingAccounts, account])

  const handleSubmit = React.useCallback(async (data: AccountFormData) => {
    try {
      setSaving(true)
      
      // 调试日志：检查提交的数据
      console.log('提交的账户数据:', data)
      console.log('父账户字段值:', data.parent)
      
      await onSave(data)
      
      toast({
        title: account ? "账户更新成功" : "账户创建成功",
        description: account ? "账户信息已更新" : `账户 "${data.name}" 已创建`,
      })
      
      onOpenChange(false)
    } catch (error) {
      toast({
        title: "操作失败",
        description: `保存账户时出错: ${error}`,
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }, [onSave, account, toast, onOpenChange])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{account ? "编辑账户" : "添加新账户"}</DialogTitle>
          <DialogDescription>
            {account ? "修改账户信息" : "创建新的会计账户"}
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="code"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>账户代码</FormLabel>
                  <FormControl>
                    <Input placeholder="例如: 1001" {...field} />
                  </FormControl>
                  <FormDescription>
                    唯一的账户标识符
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
                  <FormLabel>账户名称</FormLabel>
                  <FormControl>
                    <Input placeholder="例如: 现金" {...field} />
                  </FormControl>
                  <FormDescription>
                    账户的显示名称
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>账户类型</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="选择账户类型" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Asset">资产 (Asset)</SelectItem>
                      <SelectItem value="Liability">负债 (Liability)</SelectItem>
                      <SelectItem value="Equity">权益 (Equity)</SelectItem>
                      <SelectItem value="Revenue">收入 (Revenue)</SelectItem>
                      <SelectItem value="Expense">支出 (Expense)</SelectItem>
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
              name="parent"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>父账户</FormLabel>
                  <Select 
                    onValueChange={(value) => {
                      // 将 "none" 转换为空字符串
                      field.onChange(value === "none" ? "" : value)
                    }} 
                    value={field.value ? field.value : "none"}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="选择父账户（可选）" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="none">无父账户</SelectItem>
                      {availableParentAccounts.map((parentAccount) => (
                        <SelectItem key={parentAccount.id} value={parentAccount.code}>
                          {parentAccount.code} - {parentAccount.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    选择父账户以建立账户层次结构（可选）
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
                      step="0.01"
                      placeholder="0.00"
                      {...field}
                      onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                    />
                  </FormControl>
                  <FormDescription>
                    账户的初始余额
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>描述</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="账户的详细描述（可选）"
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    账户的详细说明
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={saving}
              >
                取消
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? "保存中..." : (account ? "更新" : "创建")}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
} 