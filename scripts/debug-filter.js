console.log('🔍 调试高级筛选功能...');

// 检查基本功能
console.log('1. 检查基本变量...');
const testFilters = {
  dateFrom: "",
  dateTo: "",
  amountMin: "",
  amountMax: "",
  statuses: [],
  categories: [],
  accounts: []
};

console.log('筛选状态:', testFilters);

// 检查筛选逻辑
console.log('\n2. 检查筛选逻辑...');
const testTransactions = [
  { id: '1', date: '2024-01-15', status: 'Completed', debit: 1000, credit: 0 },
  { id: '2', date: '2024-01-16', status: 'Pending', debit: 0, credit: 2000 }
];

const filtered = testTransactions.filter(t => {
  // 日期筛选
  const dateMatch = !testFilters.dateFrom || t.date >= testFilters.dateFrom;
  
  // 状态筛选
  const statusMatch = testFilters.statuses.length === 0 || testFilters.statuses.includes(t.status);
  
  // 金额筛选
  const amount = t.debit > 0 ? t.debit : t.credit;
  const amountMatch = !testFilters.amountMin || amount >= parseFloat(testFilters.amountMin);
  
  return dateMatch && statusMatch && amountMatch;
});

console.log('筛选结果:', filtered.length, '条记录');

// 检查对话框状态
console.log('\n3. 检查对话框状态...');
let dialogOpen = false;

const openDialog = () => {
  console.log('尝试打开对话框...');
  dialogOpen = true;
  console.log('对话框状态:', dialogOpen);
};

const closeDialog = () => {
  console.log('尝试关闭对话框...');
  dialogOpen = false;
  console.log('对话框状态:', dialogOpen);
};

openDialog();
closeDialog();

console.log('\n✅ 调试完成');
console.log('如果看到以上输出，说明基本逻辑正常');
console.log('问题可能在于：');
console.log('1. React组件渲染问题');
console.log('2. 事件处理函数未正确绑定');
console.log('3. 状态更新未触发重新渲染');
console.log('4. CSS样式问题导致对话框不可见'); 