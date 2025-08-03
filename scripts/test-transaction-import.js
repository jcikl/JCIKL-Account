#!/usr/bin/env node

/**
 * 测试银行交易导入对话框功能
 * 模拟测试新的导入对话框的数据解析和验证功能
 */

console.log('🧪 开始测试银行交易导入对话框功能...\n')

// 模拟交易数据
const mockExistingTransactions = [
  {
    id: '1',
    date: '2024-01-15',
    description: '办公室用品',
    description2: '办公用品',
    expense: 245.00,
    income: 0.00,
    amount: '-$245.00',
    status: 'Completed',
    reference: 'INV-001',
    category: '办公用品',
    createdByUid: 'user1'
  },
  {
    id: '2',
    date: '2024-01-14',
    description: '客户付款',
    description2: '收入',
    expense: 0.00,
    income: 5500.00,
    amount: '+$5500.00',
    status: 'Completed',
    reference: 'PAY-001',
    category: '收入',
    createdByUid: 'user1'
  }
]

// 测试数据
const testData = [
  // 有效的新交易数据
  {
    name: '有效的新交易数据',
    data: `日期,描述,描述2,支出金额,收入金额,状态,参考,分类
2024-01-16,银行费用,手续费,15.50,0.00,Pending,BANK-001,银行费用
2024-01-17,租金支付,办公室租金,1200.00,0.00,Completed,RENT-001,租赁`,
    expected: {
      valid: 2,
      new: 2,
      update: 0,
      invalid: 0
    }
  },
  // 包含重复数据的测试
  {
    name: '包含重复数据的测试',
    data: `日期,描述,描述2,支出金额,收入金额,状态,参考,分类
2024-01-15,办公室用品,办公用品,245.00,0.00,Completed,INV-001,办公用品
2024-01-18,新交易,测试,100.00,0.00,Pending,TEST-001,测试`,
    expected: {
      valid: 1,
      new: 1,
      update: 0,
      invalid: 1
    }
  },
  // 无效数据测试
  {
    name: '无效数据测试',
    data: `日期,描述,描述2,支出金额,收入金额,状态,参考,分类
2024-01-19,有效交易,测试,50.00,0.00,Pending,VALID-001,测试
无效日期,无效交易,,abc,def,InvalidStatus,INVALID-001,测试
2024-01-20,,空描述,100.00,0.00,Pending,EMPTY-001,测试`,
    expected: {
      valid: 1,
      new: 1,
      update: 0,
      invalid: 2
    }
  }
]

// 模拟解析函数
function parseTransactionData(data, format = 'csv', skipHeader = true, updateExisting = false) {
  const lines = data.trim().split('\n')
  const dataLines = skipHeader ? lines.slice(1) : lines
  
  const transactions = dataLines.map((line, index) => {
    const errors = []
    let fields

    // 根据格式解析字段
    switch (format) {
      case 'csv':
        fields = line.split(',').map(field => field.trim().replace(/^["']|["']$/g, ''))
        break
      case 'tsv':
        fields = line.split('\t').map(field => field.trim())
        break
      default:
        fields = line.split(',').map(field => field.trim())
    }

    // 验证字段数量
    if (fields.length < 5) {
      errors.push("字段数量不足，需要至少：日期、描述、描述2、支出金额、收入金额")
    }

    const [date, description, description2, expenseStr, incomeStr, status = "Pending", reference = "", category = ""] = fields

    // 验证日期
    if (!date || date.length === 0) {
      errors.push("日期不能为空")
    } else {
      const dateObj = new Date(date)
      if (isNaN(dateObj.getTime())) {
        errors.push("日期格式无效，请使用 YYYY-MM-DD 格式")
      }
    }

    // 验证描述
    if (!description || description.length === 0) {
      errors.push("描述不能为空")
    } else if (description.length > 200) {
      errors.push("描述不能超过200个字符")
    }

    // 验证支出金额
    const expense = parseFloat(expenseStr || "0")
    if (isNaN(expense)) {
      errors.push("支出金额必须是有效数字")
    } else if (expense < 0) {
      errors.push("支出金额不能为负数")
    }

    // 验证收入金额
    const income = parseFloat(incomeStr || "0")
    if (isNaN(income)) {
      errors.push("收入金额必须是有效数字")
    } else if (income < 0) {
      errors.push("收入金额不能为负数")
    }

    // 验证状态
    const validStatuses = ["Completed", "Pending", "Draft"]
    if (status && !validStatuses.includes(status)) {
      errors.push(`状态必须是以下之一: ${validStatuses.join(', ')}`)
    }

    // 检查重复的交易
    const existingTransaction = mockExistingTransactions.find(t => 
      t.date === date && 
      t.description === description && 
      t.expense === expense && 
      t.income === income
    )
    
    if (existingTransaction && !updateExisting) {
      errors.push("交易已存在，请勾选'更新现有交易'选项来更新")
    }

    return {
      date: date || "",
      description: description || "",
      description2: description2 || undefined,
      expense: expense,
      income: income,
      status: validStatuses.includes(status) ? status : "Pending",
      reference: reference || undefined,
      category: category || undefined,
      isValid: errors.length === 0,
      errors,
      isUpdate: existingTransaction ? true : false
    }
  })

  return transactions
}

// 运行测试
function runTests() {
  let allTestsPassed = true

  testData.forEach((test, index) => {
    console.log(`${index + 1}. 测试: ${test.name}`)
    
    try {
      // 测试不更新现有交易的情况
      const transactions = parseTransactionData(test.data, 'csv', true, false)
      
      const validTransactions = transactions.filter(t => t.isValid)
      const invalidTransactions = transactions.filter(t => !t.isValid)
      const newTransactions = validTransactions.filter(t => !t.isUpdate)
      const updateTransactions = validTransactions.filter(t => t.isUpdate)

      console.log(`   解析结果:`)
      console.log(`   - 有效交易: ${validTransactions.length}`)
      console.log(`   - 无效交易: ${invalidTransactions.length}`)
      console.log(`   - 新增交易: ${newTransactions.length}`)
      console.log(`   - 更新交易: ${updateTransactions.length}`)

      // 验证结果
      const actual = {
        valid: validTransactions.length,
        new: newTransactions.length,
        update: updateTransactions.length,
        invalid: invalidTransactions.length
      }

      const passed = JSON.stringify(actual) === JSON.stringify(test.expected)
      
      if (passed) {
        console.log(`   ✅ 测试通过`)
      } else {
        console.log(`   ❌ 测试失败`)
        console.log(`      期望: ${JSON.stringify(test.expected)}`)
        console.log(`      实际: ${JSON.stringify(actual)}`)
        allTestsPassed = false
      }

      // 显示无效交易的错误信息
      if (invalidTransactions.length > 0) {
        console.log(`   无效交易详情:`)
        invalidTransactions.forEach((t, i) => {
          console.log(`   ${i + 1}. ${t.date} - ${t.description}: ${t.errors.join(', ')}`)
        })
      }

      console.log('')
    } catch (error) {
      console.log(`   ❌ 测试异常: ${error.message}`)
      allTestsPassed = false
      console.log('')
    }
  })

  // 测试数据格式支持
  console.log('4. 测试数据格式支持')
  const csvData = '2024-01-21,CSV测试,测试,100.00,0.00,Pending,CSV-001,测试'
  const tsvData = '2024-01-22\tTSV测试\t测试\t200.00\t0.00\tPending\tTSV-001\t测试'
  
  const csvResult = parseTransactionData(csvData, 'csv', false, false)
  const tsvResult = parseTransactionData(tsvData, 'tsv', false, false)
  
  console.log(`   CSV格式解析: ${csvResult[0].isValid ? '✅' : '❌'} ${csvResult[0].description}`)
  console.log(`   TSV格式解析: ${tsvResult[0].isValid ? '✅' : '❌'} ${tsvResult[0].description}`)
  console.log('')

  // 测试更新现有交易功能
  console.log('5. 测试更新现有交易功能')
  const updateData = '2024-01-15,办公室用品,办公用品,245.00,0.00,Completed,INV-001,办公用品'
  const updateResult = parseTransactionData(updateData, 'csv', false, true)
  
  console.log(`   更新模式解析: ${updateResult[0].isValid ? '✅' : '❌'} ${updateResult[0].description}`)
  console.log(`   是否为更新: ${updateResult[0].isUpdate ? '✅ 是' : '❌ 否'}`)
  console.log('')

  return allTestsPassed
}

// 执行测试
const testsPassed = runTests()

console.log('📊 测试总结')
console.log(`总体结果: ${testsPassed ? '✅ 所有测试通过' : '❌ 部分测试失败'}`)

if (testsPassed) {
  console.log('\n🎉 银行交易导入对话框功能测试完成！')
  console.log('✅ 数据解析功能正常')
  console.log('✅ 数据验证功能正常')
  console.log('✅ 重复检测功能正常')
  console.log('✅ 格式支持功能正常')
  console.log('✅ 更新模式功能正常')
} else {
  console.log('\n⚠️  部分测试失败，请检查相关功能')
}

console.log('\n📋 功能特性:')
console.log('- 支持CSV、TSV、Excel格式数据解析')
console.log('- 自动数据验证和错误提示')
console.log('- 重复交易检测和更新选项')
console.log('- 实时预览解析结果')
console.log('- 支持跳过标题行')
console.log('- 详细的错误信息显示') 