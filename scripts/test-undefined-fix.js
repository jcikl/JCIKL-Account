// 测试undefined值修复
console.log('🧪 开始测试undefined值修复...\n');

// 模拟交易数据
const testTransactions = [
  {
    date: "2024-01-15",
    description: "办公室用品采购",
    description2: "办公用品",
    expense: 245.00,
    income: 0,
    status: "Completed",
    reference: "INV-001",
    category: "办公用品"
  },
  {
    date: "2024-01-14",
    description: "客户付款",
    description2: "", // 空字符串
    expense: 0,
    income: 5500.00,
    status: "Completed",
    reference: "", // 空字符串
    category: "" // 空字符串
  },
  {
    date: "2024-01-13",
    description: "银行手续费",
    description2: null, // null值
    expense: 15.00,
    income: 0,
    status: "Pending",
    reference: null, // null值
    category: null // null值
  },
  {
    date: "2024-01-12",
    description: "设备租赁",
    description2: undefined, // undefined值
    expense: 1200.00,
    income: 0,
    status: "Draft",
    reference: undefined, // undefined值
    category: undefined // undefined值
  }
];

// 模拟构建交易数据的函数
function buildTransactionData(parsed) {
  const netAmount = parsed.income - parsed.expense
  
  // 构建交易数据，只包含有值的字段
  const transactionData = {
    date: parsed.date,
    description: parsed.description,
    expense: parsed.expense,
    income: parsed.income,
    amount: netAmount >= 0 ? `+$${netAmount.toFixed(2)}` : `-$${Math.abs(netAmount).toFixed(2)}`,
    status: parsed.status,
    createdByUid: "test-user-1"
  }

  // 只有当description2有值时才添加
  if (parsed.description2 && parsed.description2.trim()) {
    transactionData.description2 = parsed.description2
  }

  // 只有当reference有值时才添加
  if (parsed.reference && parsed.reference.trim()) {
    transactionData.reference = parsed.reference
  }

  // 只有当category有值时才添加
  if (parsed.category && parsed.category.trim()) {
    transactionData.category = parsed.category
  }

  return transactionData
}

console.log('📊 测试交易数据构建:');
testTransactions.forEach((transaction, index) => {
  console.log(`${index + 1}. 交易: ${transaction.description}`);
  console.log(`   原始数据:`, transaction);
  
  const builtData = buildTransactionData(transaction);
  console.log(`   构建后数据:`, builtData);
  
  // 检查是否包含undefined值
  const hasUndefined = Object.values(builtData).some(value => value === undefined);
  console.log(`   包含undefined: ${hasUndefined ? '❌' : '✅'}`);
  console.log('');
});

// 测试CSV数据处理
console.log('📋 测试CSV数据处理:');
const csvData = [
  "日期,描述,描述2,支出金额,收入金额,状态,参考,分类",
  "2024-01-15,办公室用品,办公用品,245.00,0.00,Completed,INV-001,办公用品",
  "2024-01-14,客户付款,,0.00,5500.00,Completed,,收入",
  "2024-01-13,银行手续费,,15.00,0.00,Pending,,银行费用"
];

csvData.slice(1).forEach((line, index) => {
  const values = line.split(",").map(v => v.trim().replace(/"/g, ""));
  const parsed = {
    date: values[0],
    description: values[1],
    description2: values[2],
    expense: parseFloat(values[3] || "0"),
    income: parseFloat(values[4] || "0"),
    status: values[5] || "Pending",
    reference: values[6],
    category: values[7]
  };
  
  console.log(`${index + 1}. CSV行: ${line}`);
  console.log(`   解析后:`, parsed);
  
  const builtData = buildTransactionData(parsed);
  console.log(`   构建后数据:`, builtData);
  
  // 检查是否包含undefined值
  const hasUndefined = Object.values(builtData).some(value => value === undefined);
  console.log(`   包含undefined: ${hasUndefined ? '❌' : '✅'}`);
  console.log('');
});

console.log('✅ undefined值修复测试完成！');
console.log('\n📝 总结:');
console.log('- 修复了Firebase不支持undefined值的问题');
console.log('- 只有当字段有实际值时才包含在对象中');
console.log('- 空字符串、null、undefined都会被过滤掉');
console.log('- 确保所有存储到Firebase的数据都是有效的'); 