// scripts/initialize-bank-accounts.js
// 初始化银行账户和迁移现有交易数据

const { initializeApp } = require('firebase/app')
const { getFirestore, collection, getDocs, query, where, writeBatch, doc } = require('firebase/firestore')

// Firebase配置
const firebaseConfig = {
  // 这里需要你的Firebase配置
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

// 默认银行账户配置
const DEFAULT_BANK_ACCOUNTS = [
  {
    name: "工商银行主账户",
    bankName: "中国工商银行",
    accountNumber: "6222********1234",
    balance: 0,
    currency: "CNY",
    isActive: true
  },
  {
    name: "建设银行账户",
    bankName: "中国建设银行", 
    accountNumber: "6217********5678",
    balance: 0,
    currency: "CNY",
    isActive: true
  },
  {
    name: "农业银行账户",
    bankName: "中国农业银行",
    accountNumber: "6228********9012", 
    balance: 0,
    currency: "CNY",
    isActive: true
  }
]

/**
 * 检查银行账户名称是否存在
 */
async function checkBankAccountNameExists(name) {
  try {
    const q = query(collection(db, "bankAccounts"), where("name", "==", name))
    const querySnapshot = await getDocs(q)
    return !querySnapshot.empty
  } catch (error) {
    console.error('Error checking bank account name existence:', error)
    throw new Error(`Failed to check bank account name existence: ${error}`)
  }
}

/**
 * 添加银行账户
 */
async function addBankAccount(bankAccountData) {
  try {
    const { addDoc } = require('firebase/firestore')
    const docRef = await addDoc(collection(db, "bankAccounts"), {
      ...bankAccountData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    })
    return docRef.id
  } catch (error) {
    console.error('Error adding bank account:', error)
    throw new Error(`Failed to add bank account: ${error}`)
  }
}

/**
 * 初始化默认银行账户
 */
async function initializeDefaultBankAccounts(createdByUid = "system") {
  try {
    console.log('开始初始化默认银行账户...')
    
    const accountIds = []
    
    for (const defaultAccount of DEFAULT_BANK_ACCOUNTS) {
      // 检查是否已存在同名账户
      const exists = await checkBankAccountNameExists(defaultAccount.name)
      if (!exists) {
        const accountId = await addBankAccount({
          ...defaultAccount,
          createdByUid
        })
        accountIds.push(accountId)
        console.log(`✅ 已创建银行账户: ${defaultAccount.name} (ID: ${accountId})`)
      } else {
        console.log(`⚠️  银行账户已存在: ${defaultAccount.name}`)
      }
    }
    
    console.log(`✅ 初始化完成，创建了 ${accountIds.length} 个银行账户`)
    return accountIds
  } catch (error) {
    console.error('❌ 初始化默认银行账户失败:', error)
    throw error
  }
}

/**
 * 为现有交易分配默认银行账户
 */
async function assignDefaultBankAccountToExistingTransactions(
  defaultBankAccountId,
  defaultBankAccountName
) {
  try {
    console.log('开始为现有交易分配默认银行账户...')
    
    // 获取所有没有银行账户的交易
    const q = query(
      collection(db, "transactions"),
      where("bankAccountId", "==", null)
    )
    const querySnapshot = await getDocs(q)
    
    if (querySnapshot.empty) {
      console.log('✅ 没有需要分配银行账户的交易')
      return 0
    }
    
    console.log(`找到 ${querySnapshot.docs.length} 笔需要分配银行账户的交易`)
    
    const batch = writeBatch(db)
    let updatedCount = 0
    
    querySnapshot.docs.forEach((docSnapshot) => {
      const transactionRef = doc(db, "transactions", docSnapshot.id)
      batch.update(transactionRef, {
        bankAccountId: defaultBankAccountId,
        bankAccountName: defaultBankAccountName
      })
      updatedCount++
    })
    
    await batch.commit()
    console.log(`✅ 成功为 ${updatedCount} 笔交易分配了银行账户`)
    return updatedCount
  } catch (error) {
    console.error('❌ 为现有交易分配银行账户失败:', error)
    throw error
  }
}

/**
 * 主函数
 */
async function main() {
  try {
    console.log('🚀 开始银行账户初始化流程...')
    
    // 1. 初始化默认银行账户
    const accountIds = await initializeDefaultBankAccounts()
    
    if (accountIds.length > 0) {
      // 2. 为现有交易分配第一个银行账户作为默认账户
      const firstAccountId = accountIds[0]
      const firstAccount = DEFAULT_BANK_ACCOUNTS[0]
      
      const updatedCount = await assignDefaultBankAccountToExistingTransactions(
        firstAccountId,
        firstAccount.name
      )
      
      console.log(`✅ 初始化完成！`)
      console.log(`- 创建了 ${accountIds.length} 个银行账户`)
      console.log(`- 为 ${updatedCount} 笔交易分配了默认银行账户`)
    } else {
      console.log('✅ 所有默认银行账户已存在，无需初始化')
    }
    
  } catch (error) {
    console.error('❌ 初始化失败:', error)
    process.exit(1)
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  main()
}

module.exports = {
  initializeDefaultBankAccounts,
  assignDefaultBankAccountToExistingTransactions,
  DEFAULT_BANK_ACCOUNTS
} 