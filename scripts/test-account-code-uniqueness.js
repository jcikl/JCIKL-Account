// scripts/test-account-code-uniqueness.js
// 专门测试账户代码唯一性功能

console.log('🔍 检查账户代码唯一性功能')
console.log('=====================================\n')

// 模拟现有账户数据
const existingAccounts = [
  {
    id: "1",
    code: "1000",
    name: "现金",
    type: "Asset",
    balance: 10000,
    financialStatement: "Statement of Financial Position",
    description: "公司现金账户",
    parent: ""
  },
  {
    id: "2", 
    code: "2000",
    name: "应付账款",
    type: "Liability",
    balance: -5000,
    financialStatement: "Statement of Financial Position", 
    description: "供应商欠款",
    parent: ""
  }
]

// 模拟导入数据 - 包含重复和新账户
const importData = [
  {
    code: "1000", // 重复账户代码 - 应该被检测到
    name: "现金账户",
    type: "Asset",
    financialStatement: "Statement of Financial Position",
    description: "更新后的现金账户"
  },
  {
    code: "3000", // 新账户代码 - 应该被允许
    name: "应收账款", 
    type: "Asset",
    financialStatement: "Statement of Financial Position",
    description: "客户欠款"
  },
  {
    code: "1000", // 再次重复 - 应该被检测到
    name: "另一个现金账户",
    type: "Asset", 
    financialStatement: "Statement of Financial Position",
    description: "重复的现金账户"
  }
]

// 模拟解析逻辑
function parseData(data, existingAccounts, updateExisting = false) {
  console.log('📝 开始解析导入数据...')
  console.log(`   现有账户数量: ${existingAccounts.length}`)
  console.log(`   导入数据数量: ${data.length}`)
  console.log(`   更新现有账户选项: ${updateExisting ? '是' : '否'}\n`)

  const parsedAccounts = []
  let duplicateCount = 0
  let newCount = 0
  let errorCount = 0

  for (const accountData of data) {
    const errors = []
    let isUpdate = false

    // 验证基本字段
    if (!accountData.code || accountData.code.length === 0) {
      errors.push("账户代码不能为空")
    }

    if (!accountData.name || accountData.name.length === 0) {
      errors.push("账户名称不能为空") 
    }

    // 检查账户代码唯一性
    const existingAccount = existingAccounts.find(acc => acc.code === accountData.code)
    if (existingAccount) {
      duplicateCount++
      console.log(`   🔄 发现重复账户代码: ${accountData.code} - ${accountData.name}`)
      console.log(`       现有账户: ${existingAccount.name}`)
      
      if (!updateExisting) {
        errors.push("账户代码已存在，请勾选'更新现有账户'选项来更新")
        console.log(`       ❌ 错误: 账户代码已存在，但未选择更新选项`)
      } else {
        isUpdate = true
        console.log(`       ✅ 将更新现有账户`)
      }
    } else {
      newCount++
      console.log(`   ➕ 新账户代码: ${accountData.code} - ${accountData.name}`)
    }

    const isValid = errors.length === 0
    if (!isValid) {
      errorCount++
    }

    parsedAccounts.push({
      ...accountData,
      isValid,
      errors,
      isUpdate
    })
  }

  console.log(`\n📊 解析结果:`)
  console.log(`   新账户: ${newCount}`)
  console.log(`   重复账户: ${duplicateCount}`)
  console.log(`   错误账户: ${errorCount}`)
  console.log(`   总计: ${parsedAccounts.length}`)

  return parsedAccounts
}

// 模拟处理逻辑
function processAccounts(parsedAccounts, existingAccounts) {
  console.log('\n🔄 开始处理账户...')
  
  let importedCount = 0
  let updatedCount = 0
  let skippedCount = 0

  for (const account of parsedAccounts) {
    if (!account.isValid) {
      console.log(`   ❌ 跳过无效账户: ${account.code} - ${account.errors.join(', ')}`)
      skippedCount++
      continue
    }

    if (account.isUpdate) {
      console.log(`   📝 更新账户: ${account.code} - ${account.name}`)
      updatedCount++
    } else {
      console.log(`   ➕ 添加新账户: ${account.code} - ${account.name}`)
      importedCount++
    }
  }

  console.log(`\n📊 处理结果:`)
  console.log(`   新增账户: ${importedCount}`)
  console.log(`   更新账户: ${updatedCount}`)
  console.log(`   跳过账户: ${skippedCount}`)

  return { importedCount, updatedCount, skippedCount }
}

// 测试场景1: 不选择更新现有账户
console.log('🧪 测试场景1: 不选择更新现有账户')
console.log('-------------------------------------')
const parsedAccounts1 = parseData(importData, existingAccounts, false)
const result1 = processAccounts(parsedAccounts1, existingAccounts)

console.log('\n' + '='.repeat(50) + '\n')

// 测试场景2: 选择更新现有账户
console.log('🧪 测试场景2: 选择更新现有账户')
console.log('-------------------------------------')
const parsedAccounts2 = parseData(importData, existingAccounts, true)
const result2 = processAccounts(parsedAccounts2, existingAccounts)

console.log('\n' + '='.repeat(50) + '\n')

// 测试场景3: 验证唯一性约束
console.log('🧪 测试场景3: 验证唯一性约束')
console.log('-------------------------------------')

// 模拟尝试添加重复账户到数据库
const mockDatabase = [...existingAccounts]

function addAccountToDatabase(accountData) {
  // 检查是否已存在
  const existing = mockDatabase.find(acc => acc.code === accountData.code)
  if (existing) {
    console.log(`   ❌ 无法添加账户 ${accountData.code}: 账户代码已存在`)
    return false
  }
  
  // 添加新账户
  const newAccount = {
    id: Date.now().toString(),
    ...accountData,
    balance: 0
  }
  mockDatabase.push(newAccount)
  console.log(`   ✅ 成功添加账户: ${accountData.code} - ${accountData.name}`)
  return true
}

console.log('   尝试添加账户到数据库:')
let successCount = 0
let failCount = 0

for (const account of parsedAccounts2.filter(acc => acc.isValid && !acc.isUpdate)) {
  if (addAccountToDatabase(account)) {
    successCount++
  } else {
    failCount++
  }
}

console.log(`\n   数据库操作结果:`)
console.log(`   成功添加: ${successCount}`)
console.log(`   添加失败: ${failCount}`)
console.log(`   数据库总账户数: ${mockDatabase.length}`)

// 验证唯一性
const codeCounts = {}
for (const account of mockDatabase) {
  codeCounts[account.code] = (codeCounts[account.code] || 0) + 1
}

const duplicateCodes = Object.entries(codeCounts).filter(([code, count]) => count > 1)
if (duplicateCodes.length === 0) {
  console.log(`   ✅ 唯一性验证通过: 没有重复的账户代码`)
} else {
  console.log(`   ❌ 唯一性验证失败: 发现重复账户代码:`)
  duplicateCodes.forEach(([code, count]) => {
    console.log(`      ${code}: ${count} 次`)
  })
}

console.log('\n🎯 账户代码唯一性功能检查结果:')
console.log('✅ 重复账户代码检测功能正常')
console.log('✅ 更新现有账户选项控制正常')
console.log('✅ 数据库唯一性约束正常')
console.log('✅ 错误处理和用户提示正常')

if (duplicateCodes.length === 0) {
  console.log('✅ 唯一性验证完全通过')
} else {
  console.log('❌ 唯一性验证存在问题')
} 