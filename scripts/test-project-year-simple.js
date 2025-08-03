// scripts/test-project-year-simple.js
// 简化测试项目年份功能

console.log("=== 测试项目年份功能 ===")

// 模拟项目工具函数
function generateProjectCode(projectName, bodCategory, existingProjects = [], projectYear) {
  const year = projectYear || new Date().getFullYear()
  const baseCode = `${year}_${bodCategory}_${projectName}`
  
  // 检查代码是否已存在
  let finalCode = baseCode
  let counter = 1
  
  while (existingProjects.some(project => project.projectid === finalCode)) {
    finalCode = `${baseCode}_${counter}`
    counter++
  }
  
  return finalCode
}

function validateProjectCode(code) {
  const codePattern = /^\d{4}_[A-Z_]+_.+$/
  return codePattern.test(code)
}

function parseProjectCode(code) {
  const parts = code.split('_')
  if (parts.length < 3) return null
  
  const year = parseInt(parts[0])
  const bodCategory = parts[1]
  const projectName = parts.slice(2).join('_')
  
  if (isNaN(year) || year < 2020 || year > 2030) {
    return null
  }
  
  return {
    year,
    bodCategory,
    projectName
  }
}

// 模拟项目数据
const mockProjects = [
  { projectid: "2024_P_网站开发项目" },
  { projectid: "2024_HT_财务管理项目" },
  { projectid: "2023_EVP_活动策划项目" }
]

console.log("=== 测试项目年份功能 ===")

// 测试1: 生成项目代码（使用指定年份）
console.log("\n1. 测试生成项目代码（指定年份）:")
const testProject1 = generateProjectCode("新项目", "P", mockProjects, 2025)
console.log(`项目名称: 新项目, BOD分类: P, 年份: 2025`)
console.log(`生成的projectid: ${testProject1}`)
console.log(`验证格式: ${validateProjectCode(testProject1)}`)

// 测试2: 生成项目代码（使用当前年份）
console.log("\n2. 测试生成项目代码（当前年份）:")
const testProject2 = generateProjectCode("测试项目", "HT", mockProjects)
console.log(`项目名称: 测试项目, BOD分类: HT, 年份: 当前年份`)
console.log(`生成的projectid: ${testProject2}`)
console.log(`验证格式: ${validateProjectCode(testProject2)}`)

// 测试3: 解析项目代码
console.log("\n3. 测试解析项目代码:")
const testCodes = [
  "2024_P_网站开发项目",
  "2025_HT_财务管理项目",
  "2023_EVP_活动策划项目"
]

testCodes.forEach(code => {
  const parsed = parseProjectCode(code)
  if (parsed) {
    console.log(`代码: ${code}`)
    console.log(`  年份: ${parsed.year}`)
    console.log(`  BOD分类: ${parsed.bodCategory}`)
    console.log(`  项目名称: ${parsed.projectName}`)
  } else {
    console.log(`代码: ${code} - 解析失败`)
  }
})

// 测试4: 验证项目代码格式
console.log("\n4. 测试验证项目代码格式:")
const testValidationCodes = [
  "2024_P_网站开发项目",
  "2025_HT_财务管理项目",
  "2023_EVP_活动策划项目",
  "invalid_code",
  "2024_P",
  "P_项目名称"
]

testValidationCodes.forEach(code => {
  console.log(`代码: ${code} - 有效: ${validateProjectCode(code)}`)
})

// 测试5: 测试重复项目代码处理
console.log("\n5. 测试重复项目代码处理:")
const existingProjects = [
  { projectid: "2024_P_重复项目" },
  { projectid: "2024_P_重复项目_1" }
]

const duplicateTest = generateProjectCode("重复项目", "P", existingProjects, 2024)
console.log(`项目名称: 重复项目, BOD分类: P, 年份: 2024`)
console.log(`生成的projectid: ${duplicateTest}`)

console.log("\n=== 测试完成 ===") 