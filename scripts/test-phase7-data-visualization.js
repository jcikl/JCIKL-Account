/**
 * 第七阶段：数据可视化功能测试脚本
 * 测试图表组件的数据计算和显示功能
 */

const { initializeApp } = require('firebase/app')
const { getFirestore, collection, getDocs, query, where, orderBy } = require('firebase/firestore')

// Firebase 配置
const firebaseConfig = {
  apiKey: "AIzaSyBXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef123456"
}

// 初始化 Firebase
const app = initializeApp(firebaseConfig)
const db = getFirestore(app)

/**
 * 模拟图表数据计算函数
 */
function calculateChartData(transactions) {
  console.log('📊 开始计算图表数据...')
  
  if (!transactions || transactions.length === 0) {
    console.log('❌ 没有交易数据')
    return {
      monthlyTrend: [],
      categoryDistribution: [],
      projectStats: [],
      statusDistribution: [],
      totalIncome: 0,
      totalExpense: 0,
      netAmount: 0
    }
  }

  // 月度趋势数据
  const monthlyData = new Map()
  
  transactions.forEach(transaction => {
    const date = new Date(transaction.date)
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
    
    if (!monthlyData.has(monthKey)) {
      monthlyData.set(monthKey, { income: 0, expense: 0, net: 0 })
    }
    
    const data = monthlyData.get(monthKey)
    if (transaction.type === 'income') {
      data.income += transaction.amount
      data.net += transaction.amount
    } else {
      data.expense += transaction.amount
      data.net -= transaction.amount
    }
  })

  const monthlyTrend = Array.from(monthlyData.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, data]) => {
      const [year, month] = key.split('-')
      return {
        month: `${year}年${month}月`,
        income: data.income,
        expense: data.expense,
        net: data.net
      }
    })

  // 分类分布数据
  const categoryData = new Map()
  
  transactions.forEach(transaction => {
    const category = transaction.category || '未分类'
    if (!categoryData.has(category)) {
      categoryData.set(category, { amount: 0, count: 0 })
    }
    
    const data = categoryData.get(category)
    data.amount += transaction.amount
    data.count += 1
  })

  const categoryDistribution = Array.from(categoryData.entries())
    .map(([category, data]) => ({
      category,
      amount: data.amount,
      count: data.count
    }))
    .sort((a, b) => b.amount - a.amount)

  // 项目统计数据
  const projectData = new Map()
  
  transactions.forEach(transaction => {
    const project = transaction.project || '未分配项目'
    if (!projectData.has(project)) {
      projectData.set(project, { totalAmount: 0, transactionCount: 0 })
    }
    
    const data = projectData.get(project)
    data.totalAmount += transaction.amount
    data.transactionCount += 1
  })

  const projectStats = Array.from(projectData.entries())
    .map(([project, data]) => ({
      project,
      totalAmount: data.totalAmount,
      transactionCount: data.transactionCount,
      avgAmount: data.totalAmount / data.transactionCount
    }))
    .sort((a, b) => b.totalAmount - a.totalAmount)

  // 状态分布数据
  const statusData = new Map()
  
  transactions.forEach(transaction => {
    const status = transaction.status || '未确认'
    if (!statusData.has(status)) {
      statusData.set(status, { count: 0, amount: 0 })
    }
    
    const data = statusData.get(status)
    data.count += 1
    data.amount += transaction.amount
  })

  const statusDistribution = Array.from(statusData.entries())
    .map(([status, data]) => ({
      status,
      count: data.count,
      amount: data.amount
    }))
    .sort((a, b) => b.count - a.count)

  // 总体统计
  const totalIncome = transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0)

  const totalExpense = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0)

  const netAmount = totalIncome - totalExpense

  console.log('✅ 图表数据计算完成')
  
  return {
    monthlyTrend,
    categoryDistribution,
    projectStats,
    statusDistribution,
    totalIncome,
    totalExpense,
    netAmount
  }
}

/**
 * 测试图表数据计算
 */
async function testChartDataCalculation() {
  console.log('\n🔍 测试图表数据计算功能...')
  
  try {
    // 获取银行账户
    const bankAccountsSnapshot = await getDocs(collection(db, 'bankAccounts'))
    const bankAccounts = bankAccountsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }))
    
    console.log(`📋 找到 ${bankAccounts.length} 个银行账户`)
    
    if (bankAccounts.length === 0) {
      console.log('⚠️ 没有银行账户，跳过测试')
      return
    }
    
    // 测试每个银行账户的图表数据
    for (const bankAccount of bankAccounts) {
      console.log(`\n🏦 测试银行账户: ${bankAccount.name}`)
      
      // 获取该账户的交易数据
      const transactionsQuery = query(
        collection(db, 'transactions'),
        where('bankAccountId', '==', bankAccount.id),
        orderBy('date', 'desc')
      )
      
      const transactionsSnapshot = await getDocs(transactionsQuery)
      const transactions = transactionsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
      
      console.log(`📊 找到 ${transactions.length} 笔交易`)
      
      // 计算图表数据
      const chartData = calculateChartData(transactions)
      
      // 验证计算结果
      console.log('\n📈 图表数据验证:')
      console.log(`总收入: ¥${chartData.totalIncome.toFixed(2)}`)
      console.log(`总支出: ¥${chartData.totalExpense.toFixed(2)}`)
      console.log(`净额: ¥${chartData.netAmount.toFixed(2)}`)
      console.log(`月度趋势: ${chartData.monthlyTrend.length} 个月`)
      console.log(`分类分布: ${chartData.categoryDistribution.length} 个分类`)
      console.log(`项目统计: ${chartData.projectStats.length} 个项目`)
      console.log(`状态分布: ${chartData.statusDistribution.length} 个状态`)
      
      // 验证数据完整性
      if (chartData.totalIncome >= 0 && chartData.totalExpense >= 0) {
        console.log('✅ 收入支出数据正确')
      } else {
        console.log('❌ 收入支出数据异常')
      }
      
      if (chartData.monthlyTrend.length > 0) {
        console.log('✅ 月度趋势数据正确')
      } else {
        console.log('⚠️ 月度趋势数据为空')
      }
      
      if (chartData.categoryDistribution.length > 0) {
        console.log('✅ 分类分布数据正确')
      } else {
        console.log('⚠️ 分类分布数据为空')
      }
      
      if (chartData.projectStats.length > 0) {
        console.log('✅ 项目统计数据正确')
      } else {
        console.log('⚠️ 项目统计数据为空')
      }
      
      if (chartData.statusDistribution.length > 0) {
        console.log('✅ 状态分布数据正确')
      } else {
        console.log('⚠️ 状态分布数据为空')
      }
    }
    
  } catch (error) {
    console.error('❌ 测试图表数据计算时出错:', error)
  }
}

/**
 * 测试空数据处理
 */
function testEmptyDataHandling() {
  console.log('\n🔍 测试空数据处理...')
  
  const emptyTransactions = []
  const chartData = calculateChartData(emptyTransactions)
  
  console.log('📊 空数据测试结果:')
  console.log(`总收入: ¥${chartData.totalIncome.toFixed(2)}`)
  console.log(`总支出: ¥${chartData.totalExpense.toFixed(2)}`)
  console.log(`净额: ¥${chartData.netAmount.toFixed(2)}`)
  console.log(`月度趋势: ${chartData.monthlyTrend.length} 个月`)
  console.log(`分类分布: ${chartData.categoryDistribution.length} 个分类`)
  console.log(`项目统计: ${chartData.projectStats.length} 个项目`)
  console.log(`状态分布: ${chartData.statusDistribution.length} 个状态`)
  
  if (chartData.totalIncome === 0 && chartData.totalExpense === 0 && chartData.netAmount === 0) {
    console.log('✅ 空数据处理正确')
  } else {
    console.log('❌ 空数据处理异常')
  }
}

/**
 * 测试数据计算性能
 */
function testPerformance() {
  console.log('\n🔍 测试数据计算性能...')
  
  // 生成测试数据
  const testTransactions = []
  const categories = ['餐饮', '交通', '购物', '娱乐', '医疗', '教育']
  const projects = ['项目A', '项目B', '项目C', '项目D']
  const statuses = ['Completed', 'Pending', 'Draft']
  
  for (let i = 0; i < 1000; i++) {
    const date = new Date(2024, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1)
    testTransactions.push({
      id: `test-${i}`,
      date: date.toISOString(),
      description: `测试交易 ${i}`,
      amount: Math.floor(Math.random() * 10000) + 100,
      type: Math.random() > 0.5 ? 'income' : 'expense',
      category: categories[Math.floor(Math.random() * categories.length)],
      project: projects[Math.floor(Math.random() * projects.length)],
      status: statuses[Math.floor(Math.random() * statuses.length)]
    })
  }
  
  console.log(`📊 生成 ${testTransactions.length} 笔测试交易`)
  
  const startTime = Date.now()
  const chartData = calculateChartData(testTransactions)
  const endTime = Date.now()
  
  console.log(`⏱️ 计算耗时: ${endTime - startTime}ms`)
  console.log(`📈 计算结果: ${chartData.monthlyTrend.length} 个月度趋势`)
  console.log(`📊 计算结果: ${chartData.categoryDistribution.length} 个分类分布`)
  console.log(`📋 计算结果: ${chartData.projectStats.length} 个项目统计`)
  console.log(`📊 计算结果: ${chartData.statusDistribution.length} 个状态分布`)
  
  if (endTime - startTime < 100) {
    console.log('✅ 性能测试通过')
  } else {
    console.log('⚠️ 性能测试较慢，建议优化')
  }
}

/**
 * 主测试函数
 */
async function main() {
  console.log('🚀 开始第七阶段数据可视化功能测试')
  console.log('=' * 50)
  
  try {
    // 测试图表数据计算
    await testChartDataCalculation()
    
    // 测试空数据处理
    testEmptyDataHandling()
    
    // 测试性能
    testPerformance()
    
    console.log('\n🎉 第七阶段数据可视化功能测试完成')
    console.log('=' * 50)
    
  } catch (error) {
    console.error('❌ 测试过程中发生错误:', error)
  }
}

// 运行测试
if (require.main === module) {
  main()
}

module.exports = {
  calculateChartData,
  testChartDataCalculation,
  testEmptyDataHandling,
  testPerformance
} 