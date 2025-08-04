// components/auth/auth-status-checker.tsx
"use client"

import { useEffect } from 'react'
import { useAuth } from './auth-context'
import { mockAuth } from '@/lib/mock-auth'

interface AuthStatusCheckerProps {
  children: React.ReactNode
}

export function AuthStatusChecker({ children }: AuthStatusCheckerProps) {
  const { currentUser, loading } = useAuth()

  useEffect(() => {
    // 检查认证状态是否过期
    if (mockAuth.isExpired()) {
      console.log('认证已过期，自动登出')
      // 这里可以触发自动登出或刷新认证
    }
  }, [currentUser])

  // 如果正在加载，显示加载状态
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">正在验证认证状态...</p>
        </div>
      </div>
    )
  }

  return <>{children}</>
} 