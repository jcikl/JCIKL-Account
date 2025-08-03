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
import { AccountFormDialog } from "./account-form-dialog"
import { ExportDialog } from "./export-dialog"
import { ImportDialog } from "./import-dialog"
import { AccountSummary } from "./account-summary"
import { exportAccountData } from "@/lib/export-utils"
import { addAccount, updateAccount, deleteAccount, getAccounts } from "@/lib/firebase-utils"
import { useToast } from "@/hooks/use-toast"
import type { Account } from "@/lib/data"

interface AccountChartProps {
  accounts?: Account[]
  onAccountSelect?: (account: Account) => void
  onAccountEdit?: (account: Account) => void
  onAccountDelete?: (accountId: string) => void
  onAccountAdd?: () => void
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

export function AccountChart({ 
  accounts: propAccounts, 
  onAccountSelect, 
  onAccountEdit, 
  onAccountDelete, 
  onAccountAdd,
  onAccountsImport,
  enableFirebase = true
}: AccountChartProps) {
  const [accounts, setAccounts] = React.useState<Account[]>(propAccounts || [])
  const [loading, setLoading] = React.useState(false)
  const [saving, setSaving] = React.useState(false)
  const { toast } = useToast()
  
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

  // Load accounts from Firebase on component mount
  React.useEffect(() => {
    if (enableFirebase && !propAccounts) {
      loadAccountsFromFirebase()
    } else if (propAccounts) {
      setAccounts(propAccounts)
    }
  }, [enableFirebase, propAccounts])

  // Load accounts from Firebase
  const loadAccountsFromFirebase = async () => {
    try {
      setLoading(true)
      console.log('Loading accounts from Firebase...')
      const firebaseAccounts = await getAccounts()
      setAccounts(firebaseAccounts)
      console.log(`Loaded ${firebaseAccounts.length} accounts from Firebase`)
      toast({
        title: "账户加载成功",
        description: `已加载 ${firebaseAccounts.length} 个账户`,
      })
    } catch (error) {
      console.error('Error loading accounts:', error)
      toast({
        title: "账户加载失败",
        description: `加载账户时出错: ${error}`,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // Get all account types
  const accountTypes = React.useMemo(() => {
    const types = new Set(accounts.map(account => account.type))
    return Array.from(types)
  }, [accounts])

  // Filter and sort accounts
  const filteredAndSortedAccounts = React.useMemo(() => {
    let filtered = accounts.filter(account => {
      // Search filter
      const matchesSearch = !filters.search || 
        account.code.toLowerCase().includes(filters.search.toLowerCase()) ||
        account.name.toLowerCase().includes(filters.search.toLowerCase())
      
      // Type filter
      const matchesType = filters.type === "all" || account.type === filters.type
      
      // Balance range filter
      const matchesBalance = (() => {
        switch (filters.balanceRange) {
          case "positive":
            return account.balance > 0
          case "negative":
            return account.balance < 0
          case "zero":
            return account.balance === 0
          case "high":
            return account.balance >= 10000
          case "low":
            return account.balance <= 1000
          default:
            return true
        }
      })()

      return matchesSearch && matchesType && matchesBalance
    })

    // Sort
    filtered.sort((a, b) => {
      let aValue: string | number
      let bValue: string | number

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

      if (typeof aValue === "string" && typeof bValue === "string") {
        return sortOrder === "asc" 
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue)
      } else {
        return sortOrder === "asc" 
          ? (aValue as number) - (bValue as number)
          : (bValue as number) - (aValue as number)
      }
    })

    return filtered
  }, [accounts, filters, sortBy, sortOrder])

  // Statistics
  const stats = React.useMemo(() => {
    const totalAccounts = accounts.length
    const totalBalance = accounts.reduce((sum, account) => sum + account.balance, 0)
    const positiveAccounts = accounts.filter(account => account.balance > 0).length
    const negativeAccounts = accounts.filter(account => account.balance < 0).length

    const typeStats = accountTypes.map(type => {
      const accountsOfType = accounts.filter(account => account.type === type)
      const totalBalanceOfType = accountsOfType.reduce((sum, account) => sum + account.balance, 0)
      return {
        type,
        count: accountsOfType.length,
        totalBalance: totalBalanceOfType,
        percentage: (accountsOfType.length / totalAccounts) * 100
      }
    })

    return {
      totalAccounts,
      totalBalance,
      positiveAccounts,
      negativeAccounts,
      typeStats
    }
  }, [accounts, accountTypes])

  // Handle account selection
  const handleAccountSelect = (account: Account) => {
    setSelectedAccount(account)
    setShowAccountDetails(true)
    onAccountSelect?.(account)
  }

  // Handle account edit
  const handleAccountEdit = (account: Account) => {
    setEditingAccount(account)
    setShowAccountForm(true)
    onAccountEdit?.(account)
  }

  // Handle account delete
  const handleAccountDelete = async (accountId: string) => {
    if (!confirm("确定要删除这个账户吗？此操作不可撤销。")) {
      return
    }

    try {
      setSaving(true)
      if (enableFirebase) {
        await deleteAccount(accountId)
        console.log('Account deleted from Firebase')
      }
      
      setAccounts(prev => prev.filter(account => account.id !== accountId))
      onAccountDelete?.(accountId)
      
      toast({
        title: "账户删除成功",
        description: "账户已从系统中删除",
      })
    } catch (error) {
      console.error('Error deleting account:', error)
      toast({
        title: "账户删除失败",
        description: `删除账户时出错: ${error}`,
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  // Handle bulk selection
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedAccounts(new Set(filteredAndSortedAccounts.map(account => account.id!)))
    } else {
      setSelectedAccounts(new Set())
    }
  }

  // Handle single selection
  const handleSelectAccount = (accountId: string, checked: boolean) => {
    const newSelected = new Set(selectedAccounts)
    if (checked) {
      newSelected.add(accountId)
    } else {
      newSelected.delete(accountId)
    }
    setSelectedAccounts(newSelected)
  }

  // Handle add account
  const handleAddAccount = () => {
    setEditingAccount(null)
    setShowAccountForm(true)
  }

  // Handle save account
  const handleSaveAccount = async (accountData: {
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
        // Edit existing account
        if (enableFirebase) {
          await updateAccount(editingAccount.id!, accountData)
          console.log('Account updated in Firebase')
        }
        
        const updatedAccount = { ...editingAccount, ...accountData }
        setAccounts(prev => prev.map(account => 
          account.id === editingAccount.id ? updatedAccount : account
        ))
        onAccountEdit?.(updatedAccount)
        
        toast({
          title: "账户更新成功",
          description: "账户信息已更新",
        })
      } else {
        // Add new account
        const newAccountData = {
          ...accountData,
          financialStatement: accountData.type === "Asset" || accountData.type === "Liability" || accountData.type === "Equity" 
            ? "Balance Sheet" 
            : "Income Statement"
        }
        
        let newAccountId: string
        if (enableFirebase) {
          newAccountId = await addAccount(newAccountData)
          console.log('Account added to Firebase with ID:', newAccountId)
        } else {
          newAccountId = Date.now().toString()
        }
        
        const newAccount: Account = {
          id: newAccountId,
          ...newAccountData
        }
        
        setAccounts(prev => [...prev, newAccount])
        onAccountAdd?.()
        
        toast({
          title: "账户创建成功",
          description: `账户 "${accountData.name}" 已创建`,
        })
      }
    } catch (error) {
      console.error('Error saving account:', error)
      toast({
        title: "操作失败",
        description: `保存账户时出错: ${error}`,
        variant: "destructive",
      })
    } finally {
      setSaving(false)
      setShowAccountForm(false)
    }
  }

  // Handle export
  const handleExport = (exportOptions: {
    format: 'csv' | 'excel' | 'pdf'
    includeStats: boolean
    includeTypeDistribution: boolean
    includeDetails: boolean
    selectedAccountsOnly: boolean
  }) => {
    try {
      const exportOptionsWithSelectedIds = {
        ...exportOptions,
        selectedAccountIds: selectedAccounts
      }

      exportAccountData(accounts, exportOptionsWithSelectedIds)
      toast({
        title: "导出成功",
        description: "账户数据已导出",
      })
    } catch (error) {
      console.error('Export failed:', error)
      toast({
        title: "导出失败",
        description: `导出时出错: ${error}`,
        variant: "destructive",
      })
    }
  }

  // Handle import
  const handleImport = async (importedAccounts: Array<{
    code: string
    name: string
    type: "Asset" | "Liability" | "Equity" | "Revenue" | "Expense"
    financialStatement: string
    description?: string
  }>) => {
    try {
      setSaving(true)
      console.log('开始导入账户:', importedAccounts.length)
      
      let importedCount = 0
      let updatedCount = 0
      
      if (enableFirebase) {
        // 批量处理账户到 Firebase
        console.log('批量处理账户到 Firebase...')
        
        // 首先重新加载最新的账户数据以确保数据是最新的
        await loadAccountsFromFirebase()
        
        for (const accountData of importedAccounts) {
          try {
            // 检查账户是否已存在
            const existingAccount = accounts.find(acc => acc.code === accountData.code)
            
            if (existingAccount) {
              // 更新现有账户
              const updateData = {
                name: accountData.name,
                type: accountData.type,
                financialStatement: accountData.financialStatement,
                description: accountData.description || "",
                parent: existingAccount.parent || ""
              }
              
              await updateAccount(existingAccount.id!, updateData)
              updatedCount++
              console.log(`✅ 账户已更新: ${accountData.code} - ${accountData.name}`)
            } else {
              // 添加新账户
              const newAccountData: Omit<Account, "id"> = {
                code: accountData.code,
                name: accountData.name,
                type: accountData.type,
                balance: 0, // 默认余额为 0
                financialStatement: accountData.financialStatement,
                description: accountData.description || "",
                parent: ""
              }
              
              await addAccount(newAccountData)
              importedCount++
              console.log(`✅ 新账户已添加: ${accountData.code} - ${accountData.name}`)
            }
          } catch (error) {
            console.error(`❌ 处理账户失败: ${accountData.code}`, error)
            // 继续处理其他账户
          }
        }
      } else {
        // 本地状态处理
        const newAccounts: Account[] = []
        const updatedAccounts: Account[] = []
        
        for (const accountData of importedAccounts) {
          const existingAccount = accounts.find(acc => acc.code === accountData.code)
          
          if (existingAccount) {
            // 更新现有账户
            const updatedAccount = {
              ...existingAccount,
              name: accountData.name,
              type: accountData.type,
              financialStatement: accountData.financialStatement,
              description: accountData.description || ""
            }
            updatedAccounts.push(updatedAccount)
            updatedCount++
          } else {
            // 添加新账户
            const newAccount: Account = {
              id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
              code: accountData.code,
              name: accountData.name,
              type: accountData.type,
              balance: 0,
              financialStatement: accountData.financialStatement,
              description: accountData.description || "",
              parent: ""
            }
            newAccounts.push(newAccount)
            importedCount++
          }
        }
        
        // 更新本地状态
        setAccounts(prev => {
          const filteredAccounts = prev.filter(acc => 
            !updatedAccounts.some(updated => updated.id === acc.id) &&
            !newAccounts.some(newAcc => newAcc.code === acc.code)
          )
          return [...filteredAccounts, ...updatedAccounts, ...newAccounts]
        })
      }
      
      // 重新加载账户数据以确保同步
      if (enableFirebase) {
        await loadAccountsFromFirebase()
      }
      
      // 调用父组件的回调
      onAccountsImport?.(importedAccounts)
      
      const totalProcessed = importedCount + updatedCount
      console.log(`✅ 成功处理 ${totalProcessed} 个账户 (新增: ${importedCount}, 更新: ${updatedCount})`)
      
      toast({
        title: "导入成功",
        description: `已成功处理 ${totalProcessed} 个账户 (新增: ${importedCount}, 更新: ${updatedCount})`,
      })
      
    } catch (error) {
      console.error('导入失败:', error)
      toast({
        title: "导入失败",
        description: `导入时出错: ${error}`,
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  // Get account type color
  const getAccountTypeColor = (type: string) => {
    switch (type) {
      case "Asset":
        return "bg-blue-100 text-blue-800 border-blue-200"
      case "Liability":
        return "bg-red-100 text-red-800 border-red-200"
      case "Equity":
        return "bg-purple-100 text-purple-800 border-purple-200"
      case "Revenue":
        return "bg-green-100 text-green-800 border-green-200"
      case "Expense":
        return "bg-orange-100 text-orange-800 border-orange-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  // Get balance status
  const getBalanceStatus = (balance: number) => {
    if (balance > 0) {
      return { variant: "default" as const, icon: TrendingUp, color: "text-green-600" }
    } else if (balance < 0) {
      return { variant: "destructive" as const, icon: TrendingDown, color: "text-red-600" }
    } else {
      return { variant: "secondary" as const, icon: Activity, color: "text-gray-600" }
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">正在加载账户数据...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Enhanced account summary */}
      <AccountSummary 
        accounts={accounts}
        onRefresh={loadAccountsFromFirebase}
      />

      {/* Toolbar */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>账户图表</CardTitle>
              <CardDescription>管理您的会计账户</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setShowImportDialog(true)}>
                <Upload className="h-4 w-4 mr-2" />
                导入
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
                添加账户
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Search and sort */}
          <div className="flex items-center gap-4 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="搜索账户代码或名称..."
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                className="pl-8"
              />
            </div>
            <Select value={filters.type} onValueChange={(value) => setFilters(prev => ({ ...prev, type: value }))}>
              <SelectTrigger className="w-[150px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">所有类型</SelectItem>
                {accountTypes.map(type => (
                  <SelectItem key={type} value={type}>{type}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filters.balanceRange} onValueChange={(value) => setFilters(prev => ({ ...prev, balanceRange: value }))}>
              <SelectTrigger className="w-[150px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">所有余额</SelectItem>
                <SelectItem value="positive">正余额</SelectItem>
                <SelectItem value="negative">负余额</SelectItem>
                <SelectItem value="zero">零余额</SelectItem>
                <SelectItem value="high">高余额 (≥10,000)</SelectItem>
                <SelectItem value="low">低余额 (≤1,000)</SelectItem>
              </SelectContent>
            </Select>
            <Select value={`${sortBy}-${sortOrder}`} onValueChange={(value) => {
              const [newSortBy, newSortOrder] = value.split('-') as [typeof sortBy, typeof sortOrder]
              setSortBy(newSortBy)
              setSortOrder(newSortOrder)
            }}>
              <SelectTrigger className="w-[150px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="code-asc">代码 (A-Z)</SelectItem>
                <SelectItem value="code-desc">代码 (Z-A)</SelectItem>
                <SelectItem value="name-asc">名称 (A-Z)</SelectItem>
                <SelectItem value="name-desc">名称 (Z-A)</SelectItem>
                <SelectItem value="type-asc">类型 (A-Z)</SelectItem>
                <SelectItem value="type-desc">类型 (Z-A)</SelectItem>
                <SelectItem value="balance-asc">余额 (低-高)</SelectItem>
                <SelectItem value="balance-desc">余额 (高-低)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Account table */}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox
                    checked={selectedAccounts.size === filteredAndSortedAccounts.length && filteredAndSortedAccounts.length > 0}
                    onCheckedChange={handleSelectAll}
                  />
                </TableHead>
                <TableHead>账户代码</TableHead>
                <TableHead>账户名称</TableHead>
                <TableHead>账户类型</TableHead>
                <TableHead className="text-right">当前余额</TableHead>
                <TableHead>状态</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAndSortedAccounts.map((account) => {
                const balanceStatus = getBalanceStatus(account.balance)
                const BalanceIcon = balanceStatus.icon
                
                return (
                  <TableRow key={account.id} className="hover:bg-muted/50">
                    <TableCell>
                      <Checkbox
                        checked={selectedAccounts.has(account.id!)}
                        onCheckedChange={(checked) => handleSelectAccount(account.id!, checked as boolean)}
                      />
                    </TableCell>
                    <TableCell className="font-medium">{account.code}</TableCell>
                    <TableCell>{account.name}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-xs border ${getAccountTypeColor(account.type)}`}>
                        {account.type}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <BalanceIcon className={`h-4 w-4 ${balanceStatus.color}`} />
                        <span className={`font-mono ${balanceStatus.color}`}>
                          ${account.balance.toLocaleString()}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={balanceStatus.variant}>
                        {account.balance > 0 ? "正余额" : account.balance < 0 ? "负余额" : "零余额"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleAccountSelect(account)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleAccountEdit(account)}
                          disabled={saving}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleAccountDelete(account.id!)}
                          disabled={saving}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>

          {/* Pagination info */}
          <div className="flex items-center justify-between mt-4">
            <p className="text-sm text-muted-foreground">
              显示 {filteredAndSortedAccounts.length} 个账户，共 {accounts.length} 个
            </p>
            {selectedAccounts.size > 0 && (
              <p className="text-sm text-muted-foreground">
                已选择 {selectedAccounts.size} 个账户
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Account details dialog */}
      <Dialog open={showAccountDetails} onOpenChange={setShowAccountDetails}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>账户详情</DialogTitle>
            <DialogDescription>
              查看账户的详细信息
            </DialogDescription>
          </DialogHeader>
          
          {selectedAccount && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">账户代码</Label>
                  <p className="text-sm text-muted-foreground">{selectedAccount.code}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">账户名称</Label>
                  <p className="text-sm text-muted-foreground">{selectedAccount.name}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">账户类型</Label>
                  <span className={`inline-block px-2 py-1 rounded-full text-xs border ${getAccountTypeColor(selectedAccount.type)}`}>
                    {selectedAccount.type}
                  </span>
                </div>
                <div>
                  <Label className="text-sm font-medium">当前余额</Label>
                  <p className="text-sm font-mono">${selectedAccount.balance.toLocaleString()}</p>
                </div>
              </div>

              {selectedAccount.description && (
                <div>
                  <Label className="text-sm font-medium">账户描述</Label>
                  <p className="text-sm text-muted-foreground">{selectedAccount.description}</p>
                </div>
              )}

              <Separator />

              <div className="space-y-4">
                <h4 className="text-sm font-medium">账户统计</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 border rounded-lg">
                    <p className="text-xs text-muted-foreground">账户状态</p>
                    <Badge variant={getBalanceStatus(selectedAccount.balance).variant}>
                      {selectedAccount.balance > 0 ? "正余额" : selectedAccount.balance < 0 ? "负余额" : "零余额"}
                    </Badge>
                  </div>
                  <div className="p-3 border rounded-lg">
                    <p className="text-xs text-muted-foreground">余额趋势</p>
                    <div className="flex items-center space-x-1">
                      {(() => {
                        const status = getBalanceStatus(selectedAccount.balance)
                        const Icon = status.icon
                        return <Icon className="h-4 w-4 text-muted-foreground" />
                      })()}
                      <span className="text-sm">稳定</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setShowAccountDetails(false)}>
                  关闭
                </Button>
                <Button onClick={() => {
                  handleAccountEdit(selectedAccount)
                  setShowAccountDetails(false)
                }}>
                  编辑账户
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Account form dialog */}
      <AccountFormDialog
        open={showAccountForm}
        onOpenChange={setShowAccountForm}
        account={editingAccount}
        onSave={handleSaveAccount}
      />

      {/* Export dialog */}
      <ExportDialog
        open={showExportDialog}
        onOpenChange={setShowExportDialog}
        accounts={accounts}
        selectedAccounts={selectedAccounts}
        onExport={handleExport}
      />

      {/* Import dialog */}
      <ImportDialog
        open={showImportDialog}
        onOpenChange={setShowImportDialog}
        existingAccounts={accounts}
        onImport={handleImport}
      />
    </div>
  )
} 