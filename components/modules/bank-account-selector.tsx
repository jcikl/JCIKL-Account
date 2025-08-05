"use client"

import * as React from "react"
import { Building2, CheckCircle, XCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { getBankAccounts, getBankAccountById, getTransactionsByBankAccount } from "@/lib/firebase-utils"
import type { BankAccount } from "@/lib/data"

interface BankAccountSelectorProps {
  value?: string
  onValueChange: (value: string) => void
  placeholder?: string
  disabled?: boolean
  showActiveOnly?: boolean
  className?: string
}

/**
 * 银行账户选择器组件
 * @param value - 当前选中的银行账户ID
 * @param onValueChange - 选择变化时的回调函数
 * @param placeholder - 占位符文本
 * @param disabled - 是否禁用
 * @param showActiveOnly - 是否只显示活跃账户
 * @param className - 自定义样式类名
 */
export function BankAccountSelector({ 
  value, 
  onValueChange, 
  placeholder = "选择银行账户",
  disabled = false,
  showActiveOnly = true,
  className
}: BankAccountSelectorProps) {
  const [bankAccounts, setBankAccounts] = React.useState<BankAccount[]>([])
  const [loading, setLoading] = React.useState(true)

  // 验证当前选择的值是否仍然有效
  React.useEffect(() => {
    if (value && bankAccounts.length > 0) {
      const isValidValue = bankAccounts.some(account => account.id === value)
      if (!isValidValue) {
        // 如果当前选择的值无效，清除选择
        onValueChange("")
      }
    }
  }, [value, bankAccounts, onValueChange])

  const fetchBankAccounts = React.useCallback(async () => {
    setLoading(true)
    try {
      const accounts = await getBankAccounts()
      // 如果只显示活跃账户，则过滤
      const filteredAccounts = showActiveOnly 
        ? accounts.filter(account => account.isActive)
        : accounts
      setBankAccounts(filteredAccounts)
    } catch (error: any) {
      console.error("Error fetching bank accounts:", error)
      // 在错误情况下设置空数组
      setBankAccounts([])
    } finally {
      setLoading(false)
    }
  }, [showActiveOnly])



  React.useEffect(() => {
    fetchBankAccounts()
  }, [fetchBankAccounts])

  if (loading) {
    return (
      <div className="space-y-2">
        <Label>银行账户</Label>
        <Select disabled>
          <SelectTrigger className={className}>
            <SelectValue placeholder="加载中..." />
          </SelectTrigger>
        </Select>
      </div>
    )
  }

  if (bankAccounts.length === 0) {
    return (
      <div className="space-y-2">
        <Label>银行账户</Label>
        <div className="p-3 border rounded-md bg-muted/50">
          <p className="text-sm text-muted-foreground text-center">
            暂无银行账户，请先创建银行账户。
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <Label>银行账户</Label>
      <Select 
        value={value} 
        onValueChange={onValueChange}
        disabled={disabled}
        aria-label="选择银行账户"
      >
        <SelectTrigger className={className}>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {bankAccounts.map((account) => (
            <SelectItem key={account.id} value={account.id!}>
              <div className="flex items-center space-x-2">
                <Building2 className="h-4 w-4" />
                <span>{account.name}</span>
                <Badge variant={account.isActive ? "default" : "secondary"} className="ml-auto">
                  {account.isActive ? (
                    <>
                      <CheckCircle className="h-3 w-3 mr-1" />
                      活跃
                    </>
                  ) : (
                    <>
                      <XCircle className="h-3 w-3 mr-1" />
                      禁用
                    </>
                  )}
                </Badge>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

// 银行账户显示组件
interface BankAccountDisplayProps {
  bankAccountId?: string
  bankAccountName?: string
  showDetails?: boolean
  className?: string
}

/**
 * 银行账户显示组件
 * @param bankAccountId - 银行账户ID
 * @param bankAccountName - 银行账户名称
 * @param showDetails - 是否显示详细信息
 * @param className - 自定义样式类名
 */
export function BankAccountDisplay({ 
  bankAccountId, 
  bankAccountName, 
  showDetails = false,
  className 
}: BankAccountDisplayProps) {
  const [bankAccount, setBankAccount] = React.useState<BankAccount | null>(null)
  const [loading, setLoading] = React.useState(false)

  React.useEffect(() => {
    if (bankAccountId) {
      setLoading(true)
      getBankAccountById(bankAccountId)
        .then((account) => {
          setBankAccount(account)
        })
        .catch((error) => {
          console.error("Error fetching bank account:", error)
        })
        .finally(() => {
          setLoading(false)
        })
    } else {
      // 如果没有银行账户ID，清理状态
      setBankAccount(null)
    }
  }, [bankAccountId])

  if (!bankAccountId && !bankAccountName) {
    return (
      <div className={`text-muted-foreground ${className}`}>
        未选择银行账户
      </div>
    )
  }

  if (loading) {
    return (
      <div className={`text-muted-foreground ${className}`}>
        加载中...
      </div>
    )
  }

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <Building2 className="h-4 w-4 text-muted-foreground" />
      <span className="font-medium">
        {bankAccountName || bankAccount?.name || "未知账户"}
      </span>
      {showDetails && (bankAccount?.bankName || bankAccountName) && (
        <Badge variant="outline" className="text-xs">
          {bankAccount?.bankName || "未知银行"}
        </Badge>
      )}
    </div>
  )
}

// 银行账户统计组件
interface BankAccountStatsProps {
  bankAccountId?: string
  className?: string
}

/**
 * 银行账户统计组件
 * @param bankAccountId - 银行账户ID
 * @param className - 自定义样式类名
 */
export function BankAccountStats({ bankAccountId, className }: BankAccountStatsProps) {
  const [stats, setStats] = React.useState<{
    balance: number
    transactionCount: number
  } | null>(null)
  const [loading, setLoading] = React.useState(false)

  React.useEffect(() => {
    if (bankAccountId) {
      setLoading(true)
      Promise.all([
        getBankAccountById(bankAccountId),
        getTransactionsByBankAccount(bankAccountId)
      ])
        .then(([account, transactions]) => {
          if (account) {
            const totalIncome = transactions.reduce((sum, t) => sum + t.income, 0)
            const totalExpense = transactions.reduce((sum, t) => sum + t.expense, 0)
            const balance = account.balance + totalIncome - totalExpense
            
            setStats({
              balance: balance,
              transactionCount: transactions.length
            })
          }
        })
        .catch((error) => {
          console.error("Error fetching bank account stats:", error)
          setStats({
            balance: 0,
            transactionCount: 0
          })
        })
        .finally(() => {
          setLoading(false)
        })
    } else {
      // 如果没有银行账户ID，清理stats
      setStats(null)
    }
  }, [bankAccountId])

  if (!bankAccountId) {
    return null
  }

  if (loading) {
    return (
      <div className={`text-sm text-muted-foreground ${className}`}>
        加载统计信息...
      </div>
    )
  }

  if (!stats) {
    return null
  }

  return (
    <div className={`text-sm text-muted-foreground ${className}`}>
      <span>余额: ${stats.balance.toFixed(2)}</span>
      <span className="mx-2">•</span>
      <span>{stats.transactionCount} 笔交易</span>
    </div>
  )
} 

// 工具函数：根据银行账户ID获取银行账户名称
/**
 * 根据银行账户ID获取银行账户名称的Hook
 * @param bankAccountId - 银行账户ID
 * @returns 包含银行账户名称和加载状态的对象
 */
export function useBankAccountName(bankAccountId?: string) {
  const [bankAccountName, setBankAccountName] = React.useState<string>("")
  const [loading, setLoading] = React.useState(false)

  React.useEffect(() => {
    if (bankAccountId) {
      setLoading(true)
      getBankAccountById(bankAccountId)
        .then((account) => {
          setBankAccountName(account?.name || "")
        })
        .catch((error) => {
          console.error("Error fetching bank account name:", error)
          setBankAccountName("")
        })
        .finally(() => {
          setLoading(false)
        })
    } else {
      setBankAccountName("")
    }
  }, [bankAccountId])

  return { bankAccountName, loading }
} 