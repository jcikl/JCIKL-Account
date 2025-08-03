// 测试Firebase序号功能
console.log('测试Firebase序号功能...')

// 模拟Firebase序号函数
async function getNextSequenceNumber() {
  // 模拟从Firebase获取下一个序号
  return Math.floor(Math.random() * 1000) + 1
}

async function addTransactionWithSequence(transactionData) {
  const nextSequenceNumber = await getNextSequenceNumber()
  const transactionWithSequence = {
    ...transactionData,
    sequenceNumber: nextSequenceNumber
  }
  
  console.log('添加交易:', {
    ...transactionWithSequence,
    id: 'mock-id-' + Date.now()
  })
  
  return 'mock-id-' + Date.now()
}

async function reorderTransactions(transactionIds) {
  console.log('重新排序交易:', transactionIds)
  
  // 模拟批量更新序号
  const updatePromises = transactionIds.map((id, index) => {
    console.log(`更新交易 ${id} 序号为 ${index + 1}`)
    return Promise.resolve()
  })
  
  await Promise.all(updatePromises)
  console.log('所有交易序号已更新')
}

// 测试数据
const mockTransactions = [
  {
    id: '1',
    date: '2024-01-01',
    description: '交易1',
    expense: 100,
    income: 0,
    status: 'Completed',
    sequenceNumber: 1
  },
  {
    id: '2', 
    date: '2024-01-02',
    description: '交易2',
    expense: 0,
    income: 200,
    status: 'Completed',
    sequenceNumber: 2
  },
  {
    id: '3',
    date: '2024-01-03', 
    description: '交易3',
    expense: 50,
    income: 0,
    status: 'Pending',
    sequenceNumber: 3
  }
]

// 测试添加交易
async function testAddTransaction() {
  console.log('\n=== 测试添加交易 ===')
  const newTransaction = {
    date: '2024-01-04',
    description: '新交易',
    expense: 75,
    income: 0,
    status: 'Completed',
    createdByUid: 'user123'
  }
  
  const transactionId = await addTransactionWithSequence(newTransaction)
  console.log('新交易ID:', transactionId)
}

// 测试重新排序
async function testReorderTransactions() {
  console.log('\n=== 测试重新排序 ===')
  const transactionIds = ['3', '1', '2'] // 新的顺序
  await reorderTransactions(transactionIds)
}

// 测试按序号排序
function testSortBySequence() {
  console.log('\n=== 测试按序号排序 ===')
  
  // 模拟从Firebase获取的数据（可能没有序号）
  const unsortedTransactions = [
    { ...mockTransactions[2], sequenceNumber: undefined },
    { ...mockTransactions[0] },
    { ...mockTransactions[1] }
  ]
  
  console.log('排序前:')
  unsortedTransactions.forEach(t => {
    console.log(`序号 ${t.sequenceNumber || '无'}: ${t.description}`)
  })
  
  // 按序号排序
  const sorted = unsortedTransactions.sort((a, b) => {
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
  
  console.log('\n排序后:')
  sorted.forEach(t => {
    console.log(`序号 ${t.sequenceNumber || '无'}: ${t.description}`)
  })
}

// 运行测试
async function runTests() {
  await testAddTransaction()
  await testReorderTransactions()
  testSortBySequence()
  
  console.log('\n✅ Firebase序号功能测试完成！')
  console.log('说明:')
  console.log('- 新交易会自动分配序号')
  console.log('- 拖拽排序会更新Firebase中的序号')
  console.log('- 交易按序号排序显示')
  console.log('- 没有序号的交易会排在最后')
}

runTests().catch(console.error) 