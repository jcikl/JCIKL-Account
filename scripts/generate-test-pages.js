const fs = require('fs');
const path = require('path');

// 需要生成测试页面的组件列表
const components = [
  'account-chart-optimized',
  'account-chart-virtual',
  'account-chart',
  'account-form-dialog-optimized',
  'account-form-dialog',
  'account-settings-optimized',
  'account-settings',
  'account-summary-optimized',
  'account-summary',
  'balance-sheet-optimized',
  'balance-sheet',
  'bank-account-management',
  'bank-account-selector',
  'bank-transactions-charts',
  'bank-transactions-fixed',
  'category-management-optimized',
  'category-management',
  'category-paste-import-dialog',
  'dashboard-overview-optimized',
  'dashboard-overview',
  'export-dialog-optimized',
  'export-dialog',
  'gl-settings-management',
  'import-dialog-enhanced',
  'import-dialog-optimized',
  'import-dialog',
  'journal-entries-optimized',
  'journal-entries',
  'paste-import-dialog',
  'profit-loss-optimized',
  'profit-loss',
  'project-accounts-optimized',
  'project-accounts-virtual',
  'project-accounts',
  'project-details-dialog-optimized',
  'project-details-dialog',
  'project-form-dialog-optimized',
  'project-form-dialog',
  'project-import-dialog',
  'project-paste-import-dialog',
  'transaction-import-dialog-optimized',
  'transaction-import-dialog',
  'trial-balance-optimized',
  'trial-balance'
];

// 组件名称映射（用于正确的导入名称）
const componentNameMap = {
  'account-chart-optimized': 'AccountChartOptimized',
  'account-chart-virtual': 'AccountChartVirtual',
  'account-chart': 'AccountChart',
  'account-form-dialog-optimized': 'AccountFormDialogOptimized',
  'account-form-dialog': 'AccountFormDialog',
  'account-settings-optimized': 'AccountSettings',
  'account-settings': 'AccountSettings',
  'account-summary-optimized': 'AccountSummaryOptimized',
  'account-summary': 'AccountSummary',
  'balance-sheet-optimized': 'BalanceSheetOptimized',
  'balance-sheet': 'BalanceSheet',
  'bank-account-management': 'BankAccountManagement',
  'bank-account-selector': 'BankAccountSelector',
  'bank-transactions-charts': 'BankTransactionsCharts',
  'bank-transactions-fixed': 'BankTransactionsFixed',
  'category-management-optimized': 'CategoryManagementOptimized',
  'category-management': 'CategoryManagement',
  'category-paste-import-dialog': 'CategoryPasteImportDialog',
  'dashboard-overview-optimized': 'DashboardOverviewOptimized',
  'dashboard-overview': 'DashboardOverview',
  'export-dialog-optimized': 'ExportDialogOptimized',
  'export-dialog': 'ExportDialog',
  'gl-settings-management': 'GlSettingsManagement',
  'import-dialog-enhanced': 'ImportDialogEnhanced',
  'import-dialog-optimized': 'ImportDialogOptimized',
  'import-dialog': 'ImportDialog',
  'journal-entries-optimized': 'JournalEntriesOptimized',
  'journal-entries': 'JournalEntries',
  'paste-import-dialog': 'PasteImportDialog',
  'profit-loss-optimized': 'ProfitLossOptimized',
  'profit-loss': 'ProfitLoss',
  'project-accounts-optimized': 'ProjectAccountsOptimized',
  'project-accounts-virtual': 'ProjectAccountsVirtual',
  'project-accounts': 'ProjectAccounts',
  'project-details-dialog-optimized': 'ProjectDetailsDialogOptimized',
  'project-details-dialog': 'ProjectDetailsDialog',
  'project-form-dialog-optimized': 'ProjectFormDialogOptimized',
  'project-form-dialog': 'ProjectFormDialog',
  'project-import-dialog': 'ProjectImportDialog',
  'project-paste-import-dialog': 'ProjectPasteImportDialog',
  'transaction-import-dialog-optimized': 'TransactionImportDialogOptimized',
  'transaction-import-dialog': 'TransactionImportDialog',
  'trial-balance-optimized': 'TrialBalanceOptimized',
  'trial-balance': 'TrialBalance'
};

// 生成页面模板
function generatePageTemplate(componentName, importName) {
  return `"use client"

import { ${importName} } from "@/components/modules/${componentName}"

export default function Test${importName}Page() {
  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">测试页面: ${importName}</h1>
        <p className="text-muted-foreground">组件路径: @/components/modules/${componentName}</p>
        <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded">
          <p className="text-sm text-blue-800">
            <strong>说明:</strong> 此页面用于测试和比较 ${componentName} 组件的功能和性能。
          </p>
        </div>
      </div>
      
      <div className="border rounded-lg p-4 bg-gray-50">
        <${importName} />
      </div>
    </div>
  )
}`;
}

// 创建目录和文件
function createTestPages() {
  const appDir = path.join(__dirname, '..', 'app');
  const testDir = path.join(appDir, 'test-components');
  
  // 创建测试目录
  if (!fs.existsSync(testDir)) {
    fs.mkdirSync(testDir, { recursive: true });
  }
  
  // 创建索引页面
  const indexPage = `"use client"

import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

const components = ${JSON.stringify(components, null, 2)};

export default function TestComponentsIndexPage() {
  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">组件测试页面索引</h1>
        <p className="text-muted-foreground">
          用于测试和比较不同版本组件的功能和性能
        </p>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {components.map((component, index) => (
          <Link key={component} href={\`/test-components/\${component}\`}>
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardHeader>
                <CardTitle className="text-lg">{component}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  测试 {component} 组件
                </p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}`;
  
  fs.writeFileSync(path.join(testDir, 'page.tsx'), indexPage);
  
  // 为每个组件创建测试页面
  components.forEach(component => {
    const componentDir = path.join(testDir, component);
    if (!fs.existsSync(componentDir)) {
      fs.mkdirSync(componentDir, { recursive: true });
    }
    
    const importName = componentNameMap[component];
    const pageContent = generatePageTemplate(component, importName);
    fs.writeFileSync(path.join(componentDir, 'page.tsx'), pageContent);
    
    console.log(`✅ 创建测试页面: /test-components/${component}`);
  });
  
  console.log('\n🎉 所有测试页面创建完成！');
  console.log('📁 索引页面: http://localhost:3001/test-components');
  console.log('📋 总共创建了', components.length, '个测试页面');
}

// 执行脚本
createTestPages(); 