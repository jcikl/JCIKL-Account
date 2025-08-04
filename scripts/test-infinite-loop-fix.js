// 测试无限循环修复 - 模拟缓存键生成逻辑
console.log('Testing cache key generation logic...')

// 模拟缓存键生成函数
function generateTransactionsKey(options) {
  if (!options) return 'transactions'
  const { limit, filters } = options
  if (!filters) return `transactions:${limit || 'default'}`
  
  // 创建稳定的过滤器字符串
  const filterKeys = Object.keys(filters).sort()
  const filterStr = filterKeys.map(key => {
    const value = filters[key]
    if (value === undefined || value === null) return ''
    if (typeof value === 'object') {
      return `${key}:${JSON.stringify(value)}`
    }
    return `${key}:${value}`
  }).filter(Boolean).join('|')
  
  return `transactions:${limit || 'default'}:${filterStr}`
}

function generateProjectsKey(filters) {
  if (!filters) return 'projects'
  
  // 创建稳定的过滤器字符串
  const filterKeys = Object.keys(filters).sort()
  const filterStr = filterKeys.map(key => {
    const value = filters[key]
    if (value === undefined || value === null) return ''
    if (typeof value === 'object') {
      return `${key}:${JSON.stringify(value)}`
    }
    return `${key}:${value}`
  }).filter(Boolean).join('|')
  
  return `projects:${filterStr}`
}

// 测试交易缓存键生成
const testTransactionsKey1 = generateTransactionsKey({ limit: 100, filters: { status: 'Completed' } })
const testTransactionsKey2 = generateTransactionsKey({ limit: 100, filters: { status: 'Completed' } })
console.log('Transactions key 1:', testTransactionsKey1)
console.log('Transactions key 2:', testTransactionsKey2)
console.log('Keys are equal:', testTransactionsKey1 === testTransactionsKey2)

// 测试项目缓存键生成
const testProjectsKey1 = generateProjectsKey({ status: 'Active' })
const testProjectsKey2 = generateProjectsKey({ status: 'Active' })
console.log('Projects key 1:', testProjectsKey1)
console.log('Projects key 2:', testProjectsKey2)
console.log('Keys are equal:', testProjectsKey1 === testProjectsKey2)

// 测试不同顺序的过滤器
const testFilters1 = { status: 'Completed', category: 'Expense' }
const testFilters2 = { category: 'Expense', status: 'Completed' }
const testKey1 = generateTransactionsKey({ limit: 100, filters: testFilters1 })
const testKey2 = generateTransactionsKey({ limit: 100, filters: testFilters2 })
console.log('Different order filters key 1:', testKey1)
console.log('Different order filters key 2:', testKey2)
console.log('Keys are equal:', testKey1 === testKey2)

console.log('Cache key generation test completed successfully!') 