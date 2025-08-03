// scripts/test-filter.js
console.log('🧪 测试高级筛选功能...');

// 模拟筛选状态
const filters = {
  dateFrom: "",
  dateTo: "",
  amountMin: "",
  amountMax: "",
  statuses: [],
  categories: [],
  accounts: []
};

// 模拟交易数据
const transactions = [
  { id: 'TXN001', date: '2024-01-15', description: '办公用品', account: '办公费用', debit: 500, credit: 0, status: 'Completed', category: '办公费用' },
  { id: 'TXN002', date: '2024-01-16', description: '客户付款', account: '应收账款', debit: 0, credit: 2000, status: 'Completed', category: '收入' },
  { id: 'TXN003', date: '2024-01-17', description: '员工工资', account: '工资费用', debit: 3000, credit: 0, status: 'Pending', category: '人工费用' }
];

// 测试筛选逻辑
function testFiltering() {
  console.log('📊 测试筛选逻辑...');
  
  // 测试日期筛选
  const dateFiltered = transactions.filter(t => {
    if (!filters.dateFrom && !filters.dateTo) return true;
    const transactionDate = t.date;
    const fromMatch = !filters.dateFrom || transactionDate >= filters.dateFrom;
    const toMatch = !filters.dateTo || transactionDate <= filters.dateTo;
    return fromMatch && toMatch;
  });
  
  console.log(`日期筛选结果: ${dateFiltered.length} 条记录`);
  
  // 测试状态筛选
  const statusFiltered = transactions.filter(t => {
    if (filters.statuses.length === 0) return true;
    return filters.statuses.includes(t.status);
  });
  
  console.log(`状态筛选结果: ${statusFiltered.length} 条记录`);
  
  // 测试金额筛选
  const amountFiltered = transactions.filter(t => {
    const amount = t.debit > 0 ? t.debit : t.credit;
    const minMatch = !filters.amountMin || amount >= parseFloat(filters.amountMin);
    const maxMatch = !filters.amountMax || amount <= parseFloat(filters.amountMax);
    return minMatch && maxMatch;
  });
  
  console.log(`金额筛选结果: ${amountFiltered.length} 条记录`);
}

// 测试对话框状态
function testDialogState() {
  console.log('🔍 测试对话框状态...');
  
  let showAdvancedFilter = false;
  
  const openDialog = () => {
    console.log('打开对话框');
    showAdvancedFilter = true;
    console.log('对话框状态:', showAdvancedFilter);
  };
  
  const closeDialog = () => {
    console.log('关闭对话框');
    showAdvancedFilter = false;
    console.log('对话框状态:', showAdvancedFilter);
  };
  
  openDialog();
  closeDialog();
}

// 运行测试
testFiltering();
testDialogState();

console.log('✅ 筛选功能测试完成'); 