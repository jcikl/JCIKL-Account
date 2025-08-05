const fs = require('fs');
const path = require('path');

// 组件分组（用于比较）
const componentGroups = {
  'account-chart': ['account-chart', 'account-chart-optimized', 'account-chart-virtual'],
  'account-settings': ['account-settings', 'account-settings-optimized'],
  'account-summary': ['account-summary', 'account-summary-optimized'],
  'account-form-dialog': ['account-form-dialog', 'account-form-dialog-optimized'],
  'balance-sheet': ['balance-sheet', 'balance-sheet-optimized'],
  'bank-transactions': ['bank-transactions-fixed', 'bank-transactions-charts'],
  'category-management': ['category-management', 'category-management-optimized'],
  'dashboard-overview': ['dashboard-overview', 'dashboard-overview-optimized'],
  'export-dialog': ['export-dialog', 'export-dialog-optimized'],
  'import-dialog': ['import-dialog', 'import-dialog-optimized', 'import-dialog-enhanced'],
  'journal-entries': ['journal-entries', 'journal-entries-optimized'],
  'paste-import-dialog': ['paste-import-dialog'],
  'profit-loss': ['profit-loss', 'profit-loss-optimized'],
  'project-accounts': ['project-accounts', 'project-accounts-optimized', 'project-accounts-virtual'],
  'project-details-dialog': ['project-details-dialog', 'project-details-dialog-optimized'],
  'project-form-dialog': ['project-form-dialog', 'project-form-dialog-optimized'],
  'transaction-import-dialog': ['transaction-import-dialog', 'transaction-import-dialog-optimized'],
  'trial-balance': ['trial-balance', 'trial-balance-optimized'],
  'standalone': [
    'bank-account-management',
    'bank-account-selector',
    'category-paste-import-dialog',
    'gl-settings-management',
    'project-import-dialog',
    'project-paste-import-dialog'
  ]
};

// 分析组件文件
function analyzeComponent(componentName) {
  const filePath = path.join(__dirname, '..', 'components', 'modules', `${componentName}.tsx`);
  
  if (!fs.existsSync(filePath)) {
    return {
      exists: false,
      name: componentName,
      size: 0,
      lines: 0,
      hasOptimizations: false,
      hasVirtualScroll: false,
      hasMemo: false,
      hasLazyLoading: false,
      hasErrorBoundary: false,
      hasPerformanceMonitoring: false
    };
  }
  
  const content = fs.readFileSync(filePath, 'utf8');
  const stats = fs.statSync(filePath);
  
  const lines = content.split('\n').length;
  const hasOptimizations = content.includes('React.memo') || content.includes('useMemo') || content.includes('useCallback');
  const hasVirtualScroll = content.includes('virtual') || content.includes('Virtual');
  const hasMemo = content.includes('React.memo');
  const hasLazyLoading = content.includes('React.lazy') || content.includes('Suspense');
  const hasErrorBoundary = content.includes('ErrorBoundary') || content.includes('error boundary');
  const hasPerformanceMonitoring = content.includes('PerformanceMonitor') || content.includes('performance');
  
  return {
    exists: true,
    name: componentName,
    size: stats.size,
    lines,
    hasOptimizations,
    hasVirtualScroll,
    hasMemo,
    hasLazyLoading,
    hasErrorBoundary,
    hasPerformanceMonitoring
  };
}

// 生成比较报告
function generateComparisonReport() {
  console.log('🔍 开始分析组件...\n');
  
  const report = {
    groups: {},
    recommendations: [],
    summary: {
      total: 0,
      optimized: 0,
      standard: 0,
      virtual: 0,
      standalone: 0
    }
  };
  
  // 分析每个组件组
  Object.entries(componentGroups).forEach(([groupName, components]) => {
    console.log(`📊 分析组: ${groupName}`);
    
    const groupAnalysis = components.map(analyzeComponent);
    const existingComponents = groupAnalysis.filter(c => c.exists);
    
    if (existingComponents.length === 0) {
      console.log(`   ⚠️  没有找到任何组件`);
      return;
    }
    
    // 按文件大小排序
    existingComponents.sort((a, b) => b.size - a.size);
    
    console.log(`   📁 找到 ${existingComponents.length} 个组件:`);
    existingComponents.forEach(comp => {
      const features = [];
      if (comp.hasOptimizations) features.push('优化');
      if (comp.hasVirtualScroll) features.push('虚拟滚动');
      if (comp.hasMemo) features.push('Memo');
      if (comp.hasLazyLoading) features.push('懒加载');
      if (comp.hasErrorBoundary) features.push('错误边界');
      if (comp.hasPerformanceMonitoring) features.push('性能监控');
      
      console.log(`      ✅ ${comp.name} (${comp.lines} 行, ${(comp.size / 1024).toFixed(1)}KB) ${features.length > 0 ? `[${features.join(', ')}]` : ''}`);
    });
    
    report.groups[groupName] = {
      components: existingComponents,
      recommendations: generateGroupRecommendations(groupName, existingComponents)
    };
    
    // 更新统计
    report.summary.total += existingComponents.length;
    existingComponents.forEach(comp => {
      if (comp.name.includes('optimized')) report.summary.optimized++;
      else if (comp.name.includes('virtual')) report.summary.virtual++;
      else if (groupName === 'standalone') report.summary.standalone++;
      else report.summary.standard++;
    });
    
    console.log('');
  });
  
  // 生成总体建议
  report.recommendations = generateOverallRecommendations(report);
  
  // 输出报告
  console.log('📋 分析报告:');
  console.log('='.repeat(50));
  console.log(`总组件数: ${report.summary.total}`);
  console.log(`优化版本: ${report.summary.optimized}`);
  console.log(`标准版本: ${report.summary.standard}`);
  console.log(`虚拟滚动版本: ${report.summary.virtual}`);
  console.log(`独立组件: ${report.summary.standalone}`);
  console.log('');
  
  console.log('💡 建议:');
  report.recommendations.forEach((rec, index) => {
    console.log(`${index + 1}. ${rec}`);
  });
  
  console.log('\n🎯 详细建议:');
  Object.entries(report.groups).forEach(([groupName, group]) => {
    if (group.recommendations.length > 0) {
      console.log(`\n${groupName}:`);
      group.recommendations.forEach(rec => {
        console.log(`  - ${rec}`);
      });
    }
  });
  
  return report;
}

// 生成组件组建议
function generateGroupRecommendations(groupName, components) {
  const recommendations = [];
  
  if (components.length === 1) {
    recommendations.push(`保留唯一版本: ${components[0].name}`);
    return recommendations;
  }
  
  // 找到优化版本
  const optimized = components.find(c => c.name.includes('optimized'));
  const virtual = components.find(c => c.name.includes('virtual'));
  const standard = components.find(c => !c.name.includes('optimized') && !c.name.includes('virtual'));
  
  if (optimized && standard) {
    if (optimized.lines < standard.lines * 0.8) {
      recommendations.push(`建议删除标准版本 ${standard.name}，保留优化版本 ${optimized.name}`);
    } else {
      recommendations.push(`建议保留两个版本，优化版本 ${optimized.name} 用于生产环境`);
    }
  }
  
  if (virtual && standard) {
    recommendations.push(`建议保留虚拟滚动版本 ${virtual.name} 用于大数据量场景`);
  }
  
  if (optimized && virtual) {
    recommendations.push(`建议保留优化版本 ${optimized.name} 和虚拟滚动版本 ${virtual.name}，根据使用场景选择`);
  }
  
  return recommendations;
}

// 生成总体建议
function generateOverallRecommendations(report) {
  const recommendations = [];
  
  if (report.summary.optimized > report.summary.standard) {
    recommendations.push('优化版本数量较多，建议优先使用优化版本');
  }
  
  if (report.summary.virtual > 0) {
    recommendations.push('存在虚拟滚动版本，建议在数据量大的场景使用');
  }
  
  recommendations.push('建议删除未使用的组件以减少包大小');
  recommendations.push('建议统一组件命名规范');
  
  return recommendations;
}

// 执行分析
generateComparisonReport(); 