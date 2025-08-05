const fs = require('fs');
const path = require('path');

// 需要分析的组件列表
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

// 分析单个组件
function analyzeComponent(componentName) {
  const filePath = path.join(__dirname, '..', 'components', 'modules', `${componentName}.tsx`);
  
  if (!fs.existsSync(filePath)) {
    return {
      exists: false,
      name: componentName,
      size: 0,
      lines: 0,
      features: []
    };
  }
  
  const content = fs.readFileSync(filePath, 'utf8');
  const stats = fs.statSync(filePath);
  const lines = content.split('\n').length;
  
  const features = [];
  if (content.includes('React.memo')) features.push('React.memo');
  if (content.includes('useMemo')) features.push('useMemo');
  if (content.includes('useCallback')) features.push('useCallback');
  if (content.includes('virtual') || content.includes('Virtual')) features.push('Virtual Scroll');
  if (content.includes('React.lazy') || content.includes('Suspense')) features.push('Lazy Loading');
  if (content.includes('ErrorBoundary')) features.push('Error Boundary');
  if (content.includes('PerformanceMonitor')) features.push('Performance Monitor');
  
  return {
    exists: true,
    name: componentName,
    size: stats.size,
    lines,
    features
  };
}

// 生成分析报告
function generateReport() {
  console.log('🔍 组件分析报告\n');
  console.log('='.repeat(80));
  
  const results = components.map(analyzeComponent);
  const existing = results.filter(r => r.exists);
  const missing = results.filter(r => !r.exists);
  
  console.log(`📊 统计信息:`);
  console.log(`   总组件数: ${components.length}`);
  console.log(`   存在组件: ${existing.length}`);
  console.log(`   缺失组件: ${missing.length}`);
  console.log('');
  
  // 按类型分组
  const optimized = existing.filter(c => c.name.includes('optimized'));
  const virtual = existing.filter(c => c.name.includes('virtual'));
  const standard = existing.filter(c => !c.name.includes('optimized') && !c.name.includes('virtual'));
  const standalone = existing.filter(c => 
    ['bank-account-management', 'bank-account-selector', 'gl-settings-management', 
     'category-paste-import-dialog', 'project-import-dialog', 'project-paste-import-dialog'].includes(c.name)
  );
  
  console.log(`📋 组件分类:`);
  console.log(`   优化版本: ${optimized.length}`);
  console.log(`   虚拟滚动: ${virtual.length}`);
  console.log(`   标准版本: ${standard.length}`);
  console.log(`   独立组件: ${standalone.length}`);
  console.log('');
  
  // 显示所有存在的组件
  console.log('✅ 存在的组件:');
  existing.forEach(comp => {
    const sizeKB = (comp.size / 1024).toFixed(1);
    const features = comp.features.length > 0 ? ` [${comp.features.join(', ')}]` : '';
    console.log(`   ${comp.name} (${comp.lines} 行, ${sizeKB}KB)${features}`);
  });
  
  if (missing.length > 0) {
    console.log('\n❌ 缺失的组件:');
    missing.forEach(comp => {
      console.log(`   ${comp.name}`);
    });
  }
  
  // 生成建议
  console.log('\n💡 清理建议:');
  
  // 找出可以删除的重复组件
  const componentGroups = {
    'account-chart': ['account-chart', 'account-chart-optimized', 'account-chart-virtual'],
    'account-settings': ['account-settings', 'account-settings-optimized'],
    'account-summary': ['account-summary', 'account-summary-optimized'],
    'account-form-dialog': ['account-form-dialog', 'account-form-dialog-optimized'],
    'balance-sheet': ['balance-sheet', 'balance-sheet-optimized'],
    'dashboard-overview': ['dashboard-overview', 'dashboard-overview-optimized'],
    'export-dialog': ['export-dialog', 'export-dialog-optimized'],
    'import-dialog': ['import-dialog', 'import-dialog-optimized', 'import-dialog-enhanced'],
    'journal-entries': ['journal-entries', 'journal-entries-optimized'],
    'profit-loss': ['profit-loss', 'profit-loss-optimized'],
    'project-accounts': ['project-accounts', 'project-accounts-optimized', 'project-accounts-virtual'],
    'project-details-dialog': ['project-details-dialog', 'project-details-dialog-optimized'],
    'project-form-dialog': ['project-form-dialog', 'project-form-dialog-optimized'],
    'transaction-import-dialog': ['transaction-import-dialog', 'transaction-import-dialog-optimized'],
    'trial-balance': ['trial-balance', 'trial-balance-optimized'],
    'category-management': ['category-management', 'category-management-optimized']
  };
  
  Object.entries(componentGroups).forEach(([groupName, groupComponents]) => {
    const existingInGroup = groupComponents.filter(name => 
      existing.some(comp => comp.name === name)
    );
    
    if (existingInGroup.length > 1) {
      const optimized = existingInGroup.find(name => name.includes('optimized'));
      const virtual = existingInGroup.find(name => name.includes('virtual'));
      const standard = existingInGroup.find(name => !name.includes('optimized') && !name.includes('virtual'));
      
      console.log(`\n${groupName}:`);
      
      if (optimized && standard) {
        console.log(`   ✅ 保留: ${optimized} (优化版本)`);
        console.log(`   ❌ 删除: ${standard} (标准版本)`);
      }
      
      if (virtual) {
        console.log(`   ✅ 保留: ${virtual} (虚拟滚动版本)`);
      }
    }
  });
  
  console.log('\n🎯 总结:');
  console.log('1. 优先使用优化版本 (-optimized)');
  console.log('2. 大数据量场景使用虚拟滚动版本 (-virtual)');
  console.log('3. 删除标准版本以减少代码重复');
  console.log('4. 保留独立组件（无重复版本）');
}

// 执行分析
generateReport(); 