#!/usr/bin/env node

/**
 * 总账模块功能演示脚本
 * 展示高级筛选和导出功能的完整特性
 */

console.log('🎯 JCIKL 总账模块功能演示');
console.log('=' .repeat(50));

// 模拟数据
const demoData = {
  transactions: [
    { id: 'TXN001', date: '2024-01-15', description: '办公用品采购', account: '办公费用', debit: 500, credit: 0, status: 'Completed', category: '办公费用' },
    { id: 'TXN002', date: '2024-01-16', description: '客户付款', account: '应收账款', debit: 0, credit: 2000, status: 'Completed', category: '收入' },
    { id: 'TXN003', date: '2024-01-17', description: '员工工资', account: '工资费用', debit: 3000, credit: 0, status: 'Pending', category: '人工费用' },
    { id: 'TXN004', date: '2024-01-18', description: '银行贷款', account: '长期借款', debit: 0, credit: 50000, status: 'Completed', category: '融资' },
    { id: 'TXN005', date: '2024-01-19', description: '设备折旧', account: '折旧费用', debit: 800, credit: 0, status: 'Completed', category: '折旧' }
  ],
  accounts: [
    { code: '1001', name: '现金', type: 'Asset', balance: 15000 },
    { code: '1002', name: '银行存款', type: 'Asset', balance: 50000 },
    { code: '2001', name: '应付账款', type: 'Liability', balance: 8000 },
    { code: '3001', name: '实收资本', type: 'Equity', balance: 100000 },
    { code: '4001', name: '营业收入', type: 'Revenue', balance: 25000 }
  ]
};

// 演示筛选功能
function demonstrateFiltering() {
  console.log('\n📊 高级筛选功能演示');
  console.log('-'.repeat(30));
  
  // 1. 日期筛选
  const dateFiltered = demoData.transactions.filter(t => 
    t.date >= '2024-01-16' && t.date <= '2024-01-18'
  );
  console.log(`📅 日期筛选 (2024-01-16 到 2024-01-18): ${dateFiltered.length} 条记录`);
  
  // 2. 状态筛选
  const completedTransactions = demoData.transactions.filter(t => t.status === 'Completed');
  console.log(`✅ 状态筛选 (Completed): ${completedTransactions.length} 条记录`);
  
  // 3. 金额筛选
  const highValueTransactions = demoData.transactions.filter(t => {
    const amount = t.debit > 0 ? t.debit : t.credit;
    return amount >= 1000;
  });
  console.log(`💰 金额筛选 (>=1000): ${highValueTransactions.length} 条记录`);
  
  // 4. 类别筛选
  const officeExpenses = demoData.transactions.filter(t => t.category === '办公费用');
  console.log(`📁 类别筛选 (办公费用): ${officeExpenses.length} 条记录`);
  
  // 5. 组合筛选
  const complexFiltered = demoData.transactions.filter(t => {
    const amount = t.debit > 0 ? t.debit : t.credit;
    return t.status === 'Completed' && amount >= 1000 && t.date >= '2024-01-16';
  });
  console.log(`🔍 组合筛选 (已完成 + 高价值 + 日期): ${complexFiltered.length} 条记录`);
}

// 演示导出功能
function demonstrateExport() {
  console.log('\n📤 导出功能演示');
  console.log('-'.repeat(30));
  
  const exportData = demoData.transactions.map(t => ({
    日期: t.date,
    交易ID: t.id,
    描述: t.description,
    账户: t.account,
    借方: t.debit > 0 ? t.debit : '',
    贷方: t.credit > 0 ? t.credit : '',
    状态: t.status,
    类别: t.category
  }));
  
  // CSV格式
  const csvHeaders = Object.keys(exportData[0]);
  const csvContent = [
    csvHeaders.join(','),
    ...exportData.map(row => csvHeaders.map(header => `"${row[header]}"`).join(','))
  ].join('\n');
  
  console.log(`📄 CSV导出: ${exportData.length} 条记录`);
  console.log(`   文件大小: ${csvContent.length} 字符`);
  console.log(`   文件名: 总账报表_${new Date().toISOString().split('T')[0]}.csv`);
  
  // Excel格式
  console.log(`📊 Excel导出: ${exportData.length} 条记录`);
  console.log(`   工作表: 总账报表`);
  console.log(`   列宽: 自动调整`);
  console.log(`   文件名: 总账报表_${new Date().toISOString().split('T')[0]}.xlsx`);
  
  // PDF格式
  console.log(`📋 PDF导出: ${exportData.length} 条记录`);
  console.log(`   布局: 横向A4`);
  console.log(`   表格: 专业格式`);
  console.log(`   文件名: 总账报表_${new Date().toISOString().split('T')[0]}.pdf`);
}

// 演示权限控制
function demonstratePermissions() {
  console.log('\n🔐 权限控制演示');
  console.log('-'.repeat(30));
  
  const userRoles = [
    { name: '财务主管', role: 'treasurer', level: 1 },
    { name: '总裁', role: 'president', level: 1 },
    { name: '副总裁', role: 'vice_president', level: 2 },
    { name: '助理副总裁', role: 'assistant_vice_president', level: 3 },
    { name: '项目主席', role: 'project_chairman', level: 3 }
  ];
  
  const requiredLevel = 2; // 导出功能需要Level 2权限
  
  userRoles.forEach(user => {
    const canExport = user.level <= requiredLevel;
    const canView = true; // 所有用户都可以查看
    const canFilter = true; // 所有用户都可以筛选
    
    console.log(`👤 ${user.name} (Level ${user.level}):`);
    console.log(`   查看数据: ${canView ? '✅' : '❌'}`);
    console.log(`   高级筛选: ${canFilter ? '✅' : '❌'}`);
    console.log(`   导出数据: ${canExport ? '✅' : '❌'}`);
    console.log('');
  });
}

// 演示数据统计
function demonstrateStatistics() {
  console.log('\n📈 数据统计演示');
  console.log('-'.repeat(30));
  
  // 交易统计
  const totalTransactions = demoData.transactions.length;
  const totalDebit = demoData.transactions.reduce((sum, t) => sum + t.debit, 0);
  const totalCredit = demoData.transactions.reduce((sum, t) => sum + t.credit, 0);
  
  console.log(`📊 交易统计:`);
  console.log(`   总交易数: ${totalTransactions}`);
  console.log(`   总借方: $${totalDebit.toLocaleString()}`);
  console.log(`   总贷方: $${totalCredit.toLocaleString()}`);
  
  // 按状态统计
  const statusStats = demoData.transactions.reduce((acc, t) => {
    acc[t.status] = (acc[t.status] || 0) + 1;
    return acc;
  }, {});
  
  console.log(`\n📋 状态分布:`);
  Object.entries(statusStats).forEach(([status, count]) => {
    const percentage = ((count / totalTransactions) * 100).toFixed(1);
    console.log(`   ${status}: ${count} 条 (${percentage}%)`);
  });
  
  // 按类别统计
  const categoryStats = demoData.transactions.reduce((acc, t) => {
    acc[t.category] = (acc[t.category] || 0) + 1;
    return acc;
  }, {});
  
  console.log(`\n📁 类别分布:`);
  Object.entries(categoryStats).forEach(([category, count]) => {
    const percentage = ((count / totalTransactions) * 100).toFixed(1);
    console.log(`   ${category}: ${count} 条 (${percentage}%)`);
  });
  
  // 账户统计
  const accountTypeStats = demoData.accounts.reduce((acc, account) => {
    acc[account.type] = (acc[account.type] || 0) + 1;
    return acc;
  }, {});
  
  console.log(`\n🏦 账户类型分布:`);
  Object.entries(accountTypeStats).forEach(([type, count]) => {
    console.log(`   ${type}: ${count} 个账户`);
  });
}

// 演示UI特性
function demonstrateUI() {
  console.log('\n🎨 用户界面特性');
  console.log('-'.repeat(30));
  
  console.log('📱 响应式设计:');
  console.log('   ✅ 移动端适配');
  console.log('   ✅ 平板端优化');
  console.log('   ✅ 桌面端完整功能');
  
  console.log('\n🔍 筛选状态指示:');
  console.log('   ✅ 活跃筛选按钮高亮');
  console.log('   ✅ 筛选条件计数显示');
  console.log('   ✅ 筛选标签可视化');
  
  console.log('\n📤 导出进度:');
  console.log('   ✅ 实时进度条');
  console.log('   ✅ 状态提示信息');
  console.log('   ✅ 完成自动关闭');
  
  console.log('\n🎯 用户体验:');
  console.log('   ✅ 直观的操作流程');
  console.log('   ✅ 清晰的视觉反馈');
  console.log('   ✅ 友好的错误提示');
}

// 运行所有演示
function runDemo() {
  console.log('🚀 开始功能演示...\n');
  
  demonstrateFiltering();
  demonstrateExport();
  demonstratePermissions();
  demonstrateStatistics();
  demonstrateUI();
  
  console.log('\n🎉 演示完成！');
  console.log('\n📋 功能总结:');
  console.log('  ✅ 高级筛选 - 支持多条件组合筛选');
  console.log('  ✅ 多格式导出 - CSV、Excel、PDF');
  console.log('  ✅ 权限控制 - 基于角色的访问控制');
  console.log('  ✅ 数据统计 - 完整的分析功能');
  console.log('  ✅ 用户界面 - 现代化响应式设计');
  
  console.log('\n💡 使用建议:');
  console.log('  - 根据实际需求组合筛选条件');
  console.log('  - 选择合适的导出格式');
  console.log('  - 定期备份重要数据');
  console.log('  - 关注权限管理安全');
}

// 如果直接运行此脚本
if (require.main === module) {
  runDemo();
}

module.exports = {
  demonstrateFiltering,
  demonstrateExport,
  demonstratePermissions,
  demonstrateStatistics,
  demonstrateUI,
  runDemo
}; 