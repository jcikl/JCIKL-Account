"use client"

import { BankTransactions } from "@/components/modules/bank-transactions"

export default function TestBankTransactionsIntegratedPage() {
  return (
    <div className="container mx-auto py-6">
      <h1 className="text-2xl font-bold mb-4">集成多账户功能的银行交易页面</h1>
      <p className="text-muted-foreground mb-6">
        此页面集成了多银行账户管理功能，支持通过标签页切换不同银行账户的交易记录。
      </p>
      <BankTransactions />
    </div>
  )
} 