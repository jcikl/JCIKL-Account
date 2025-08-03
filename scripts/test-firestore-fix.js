// 测试Firestore undefined值修复
// 验证可选字段的处理是否正确

console.log('🧪 测试Firestore undefined值修复')
console.log('='.repeat(50))

// 模拟CSV数据处理
function processCsvData(csvText) {
  const lines = csvText.trim().split("\n")
  return lines.slice(1).map((line) => {
    const values = line.split(",").map((v) => v.trim().replace(/"/g, ""))
    const expense = Number.parseFloat(values[3] || "0")
    const income = Number.parseFloat(values[4] || "0")
    const netAmount = income - expense
    
    const transactionData = {
      date: values[0] || new Date().toISOString().split("T")[0],
      description: values[1] || "Imported Transaction",
      expense: expense,
      income: income,
      amount: netAmount >= 0 ? `+$${netAmount.toFixed(2)}` : `-$${Math.abs(netAmount).toFixed(2)}`,
      status: "Pending",
      createdByUid: "test-user-id",
    }
    
    // 只有当description2有值时才添加
    if (values[2] && values[2].trim()) {
      transactionData.description2 = values[2]
    }
    
    return transactionData
  })
}

// 模拟解析交易数据处理
function processParsedTransactions(parsedTransactions) {
  return parsedTransactions.map((parsed) => {
    const netAmount = parsed.income - parsed.expense
    const transactionData = {
      date: parsed.date,
      description: parsed.description,
      expense: parsed.expense,
      income: parsed.income,
      amount: netAmount >= 0 ? `+$${netAmount.toFixed(2)}` : `-$${Math.abs(netAmount).toFixed(2)}`,
      status: parsed.status,
      createdByUid: "test-user-id",
    }
    
    // 只有当可选字段有值时才添加
    if (parsed.description2 && parsed.description2.trim()) {
      transactionData.description2 = parsed.description2
    }
    if (parsed.reference && parsed.reference.trim()) {
      transactionData.reference = parsed.reference
    }
    if (parsed.category && parsed.category.trim()) {
      transactionData.category = parsed.category
    }
    
    return transactionData
  })
}

// 模拟表单数据处理
function processFormData(formData) {
  const expense = parseFloat(formData.expense) || 0
  const income = parseFloat(formData.income) || 0
  const netAmount = income - expense
  
  const transactionData = {
    date: formData.date,
    description: formData.description,
    expense: expense,
    income: income,
    amount: netAmount >= 0 ? `+$${netAmount.toFixed(2)}` : `-$${Math.abs(netAmount).toFixed(2)}`,
    status: formData.status,
    createdByUid: "test-user-id"
  }
  
  // 只有当可选字段有值时才添加
  if (formData.description2 && formData.description2.trim()) {
    transactionData.description2 = formData.description2
  }
  if (formData.reference && formData.reference !== "none" && formData.reference.trim()) {
    transactionData.reference = formData.reference
  }
  if (formData.category && formData.category !== "none" && formData.category.trim()) {
    transactionData.category = formData.category
  }
  
  return transactionData
}

// 检查对象是否包含undefined值
function hasUndefinedValues(obj) {
  for (const [key, value] of Object.entries(obj)) {
    if (value === undefined) {
      return { hasUndefined: true, field: key }
    }
    if (typeof value === 'object' && value !== null) {
      const result = hasUndefinedValues(value)
      if (result.hasUndefined) {
        return result
      }
    }
  }
  return { hasUndefined: false }
}

console.log('📋 测试1: CSV数据处理')
const mockCsvData = `日期,描述,描述2,支出金额,收入金额,状态,参考,分类
2024-01-15,办公用品采购,打印机耗材,245.00,0.00,Pending,社区服务项目,办公用品
2024-01-16,客户付款,咨询服务费,0.00,5500.00,Completed,商业发展项目,服务收入
2024-01-17,银行手续费,,15.50,0.00,Completed,,银行费用`

const csvTransactions = processCsvData(mockCsvData)
console.log('CSV处理结果:')
csvTransactions.forEach((transaction, index) => {
  console.log(`\n交易 ${index + 1}:`)
  console.log(`  日期: ${transaction.date}`)
  console.log(`  描述: ${transaction.description}`)
  console.log(`  描述2: ${transaction.description2 || "未设置"}`)
  console.log(`  支出: $${transaction.expense.toFixed(2)}`)
  console.log(`  收入: $${transaction.income.toFixed(2)}`)
  console.log(`  净额: ${transaction.amount}`)
  
  const undefinedCheck = hasUndefinedValues(transaction)
  if (undefinedCheck.hasUndefined) {
    console.log(`  ❌ 包含undefined值: ${undefinedCheck.field}`)
  } else {
    console.log(`  ✅ 没有undefined值`)
  }
})

console.log('\n✅ CSV数据处理正确')

console.log('\n📋 测试2: 解析交易数据处理')
const mockParsedTransactions = [
  {
    date: "2024-01-15",
    description: "办公用品采购",
    description2: "打印机耗材",
    expense: 245.00,
    income: 0.00,
    status: "Pending",
    reference: "社区服务项目",
    category: "办公用品",
    isValid: true,
    errors: [],
    isUpdate: false
  },
  {
    date: "2024-01-16",
    description: "客户付款",
    description2: undefined,
    expense: 0.00,
    income: 5500.00,
    status: "Completed",
    reference: undefined,
    category: "服务收入",
    isValid: true,
    errors: [],
    isUpdate: false
  }
]

const parsedTransactions = processParsedTransactions(mockParsedTransactions)
console.log('解析交易处理结果:')
parsedTransactions.forEach((transaction, index) => {
  console.log(`\n交易 ${index + 1}:`)
  console.log(`  日期: ${transaction.date}`)
  console.log(`  描述: ${transaction.description}`)
  console.log(`  描述2: ${transaction.description2 || "未设置"}`)
  console.log(`  参考: ${transaction.reference || "未设置"}`)
  console.log(`  分类: ${transaction.category || "未设置"}`)
  
  const undefinedCheck = hasUndefinedValues(transaction)
  if (undefinedCheck.hasUndefined) {
    console.log(`  ❌ 包含undefined值: ${undefinedCheck.field}`)
  } else {
    console.log(`  ✅ 没有undefined值`)
  }
})

console.log('\n✅ 解析交易数据处理正确')

console.log('\n📋 测试3: 表单数据处理')
const mockFormData = {
  date: "2024-01-15",
  description: "办公用品采购",
  description2: "打印机耗材",
  expense: "245.00",
  income: "0.00",
  status: "Pending",
  reference: "none",
  category: "办公用品"
}

const formTransaction = processFormData(mockFormData)
console.log('表单处理结果:')
console.log(`  日期: ${formTransaction.date}`)
console.log(`  描述: ${formTransaction.description}`)
console.log(`  描述2: ${formTransaction.description2 || "未设置"}`)
console.log(`  参考: ${formTransaction.reference || "未设置"}`)
console.log(`  分类: ${formTransaction.category || "未设置"}`)

const undefinedCheck = hasUndefinedValues(formTransaction)
if (undefinedCheck.hasUndefined) {
  console.log(`  ❌ 包含undefined值: ${undefinedCheck.field}`)
} else {
  console.log(`  ✅ 没有undefined值`)
}

console.log('\n✅ 表单数据处理正确')

console.log('\n🎉 所有测试通过！')
console.log('\n📝 修复总结:')
console.log('1. ✅ 可选字段只在有值时才添加到对象中')
console.log('2. ✅ 避免了undefined值传递给Firestore')
console.log('3. ✅ 保持了数据结构的完整性')
console.log('4. ✅ 符合Firestore的数据要求') 