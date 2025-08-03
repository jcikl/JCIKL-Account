// 测试新的导入格式：账户代码,账户类型,账户名称,财务报表分类
console.log('测试新的粘贴导入格式...\n')

// 模拟粘贴的数据 - 新格式：代码,类型,名称,财务报表分类,余额,描述,父账户
const testData = `1001,Asset,现金,资产负债表,15000,公司现金账户,
1002,Asset,银行存款,资产负债表,50000,银行活期存款,
2001,Liability,应付账款,资产负债表,25000,供应商欠款,
3001,Equity,实收资本,资产负债表,100000,股东投资,
4001,Revenue,销售收入,利润表,75000,主营业务收入,
5001,Expense,管理费用,利润表,15000,日常管理费用,
1003,Asset,应收账款,资产负债表,30000,客户欠款,
2002,Liability,预收账款,资产负债表,10000,预收客户款项`

console.log('测试数据 (新格式):')
console.log(testData)
console.log('\n格式说明: 账户代码,账户类型,账户名称,财务报表分类,余额,描述,父账户')
console.log('示例: 1001,Asset,现金,资产负债表,15000,公司现金账户,\n')

// 模拟解析逻辑
function parseNewFormat(data, skipHeader = true) {
  const lines = data.trim().split('\n')
  const dataLines = skipHeader ? lines.slice(1) : lines
  
  return dataLines.map((line, index) => {
    const fields = line.split(',').map(field => field.trim().replace(/^["']|["']$/g, ''))
    
    // 新格式：代码,类型,名称,财务报表分类,余额,描述,父账户
    const [code, type, name, financialStatement, balanceStr, description, parent] = fields
    
    // 验证字段数量
    if (fields.length < 4) {
      return {
        code: code || "",
        type: type || "",
        name: name || "",
        financialStatement: financialStatement || "",
        balance: 0,
        description: description || "",
        parent: parent || "",
        isValid: false,
        errors: ["字段数量不足，需要：账户代码、账户类型、账户名称、财务报表分类"]
      }
    }
    
    // 验证账户代码
    const errors = []
    if (!code || code.length === 0) {
      errors.push("账户代码不能为空")
    } else if (code.length > 10) {
      errors.push("账户代码不能超过10个字符")
    }
    
    // 验证账户类型
    const validTypes = ["Asset", "Liability", "Equity", "Revenue", "Expense"]
    if (!type || !validTypes.includes(type)) {
      errors.push(`账户类型必须是以下之一: ${validTypes.join(', ')}`)
    }
    
    // 验证账户名称
    if (!name || name.length === 0) {
      errors.push("账户名称不能为空")
    } else if (name.length > 100) {
      errors.push("账户名称不能超过100个字符")
    }
    
    // 验证余额
    let balance = 0
    if (balanceStr) {
      const parsedBalance = parseFloat(balanceStr.replace(/[^\d.-]/g, ''))
      if (isNaN(parsedBalance)) {
        errors.push("余额必须是有效的数字")
      } else {
        balance = parsedBalance
      }
    }
    
    return {
      code: code || "",
      type: type || "",
      name: name || "",
      financialStatement: financialStatement || "",
      balance,
      description: description || "",
      parent: parent || "",
      isValid: errors.length === 0,
      errors
    }
  })
}

// 测试解析
console.log('解析结果:')
const parsedAccounts = parseNewFormat(testData, false) // 不跳过标题行，因为测试数据没有标题

parsedAccounts.forEach((account, index) => {
  console.log(`\n账户 ${index + 1}:`)
  console.log(`  代码: ${account.code}`)
  console.log(`  类型: ${account.type}`)
  console.log(`  名称: ${account.name}`)
  console.log(`  财务报表: ${account.financialStatement}`)
  console.log(`  余额: ${account.balance}`)
  console.log(`  描述: ${account.description}`)
  console.log(`  父账户: ${account.parent}`)
  console.log(`  有效: ${account.isValid ? '✅' : '❌'}`)
  if (account.errors.length > 0) {
    console.log(`  错误: ${account.errors.join(', ')}`)
  }
})

// 统计结果
const validAccounts = parsedAccounts.filter(account => account.isValid)
const invalidAccounts = parsedAccounts.filter(account => !account.isValid)

console.log('\n=== 解析统计 ===')
console.log(`总账户数: ${parsedAccounts.length}`)
console.log(`有效账户: ${validAccounts.length}`)
console.log(`无效账户: ${invalidAccounts.length}`)

if (validAccounts.length > 0) {
  console.log('\n=== 有效账户预览 ===')
  validAccounts.forEach((account, index) => {
    console.log(`${index + 1}. ${account.code} | ${account.type} | ${account.name} | ${account.financialStatement} | $${account.balance.toLocaleString()}`)
  })
}

if (invalidAccounts.length > 0) {
  console.log('\n=== 无效账户 ===')
  invalidAccounts.forEach((account, index) => {
    console.log(`${index + 1}. ${account.code} | ${account.type} | ${account.name} - 错误: ${account.errors.join(', ')}`)
  })
}

console.log('\n✅ 新格式测试完成！') 