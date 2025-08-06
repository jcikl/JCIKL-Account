"use client"

import { useState } from "react"
import { ExportDialogOptimized } from "@/components/modules/export-dialog-optimized"
import { Account } from "@/lib/data"

export default function TestExportDialogOptimizedPage() {
  const [open, setOpen] = useState(false)
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
    }
  ])
  const [selectedAccounts] = useState<Set<string>>(new Set(["1", "2"]))

  const handleExport = (data: any) => {
    console.log("导出数据:", data)
    // 这里可以添加实际的导出逻辑
  }

  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">测试页面: ExportDialogOptimized</h1>
        <p className="text-muted-foreground">组件路径: @/components/modules/export-dialog-optimized</p>
        <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded">
          <p className="text-sm text-blue-800">
            <strong>说明:</strong> 此页面用于测试和比较 export-dialog-optimized 组件的功能和性能。
          </p>
        </div>
      </div>
      
      <div className="border rounded-lg p-4 bg-gray-50">
        <button 
          onClick={() => setOpen(true)}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          打开导出对话框
        </button>
        
        <ExportDialogOptimized 
          open={open}
          onOpenChange={setOpen}
          accounts={accounts}
          selectedAccounts={selectedAccounts}
          selectedCount={selectedAccounts.size}
          totalCount={accounts.length}
          onExport={handleExport}
        />
      </div>
    </div>
  )
}