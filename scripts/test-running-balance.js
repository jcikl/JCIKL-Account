// 测试累计余额计算功能

// 模拟交易数据（基于用户提供的示例）
const testTransactions = [
  {
    id: '1',
    date: '2025-02-04',
    description: 'HUAN HUI YI *Area Conventio',
    description2: '',
    expense: 0,
    income: 503,
    status: 'Pending',
    reference: 'Open Mic',
    category: 'VP Individual',
    createdByUid: 'test'
  },
  {
    id: '2',
    date: '2025-02-04',
    description: 'JUNIOR CHAMBER INTE*Intertransfer',
    description2: 'ss',
    expense: 21270,
    income: 0,
    status: 'Pending',
    reference: 'Open Mic',
    category: 'VP Individual',
    createdByUid: 'test'
  },
  {
    id: '3',
    date: '2025-02-05',
    description: 'OOI KEN HEAN *',
    description2: 'IAB ipoh willi',
    expense: 0,
    income: 188,
    status: 'Pending',
    reference: 'Open Mic',
    category: 'VP Individual',
    createdByUid: 'test'
  },
  {
    id: '4',
    date: '2025-02-04',
    description: 'iab jcikl tan kok yoTAN KOK YONG *Sent from AmOn',
    description2: '',
    expense: 0,
    income: 168,
    status: 'Pending',
    reference: 'Open Mic',
    category: 'VP Individual',
    createdByUid: 'test'
  }
]

// 计算净额函数
const calculateNetAmount = (transaction) => {
  return transaction.income - transaction.expense
}

// 计算累计余额函数
const calculateRunningBalances = (transactions, initialBalance = 0) => {
  let currentBalance = initialBalance
  return transactions.map(transaction => {
    const netAmount = calculateNetAmount(transaction)
    currentBalance += netAmount
    return { transaction, runningBalance: currentBalance }
  })
}

console.log('=== 累计余额计算测试 ===')
console.log('初始余额: $0.00')
console.log()

// 计算并显示每笔交易的累计余额
const runningBalances = calculateRunningBalances(testTransactions, 0)

runningBalances.forEach(({ transaction, runningBalance }, index) => {
  const netAmount = calculateNetAmount(transaction)
  const netAmountStr = netAmount >= 0 ? `+$${netAmount.toFixed(2)}` : `-$${Math.abs(netAmount).toFixed(2)}`
  const balanceStr = runningBalance >= 0 ? `+$${runningBalance.toFixed(2)}` : `-$${Math.abs(runningBalance).toFixed(2)}`
  
  console.log(`交易 ${index + 1}:`)
  console.log(`  日期: ${transaction.date}`)
  console.log(`  描述: ${transaction.description}`)
  console.log(`  收入: $${transaction.income.toFixed(2)}`)
  console.log(`  支出: $${transaction.expense.toFixed(2)}`)
  console.log(`  净额: ${netAmountStr}`)
  console.log(`  累计余额: ${balanceStr}`)
  console.log()
})

console.log('=== 预期结果对比 ===')
console.log('预期累计余额:')
console.log('1. +$503.00')
console.log('2. -$20,767.00')
console.log('3. -$20,579.00')
console.log('4. -$20,411.00')
console.log()

// 验证结果
const expectedBalances = [503, -20767, -20579, -20411]
const actualBalances = runningBalances.map(({ runningBalance }) => runningBalance)

console.log('=== 验证结果 ===')
expectedBalances.forEach((expected, index) => {
  const actual = actualBalances[index]
  const isCorrect = Math.abs(expected - actual) < 0.01 // 允许小数点误差
  console.log(`交易 ${index + 1}: 预期 ${expected}, 实际 ${actual}, ${isCorrect ? '✓ 正确' : '✗ 错误'}`)
})

console.log()
console.log('测试完成！') 