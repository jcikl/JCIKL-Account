"use client"

import React from "react"
import { EnhancedAuthForm } from "@/components/auth/enhanced-auth-form"
import { EnhancedAuthProvider } from "@/components/auth/enhanced-auth-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useEnhancedAuth } from "@/components/auth/enhanced-auth-context"
import { Shield, Database, Key, User, LogOut, Settings, BarChart3 } from "lucide-react"

function AuthDemo() {
  const { currentUser, logout, getUserStats, isAuthenticated } = useEnhancedAuth()
  const [stats, setStats] = React.useState<any>(null)
  const [showStats, setShowStats] = React.useState(false)

  const handleGetStats = async () => {
    try {
      const userStats = await getUserStats()
      setStats(userStats)
      setShowStats(true)
    } catch (error) {
      console.error('获取统计信息失败:', error)
    }
  }

  if (isAuthenticated && currentUser) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-2">增强认证系统演示</h1>
          <p className="text-muted-foreground">
            用户登录成功！体验增强的认证功能
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <User className="h-5 w-5" />
                <span>用户信息</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="font-medium">邮箱:</span>
                  <span>{currentUser.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">显示名称:</span>
                  <span>{currentUser.displayName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">角色:</span>
                  <span>{currentUser.role}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">认证类型:</span>
                  <Badge variant={currentUser.authType === 'firebase' ? 'default' : 'secondary'}>
                    {currentUser.authType === 'firebase' ? (
                      <>
                        <Key className="h-3 w-3 mr-1" />
                        Firebase Authentication
                      </>
                    ) : (
                      <>
                        <Database className="h-3 w-3 mr-1" />
                        自定义认证
                      </>
                    )}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">创建时间:</span>
                  <span>{new Date(currentUser.createdAt).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">最后登录:</span>
                  <span>{new Date(currentUser.lastLogin).toLocaleString()}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Settings className="h-5 w-5" />
                <span>系统功能</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <Button 
                  onClick={handleGetStats} 
                  className="w-full"
                  variant="outline"
                >
                  <BarChart3 className="h-4 w-4 mr-2" />
                  获取用户统计
                </Button>
                
                <Button 
                  onClick={logout} 
                  className="w-full"
                  variant="destructive"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  登出
                </Button>
              </div>

              {showStats && stats && (
                <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-medium mb-2">用户统计信息</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>总用户数:</span>
                      <span className="font-medium">{stats.totalUsers}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Firebase 用户:</span>
                      <span className="font-medium">{stats.firebaseUsers}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>自定义用户:</span>
                      <span className="font-medium">{stats.customUsers}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>活跃用户:</span>
                      <span className="font-medium">{stats.activeUsers}</span>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Shield className="h-5 w-5" />
              <span>增强认证系统特性</span>
            </CardTitle>
            <CardDescription>
              体验完整的认证功能和安全特性
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <h4 className="font-medium text-green-700">✅ 已实现功能</h4>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center space-x-2">
                    <Key className="h-4 w-4 text-green-600" />
                    <span>Firebase Authentication 集成</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <Database className="h-4 w-4 text-green-600" />
                    <span>Firestore 密码哈希存储</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <Shield className="h-4 w-4 text-green-600" />
                    <span>双重认证安全</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <User className="h-4 w-4 text-green-600" />
                    <span>用户资料同步</span>
                  </li>
                </ul>
              </div>
              
              <div className="space-y-3">
                <h4 className="font-medium text-blue-700">🔧 技术特性</h4>
                <ul className="space-y-2 text-sm">
                  <li>• 24小时认证过期机制</li>
                  <li>• 自动状态恢复</li>
                  <li>• 密码哈希安全存储</li>
                  <li>• 用户统计和分析</li>
                  <li>• 角色权限管理</li>
                  <li>• 实时状态监听</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return <EnhancedAuthForm />
}

export default function EnhancedAuthDemoPage() {
  return (
    <EnhancedAuthProvider>
      <AuthDemo />
    </EnhancedAuthProvider>
  )
} 