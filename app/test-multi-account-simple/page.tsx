"use client"

import { BankTransactionsMultiAccount } from "@/components/modules/bank-transactions-multi-account"

export default function TestMultiAccountSimplePage() {
  return (
    <div className="container mx-auto py-6">
      <h1 className="text-2xl font-bold mb-4">多账户银行交易测试页面</h1>
      <BankTransactionsMultiAccount />
    </div>
  )
} 