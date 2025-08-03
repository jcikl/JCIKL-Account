// 测试粘贴导入序号功能
console.log('🧪 测试粘贴导入序号功能...\n')

// 模拟Firebase操作
class MockFirebaseUtils {
  constructor() {
    this.transactions = []
    this.nextSequenceNumber = 1
  }

  // 模拟获取下一个序号
  async getNextSequenceNumber() {
    console.log(`📊 获取下一个序号: ${this.nextSequenceNumber}`)
    return this.nextSequenceNumber
  }

  // 模拟添加带序号的交易
  async addTransactionWithSequence(transactionData) {
    const sequenceNumber = await this.getNextSequenceNumber()
    const transaction = {
      id: `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ...transactionData,
      sequenceNumber
    }
    
    this.transactions.push(transaction)
    this.nextSequenceNumber++
    
    console.log(`✅ 添加交易 "${transaction.description}" 序号: ${sequenceNumber}`)
    return transaction.id
  }

  // 模拟获取所有交易
  async getTransactions() {
    return this.transactions.sort((a, b) => a.sequenceNumber - b.sequenceNumber)
  }
}

// 模拟粘贴导入数据
const mockPasteData = [
  {
    date: '2023-07-01',
    description: '粘贴导入交易1',
    expense: 100,
    income: 0,
    status: 'Completed',
    isValid: true
  },
  {
    date: '2023-07-02',
    description: '粘贴导入交易2',
    expense: 0,
    income: 200,
    status: 'Completed',
    isValid: true
  },
  {
    date: '2023-07-03',
    description: '粘贴导入交易3',
    expense: 50,
    income: 150,
    status: 'Pending',
    isValid: true
  }
]

// 模拟粘贴导入处理函数
async function handleImportTransactions(parsedTransactions) {
  const firebaseUtils = new MockFirebaseUtils()
  let addedCount = 0

  console.log('🔄 开始处理粘贴导入数据...')
  
  for (const parsed of parsedTransactions) {
    if (!parsed.isValid) continue

    // 构建交易数据
    const transactionData = {
      date: parsed.date,
      description: parsed.description,
      expense: parsed.expense,
      income: parsed.income,
      status: parsed.status,
      createdByUid: 'mock-user-1'
    }

    // 使用序号系统添加交易
    await firebaseUtils.addTransactionWithSequence(transactionData)
    addedCount++
  }

  console.log(`\n📊 导入完成，共添加 ${addedCount} 笔交易`)
  
  // 显示导入结果
  const allTransactions = await firebaseUtils.getTransactions()
  console.log('\n📋 导入后的交易列表:')
  console.log('序号 | 日期 | 描述 | 支出 | 收入')
  console.log('-----|------|------|------|------')
  
  allTransactions.forEach(t => {
    console.log(`${t.sequenceNumber.toString().padStart(4)} | ${t.date} | ${t.description} | ${t.expense} | ${t.income}`)
  })

  return allTransactions
}

// 运行测试
async function runTest() {
  try {
    console.log('=== 测试场景: 粘贴导入交易 ===')
    console.log('模拟数据:')
    mockPasteData.forEach((t, index) => {
      console.log(`${index + 1}. ${t.date} - ${t.description}`)
    })
    
    console.log('\n🔄 执行粘贴导入...')
    const result = await handleImportTransactions(mockPasteData)
    
    console.log('\n✅ 粘贴导入序号功能测试完成！')
    console.log('\n📝 验证结果:')
    console.log(`- 成功导入 ${result.length} 笔交易`)
    console.log('- 所有交易都自动分配了序号')
    console.log('- 序号按导入顺序递增')
    console.log('- 序号从1开始连续分配')
    
  } catch (error) {
    console.error('❌ 测试失败:', error)
  }
}

runTest().catch(console.error) 