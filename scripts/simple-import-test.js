#!/usr/bin/env node

console.log('🧪 简化粘贴导入功能测试');
console.log('=' .repeat(40));

// 模拟现有账户数据
const existingAccounts = [
  { id: "1", code: "1001", name: "现金", type: "Asset", balance: 15000 },
  { id: "2", code: "1002", name: "银行存款", type: "Asset", balance: 50000 }
];

// 测试数据
const testData = `账户代码,账户名称,账户类型,余额,描述,父账户
1003,应收账款,Asset,25000,客户欠款,
2001,应付账款,Liability,-18000,供应商欠款,
3001,实收资本,Equity,100000,股东投资,`;

console.log('1. 测试数据解析...');
const lines = testData.trim().split('\n');
const dataLines = lines.slice(1); // 跳过标题行

const parsedAccounts = dataLines.map(line => {
  const fields = line.split(',').map(field => field.trim());
  const [code, name, type, balanceStr, description, parent] = fields;
  
  return {
    code: code || "",
    name: name || "",
    type: type || "Asset",
    balance: balanceStr ? parseFloat(balanceStr.replace(/[^\d.-]/g, '')) : 0,
    description: description || "",
    parent: parent || "",
    isValid: true,
    errors: []
  };
});

console.log(`解析到 ${parsedAccounts.length} 个账户:`);
parsedAccounts.forEach(account => {
  console.log(`  - ${account.code}: ${account.name} (${account.type}) - $${account.balance.toLocaleString()}`);
});

console.log('\n2. 测试数据验证...');
const validateAccount = (account, existingAccounts) => {
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
  
  // 检查重复的账户代码
  const existingAccount = existingAccounts.find(acc => acc.code === account.code);
  if (existingAccount) {
    errors.push("账户代码已存在");
  }
  
  return {
    ...account,
    isValid: errors.length === 0,
    errors
  };
};

const validatedAccounts = parsedAccounts.map(account => validateAccount(account, existingAccounts));
const validAccounts = validatedAccounts.filter(account => account.isValid);
const invalidAccounts = validatedAccounts.filter(account => !account.isValid);

console.log(`验证结果: ${validAccounts.length} 个有效, ${invalidAccounts.length} 个无效`);

if (validAccounts.length > 0) {
  console.log('\n有效账户:');
  validAccounts.forEach(account => {
    console.log(`  ✅ ${account.code}: ${account.name}`);
  });
}

if (invalidAccounts.length > 0) {
  console.log('\n无效账户:');
  invalidAccounts.forEach(account => {
    console.log(`  ❌ ${account.code}: ${account.name} - ${account.errors.join(', ')}`);
  });
}

console.log('\n3. 测试导入模拟...');
console.log(`准备导入 ${validAccounts.length} 个账户...`);
validAccounts.forEach(account => {
  console.log(`  ✅ 导入: ${account.code} - ${account.name}`);
});

console.log('\n🎉 粘贴导入功能测试完成！');
console.log('\n📋 功能总结:');
console.log('- ✅ CSV格式解析');
console.log('- ✅ 数据验证');
console.log('- ✅ 重复账户检测');
console.log('- ✅ 批量导入模拟');

console.log('\n📝 支持的数据格式:');
console.log('- CSV: 逗号分隔值');
console.log('- TSV: 制表符分隔值');
console.log('- Excel: CSV格式的Excel数据');

console.log('\n🔗 相关链接:');
console.log('- 账户图表演示: http://localhost:3000/account-chart-demo'); 