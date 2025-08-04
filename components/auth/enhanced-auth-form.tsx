// components/auth/enhanced-auth-form.tsx
"use client"

import * as React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useEnhancedAuth } from "./enhanced-auth-context"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { UserRoles, type UserRole } from "@/lib/data"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Info, Shield, Database, Key } from "lucide-react"

export function EnhancedAuthForm() {
  const { login, signup, loading } = useEnhancedAuth()
  const [isLogin, setIsLogin] = React.useState(true)
  const [email, setEmail] = React.useState("")
  const [password, setPassword] = React.useState("")
  const [displayName, setDisplayName] = React.useState("")
  const [role, setRole] = React.useState<string>(UserRoles.ASSISTANT_VICE_PRESIDENT)
  const [useFirebaseAuth, setUseFirebaseAuth] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [success, setSuccess] = React.useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    
    try {
      if (isLogin) {
        const result = await login(email, password)
        setSuccess(`登录成功！认证类型: ${result.user.authType === 'firebase' ? 'Firebase Authentication' : '自定义认证'}`)
      } else {
        const result = await signup(email, password, displayName, role as UserRole, useFirebaseAuth)
        setSuccess(`注册成功！认证类型: ${result.user.authType === 'firebase' ? 'Firebase Authentication' : '自定义认证'}`)
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
              : "填写信息创建新账户（支持 Firebase Authentication）"
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
              <>
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
                
                <div className="flex items-center space-x-2">
                  <Switch
                    id="firebase-auth"
                    checked={useFirebaseAuth}
                    onCheckedChange={setUseFirebaseAuth}
                  />
                  <Label htmlFor="firebase-auth" className="flex items-center space-x-2">
                    <Shield className="h-4 w-4" />
                    <span>使用 Firebase Authentication</span>
                  </Label>
                </div>
                
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    {useFirebaseAuth ? (
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <Badge variant="default" className="bg-green-100 text-green-800">
                            <Key className="h-3 w-3 mr-1" />
                            Firebase Authentication
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          密码将同时保存到 Firebase Authentication 和 Firestore，提供更高的安全性。
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <Badge variant="secondary">
                            <Database className="h-3 w-3 mr-1" />
                            自定义认证
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          密码哈希仅保存在 Firestore 中，适合简单的认证需求。
                        </p>
                      </div>
                    )}
                  </AlertDescription>
                </Alert>
              </>
            )}
            
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            {success && (
              <Alert>
                <AlertDescription>{success}</AlertDescription>
              </Alert>
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
            <div className="flex items-start space-x-2">
              <Info className="h-4 w-4 text-blue-600 mt-0.5" />
              <div className="text-blue-600 text-xs space-y-1">
                <p className="font-medium">增强认证系统特性：</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>支持 Firebase Authentication 和自定义认证</li>
                  <li>密码同时保存到 Firebase 和 Firestore</li>
                  <li>自动用户资料同步</li>
                  <li>安全的密码哈希存储</li>
                  <li>24小时认证过期机制</li>
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 