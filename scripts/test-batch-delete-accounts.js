// scripts/test-batch-delete-accounts.js
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, addDoc, getDocs, deleteDoc, doc, writeBatch } = require('firebase/firestore');

// Firebase配置
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

// 初始化Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// 测试数据
const testAccounts = [
  {
    code: "TEST001",
    name: "测试账户1",
    type: "Asset",
    balance: 1000,
    financialStatement: "Balance Sheet",
    description: "批量删除测试账户1",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    code: "TEST002",
    name: "测试账户2",
    type: "Liability",
    balance: -500,
    financialStatement: "Balance Sheet",
    description: "批量删除测试账户2",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    code: "TEST003",
    name: "测试账户3",
    type: "Revenue",
    balance: 2000,
    financialStatement: "Income Statement",
    description: "批量删除测试账户3",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    code: "TEST004",
    name: "测试账户4",
    type: "Expense",
    balance: -800,
    financialStatement: "Income Statement",
    description: "批量删除测试账户4",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    code: "TEST005",
    name: "测试账户5",
    type: "Equity",
    balance: 1500,
    financialStatement: "Balance Sheet",
    description: "批量删除测试账户5",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

// 批量删除函数
async function deleteAccounts(accountIds) {
  try {
    console.log('开始批量删除账户:', accountIds.length);
    
    if (accountIds.length === 0) {
      console.log('没有账户需要删除');
      return;
    }
    
    const batch = writeBatch(db);
    
    accountIds.forEach(accountId => {
      const docRef = doc(db, "accounts", accountId);
      batch.delete(docRef);
    });
    
    await batch.commit();
    console.log('批量删除成功');
  } catch (error) {
    console.error('批量删除失败:', error);
    throw error;
  }
}

// 主测试函数
async function testBatchDelete() {
  try {
    console.log('=== 开始批量删除账户测试 ===\n');
    
    // 1. 创建测试账户
    console.log('1. 创建测试账户...');
    const createdAccountIds = [];
    
    for (const accountData of testAccounts) {
      const docRef = await addDoc(collection(db, "accounts"), accountData);
      createdAccountIds.push(docRef.id);
      console.log(`   创建账户: ${accountData.code} - ${accountData.name} (ID: ${docRef.id})`);
    }
    
    console.log(`   成功创建 ${createdAccountIds.length} 个测试账户\n`);
    
    // 2. 验证账户已创建
    console.log('2. 验证账户已创建...');
    const querySnapshot = await getDocs(collection(db, "accounts"));
    const existingAccounts = querySnapshot.docs.filter(doc => 
      createdAccountIds.includes(doc.id)
    );
    console.log(`   找到 ${existingAccounts.length} 个测试账户\n`);
    
    // 3. 执行批量删除
    console.log('3. 执行批量删除...');
    await deleteAccounts(createdAccountIds);
    console.log('   批量删除完成\n');
    
    // 4. 验证删除结果
    console.log('4. 验证删除结果...');
    const finalSnapshot = await getDocs(collection(db, "accounts"));
    const remainingAccounts = finalSnapshot.docs.filter(doc => 
      createdAccountIds.includes(doc.id)
    );
    
    if (remainingAccounts.length === 0) {
      console.log('   ✅ 所有测试账户已成功删除');
    } else {
      console.log(`   ❌ 仍有 ${remainingAccounts.length} 个测试账户未被删除`);
      remainingAccounts.forEach(doc => {
        console.log(`      - ${doc.id}: ${doc.data().code} - ${doc.data().name}`);
      });
    }
    
    console.log('\n=== 批量删除测试完成 ===');
    
  } catch (error) {
    console.error('测试失败:', error);
    process.exit(1);
  }
}

// 清理函数 - 删除所有测试账户
async function cleanupTestAccounts() {
  try {
    console.log('清理测试账户...');
    
    const querySnapshot = await getDocs(collection(db, "accounts"));
    const testAccountDocs = querySnapshot.docs.filter(doc => {
      const data = doc.data();
      return data.code && data.code.startsWith('TEST');
    });
    
    if (testAccountDocs.length > 0) {
      const batch = writeBatch(db);
      testAccountDocs.forEach(doc => {
        batch.delete(doc.ref);
      });
      await batch.commit();
      console.log(`清理了 ${testAccountDocs.length} 个测试账户`);
    } else {
      console.log('没有找到测试账户需要清理');
    }
  } catch (error) {
    console.error('清理失败:', error);
  }
}

// 命令行参数处理
const args = process.argv.slice(2);
const command = args[0];

switch (command) {
  case 'test':
    testBatchDelete();
    break;
  case 'cleanup':
    cleanupTestAccounts();
    break;
  default:
    console.log('使用方法:');
    console.log('  node test-batch-delete-accounts.js test     - 运行批量删除测试');
    console.log('  node test-batch-delete-accounts.js cleanup  - 清理所有测试账户');
    break;
} 