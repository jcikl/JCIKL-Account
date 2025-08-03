// scripts/test-paste-import-format.js
// 测试新的粘贴导入格式：项目年份,项目名称,项目代码,BOD分类,预算,状态,活动日期,描述

console.log("=== 测试粘贴导入格式 ===")

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

    // 检查字段数量 - 新格式：项目年份,项目名称,项目代码,BOD分类,预算,状态,活动日期,描述
    if (fields.length < 7) {
      errors.push(`字段数量不足，需要至少7个字段，当前只有${fields.length}个`)
    }

    // 解析各个字段
    const [projectYearStr, name, projectid, bodCategoryStr, budgetStr, statusStr, eventDateStr, description] = fields

    // 验证项目年份
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

    // 验证项目名称
    if (!name || name.trim() === "") {
      errors.push("项目名称不能为空")
    }

    // 验证项目代码
    if (!projectid || projectid.trim() === "") {
      errors.push("项目代码不能为空")
    }

    // 验证BOD分类
    let bodCategory = "P"
    if (bodCategoryStr) {
      const validCategories = ["P", "HT", "EVP", "LS", "GLC", "VPI", "VPB", "VPIA", "VPC", "VPLOM"]
      if (validCategories.includes(bodCategoryStr)) {
        bodCategory = bodCategoryStr
      } else {
        errors.push("BOD分类无效")
      }
    }

    // 验证预算
    let budget = 0
    if (budgetStr) {
      const parsedBudget = parseFloat(budgetStr)
      if (isNaN(parsedBudget) || parsedBudget < 0) {
        errors.push("预算金额格式无效")
      } else {
        budget = parsedBudget
      }
    } else {
      errors.push("预算金额不能为空")
    }

    // 验证状态
    let status = "Active"
    if (statusStr) {
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

    // 验证活动日期（可选）
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
      projectid: projectid || "",
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
const testData = `项目年份,项目名称,项目代码,BOD分类,预算,状态,活动日期,描述
2024,年度晚宴,2024_P_年度晚宴,P,50000.00,Active,2024-12-31,年度会员晚宴活动
2024,网站开发,2024_HT_网站开发,HT,30000.00,Active,2024-06-30,组织网站重新设计
2025,财务管理,2025_EVP_财务管理,EVP,25000.00,Active,2025-03-15,财务管理系统升级
2023,活动策划,2023_LS_活动策划,LS,15000.00,Completed,2023-12-31,年度活动策划项目`

console.log("\n1. 测试有效数据解析:")
const validResults = parsePasteImportData(testData, "csv", true)
validResults.forEach((project, index) => {
  console.log(`\n项目 ${index + 1}:`)
  console.log(`  年份: ${project.projectYear}`)
  console.log(`  名称: ${project.name}`)
  console.log(`  代码: ${project.projectid}`)
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

// 测试无效数据
const invalidData = `项目年份,项目名称,项目代码,BOD分类,预算,状态,活动日期,描述
2019,无效年份,2019_P_无效年份,P,50000.00,Active,2024-12-31,年份太早
2024,,2024_P_空名称,P,50000.00,Active,2024-12-31,名称为空
2024,无效预算,2024_P_无效预算,P,abc,Active,2024-12-31,预算格式错误
2024,无效状态,2024_P_无效状态,P,50000.00,Invalid,2024-12-31,状态无效
2024,字段不足,2024_P_字段不足,P,50000.00,Active,字段数量不足`

console.log("\n2. 测试无效数据解析:")
const invalidResults = parsePasteImportData(invalidData, "csv", true)
invalidResults.forEach((project, index) => {
  console.log(`\n项目 ${index + 1}:`)
  console.log(`  名称: ${project.name}`)
  console.log(`  有效: ${project.isValid ? '✅' : '❌'}`)
  if (!project.isValid) {
    console.log(`  错误: ${project.errors.join(', ')}`)
  }
})

// 测试格式验证
console.log("\n3. 测试格式验证:")
const formatTests = [
  "2024,项目A,2024_P_项目A,P,10000,Active,2024-12-31,描述A",
  "2025,项目B,2025_HT_项目B,HT,20000,Completed,2025-06-30,描述B",
  "2024,项目C,2024_EVP_项目C,EVP,30000,On Hold,2024-03-15,描述C"
]

formatTests.forEach((testLine, index) => {
  const result = parsePasteImportData(`header\n${testLine}`, "csv", true)
  console.log(`\n格式测试 ${index + 1}:`)
  console.log(`  输入: ${testLine}`)
  console.log(`  结果: ${result[0].isValid ? '✅ 有效' : '❌ 无效'}`)
  if (result[0].isValid) {
    console.log(`  解析: ${result[0].projectYear}_${result[0].bodCategory}_${result[0].name}`)
  }
})

console.log("\n=== 测试完成 ===") 