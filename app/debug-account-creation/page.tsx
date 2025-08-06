"use client"

import * as React from "react"
import { AccountChartOptimized } from "@/components/modules/account-chart-optimized"
import { AccountFormDialogOptimized } from "@/components/modules/account-form-dialog-optimized"
import type { Account } from "@/lib/data"

export default function DebugAccountCreationPage() {
  const [accounts, setAccounts] = React.useState<Account[]>([])
  const [showForm, setShowForm] = React.useState(false)
  const [debugLog, setDebugLog] = React.useState<string[]>([])
  const [isClient, setIsClient] = React.useState(false)

  // 检测客户端渲染
  React.useEffect(() => {
    setIsClient(true)
  }, [])

  const addDebugLog = (message: string) => {
    setDebugLog(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`])
  }

  const handleAccountAdd = (accountData: {
    code: string
    name: string
    type: "Asset" | "Liability" | "Equity" | "Revenue" | "Expense"
    balance: number
    description?: string
    parent?: string
  }) => {
    addDebugLog(`开始创建账户: ${JSON.stringify(accountData)}`)
    
    try {
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
      
      addDebugLog(`账户对象创建成功: ${JSON.stringify(newAccount)}`)
      
      // 添加到账户列表
      setAccounts(prev => {
        const newList = [...prev, newAccount]
        addDebugLog(`账户列表更新: 从 ${prev.length} 个增加到 ${newList.length} 个`)
        return newList
      })
      
      // 显示成功消息
      alert(`✅ 成功添加账户: ${accountData.code} - ${accountData.name} (类型: ${accountData.type})`)
      addDebugLog(`账户添加完成: ${accountData.code}`)
      
    } catch (error) {
      addDebugLog(`错误: ${error}`)
      alert(`❌ 添加账户失败: ${error}`)
    }
  }

  const handleAccountEdit = (account: Account) => {
    addDebugLog(`编辑账户: ${account.code} - ${account.name}`)
    alert(`编辑账户: ${account.code} - ${account.name}`)
  }

  const handleAccountDelete = (accountId: string) => {
    addDebugLog(`删除账户: ${accountId}`)
    if (confirm('确定要删除这个账户吗？')) {
      setAccounts(prev => prev.filter(account => account.id !== accountId))
      alert('账户已删除')
    }
  }

  const handleAccountSelect = (account: Account) => {
    addDebugLog(`选择账户: ${account.code} - ${account.name}`)
    alert(`选择了账户: ${account.code} - ${account.name}`)
  }

  const clearDebugLog = () => {
    setDebugLog([])
  }

  // 在SSR期间显示加载状态
  if (!isClient) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-7xl mx-auto">
          <div className="mb-6">
            <h1 className="text-3xl font-bold">账户创建调试页面</h1>
            <p className="text-muted-foreground mt-2">正在加载...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">账户创建调试页面</h1>
          <p className="text-muted-foreground mt-2">
            调试账户创建问题，特别是 Asset、Liability、Equity 类型
          </p>
          
          <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <h3 className="font-semibold text-yellow-900">调试说明：</h3>
            <ul className="mt-2 text-sm text-yellow-800 space-y-1">
              <li>• 点击"添加账户"按钮测试创建功能</li>
              <li>• 尝试创建 Asset、Liability、Equity 类型的账户</li>
              <li>• 查看下方的调试日志了解详细过程</li>
              <li>• 检查控制台是否有错误信息</li>
            </ul>
          </div>

          <div className="mt-4 flex gap-2">
            <button
              onClick={() => setShowForm(true)}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              手动打开表单
            </button>
            <button
              onClick={clearDebugLog}
              className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
            >
              清除调试日志
            </button>
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 账户图表 */}
          <div>
            <h2 className="text-xl font-semibold mb-4">账户图表</h2>
            <AccountChartOptimized 
              accounts={accounts}
              onAccountSelect={handleAccountSelect}
              onAccountEdit={handleAccountEdit}
              onAccountDelete={handleAccountDelete}
              onAccountAdd={handleAccountAdd}
            />
          </div>

          {/* 调试日志 */}
          <div>
            <h2 className="text-xl font-semibold mb-4">调试日志</h2>
            <div className="bg-gray-100 p-4 rounded-lg h-96 overflow-y-auto">
              {debugLog.length === 0 ? (
                <p className="text-gray-500">暂无调试日志</p>
              ) : (
                <div className="space-y-1">
                  {debugLog.map((log, index) => (
                    <div key={index} className="text-sm font-mono bg-white p-2 rounded border">
                      {log}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 手动表单对话框 */}
        <AccountFormDialogOptimized
          open={showForm}
          onOpenChange={setShowForm}
          account={null}
          onSave={(data) => {
            addDebugLog(`手动表单提交: ${JSON.stringify(data)}`)
            handleAccountAdd(data)
            setShowForm(false)
          }}
        />
      </div>
    </div>
  )
} 