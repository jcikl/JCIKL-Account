"use client"

import { BankTransactions } from "@/components/modules/bank-transactions"
import { useAuth } from "@/components/auth/auth-context"

export default function TestBankTransactionsPage() {
  const { currentUser, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>加载认证信息...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">银行交易编辑功能测试</h1>
        <p className="text-muted-foreground">测试银行交易页面的编辑功能，包括项目年份筛选</p>
        {currentUser && (
          <div className="mt-2 text-sm text-muted-foreground">
            当前用户: {currentUser.displayName} ({currentUser.email}) - {currentUser.role}
          </div>
        )}
      </div>
      
      <BankTransactions />
    </div>
  )
} 