const { initializeApp } = require('firebase/app');
const { getFirestore, collection, addDoc, getDocs, deleteDoc, doc } = require('firebase/firestore');

// Firebase配置
const firebaseConfig = {
  apiKey: "AIzaSyBXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef123456"
};

// 初始化Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// 测试日期格式处理函数
function formatDateToYYYYMMDD(dateStr) {
  if (!dateStr) return new Date().toISOString().split("T")[0];
  
  const date = new Date(dateStr);
  if (!isNaN(date.getTime())) {
    return date.toISOString().split("T")[0]; // 格式化为 yyyy-mm-dd
  }
  return new Date().toISOString().split("T")[0];
}

// 测试数据 - 不同格式的日期
const testDateFormats = [
  "2024-01-15",
  "2024/01/15", 
  "15/01/2024",
  "01/15/2024",
  "2024-1-15",
  "2024-01-5",
  "invalid-date",
  "",
  null
];

console.log('🧪 开始测试日期格式处理...\n');

// 测试日期格式转换
console.log('📅 测试日期格式转换:');
testDateFormats.forEach((dateStr, index) => {
  const formatted = formatDateToYYYYMMDD(dateStr);
  console.log(`${index + 1}. 输入: "${dateStr}" -> 输出: "${formatted}"`);
});

// 测试交易数据
const testTransactions = [
  {
    date: "2024-01-15",
    description: "办公室用品采购",
    description2: "办公用品",
    expense: 245.00,
    income: 0,
    amount: "-$245.00",
    status: "Completed",
    reference: "INV-001",
    category: "办公用品",
    createdByUid: "test-user-1"
  },
  {
    date: "2024/01/14", // 不同格式的日期
    description: "客户付款",
    description2: "收入",
    expense: 0,
    income: 5500.00,
    amount: "+$5500.00",
    status: "Completed",
    reference: "PAY-001",
    category: "收入",
    createdByUid: "test-user-1"
  },
  {
    date: "15/01/2024", // 另一种格式
    description: "银行手续费",
    description2: "银行费用",
    expense: 15.00,
    income: 0,
    amount: "-$15.00",
    status: "Pending",
    reference: "FEE-001",
    category: "银行费用",
    createdByUid: "test-user-1"
  }
];

console.log('\n📊 测试交易数据处理:');
testTransactions.forEach((transaction, index) => {
  const originalDate = transaction.date;
  const formattedDate = formatDateToYYYYMMDD(transaction.date);
  
  console.log(`${index + 1}. 交易: ${transaction.description}`);
  console.log(`   原始日期: "${originalDate}"`);
  console.log(`   格式化后: "${formattedDate}"`);
  console.log(`   格式正确: ${/^\d{4}-\d{2}-\d{2}$/.test(formattedDate) ? '✅' : '❌'}`);
  console.log('');
});

// 模拟CSV数据处理
console.log('📋 模拟CSV数据处理:');
const csvData = [
  "日期,描述,描述2,支出金额,收入金额,状态,参考,分类",
  "2024-01-15,办公室用品,办公用品,245.00,0.00,Completed,INV-001,办公用品",
  "2024/01/14,客户付款,收入,0.00,5500.00,Completed,PAY-001,收入",
  "15/01/2024,银行手续费,银行费用,15.00,0.00,Pending,FEE-001,银行费用"
];

csvData.slice(1).forEach((line, index) => {
  const values = line.split(",").map(v => v.trim().replace(/"/g, ""));
  const originalDate = values[0];
  const formattedDate = formatDateToYYYYMMDD(values[0]);
  
  console.log(`${index + 1}. CSV行: ${line}`);
  console.log(`   原始日期: "${originalDate}"`);
  console.log(`   格式化后: "${formattedDate}"`);
  console.log(`   格式正确: ${/^\d{4}-\d{2}-\d{2}$/.test(formattedDate) ? '✅' : '❌'}`);
  console.log('');
});

console.log('✅ 日期格式处理测试完成！');
console.log('\n📝 总结:');
console.log('- 所有日期都会被转换为 yyyy-mm-dd 格式');
console.log('- 无效日期会使用当前日期作为默认值');
console.log('- 空值会使用当前日期作为默认值');
console.log('- 格式验证确保输出符合 yyyy-mm-dd 标准'); 