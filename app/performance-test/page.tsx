"use client"

import React from "react"
import { useAuth } from "@/components/auth/auth-context"

export default function PerformanceTestPage() {
  const { currentUser, loading, isAuthenticated, logout } = useAuth()

  const handleLogout = async () => {
    try {
      await logout()
    } catch (error) {
      console.error('登出失败:', error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">加载认证信息...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">
            认证持久化测试页面
          </h1>
          
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h2 className="text-lg font-semibold text-blue-900 mb-2">
                认证状态
              </h2>
              <div className="space-y-2">
                <p className="text-sm">
                  <span className="font-medium">已认证:</span> {isAuthenticated ? '✅ 是' : '❌ 否'}
                </p>
                {currentUser && (
                  <>
                    <p className="text-sm">
                      <span className="font-medium">用户:</span> {currentUser.displayName}
                    </p>
                    <p className="text-sm">
                      <span className="font-medium">邮箱:</span> {currentUser.email}
                    </p>
                    <p className="text-sm">
                      <span className="font-medium">角色:</span> {currentUser.role}
                    </p>
                    <p className="text-sm">
                      <span className="font-medium">最后登录:</span> {new Date(currentUser.lastLogin).toLocaleString()}
                    </p>
                  </>
                )}
              </div>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h2 className="text-lg font-semibold text-yellow-900 mb-2">
                测试说明
              </h2>
              <div className="space-y-2 text-sm text-yellow-800">
                <p>1. 请先在其他页面登录</p>
                <p>2. 然后刷新此页面 (F5)</p>
                <p>3. 如果认证状态保持，说明持久化功能正常</p>
                <p>4. 如果要求重新登录，说明持久化功能有问题</p>
              </div>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h2 className="text-lg font-semibold text-green-900 mb-2">
                测试账户
              </h2>
              <div className="space-y-1 text-sm text-green-800">
                <p><strong>管理员:</strong> admin@jcikl.com / admin123</p>
                <p><strong>用户:</strong> user@jcikl.com / user123</p>
                <p><strong>经理:</strong> manager@jcikl.com / manager123</p>
              </div>
            </div>

            {isAuthenticated && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <h2 className="text-lg font-semibold text-red-900 mb-2">
                  操作
                </h2>
                <button
                  onClick={handleLogout}
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  登出
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
} 