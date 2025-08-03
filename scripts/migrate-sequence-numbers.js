// 数据迁移脚本：为现有交易添加序号
console.log('🔄 开始迁移现有交易数据，添加序号...')

// 模拟Firebase操作
class MigrationHelper {
  constructor() {
    this.transactions = [
      {
        id: 'cSnk3PFfrBv2sCfl2jGP',
        date: '2023-07-01',
        description: '2 pax POO WYE SEE *',
        description2: 'Bosco Nai',
        expense: 0,
        income: 320,
        status: 'Pending',
        createdByUid: 'mock-admin-1'
      },
      {
        id: 'doc2',
        date: '2023-07-01',
        description: '2 pax F WYE S',
        expense: 0,
        income: 320,
        status: 'Pending',
        createdByUid: 'mock-admin-1'
      },
      {
        id: 'doc3',
        date: '2023-07-01',
        description: 'jci dinn KENNE WONG KE*',
        expense: 0,
        income: 320,
        status: 'Pending',
        createdByUid: 'mock-admin-1'
      }
    ]
  }

  // 模拟获取所有交易
  async getAllTransactions() {
    console.log(`📊 获取到 ${this.transactions.length} 笔交易`)
    return this.transactions
  }

  // 模拟更新交易
  async updateTransaction(id, data) {
    const transaction = this.transactions.find(t => t.id === id)
    if (transaction) {
      Object.assign(transaction, data)
      console.log(`✅ 更新交易 ${id}: 添加序号 ${data.sequenceNumber}`)
    }
    return Promise.resolve()
  }

  // 执行迁移
  async migrateSequenceNumbers() {
    try {
      console.log('\n=== 开始序号迁移 ===')
      
      // 1. 获取所有交易
      const transactions = await this.getAllTransactions()
      
      // 2. 按日期排序（如果没有序号，按日期排序）
      const sortedTransactions = transactions.sort((a, b) => {
        const dateA = new Date(a.date)
        const dateB = new Date(b.date)
        return dateA.getTime() - dateB.getTime()
      })
      
      console.log('\n📅 按日期排序的交易:')
      sortedTransactions.forEach((t, index) => {
        console.log(`${index + 1}. ${t.date} - ${t.description}`)
      })
      
      // 3. 为每个交易分配序号
      console.log('\n🔄 开始分配序号...')
      const updatePromises = sortedTransactions.map((transaction, index) => {
        const sequenceNumber = index + 1
        return this.updateTransaction(transaction.id, { sequenceNumber })
      })
      
      await Promise.all(updatePromises)
      
      // 4. 显示迁移结果
      console.log('\n📋 迁移完成！交易列表:')
      console.log('序号 | 日期 | 描述')
      console.log('-----|------|------')
      
      sortedTransactions.forEach(t => {
        console.log(`${t.sequenceNumber.toString().padStart(4)} | ${t.date} | ${t.description}`)
      })
      
      console.log('\n✅ 序号迁移成功完成！')
      console.log('说明:')
      console.log('- 所有现有交易都已分配序号')
      console.log('- 序号按日期顺序分配（从1开始）')
      console.log('- 新添加的交易将自动获得下一个序号')
      
    } catch (error) {
      console.error('❌ 迁移失败:', error)
    }
  }
}

// 运行迁移
async function runMigration() {
  const migrationHelper = new MigrationHelper()
  await migrationHelper.migrateSequenceNumbers()
}

runMigration().catch(console.error) 