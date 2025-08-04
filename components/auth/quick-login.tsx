// components/auth/quick-login.tsx
"use client"

import { useState } from 'react'
import { useAuth } from './auth-context'
import { MOCK_CREDENTIALS } from '@/lib/mock-auth'

export function QuickLogin() {
  const { login } = useAuth()
  const [loading, setLoading] = useState<string | null>(null)

  const handleQuickLogin = async (role: keyof typeof MOCK_CREDENTIALS) => {
    try {
      setLoading(role)
      const credentials = MOCK_CREDENTIALS[role]
      await login(credentials.email, credentials.password)
    } catch (error) {
      console.error(`快速登录失败 (${role}):`, error)
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900">快速登录（开发模式）</h3>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {Object.entries(MOCK_CREDENTIALS).map(([role, credentials]) => (
          <button
            key={role}
            onClick={() => handleQuickLogin(role as keyof typeof MOCK_CREDENTIALS)}
            disabled={loading === role}
            className="flex flex-col items-center p-4 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="text-sm font-medium text-gray-900 capitalize">{role}</div>
            <div className="text-xs text-gray-500 mt-1">{credentials.email}</div>
            {loading === role && (
              <div className="mt-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              </div>
            )}
          </button>
        ))}
      </div>
      <div className="text-xs text-gray-500">
        <p>💡 提示：这些是开发模式的测试账户，密码格式为：邮箱前缀 + "123"</p>
      </div>
    </div>
  )
} 