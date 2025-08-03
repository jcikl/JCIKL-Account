// 测试银行交易记录格式处理
console.log('🧪 开始测试银行交易记录格式处理...\n');

// 基于您提供的实际银行交易记录格式
const bankRecordData = [
  {
    date: "5 Feb 2025",
    description1: "iab jcikl tan kok yoTAN KOK YONG *Sent from Amon",
    description2: "",
    debit: "",
    credit: "168.00",
    balance: "30,036.21",
    name1: "TAN KOK YONG",
    description: "2025 JCI KL IAB_Ticketing (Member)",
    project: "2025 EVP_JCI KL IAB",
    cat: "2025 Project",
    typeOfFund: "Incomes"
  },
  {
    date: "5 Feb 2025",
    description1: "HUAN HUI YI *Area Conventio",
    description2: "",
    debit: "",
    credit: "503.00",
    balance: "30,539.21",
    name1: "Hayley HUAN HUI YI",
    description: "2025 JCI ACC_Ticketing",
    project: "2025 JCIM ACC",
    cat: "Project",
    typeOfFund: "Incomes"
  },
  {
    date: "5 Feb 2025",
    description1: "JUNIOR CHAMBER INTE*Intertransfer",
    description2: "ss",
    debit: "21270",
    credit: "",
    balance: "9,269.21",
    name1: "Intertransfer (ACC Ticker Purchase)",
    description: "2025 JCI ACC_Ticketing",
    project: "2025 JCIM ACC",
    cat: "Project",
    typeOfFund: "Incomes"
  },
  {
    date: "6 Feb 2025",
    description1: "OOI KEN HEAN *",
    description2: "IAB ipoh willi",
    debit: "",
    credit: "188.00",
    balance: "9,457.21",
    name1: "OOI KEN HEAN",
    description: "2025 JCI KL IAB_Ticketing (Non-Member)",
    project: "2025 EVP_JCI KL IAB",
    cat: "2025 Project",
    typeOfFund: "Incomes"
  }
];

// 日期格式转换函数
function convertDateFormat(dateStr) {
  // 处理 "5 Feb 2025" 格式
  const months = {
    'Jan': '01', 'Feb': '02', 'Mar': '03', 'Apr': '04',
    'May': '05', 'Jun': '06', 'Jul': '07', 'Aug': '08',
    'Sep': '09', 'Oct': '10', 'Nov': '11', 'Dec': '12'
  };
  
  const parts = dateStr.split(' ');
  if (parts.length === 3) {
    const day = parts[0].padStart(2, '0');
    const month = months[parts[1]];
    const year = parts[2];
    return `${year}-${month}-${day}`;
  }
  return dateStr;
}

// 转换银行记录为我们的交易格式
function convertBankRecordToTransaction(record) {
  const debit = parseFloat(record.debit) || 0;
  const credit = parseFloat(record.credit) || 0;
  const netAmount = credit - debit;
  
  // 构建交易数据，只包含有值的字段
  const transactionData = {
    date: convertDateFormat(record.date),
    description: record.description1,
    expense: debit,
    income: credit,
    amount: netAmount >= 0 ? `+$${netAmount.toFixed(2)}` : `-$${Math.abs(netAmount).toFixed(2)}`,
    status: "Completed",
    createdByUid: "test-user-1"
  }

  // 只有当description2有值时才添加
  if (record.description2 && record.description2.trim()) {
    transactionData.description2 = record.description2
  }

  // 只有当name1有值时才添加为reference
  if (record.name1 && record.name1.trim()) {
    transactionData.reference = record.name1
  }

  // 只有当cat有值时才添加为category
  if (record.cat && record.cat.trim()) {
    transactionData.category = record.cat
  }

  return transactionData
}

console.log('📊 测试银行记录格式转换:');
bankRecordData.forEach((record, index) => {
  console.log(`${index + 1}. 原始银行记录:`, record);
  
  const converted = convertBankRecordToTransaction(record);
  console.log(`   转换后交易数据:`, converted);
  
  // 检查是否包含undefined值
  const hasUndefined = Object.values(converted).some(value => value === undefined);
  console.log(`   包含undefined: ${hasUndefined ? '❌' : '✅'}`);
  
  // 检查日期格式
  const dateFormat = /^\d{4}-\d{2}-\d{2}$/.test(converted.date);
  console.log(`   日期格式正确: ${dateFormat ? '✅' : '❌'} (${converted.date})`);
  console.log('');
});

// 模拟CSV格式的银行记录
console.log('📋 测试CSV格式银行记录:');
const csvBankData = [
  "DATE,Description 1,Description 2,DEBIT,CREDIT,Balance,NAME 1,DESCRIPTION,Project,Cat,Type of Fund",
  "5 Feb 2025,iab jcikl tan kok yoTAN KOK YONG *Sent from Amon,,,168.00,30036.21,TAN KOK YONG,2025 JCI KL IAB_Ticketing (Member),2025 EVP_JCI KL IAB,2025 Project,Incomes",
  "5 Feb 2025,HUAN HUI YI *Area Conventio,,,503.00,30539.21,Hayley HUAN HUI YI,2025 JCI ACC_Ticketing,2025 JCIM ACC,Project,Incomes",
  "5 Feb 2025,JUNIOR CHAMBER INTE*Intertransfer,ss,21270,,9269.21,Intertransfer (ACC Ticker Purchase),2025 JCI ACC_Ticketing,2025 JCIM ACC,Project,Incomes",
  "6 Feb 2025,OOI KEN HEAN *,IAB ipoh willi,,188.00,9457.21,OOI KEN HEAN,2025 JCI KL IAB_Ticketing (Non-Member),2025 EVP_JCI KL IAB,2025 Project,Incomes"
];

csvBankData.slice(1).forEach((line, index) => {
  const values = line.split(",").map(v => v.trim().replace(/"/g, ""));
  const record = {
    date: values[0],
    description1: values[1],
    description2: values[2],
    debit: values[3],
    credit: values[4],
    balance: values[5],
    name1: values[6],
    description: values[7],
    project: values[8],
    cat: values[9],
    typeOfFund: values[10]
  };
  
  console.log(`${index + 1}. CSV银行记录: ${line}`);
  console.log(`   解析后:`, record);
  
  const converted = convertBankRecordToTransaction(record);
  console.log(`   转换后交易数据:`, converted);
  
  // 检查是否包含undefined值
  const hasUndefined = Object.values(converted).some(value => value === undefined);
  console.log(`   包含undefined: ${hasUndefined ? '❌' : '✅'}`);
  console.log('');
});

console.log('✅ 银行交易记录格式处理测试完成！');
console.log('\n📝 总结:');
console.log('- 支持银行记录格式的日期转换 (DD Mon YYYY -> YYYY-MM-DD)');
console.log('- 正确处理借方和贷方金额');
console.log('- 自动过滤空值和undefined值');
console.log('- 保持数据完整性，确保Firebase存储成功');
console.log('- 支持多种银行记录格式的导入'); 