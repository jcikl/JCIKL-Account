"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { Account } from "@/lib/data"

export default function SimpleAccountTestPage() {
  const [accounts, setAccounts] = React.useState<Account[]>([])
  const [formData, setFormData] = React.useState({
    code: "",
    name: "",
    type: "Asset" as "Asset" | "Liability" | "Equity" | "Revenue" | "Expense",
    balance: 0
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    console.log('提交表单数据:', formData)
    
    // 创建新账户
    const newAccount: Account = {
      id: Date.now().toString(),
      code: formData.code,
      name: formData.name,
      type: formData.type,
      balance: formData.balance,
      financialStatement: formData.type === "Asset" || formData.type === "Liability" || formData.type === "Equity" 
        ? "Balance Sheet" 
        : "Income Statement"
    }
    
    console.log('创建账户对象:', newAccount)
    
    // 添加到列表
    setAccounts(prev => [...prev, newAccount])
    
    // 重置表单
    setFormData({
      code: "",
      name: "",
      type: "Asset",
      balance: 0
    })
    
    alert(`✅ 成功创建账户: ${newAccount.code} - ${newAccount.name} (${newAccount.type})`)
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">简单账户创建测试</h1>
          <p className="text-muted-foreground mt-2">
            测试创建 Asset、Liability、Equity 类型的账户
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 创建表单 */}
          <Card>
            <CardHeader>
              <CardTitle>创建新账户</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="code">账户代码 *</Label>
                  <Input
                    id="code"
                    value={formData.code}
                    onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value }))}
                    placeholder="1001"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="name">账户名称 *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="现金"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="type">账户类型 *</Label>
                  <Select 
                    value={formData.type} 
                    onValueChange={(value: "Asset" | "Liability" | "Equity" | "Revenue" | "Expense") => 
                      setFormData(prev => ({ ...prev, type: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="选择账户类型" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Asset">资产 (Asset)</SelectItem>
                      <SelectItem value="Liability">负债 (Liability)</SelectItem>
                      <SelectItem value="Equity">权益 (Equity)</SelectItem>
                      <SelectItem value="Revenue">收入 (Revenue)</SelectItem>
                      <SelectItem value="Expense">费用 (Expense)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="balance">初始余额</Label>
                  <Input
                    id="balance"
                    type="number"
                    value={formData.balance}
                    onChange={(e) => setFormData(prev => ({ ...prev, balance: parseFloat(e.target.value) || 0 }))}
                    placeholder="0.00"
                    step="0.01"
                  />
                </div>

                <Button type="submit" className="w-full">
                  创建账户
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* 账户列表 */}
          <Card>
            <CardHeader>
              <CardTitle>账户列表 ({accounts.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {accounts.length === 0 ? (
                <p className="text-muted-foreground">暂无账户</p>
              ) : (
                <div className="space-y-2">
                  {accounts.map((account) => (
                    <div key={account.id} className="p-3 border rounded-lg">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="font-medium">{account.code} - {account.name}</div>
                          <div className="text-sm text-muted-foreground">
                            类型: {account.type} | 余额: ${account.balance.toLocaleString()}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            财务报表: {account.financialStatement}
                          </div>
                        </div>
                        <div className={`px-2 py-1 rounded text-xs ${
                          account.type === "Asset" ? "bg-blue-100 text-blue-800" :
                          account.type === "Liability" ? "bg-red-100 text-red-800" :
                          account.type === "Equity" ? "bg-purple-100 text-purple-800" :
                          account.type === "Revenue" ? "bg-green-100 text-green-800" :
                          "bg-orange-100 text-orange-800"
                        }`}>
                          {account.type}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* 测试说明 */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>测试说明</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <p>1. 填写账户信息（代码、名称、类型、余额）</p>
              <p>2. 点击"创建账户"按钮</p>
              <p>3. 查看右侧账户列表是否显示新创建的账户</p>
              <p>4. 特别测试 Asset、Liability、Equity 类型</p>
              <p>5. 检查控制台是否有错误信息</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 