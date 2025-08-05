"use client"

import * as React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { BankAccountSelector, BankAccountDisplay, BankAccountStats, useBankAccountName } from "@/components/modules/bank-account-selector"

export default function TestBankAccountSelectorPage() {
  const [selectedBankAccountId, setSelectedBankAccountId] = React.useState<string>("")
  const { bankAccountName: selectedBankAccountName, loading: bankAccountNameLoading } = useBankAccountName(selectedBankAccountId)

  const handleBankAccountChange = (bankAccountId: string) => {
    setSelectedBankAccountId(bankAccountId)
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">银行账户选择器测试</h1>
        <p className="text-muted-foreground">测试银行账户选择器的各种功能。</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* 基本选择器 */}
        <Card>
          <CardHeader>
            <CardTitle>基本选择器</CardTitle>
            <CardDescription>选择银行账户</CardDescription>
          </CardHeader>
          <CardContent>
            <BankAccountSelector
              value={selectedBankAccountId}
              onValueChange={handleBankAccountChange}
              placeholder="请选择银行账户"
            />
          </CardContent>
        </Card>

        {/* 显示组件 */}
        <Card>
          <CardHeader>
            <CardTitle>银行账户显示</CardTitle>
            <CardDescription>显示选中的银行账户信息</CardDescription>
          </CardHeader>
          <CardContent>
            <BankAccountDisplay
              bankAccountId={selectedBankAccountId}
              bankAccountName={selectedBankAccountName}
              showDetails={true}
            />
          </CardContent>
        </Card>

        {/* 统计组件 */}
        <Card>
          <CardHeader>
            <CardTitle>银行账户统计</CardTitle>
            <CardDescription>显示银行账户的统计信息</CardDescription>
          </CardHeader>
          <CardContent>
            <BankAccountStats bankAccountId={selectedBankAccountId} />
          </CardContent>
        </Card>

        {/* 禁用状态 */}
        <Card>
          <CardHeader>
            <CardTitle>禁用状态</CardTitle>
            <CardDescription>禁用的银行账户选择器</CardDescription>
          </CardHeader>
          <CardContent>
            <BankAccountSelector
              value=""
              onValueChange={() => {}}
              disabled={true}
              placeholder="禁用状态"
            />
          </CardContent>
        </Card>

        {/* 显示所有账户 */}
        <Card>
          <CardHeader>
            <CardTitle>显示所有账户</CardTitle>
            <CardDescription>包括禁用状态的银行账户</CardDescription>
          </CardHeader>
          <CardContent>
            <BankAccountSelector
              value={selectedBankAccountId}
              onValueChange={handleBankAccountChange}
              showActiveOnly={false}
              placeholder="显示所有账户"
            />
          </CardContent>
        </Card>

        {/* 当前选择状态 */}
        <Card>
          <CardHeader>
            <CardTitle>当前选择状态</CardTitle>
            <CardDescription>显示当前选择的银行账户ID</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div>
                <span className="font-medium">选中的银行账户ID:</span>
                <span className="ml-2 font-mono text-sm bg-muted px-2 py-1 rounded">
                  {selectedBankAccountId || "未选择"}
                </span>
              </div>
                             <div>
                 <span className="font-medium">选中的银行账户名称:</span>
                 <span className="ml-2 font-mono text-sm bg-muted px-2 py-1 rounded">
                   {bankAccountNameLoading ? "加载中..." : (selectedBankAccountName || "未选择")}
                 </span>
               </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 