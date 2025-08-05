"use client"

import * as React from "react"
import { Plus, Save, Trash2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import {
  getAccounts,
  addDocument,
  deleteDocument,
  getUsers,
  updateDocument,
} from "@/lib/firebase-utils"
import type { Account, UserProfile } from "@/lib/data"
import { useAuth } from "@/components/auth/auth-context"
import { UserRoles, RoleLevels, type UserRole } from "@/lib/data"
import { auth } from "@/lib/firebase"
import { createUserWithEmailAndPassword } from "firebase/auth"
import { CategoryManagementOptimized } from "./category-management-optimized"
import { LinksManager } from "./links-manager";

export function AccountSettings() {
  const { currentUser, hasPermission } = useAuth()
  const [accounts, setAccounts] = React.useState<Account[]>([])
  const [users, setUsers] = React.useState<UserProfile[]>([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [isNewAccountOpen, setIsNewAccountOpen] = React.useState(false)
  const [newAccount, setNewAccount] = React.useState({
    code: "",
    name: "",
    type: "Asset" as Account["type"],
    balance: 0,
  })
  const [isInviteUserOpen, setIsInviteUserOpen] = React.useState(false)
  const [inviteEmail, setInviteEmail] = React.useState("")
  const [invitePassword, setInvitePassword] = React.useState("")
  const [inviteDisplayName, setInviteDisplayName] = React.useState("")
  const [inviteRole, setInviteRole] = React.useState<UserRole>(UserRoles.ASSISTANT_VICE_PRESIDENT as UserRole);

  const fetchSettingsData = React.useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const fetchedAccounts = await getAccounts()
      setAccounts(fetchedAccounts)
      if (hasPermission(RoleLevels[UserRoles.TREASURER])) {
        // Only Level 1 can manage users
        const fetchedUsers = await getUsers()
        setUsers(fetchedUsers)
      }
    } catch (err: any) {
      setError("无法加载设置数据: " + err.message)
      console.error("Error fetching settings data:", err)
    } finally {
      setLoading(false)
    }
  }, [hasPermission])

  React.useEffect(() => {
    fetchSettingsData()
  }, [fetchSettingsData])

  const addAccount = async () => {
    if (!newAccount.code || !newAccount.name) {
      alert("账户代码和名称不能为空。")
      return
    }
    const accountData: Omit<Account, "id"> = {
      code: newAccount.code,
      name: newAccount.name,
      type: newAccount.type,
      balance: newAccount.balance,
    }
    try {
      await addDocument("accounts", accountData)
      await fetchSettingsData()
      setNewAccount({ code: "", name: "", type: "Asset", balance: 0 })
      setIsNewAccountOpen(false)
    } catch (err: any) {
      setError("添加账户失败: " + err.message)
      console.error("Error adding account:", err)
    }
  }

  const deleteAccount = async (id: string) => {
    if (!confirm("您确定要删除此账户吗？")) return
    try {
      await deleteDocument("accounts", id)
      await fetchSettingsData()
    } catch (err: any) {
      setError("删除账户失败: " + err.message)
      console.error("Error deleting account:", err)
    }
  }

  const handleInviteUser = async () => {
    if (!inviteEmail || !invitePassword || !inviteDisplayName) {
      alert("邮箱、密码和显示名称不能为空。")
      return
    }
    try {
      // Create user in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, inviteEmail, invitePassword)
      const user = userCredential.user

      // Add user profile to Firestore
      const newUserProfile: UserProfile = {
        uid: user.uid,
        email: inviteEmail,
        displayName: inviteDisplayName,
        role: inviteRole,
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString(),
      }
      await addDocument("users", newUserProfile) // Use addDocument, Firestore will generate ID

      await fetchSettingsData()
      setInviteEmail("")
      setInvitePassword("")
      setInviteDisplayName("")
      setInviteRole(UserRoles.ASSISTANT_VICE_PRESIDENT as UserRole)
      setIsInviteUserOpen(false)
    } catch (err: any) {
      setError("邀请用户失败: " + err.message)
      console.error("Error inviting user:", err)
    }
  }

  const createDevTestUser = async () => {
    const email = "dev@company.com"
    const password = "123456"
    const displayName = "Dev Test User"
    const role = UserRoles.TREASURER as UserRole;

    if (!currentUser || !hasPermission(RoleLevels[UserRoles.TREASURER])) {
      alert("您没有权限执行此操作。")
      return
    }

    setLoading(true)
    setError(null)
    try {
      // 检查用户是否已存在于 Firestore
      const existingUsers = await getUsers()
      const devUserExists = existingUsers.some((user) => user.email === email)

      if (devUserExists) {
        alert("测试用户 dev@company.com 已存在。")
        setLoading(false)
        return
      }

      // 在 Firebase Auth 中创建用户
      const userCredential = await createUserWithEmailAndPassword(auth, email, password)
      const user = userCredential.user

      // 将用户资料添加到 Firestore
      const newUserProfile: UserProfile = {
        uid: user.uid,
        email: email,
        displayName: displayName,
        role: role,
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString(),
      }
      await addDocument("users", newUserProfile)

      alert(`测试用户 ${email} 已成功创建，角色为 ${role.replace(/_/g, " ")}。`)
      await fetchSettingsData() // 刷新用户列表
    } catch (err: any) {
      setError("创建测试用户失败: " + err.message)
      console.error("Error creating dev test user:", err)
      alert("创建测试用户失败: " + err.message) // 提供用户反馈
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteUser = async (userId: string) => {
    if (!confirm("您确定要删除此用户吗？此操作不可逆。")) return
    try {
      // Note: Deleting user from Firestore does NOT delete them from Firebase Auth.
      // Firebase Admin SDK is required for server-side user deletion from Auth.
      // For this client-side example, we only delete the profile from Firestore.
      await deleteDocument("users", userId)
      await fetchSettingsData()
    } catch (err: any) {
      setError("删除用户失败: " + err.message)
      console.error("Error deleting user:", err)
    }
  }

  const handleUpdateUserRole = async (userId: string, newRole: UserProfile["role"]) => {
    try {
      await updateDocument("users", userId, { role: newRole })
      await fetchSettingsData()
    } catch (err: any) {
      setError("更新用户角色失败: " + err.message)
      console.error("Error updating user role:", err)
    }
  }

  if (loading) {
    return <div className="p-6 text-center">加载账户设置...</div>
  }

  if (error) {
    return <div className="p-6 text-center text-red-500">{error}</div>
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">账户设置</h1>
          <p className="text-muted-foreground">管理您的账户图表和系统偏好设置。</p>
        </div>
      </div>

      <Tabs defaultValue="accounts" className="space-y-4">
        <TabsList>
          <TabsTrigger value="accounts">账户图表</TabsTrigger>
          <TabsTrigger value="categories">收支分类</TabsTrigger>
          <TabsTrigger value="links">链接管理</TabsTrigger>
          {hasPermission(RoleLevels[UserRoles.TREASURER]) && ( // Level 1 can access company settings
            <TabsTrigger value="company">公司设置</TabsTrigger>
          )}
          {hasPermission(RoleLevels[UserRoles.TREASURER]) && ( // Level 1 can access preferences
            <TabsTrigger value="preferences">偏好设置</TabsTrigger>
          )}
          {hasPermission(RoleLevels[UserRoles.TREASURER]) && ( // Level 1 can access user management
            <TabsTrigger value="users">用户管理</TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="accounts" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>账户图表</CardTitle>
                  <CardDescription>管理您的会计结构和账户代码</CardDescription>
                </div>
                {hasPermission(RoleLevels[UserRoles.VICE_PRESIDENT]) && ( // Level 2 can add accounts
                  <Dialog open={isNewAccountOpen} onOpenChange={setIsNewAccountOpen}>
                    <DialogTrigger asChild>
                      <Button>
                        <Plus className="h-4 w-4 mr-2" />
                        添加账户
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>添加新账户</DialogTitle>
                        <DialogDescription>在您的账户图表中创建新账户</DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="account-code">账户代码</Label>
                            <Input
                              id="account-code"
                              placeholder="1000"
                              value={newAccount.code}
                              onChange={(e) => setNewAccount({ ...newAccount, code: e.target.value })}
                            />
                          </div>
                          <div>
                            <Label htmlFor="account-type">账户类型</Label>
                            <Select
                              value={newAccount.type}
                              onValueChange={(value: Account["type"]) => setNewAccount({ ...newAccount, type: value })}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Asset">资产</SelectItem>
                                <SelectItem value="Liability">负债</SelectItem>
                                <SelectItem value="Equity">权益</SelectItem>
                                <SelectItem value="Revenue">收入</SelectItem>
                                <SelectItem value="Expense">支出</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <div>
                          <Label htmlFor="account-name">账户名称</Label>
                          <Input
                            id="account-name"
                            placeholder="现金及现金等价物"
                            value={newAccount.name}
                            onChange={(e) => setNewAccount({ ...newAccount, name: e.target.value })}
                          />
                        </div>
                        <div>
                          <Label htmlFor="opening-balance">期初余额</Label>
                          <Input
                            id="opening-balance"
                            type="number"
                            step="0.01"
                            placeholder="0.00"
                            value={newAccount.balance || ""}
                            onChange={(e) =>
                              setNewAccount({ ...newAccount, balance: Number.parseFloat(e.target.value) || 0 })
                            }
                          />
                        </div>
                        <div className="flex justify-end gap-2">
                          <Button variant="outline" onClick={() => setIsNewAccountOpen(false)}>
                            取消
                          </Button>
                          <Button onClick={addAccount} disabled={!newAccount.code || !newAccount.name}>
                            <Save className="h-4 w-4 mr-2" />
                            添加账户
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>代码</TableHead>
                    <TableHead>账户名称</TableHead>
                    <TableHead>类型</TableHead>
                    <TableHead className="text-right">余额</TableHead>
                    <TableHead>状态</TableHead>
                    {hasPermission(RoleLevels[UserRoles.VICE_PRESIDENT]) && ( // Level 2 can delete accounts
                      <TableHead className="w-[100px]">操作</TableHead>
                    )}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {accounts.map((account) => (
                    <TableRow key={account.id}>
                      <TableCell className="font-medium">{account.code}</TableCell>
                      <TableCell>{account.name}</TableCell>
                      <TableCell>
                        <span
                          className={`px-2 py-1 rounded-full text-xs ${
                            account.type === "Asset"
                              ? "bg-blue-100 text-blue-800"
                              : account.type === "Liability"
                                ? "bg-red-100 text-red-800"
                                : account.type === "Equity"
                                  ? "bg-purple-100 text-purple-800"
                                  : account.type === "Revenue"
                                    ? "bg-green-100 text-green-800"
                                    : "bg-orange-100 text-orange-800"
                          }`}
                        >
                          {account.type}
                        </span>
                      </TableCell>
                      <TableCell className="text-right font-mono">${account.balance.toLocaleString()}</TableCell>
                      <TableCell>
                        <Badge variant="default">活跃</Badge>
                      </TableCell>
                      {hasPermission(RoleLevels[UserRoles.VICE_PRESIDENT]) && ( // Level 2 can delete accounts
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => account.id && deleteAccount(account.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="categories" className="space-y-4">
          <CategoryManagementOptimized />
        </TabsContent>

        <TabsContent value="links" className="space-y-4">
          <LinksManager />
        </TabsContent>

        {hasPermission(RoleLevels[UserRoles.TREASURER]) && ( // Level 1 can access company settings
          <TabsContent value="company" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>公司信息</CardTitle>
                <CardDescription>更新您的公司详细信息和业务信息</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="company-name">公司名称</Label>
                    <Input id="company-name" defaultValue="AccounTech Solutions" />
                  </div>
                  <div>
                    <Label htmlFor="tax-id">税号 / EIN</Label>
                    <Input id="tax-id" defaultValue="12-3456789" />
                  </div>
                </div>
                <div>
                  <Label htmlFor="address">营业地址</Label>
                  <Textarea id="address" defaultValue="123 Business St, Suite 100&#10;City, State 12345" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="phone">电话号码</Label>
                    <Input id="phone" defaultValue="(555) 123-4567" />
                  </div>
                  <div>
                    <Label htmlFor="email">邮箱地址</Label>
                    <Input id="email" type="email" defaultValue="contact@accountech.com" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="fiscal-year">财政年度结束</Label>
                    <Select defaultValue="december">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="january">一月</SelectItem>
                        <SelectItem value="february">二月</SelectItem>
                        <SelectItem value="march">三月</SelectItem>
                        <SelectItem value="april">四月</SelectItem>
                        <SelectItem value="may">五月</SelectItem>
                        <SelectItem value="june">六月</SelectItem>
                        <SelectItem value="july">七月</SelectItem>
                        <SelectItem value="august">八月</SelectItem>
                        <SelectItem value="september">九月</SelectItem>
                        <SelectItem value="october">十月</SelectItem>
                        <SelectItem value="november">十一月</SelectItem>
                        <SelectItem value="december">十二月</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="currency">基础货币</Label>
                    <Select defaultValue="usd">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="usd">USD - 美元</SelectItem>
                        <SelectItem value="eur">EUR - 欧元</SelectItem>
                        <SelectItem value="gbp">GBP - 英镑</SelectItem>
                        <SelectItem value="cad">CAD - 加元</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Button>
                  <Save className="h-4 w-4 mr-2" />
                  保存公司设置
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {hasPermission(RoleLevels[UserRoles.TREASURER]) && ( // Level 1 can access preferences
          <TabsContent value="preferences" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>系统偏好设置</CardTitle>
                <CardDescription>配置您的会计系统偏好设置</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>自动保存条目</Label>
                    <p className="text-sm text-muted-foreground">自动将日记账分录保存为草稿</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>日记账分录需要审批</Label>
                    <p className="text-sm text-muted-foreground">所有条目必须经过审批才能过账</p>
                  </div>
                  <Switch />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>启用审计追踪</Label>
                    <p className="text-sm text-muted-foreground">跟踪财务数据的所有更改</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>电子邮件通知</Label>
                    <p className="text-sm text-muted-foreground">接收重要事件的电子邮件提醒</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="space-y-2">
                  <Label>默认账户编号</Label>
                  <Select defaultValue="standard">
                    <SelectTrigger className="w-[200px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="standard">标准 (1000-9999)</SelectItem>
                      <SelectItem value="detailed">详细 (10000-99999)</SelectItem>
                      <SelectItem value="custom">自定义格式</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button>
                  <Save className="h-4 w-4 mr-2" />
                  保存偏好设置
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {hasPermission(RoleLevels[UserRoles.TREASURER]) && ( // Level 1 can access user management
          <TabsContent value="users" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>用户管理</CardTitle>
                    <CardDescription>管理用户访问和权限</CardDescription>
                  </div>
                  <div className="flex gap-2">
                    {" "}
                    {/* 添加一个 flex 容器用于按钮 */}
                    <Dialog open={isInviteUserOpen} onOpenChange={setIsInviteUserOpen}>
                      <DialogTrigger asChild>
                        <Button>
                          <Plus className="h-4 w-4 mr-2" />
                          邀请用户
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>邀请新用户</DialogTitle>
                          <DialogDescription>填写信息以邀请新用户加入系统</DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <Label htmlFor="invite-email">邮箱</Label>
                            <Input
                              id="invite-email"
                              type="email"
                              placeholder="user@example.com"
                              value={inviteEmail}
                              onChange={(e) => setInviteEmail(e.target.value)}
                              required
                            />
                          </div>
                          <div>
                            <Label htmlFor="invite-password">临时密码</Label>
                            <Input
                              id="invite-password"
                              type="password"
                              value={invitePassword}
                              onChange={(e) => setInvitePassword(e.target.value)}
                              required
                            />
                          </div>
                          <div>
                            <Label htmlFor="invite-display-name">显示名称</Label>
                            <Input
                              id="invite-display-name"
                              type="text"
                              placeholder="用户姓名"
                              value={inviteDisplayName}
                              onChange={(e) => setInviteDisplayName(e.target.value)}
                              required
                            />
                          </div>
                          <div>
                            <Label htmlFor="invite-role">角色</Label>
                            <Select
                              value={inviteRole}
                              onValueChange={(value) => setInviteRole(value as UserRole)}
                            >
                              <SelectTrigger id="invite-role">
                                <SelectValue placeholder="选择角色" />
                              </SelectTrigger>
                              <SelectContent>
                                {Object.values(UserRoles).map((role) => (
                                  <SelectItem key={role} value={role} className="capitalize">
                                    {role.replace(/_/g, " ")}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="flex justify-end gap-2">
                            <Button variant="outline" onClick={() => setIsInviteUserOpen(false)}>
                              取消
                            </Button>
                            <Button onClick={handleInviteUser}>
                              <Plus className="h-4 w-4 mr-2" />
                              邀请用户
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                    {/* 用于创建 dev 测试用户的新按钮 */}
                    <Button onClick={createDevTestUser} disabled={loading}>
                      创建测试用户 (dev@company.com)
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>姓名</TableHead>
                      <TableHead>邮箱</TableHead>
                      <TableHead>角色</TableHead>
                      <TableHead>状态</TableHead>
                      <TableHead>上次登录</TableHead>
                      <TableHead className="w-[100px]">操作</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">{user.displayName}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>
                          <Select
                            value={user.role}
                            onValueChange={(newRole) => handleUpdateUserRole(user.id!, newRole as UserProfile["role"])}
                          >
                            <SelectTrigger className="w-[150px] capitalize">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {Object.values(UserRoles).map((role) => (
                                <SelectItem key={role} value={role} className="capitalize">
                                  {role.replace(/_/g, " ")}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <Badge variant="default">活跃</Badge>
                        </TableCell>
                        <TableCell>
                          {typeof user.lastLogin === 'string'
                            ? new Date(user.lastLogin).toLocaleString()
                            : (user.lastLogin && typeof user.lastLogin === 'object' && 'seconds' in user.lastLogin && typeof (user.lastLogin as { seconds: number }).seconds === 'number')
                              ? new Date((user.lastLogin as { seconds: number }).seconds * 1000).toLocaleString()
                              : 'N/A'
                          }
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => user.id && handleDeleteUser(user.id)}
                            className="text-red-600 hover:text-red-700"
                            disabled={user.uid === currentUser?.uid} // Prevent deleting self
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  )
}
