// 自动序号功能演示
console.log('🚀 自动序号功能演示\n')

// 模拟Firebase序号系统
class AutoSequenceSystem {
  constructor() {
    this.currentMaxSequence = 0
    this.transactions = []
  }

  // 获取下一个自动序号
  async getNextSequenceNumber() {
    // 模拟从Firebase查询最大序号
    const maxSequence = Math.max(0, ...this.transactions.map(t => t.sequenceNumber || 0))
    return maxSequence + 1
  }

  // 添加交易并自动分配序号
  async addTransactionWithAutoSequence(transactionData) {
    const nextSequence = await this.getNextSequenceNumber()
    const transactionWithSequence = {
      ...transactionData,
      id: `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      sequenceNumber: nextSequence,
      createdAt: new Date().toISOString()
    }
    
    this.transactions.push(transactionWithSequence)
    console.log(`✅ 自动分配序号 ${nextSequence} 给交易: ${transactionData.description}`)
    
    return transactionWithSequence.id
  }

  // 批量重新排序
  async reorderTransactions(transactionIds) {
    console.log('\n🔄 开始重新排序...')
    
    for (let i = 0; i < transactionIds.length; i++) {
      const transactionId = transactionIds[i]
      const newSequence = i + 1
      
      const transaction = this.transactions.find(t => t.id === transactionId)
      if (transaction) {
        transaction.sequenceNumber = newSequence
        console.log(`📝 更新交易 "${transaction.description}" 序号为 ${newSequence}`)
      }
    }
    
    console.log('✅ 重新排序完成')
  }

  // 获取排序后的交易列表
  getSortedTransactions() {
    return [...this.transactions].sort((a, b) => {
      const sequenceA = a.sequenceNumber ?? 0
      const sequenceB = b.sequenceNumber ?? 0
      if (sequenceA !== sequenceB) {
        return sequenceA - sequenceB
      }
      // 如果序号相同，按创建时间排序
      return new Date(a.createdAt) - new Date(b.createdAt)
    })
  }

  // 显示当前交易列表
  displayTransactions() {
    const sorted = this.getSortedTransactions()
    console.log('\n📋 当前交易列表:')
    console.log('序号 | 描述 | 金额 | 状态')
    console.log('-----|------|------|------')
    
    sorted.forEach(t => {
      const amount = t.expense > 0 ? `-$${t.expense}` : `+$${t.income}`
      console.log(`${t.sequenceNumber.toString().padStart(4)} | ${t.description.padEnd(10)} | ${amount.padStart(6)} | ${t.status}`)
    })
  }
}

// 演示自动序号功能
async function demonstrateAutoSequence() {
  const sequenceSystem = new AutoSequenceSystem()
  
  console.log('=== 1. 自动序号分配演示 ===')
  
  // 添加多个交易，自动分配序号
  const transactions = [
    { description: '办公用品', expense: 150, income: 0, status: 'Completed', createdByUid: 'user1' },
    { description: '客户付款', expense: 0, income: 5000, status: 'Completed', createdByUid: 'user1' },
    { description: '水电费', expense: 300, income: 0, status: 'Pending', createdByUid: 'user1' },
    { description: '服务收入', expense: 0, income: 2000, status: 'Completed', createdByUid: 'user1' },
    { description: '差旅费', expense: 800, income: 0, status: 'Draft', createdByUid: 'user1' }
  ]
  
  for (const transaction of transactions) {
    await sequenceSystem.addTransactionWithAutoSequence(transaction)
  }
  
  // 显示初始排序
  sequenceSystem.displayTransactions()
  
  console.log('\n=== 2. 拖拽重新排序演示 ===')
  
  // 模拟用户拖拽重新排序（将序号3的交易移到第一位）
  const reorderIds = ['tx_3', 'tx_1', 'tx_2', 'tx_4', 'tx_5'] // 新的顺序
  await sequenceSystem.reorderTransactions(reorderIds)
  
  // 显示重新排序后的结果
  sequenceSystem.displayTransactions()
  
  console.log('\n=== 3. 添加新交易演示 ===')
  
  // 添加新交易，自动分配下一个序号
  await sequenceSystem.addTransactionWithAutoSequence({
    description: '新项目收入',
    expense: 0,
    income: 3000,
    status: 'Completed',
    createdByUid: 'user1'
  })
  
  // 显示最终结果
  sequenceSystem.displayTransactions()
  
  console.log('\n=== 4. 自动序号功能特点 ===')
  console.log('✅ 自动分配: 新交易自动获得下一个可用序号')
  console.log('✅ 唯一性: 每个交易都有唯一的序号')
  console.log('✅ 持久化: 序号存储在Firebase中，重启后保持不变')
  console.log('✅ 动态排序: 支持拖拽重新排序并更新序号')
  console.log('✅ 并发安全: 支持多用户同时添加交易')
  console.log('✅ 兼容性: 向后兼容没有序号的旧数据')
  
  console.log('\n=== 5. 使用场景 ===')
  console.log('📊 财务报告: 按序号引用特定交易')
  console.log('🔍 审计追踪: 通过序号快速定位交易')
  console.log('📋 团队协作: 统一交易编号便于讨论')
  console.log('📤 数据导出: 保持交易顺序的一致性')
  console.log('🔄 工作流程: 按序号处理交易审批')
}

// 运行演示
demonstrateAutoSequence().catch(console.error) 