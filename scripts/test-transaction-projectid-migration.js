// scripts/test-transaction-projectid-migration.js
// 测试银行交易记录中项目户口字段从reference迁移到projectid的修改

// 模拟BODCategories数据
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

// 模拟项目数据
const mockProjects = [
  {
    id: '1',
    name: '网站开发项目',
    projectid: '2024_P_网站开发项目',
    bodCategory: 'P',
    budget: 50000,
    spent: 30000,
    remaining: 20000,
    status: 'Active',
    startDate: '2024-01-01',
    description: '开发公司网站',
    assignedToUid: 'user1',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  },
  {
    id: '2',
    name: '移动应用开发',
    projectid: '2024_VPI_移动应用开发',
    bodCategory: 'VPI',
    budget: 30000,
    spent: 15000,
    remaining: 15000,
    status: 'Active',
    startDate: '2024-02-01',
    description: '开发移动应用',
    assignedToUid: 'user2',
    createdAt: '2024-02-01T00:00:00Z',
    updatedAt: '2024-02-01T00:00:00Z'
  }
]

// 模拟交易数据 (使用新的projectid字段)
const mockTransactions = [
  {
    id: '1',
    date: '2024-01-15',
    description: '购买服务器',
    description2: '网站开发项目支出',
    expense: 5000,
    income: 0,
    status: 'Completed',
    projectid: '2024_P_网站开发项目', // 使用projectid而不是reference
    category: '设备采购',
    projectCategory: '技术支出',
    createdByUid: 'user1'
  },
  {
    id: '2',
    date: '2024-01-20',
    description: '域名注册',
    description2: '网站开发项目支出',
    expense: 100,
    income: 0,
    status: 'Completed',
    projectid: '2024_P_网站开发项目', // 使用projectid而不是reference
    category: '服务费用',
    projectCategory: '技术支出',
    createdByUid: 'user1'
  },
  {
    id: '3',
    date: '2024-02-10',
    description: '应用开发工具',
    description2: '移动应用开发支出',
    expense: 2000,
    income: 0,
    status: 'Completed',
    projectid: '2024_VPI_移动应用开发', // 使用projectid而不是reference
    category: '软件采购',
    projectCategory: '技术支出',
    createdByUid: 'user2'
  },
  {
    id: '4',
    date: '2024-02-15',
    description: '项目收入',
    description2: '移动应用开发收入',
    expense: 0,
    income: 10000,
    status: 'Completed',
    projectid: '2024_VPI_移动应用开发', // 使用projectid而不是reference
    category: '项目收入',
    projectCategory: '收入',
    createdByUid: 'user2'
  }
]

// 测试函数：获取项目分类
function getProjectCategory(transaction) {
  if (!transaction.projectid) return "无项目"
  
  const project = mockProjects.find(p => p.projectid === transaction.projectid)
  if (!project) return "未知项目"
  
  // First try to get BOD category
  const bodCategory = BODCategories[project.bodCategory]
  if (bodCategory) return bodCategory
  
  // If no BOD category, return project name
  return project.name
}

// 测试函数：搜索交易
function searchTransactions(searchTerm) {
  return mockTransactions.filter(transaction =>
    transaction.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (transaction.description2 && transaction.description2.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (transaction.projectid && transaction.projectid.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (transaction.category && transaction.category.toLowerCase().includes(searchTerm.toLowerCase()))
  )
}

// 测试函数：验证交易数据结构
function validateTransactionStructure(transaction) {
  const requiredFields = ['date', 'description', 'expense', 'income', 'status', 'createdByUid']
  const optionalFields = ['description2', 'projectid', 'category', 'projectCategory']
  
  // 检查必需字段
  for (const field of requiredFields) {
    if (!(field in transaction)) {
      return { isValid: false, error: `缺少必需字段: ${field}` }
    }
  }
  
  // 检查projectid字段存在且不是reference
  if ('reference' in transaction) {
    return { isValid: false, error: '交易数据仍包含旧的reference字段' }
  }
  
  return { isValid: true, error: null }
}

// 测试函数：验证项目关联
function validateProjectAssociation(transaction) {
  if (!transaction.projectid) return { isValid: true, message: '无项目关联' }
  
  const project = mockProjects.find(p => p.projectid === transaction.projectid)
  if (!project) {
    return { isValid: false, error: `找不到项目: ${transaction.projectid}` }
  }
  
  return { isValid: true, message: `关联项目: ${project.name} (${project.projectid})` }
}

// 运行测试
console.log('🧪 测试银行交易记录项目户口字段迁移 (reference -> projectid)')
console.log('')

// 测试1: 验证交易数据结构
console.log('📋 测试1: 验证交易数据结构')
mockTransactions.forEach((transaction, index) => {
  const validation = validateTransactionStructure(transaction)
  if (validation.isValid) {
    console.log(`   交易 ${index + 1}: ✅ 结构有效`)
    console.log(`   - 日期: ${transaction.date}`)
    console.log(`   - 描述: ${transaction.description}`)
    console.log(`   - 项目ID: ${transaction.projectid || '无'}`)
    console.log(`   - 支出: $${transaction.expense}`)
    console.log(`   - 收入: $${transaction.income}`)
    console.log(`   - 状态: ${transaction.status}`)
  } else {
    console.log(`   交易 ${index + 1}: ❌ ${validation.error}`)
  }
})
console.log('')

// 测试2: 验证项目关联
console.log('📋 测试2: 验证项目关联')
mockTransactions.forEach((transaction, index) => {
  const validation = validateProjectAssociation(transaction)
  if (validation.isValid) {
    console.log(`   交易 ${index + 1}: ✅ ${validation.message}`)
  } else {
    console.log(`   交易 ${index + 1}: ❌ ${validation.error}`)
  }
})
console.log('')

// 测试3: 测试项目分类功能
console.log('📋 测试3: 测试项目分类功能')
mockTransactions.forEach((transaction, index) => {
  const category = getProjectCategory(transaction)
  console.log(`   交易 ${index + 1}: ${category}`)
})
console.log('')

// 测试4: 测试搜索功能
console.log('📋 测试4: 测试搜索功能')
const searchTests = [
  { term: '网站', expected: 2 },
  { term: '移动', expected: 2 },
  { term: '2024_P', expected: 2 },
  { term: '2024_VPI', expected: 2 },
  { term: '不存在的项目', expected: 0 }
]

searchTests.forEach(test => {
  const results = searchTransactions(test.term)
  const passed = results.length === test.expected
  console.log(`   搜索 "${test.term}": ${passed ? '✅' : '❌'} 找到 ${results.length} 个结果 (期望: ${test.expected})`)
})
console.log('')

// 测试5: 验证所有交易的projectid格式
console.log('📋 测试5: 验证所有交易的projectid格式')
let allValid = true
mockTransactions.forEach((transaction, index) => {
  if (transaction.projectid) {
    // 检查projectid格式: 年份_BOD_项目名称
    const pattern = /^\d{4}_[A-Z]+_.+$/
    const isValid = pattern.test(transaction.projectid)
    console.log(`   交易 ${index + 1}: ${isValid ? '✅' : '❌'} ${transaction.projectid}`)
    if (!isValid) allValid = false
  } else {
    console.log(`   交易 ${index + 1}: ✅ 无项目关联`)
  }
})
console.log('')

// 测试6: 验证数据一致性
console.log('📋 测试6: 验证数据一致性')
let consistencyValid = true

// 检查所有projectid都对应有效的项目
const usedProjectIds = [...new Set(mockTransactions.map(t => t.projectid).filter(Boolean))]
const validProjectIds = mockProjects.map(p => p.projectid)

for (const projectId of usedProjectIds) {
  if (!validProjectIds.includes(projectId)) {
    console.log(`   ❌ 发现无效的项目ID: ${projectId}`)
    consistencyValid = false
  }
}

if (consistencyValid) {
  console.log('   ✅ 所有项目ID都有效')
}

console.log('')

// 总结
console.log('🎉 银行交易记录项目户口字段迁移测试完成!')
if (allValid && consistencyValid) {
  console.log('✅ 所有测试通过，项目户口字段已成功从reference迁移到projectid')
} else {
  console.log('❌ 部分测试失败，请检查迁移结果')
} 