const { initializeApp } = require('firebase/app')
const { getFirestore, collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, where } = require('firebase/firestore')

// Firebase配置
const firebaseConfig = {
  apiKey: "AIzaSyBvOkJz8qXqXqXqXqXqXqXqXqXqXqXqXqXq",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef123456"
}

// 初始化Firebase
const app = initializeApp(firebaseConfig)
const db = getFirestore(app)

/**
 * 测试第五阶段完整功能
 */
async function testPhase5CompleteFunctionality() {
  console.log('=== 第五阶段完整功能测试 ===')
  
  try {
    // 1. 测试银行账户数据完整性
    console.log('\n1. 测试银行账户数据完整性...')
    const bankAccountsSnapshot = await getDocs(collection(db, 'bankAccounts'))
    const bankAccounts = []
    bankAccountsSnapshot.forEach(doc => {
      bankAccounts.push({ id: doc.id, ...doc.data() })
    })
    
    console.log(`找到 ${bankAccounts.length} 个银行账户:`)
    bankAccounts.forEach(account => {
      console.log(`  - ${account.name} (${account.isActive ? '活跃' : '停用'}) - 余额: ¥${account.balance}`)
    })

    // 2. 测试交易数据完整性
    console.log('\n2. 测试交易数据完整性...')
    const transactionsSnapshot = await getDocs(collection(db, 'transactions'))
    const transactions = []
    transactionsSnapshot.forEach(doc => {
      transactions.push({ id: doc.id, ...doc.data() })
    })
    
    console.log(`找到 ${transactions.length} 笔交易:`)
    
    // 按银行账户分组统计
    const transactionsByBankAccount = {}
    transactions.forEach(transaction => {
      const bankAccountId = transaction.bankAccountId || '未分配'
      if (!transactionsByBankAccount[bankAccountId]) {
        transactionsByBankAccount[bankAccountId] = []
      }
      transactionsByBankAccount[bankAccountId].push(transaction)
    })
    
    Object.keys(transactionsByBankAccount).forEach(bankAccountId => {
      const accountTransactions = transactionsByBankAccount[bankAccountId]
      const bankAccount = bankAccounts.find(acc => acc.id === bankAccountId)
      const accountName = bankAccount ? bankAccount.name : '未分配账户'
      
      console.log(`  ${accountName}: ${accountTransactions.length} 笔交易`)
      
      // 计算统计信息
      const totalIncome = accountTransactions.reduce((sum, t) => sum + parseFloat(t.income?.toString() || "0"), 0)
      const totalExpense = accountTransactions.reduce((sum, t) => sum + parseFloat(t.expense?.toString() || "0"), 0)
      const netAmount = totalIncome - totalExpense
      
      console.log(`    总收入: ¥${totalIncome.toFixed(2)}`)
      console.log(`    总支出: ¥${totalExpense.toFixed(2)}`)
      console.log(`    净额: ¥${netAmount.toFixed(2)}`)
      
      // 状态统计
      const statusCount = {}
      accountTransactions.forEach(t => {
        statusCount[t.status] = (statusCount[t.status] || 0) + 1
      })
      console.log(`    状态分布:`, statusCount)
    })

    // 3. 测试搜索和筛选功能的数据准备
    console.log('\n3. 测试搜索和筛选功能的数据准备...')
    
    // 检查是否有足够的测试数据
    const testTransactions = transactions.slice(0, 5)
    console.log('前5笔交易用于测试搜索和筛选:')
    testTransactions.forEach((transaction, index) => {
      console.log(`  ${index + 1}. ${transaction.description} - ¥${transaction.income || transaction.expense} - ${transaction.status}`)
    })

    // 4. 测试表单验证的数据结构
    console.log('\n4. 测试表单验证的数据结构...')
    const sampleTransaction = transactions[0]
    if (sampleTransaction) {
      console.log('示例交易数据结构:')
      console.log(`  日期: ${sampleTransaction.date}`)
      console.log(`  描述: ${sampleTransaction.description}`)
      console.log(`  描述2: ${sampleTransaction.description2 || '无'}`)
      console.log(`  支出: ${sampleTransaction.expense || '无'}`)
      console.log(`  收入: ${sampleTransaction.income || '无'}`)
      console.log(`  状态: ${sampleTransaction.status}`)
      console.log(`  付款人: ${sampleTransaction.payer || '无'}`)
      console.log(`  项目: ${sampleTransaction.projectName || '无'}`)
      console.log(`  分类: ${sampleTransaction.category || '无'}`)
      console.log(`  银行账户: ${sampleTransaction.bankAccountName || '未分配'}`)
    }

    // 5. 测试权限控制的数据准备
    console.log('\n5. 测试权限控制的数据准备...')
    const activeBankAccounts = bankAccounts.filter(acc => acc.isActive)
    const inactiveBankAccounts = bankAccounts.filter(acc => !acc.isActive)
    
    console.log(`活跃银行账户: ${activeBankAccounts.length} 个`)
    console.log(`停用银行账户: ${inactiveBankAccounts.length} 个`)
    
    if (activeBankAccounts.length === 0) {
      console.log('⚠️  警告: 没有活跃的银行账户，可能影响功能测试')
    }

    // 6. 测试CRUD操作的数据准备
    console.log('\n6. 测试CRUD操作的数据准备...')
    
    // 检查是否有可编辑的交易
    const editableTransactions = transactions.filter(t => t.status !== 'Deleted')
    console.log(`可编辑交易: ${editableTransactions.length} 笔`)
    
    if (editableTransactions.length === 0) {
      console.log('⚠️  警告: 没有可编辑的交易，可能影响编辑功能测试')
    }

    // 7. 测试统计功能的数据验证
    console.log('\n7. 测试统计功能的数据验证...')
    
    bankAccounts.forEach(account => {
      const accountTransactions = transactions.filter(t => t.bankAccountId === account.id)
      const totalIncome = accountTransactions.reduce((sum, t) => sum + parseFloat(t.income?.toString() || "0"), 0)
      const totalExpense = accountTransactions.reduce((sum, t) => sum + parseFloat(t.expense?.toString() || "0"), 0)
      const netAmount = totalIncome - totalExpense
      const calculatedBalance = account.balance + netAmount
      
      console.log(`${account.name}:`)
      console.log(`  原始余额: ¥${account.balance}`)
      console.log(`  交易净额: ¥${netAmount.toFixed(2)}`)
      console.log(`  计算余额: ¥${calculatedBalance.toFixed(2)}`)
      console.log(`  交易数量: ${accountTransactions.length}`)
    })

    // 8. 测试数据完整性检查
    console.log('\n8. 测试数据完整性检查...')
    
    let dataIssues = 0
    
    // 检查交易数据完整性
    transactions.forEach(transaction => {
      if (!transaction.date) {
        console.log(`⚠️  交易 ${transaction.id} 缺少日期`)
        dataIssues++
      }
      if (!transaction.description) {
        console.log(`⚠️  交易 ${transaction.id} 缺少描述`)
        dataIssues++
      }
      if (!transaction.expense && !transaction.income) {
        console.log(`⚠️  交易 ${transaction.id} 缺少金额信息`)
        dataIssues++
      }
      if (!transaction.bankAccountId) {
        console.log(`⚠️  交易 ${transaction.id} 未分配银行账户`)
        dataIssues++
      }
    })
    
    if (dataIssues === 0) {
      console.log('✅ 数据完整性检查通过')
    } else {
      console.log(`⚠️  发现 ${dataIssues} 个数据完整性问题`)
    }

    console.log('\n=== 第五阶段测试完成 ===')
    console.log('\n测试结果总结:')
    console.log(`- 银行账户: ${bankAccounts.length} 个`)
    console.log(`- 交易记录: ${transactions.length} 笔`)
    console.log(`- 活跃账户: ${activeBankAccounts.length} 个`)
    console.log(`- 可编辑交易: ${editableTransactions.length} 笔`)
    console.log(`- 数据问题: ${dataIssues} 个`)
    
    if (bankAccounts.length > 0 && transactions.length > 0) {
      console.log('\n✅ 第五阶段功能测试准备就绪')
      console.log('建议测试项目:')
      console.log('1. 银行账户Tab切换功能')
      console.log('2. 交易CRUD操作')
      console.log('3. 搜索和筛选功能')
      console.log('4. 表单验证功能')
      console.log('5. 权限控制功能')
      console.log('6. 统计信息显示')
    } else {
      console.log('\n⚠️  数据不足，建议先添加测试数据')
    }

  } catch (error) {
    console.error('测试过程中发生错误:', error)
  }
}

// 运行测试
testPhase5CompleteFunctionality() 