import { BankTransactions } from "@/components/modules/bank-transactions"

export default function TestBankTransactionsPage() {
  return (
    <div className="min-h-screen bg-background p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">银行交易编辑功能测试</h1>
        <p className="text-muted-foreground">测试银行交易页面的编辑功能，包括项目年份筛选</p>
      </div>
      
      <BankTransactions />
    </div>
  )
} 