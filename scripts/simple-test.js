// scripts/simple-test.js
console.log('🧪 开始测试总账模块功能...');

// 模拟数据
const transactions = [
  { id: 'TXN001', date: '2024-01-15', description: '办公用品', account: '办公费用', debit: 500, credit: 0, status: 'Completed' },
  { id: 'TXN002', date: '2024-01-16', description: '客户付款', account: '应收账款', debit: 0, credit: 2000, status: 'Completed' },
  { id: 'TXN003', date: '2024-01-17', description: '员工工资', account: '工资费用', debit: 3000, credit: 0, status: 'Pending' }
];

console.log(`📊 总交易数: ${transactions.length}`);

// 测试筛选
const completedTransactions = transactions.filter(t => t.status === 'Completed');
console.log(`✅ 已完成交易: ${completedTransactions.length}`);

const highValueTransactions = transactions.filter(t => {
  const amount = t.debit > 0 ? t.debit : t.credit;
  return amount >= 1000;
});
console.log(`💰 高价值交易 (>=1000): ${highValueTransactions.length}`);

// 测试统计
const totalDebit = transactions.reduce((sum, t) => sum + t.debit, 0);
const totalCredit = transactions.reduce((sum, t) => sum + t.credit, 0);
console.log(`📈 总借方: $${totalDebit.toLocaleString()}`);
console.log(`📉 总贷方: $${totalCredit.toLocaleString()}`);

console.log('🎉 测试完成！'); 