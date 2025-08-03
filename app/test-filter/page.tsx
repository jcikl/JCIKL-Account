"use client"

import { GeneralLedgerFixed } from "@/components/modules/general-ledger-fixed"
import { TestDialog } from "@/components/test-dialog"

export default function TestFilterPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">高级筛选功能测试页面</h1>
          <p className="text-muted-foreground">
            此页面用于测试总账模块的高级筛选功能是否正常工作
          </p>
        </div>
        
        {/* 简化的Dialog测试 */}
        <div className="mb-8 p-4 border rounded-lg">
          <h2 className="text-lg font-semibold mb-4">步骤1: 测试基本Dialog功能</h2>
          <TestDialog />
        </div>
        
        {/* 完整的总账模块测试 */}
        <div className="p-4 border rounded-lg">
          <h2 className="text-lg font-semibold mb-4">步骤2: 测试完整的总账模块</h2>
          <GeneralLedgerFixed />
        </div>
      </div>
    </div>
  )
} 