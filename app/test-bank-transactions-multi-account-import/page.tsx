"use client"

import { BankTransactionsMultiAccountAdvanced } from "@/components/modules/bank-transactions-multi-account-advanced"

export default function TestBankTransactionsMultiAccountImport() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            第八阶段：导入功能增强测试
          </h1>
          <p className="text-gray-600">
            测试多账户银行交易系统的增强导入功能，包括多银行账户支持、数据验证、重复检测等
          </p>
        </div>
        
        <BankTransactionsMultiAccountAdvanced />
      </div>
    </div>
  )
} 