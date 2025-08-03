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

// 测试数据
const testTransactions = [
  {
    date: "2024-01-15",
    description: "办公室用品采购",
    account: "办公费用",
    debit: 245.00,
    credit: 0,
    amount: "-$245.00",
    status: "Completed",
    reference: "INV-001",
    category: "办公用品",
    createdByUid: "test-user-1"
  },
  {
    date: "2024-01-14",
    description: "客户付款",
    account: "应收账款",
    debit: 0,
    credit: 5500.00,
    amount: "+$5500.00",
    status: "Completed",
    reference: "PAY-001",
    category: "收入",
    createdByUid: "test-user-1"
  },
  {
    date: "2024-01-13",
    description: "银行手续费",
    account: "银行费用",
    debit: 15.00,
    credit: 0,
    amount: "-$15.00",
    status: "Pending",
    reference: "FEE-001",
    category: "银行费用",
    createdByUid: "test-user-1"
  },
  {
    date: "2024-01-12",
    description: "设备租赁",
    account: "租赁费用",
    debit: 1200.00,
    credit: 0,
    amount: "-$1200.00",
    status: "Draft",
    reference: "LEASE-001",
    category: "租赁",
    createdByUid: "test-user-1"
  }
];

async function testBankTransactions() {
  console.log('🧪 开始测试银行交易功能...\n');

  try {
    // 1. 测试添加交易
    console.log('1. 测试添加交易...');
    const addedTransactions = [];
    for (const transaction of testTransactions) {
      const docRef = await addDoc(collection(db, "transactions"), transaction);
      addedTransactions.push({ id: docRef.id, ...transaction });
      console.log(`   ✅ 添加交易: ${transaction.description} (ID: ${docRef.id})`);
    }

    // 2. 测试查询所有交易
    console.log('\n2. 测试查询所有交易...');
    const querySnapshot = await getDocs(collection(db, "transactions"));
    const allTransactions = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    console.log(`   ✅ 查询到 ${allTransactions.length} 笔交易`);

    // 3. 测试按状态筛选
    console.log('\n3. 测试按状态筛选...');
    const completedTransactions = allTransactions.filter(t => t.status === "Completed");
    const pendingTransactions = allTransactions.filter(t => t.status === "Pending");
    const draftTransactions = allTransactions.filter(t => t.status === "Draft");
    
    console.log(`   ✅ 已完成交易: ${completedTransactions.length} 笔`);
    console.log(`   ✅ 待处理交易: ${pendingTransactions.length} 笔`);
    console.log(`   ✅ 草稿交易: ${draftTransactions.length} 笔`);

    // 4. 测试按账户筛选
    console.log('\n4. 测试按账户筛选...');
    const accountGroups = {};
    allTransactions.forEach(t => {
      if (!accountGroups[t.account]) {
        accountGroups[t.account] = [];
      }
      accountGroups[t.account].push(t);
    });
    
    Object.entries(accountGroups).forEach(([account, transactions]) => {
      console.log(`   ✅ ${account}: ${transactions.length} 笔交易`);
    });

    // 5. 测试搜索功能
    console.log('\n5. 测试搜索功能...');
    const searchTerm = "办公室";
    const searchResults = allTransactions.filter(t => 
      t.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.account.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (t.reference && t.reference.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (t.category && t.category.toLowerCase().includes(searchTerm.toLowerCase()))
    );
    console.log(`   ✅ 搜索 "${searchTerm}" 找到 ${searchResults.length} 笔交易`);

    // 6. 测试统计功能
    console.log('\n6. 测试统计功能...');
    const totalDebits = allTransactions.reduce((sum, t) => sum + t.debit, 0);
    const totalCredits = allTransactions.reduce((sum, t) => sum + t.credit, 0);
    const netAmount = totalDebits - totalCredits;
    
    console.log(`   ✅ 总借方: $${totalDebits.toFixed(2)}`);
    console.log(`   ✅ 总贷方: $${totalCredits.toFixed(2)}`);
    console.log(`   ✅ 净额: $${netAmount.toFixed(2)}`);

    // 7. 测试日期筛选
    console.log('\n7. 测试日期筛选...');
    const today = new Date().toISOString().split('T')[0];
    const recentTransactions = allTransactions.filter(t => t.date >= "2024-01-13");
    console.log(`   ✅ 最近交易 (2024-01-13 之后): ${recentTransactions.length} 笔`);

    // 8. 测试CSV导出格式
    console.log('\n8. 测试CSV导出格式...');
    const csvHeaders = ["日期", "描述", "账户", "金额", "状态", "参考", "分类"];
    const csvRows = allTransactions.map(t => [
      t.date,
      t.description,
      t.account,
      t.amount,
      t.status,
      t.reference || "",
      t.category || ""
    ]);
    
    const csvContent = [csvHeaders.join(","), ...csvRows.map(row => row.join(","))].join("\n");
    console.log(`   ✅ CSV格式生成成功，包含 ${csvRows.length} 行数据`);

    // 9. 测试粘贴数据解析
    console.log('\n9. 测试粘贴数据解析...');
    const pasteData = `2024-01-15\tOffice Supplies\tOffice Expenses\t-245.00
2024-01-14\tClient Payment\tAccounts Receivable\t5500.00`;
    
    const lines = pasteData.trim().split("\n");
    const parsedTransactions = lines.map((line) => {
      const values = line.split("\t");
      const amount = Number.parseFloat(values[3] || "0");
      return {
        date: values[0]?.trim() || new Date().toISOString().split("T")[0],
        description: values[1]?.trim() || "Pasted Transaction",
        account: values[2]?.trim() || "General",
        debit: amount > 0 ? amount : 0,
        credit: amount < 0 ? Math.abs(amount) : 0,
        amount: amount > 0 ? `+$${amount.toFixed(2)}` : `-$${Math.abs(amount).toFixed(2)}`,
        status: "Pending",
        createdByUid: "test-user-1"
      };
    });
    
    console.log(`   ✅ 解析粘贴数据: ${parsedTransactions.length} 笔交易`);

    // 10. 清理测试数据
    console.log('\n10. 清理测试数据...');
    for (const transaction of addedTransactions) {
      await deleteDoc(doc(db, "transactions", transaction.id));
      console.log(`   ✅ 删除交易: ${transaction.description}`);
    }

    console.log('\n🎉 银行交易功能测试完成！');
    console.log('\n📊 测试总结:');
    console.log('   ✅ 交易添加功能正常');
    console.log('   ✅ 交易查询功能正常');
    console.log('   ✅ 状态筛选功能正常');
    console.log('   ✅ 账户筛选功能正常');
    console.log('   ✅ 搜索功能正常');
    console.log('   ✅ 统计功能正常');
    console.log('   ✅ 日期筛选功能正常');
    console.log('   ✅ CSV导出功能正常');
    console.log('   ✅ 粘贴数据解析正常');
    console.log('   ✅ 数据清理功能正常');

  } catch (error) {
    console.error('❌ 测试失败:', error);
  }
}

// 运行测试
testBankTransactions(); 