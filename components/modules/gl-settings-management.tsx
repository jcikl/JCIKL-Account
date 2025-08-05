import React, { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { getAccounts, addDocument, updateDocument, getCollection } from "@/lib/firebase-utils"
import type { Account, GlobalGLSettings } from "@/lib/data"
import { useAuth } from "@/components/auth/auth-context"
import { useToast } from "@/hooks/use-toast"

export function GLSettingsManagement() {
  const { currentUser } = useAuth()
  const { toast } = useToast()
  
  // 状态管理
  const [accounts, setAccounts] = useState<Account[]>([])
  const [globalGLSettings, setGlobalGLSettings] = useState<GlobalGLSettings | null>(null)
  const [loading, setLoading] = useState(true)

  // 加载数据
  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      const [accountsData, glSettingsData] = await Promise.all([
        getAccounts(),
        getCollection<GlobalGLSettings>("global_gl_settings")
      ])
      setAccounts(accountsData)
      setGlobalGLSettings(glSettingsData.length > 0 ? glSettingsData[0] : null)
    } catch (error) {
      console.error("Error loading data:", error)
      toast({
        title: "错误",
        description: "加载数据失败",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  // 获取GL账户名称
  const getAccountName = (accountId: string) => {
    const account = accounts.find(a => a.id === accountId)
    return account ? `${account.code} - ${account.name} (${account.type})` : "未设置"
  }

  // 保存全局GL设置
  const saveGlobalGLSettings = async (settings: Partial<GlobalGLSettings>) => {
    try {
      const data = {
        ...settings,
        createdAt: globalGLSettings ? globalGLSettings.createdAt : new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdByUid: currentUser?.uid || ""
      }

      if (globalGLSettings) {
        await updateDocument("global_gl_settings", globalGLSettings.id!, data)
        setGlobalGLSettings({ ...globalGLSettings, ...data })
      } else {
        const id = await addDocument("global_gl_settings", data)
        setGlobalGLSettings({ ...data, id })
      }
      toast({
        title: "成功",
        description: "GL设置已保存"
      })
    } catch (error) {
      toast({
        title: "错误",
        description: "保存GL设置失败",
        variant: "destructive"
      })
    }
  }

  if (loading) {
    return <div className="p-4">加载中...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">General Ledger 全局设置</h2>
          <p className="text-muted-foreground">管理所有模块的GL账户设置（可选择任何类型的账户）</p>
        </div>
      </div>

      <Tabs defaultValue="merchandise" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="merchandise">商品管理</TabsTrigger>
          <TabsTrigger value="projects">项目账户</TabsTrigger>
          <TabsTrigger value="membership">会员管理</TabsTrigger>
          <TabsTrigger value="operation">运作管理</TabsTrigger>
        </TabsList>

        {/* 商品管理设置 */}
        <TabsContent value="merchandise" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>商品管理 GL 设置</CardTitle>
              <CardDescription>商品购入、卖出相关的GL账户设置</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>商品购入时记入资产账户</Label>
                <div className="text-sm text-gray-600 mb-2">
                  {getAccountName(globalGLSettings?.merchandiseAssetAccountId || "")}
                </div>
                <Select 
                  value={globalGLSettings?.merchandiseAssetAccountId || ""} 
                  onValueChange={v => saveGlobalGLSettings({ merchandiseAssetAccountId: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="选择账户" />
                  </SelectTrigger>
                  <SelectContent>
                    {accounts.map(account => (
                      <SelectItem key={account.id} value={account.id!}>
                        {account.code} - {account.name} ({account.type})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label>商品卖出时成本记入账户</Label>
                <div className="text-sm text-gray-600 mb-2">
                  {getAccountName(globalGLSettings?.merchandiseCostAccountId || "")}
                </div>
                <Select 
                  value={globalGLSettings?.merchandiseCostAccountId || ""} 
                  onValueChange={v => saveGlobalGLSettings({ merchandiseCostAccountId: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="选择账户" />
                  </SelectTrigger>
                  <SelectContent>
                    {accounts.map(account => (
                      <SelectItem key={account.id} value={account.id!}>
                        {account.code} - {account.name} ({account.type})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label>商品卖出时收入记入账户</Label>
                <div className="text-sm text-gray-600 mb-2">
                  {getAccountName(globalGLSettings?.merchandiseIncomeAccountId || "")}
                </div>
                <Select 
                  value={globalGLSettings?.merchandiseIncomeAccountId || ""} 
                  onValueChange={v => saveGlobalGLSettings({ merchandiseIncomeAccountId: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="选择账户" />
                  </SelectTrigger>
                  <SelectContent>
                    {accounts.map(account => (
                      <SelectItem key={account.id} value={account.id!}>
                        {account.code} - {account.name} ({account.type})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 项目账户设置 */}
        <TabsContent value="projects" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>项目账户 GL 设置</CardTitle>
              <CardDescription>项目收入、支出、预算相关的GL账户设置</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>项目收入记入账户</Label>
                <div className="text-sm text-gray-600 mb-2">
                  {getAccountName(globalGLSettings?.projectIncomeAccountId || "")}
                </div>
                <Select 
                  value={globalGLSettings?.projectIncomeAccountId || ""} 
                  onValueChange={v => saveGlobalGLSettings({ projectIncomeAccountId: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="选择账户" />
                  </SelectTrigger>
                  <SelectContent>
                    {accounts.map(account => (
                      <SelectItem key={account.id} value={account.id!}>
                        {account.code} - {account.name} ({account.type})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label>项目支出记入账户</Label>
                <div className="text-sm text-gray-600 mb-2">
                  {getAccountName(globalGLSettings?.projectExpenseAccountId || "")}
                </div>
                <Select 
                  value={globalGLSettings?.projectExpenseAccountId || ""} 
                  onValueChange={v => saveGlobalGLSettings({ projectExpenseAccountId: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="选择账户" />
                  </SelectTrigger>
                  <SelectContent>
                    {accounts.map(account => (
                      <SelectItem key={account.id} value={account.id!}>
                        {account.code} - {account.name} ({account.type})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label>项目预算账户</Label>
                <div className="text-sm text-gray-600 mb-2">
                  {getAccountName(globalGLSettings?.projectBudgetAccountId || "")}
                </div>
                <Select 
                  value={globalGLSettings?.projectBudgetAccountId || ""} 
                  onValueChange={v => saveGlobalGLSettings({ projectBudgetAccountId: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="选择账户" />
                  </SelectTrigger>
                  <SelectContent>
                    {accounts.map(account => (
                      <SelectItem key={account.id} value={account.id!}>
                        {account.code} - {account.name} ({account.type})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 会员管理设置 */}
        <TabsContent value="membership" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>会员管理 GL 设置</CardTitle>
              <CardDescription>会员费收入、支出相关的GL账户设置</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>会员费收入记入账户</Label>
                <div className="text-sm text-gray-600 mb-2">
                  {getAccountName(globalGLSettings?.membershipIncomeAccountId || "")}
                </div>
                <Select 
                  value={globalGLSettings?.membershipIncomeAccountId || ""} 
                  onValueChange={v => saveGlobalGLSettings({ membershipIncomeAccountId: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="选择账户" />
                  </SelectTrigger>
                  <SelectContent>
                    {accounts.map(account => (
                      <SelectItem key={account.id} value={account.id!}>
                        {account.code} - {account.name} ({account.type})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label>会员费支出记入账户</Label>
                <div className="text-sm text-gray-600 mb-2">
                  {getAccountName(globalGLSettings?.membershipExpenseAccountId || "")}
                </div>
                <Select 
                  value={globalGLSettings?.membershipExpenseAccountId || ""} 
                  onValueChange={v => saveGlobalGLSettings({ membershipExpenseAccountId: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="选择账户" />
                  </SelectTrigger>
                  <SelectContent>
                    {accounts.map(account => (
                      <SelectItem key={account.id} value={account.id!}>
                        {account.code} - {account.name} ({account.type})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 运作管理设置 */}
        <TabsContent value="operation" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>运作管理 GL 设置</CardTitle>
              <CardDescription>日常运作费用相关的GL账户设置</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>运作费用记入账户</Label>
                <div className="text-sm text-gray-600 mb-2">
                  {getAccountName(globalGLSettings?.operationExpenseAccountId || "")}
                </div>
                <Select 
                  value={globalGLSettings?.operationExpenseAccountId || ""} 
                  onValueChange={v => saveGlobalGLSettings({ operationExpenseAccountId: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="选择账户" />
                  </SelectTrigger>
                  <SelectContent>
                    {accounts.map(account => (
                      <SelectItem key={account.id} value={account.id!}>
                        {account.code} - {account.name} ({account.type})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
} 