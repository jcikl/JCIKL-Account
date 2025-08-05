const { initializeApp } = require('firebase/app')
const { getFirestore, collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, where } = require('firebase/firestore')

// Firebase配置 (Placeholder, user needs to replace with actual config)
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
 * 测试第六阶段高级功能
 */
async function testPhase6AdvancedFunctionality() {
  console.log('=== 第六阶段高级功能测试 ===')

  try {
    // 1. 测试银行账户数据
    console.log('\n1. 测试银行账户数据...')
    const bankAccountsSnapshot = await getDocs(collection(db, 'bankAccounts'))
    const bankAccounts = []
    bankAccountsSnapshot.forEach(doc => {
      bankAccounts.push({ id: doc.id, ...doc.data() })
    })

    console.log(`找到 ${bankAccounts.length} 个银行账户:`)
    bankAccounts.forEach(account => {
      console.log(`  - ${account.name} (${account.isActive ? '活跃' : '停用'}) - 余额: ¥${account.balance}`)
    })

    // 2. 测试交易数据
    console.log('\n2. 测试交易数据...')
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

    // 3. 测试分页功能的数据准备
    console.log('\n3. 测试分页功能的数据准备...')
    
    const pageSizes = [10, 20, 50, 100]
    pageSizes.forEach(pageSize => {
      const totalPages = Math.ceil(transactions.length / pageSize)
      console.log(`  每页 ${pageSize} 条记录: 共 ${totalPages} 页`)
    })

    // 4. 测试排序功能的数据准备
    console.log('\n4. 测试排序功能的数据准备...')
    
    // 检查日期字段
    const hasDateField = transactions.every(t => t.date)
    console.log(`  日期字段完整性: ${hasDateField ? '✅' : '❌'}`)
    
    // 检查描述字段
    const hasDescriptionField = transactions.every(t => t.description)
    console.log(`  描述字段完整性: ${hasDescriptionField ? '✅' : '❌'}`)
    
    // 检查状态字段
    const hasStatusField = transactions.every(t => t.status)
    console.log(`  状态字段完整性: ${hasStatusField ? '✅' : '❌'}`)

    // 5. 测试批量操作的数据准备
    console.log('\n5. 测试批量操作的数据准备...')
    
    const deletableTransactions = transactions.filter(t => t.status !== 'Deleted')
    console.log(`  可删除交易: ${deletableTransactions.length} 笔`)
    
    if (deletableTransactions.length > 0) {
      console.log('  示例交易用于批量操作测试:')
      deletableTransactions.slice(0, 3).forEach((transaction, index) => {
        console.log(`    ${index + 1}. ${transaction.description} - ¥${transaction.income || transaction.expense} - ${transaction.status}`)
      })
    }

    // 6. 测试高级筛选的数据准备
    console.log('\n6. 测试高级筛选的数据准备...')
    
    // 日期范围
    const dates = transactions.map(t => {
      if (typeof t.date === "string") {
        return new Date(t.date)
      } else {
        return new Date(t.date.seconds * 1000)
      }
    }).sort()
    
    if (dates.length > 0) {
      console.log(`  日期范围: ${dates[0].toLocaleDateString()} - ${dates[dates.length - 1].toLocaleDateString()}`)
    }
    
    // 金额范围
    const amounts = transactions.map(t => (t.income || 0) - (t.expense || 0)).sort((a, b) => a - b)
    if (amounts.length > 0) {
      console.log(`  金额范围: ¥${amounts[0].toFixed(2)} - ¥${amounts[amounts.length - 1].toFixed(2)}`)
    }
    
    // 状态分布
    const statusDistribution = {}
    transactions.forEach(t => {
      statusDistribution[t.status] = (statusDistribution[t.status] || 0) + 1
    })
    console.log(`  状态分布:`, statusDistribution)

    // 7. 测试导出功能的数据准备
    console.log('\n7. 测试导出功能的数据准备...')
    
    const exportableTransactions = transactions.slice(0, 10) // 取前10笔用于测试
    console.log(`  可导出交易: ${exportableTransactions.length} 笔`)
    
    if (exportableTransactions.length > 0) {
      console.log('  导出数据示例:')
      exportableTransactions.slice(0, 3).forEach((transaction, index) => {
        console.log(`    ${index + 1}. ${transaction.description} - ¥${transaction.income || transaction.expense} - ${transaction.status}`)
      })
    }

    // 8. 测试数据可视化功能的数据准备
    console.log('\n8. 测试数据可视化功能的数据准备...')
    
    // 月度数据统计
    const monthlyData = {}
    transactions.forEach(transaction => {
      const date = typeof transaction.date === "string" 
        ? new Date(transaction.date) 
        : new Date(transaction.date.seconds * 1000)
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = { income: 0, expense: 0, count: 0 }
      }
      
      monthlyData[monthKey].income += parseFloat(transaction.income?.toString() || "0")
      monthlyData[monthKey].expense += parseFloat(transaction.expense?.toString() || "0")
      monthlyData[monthKey].count += 1
    })
    
    console.log('  月度数据统计:')
    Object.keys(monthlyData).sort().forEach(month => {
      const data = monthlyData[month]
      console.log(`    ${month}: ${data.count} 笔交易, 收入 ¥${data.income.toFixed(2)}, 支出 ¥${data.expense.toFixed(2)}`)
    })

    // 9. 测试数据完整性检查
    console.log('\n9. 测试数据完整性检查...')
    
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

    console.log('\n=== 第六阶段测试完成 ===')
    console.log('\n测试结果总结:')
    console.log(`- 银行账户: ${bankAccounts.length} 个`)
    console.log(`- 交易记录: ${transactions.length} 笔`)
    console.log(`- 可删除交易: ${deletableTransactions.length} 笔`)
    console.log(`- 可导出交易: ${exportableTransactions.length} 笔`)
    console.log(`- 数据问题: ${dataIssues} 个`)
    console.log(`- 月度数据: ${Object.keys(monthlyData).length} 个月`)

    if (bankAccounts.length > 0 && transactions.length > 0) {
      console.log('\n✅ 第六阶段功能测试准备就绪')
      console.log('建议测试项目:')
      console.log('1. 银行账户选择功能')
      console.log('2. 高级搜索和筛选功能')
      console.log('3. 分页功能（切换页面、改变每页数量）')
      console.log('4. 排序功能（点击表头排序）')
      console.log('5. 批量选择功能（单个选择、全选）')
      console.log('6. 批量删除功能')
      console.log('7. 导出功能')
      console.log('8. 数据可视化开关')
    } else {
      console.log('\n⚠️  数据不足，建议先添加测试数据')
    }

  } catch (error) {
    console.error('测试过程中发生错误:', error)
  }
}

// 运行测试
testPhase6AdvancedFunctionality() 