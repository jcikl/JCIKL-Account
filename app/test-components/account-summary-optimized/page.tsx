"use client"

import { useState } from "react"
import { AccountSummaryOptimized } from "@/components/modules/account-summary-optimized"
import { Account } from "@/lib/data"

export default function TestAccountSummaryOptimizedPage() {
  const [accounts] = useState<Account[]>([
    {
      id: "1",
      code: "1001",
      name: "现金",
      type: "Asset",
      financialStatement: "Balance Sheet",
      balance: 10000,
      description: "公司现金账户"
    },
    {
      id: "2", 
      code: "2001",
      name: "应付账款",
      type: "Liability",
      financialStatement: "Balance Sheet",
      balance: -5000,
      description: "应付供应商账款"
    },
    {
      id: "3",
      code: "3001",
      name: "股本",
      type: "Equity",
      financialStatement: "Balance Sheet",
      balance: 50000,
      description: "股东投资"
    }
  ])

  const handleRefresh = () => {
    console.log("刷新账户数据")
  }

  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">测试页面: AccountSummaryOptimized</h1>
        <p className="text-muted-foreground">组件路径: @/components/modules/account-summary-optimized</p>
        <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded">
          <p className="text-sm text-blue-800">
            <strong>说明:</strong> 此页面用于测试和比较 account-summary-optimized 组件的功能和性能。
          </p>
        </div>
      </div>
      
      <div className="border rounded-lg p-4 bg-gray-50">
        <AccountSummaryOptimized 
          accounts={accounts}
          onRefresh={handleRefresh}
        />
      </div>
    </div>
  )
}