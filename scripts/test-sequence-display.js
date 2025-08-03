// 测试序号显示功能
console.log('🧪 测试序号显示功能...\n')

// 模拟交易数据（包含有序号和没有序号的交易）
const mockTransactions = [
  {
    id: '1',
    date: '2023-07-01',
    description: '2 pax POO WYE SEE *',
    description2: 'Bosco Nai',
    expense: 0,
    income: 320,
    status: 'Pending',
    sequenceNumber: 1 // 有序号
  },
  {
    id: '2',
    date: '2023-07-01',
    description: '2 pax F WYE S',
    expense: 0,
    income: 320,
    status: 'Pending'
    // 没有序号
  },
  {
    id: '3',
    date: '2023-07-01',
    description: 'jci dinn KENNE WONG KE*',
    expense: 0,
    income: 320,
    status: 'Pending',
    sequenceNumber: 3 // 有序号
  }
]

// 模拟序号显示逻辑
function displayTransactionsWithSequence(transactions) {
  console.log('📋 交易列表显示:')
  console.log('序号 | 日期 | 描述')
  console.log('-----|------|------')
  
  transactions.forEach(transaction => {
    const sequence = transaction.sequenceNumber || '-'
    const date = transaction.date
    const description = transaction.description
    
    console.log(`${sequence.toString().padStart(4)} | ${date} | ${description}`)
  })
}

// 模拟排序逻辑
function sortTransactionsBySequence(transactions) {
  return [...transactions].sort((a, b) => {
    const sequenceA = a.sequenceNumber ?? 0
    const sequenceB = b.sequenceNumber ?? 0
    if (sequenceA !== sequenceB) {
      return sequenceA - sequenceB
    }
    // 如果序号相同，按日期排序
    const dateA = new Date(a.date)
    const dateB = new Date(b.date)
    return dateB.getTime() - dateA.getTime()
  })
}

// 测试不同场景
console.log('=== 场景1: 显示原始数据 ===')
displayTransactionsWithSequence(mockTransactions)

console.log('\n=== 场景2: 按序号排序后显示 ===')
const sortedTransactions = sortTransactionsBySequence(mockTransactions)
displayTransactionsWithSequence(sortedTransactions)

console.log('\n=== 场景3: 模拟添加新交易 ===')
const newTransaction = {
  id: '4',
  date: '2023-07-02',
  description: '新交易',
  expense: 100,
  income: 0,
  status: 'Completed',
  sequenceNumber: 4
}

const updatedTransactions = [...sortedTransactions, newTransaction]
displayTransactionsWithSequence(updatedTransactions)

console.log('\n=== 场景4: 模拟拖拽重新排序 ===')
// 模拟用户拖拽重新排序（将序号3的交易移到第一位）
const reorderedIds = ['3', '1', '2', '4']
const reorderedTransactions = reorderedIds.map((id, index) => {
  const transaction = updatedTransactions.find(t => t.id === id)
  if (transaction) {
    return { ...transaction, sequenceNumber: index + 1 }
  }
  return transaction
}).filter(Boolean)

console.log('重新排序后:')
displayTransactionsWithSequence(reorderedTransactions)

console.log('\n✅ 序号显示功能测试完成！')
console.log('\n📝 问题诊断:')
console.log('1. 如果序号列显示"-"，说明交易数据中没有sequenceNumber字段')
console.log('2. 需要运行数据迁移脚本为现有交易添加序号')
console.log('3. 确保新添加的交易使用addTransactionWithSequence函数')
console.log('4. 检查Firebase中是否有sequenceNumber字段') 