// 模拟账户数据
const mockAccounts = [
  // 资产账户
  { id: '1', code: '1001', name: '现金', type: 'Asset', balance: 50000, financialStatement: '资产负债表' },
  { id: '2', code: '1002', name: '银行存款', type: 'Asset', balance: 150000, financialStatement: '资产负债表' },
  { id: '3', code: '1101', name: '应收账款', type: 'Asset', balance: 25000, financialStatement: '资产负债表' },
  { id: '4', code: '1201', name: '存货', type: 'Asset', balance: 75000, financialStatement: '资产负债表' },
  { id: '5', code: '1301', name: '固定资产', type: 'Asset', balance: 300000, financialStatement: '资产负债表' },
  { id: '6', code: '1401', name: '累计折旧', type: 'Asset', balance: -50000, financialStatement: '资产负债表' },
  
  // 负债账户
  { id: '7', code: '2001', name: '应付账款', type: 'Liability', balance: -35000, financialStatement: '资产负债表' },
  { id: '8', code: '2002', name: '短期借款', type: 'Liability', balance: -100000, financialStatement: '资产负债表' },
  { id: '9', code: '2101', name: '长期借款', type: 'Liability', balance: -200000, financialStatement: '资产负债表' },
  { id: '10', code: '2201', name: '预收账款', type: 'Liability', balance: -15000, financialStatement: '资产负债表' },
  
  // 权益账户
  { id: '11', code: '3001', name: '实收资本', type: 'Equity', balance: 500000, financialStatement: '资产负债表' },
  { id: '12', code: '3002', name: '资本公积', type: 'Equity', balance: 25000, financialStatement: '资产负债表' },
  { id: '13', code: '3101', name: '盈余公积', type: 'Equity', balance: 15000, financialStatement: '资产负债表' },
  { id: '14', code: '3201', name: '未分配利润', type: 'Equity', balance: 45000, financialStatement: '利润表' },
  
  // 收入账户
  { id: '15', code: '4001', name: '主营业务收入', type: 'Revenue', balance: -200000, financialStatement: '利润表' },
  { id: '16', code: '4002', name: '其他业务收入', type: 'Revenue', balance: -15000, financialStatement: '利润表' },
  { id: '17', code: '4101', name: '营业外收入', type: 'Revenue', balance: -5000, financialStatement: '利润表' },
  
  // 费用账户
  { id: '18', code: '5001', name: '主营业务成本', type: 'Expense', balance: 120000, financialStatement: '利润表' },
  { id: '19', code: '5002', name: '销售费用', type: 'Expense', balance: 25000, financialStatement: '利润表' },
  { id: '20', code: '5003', name: '管理费用', type: 'Expense', balance: 30000, financialStatement: '利润表' },
  { id: '21', code: '5004', name: '财务费用', type: 'Expense', balance: 8000, financialStatement: '利润表' },
  { id: '22', code: '5101', name: '营业外支出', type: 'Expense', balance: 2000, financialStatement: '利润表' },
  
  // 一些有问题的账户（用于测试健康度功能）
  { id: '23', code: '9999', name: '问题资产账户', type: 'Asset', balance: -5000, financialStatement: '资产负债表' },
  { id: '24', code: '9998', name: '问题负债账户', type: 'Liability', balance: 3000, financialStatement: '资产负债表' },
  { id: '25', code: '9997', name: '问题权益账户', type: 'Equity', balance: -2000, financialStatement: '资产负债表' },
  { id: '26', code: '9996', name: '零余额账户', type: 'Asset', balance: 0, financialStatement: '资产负债表' }
]

// 模拟增强的账户统计计算函数
function calculateEnhancedAccountStats(accounts) {
  const totalAccounts = accounts.length
  const totalBalance = accounts.reduce((sum, account) => sum + account.balance, 0)
  const positiveAccounts = accounts.filter(account => account.balance > 0).length
  const negativeAccounts = accounts.filter(account => account.balance < 0).length
  const zeroBalanceAccounts = accounts.filter(account => account.balance === 0).length

  // 按类型分组
  const assets = accounts.filter(account => account.type === "Asset")
  const liabilities = accounts.filter(account => account.type === "Liability")
  const equity = accounts.filter(account => account.type === "Equity")
  const revenue = accounts.filter(account => account.type === "Revenue")
  const expenses = accounts.filter(account => account.type === "Expense")

  // 计算财务比率
  const totalAssets = assets.reduce((sum, account) => sum + account.balance, 0)
  const totalLiabilities = liabilities.reduce((sum, account) => sum + account.balance, 0)
  const totalEquity = equity.reduce((sum, account) => sum + account.balance, 0)
  
  const currentRatio = totalLiabilities > 0 ? totalAssets / Math.abs(totalLiabilities) : 0
  const debtToEquityRatio = totalEquity > 0 ? Math.abs(totalLiabilities) / totalEquity : 0
  const assetUtilization = totalAssets > 0 ? (Math.abs(totalLiabilities) + totalEquity) / totalAssets : 0

  // 账户健康度评估
  const healthyAccounts = accounts.filter(account => {
    if (account.type === "Asset") return account.balance >= 0
    if (account.type === "Liability") return account.balance <= 0
    if (account.type === "Equity") return account.balance >= 0
    return true
  }).length

  const warningAccounts = accounts.filter(account => {
    if (account.type === "Asset" && account.balance < 0) return true
    if (account.type === "Liability" && account.balance > 0) return true
    if (account.type === "Equity" && account.balance < 0) return true
    return false
  }).length

  const criticalAccounts = accounts.filter(account => {
    if (account.type === "Asset" && account.balance < -1000) return true
    if (account.type === "Liability" && account.balance > 1000) return true
    if (account.type === "Equity" && account.balance < -1000) return true
    return false
  }).length

  // 类型统计
  const accountTypes = ["Asset", "Liability", "Equity", "Revenue", "Expense"]
  const typeStats = accountTypes.map(type => {
    const accountsOfType = accounts.filter(account => account.type === type)
    const totalBalanceOfType = accountsOfType.reduce((sum, account) => sum + account.balance, 0)
    const balances = accountsOfType.map(account => account.balance)
    
    return {
      type,
      count: accountsOfType.length,
      totalBalance: totalBalanceOfType,
      percentage: (accountsOfType.length / totalAccounts) * 100,
      averageBalance: accountsOfType.length > 0 ? totalBalanceOfType / accountsOfType.length : 0,
      maxBalance: balances.length > 0 ? Math.max(...balances) : 0,
      minBalance: balances.length > 0 ? Math.min(...balances) : 0
    }
  })

  // 财务报表分类统计
  const financialStatements = [...new Set(accounts.map(account => account.financialStatement).filter(Boolean))]
  const financialStatementStats = financialStatements.map(statement => {
    const accountsOfStatement = accounts.filter(account => account.financialStatement === statement)
    const totalBalanceOfStatement = accountsOfStatement.reduce((sum, account) => sum + account.balance, 0)
    
    return {
      statement,
      count: accountsOfStatement.length,
      totalBalance: totalBalanceOfStatement,
      percentage: (accountsOfStatement.length / totalAccounts) * 100
    }
  })

  // 余额分布
  const balanceDistribution = {
    veryHigh: accounts.filter(account => Math.abs(account.balance) > 100000).length,
    high: accounts.filter(account => Math.abs(account.balance) > 10000 && Math.abs(account.balance) <= 100000).length,
    medium: accounts.filter(account => Math.abs(account.balance) > 1000 && Math.abs(account.balance) <= 10000).length,
    low: accounts.filter(account => Math.abs(account.balance) > 100 && Math.abs(account.balance) <= 1000).length,
    veryLow: accounts.filter(account => Math.abs(account.balance) <= 100).length
  }

  return {
    totalAccounts,
    totalBalance,
    positiveAccounts,
    negativeAccounts,
    zeroBalanceAccounts,
    currentRatio,
    debtToEquityRatio,
    assetUtilization,
    healthyAccounts,
    warningAccounts,
    criticalAccounts,
    typeStats,
    financialStatementStats,
    balanceDistribution
  }
}

console.log('=== 账户摘要功能测试 ===\n')

// 测试1: 基础统计信息
console.log('测试1: 基础统计信息')
const stats = calculateEnhancedAccountStats(mockAccounts)
console.log(`总账户数: ${stats.totalAccounts}`)
console.log(`总余额: $${stats.totalBalance.toLocaleString()}`)
console.log(`正余额账户: ${stats.positiveAccounts}`)
console.log(`负余额账户: ${stats.negativeAccounts}`)
console.log(`零余额账户: ${stats.zeroBalanceAccounts}`)
console.log()

// 测试2: 财务比率
console.log('测试2: 财务比率')
console.log(`流动比率: ${stats.currentRatio.toFixed(2)}`)
console.log(`负债权益比: ${stats.debtToEquityRatio.toFixed(2)}`)
console.log(`资产利用率: ${(stats.assetUtilization * 100).toFixed(1)}%`)
console.log()

// 测试3: 账户健康度
console.log('测试3: 账户健康度')
console.log(`健康账户: ${stats.healthyAccounts}`)
console.log(`警告账户: ${stats.warningAccounts}`)
console.log(`风险账户: ${stats.criticalAccounts}`)
console.log(`健康度百分比: ${((stats.healthyAccounts / stats.totalAccounts) * 100).toFixed(1)}%`)
console.log()

// 测试4: 账户类型统计
console.log('测试4: 账户类型统计')
stats.typeStats.forEach(typeStat => {
  console.log(`${typeStat.type}:`)
  console.log(`  数量: ${typeStat.count} 个账户`)
  console.log(`  总余额: $${typeStat.totalBalance.toLocaleString()}`)
  console.log(`  平均余额: $${typeStat.averageBalance.toLocaleString()}`)
  console.log(`  百分比: ${typeStat.percentage.toFixed(1)}%`)
  console.log(`  最大余额: $${typeStat.maxBalance.toLocaleString()}`)
  console.log(`  最小余额: $${typeStat.minBalance.toLocaleString()}`)
  console.log()
})

// 测试5: 财务报表分类统计
console.log('测试5: 财务报表分类统计')
stats.financialStatementStats.forEach(statementStat => {
  console.log(`${statementStat.statement}:`)
  console.log(`  数量: ${statementStat.count} 个账户`)
  console.log(`  总余额: $${statementStat.totalBalance.toLocaleString()}`)
  console.log(`  百分比: ${statementStat.percentage.toFixed(1)}%`)
  console.log()
})

// 测试6: 余额分布
console.log('测试6: 余额分布')
console.log(`极高余额 (>100,000): ${stats.balanceDistribution.veryHigh} 个账户`)
console.log(`高余额 (10,000-100,000): ${stats.balanceDistribution.high} 个账户`)
console.log(`中等余额 (1,000-10,000): ${stats.balanceDistribution.medium} 个账户`)
console.log(`低余额 (100-1,000): ${stats.balanceDistribution.low} 个账户`)
console.log(`极低余额 (<100): ${stats.balanceDistribution.veryLow} 个账户`)
console.log()

// 测试7: 问题账户识别
console.log('测试7: 问题账户识别')
const problemAccounts = mockAccounts.filter(account => {
  if (account.type === "Asset" && account.balance < 0) return true
  if (account.type === "Liability" && account.balance > 0) return true
  if (account.type === "Equity" && account.balance < 0) return true
  return false
})

console.log('发现的问题账户:')
problemAccounts.forEach(account => {
  const issue = account.type === "Asset" && account.balance < 0 ? "资产账户不应为负余额" :
               account.type === "Liability" && account.balance > 0 ? "负债账户不应为正余额" :
               account.type === "Equity" && account.balance < 0 ? "权益账户不应为负余额" : ""
  console.log(`  ${account.code} - ${account.name} (${account.type}): $${account.balance.toLocaleString()} - ${issue}`)
})
console.log()

// 测试8: 财务健康度评估
console.log('测试8: 财务健康度评估')
const currentRatioStatus = stats.currentRatio >= 1.0 ? "良好" : stats.currentRatio >= 0.8 ? "注意" : "风险"
const debtToEquityStatus = stats.debtToEquityRatio <= 2.0 ? "良好" : stats.debtToEquityRatio <= 2.5 ? "注意" : "风险"
const assetUtilizationStatus = stats.assetUtilization >= 0.8 ? "良好" : stats.assetUtilization >= 0.6 ? "注意" : "风险"

console.log(`流动比率状态: ${currentRatioStatus} (${stats.currentRatio.toFixed(2)})`)
console.log(`负债权益比状态: ${debtToEquityStatus} (${stats.debtToEquityRatio.toFixed(2)})`)
console.log(`资产利用率状态: ${assetUtilizationStatus} (${(stats.assetUtilization * 100).toFixed(1)}%)`)
console.log()

// 测试9: 建议生成
console.log('测试9: 建议生成')
if (stats.criticalAccounts > 0) {
  console.log(`⚠️  发现 ${stats.criticalAccounts} 个风险账户，建议立即检查这些账户的余额是否正确。`)
}
if (stats.warningAccounts > 0) {
  console.log(`⚠️  有 ${stats.warningAccounts} 个账户需要关注，建议定期检查这些账户的状态。`)
}
if (stats.healthyAccounts === stats.totalAccounts) {
  console.log(`✅ 所有账户状态良好，继续保持！`)
}
if (stats.zeroBalanceAccounts > stats.totalAccounts * 0.3) {
  console.log(`ℹ️  零余额账户较多 (${stats.zeroBalanceAccounts} 个)，建议考虑是否需要清理这些账户。`)
}
if (stats.currentRatio < 1.0) {
  console.log(`⚠️  流动比率偏低，建议关注短期偿债能力。`)
}
if (stats.debtToEquityRatio > 2.0) {
  console.log(`⚠️  负债权益比偏高，建议关注财务杠杆水平。`)
}
console.log()

console.log('=== 测试完成 ===') 