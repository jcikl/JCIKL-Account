// 测试拖动排序序号功能
console.log('🧪 测试拖动排序序号功能...\n')

// 模拟Firebase操作
class MockFirebaseUtils {
  constructor() {
    this.transactions = [
      {
        id: 'doc1',
        date: '2023-07-01',
        description: '交易1',
        expense: 100,
        income: 0,
        status: 'Completed',
        sequenceNumber: 1
      },
      {
        id: 'doc2',
        date: '2023-07-02',
        description: '交易2',
        expense: 0,
        income: 200,
        status: 'Completed',
        sequenceNumber: 2
      },
      {
        id: 'doc3',
        date: '2023-07-03',
        description: '交易3',
        expense: 50,
        income: 150,
        status: 'Pending',
        sequenceNumber: 3
      },
      {
        id: 'doc4',
        date: '2023-07-04',
        description: '交易4',
        expense: 75,
        income: 100,
        status: 'Completed',
        sequenceNumber: 4
      }
    ]
  }

  // 模拟获取所有交易
  async getTransactions() {
    return this.transactions.sort((a, b) => a.sequenceNumber - b.sequenceNumber)
  }

  // 模拟重新排序交易
  async reorderTransactions(transactionIds) {
    console.log('🔄 开始重新排序交易...')
    console.log('新的排序顺序:', transactionIds)
    
    // 更新序号
    for (let i = 0; i < transactionIds.length; i++) {
      const transactionId = transactionIds[i]
      const newSequenceNumber = i + 1
      
      const transaction = this.transactions.find(t => t.id === transactionId)
      if (transaction) {
        transaction.sequenceNumber = newSequenceNumber
        console.log(`✅ 更新交易 "${transaction.description}" 序号: ${newSequenceNumber}`)
      }
    }
    
    console.log('✅ 重新排序完成')
  }

  // 模拟更新单个交易序号
  async updateTransactionSequence(transactionId, newSequenceNumber) {
    const transaction = this.transactions.find(t => t.id === transactionId)
    if (transaction) {
      transaction.sequenceNumber = newSequenceNumber
      console.log(`✅ 更新交易 "${transaction.description}" 序号: ${newSequenceNumber}`)
    }
  }
}

// 模拟拖拽排序逻辑
function simulateDragSort(transactions, dragFromIndex, dragToIndex) {
  console.log(`🔄 模拟拖拽: 从位置 ${dragFromIndex + 1} 拖到位置 ${dragToIndex + 1}`)
  
  const newTransactions = [...transactions]
  const [draggedItem] = newTransactions.splice(dragFromIndex, 1)
  newTransactions.splice(dragToIndex, 0, draggedItem)
  
  return newTransactions
}

// 模拟保存排序
async function handleSaveOrder(transactions, firebaseUtils) {
  try {
    const sortedIds = transactions.map(t => t.id).filter(Boolean)
    await firebaseUtils.reorderTransactions(sortedIds)
    
    console.log('✅ 排序已保存到Firebase')
    return true
  } catch (error) {
    console.error('❌ 保存排序失败:', error)
    return false
  }
}

// 运行测试
async function runTest() {
  try {
    const firebaseUtils = new MockFirebaseUtils()
    
    console.log('=== 测试场景: 拖动排序功能 ===')
    
    // 1. 显示初始状态
    console.log('\n📋 初始交易列表:')
    const initialTransactions = await firebaseUtils.getTransactions()
    console.log('序号 | 描述')
    console.log('-----|------')
    initialTransactions.forEach(t => {
      console.log(`${t.sequenceNumber.toString().padStart(4)} | ${t.description}`)
    })
    
    // 2. 模拟拖拽排序（将第3个交易拖到第1个位置）
    console.log('\n🔄 执行拖拽排序...')
    const dragFromIndex = 2 // 第3个交易（索引2）
    const dragToIndex = 0   // 第1个位置（索引0）
    
    const reorderedTransactions = simulateDragSort(initialTransactions, dragFromIndex, dragToIndex)
    
    console.log('\n📋 拖拽后的交易列表:')
    console.log('序号 | 描述')
    console.log('-----|------')
    reorderedTransactions.forEach((t, index) => {
      console.log(`${(index + 1).toString().padStart(4)} | ${t.description}`)
    })
    
    // 3. 保存排序到Firebase
    console.log('\n💾 保存排序到Firebase...')
    const saveSuccess = await handleSaveOrder(reorderedTransactions, firebaseUtils)
    
    if (saveSuccess) {
      // 4. 验证保存结果
      console.log('\n📋 保存后的交易列表:')
      const savedTransactions = await firebaseUtils.getTransactions()
      console.log('序号 | 描述')
      console.log('-----|------')
      savedTransactions.forEach(t => {
        console.log(`${t.sequenceNumber.toString().padStart(4)} | ${t.description}`)
      })
      
      // 5. 验证序号连续性
      const sequenceNumbers = savedTransactions.map(t => t.sequenceNumber).sort((a, b) => a - b)
      const isSequential = sequenceNumbers.every((num, index) => num === index + 1)
      
      console.log('\n✅ 拖动排序功能测试完成！')
      console.log('\n📝 验证结果:')
      console.log(`- 成功重新排序 ${savedTransactions.length} 笔交易`)
      console.log(`- 序号连续性检查: ${isSequential ? '✅ 通过' : '❌ 失败'}`)
      console.log(`- 拖拽操作: 将"${reorderedTransactions[dragToIndex].description}"移到第1位`)
      console.log(`- 序号范围: ${Math.min(...sequenceNumbers)} - ${Math.max(...sequenceNumbers)}`)
      
      if (!isSequential) {
        console.log('⚠️  警告: 序号不连续，可能存在数据不一致问题')
      }
    } else {
      console.log('\n❌ 保存排序失败，测试未完成')
    }
    
  } catch (error) {
    console.error('❌ 测试失败:', error)
  }
}

// 测试多个拖拽场景
async function runMultipleTests() {
  console.log('\n' + '='.repeat(50))
  console.log('🧪 多场景拖动排序测试')
  console.log('='.repeat(50))
  
  const firebaseUtils = new MockFirebaseUtils()
  
  // 测试场景1: 将最后一个移到第一个
  console.log('\n📋 场景1: 将最后一个交易移到第一个位置')
  let transactions = await firebaseUtils.getTransactions()
  transactions = simulateDragSort(transactions, transactions.length - 1, 0)
  await handleSaveOrder(transactions, firebaseUtils)
  
  // 测试场景2: 将第一个移到最后一个
  console.log('\n📋 场景2: 将第一个交易移到最后一个位置')
  transactions = await firebaseUtils.getTransactions()
  transactions = simulateDragSort(transactions, 0, transactions.length - 1)
  await handleSaveOrder(transactions, firebaseUtils)
  
  // 测试场景3: 相邻位置交换
  console.log('\n📋 场景3: 交换相邻的两个交易')
  transactions = await firebaseUtils.getTransactions()
  transactions = simulateDragSort(transactions, 0, 1)
  await handleSaveOrder(transactions, firebaseUtils)
  
  console.log('\n✅ 多场景测试完成！')
}

runTest().then(() => {
  return runMultipleTests()
}).catch(console.error) 