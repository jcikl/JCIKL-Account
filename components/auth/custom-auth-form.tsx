// components/auth/custom-auth-form.tsx
"use client"

import * as React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useCustomAuth } from "./custom-auth-context"

export function CustomAuthForm() {
  const { login, loading } = useCustomAuth()
  const [email, setEmail] = React.useState("")
  const [password, setPassword] = React.useState("")
  const [error, setError] = React.useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    
    try {
      await login(email, password)
    } catch (err: any) {
      setError(err.message)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 dark:bg-gray-950">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl">登录 AccounTech</CardTitle>
          <CardDescription>
            使用邮箱和密码登录您的账户（自定义认证系统）
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="email">邮箱</Label>
              <Input
                id="email"
                type="email"
                placeholder="m@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="password">密码</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "加载中..." : "登录"}
            </Button>
          </form>
          
          {/* 开发模式快速登录提示 */}
          <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
            <h4 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">
              💡 开发模式测试账户
            </h4>
            <div className="text-xs text-blue-700 dark:text-blue-300 space-y-1">
              <p>• 管理员: admin@jcikl.com / admin123</p>
              <p>• 用户: user@jcikl.com / user123</p>
              <p>• 经理: manager@jcikl.com / manager123</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 