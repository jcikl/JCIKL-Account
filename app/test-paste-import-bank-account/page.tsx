"use client"

import { BankTransactions } from "@/components/modules/bank-transactions"

export default function TestPasteImportBankAccountPage() {
  return (
    <div className="container mx-auto py-6">
      <h1 className="text-2xl font-bold mb-4">粘贴导入银行账户选择功能测试</h1>
      <p className="text-muted-foreground mb-6">
        此页面用于测试粘贴导入对话框中的银行账户选择功能，验证用户是否可以在导入时选择目标银行账户。
      </p>
      
      <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
        <h2 className="text-lg font-semibold text-green-800 mb-2">新功能特性：</h2>
        <ul className="list-disc list-inside space-y-1 text-green-700">
          <li>粘贴导入对话框新增"目标银行账户"选择字段</li>
          <li>支持选择要将交易记录导入到的银行账户</li>
          <li>显示银行账户名称、货币类型和状态</li>
          <li>导入的交易记录自动关联到选中的银行账户</li>
          <li>支持停用账户的显示和选择</li>
        </ul>
      </div>
      
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <h2 className="text-lg font-semibold text-blue-800 mb-2">测试步骤：</h2>
        <ol className="list-decimal list-inside space-y-1 text-blue-700">
          <li>点击"粘贴导入"按钮打开导入对话框</li>
          <li>在"目标银行账户"字段中选择要导入的银行账户</li>
          <li>粘贴CSV格式的交易数据</li>
          <li>验证导入的交易是否关联到选中的银行账户</li>
          <li>检查交易记录是否显示在正确的账户标签页下</li>
        </ol>
      </div>
      
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
        <h2 className="text-lg font-semibold text-yellow-800 mb-2">测试数据示例：</h2>
        <div className="text-sm text-yellow-700 font-mono bg-yellow-100 p-2 rounded">
          日期,描述,描述2,支出金额,收入金额,付款人,项目户口,分类<br/>
          2025-01-15,办公用品采购,文具,150.00,0,张三,2025_P_办公项目,办公用品<br/>
          2025-01-16,客户付款,,0,5000.00,李四,2025_P_项目A,收入
        </div>
      </div>
      
      <BankTransactions />
    </div>
  )
} 