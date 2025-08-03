"use client"

import { AccountingDashboard } from "@/components/accounting-dashboard"
import { AuthProvider, useAuth } from "@/components/auth/auth-context"
import { AuthForm } from "@/components/auth/auth-form"

function AppContent() {
  const { currentUser, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p>加载认证信息...</p>
      </div>
    )
  }

  if (!currentUser) {
    return <AuthForm />
  }

  return <AccountingDashboard />
}

export default function Page() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  )
}
