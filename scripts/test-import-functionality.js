// scripts/test-import-functionality.js
console.log('🧪 测试粘贴导入功能...');

// 模拟导入数据
const sampleImportData = [
  {
    code: "1001",
    name: "现金",
    type: "Asset",
    financialStatement: "Balance Sheet"
  },
  {
    code: "2001",
    name: "应付账款",
    type: "Liability",
    financialStatement: "Balance Sheet"
  },
  {
    code: "3001",
    name: "实收资本",
    type: "Equity",
    financialStatement: "Balance Sheet"
  }
];

// 模拟 CSV 数据
const csvData = `1001,Asset,现金,Balance Sheet
2001,Liability,应付账款,Balance Sheet
3001,Equity,实收资本,Balance Sheet`;

// 测试数据解析
function testDataParsing() {
  console.log('\n📋 测试数据解析...');
  
  const lines = csvData.trim().split('\n');
  const accounts = lines.map((line, index) => {
    const fields = line.split(',').map(field => field.trim());
    const [code, type, name, financialStatement] = fields;
    
    return {
      code,
      name,
      type,
      financialStatement: financialStatement || (() => {
        const balanceSheetTypes = ["Asset", "Liability", "Equity"];
        return balanceSheetTypes.includes(type) ? "Balance Sheet" : "Income Statement";
      })()
    };
  });
  
  console.log('✅ 解析结果:', accounts);
  return accounts;
}

// 测试数据验证
function testDataValidation(accounts) {
  console.log('\n📋 测试数据验证...');
  
  const validAccounts = [];
  const invalidAccounts = [];
  
  accounts.forEach((account, index) => {
    const errors = [];
    
    // 验证账户代码
    if (!account.code || account.code.length === 0) {
      errors.push("账户代码不能为空");
    } else if (account.code.length > 10) {
      errors.push("账户代码不能超过10个字符");
    }
    
    // 验证账户名称
    if (!account.name || account.name.length === 0) {
      errors.push("账户名称不能为空");
    } else if (account.name.length > 100) {
      errors.push("账户名称不能超过100个字符");
    }
    
    // 验证账户类型
    const validTypes = ["Asset", "Liability", "Equity", "Revenue", "Expense"];
    if (!account.type || !validTypes.includes(account.type)) {
      errors.push(`账户类型必须是以下之一: ${validTypes.join(', ')}`);
    }
    
    if (errors.length === 0) {
      validAccounts.push(account);
      console.log(`✅ 账户 ${index + 1} 验证通过: ${account.code} - ${account.name}`);
    } else {
      invalidAccounts.push({ ...account, errors });
      console.log(`❌ 账户 ${index + 1} 验证失败: ${account.code} - ${account.name}`);
      console.log(`   错误: ${errors.join(', ')}`);
    }
  });
  
  console.log(`\n📊 验证结果: ${validAccounts.length} 个有效, ${invalidAccounts.length} 个无效`);
  return { validAccounts, invalidAccounts };
}

// 测试导入处理
function testImportProcessing(validAccounts) {
  console.log('\n📋 测试导入处理...');
  
  const processedAccounts = validAccounts.map(account => ({
    ...account,
    balance: 0, // 默认余额
    description: "",
    parent: ""
  }));
  
  console.log('✅ 处理后的账户:', processedAccounts);
  return processedAccounts;
}

// 运行所有测试
function runAllTests() {
  console.log('🚀 开始粘贴导入功能测试...\n');
  
  try {
    // 测试 1: 数据解析
    const parsedAccounts = testDataParsing();
    
    // 测试 2: 数据验证
    const { validAccounts, invalidAccounts } = testDataValidation(parsedAccounts);
    
    // 测试 3: 导入处理
    const processedAccounts = testImportProcessing(validAccounts);
    
    console.log('\n🎉 所有测试完成！');
    console.log('📋 测试总结:');
    console.log(`   ✅ 数据解析: ${parsedAccounts.length} 个账户`);
    console.log(`   ✅ 数据验证: ${validAccounts.length} 个有效, ${invalidAccounts.length} 个无效`);
    console.log(`   ✅ 导入处理: ${processedAccounts.length} 个账户准备导入`);
    
  } catch (error) {
    console.error('❌ 测试失败:', error);
  }
}

// 执行测试
runAllTests(); 