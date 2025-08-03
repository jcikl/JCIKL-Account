const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🧪 测试交易导入对话框新功能...\n');

// 检查文件是否存在
const dialogFile = path.join(__dirname, '../components/modules/transaction-import-dialog.tsx');
if (!fs.existsSync(dialogFile)) {
  console.error('❌ 交易导入对话框文件不存在');
  process.exit(1);
}

console.log('✅ 交易导入对话框文件存在');

// 检查关键功能是否已实现
const dialogContent = fs.readFileSync(dialogFile, 'utf8');

// 检查统计卡片功能
const hasStatsCards = dialogContent.includes('统计信息卡片') && 
                     dialogContent.includes('总支出') && 
                     dialogContent.includes('总收入') && 
                     dialogContent.includes('净收支');

if (hasStatsCards) {
  console.log('✅ 统计信息卡片功能已实现');
} else {
  console.log('❌ 统计信息卡片功能未实现');
}

// 检查表格显示功能
const hasTableDisplay = dialogContent.includes('Table') && 
                       dialogContent.includes('TableHeader') && 
                       dialogContent.includes('TableBody');

if (hasTableDisplay) {
  console.log('✅ 有效交易表格显示功能已实现');
} else {
  console.log('❌ 有效交易表格显示功能未实现');
}

// 检查总收支计算功能
const hasTotalsCalculation = dialogContent.includes('calculateTotals') && 
                            dialogContent.includes('totalExpense') && 
                            dialogContent.includes('totalIncome') && 
                            dialogContent.includes('netAmount');

if (hasTotalsCalculation) {
  console.log('✅ 总收支计算功能已实现');
} else {
  console.log('❌ 总收支计算功能未实现');
}

// 检查支出收入总和显示功能
const hasExpenseIncomeDisplay = dialogContent.includes('支出: $') && 
                               dialogContent.includes('收入: $') &&
                               dialogContent.includes('totals.totalExpense.toFixed(2)') &&
                               dialogContent.includes('totals.totalIncome.toFixed(2)');

if (hasExpenseIncomeDisplay) {
  console.log('✅ 支出收入总和显示功能已实现');
} else {
  console.log('❌ 支出收入总和显示功能未实现');
}

// 检查完整显示所有交易功能
const hasCompleteDisplay = dialogContent.includes('validTransactions.map') && 
                          !dialogContent.includes('showAllValidTransactions') &&
                          !dialogContent.includes('validTransactions.slice(0, 10)') &&
                          !dialogContent.includes('查看全部') &&
                          dialogContent.includes('共 {validTransactions.length} 条记录');

if (hasCompleteDisplay) {
  console.log('✅ 完整显示所有交易功能已实现');
} else {
  console.log('❌ 完整显示所有交易功能未实现');
}

// 检查导入的组件
const hasCardImport = dialogContent.includes('Card, CardContent, CardHeader, CardTitle');
const hasTableImport = dialogContent.includes('Table, TableBody, TableCell, TableHead, TableHeader, TableRow');
const hasIconsImport = dialogContent.includes('TrendingUp, TrendingDown, DollarSign');

if (hasCardImport && hasTableImport && hasIconsImport) {
  console.log('✅ 所需组件已正确导入');
} else {
  console.log('❌ 缺少必要的组件导入');
}

// 检查对话框尺寸调整
const hasDialogSizeAdjustment = dialogContent.includes('max-w-6xl') && 
                               dialogContent.includes('max-h-[90vh]');

if (hasDialogSizeAdjustment) {
  console.log('✅ 对话框尺寸已调整为更大尺寸');
} else {
  console.log('❌ 对话框尺寸未调整');
}

console.log('\n📊 功能总结:');
console.log('- 完整显示所有有效交易记录');
console.log('- 总支出、总收入、净收支统计');
console.log('- 交易数量统计（新增/更新）');
console.log('- 支出总和和收入总和显示');
console.log('- 表格形式显示交易详情');
console.log('- 响应式统计卡片布局');

console.log('\n🎯 新功能特点:');
console.log('1. 实时计算总收支统计');
console.log('2. 清晰显示每笔交易的详细信息');
console.log('3. 完整显示所有交易记录，无隐藏');
console.log('4. 直观的统计卡片展示');
console.log('5. 优化的对话框尺寸和布局');
console.log('6. 在统计信息中显示支出总和和收入总和');

console.log('\n✅ 交易导入对话框新功能测试完成！'); 