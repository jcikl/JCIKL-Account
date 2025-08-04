// components/auth/custom-auth-form.tsx
"use client"

import * as React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useCustomAuth } from "./custom-auth-context"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { UserRoles } from "@/lib/data"

export function CustomAuthForm() {
  const { login, signup, loading } = useCustomAuth()
  const [isLogin, setIsLogin] = React.useState(true)
  const [email, setEmail] = React.useState("")
  const [password, setPassword] = React.useState("")
  const [displayName, setDisplayName] = React.useState("")
  const [role, setRole] = React.useState<string>(UserRoles.ASSISTANT_VICE_PRESIDENT)
  const [error, setError] = React.useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    
    try {
      if (isLogin) {
        await login(email, password)
      } else {
        await signup(email, password, displayName, role as UserRoles)
      }
    } catch (err: any) {
      setError(err.message)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 dark:bg-gray-950">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl">
            {isLogin ? "登录 AccounTech" : "注册新用户"}
          </CardTitle>
          <CardDescription>
            {isLogin 
              ? "使用邮箱和密码登录您的账户" 
              : "填写信息创建新账户（自定义认证系统）"
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div>
                <Label htmlFor="displayName">显示名称</Label>
                <Input
                  id="displayName"
                  type="text"
                  placeholder="您的姓名"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  required
                />
              </div>
            )}
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
            {!isLogin && (
              <div>
                <Label htmlFor="role">角色</Label>
                <Select value={role} onValueChange={setRole}>
                  <SelectTrigger id="role">
                    <SelectValue placeholder="选择角色" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={UserRoles.TREASURER}>财政长</SelectItem>
                    <SelectItem value={UserRoles.PRESIDENT}>会长</SelectItem>
                    <SelectItem value={UserRoles.SECRETARY}>秘书</SelectItem>
                    <SelectItem value={UserRoles.VICE_PRESIDENT}>副会长</SelectItem>
                    <SelectItem value={UserRoles.ASSISTANT_VICE_PRESIDENT}>副会长助理</SelectItem>
                    <SelectItem value={UserRoles.PROJECT_CHAIRMAN}>项目主席</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "加载中..." : isLogin ? "登录" : "注册"}
            </Button>
          </form>
          <div className="mt-4 text-center text-sm">
            {isLogin ? (
              <>
                还没有账户？{" "}
                <Button variant="link" onClick={() => setIsLogin(false)} className="p-0 h-auto">
                  注册
                </Button>
              </>
            ) : (
              <>
                已有账户？{" "}
                <Button variant="link" onClick={() => setIsLogin(true)} className="p-0 h-auto">
                  登录
                </Button>
              </>
            )}
          </div>
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
            <p className="text-blue-600 text-xs">
              💡 使用自定义认证系统，数据存储在 Firestore 中
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 