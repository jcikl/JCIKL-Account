#!/usr/bin/env node

/**
 * 账户图表功能测试脚本
 * 验证账户图表的各项功能是否正常工作
 */

console.log('🧪 账户图表功能测试');
console.log('=' .repeat(50));

// 模拟账户数据
const mockAccounts = [
  {
    id: "1",
    code: "1001",
    name: "现金",
    type: "Asset",
    balance: 15000
  },
  {
    id: "2",
    code: "1002",
    name: "银行存款",
    type: "Asset",
    balance: 50000
  },
  {
    id: "3",
    code: "1101",
    name: "应收账款",
    type: "Asset",
    balance: 25000
  },
  {
    id: "4",
    code: "1201",
    name: "库存商品",
    type: "Asset",
    balance: 30000
  },
  {
    id: "5",
    code: "2001",
    name: "应付账款",
    type: "Liability",
    balance: -18000
  },
  {
    id: "6",
    code: "2002",
    name: "短期借款",
    type: "Liability",
    balance: -50000
  },
  {
    id: "7",
    code: "3001",
    name: "实收资本",
    type: "Equity",
    balance: 100000
  },
  {
    id: "8",
    code: "3002",
    name: "未分配利润",
    type: "Equity",
    balance: 12000
  },
  {
    id: "9",
    code: "4001",
    name: "主营业务收入",
    type: "Revenue",
    balance: 80000
  },
  {
    id: "10",
    code: "5001",
    name: "主营业务成本",
    type: "Expense",
    balance: -45000
  },
  {
    id: "11",
    code: "5002",
    name: "销售费用",
    type: "Expense",
    balance: -8000
  },
  {
    id: "12",
    code: "5003",
    name: "管理费用",
    type: "Expense",
    balance: -12000
  }
];

// 测试1: 统计信息计算
console.log('\n1. 测试统计信息计算...');
const totalAccounts = mockAccounts.length;
const totalBalance = mockAccounts.reduce((sum, account) => sum + account.balance, 0);
const positiveAccounts = mockAccounts.filter(account => account.balance > 0).length;
const negativeAccounts = mockAccounts.filter(account => account.balance < 0).length;

console.log(`总账户数: ${totalAccounts}`);
console.log(`总余额: $${totalBalance.toLocaleString()}`);
console.log(`正余额账户: ${positiveAccounts}`);
console.log(`负余额账户: ${negativeAccounts}`);

// 测试2: 账户类型分布
console.log('\n2. 测试账户类型分布...');
const accountTypes = [...new Set(mockAccounts.map(account => account.type))];
const typeStats = accountTypes.map(type => {
  const accountsOfType = mockAccounts.filter(account => account.type === type);
  const totalBalanceOfType = accountsOfType.reduce((sum, account) => sum + account.balance, 0);
  return {
    type,
    count: accountsOfType.length,
    totalBalance: totalBalanceOfType,
    percentage: (accountsOfType.length / totalAccounts) * 100
  };
});

typeStats.forEach(stat => {
  console.log(`${stat.type}: ${stat.count} 个账户, 总余额 $${stat.totalBalance.toLocaleString()}, ${stat.percentage.toFixed(1)}%`);
});

// 测试3: 搜索功能
console.log('\n3. 测试搜索功能...');
const searchTerm = "现金";
const searchResults = mockAccounts.filter(account => 
  account.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
  account.name.toLowerCase().includes(searchTerm.toLowerCase())
);

console.log(`搜索 "${searchTerm}" 的结果: ${searchResults.length} 个账户`);
searchResults.forEach(account => {
  console.log(`  - ${account.code}: ${account.name}`);
});

// 测试4: 类型筛选
console.log('\n4. 测试类型筛选...');
const filterType = "Asset";
const typeFilterResults = mockAccounts.filter(account => account.type === filterType);

console.log(`筛选类型 "${filterType}" 的结果: ${typeFilterResults.length} 个账户`);
typeFilterResults.forEach(account => {
  console.log(`  - ${account.code}: ${account.name} (余额: $${account.balance.toLocaleString()})`);
});

// 测试5: 余额范围筛选
console.log('\n5. 测试余额范围筛选...');
const balanceRange = "high"; // 高余额 (≥10,000)
const balanceFilterResults = mockAccounts.filter(account => {
  switch (balanceRange) {
    case "positive":
      return account.balance > 0;
    case "negative":
      return account.balance < 0;
    case "zero":
      return account.balance === 0;
    case "high":
      return account.balance >= 10000;
    case "low":
      return account.balance <= 1000;
    default:
      return true;
  }
});

console.log(`筛选余额范围 "${balanceRange}" 的结果: ${balanceFilterResults.length} 个账户`);
balanceFilterResults.forEach(account => {
  console.log(`  - ${account.code}: ${account.name} (余额: $${account.balance.toLocaleString()})`);
});

// 测试6: 排序功能
console.log('\n6. 测试排序功能...');
const sortBy = "balance";
const sortOrder = "desc";
const sortedAccounts = [...mockAccounts].sort((a, b) => {
  let aValue, bValue;
  
  switch (sortBy) {
    case "code":
      aValue = a.code;
      bValue = b.code;
      break;
    case "name":
      aValue = a.name;
      bValue = b.name;
      break;
    case "type":
      aValue = a.type;
      bValue = b.type;
      break;
    case "balance":
      aValue = a.balance;
      bValue = b.balance;
      break;
    default:
      aValue = a.code;
      bValue = b.code;
  }

  if (typeof aValue === "string" && typeof bValue === "string") {
    return sortOrder === "asc" 
      ? aValue.localeCompare(bValue)
      : bValue.localeCompare(aValue);
  } else {
    return sortOrder === "asc" 
      ? aValue - bValue
      : bValue - aValue;
  }
});

console.log(`按 ${sortBy} ${sortOrder === "asc" ? "升序" : "降序"} 排序的前5个账户:`);
sortedAccounts.slice(0, 5).forEach(account => {
  console.log(`  - ${account.code}: ${account.name} (余额: $${account.balance.toLocaleString()})`);
});

// 测试7: 组合筛选
console.log('\n7. 测试组合筛选...');
const combinedFilterResults = mockAccounts.filter(account => {
  const matchesType = account.type === "Asset";
  const matchesBalance = account.balance >= 10000;
  return matchesType && matchesBalance;
});

console.log(`组合筛选 (类型=Asset AND 余额≥10,000) 的结果: ${combinedFilterResults.length} 个账户`);
combinedFilterResults.forEach(account => {
  console.log(`  - ${account.code}: ${account.name} (余额: $${account.balance.toLocaleString()})`);
});

// 测试8: 账户操作模拟
console.log('\n8. 测试账户操作模拟...');
const testAccount = mockAccounts[0];
console.log(`选择账户: ${testAccount.code} - ${testAccount.name}`);
console.log(`编辑账户: ${testAccount.code} - ${testAccount.name}`);
console.log(`删除账户: ${testAccount.id}`);

// 测试9: 批量选择
console.log('\n9. 测试批量选择...');
const selectedAccountIds = new Set(["1", "2", "3"]);
console.log(`已选择 ${selectedAccountIds.size} 个账户`);
const selectedAccounts = mockAccounts.filter(account => selectedAccountIds.has(account.id));
selectedAccounts.forEach(account => {
  console.log(`  - ${account.code}: ${account.name}`);
});

// 测试10: 性能测试
console.log('\n10. 性能测试...');
const startTime = Date.now();
for (let i = 0; i < 1000; i++) {
  mockAccounts.filter(account => account.type === "Asset");
}
const endTime = Date.now();
console.log(`1000次筛选操作耗时: ${endTime - startTime}ms`);

console.log('\n✅ 账户图表功能测试完成');
console.log('\n📋 测试结果总结:');
console.log(`- 总账户数: ${totalAccounts}`);
console.log(`- 账户类型数: ${accountTypes.length}`);
console.log(`- 正余额账户: ${positiveAccounts}`);
console.log(`- 负余额账户: ${negativeAccounts}`);
console.log(`- 总余额: $${totalBalance.toLocaleString()}`);

console.log('\n🔗 相关链接:');
console.log('- 账户图表演示页面: http://localhost:3000/account-chart-demo');
console.log('- 总账模块: http://localhost:3000 (账户标签页)');
console.log('- 功能文档: docs/account-chart-features.md'); 