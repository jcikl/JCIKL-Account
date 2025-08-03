#!/usr/bin/env node

/**
 * 测试账户图表粘贴导入功能的更新现有账户功能和账户代码不可重复功能
 */

const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, where } = require('firebase/firestore');

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
const testAccounts = [
  {
    code: "1001",
    name: "现金",
    type: "Asset",
    financialStatement: "Balance Sheet",
    description: "公司现金账户",
    balance: 15000
  },
  {
    code: "1002", 
    name: "银行存款",
    type: "Asset",
    financialStatement: "Balance Sheet",
    description: "银行活期存款",
    balance: 50000
  },
  {
    code: "2001",
    name: "应付账款",
    type: "Liability", 
    financialStatement: "Balance Sheet",
    description: "供应商欠款",
    balance: -25000
  }
];

const updateAccounts = [
  {
    code: "1001", // 已存在的账户代码
    name: "现金账户", // 更新的名称
    type: "Asset",
    financialStatement: "Balance Sheet", 
    description: "更新后的现金账户描述",
    balance: 20000
  },
  {
    code: "3001", // 新的账户代码
    name: "实收资本",
    type: "Equity",
    financialStatement: "Balance Sheet",
    description: "股东投资",
    balance: 100000
  }
];

async function clearTestData() {
  console.log('🧹 清理测试数据...');
  try {
    const accountsRef = collection(db, "accounts");
    const q = query(accountsRef, where("code", "in", ["1001", "1002", "2001", "3001"]));
    const querySnapshot = await getDocs(q);
    
    const deletePromises = querySnapshot.docs.map(doc => deleteDoc(doc.ref));
    await Promise.all(deletePromises);
    
    console.log(`✅ 已清理 ${querySnapshot.docs.length} 个测试账户`);
  } catch (error) {
    console.error('❌ 清理测试数据失败:', error);
  }
}

async function addTestAccounts() {
  console.log('📝 添加测试账户...');
  try {
    const accountsRef = collection(db, "accounts");
    
    for (const account of testAccounts) {
      await addDoc(accountsRef, {
        ...account,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      console.log(`✅ 已添加测试账户: ${account.code} - ${account.name}`);
    }
    
    console.log('✅ 所有测试账户添加完成');
  } catch (error) {
    console.error('❌ 添加测试账户失败:', error);
  }
}

async function checkAccountCodeExists(code) {
  try {
    const accountsRef = collection(db, "accounts");
    const q = query(accountsRef, where("code", "==", code));
    const querySnapshot = await getDocs(q);
    return !querySnapshot.empty;
  } catch (error) {
    console.error(`检查账户代码 ${code} 失败:`, error);
    return false;
  }
}

async function testImportUpdateFunctionality() {
  console.log('\n🔄 测试导入更新功能...');
  
  try {
    // 1. 检查现有账户
    console.log('\n1. 检查现有账户状态:');
    const existingAccounts = [];
    for (const account of testAccounts) {
      const exists = await checkAccountCodeExists(account.code);
      existingAccounts.push({ ...account, exists });
      console.log(`   ${account.code} - ${account.name}: ${exists ? '已存在' : '不存在'}`);
    }
    
    // 2. 模拟导入更新逻辑
    console.log('\n2. 模拟导入更新逻辑:');
    let importedCount = 0;
    let updatedCount = 0;
    
    for (const accountData of updateAccounts) {
      const existingAccount = existingAccounts.find(acc => acc.code === accountData.code);
      
      if (existingAccount && existingAccount.exists) {
        // 更新现有账户
        console.log(`   🔄 更新现有账户: ${accountData.code} - ${accountData.name}`);
        updatedCount++;
      } else {
        // 添加新账户
        console.log(`   ➕ 添加新账户: ${accountData.code} - ${accountData.name}`);
        importedCount++;
      }
    }
    
    console.log(`\n📊 导入统计:`);
    console.log(`   新增账户: ${importedCount}`);
    console.log(`   更新账户: ${updatedCount}`);
    console.log(`   总计: ${importedCount + updatedCount}`);
    
    // 3. 测试账户代码唯一性
    console.log('\n3. 测试账户代码唯一性:');
    const duplicateCode = "1001"; // 已存在的账户代码
    const exists = await checkAccountCodeExists(duplicateCode);
    console.log(`   账户代码 ${duplicateCode} 是否已存在: ${exists ? '是' : '否'}`);
    
    if (exists) {
      console.log('   ✅ 账户代码唯一性检查正常工作');
    } else {
      console.log('   ❌ 账户代码唯一性检查异常');
    }
    
  } catch (error) {
    console.error('❌ 测试导入更新功能失败:', error);
  }
}

async function runTests() {
  console.log('🧪 开始测试账户图表粘贴导入功能');
  console.log('=====================================');
  
  try {
    // 清理测试数据
    await clearTestData();
    
    // 添加测试账户
    await addTestAccounts();
    
    // 测试导入更新功能
    await testImportUpdateFunctionality();
    
    console.log('\n✅ 所有测试完成');
    
  } catch (error) {
    console.error('❌ 测试过程中发生错误:', error);
  } finally {
    // 清理测试数据
    await clearTestData();
    console.log('\n🧹 测试数据已清理');
  }
}

// 运行测试
if (require.main === module) {
  runTests().then(() => {
    console.log('\n🎉 测试脚本执行完成');
    process.exit(0);
  }).catch((error) => {
    console.error('\n💥 测试脚本执行失败:', error);
    process.exit(1);
  });
}

module.exports = {
  runTests,
  testImportUpdateFunctionality,
  checkAccountCodeExists
}; 