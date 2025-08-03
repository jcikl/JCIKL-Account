// 测试银行交易记录序号功能
console.log('测试银行交易记录序号功能...')

// 模拟交易数据
const mockTransactions = [
  {
    id: '1',
    date: '2024-01-01',
    description: '交易1',
    expense: 100,
    income: 0,
    status: 'Completed'
  },
  {
    id: '2', 
    date: '2024-01-02',
    description: '交易2',
    expense: 0,
    income: 200,
    status: 'Completed'
  },
  {
    id: '3',
    date: '2024-01-03', 
    description: '交易3',
    expense: 50,
    income: 0,
    status: 'Pending'
  }
]

// 测试序号生成
console.log('原始交易数据:')
mockTransactions.forEach((transaction, index) => {
  console.log(`序号 ${index + 1}: ${transaction.description} - ${transaction.date}`)
})

// 测试过滤后的序号
const filteredTransactions = mockTransactions.filter(t => t.status === 'Completed')
console.log('\n过滤后的交易数据 (仅已完成):')
filteredTransactions.forEach((transaction, index) => {
  console.log(`序号 ${index + 1}: ${transaction.description} - ${transaction.status}`)
})

// 测试排序后的序号
const sortedTransactions = [...mockTransactions].sort((a, b) => new Date(b.date) - new Date(a.date))
console.log('\n按日期排序后的交易数据:')
sortedTransactions.forEach((transaction, index) => {
  console.log(`序号 ${index + 1}: ${transaction.description} - ${transaction.date}`)
})

console.log('\n✅ 序号功能测试完成！')
console.log('说明: 序号会根据当前显示的交易列表动态生成，从1开始递增') 