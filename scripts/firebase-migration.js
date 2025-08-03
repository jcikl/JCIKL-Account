// Firebase数据迁移脚本：为现有交易添加序号
const { initializeApp } = require('firebase/app')
const { getFirestore, collection, getDocs, updateDoc, doc, query, orderBy } = require('firebase/firestore')

// Firebase配置（需要替换为您的实际配置）
const firebaseConfig = {
  // 请替换为您的Firebase配置
  apiKey: "your-api-key",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "your-app-id"
}

// 初始化Firebase
const app = initializeApp(firebaseConfig)
const db = getFirestore(app)

async function migrateSequenceNumbers() {
  try {
    console.log('🔄 开始Firebase序号迁移...')
    
    // 1. 获取所有交易
    console.log('📊 获取所有交易...')
    const transactionsRef = collection(db, 'transactions')
    const q = query(transactionsRef, orderBy('date', 'asc'))
    const querySnapshot = await getDocs(q)
    
    const transactions = []
    querySnapshot.forEach((doc) => {
      transactions.push({
        id: doc.id,
        ...doc.data()
      })
    })
    
    console.log(`✅ 获取到 ${transactions.length} 笔交易`)
    
    // 2. 检查哪些交易没有序号
    const transactionsWithoutSequence = transactions.filter(t => !t.sequenceNumber)
    console.log(`📝 发现 ${transactionsWithoutSequence.length} 笔交易没有序号`)
    
    if (transactionsWithoutSequence.length === 0) {
      console.log('✅ 所有交易都已有序号，无需迁移')
      return
    }
    
    // 3. 为没有序号的交易分配序号
    console.log('\n🔄 开始分配序号...')
    const updatePromises = transactionsWithoutSequence.map((transaction, index) => {
      const sequenceNumber = index + 1
      const transactionRef = doc(db, 'transactions', transaction.id)
      
      console.log(`📝 为交易 "${transaction.description}" 分配序号 ${sequenceNumber}`)
      
      return updateDoc(transactionRef, {
        sequenceNumber: sequenceNumber
      })
    })
    
    await Promise.all(updatePromises)
    
    console.log('\n✅ 序号迁移完成！')
    console.log(`📊 成功为 ${transactionsWithoutSequence.length} 笔交易添加序号`)
    
    // 4. 显示迁移结果
    console.log('\n📋 迁移后的交易列表:')
    console.log('序号 | 日期 | 描述')
    console.log('-----|------|------')
    
    const sortedTransactions = transactions.sort((a, b) => {
      const sequenceA = a.sequenceNumber ?? 0
      const sequenceB = b.sequenceNumber ?? 0
      return sequenceA - sequenceB
    })
    
    sortedTransactions.forEach(t => {
      const sequence = t.sequenceNumber || '无'
      const date = typeof t.date === 'string' ? t.date : new Date(t.date.seconds * 1000).toISOString().split('T')[0]
      console.log(`${sequence.toString().padStart(4)} | ${date} | ${t.description}`)
    })
    
  } catch (error) {
    console.error('❌ 迁移失败:', error)
    throw error
  }
}

// 运行迁移
if (require.main === module) {
  console.log('⚠️  注意：请确保已配置正确的Firebase配置信息')
  console.log('📝 使用方法：')
  console.log('1. 更新脚本中的firebaseConfig配置')
  console.log('2. 运行: node scripts/firebase-migration.js')
  console.log('')
  
  migrateSequenceNumbers()
    .then(() => {
      console.log('\n🎉 迁移脚本执行完成！')
      process.exit(0)
    })
    .catch((error) => {
      console.error('\n💥 迁移脚本执行失败:', error)
      process.exit(1)
    })
}

module.exports = { migrateSequenceNumbers } 