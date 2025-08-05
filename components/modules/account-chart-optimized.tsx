"use client"

import * as React from "react"
import { Search, Filter, Download, Plus, Eye, Edit, Trash2, TrendingUp, TrendingDown, DollarSign, Hash, Activity, Upload, Loader2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Separator } from "@/components/ui/separator"
import { Progress } from "@/components/ui/progress"
import { AccountFormDialogOptimized } from "./account-form-dialog-optimized"
import { ExportDialogOptimized } from "./export-dialog-optimized"
import { ImportDialogEnhanced } from "./import-dialog-optimized"
import { AccountSummaryOptimized } from "./account-summary-optimized"
import { exportAccountData } from "@/lib/export-utils"
import { addAccount, updateAccount, deleteAccount, deleteAccounts } from "@/lib/firebase-utils"
import { useOptimizedAccounts } from "@/hooks/use-optimized-data"
import { useToast } from "@/hooks/use-toast"
import type { Account } from "@/lib/data"

interface AccountChartProps {
  accounts?: Account[]
  onAccountSelect?: (account: Account) => void
  onAccountEdit?: (account: Account) => void
  onAccountDelete?: (accountId: string) => void
  onAccountAdd?: (accountData: { code: string; name: string; type: "Asset" | "Liability" | "Equity" | "Revenue" | "Expense"; balance: number; description?: string; parent?: string; }) => void
  onAccountsImport?: (accounts: Array<{
    code: string
    name: string
    type: "Asset" | "Liability" | "Equity" | "Revenue" | "Expense"
    financialStatement: string
    description?: string
  }>) => void
  enableFirebase?: boolean
}

interface AccountFilters {
  search: string
  type: string
  balanceRange: string
}

// 优化的账户行组件
const AccountRow = React.memo(({ 
  account, 
  onSelect, 
  onEdit, 
  onDelete, 
  onView,
  isSelected,
  hasPermission
}: { 
  account: Account
  onSelect: (accountId: string, checked: boolean) => void
  onEdit: (account: Account) => void
  onDelete: (accountId: string) => void
  onView: (account: Account) => void
  isSelected: boolean
  hasPermission: boolean
}) => {
  const getAccountTypeColor = React.useCallback((type: string) => {
    switch (type) {
      case "Asset": return "bg-green-100 text-green-800"
      case "Liability": return "bg-red-100 text-red-800"
      case "Equity": return "bg-blue-100 text-blue-800"
      case "Revenue": return "bg-purple-100 text-purple-800"
      case "Expense": return "bg-orange-100 text-orange-800"
      default: return "bg-gray-100 text-gray-800"
    }
  }, [])

  const getBalanceStatus = React.useCallback((balance: number) => {
    if (balance > 0) return "text-green-600"
    if (balance < 0) return "text-red-600"
    return "text-gray-600"
  }, [])

  return (
    <TableRow className={isSelected ? "bg-muted" : ""}>
      <TableCell>
        <Checkbox
          checked={isSelected}
          onCheckedChange={(checked) => onSelect(account.id!, checked as boolean)}
        />
      </TableCell>
      <TableCell className="font-medium">{account.code}</TableCell>
      <TableCell>{account.name}</TableCell>
      <TableCell>
        <Badge className={getAccountTypeColor(account.type)}>
          {account.type}
        </Badge>
      </TableCell>
      <TableCell className={`text-right font-mono ${getBalanceStatus(account.balance)}`}>
        ${account.balance.toLocaleString()}
      </TableCell>
      <TableCell>{account.description || "-"}</TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onView(account)}
          >
            <Eye className="h-4 w-4" />
          </Button>
          {hasPermission && (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onEdit(account)}
              >
                <Edit className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDelete(account.id!)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>
      </TableCell>
    </TableRow>
  )
}, (prevProps, nextProps) => {
  return prevProps.account.id === nextProps.account.id &&
         prevProps.account.balance === nextProps.account.balance &&
         prevProps.isSelected === nextProps.isSelected
})

// 优化的统计卡片组件
const StatCard = React.memo(({ 
  title, 
  value, 
  change, 
  trend, 
  icon: Icon 
}: { 
  title: string
  value: string
  change: string
  trend: "up" | "down" | "neutral"
  icon: React.ComponentType<{ className?: string }>
}) => (
  <Card>
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium">{title}</CardTitle>
      <Icon className="h-4 w-4 text-muted-foreground" />
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold">{value}</div>
      <p className={`text-xs ${
        trend === "up" ? "text-green-600" : 
        trend === "down" ? "text-red-600" : "text-gray-600"
      }`}>
        {change}
      </p>
    </CardContent>
  </Card>
))

export function AccountChartOptimized({ 
  accounts: propAccounts, 
  onAccountSelect, 
  onAccountEdit, 
  onAccountDelete, 
  onAccountAdd,
  onAccountsImport,
  enableFirebase = true
}: AccountChartProps) {
  const { toast } = useToast()
  
  // 使用优化的数据 hooks
  const { 
    data: accounts, 
    loading: accountsLoading, 
    error: accountsError,
    refetch: refetchAccounts 
  } = useOptimizedAccounts()
  
  const [saving, setSaving] = React.useState(false)
  const [filters, setFilters] = React.useState<AccountFilters>({
    search: "",
    type: "all",
    balanceRange: "all"
  })
  const [sortBy, setSortBy] = React.useState<"code" | "name" | "type" | "balance">("code")
  const [sortOrder, setSortOrder] = React.useState<"asc" | "desc">("asc")
  const [selectedAccounts, setSelectedAccounts] = React.useState<Set<string>>(new Set())
  const [showAccountDetails, setShowAccountDetails] = React.useState(false)
  const [selectedAccount, setSelectedAccount] = React.useState<Account | null>(null)
  const [showAccountForm, setShowAccountForm] = React.useState(false)
  const [editingAccount, setEditingAccount] = React.useState<Account | null>(null)
  const [showExportDialog, setShowExportDialog] = React.useState(false)
  const [showImportDialog, setShowImportDialog] = React.useState(false)
  const [showEnhancedSummary, setShowEnhancedSummary] = React.useState(false)
  const [showBatchDeleteDialog, setShowBatchDeleteDialog] = React.useState(false)

  // 使用传入的账户数据或从Firebase加载
  const displayAccounts = propAccounts || accounts || []

  // 获取账户类型统计
  const accountTypes = React.useMemo(() => {
    const types = new Set(displayAccounts.map(account => account.type))
    return Array.from(types)
  }, [displayAccounts])

  // 优化的过滤和排序逻辑
  const filteredAndSortedAccounts = React.useMemo(() => {
    let filtered = displayAccounts

    // 搜索过滤
    if (filters.search) {
      filtered = filtered.filter(account =>
        account.name.toLowerCase().includes(filters.search.toLowerCase()) ||
        account.code.toLowerCase().includes(filters.search.toLowerCase()) ||
        account.description?.toLowerCase().includes(filters.search.toLowerCase())
      )
    }

    // 类型过滤
    if (filters.type !== "all") {
      filtered = filtered.filter(account => account.type === filters.type)
    }

    // 余额范围过滤
    if (filters.balanceRange !== "all") {
      filtered = filtered.filter(account => {
        switch (filters.balanceRange) {
          case "positive":
            return account.balance > 0
          case "negative":
            return account.balance < 0
          case "zero":
            return account.balance === 0
          default:
            return true
        }
      })
    }

    // 排序
    filtered.sort((a, b) => {
      let aValue: any, bValue: any
      
      switch (sortBy) {
        case "code":
          aValue = a.code
          bValue = b.code
          break
        case "name":
          aValue = a.name
          bValue = b.name
          break
        case "type":
          aValue = a.type
          bValue = b.type
          break
        case "balance":
          aValue = a.balance
          bValue = b.balance
          break
        default:
          aValue = a.code
          bValue = b.code
      }

      if (sortOrder === "asc") {
        return aValue > bValue ? 1 : -1
      } else {
        return aValue < bValue ? 1 : -1
      }
    })

    return filtered
  }, [displayAccounts, filters, sortBy, sortOrder])

  // 优化的统计数据计算
  const stats = React.useMemo(() => {
    const totalAccounts = displayAccounts.length
    const totalBalance = displayAccounts.reduce((sum, account) => sum + account.balance, 0)
    const positiveBalance = displayAccounts.filter(account => account.balance > 0).length
    const negativeBalance = displayAccounts.filter(account => account.balance < 0).length

    return {
      totalAccounts,
      totalBalance,
      positiveBalance,
      negativeBalance,
      averageBalance: totalAccounts > 0 ? totalBalance / totalAccounts : 0
    }
  }, [displayAccounts])

  // 优化的选择处理函数
  const handleSelectAccount = React.useCallback((accountId: string, checked: boolean) => {
    setSelectedAccounts(prev => {
      const newSet = new Set(prev)
      if (checked) {
        newSet.add(accountId)
      } else {
        newSet.delete(accountId)
      }
      return newSet
    })
  }, [])

  const handleSelectAll = React.useCallback((checked: boolean) => {
    if (checked) {
      setSelectedAccounts(new Set(filteredAndSortedAccounts.map(account => account.id!)))
    } else {
      setSelectedAccounts(new Set())
    }
  }, [filteredAndSortedAccounts])

  // 优化的账户操作函数
  const handleAddAccount = React.useCallback(() => {
    setEditingAccount(null)
    setShowAccountForm(true)
  }, [])

  const handleEditAccount = React.useCallback((account: Account) => {
    setEditingAccount(account)
    setShowAccountForm(true)
  }, [])

  const handleDeleteAccount = React.useCallback(async (accountId: string) => {
    if (!confirm("确定要删除这个账户吗？此操作不可撤销。")) {
      return
    }

    try {
      setSaving(true)
      await deleteAccount(accountId)
      
      // 重新获取数据
      if (enableFirebase) {
        await refetchAccounts()
      }
      
      toast({
        title: "账户删除成功",
        description: "账户已从系统中删除",
      })
    } catch (error) {
      toast({
        title: "账户删除失败",
        description: `删除账户时出错: ${error}`,
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }, [enableFirebase, refetchAccounts, toast])

  // 批量删除处理函数
  const handleBatchDelete = React.useCallback(async () => {
    try {
      setSaving(true)
      const accountIdsToDelete = Array.from(selectedAccounts)
      
      if (accountIdsToDelete.length === 0) {
        toast({
          title: "没有选择账户",
          description: "请先选择要删除的账户",
          variant: "destructive",
        })
        return
      }
      
      await deleteAccounts(accountIdsToDelete)
      
      // 重新获取数据
      if (enableFirebase) {
        await refetchAccounts()
      }
      
      setSelectedAccounts(new Set())
      setShowBatchDeleteDialog(false)
      
      toast({
        title: "批量删除成功",
        description: `已删除 ${accountIdsToDelete.length} 个账户`,
      })
    } catch (error) {
      toast({
        title: "批量删除失败",
        description: `删除账户时出错: ${error}`,
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }, [selectedAccounts, enableFirebase, refetchAccounts, toast])

  const handleViewAccount = React.useCallback((account: Account) => {
    setSelectedAccount(account)
    setShowAccountDetails(true)
  }, [])

  const handleSaveAccount = React.useCallback(async (accountData: {
    code: string
    name: string
    type: "Asset" | "Liability" | "Equity" | "Revenue" | "Expense"
    balance: number
    description?: string
    parent?: string
  }) => {
    try {
      setSaving(true)
      
      if (editingAccount) {
        // 更新现有账户
        await updateAccount(editingAccount.id!, accountData)
        
        toast({
          title: "账户更新成功",
          description: "账户信息已更新",
        })
      } else {
        // 添加新账户
        await addAccount(accountData)
        
        toast({
          title: "账户创建成功",
          description: `账户 "${accountData.name}" 已创建`,
        })
      }
      
      // 重新获取数据
      if (enableFirebase) {
        await refetchAccounts()
      }
      
      setShowAccountForm(false)
    } catch (error) {
      toast({
        title: "操作失败",
        description: `保存账户时出错: ${error}`,
        variant: "destructive",
      })
      throw error
    } finally {
      setSaving(false)
    }
  }, [editingAccount, enableFirebase, refetchAccounts, toast])

  // 优化的导出处理函数
  const handleExport = React.useCallback(async (exportOptions: {
    format: 'csv' | 'excel' | 'pdf'
    includeStats: boolean
    includeTypeDistribution: boolean
    includeDetails: boolean
    selectedAccountsOnly: boolean
  }) => {
    try {
      const accountsToExport = exportOptions.selectedAccountsOnly 
        ? filteredAndSortedAccounts.filter(account => selectedAccounts.has(account.id!))
        : filteredAndSortedAccounts

      await exportAccountData(accountsToExport, exportOptions)
      
      toast({
        title: "导出成功",
        description: "账户数据已成功导出",
      })
      
      setShowExportDialog(false)
    } catch (error) {
      toast({
        title: "导出失败",
        description: `导出账户数据时出错: ${error}`,
        variant: "destructive",
      })
    }
  }, [filteredAndSortedAccounts, selectedAccounts, toast])

  // 优化的导入处理函数
  const handleImport = React.useCallback(async (importedAccounts: Array<{
    code: string
    name: string
    type: "Asset" | "Liability" | "Equity" | "Revenue" | "Expense"
    financialStatement: string
    description?: string
  }>) => {
    try {
      setSaving(true)
      
      let importedCount = 0
      let updatedCount = 0
      
      for (const accountData of importedAccounts) {
        try {
          const existingAccount = displayAccounts.find(a => a.code === accountData.code)
          
          if (existingAccount) {
            // 更新现有账户
            await updateAccount(existingAccount.id!, {
              name: accountData.name,
              type: accountData.type,
              description: accountData.description
            })
            updatedCount++
          } else {
            // 添加新账户
            await addAccount({
              ...accountData,
              balance: 0
            })
            importedCount++
          }
        } catch (error) {
          console.error(`处理账户失败: ${accountData.name}`, error)
        }
      }
      
      // 重新获取数据
      if (enableFirebase) {
        await refetchAccounts()
      }
      
      toast({
        title: "账户导入完成",
        description: `成功导入 ${importedCount} 个新账户，更新 ${updatedCount} 个现有账户`,
      })
      
      setShowImportDialog(false)
    } catch (error) {
      toast({
        title: "导入失败",
        description: `导入账户时出错: ${error}`,
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }, [displayAccounts, enableFirebase, refetchAccounts, toast])

  // 加载状态
  if (accountsLoading) {
    return (
      <div className="p-6 text-center">
        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
        <p className="text-muted-foreground">加载账户数据...</p>
      </div>
    )
  }

  // 错误状态
  if (accountsError) {
    return (
      <div className="p-6 text-center">
        <div className="text-red-500 mb-4">
          <h3 className="text-lg font-semibold">加载失败</h3>
          <p className="text-sm text-muted-foreground">
            {(accountsError as any)?.message || '未知错误'}
          </p>
        </div>
        <Button onClick={() => refetchAccounts()} variant="outline">
          重试
        </Button>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">账户图表</h1>
          <p className="text-muted-foreground">管理您的会计账户和分类账。</p>
        </div>
        <div className="flex gap-2">
          {selectedAccounts.size > 0 && (
            <Button 
              variant="destructive" 
              onClick={() => setShowBatchDeleteDialog(true)}
              disabled={saving}
            >
              {saving ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4 mr-2" />
              )}
              批量删除 ({selectedAccounts.size})
            </Button>
          )}
          <Button variant="outline" onClick={() => setShowImportDialog(true)}>
            <Upload className="h-4 w-4 mr-2" />
            导入账户
          </Button>
          <Button variant="outline" onClick={() => setShowExportDialog(true)}>
            <Download className="h-4 w-4 mr-2" />
            导出
          </Button>
          <Button onClick={handleAddAccount} disabled={saving}>
            {saving ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Plus className="h-4 w-4 mr-2" />
            )}
            新账户
          </Button>
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
        <StatCard
          title="总账户数"
          value={stats.totalAccounts.toString()}
          change={`${filteredAndSortedAccounts.length} 个显示`}
          trend="neutral"
          icon={Hash}
        />
        <StatCard
          title="总余额"
          value={`$${stats.totalBalance.toLocaleString()}`}
          change={`平均 $${stats.averageBalance.toLocaleString()}`}
          trend={stats.totalBalance > 0 ? "up" : "down"}
          icon={DollarSign}
        />
        <StatCard
          title="正余额账户"
          value={stats.positiveBalance.toString()}
          change={`${((stats.positiveBalance / stats.totalAccounts) * 100).toFixed(1)}%`}
          trend="up"
          icon={TrendingUp}
        />
        <StatCard
          title="负余额账户"
          value={stats.negativeBalance.toString()}
          change={`${((stats.negativeBalance / stats.totalAccounts) * 100).toFixed(1)}%`}
          trend="down"
          icon={TrendingDown}
        />
      </div>

      {/* 搜索和筛选 */}
      <Card>
        <CardHeader>
          <CardTitle>搜索和筛选</CardTitle>
          <CardDescription>查找特定账户或按条件筛选</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="搜索账户代码、名称..."
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                className="pl-8"
              />
            </div>
            <Select value={filters.type} onValueChange={(value) => setFilters(prev => ({ ...prev, type: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="账户类型" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">所有类型</SelectItem>
                {accountTypes.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filters.balanceRange} onValueChange={(value) => setFilters(prev => ({ ...prev, balanceRange: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="余额范围" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">所有余额</SelectItem>
                <SelectItem value="positive">正余额</SelectItem>
                <SelectItem value="negative">负余额</SelectItem>
                <SelectItem value="zero">零余额</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={(value) => setSortBy(value as "code" | "name" | "type" | "balance")}>
              <SelectTrigger>
                <SelectValue placeholder="排序方式" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="code">按代码</SelectItem>
                <SelectItem value="name">按名称</SelectItem>
                <SelectItem value="type">按类型</SelectItem>
                <SelectItem value="balance">按余额</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* 账户表格 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>所有账户 ({filteredAndSortedAccounts.length})</CardTitle>
              <CardDescription>账户的完整列表和详细信息。</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowEnhancedSummary(true)}
              >
                <Activity className="h-4 w-4 mr-2" />
                增强摘要
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>
                  <Checkbox
                    checked={selectedAccounts.size === filteredAndSortedAccounts.length && filteredAndSortedAccounts.length > 0}
                    onCheckedChange={handleSelectAll}
                  />
                </TableHead>
                <TableHead>账户代码</TableHead>
                <TableHead>账户名称</TableHead>
                <TableHead>类型</TableHead>
                <TableHead className="text-right">余额</TableHead>
                <TableHead>描述</TableHead>
                <TableHead>操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAndSortedAccounts.map((account) => (
                <AccountRow
                  key={account.id}
                  account={account}
                  onSelect={handleSelectAccount}
                  onEdit={handleEditAccount}
                  onDelete={handleDeleteAccount}
                  onView={handleViewAccount}
                  isSelected={selectedAccounts.has(account.id!)}
                  hasPermission={true}
                />
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* 对话框组件 */}
      <AccountFormDialogOptimized
        open={showAccountForm}
        onOpenChange={setShowAccountForm}
        account={editingAccount}
        existingAccounts={displayAccounts}
        onSave={handleSaveAccount}
      />

      <ExportDialogOptimized
        open={showExportDialog}
        onOpenChange={setShowExportDialog}
        accounts={displayAccounts}
        selectedAccounts={selectedAccounts}
        onExport={handleExport}
        selectedCount={selectedAccounts.size}
        totalCount={filteredAndSortedAccounts.length}
      />

      <ImportDialogEnhanced
        open={showImportDialog}
        onOpenChange={setShowImportDialog}
        onImport={handleImport}
        existingAccounts={displayAccounts}
      />

      <Dialog open={showAccountDetails} onOpenChange={setShowAccountDetails}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>账户详情</DialogTitle>
            <DialogDescription>查看账户的详细信息</DialogDescription>
          </DialogHeader>
          {selectedAccount && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>账户代码</Label>
                  <p className="font-medium">{selectedAccount.code}</p>
                </div>
                <div>
                  <Label>账户名称</Label>
                  <p className="font-medium">{selectedAccount.name}</p>
                </div>
                <div>
                  <Label>账户类型</Label>
                  <Badge>{selectedAccount.type}</Badge>
                </div>
                <div>
                  <Label>余额</Label>
                  <p className={`font-medium ${selectedAccount.balance > 0 ? "text-green-600" : "text-red-600"}`}>
                    ${selectedAccount.balance.toLocaleString()}
                  </p>
                </div>
              </div>
              {selectedAccount.description && (
                <div>
                  <Label>描述</Label>
                  <p className="text-sm text-muted-foreground">{selectedAccount.description}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={showEnhancedSummary} onOpenChange={setShowEnhancedSummary}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>增强账户摘要</DialogTitle>
            <DialogDescription>详细的账户统计和分析</DialogDescription>
          </DialogHeader>
          <AccountSummaryOptimized accounts={displayAccounts} />
        </DialogContent>
      </Dialog>

      {/* 批量删除确认对话框 */}
      <Dialog open={showBatchDeleteDialog} onOpenChange={setShowBatchDeleteDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>确认批量删除</DialogTitle>
            <DialogDescription>
              您确定要删除选中的 {selectedAccounts.size} 个账户吗？此操作不可撤销。
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-start space-x-2">
                <Trash2 className="h-5 w-5 text-red-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-red-800">警告</p>
                  <p className="text-sm text-red-700 mt-1">
                    删除账户将永久移除所有相关数据，包括交易记录和余额信息。请确保您已备份重要数据。
                  </p>
                </div>
              </div>
            </div>
            
            {selectedAccounts.size > 0 && (
              <div className="max-h-40 overflow-y-auto">
                <p className="text-sm font-medium mb-2">将要删除的账户：</p>
                <div className="space-y-1">
                  {Array.from(selectedAccounts).slice(0, 10).map(accountId => {
                    const account = displayAccounts.find(a => a.id === accountId)
                    return account ? (
                      <div key={accountId} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <div>
                          <p className="text-sm font-medium">{account.code} - {account.name}</p>
                          <p className="text-xs text-muted-foreground">{account.type}</p>
                        </div>
                        <span className="text-sm font-mono">${account.balance.toLocaleString()}</span>
                      </div>
                    ) : null
                  })}
                  {selectedAccounts.size > 10 && (
                    <p className="text-sm text-muted-foreground text-center py-2">
                      还有 {selectedAccounts.size - 10} 个账户...
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
          
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setShowBatchDeleteDialog(false)}>
              取消
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleBatchDelete}
              disabled={saving}
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  删除中...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  确认删除
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
} 