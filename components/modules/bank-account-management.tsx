"use client"

import * as React from "react"
import { Plus, Edit, Trash2, Building2, CreditCard, DollarSign, CheckCircle, XCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/components/auth/auth-context"
import { useToast } from "@/hooks/use-toast"
import { 
  getBankAccounts, 
  addBankAccount, 
  updateBankAccount, 
  deleteBankAccount,
  checkBankAccountNameExists,
  getBankAccountStats,
  initializeDefaultBankAccounts
} from "@/lib/firebase-utils"
import type { BankAccount } from "@/lib/data"
import { CURRENCY_TYPES, RoleLevels, UserRoles } from "@/lib/data"

interface BankAccountFormData {
  name: string
  bankName: string
  accountNumber: string
  balance: number
  initialBalance: number
  currency: string
  isActive: boolean
}

interface BankAccountManagementProps {
  onBankAccountChange?: () => void
}

/**
 * 银行账户管理组件
 * @param onBankAccountChange - 银行账户变更时的回调函数
 */
export function BankAccountManagement({ onBankAccountChange }: BankAccountManagementProps) {
  const { currentUser, hasPermission } = useAuth()
  const { toast } = useToast()
  const [bankAccounts, setBankAccounts] = React.useState<BankAccount[]>([])
  const [stats, setStats] = React.useState<{
    totalBankAccounts: number
    activeBankAccounts: number
    inactiveBankAccounts: number
    totalTransactions: number
    totalBalance: number
  } | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [submitting, setSubmitting] = React.useState(false)
  const [isFormOpen, setIsFormOpen] = React.useState(false)
  const [isEditMode, setIsEditMode] = React.useState(false)
  const [editingBankAccount, setEditingBankAccount] = React.useState<BankAccount | null>(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false)
  const [deletingBankAccount, setDeletingBankAccount] = React.useState<BankAccount | null>(null)
  const [deleting, setDeleting] = React.useState(false)
  const [togglingStatus, setTogglingStatus] = React.useState<string | null>(null)

  // Form state
  const [formData, setFormData] = React.useState<BankAccountFormData>({
    name: "",
    bankName: "",
    accountNumber: "",
    balance: 0,
    initialBalance: 0,
    currency: "CNY",
    isActive: true
  })

  const fetchBankAccounts = React.useCallback(async () => {
    setLoading(true)
    try {
      let accounts = await getBankAccounts()
      console.log('【调试】fetchBankAccounts 拉取到的银行账户数据:', accounts)
      
      // 如果没有银行账户，自动初始化默认账户
      if (accounts.length === 0 && currentUser) {
        console.log('没有找到银行账户，正在初始化默认账户...')
        await initializeDefaultBankAccounts(currentUser.uid)
        accounts = await getBankAccounts()
        console.log('默认银行账户初始化完成，账户数量:', accounts.length)
      }
      
      setBankAccounts(accounts)
      
      // 获取统计信息
      const bankStats = await getBankAccountStats()
      setStats(bankStats)
    } catch (error: any) {
      console.error("Error fetching bank accounts:", error)
      toast({
        title: "错误",
        description: "无法加载银行账户: " + error.message,
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }, [currentUser])

  React.useEffect(() => {
    fetchBankAccounts()
  }, [fetchBankAccounts])

  const resetForm = () => {
    setFormData({
      name: "",
      bankName: "",
      accountNumber: "",
      balance: 0,
      initialBalance: 0,
      currency: "CNY",
      isActive: true
    })
    setIsEditMode(false)
    setEditingBankAccount(null)
  }

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // 添加调试信息
    console.log('=== 银行账户保存调试信息 ===')
    console.log('当前用户:', currentUser)
    console.log('表单数据:', formData)
    console.log('是否为编辑模式:', isEditMode)
    
    if (!currentUser) {
      console.log('错误: 用户未登录')
      toast({
        title: "错误",
        description: "用户未登录，请先登录",
        variant: "destructive"
      })
      return
    }

    setSubmitting(true)
    try {
      // 验证表单数据
      if (!formData.name.trim()) {
        toast({
          title: "错误",
          description: "银行账户名称不能为空",
          variant: "destructive"
        })
        setSubmitting(false)
        return
      }

      if (!formData.bankName.trim()) {
        toast({
          title: "错误",
          description: "银行名称不能为空",
          variant: "destructive"
        })
        setSubmitting(false)
        return
      }

      // 验证银行账户名称长度
      if (formData.name.length > 50) {
        toast({
          title: "错误",
          description: "银行账户名称不能超过50个字符",
          variant: "destructive"
        })
        setSubmitting(false)
        return
      }

      // 验证银行名称长度
      if (formData.bankName.length > 100) {
        toast({
          title: "错误",
          description: "银行名称不能超过100个字符",
          variant: "destructive"
        })
        setSubmitting(false)
        return
      }

      // 验证账号长度（如果提供了账号）
      if (formData.accountNumber && formData.accountNumber.length > 30) {
        toast({
          title: "错误",
          description: "银行账号不能超过30个字符",
          variant: "destructive"
        })
        setSubmitting(false)
        return
      }

      // 验证初始余额
      if (isNaN(formData.initialBalance) || formData.initialBalance < -999999999) {
        toast({
          title: "错误",
          description: "初始余额格式不正确",
          variant: "destructive"
        })
        setSubmitting(false)
        return
      }

      // 检查银行账户名称是否已存在（编辑模式除外）
      if (!isEditMode) {
        console.log('检查银行账户名称是否存在:', formData.name)
        const exists = await checkBankAccountNameExists(formData.name)
        console.log('银行账户名称是否存在:', exists)
        if (exists) {
          toast({
            title: "错误",
            description: "银行账户名称已存在",
            variant: "destructive"
          })
          setSubmitting(false)
          return
        }
      }

      const bankAccountData: any = {
        name: formData.name,
        bankName: formData.bankName,
        accountNumber: formData.accountNumber,
        initialBalance: formData.initialBalance, // 初始余额
        currency: formData.currency,
        isActive: formData.isActive,
        createdByUid: currentUser.uid,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
      
      // 只在新建时设置初始的当前余额
      if (!isEditMode) {
        bankAccountData.balance = formData.initialBalance
      }
      
      console.log('准备保存的银行账户数据:', bankAccountData)

      if (isEditMode && editingBankAccount?.id) {
        console.log('【调试】准备更新银行账户，ID:', editingBankAccount.id)
        console.log('【调试】更新数据:', bankAccountData)
        await updateBankAccount(editingBankAccount.id, bankAccountData)
        console.log('【调试】已调用updateBankAccount')
        toast({
          title: "成功",
          description: "银行账户已更新"
        })
      } else {
        console.log('【调试】准备创建新银行账户')
        console.log('【调试】新建数据:', bankAccountData)
        const newAccountId = await addBankAccount(bankAccountData)
        console.log('【调试】新银行账户ID:', newAccountId)
        toast({
          title: "成功",
          description: "银行账户已创建"
        })
      }

      await fetchBankAccounts()
      setIsFormOpen(false)
      resetForm()
      onBankAccountChange?.()
    } catch (error: any) {
      console.error("Error saving bank account:", error)
      toast({
        title: "错误",
        description: "保存银行账户失败: " + error.message,
        variant: "destructive"
      })
    } finally {
      setSubmitting(false)
    }
  }

  const handleEditBankAccount = (bankAccount: BankAccount) => {
    setEditingBankAccount(bankAccount)
    setFormData({
      name: bankAccount.name,
      bankName: bankAccount.bankName || "",
      accountNumber: bankAccount.accountNumber || "",
      balance: bankAccount.balance, // 这个字段不会被用于保存，只是为了兼容接口
      initialBalance: bankAccount.initialBalance || 0, // 正确使用初始余额
      currency: bankAccount.currency,
      isActive: bankAccount.isActive
    })
    setIsEditMode(true)
    setIsFormOpen(true)
  }

  const handleDeleteBankAccount = async () => {
    if (!deletingBankAccount?.id) return

    setDeleting(true)
    try {
      await deleteBankAccount(deletingBankAccount.id)
      await fetchBankAccounts()
      setIsDeleteDialogOpen(false)
      setDeletingBankAccount(null)
      toast({
        title: "成功",
        description: "银行账户已删除"
      })
      onBankAccountChange?.()
    } catch (error: any) {
      console.error("Error deleting bank account:", error)
      toast({
        title: "错误",
        description: "删除银行账户失败: " + error.message,
        variant: "destructive"
      })
    } finally {
      setDeleting(false)
    }
  }

  const handleToggleActive = async (bankAccount: BankAccount) => {
    setTogglingStatus(bankAccount.id!)
    try {
      await updateBankAccount(bankAccount.id!, {
        isActive: !bankAccount.isActive
      })
      await fetchBankAccounts()
      toast({
        title: "成功",
        description: `银行账户已${!bankAccount.isActive ? '启用' : '禁用'}`
      })
      onBankAccountChange?.()
    } catch (error: any) {
      console.error("Error toggling bank account status:", error)
      toast({
        title: "错误",
        description: "更新银行账户状态失败: " + error.message,
        variant: "destructive"
      })
    } finally {
      setTogglingStatus(null)
    }
  }

  if (loading) {
    return <div className="p-6 text-center">加载银行账户...</div>
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">银行账户管理</h1>
          <p className="text-muted-foreground">管理多个银行账户，设置账户信息和状态。</p>
        </div>
        {hasPermission(RoleLevels[UserRoles.ASSISTANT_VICE_PRESIDENT]) && (
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              onClick={() => window.location.href = "/bank-account-management"}
            >
              管理银行账户
            </Button>
          </div>
        )}
      </div>

      {/* 统计信息 */}
      {stats && (
        <div className="grid gap-4 grid-cols-2 md:grid-cols-5">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">总账户数</CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalBankAccounts}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">活跃账户</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.activeBankAccounts}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">禁用账户</CardTitle>
              <XCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats.inactiveBankAccounts}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">总交易数</CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalTransactions}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">总余额</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${stats.totalBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                ${stats.totalBalance.toFixed(2)}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 银行账户列表 */}
      <Card>
        <CardHeader>
          <CardTitle>银行账户列表</CardTitle>
          <CardDescription>
            管理所有银行账户，包括账户信息、余额和状态。
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {bankAccounts.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                暂无银行账户，点击"添加银行账户"开始创建。
              </div>
            ) : (
              bankAccounts.map((account) => (
                <div
                  key={account.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0">
                      <Building2 className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <h3 className="text-lg font-semibold truncate">{account.name}</h3>
                        <Badge variant={account.isActive ? "default" : "secondary"}>
                          {account.isActive ? "活跃" : "禁用"}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {account.bankName} • {account.accountNumber || "无账号"}
                      </p>
                      <p className="text-sm font-medium">
                        余额: <span className={account.balance >= 0 ? 'text-green-600' : 'text-red-600'}>
                          {account.currency === 'MYR' ? 'RM' : account.currency === 'USD' ? '$' : account.currency === 'EUR' ? '€' : account.currency === 'GBP' ? '£' : account.currency === 'JPY' ? '¥' : account.currency === 'SGD' ? 'S$' : account.currency === 'HKD' ? 'HK$' : account.currency === 'KRW' ? '₩' : account.currency === 'AUD' ? 'A$' : account.currency === 'CAD' ? 'C$' : account.currency === 'CHF' ? 'CHF' : '¥'}{account.balance.toFixed(2)} {account.currency}
                        </span>
                      </p>
                    </div>
                  </div>
                  {hasPermission(RoleLevels[UserRoles.ASSISTANT_VICE_PRESIDENT]) && (
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleToggleActive(account)}
                        disabled={togglingStatus === account.id}
                      >
                        {togglingStatus === account.id ? "更新中..." : (account.isActive ? "禁用" : "启用")}
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            •••
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEditBankAccount(account)}>
                            <Edit className="h-4 w-4 mr-2" />
                            编辑
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-red-600"
                            onClick={() => {
                              setDeletingBankAccount(account)
                              setIsDeleteDialogOpen(true)
                            }}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            删除
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* 银行账户表单对话框 */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{isEditMode ? "编辑银行账户" : "添加银行账户"}</DialogTitle>
            <DialogDescription>
              {isEditMode ? "修改银行账户信息" : "创建新的银行账户"}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleFormSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">银行账户名称 *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="例如：工商银行主账户"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bankName">银行名称 *</Label>
              <Input
                id="bankName"
                value={formData.bankName}
                onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                placeholder="例如：中国工商银行"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="accountNumber">银行账号</Label>
              <Input
                id="accountNumber"
                value={formData.accountNumber}
                onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })}
                placeholder="例如：6222********1234"
              />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="initialBalance">初始余额</Label>
                <Input
                  id="initialBalance"
                  type="number"
                  step="0.01"
                  value={formData.initialBalance}
                  onChange={(e) => setFormData({ ...formData, initialBalance: parseFloat(e.target.value) || 0 })}
                  placeholder="0.00"
                />
                <p className="text-xs text-muted-foreground">账户的期初余额，作为计算基础</p>
              </div>
              <div className="space-y-2">
                {isEditMode && editingBankAccount && (
                  <>
                    <Label htmlFor="currentBalance">当前余额</Label>
                    <Input
                      id="currentBalance"
                      type="number"
                      value={editingBankAccount.balance}
                      disabled
                      className="bg-muted"
                    />
                    <p className="text-xs text-muted-foreground">
                      系统自动计算：初始余额 + 所有交易净额
                    </p>
                  </>
                )}
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="currency">货币类型</Label>
                <Select value={formData.currency} onValueChange={(value) => 
                  setFormData({ ...formData, currency: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(CURRENCY_TYPES).map(([code, name]) => (
                      <SelectItem key={code} value={code}>
                        {name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="isActive">账户状态</Label>
              <Select value={formData.isActive ? "active" : "inactive"} onValueChange={(value) => 
                setFormData({ ...formData, isActive: value === "active" })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">活跃</SelectItem>
                  <SelectItem value="inactive">禁用</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)}>
                取消
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? "保存中..." : (isEditMode ? "更新银行账户" : "添加银行账户")}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* 删除确认对话框 */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>删除银行账户</DialogTitle>
            <DialogDescription>
              您确定要删除银行账户 "{deletingBankAccount?.name}" 吗？此操作无法撤销。
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center gap-2 text-red-700">
                <Trash2 className="h-4 w-4" />
                <span className="text-sm font-medium">警告</span>
              </div>
              <p className="text-sm text-red-600 mt-1">
                删除银行账户将永久移除该账户，但不会删除相关的交易记录。
              </p>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
                取消
              </Button>
              <Button variant="destructive" onClick={handleDeleteBankAccount} disabled={deleting}>
                {deleting ? "删除中..." : "确认删除"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
} 