/**
 * 第八阶段：导入功能增强测试脚本
 * 测试多账户银行交易系统的导入功能
 */

const { initializeApp } = require('firebase/app')
const { getFirestore, collection, getDocs, query, where, orderBy } = require('firebase/firestore')

// Firebase 配置 (Placeholder - actual project config needed for full Firebase test)
const firebaseConfig = {
  apiKey: "AIzaSyBXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef123456"
}

// 初始化 Firebase
const app = initializeApp(firebaseConfig)
const db = getFirestore(app)

/**
 * 模拟数据解析函数 (Mirrors frontend logic)
 */
function parseImportData(data, format, skipHeader, bankAccountId) {
  console.log('📊 开始解析导入数据...')
  
  const lines = data.trim().split('\n')
  if (lines.length === 0) {
    throw new Error("没有找到有效的数据行")
  }

  // 跳过标题行
  const dataLines = skipHeader ? lines.slice(1) : lines
  
  // 根据格式确定分隔符
  let delimiter = ","
  if (format === "tsv") delimiter = "\t"
  
  const transactions = dataLines.map((line, index) => {
    const lineNumber = skipHeader ? index + 2 : index + 1
    const errors = []
    
    const values = line.split(delimiter).map(v => v.trim().replace(/"/g, ""))
    
    // 验证字段数量
    if (values.length < 5) {
      errors.push(`第${lineNumber}行: 字段数量不足，至少需要5个字段`)
      return {
        date: "",
        description: "",
        expense: 0,
        income: 0,
        status: "Pending",
        bankAccountId,
        isValid: false,
        errors,
        isUpdate: false
      }
    }

    const [date, description, description2, expenseStr, incomeStr, status, payer, projectName, category] = values

    // 验证日期
    if (!date) {
      errors.push(`第${lineNumber}行: 日期不能为空`)
    } else {
      const dateObj = new Date(date)
      if (isNaN(dateObj.getTime())) {
        errors.push(`第${lineNumber}行: 日期格式无效，请使用YYYY-MM-DD格式`)
      }
    }

    // 验证描述
    if (!description) {
      errors.push(`第${lineNumber}行: 描述不能为空`)
    } else if (description.length > 200) {
      errors.push(`第${lineNumber}行: 描述长度不能超过200个字符`)
    }

    // 验证金额
    const expense = parseFloat(expenseStr || "0")
    const income = parseFloat(incomeStr || "0")
    
    if (isNaN(expense) || expense < 0) {
      errors.push(`第${lineNumber}行: 支出金额无效`)
    }
    if (isNaN(income) || income < 0) {
      errors.push(`第${lineNumber}行: 收入金额无效`)
    }
    if (expense > 0 && income > 0) {
      errors.push(`第${lineNumber}行: 支出和收入不能同时大于0`)
    }

    // 验证状态
    let validStatus = "Pending"
    if (status) {
      const statusLower = status.toLowerCase()
      if (statusLower === "completed" || statusLower === "已完成") {
        validStatus = "Completed"
      } else if (statusLower === "pending" || statusLower === "待处理") {
        validStatus = "Pending"
      } else if (statusLower === "draft" || statusLower === "草稿") {
        validStatus = "Draft"
      } else {
        errors.push(`第${lineNumber}行: 状态值无效，应为Completed/Pending/Draft或已完成/待处理/草稿`)
      }
    }

    return {
      date,
      description,
      description2: description2 || undefined,
      expense,
      income,
      status: validStatus,
      payer: payer || undefined,
      projectid: "",
      projectName: projectName || undefined,
      category: category || undefined,
      bankAccountId,
      isValid: errors.length === 0,
      errors,
      isUpdate: false
    }
  })

  console.log('✅ 数据解析完成')
  
  return transactions
}

/**
 * 测试CSV格式数据解析
 */
function testCSVFormatParsing() {
  console.log('\n🧪 测试CSV格式数据解析...')
  
  const csvData = `日期,描述,描述2,支出金额,收入金额,状态,付款人,项目名称,分类
2024-01-15,办公室用品,办公用品,245.00,0.00,Pending,张三,项目A,办公用品
2024-01-16,销售收入,产品销售,0.00,1500.00,Completed,李四,项目B,销售收入
2024-01-17,交通费,出差费用,120.00,0.00,Completed,王五,项目C,交通费`

  const transactions = parseImportData(csvData, "csv", true, "bank-account-1")
  
  console.log(`解析结果: ${transactions.length} 条记录`)
  console.log(`有效记录: ${transactions.filter(t => t.isValid).length} 条`)
  console.log(`无效记录: ${transactions.filter(t => !t.isValid).length} 条`)
  
  // 验证第一条记录
  const firstTransaction = transactions[0]
  console.log('第一条记录验证:')
  console.log(`- 日期: ${firstTransaction.date}`)
  console.log(`- 描述: ${firstTransaction.description}`)
  console.log(`- 支出: ${firstTransaction.expense}`)
  console.log(`- 收入: ${firstTransaction.income}`)
  console.log(`- 状态: ${firstTransaction.status}`)
  console.log(`- 是否有效: ${firstTransaction.isValid}`)
  
  return transactions
}

/**
 * 测试TSV格式数据解析
 */
function testTSVFormatParsing() {
  console.log('\n🧪 测试TSV格式数据解析...')
  
  const tsvData = `日期	描述	描述2	支出金额	收入金额	状态	付款人	项目名称	分类
2024-01-15	办公室用品	办公用品	245.00	0.00	Pending	张三	项目A	办公用品
2024-01-16	销售收入	产品销售	0.00	1500.00	Completed	李四	项目B	销售收入`

  const transactions = parseImportData(tsvData, "tsv", true, "bank-account-2")
  
  console.log(`解析结果: ${transactions.length} 条记录`)
  console.log(`有效记录: ${transactions.filter(t => t.isValid).length} 条`)
  
  return transactions
}

/**
 * 测试错误数据处理
 */
function testErrorDataHandling() {
  console.log('\n🧪 测试错误数据处理...')
  
  const errorData = `日期,描述,描述2,支出金额,收入金额,状态,付款人,项目名称,分类
2024-01-15,,办公用品,245.00,0.00,Pending,张三,项目A,办公用品
2024-01-16,销售收入,产品销售,abc,1500.00,Completed,李四,项目B,销售收入
2024-01-17,交通费,出差费用,120.00,50.00,Invalid,王五,项目C,交通费
2024-01-18,测试交易,测试,100.00,0.00,Completed,测试,项目D,测试分类`

  const transactions = parseImportData(errorData, "csv", true, "bank-account-3")
  
  console.log(`解析结果: ${transactions.length} 条记录`)
  console.log(`有效记录: ${transactions.filter(t => t.isValid).length} 条`)
  console.log(`无效记录: ${transactions.filter(t => !t.isValid).length} 条`)
  
  // 显示错误信息
  transactions.forEach((transaction, index) => {
    if (!transaction.isValid) {
      console.log(`第${index + 1}条记录错误:`)
      transaction.errors.forEach(error => console.log(`  - ${error}`))
    }
  })
  
  return transactions
}

/**
 * 测试重复检测功能
 */
function testDuplicateDetection() {
  console.log('\n🧪 测试重复检测功能...')
  
  const existingTransactions = [
    {
      id: "1",
      date: "2024-01-15",
      description: "办公室用品",
      bankAccountId: "bank-account-1"
    },
    {
      id: "2", 
      date: "2024-01-16",
      description: "销售收入",
      bankAccountId: "bank-account-1"
    }
  ]
  
  const importData = `日期,描述,描述2,支出金额,收入金额,状态,付款人,项目名称,分类
2024-01-15,办公室用品,办公用品,245.00,0.00,Pending,张三,项目A,办公用品
2024-01-16,销售收入,产品销售,0.00,1500.00,Completed,李四,项目B,销售收入
2024-01-17,新交易,新交易描述,100.00,0.00,Completed,新用户,项目C,新分类`

  const transactions = parseImportData(importData, "csv", true, "bank-account-1")
  
  // 模拟重复检测
  const processedTransactions = transactions.map(transaction => {
    const existingTransaction = existingTransactions.find(t => 
      t.date === transaction.date && 
      t.description === transaction.description &&
      t.bankAccountId === transaction.bankAccountId
    )
    
    if (existingTransaction) {
      return {
        ...transaction,
        isUpdate: true,
        originalId: existingTransaction.id
      }
    }
    
    return transaction
  })
  
  console.log(`解析结果: ${processedTransactions.length} 条记录`)
  console.log(`新增记录: ${processedTransactions.filter(t => !t.isUpdate).length} 条`)
  console.log(`更新记录: ${processedTransactions.filter(t => t.isUpdate).length} 条`)
  
  return processedTransactions
}

/**
 * 测试性能
 */
function testPerformance() {
  console.log('\n🧪 测试解析性能...')
  
  // 生成大量测试数据
  const generateTestData = (count) => {
    const headers = "日期,描述,描述2,支出金额,收入金额,状态,付款人,项目名称,分类\n"
    const rows = []
    
    for (let i = 0; i < count; i++) {
      const date = new Date(2024, 0, 15 + i).toISOString().split('T')[0]
      const isExpense = Math.random() > 0.5
      const amount = Math.floor(Math.random() * 1000) + 1
      
      rows.push(`${date},交易${i + 1},描述${i + 1},${isExpense ? amount : 0},${isExpense ? 0 : amount},Completed,用户${i + 1},项目${i + 1},分类${i + 1}`)
    }
    
    return headers + rows.join('\n')
  }
  
  const testData = generateTestData(1000)
  
  const startTime = Date.now()
  const transactions = parseImportData(testData, "csv", true, "bank-account-1")
  const endTime = Date.now()
  
  console.log(`解析 ${transactions.length} 条记录耗时: ${endTime - startTime}ms`)
  console.log(`平均每条记录: ${((endTime - startTime) / transactions.length).toFixed(2)}ms`)
  
  return transactions
}

/**
 * 主测试函数
 */
async function main() {
  console.log('🚀 开始第八阶段导入功能增强测试...')
  
  try {
    // 测试CSV格式解析
    testCSVFormatParsing()
    
    // 测试TSV格式解析
    testTSVFormatParsing()
    
    // 测试错误数据处理
    testErrorDataHandling()
    
    // 测试重复检测
    testDuplicateDetection()
    
    // 测试性能
    testPerformance()
    
    console.log('\n✅ 第八阶段导入功能增强测试完成')
    
  } catch (error) {
    console.error('❌ 测试过程中发生错误:', error.message)
  }
}

// 运行测试
if (require.main === module) {
  main()
}

module.exports = {
  parseImportData,
  testCSVFormatParsing,
  testTSVFormatParsing,
  testErrorDataHandling,
  testDuplicateDetection,
  testPerformance
} 