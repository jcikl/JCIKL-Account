"use client"

import { AccountChart } from "@/components/modules/account-chart"
import type { Account } from "@/lib/data"

export default function AccountChartDemoPage() {
  // 模拟账户数据
  const mockAccounts: Account[] = [
    {
      id: "1",
      code: "1001",
      name: "现金",
      type: "Asset",
      balance: 15000
    },
    {
      id: "2",
      code: "1002",
      name: "银行存款",
      type: "Asset",
      balance: 50000
    },
    {
      id: "3",
      code: "1101",
      name: "应收账款",
      type: "Asset",
      balance: 25000
    },
    {
      id: "4",
      code: "1201",
      name: "库存商品",
      type: "Asset",
      balance: 30000
    },
    {
      id: "5",
      code: "2001",
      name: "应付账款",
      type: "Liability",
      balance: -18000
    },
    {
      id: "6",
      code: "2002",
      name: "短期借款",
      type: "Liability",
      balance: -50000
    },
    {
      id: "7",
      code: "3001",
      name: "实收资本",
      type: "Equity",
      balance: 100000
    },
    {
      id: "8",
      code: "3002",
      name: "未分配利润",
      type: "Equity",
      balance: 12000
    },
    {
      id: "9",
      code: "4001",
      name: "主营业务收入",
      type: "Revenue",
      balance: 80000
    },
    {
      id: "10",
      code: "5001",
      name: "主营业务成本",
      type: "Expense",
      balance: -45000
    },
    {
      id: "11",
      code: "5002",
      name: "销售费用",
      type: "Expense",
      balance: -8000
    },
    {
      id: "12",
      code: "5003",
      name: "管理费用",
      type: "Expense",
      balance: -12000
    }
  ]

  const handleAccountSelect = (account: Account) => {
    console.log('选择账户:', account)
    alert(`选择了账户: ${account.code} - ${account.name}`)
  }

  const handleAccountEdit = (account: Account) => {
    console.log('编辑账户:', account)
    alert(`编辑账户: ${account.code} - ${account.name}`)
  }

  const handleAccountDelete = (accountId: string) => {
    console.log('删除账户:', accountId)
    alert(`删除账户ID: ${accountId}`)
  }

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
      id: Date.now().toString(), // 临时ID
      code: accountData.code,
      name: accountData.name,
      type: accountData.type,
      balance: accountData.balance,
      financialStatement: accountData.type === "Asset" || accountData.type === "Liability" || accountData.type === "Equity" 
        ? "Balance Sheet" 
        : "Income Statement",
      parent: accountData.parent
    }
    
    // 在实际应用中，这里应该调用API保存到数据库
    // 现在只是显示成功消息
    alert(`成功添加账户: ${accountData.code} - ${accountData.name}\n\n账户数据: ${JSON.stringify(accountData, null, 2)}`)
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">账户图表功能演示</h1>
          <p className="text-muted-foreground">
            这是一个完善的账户图表组件，包含搜索、筛选、排序、统计图表等功能
          </p>
        </div>
        
        <AccountChart 
          accounts={mockAccounts}
          onAccountSelect={handleAccountSelect}
          onAccountEdit={handleAccountEdit}
          onAccountDelete={handleAccountDelete}
          onAccountAdd={handleAccountAdd}
        />
      </div>
    </div>
  )
} 