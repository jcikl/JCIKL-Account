"use client"

import { AccountingDashboardOptimized } from "@/components/accounting-dashboard-optimized"
import { AuthProvider, useAuth } from "@/components/auth/auth-context"
import { AuthForm } from "@/components/auth/auth-form"
import { PerformanceMonitor } from "@/components/performance-monitor"

function AppContent() {
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
    return <AuthForm />
  }

  return (
    <>
      <AccountingDashboardOptimized />
      <PerformanceMonitor />
    </>
  )
}

export default function Page() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  )
}
