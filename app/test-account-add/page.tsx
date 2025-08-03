"use client"

import * as React from "react"
import { AccountChart } from "@/components/modules/account-chart"
import type { Account } from "@/lib/data"

export default function TestAccountAddPage() {
  const [accounts, setAccounts] = React.useState<Account[]>([
    {
      id: "1",
      code: "1001",
      name: "现金",
      type: "Asset",
      balance: 50000,
      financialStatement: "Balance Sheet"
    },
    {
      id: "2", 
      code: "1002",
      name: "银行存款",
      type: "Asset",
      balance: 100000,
      financialStatement: "Balance Sheet"
    },
    {
      id: "3",
      code: "2001",
      name: "应付账款",
      type: "Liability",
      balance: -25000,
      financialStatement: "Balance Sheet"
    }
  ])

  const handleAccountAdd = (accountData: {
    code: string
    name: string
    type: "Asset" | "Liability" | "Equity" | "Revenue" | "Expense"
    balance: number
    description?: string
    parent?: string
  }) => {
    console.log('添加账户:', accountData)
    
    // 创建新账户对象
    const newAccount: Account = {
      id: Date.now().toString(),
      code: accountData.code,
      name: accountData.name,
      type: accountData.type,
      balance: accountData.balance,
      financialStatement: accountData.type === "Asset" || accountData.type === "Liability" || accountData.type === "Equity" 
        ? "Balance Sheet" 
        : "Income Statement",
      parent: accountData.parent
    }
    
    // 添加到账户列表
    setAccounts(prev => [...prev, newAccount])
    
    // 显示成功消息
    alert(`✅ 成功添加账户: ${accountData.code} - ${accountData.name}`)
  }

  const handleAccountEdit = (account: Account) => {
    console.log('编辑账户:', account)
    alert(`编辑账户: ${account.code} - ${account.name}`)
  }

  const handleAccountDelete = (accountId: string) => {
    console.log('删除账户:', accountId)
    if (confirm('确定要删除这个账户吗？')) {
      setAccounts(prev => prev.filter(account => account.id !== accountId))
      alert('账户已删除')
    }
  }

  const handleAccountSelect = (account: Account) => {
    console.log('选择账户:', account)
    alert(`选择了账户: ${account.code} - ${account.name}`)
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">账户添加功能测试</h1>
          <p className="text-muted-foreground mt-2">
            测试账户图表的添加、编辑、删除功能
          </p>
          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h3 className="font-semibold text-blue-900">测试说明：</h3>
            <ul className="mt-2 text-sm text-blue-800 space-y-1">
              <li>• 点击"添加账户"按钮测试添加功能</li>
              <li>• 点击账户行的编辑按钮测试编辑功能</li>
              <li>• 点击账户行的删除按钮测试删除功能</li>
              <li>• 点击账户行的查看按钮测试选择功能</li>
            </ul>
          </div>
        </div>
        
        <AccountChart 
          accounts={accounts}
          onAccountSelect={handleAccountSelect}
          onAccountEdit={handleAccountEdit}
          onAccountDelete={handleAccountDelete}
          onAccountAdd={handleAccountAdd}
        />
      </div>
    </div>
  )
} 