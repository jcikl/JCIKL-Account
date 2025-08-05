"use client"

import { BankTransactionsMultiAccountAdvanced } from "@/components/modules/bank-transactions-multi-account-advanced"

export default function TestBankTransactionsMultiAccountAdvancedCharts() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            第七阶段：数据可视化完善测试
          </h1>
          <p className="text-gray-600">
            测试多账户银行交易系统的数据可视化功能，包括图表显示、统计分析等
          </p>
        </div>
        
        <BankTransactionsMultiAccountAdvanced />
      </div>
    </div>
  )
} 