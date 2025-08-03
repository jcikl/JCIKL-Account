// scripts/test-auto-projectid.js
// 测试自动生成项目代码功能

console.log("=== 测试自动生成项目代码功能 ===")

// 模拟现有项目数据
const mockExistingProjects = [
  { projectid: "2024_P_年度晚宴", name: "年度晚宴", bodCategory: "P" },
  { projectid: "2024_HT_网站开发", name: "网站开发", bodCategory: "HT" },
  { projectid: "2024_P_年度晚宴_1", name: "年度晚宴", bodCategory: "P" },
  { projectid: "2023_EVP_活动策划", name: "活动策划", bodCategory: "EVP" }
]

// 模拟粘贴导入解析函数
function parsePasteImportData(data, format = "csv", skipHeader = true) {
  const lines = data.trim().split('\n')
  const dataLines = skipHeader ? lines.slice(1) : lines
  
  return dataLines.map((line, index) => {
    const errors = []
    let fields

    // 根据格式解析字段
    switch (format) {
      case "csv":
        fields = line.split(',').map(field => field.trim().replace(/^["']|["']$/g, ''))
        break
      case "tsv":
        fields = line.split('\t').map(field => field.trim())
        break
      default:
        fields = line.split(',').map(field => field.trim().replace(/^["']|["']$/g, ''))
    }

    // 检查字段数量 - 只有前3个字段是必需的
    if (fields.length < 3) {
      errors.push(`字段数量不足，需要至少3个字段（项目年份,项目名称,BOD分类），当前只有${fields.length}个`)
    }

    // 解析各个字段 - 新格式：项目年份,项目名称,BOD分类,预算,状态,活动日期,描述
    const [projectYearStr, name, bodCategoryStr, budgetStr, statusStr, eventDateStr, description] = fields

    // 验证项目年份（必需）
    let projectYear = new Date().getFullYear()
    if (projectYearStr) {
      const parsedYear = parseInt(projectYearStr)
      if (isNaN(parsedYear) || parsedYear < 2020 || parsedYear > 2030) {
        errors.push("项目年份无效，应在2020-2030之间")
      } else {
        projectYear = parsedYear
      }
    } else {
      errors.push("项目年份不能为空")
    }

    // 验证项目名称（必需）
    if (!name || name.trim() === "") {
      errors.push("项目名称不能为空")
    }

    // 验证BOD分类（必需）
    let bodCategory = "P"
    if (bodCategoryStr) {
      const validCategories = ["P", "HT", "EVP", "LS", "GLC", "VPI", "VPB", "VPIA", "VPC", "VPLOM"]
      if (validCategories.includes(bodCategoryStr)) {
        bodCategory = bodCategoryStr
      } else {
        errors.push("BOD分类无效")
      }
    } else {
      errors.push("BOD分类不能为空")
    }

    // 自动生成项目代码
    let projectid = ""
    if (projectYear && name && bodCategory) {
      const baseCode = `${projectYear}_${bodCategory}_${name}`
      
      // 检查代码是否已存在，如果存在则添加序号
      let finalCode = baseCode
      let counter = 1
      while (mockExistingProjects.some(p => p.projectid === finalCode)) {
        finalCode = `${baseCode}_${counter}`
        counter++
      }
      projectid = finalCode
    }

    // 验证预算（选填）
    let budget = 0
    if (budgetStr && budgetStr.trim() !== "") {
      const parsedBudget = parseFloat(budgetStr)
      if (isNaN(parsedBudget) || parsedBudget < 0) {
        errors.push("预算金额格式无效")
      } else {
        budget = parsedBudget
      }
    }

    // 验证状态（选填）
    let status = "Active"
    if (statusStr && statusStr.trim() !== "") {
      const statusLower = statusStr.toLowerCase()
      if (statusLower === "active" || statusLower === "活跃" || statusLower === "进行中") {
        status = "Active"
      } else if (statusLower === "completed" || statusLower === "已完成" || statusLower === "完成") {
        status = "Completed"
      } else if (statusLower === "on hold" || statusLower === "暂停" || statusLower === "搁置") {
        status = "On Hold"
      } else {
        errors.push("状态格式无效，应为 Active/Completed/On Hold")
      }
    }

    // 验证活动日期（选填）
    let eventDate = undefined
    if (eventDateStr && eventDateStr.trim() !== "") {
      const parsedDate = new Date(eventDateStr)
      if (isNaN(parsedDate.getTime())) {
        errors.push("活动日期格式无效")
      } else {
        eventDate = parsedDate.toISOString().split('T')[0]
      }
    }

    return {
      projectYear,
      name: name || "",
      projectid,
      bodCategory,
      budget,
      status,
      eventDate,
      description: description || "",
      isValid: errors.length === 0,
      errors
    }
  })
}

// 测试数据
const testData = `项目年份,项目名称,BOD分类,预算,状态,活动日期,描述
2024,新项目,P,50000.00,Active,2024-12-31,新项目示例
2024,年度晚宴,P,30000.00,Active,2024-06-30,重复项目测试
2025,网站开发,HT,80000.00,Active,2025-03-15,未来项目
2024,活动策划,EVP,25000.00,Completed,2024-12-31,已完成项目`

console.log("\n1. 测试自动生成项目代码:")
const results = parsePasteImportData(testData, "csv", true)
results.forEach((project, index) => {
  console.log(`\n项目 ${index + 1}:`)
  console.log(`  年份: ${project.projectYear}`)
  console.log(`  名称: ${project.name}`)
  console.log(`  自动生成的代码: ${project.projectid}`)
  console.log(`  BOD分类: ${project.bodCategory}`)
  console.log(`  预算: $${project.budget.toLocaleString()}`)
  console.log(`  状态: ${project.status}`)
  console.log(`  活动日期: ${project.eventDate || '无'}`)
  console.log(`  描述: ${project.description}`)
  console.log(`  有效: ${project.isValid ? '✅' : '❌'}`)
  if (!project.isValid) {
    console.log(`  错误: ${project.errors.join(', ')}`)
  }
})

// 测试重复项目代码处理
console.log("\n2. 测试重复项目代码处理:")
const duplicateTests = [
  "2024,年度晚宴,P,50000.00,Active,2024-12-31,第一个年度晚宴",
  "2024,年度晚宴,P,60000.00,Active,2024-12-31,第二个年度晚宴",
  "2024,年度晚宴,P,70000.00,Active,2024-12-31,第三个年度晚宴"
]

duplicateTests.forEach((testLine, index) => {
  const result = parsePasteImportData(`header\n${testLine}`, "csv", true)
  const project = result[0]
  console.log(`\n重复测试 ${index + 1}:`)
  console.log(`  项目名称: ${project.name}`)
  console.log(`  生成的代码: ${project.projectid}`)
  console.log(`  是否有效: ${project.isValid ? '✅' : '❌'}`)
})

// 测试最小数据
console.log("\n3. 测试最小数据（只有必需字段）:")
const minimalTests = [
  "2024,最小项目,P",
  "2025,另一个项目,HT",
  "2023,历史项目,EVP"
]

minimalTests.forEach((testLine, index) => {
  const result = parsePasteImportData(`header\n${testLine}`, "csv", true)
  const project = result[0]
  console.log(`\n最小数据测试 ${index + 1}:`)
  console.log(`  项目名称: ${project.name}`)
  console.log(`  生成的代码: ${project.projectid}`)
  console.log(`  预算默认值: $${project.budget}`)
  console.log(`  状态默认值: ${project.status}`)
  console.log(`  是否有效: ${project.isValid ? '✅' : '❌'}`)
})

// 测试无效数据
console.log("\n4. 测试无效数据:")
const invalidTests = [
  "2024,,P,50000.00,Active,2024-12-31,名称为空",
  "2019,无效年份,P,50000.00,Active,2024-12-31,年份太早",
  "2024,无效BOD,INVALID,50000.00,Active,2024-12-31,BOD分类无效",
  "2024,字段不足,P,字段数量不足"
]

invalidTests.forEach((testLine, index) => {
  const result = parsePasteImportData(`header\n${testLine}`, "csv", true)
  const project = result[0]
  console.log(`\n无效数据测试 ${index + 1}:`)
  console.log(`  项目名称: ${project.name || '无名称'}`)
  console.log(`  是否有效: ${project.isValid ? '✅' : '❌'}`)
  if (!project.isValid) {
    console.log(`  错误: ${project.errors.join(', ')}`)
  }
})

console.log("\n=== 测试完成 ===") 