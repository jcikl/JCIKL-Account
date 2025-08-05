const fs = require('fs');
const path = require('path');

// 需要删除的标准版本组件（保留优化版本）
const componentsToDelete = [
  'account-chart.tsx',                    // 保留 account-chart-optimized.tsx
  'account-settings.tsx',                 // 保留 account-settings-optimized.tsx
  'account-summary.tsx',                  // 保留 account-summary-optimized.tsx
  'account-form-dialog.tsx',              // 保留 account-form-dialog-optimized.tsx
  'balance-sheet.tsx',                    // 保留 balance-sheet-optimized.tsx
  'dashboard-overview.tsx',               // 保留 dashboard-overview-optimized.tsx
  'export-dialog.tsx',                    // 保留 export-dialog-optimized.tsx
  'import-dialog.tsx',                    // 保留 import-dialog-optimized.tsx 和 import-dialog-enhanced.tsx
  'journal-entries.tsx',                  // 保留 journal-entries-optimized.tsx
  'profit-loss.tsx',                      // 保留 profit-loss-optimized.tsx
  'project-accounts.tsx',                 // 保留 project-accounts-optimized.tsx 和 project-accounts-virtual.tsx
  'project-details-dialog.tsx',           // 保留 project-details-dialog-optimized.tsx
  'project-form-dialog.tsx',              // 保留 project-form-dialog-optimized.tsx
  'transaction-import-dialog.tsx',        // 保留 transaction-import-dialog-optimized.tsx
  'trial-balance.tsx',                    // 保留 trial-balance-optimized.tsx
  'category-management.tsx'               // 保留 category-management-optimized.tsx
];

// 保留的组件（不删除）
const componentsToKeep = [
  // 优化版本
  'account-chart-optimized.tsx',
  'account-chart-virtual.tsx',
  'account-settings-optimized.tsx',
  'account-summary-optimized.tsx',
  'account-form-dialog-optimized.tsx',
  'balance-sheet-optimized.tsx',
  'dashboard-overview-optimized.tsx',
  'export-dialog-optimized.tsx',
  'import-dialog-optimized.tsx',
  'import-dialog-enhanced.tsx',
  'journal-entries-optimized.tsx',
  'profit-loss-optimized.tsx',
  'project-accounts-optimized.tsx',
  'project-accounts-virtual.tsx',
  'project-details-dialog-optimized.tsx',
  'project-form-dialog-optimized.tsx',
  'transaction-import-dialog-optimized.tsx',
  'trial-balance-optimized.tsx',
  'category-management-optimized.tsx',
  
  // 独立组件
  'bank-account-management.tsx',
  'bank-account-selector.tsx',
  'bank-transactions.tsx',
  'bank-transactions-charts.tsx',
  'bank-transactions-fixed.tsx',
  'bank-transactions-multi-account-advanced.tsx',
  'category-paste-import-dialog.tsx',
  'gl-settings-management.tsx',
  'links-manager.tsx',
  'membership-fee-management.tsx',
  'merchandise-management.tsx',
  'merchandise-paste-import-dialog.tsx',
  'operation-expense-management.tsx',
  'paste-import-dialog.tsx',
  'project-import-dialog.tsx',
  'project-paste-import-dialog.tsx',
  'general-ledger-optimized.tsx'
];

function cleanupComponents() {
  const modulesDir = path.join(__dirname, '..', 'components', 'modules');
  
  console.log('🧹 开始清理重复组件...\n');
  
  let deletedCount = 0;
  let keptCount = 0;
  let errorCount = 0;
  
  // 删除标准版本组件
  componentsToDelete.forEach(component => {
    const filePath = path.join(modulesDir, component);
    
    if (fs.existsSync(filePath)) {
      try {
        fs.unlinkSync(filePath);
        console.log(`❌ 删除: ${component}`);
        deletedCount++;
      } catch (error) {
        console.log(`⚠️  删除失败: ${component} - ${error.message}`);
        errorCount++;
      }
    } else {
      console.log(`ℹ️  文件不存在: ${component}`);
    }
  });
  
  console.log('\n✅ 保留的组件:');
  componentsToKeep.forEach(component => {
    const filePath = path.join(modulesDir, component);
    if (fs.existsSync(filePath)) {
      console.log(`   ${component}`);
      keptCount++;
    }
  });
  
  console.log('\n📊 清理结果:');
  console.log(`   删除组件: ${deletedCount}`);
  console.log(`   保留组件: ${keptCount}`);
  console.log(`   错误数量: ${errorCount}`);
  
  // 检查剩余文件
  const remainingFiles = fs.readdirSync(modulesDir).filter(file => file.endsWith('.tsx'));
  console.log(`   剩余文件: ${remainingFiles.length}`);
  
  console.log('\n🎯 清理完成！');
  console.log('💡 建议:');
  console.log('1. 检查是否有其他文件引用了被删除的组件');
  console.log('2. 更新相关的导入语句');
  console.log('3. 运行测试确保功能正常');
}

// 执行清理
cleanupComponents(); 