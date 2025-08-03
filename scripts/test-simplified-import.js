// 测试简化导入格式：只导入代码、类型、名称、财务报表分类
// 不导入余额、描述、父账户

console.log('=== 测试简化导入格式 ===\n')

// 模拟新的解析逻辑
function parseSimplifiedFormat(data, skipHeader = true) {
  const lines = data.trim().split('\n')
  const dataLines = skipHeader ? lines.slice(1) : lines
  
  return dataLines.map((line, index) => {
    const fields = line.split(',').map(field => field.trim().replace(/^["']|["']$/g, ''))
    const errors = []
    
    // 新格式：code, type, name, financialStatement
    if (fields.length < 4) {
      errors.push("字段数量不足，需要：账户代码、账户类型、账户名称、财务报表分类")
    }
    
    const [code, type, name, financialStatement] = fields
    
    // 验证账户代码
    if (!code || code.length === 0) {
      errors.push("账户代码不能为空")
    } else if (code.length > 10) {
      errors.push("账户代码不能超过10个字符")
    }
    
    // 验证账户名称
    if (!name || name.length === 0) {
      errors.push("账户名称不能为空")
    } else if (name.length > 100) {
      errors.push("账户名称不能超过100个字符")
    }
    
    // 验证账户类型
    const validTypes = ["Asset", "Liability", "Equity", "Revenue", "Expense"]
    if (!type || !validTypes.includes(type)) {
      errors.push(`账户类型必须是以下之一: ${validTypes.join(', ')}`)
    }
    
    // 验证财务报表分类
    if (!financialStatement || financialStatement.length === 0) {
      errors.push("财务报表分类不能为空")
    }
    
    return {
      code: code || "",
      name: name || "",
      type: type || "Asset",
      financialStatement: financialStatement || "",
      isValid: errors.length === 0,
      errors
    }
  })
}

// 测试数据
const testData = `账户代码,账户类型,账户名称,财务报表分类
1001,Asset,现金,资产负债表
1002,Asset,银行存款,资产负债表
2001,Liability,应付账款,资产负债表
3001,Equity,实收资本,资产负债表
4001,Revenue,主营业务收入,利润表
5001,Expense,管理费用,利润表`

console.log('测试数据:')
console.log(testData)
console.log('\n--- 解析结果 ---')

const parsedAccounts = parseSimplifiedFormat(testData, true)

parsedAccounts.forEach((account, index) => {
  console.log(`\n账户 ${index + 1}:`)
  console.log(`  代码: ${account.code}`)
  console.log(`  类型: ${account.type}`)
  console.log(`  名称: ${account.name}`)
  console.log(`  财务报表: ${account.financialStatement}`)
  console.log(`  有效: ${account.isValid ? '是' : '否'}`)
  if (!account.isValid) {
    console.log(`  错误: ${account.errors.join(', ')}`)
  }
})

// 统计
const validAccounts = parsedAccounts.filter(acc => acc.isValid)
const invalidAccounts = parsedAccounts.filter(acc => !acc.isValid)

console.log('\n--- 统计 ---')
console.log(`总账户数: ${parsedAccounts.length}`)
console.log(`有效账户: ${validAccounts.length}`)
console.log(`无效账户: ${invalidAccounts.length}`)

// 验证新格式不包含余额、描述、父账户
console.log('\n--- 格式验证 ---')
console.log('验证新格式只包含必要字段:')
const sampleAccount = parsedAccounts[0]
console.log('包含的字段:', Object.keys(sampleAccount))
console.log('不包含余额字段:', !('balance' in sampleAccount))
console.log('不包含描述字段:', !('description' in sampleAccount))
console.log('不包含父账户字段:', !('parent' in sampleAccount))

// 测试错误情况
console.log('\n--- 错误情况测试 ---')

const errorTestData = `账户代码,账户类型,账户名称,财务报表分类
1001,Asset,现金
2001,InvalidType,应付账款,资产负债表
,Asset,现金,资产负债表
1002,Asset,,资产负债表`

console.log('错误测试数据:')
console.log(errorTestData)

const errorParsedAccounts = parseSimplifiedFormat(errorTestData, true)

errorParsedAccounts.forEach((account, index) => {
  if (!account.isValid) {
    console.log(`\n错误账户 ${index + 1}:`)
    console.log(`  代码: ${account.code}`)
    console.log(`  错误: ${account.errors.join(', ')}`)
  }
})

console.log('\n=== 测试完成 ===') 