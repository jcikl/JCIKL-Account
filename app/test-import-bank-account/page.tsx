"use client"

import { BankTransactions } from "@/components/modules/bank-transactions"

export default function TestImportBankAccountPage() {
  return (
    <div className="container mx-auto py-6">
      <h1 className="text-2xl font-bold mb-4">银行账户导入功能测试</h1>
      <p className="text-muted-foreground mb-6">
        此页面用于测试修复后的导入功能，验证粘贴导入和文件上传是否支持银行账户关联。
      </p>
      
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <h2 className="text-lg font-semibold text-blue-800 mb-2">测试步骤：</h2>
        <ol className="list-decimal list-inside space-y-1 text-blue-700">
          <li>选择目标银行账户标签页</li>
          <li>使用"粘贴导入"功能导入交易数据</li>
          <li>或使用"导入Excel"功能上传CSV文件</li>
          <li>验证导入的交易是否关联到选中的银行账户</li>
          <li>检查统计信息是否更新为当前账户的数据</li>
        </ol>
      </div>
      
      <BankTransactions />
    </div>
  )
} 