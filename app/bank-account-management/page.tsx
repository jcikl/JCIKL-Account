"use client"

import { BankAccountManagement } from "@/components/modules/bank-account-management"
import { useAuth } from "@/components/auth/auth-context"
import { AuthForm } from "@/components/auth/auth-form"

export default function BankAccountManagementPage() {
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

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold tracking-tight">银行账户管理</h1>
          <p className="text-muted-foreground">请先登录以管理银行账户</p>
        </div>
        <AuthForm />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">银行账户管理</h1>
        <p className="text-muted-foreground">管理您的银行账户信息</p>
        <div className="mt-2 text-sm text-muted-foreground">
          当前用户: {currentUser.displayName} ({currentUser.email})
        </div>
      </div>
      
      <BankAccountManagement />
    </div>
  )
} 