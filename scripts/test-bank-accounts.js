// scripts/test-bank-accounts.js
// 测试银行账户功能

const { initializeApp } = require('firebase/app')
const { getFirestore, collection, getDocs, query, where, addDoc, doc, getDoc } = require('firebase/firestore')

// Firebase配置
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
}

// 初始化Firebase
const app = initializeApp(firebaseConfig)
const db = getFirestore(app)

/**
 * 测试银行账户CRUD操作
 */
async function testBankAccountCRUD() {
  console.log('🧪 开始测试银行账户CRUD操作...')
  
  try {
    // 1. 测试添加银行账户
    console.log('1. 测试添加银行账户...')
    const testBankAccount = {
      name: "测试银行账户",
      bankName: "测试银行",
      accountNumber: "1234567890",
      balance: 10000,
      currency: "CNY",
      isActive: true,
      createdByUid: "test-user"
    }
    
    const docRef = await addDoc(collection(db, "bankAccounts"), {
      ...testBankAccount,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    })
    
    console.log(`✅ 成功添加银行账户: ${docRef.id}`)
    
    // 2. 测试获取银行账户
    console.log('2. 测试获取银行账户...')
    const docSnap = await getDoc(doc(db, "bankAccounts", docRef.id))
    if (docSnap.exists()) {
      const bankAccount = { id: docSnap.id, ...docSnap.data() }
      console.log(`✅ 成功获取银行账户: ${bankAccount.name}`)
      console.log(`   - 余额: ${bankAccount.balance}`)
      console.log(`   - 银行: ${bankAccount.bankName}`)
    } else {
      throw new Error('银行账户不存在')
    }
    
    // 3. 测试查询银行账户
    console.log('3. 测试查询银行账户...')
    const q = query(collection(db, "bankAccounts"), where("name", "==", "测试银行账户"))
    const querySnapshot = await getDocs(q)
    console.log(`✅ 查询到 ${querySnapshot.size} 个匹配的银行账户`)
    
    // 4. 测试获取所有银行账户
    console.log('4. 测试获取所有银行账户...')
    const allAccountsQuery = query(collection(db, "bankAccounts"))
    const allAccountsSnapshot = await getDocs(allAccountsQuery)
    console.log(`✅ 总共有 ${allAccountsSnapshot.size} 个银行账户`)
    
    console.log('✅ 银行账户CRUD测试完成')
    return docRef.id
    
  } catch (error) {
    console.error('❌ 银行账户CRUD测试失败:', error)
    throw error
  }
}

/**
 * 测试交易与银行账户关联
 */
async function testTransactionBankAccountAssociation(bankAccountId) {
  console.log('🧪 开始测试交易与银行账户关联...')
  
  try {
    // 1. 测试添加带银行账户的交易
    console.log('1. 测试添加带银行账户的交易...')
    const testTransaction = {
      date: new Date().toISOString().split("T")[0],
      description: "测试交易",
      expense: 100,
      income: 0,
      status: "Completed",
      createdByUid: "test-user",
      bankAccountId: bankAccountId,
      bankAccountName: "测试银行账户",
      sequenceNumber: 1
    }
    
    const transactionRef = await addDoc(collection(db, "transactions"), {
      ...testTransaction,
      createdAt: new Date().toISOString()
    })
    
    console.log(`✅ 成功添加交易: ${transactionRef.id}`)
    
    // 2. 测试按银行账户查询交易
    console.log('2. 测试按银行账户查询交易...')
    const q = query(
      collection(db, "transactions"),
      where("bankAccountId", "==", bankAccountId)
    )
    const querySnapshot = await getDocs(q)
    console.log(`✅ 查询到 ${querySnapshot.size} 笔属于该银行账户的交易`)
    
    // 3. 测试获取所有交易
    console.log('3. 测试获取所有交易...')
    const allTransactionsQuery = query(collection(db, "transactions"))
    const allTransactionsSnapshot = await getDocs(allTransactionsQuery)
    console.log(`✅ 总共有 ${allTransactionsSnapshot.size} 笔交易`)
    
    // 统计有银行账户的交易
    let transactionsWithBankAccount = 0
    allTransactionsSnapshot.docs.forEach(doc => {
      const transaction = doc.data()
      if (transaction.bankAccountId) {
        transactionsWithBankAccount++
      }
    })
    
    console.log(`✅ 其中 ${transactionsWithBankAccount} 笔交易已关联银行账户`)
    
    console.log('✅ 交易与银行账户关联测试完成')
    
  } catch (error) {
    console.error('❌ 交易与银行账户关联测试失败:', error)
    throw error
  }
}

/**
 * 测试银行账户统计
 */
async function testBankAccountStats() {
  console.log('🧪 开始测试银行账户统计...')
  
  try {
    // 获取所有银行账户
    const bankAccountsQuery = query(collection(db, "bankAccounts"))
    const bankAccountsSnapshot = await getDocs(bankAccountsQuery)
    const bankAccounts = bankAccountsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
    
    // 获取所有交易
    const transactionsQuery = query(collection(db, "transactions"))
    const transactionsSnapshot = await getDocs(transactionsQuery)
    const transactions = transactionsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
    
    // 计算统计信息
    const activeBankAccounts = bankAccounts.filter(account => account.isActive).length
    const totalBalance = bankAccounts.reduce((sum, account) => sum + account.balance, 0)
    const transactionsWithBankAccount = transactions.filter(t => t.bankAccountId).length
    
    console.log('📊 银行账户统计信息:')
    console.log(`   - 总银行账户数: ${bankAccounts.length}`)
    console.log(`   - 活跃银行账户数: ${activeBankAccounts}`)
    console.log(`   - 总余额: ${totalBalance}`)
    console.log(`   - 总交易数: ${transactions.length}`)
    console.log(`   - 已关联银行账户的交易数: ${transactionsWithBankAccount}`)
    
    console.log('✅ 银行账户统计测试完成')
    
  } catch (error) {
    console.error('❌ 银行账户统计测试失败:', error)
    throw error
  }
}

/**
 * 主测试函数
 */
async function main() {
  try {
    console.log('🚀 开始银行账户功能测试...')
    
    // 1. 测试银行账户CRUD
    const bankAccountId = await testBankAccountCRUD()
    
    // 2. 测试交易与银行账户关联
    await testTransactionBankAccountAssociation(bankAccountId)
    
    // 3. 测试银行账户统计
    await testBankAccountStats()
    
    console.log('✅ 所有测试完成！')
    
  } catch (error) {
    console.error('❌ 测试失败:', error)
    process.exit(1)
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  main()
}

module.exports = {
  testBankAccountCRUD,
  testTransactionBankAccountAssociation,
  testBankAccountStats
} 