// Firebase数据迁移脚本：为现有交易添加项目名称字段
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

// BOD分类映射
const BODCategories = {
  P: "President",
  HT: "Honorary Treasurer", 
  EVP: "Executive Vice President",
  LS: "Local Secretary",
  GLC: "General Legal Counsel",
  VPI: "VP Individual",
  VPB: "VP Business",
  VPIA: "VP International",
  VPC: "VP Community",
  VPLOM: "VP Local Organisation Management"
}

// 从项目ID中提取项目名称
function extractProjectName(projectId) {
  if (!projectId) return null
  
  const parts = projectId.split('_')
  if (parts.length >= 3) {
    return parts.slice(2).join('_') // 项目名称是第三部分开始
  } else if (parts.length >= 2) {
    return projectId // 如果没有项目名称部分，使用整个ID
  }
  return projectId
}

// 初始化Firebase
const app = initializeApp(firebaseConfig)
const db = getFirestore(app)

async function migrateProjectNames() {
  try {
    console.log('🔄 开始Firebase项目名称迁移...')
    
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
    
    // 2. 检查哪些交易有projectid但没有projectName
    const transactionsNeedingProjectName = transactions.filter(t => 
      t.projectid && t.projectid.trim() && !t.projectName
    )
    console.log(`📝 发现 ${transactionsNeedingProjectName.length} 笔交易需要添加项目名称`)
    
    if (transactionsNeedingProjectName.length === 0) {
      console.log('✅ 所有交易都已项目名称，无需迁移')
      return
    }
    
    // 3. 为有projectid但没有projectName的交易添加项目名称
    console.log('\n🔄 开始添加项目名称...')
    const updatePromises = transactionsNeedingProjectName.map((transaction) => {
      const projectName = extractProjectName(transaction.projectid)
      const transactionRef = doc(db, 'transactions', transaction.id)
      
      console.log(`📝 为交易 "${transaction.description}" 添加项目名称: "${projectName}" (项目ID: ${transaction.projectid})`)
      
      return updateDoc(transactionRef, {
        projectName: projectName
      })
    })
    
    await Promise.all(updatePromises)
    
    console.log('\n✅ 项目名称迁移完成！')
    console.log(`📊 成功为 ${transactionsNeedingProjectName.length} 笔交易添加项目名称`)
    
    // 4. 显示迁移结果
    console.log('\n📋 迁移后的交易列表:')
    console.log('项目ID | 项目名称 | 交易描述')
    console.log('--------|----------|----------')
    
    const updatedTransactions = transactions.map(t => {
      if (t.projectid && !t.projectName) {
        return { ...t, projectName: extractProjectName(t.projectid) }
      }
      return t
    })
    
    updatedTransactions
      .filter(t => t.projectid && t.projectid.trim())
      .slice(0, 20) // 只显示前20条
      .forEach(t => {
        const projectName = t.projectName || extractProjectName(t.projectid)
        console.log(`${t.projectid} | ${projectName} | ${t.description}`)
      })
    
    if (updatedTransactions.filter(t => t.projectid && t.projectid.trim()).length > 20) {
      console.log('... (还有更多记录)')
    }
    
    // 5. 统计信息
    const withProjectId = transactions.filter(t => t.projectid && t.projectid.trim()).length
    const withProjectName = transactions.filter(t => t.projectName && t.projectName.trim()).length
    
    console.log('\n📊 迁移统计:')
    console.log(`总交易数: ${transactions.length}`)
    console.log(`有项目ID的交易: ${withProjectId}`)
    console.log(`有项目名称的交易: ${withProjectName}`)
    console.log(`迁移的交易数: ${transactionsNeedingProjectName.length}`)
    
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
  console.log('2. 运行: node scripts/migrate-project-names.js')
  console.log('')
  
  migrateProjectNames()
    .then(() => {
      console.log('\n🎉 项目名称迁移脚本执行完成！')
      process.exit(0)
    })
    .catch((error) => {
      console.error('\n💥 项目名称迁移脚本执行失败:', error)
      process.exit(1)
    })
}

module.exports = { migrateProjectNames } 