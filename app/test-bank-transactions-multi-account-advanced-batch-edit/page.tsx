"use client"

import { BankTransactionsMultiAccountAdvanced } from "@/components/modules/bank-transactions-multi-account-advanced"

export default function TestBankTransactionsMultiAccountAdvancedBatchEdit() {
  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          银行交易多账户高级组件 - 批量设定功能测试
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          测试银行交易多账户高级组件的批量设定功能，包括批量编辑付款人、项目户口和收支分类
        </p>
      </div>
      
      <BankTransactionsMultiAccountAdvanced />
    </div>
  )
}
