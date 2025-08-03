// scripts/test-account-types.js
console.log('🧪 测试不同账户类型的创建...');

// 测试数据
const testAccounts = [
  {
    code: "1001",
    name: "现金",
    type: "Asset",
    balance: 50000,
    description: "主要现金账户",
    parent: ""
  },
  {
    code: "2001", 
    name: "应付账款",
    type: "Liability",
    balance: -25000,
    description: "供应商应付账款",
    parent: ""
  },
  {
    code: "3001",
    name: "实收资本",
    type: "Equity", 
    balance: 100000,
    description: "股东投入资本",
    parent: ""
  },
  {
    code: "4001",
    name: "主营业务收入",
    type: "Revenue",
    balance: 80000,
    description: "主要业务收入",
    parent: ""
  },
  {
    code: "5001",
    name: "主营业务成本",
    type: "Expense",
    balance: -45000,
    description: "主要业务成本",
    parent: ""
  }
];

// 测试账户创建函数
function createAccount(accountData) {
  console.log(`\n📝 创建账户: ${accountData.code} - ${accountData.name}`);
  
  // 验证数据类型
  const validTypes = ["Asset", "Liability", "Equity", "Revenue", "Expense"];
  if (!validTypes.includes(accountData.type)) {
    throw new Error(`无效的账户类型: ${accountData.type}`);
  }
  
  // 创建账户对象
  const account = {
    id: Date.now().toString(),
    code: accountData.code,
    name: accountData.name,
    type: accountData.type,
    balance: accountData.balance,
    financialStatement: getFinancialStatement(accountData.type),
    parent: accountData.parent
  };
  
  console.log(`✅ 账户创建成功:`);
  console.log(`   - ID: ${account.id}`);
  console.log(`   - 代码: ${account.code}`);
  console.log(`   - 名称: ${account.name}`);
  console.log(`   - 类型: ${account.type}`);
  console.log(`   - 余额: ${account.balance}`);
  console.log(`   - 财务报表: ${account.financialStatement}`);
  
  return account;
}

// 获取财务报表分类
function getFinancialStatement(type) {
  const balanceSheetTypes = ["Asset", "Liability", "Equity"];
  return balanceSheetTypes.includes(type) ? "Balance Sheet" : "Income Statement";
}

// 测试所有账户类型
function testAllAccountTypes() {
  console.log('🔍 测试所有账户类型...');
  
  const createdAccounts = [];
  
  testAccounts.forEach((testAccount, index) => {
    try {
      const account = createAccount(testAccount);
      createdAccounts.push(account);
      console.log(`✅ 测试用例 ${index + 1} 通过`);
    } catch (error) {
      console.log(`❌ 测试用例 ${index + 1} 失败: ${error.message}`);
    }
  });
  
  // 统计结果
  console.log('\n📊 测试结果统计:');
  console.log(`总测试用例: ${testAccounts.length}`);
  console.log(`成功创建: ${createdAccounts.length}`);
  console.log(`失败数量: ${testAccounts.length - createdAccounts.length}`);
  
  // 按类型统计
  const typeStats = {};
  createdAccounts.forEach(account => {
    typeStats[account.type] = (typeStats[account.type] || 0) + 1;
  });
  
  console.log('\n📈 按类型统计:');
  Object.entries(typeStats).forEach(([type, count]) => {
    console.log(`  ${type}: ${count} 个账户`);
  });
  
  return createdAccounts;
}

// 验证特定类型
function validateSpecificTypes() {
  console.log('\n🎯 验证特定账户类型...');
  
  const targetTypes = ["Asset", "Liability", "Equity"];
  
  targetTypes.forEach(type => {
    const testData = {
      code: `TEST${type.charAt(0)}`,
      name: `测试${type}账户`,
      type: type,
      balance: type === "Asset" ? 10000 : type === "Liability" ? -5000 : 5000,
      description: `测试${type}类型账户`,
      parent: ""
    };
    
    try {
      const account = createAccount(testData);
      console.log(`✅ ${type} 类型账户创建成功`);
    } catch (error) {
      console.log(`❌ ${type} 类型账户创建失败: ${error.message}`);
    }
  });
}

// 运行测试
console.log('🚀 开始测试...');
const accounts = testAllAccountTypes();
validateSpecificTypes();

console.log('\n✅ 账户类型测试完成');
console.log(`共创建了 ${accounts.length} 个测试账户`); 