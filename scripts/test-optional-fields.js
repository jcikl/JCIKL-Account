// scripts/test-optional-fields.js
// 测试粘贴导入中选填字段的验证逻辑

console.log("=== 测试选填字段验证逻辑 ===")

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

    // 检查字段数量 - 只有前4个字段是必需的
    if (fields.length < 4) {
      errors.push(`字段数量不足，需要至少4个字段（项目年份,项目名称,项目代码,BOD分类），当前只有${fields.length}个`)
    }

    // 解析各个字段
    const [projectYearStr, name, projectid, bodCategoryStr, budgetStr, statusStr, eventDateStr, description] = fields

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

    // 验证项目代码（必需）
    if (!projectid || projectid.trim() === "") {
      errors.push("项目代码不能为空")
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
    // 如果预算为空或无效，使用默认值0

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
    // 如果状态为空或无效，使用默认值"Active"

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
2024,完整项目,2024_P_完整项目,P,50000.00,Active,2024-12-31,完整数据示例
2024,必需字段项目,2024_HT_必需字段项目,HT,,,,
2025,部分选填项目,2025_EVP_部分选填项目,EVP,30000.00,Completed,,
2023,最小数据项目,2023_LS_最小数据项目,LS,,,,`

console.log("\n1. 测试完整数据:")
const completeResults = parsePasteImportData(testData, "csv", true)
completeResults.forEach((project, index) => {
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
2024,字段不足项目,2024_P_字段不足项目,P
2024,无效年份项目,2019_P_无效年份项目,P,50000.00,Active,2024-12-31,年份太早
2024,空名称项目,,P,50000.00,Active,2024-12-31,名称为空
2024,无效BOD项目,2024_P_无效BOD项目,INVALID,50000.00,Active,2024-12-31,BOD分类无效
2024,无效预算项目,2024_P_无效预算项目,P,abc,Active,2024-12-31,预算格式错误
2024,无效状态项目,2024_P_无效状态项目,P,50000.00,Invalid,2024-12-31,状态无效`

console.log("\n2. 测试无效数据:")
const invalidResults = parsePasteImportData(invalidData, "csv", true)
invalidResults.forEach((project, index) => {
  console.log(`\n项目 ${index + 1}:`)
  console.log(`  名称: ${project.name || '无名称'}`)
  console.log(`  有效: ${project.isValid ? '✅' : '❌'}`)
  if (!project.isValid) {
    console.log(`  错误: ${project.errors.join(', ')}`)
  }
})

// 测试选填字段的默认值
console.log("\n3. 测试选填字段默认值:")
const defaultValueTests = [
  "2024,默认预算项目,2024_P_默认预算项目,P,,,,",
  "2024,默认状态项目,2024_HT_默认状态项目,HT,30000.00,,,",
  "2024,默认日期项目,2024_EVP_默认日期项目,EVP,25000.00,Active,,",
  "2024,默认描述项目,2024_LS_默认描述项目,LS,15000.00,Completed,2024-06-30,"
]

defaultValueTests.forEach((testLine, index) => {
  const result = parsePasteImportData(`header\n${testLine}`, "csv", true)
  const project = result[0]
  console.log(`\n测试 ${index + 1}:`)
  console.log(`  项目: ${project.name}`)
  console.log(`  预算默认值: $${project.budget}`)
  console.log(`  状态默认值: ${project.status}`)
  console.log(`  活动日期: ${project.eventDate || '无'}`)
  console.log(`  描述: ${project.description || '无'}`)
  console.log(`  有效: ${project.isValid ? '✅' : '❌'}`)
})

console.log("\n=== 测试完成 ===") 