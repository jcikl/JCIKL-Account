// scripts/test-project-year-filter.js
// 测试项目年份筛选功能

console.log("=== 测试项目年份筛选功能 ===")

// 模拟项目数据
const mockProjects = [
  { projectid: "2024_P_网站开发项目", name: "网站开发项目", bodCategory: "P", budget: 50000, status: "Active" },
  { projectid: "2024_HT_财务管理项目", name: "财务管理项目", bodCategory: "HT", budget: 30000, status: "Active" },
  { projectid: "2023_EVP_活动策划项目", name: "活动策划项目", bodCategory: "EVP", budget: 25000, status: "Completed" },
  { projectid: "2025_LS_新项目", name: "新项目", bodCategory: "LS", budget: 15000, status: "Active" },
  { projectid: "2024_VPI_测试项目", name: "测试项目", bodCategory: "VPI", budget: 80000, status: "On Hold" }
]

// 模拟筛选函数
function filterProjects(projects, filters) {
  let filtered = projects

  // 搜索筛选
  if (filters.search) {
    filtered = filtered.filter(project =>
      project.name.toLowerCase().includes(filters.search.toLowerCase()) ||
      project.projectid.toLowerCase().includes(filters.search.toLowerCase())
    )
  }

  // 状态筛选
  if (filters.status !== "all") {
    filtered = filtered.filter(project => project.status === filters.status)
  }

  // BOD分类筛选
  if (filters.bodCategory !== "all") {
    filtered = filtered.filter(project => project.bodCategory === filters.bodCategory)
  }

  // 项目年份筛选
  if (filters.projectYear !== "all") {
    filtered = filtered.filter(project => {
      const projectYear = project.projectid.split('_')[0]
      return projectYear === filters.projectYear
    })
  }

  // 预算范围筛选
  if (filters.budgetRange !== "all") {
    filtered = filtered.filter(project => {
      switch (filters.budgetRange) {
        case "low":
          return project.budget <= 10000
        case "medium":
          return project.budget > 10000 && project.budget <= 100000
        case "high":
          return project.budget > 100000
        default:
          return true
      }
    })
  }

  return filtered
}

// 获取可用的项目年份
function getAvailableProjectYears(projects) {
  const years = new Set()
  projects.forEach(project => {
    const projectYear = project.projectid.split('_')[0]
    if (projectYear && !isNaN(parseInt(projectYear))) {
      years.add(projectYear)
    }
  })
  return Array.from(years).sort((a, b) => parseInt(b) - parseInt(a))
}

console.log("\n1. 测试获取可用年份:")
const availableYears = getAvailableProjectYears(mockProjects)
console.log("可用年份:", availableYears)

console.log("\n2. 测试年份筛选:")
const yearFilters = [
  { search: "", status: "all", bodCategory: "all", projectYear: "all", budgetRange: "all" },
  { search: "", status: "all", bodCategory: "all", projectYear: "2024", budgetRange: "all" },
  { search: "", status: "all", bodCategory: "all", projectYear: "2023", budgetRange: "all" },
  { search: "", status: "all", bodCategory: "all", projectYear: "2025", budgetRange: "all" }
]

yearFilters.forEach((filter, index) => {
  const result = filterProjects(mockProjects, filter)
  console.log(`\n筛选条件 ${index + 1}:`, filter.projectYear === "all" ? "所有年份" : `${filter.projectYear}年`)
  console.log("结果项目数量:", result.length)
  result.forEach(project => {
    console.log(`  - ${project.name} (${project.projectid})`)
  })
})

console.log("\n3. 测试组合筛选:")
const combinedFilters = [
  { search: "", status: "Active", bodCategory: "all", projectYear: "2024", budgetRange: "all" },
  { search: "项目", status: "all", bodCategory: "P", projectYear: "all", budgetRange: "all" },
  { search: "", status: "all", bodCategory: "all", projectYear: "2024", budgetRange: "medium" }
]

combinedFilters.forEach((filter, index) => {
  const result = filterProjects(mockProjects, filter)
  console.log(`\n组合筛选 ${index + 1}:`)
  console.log("筛选条件:", {
    年份: filter.projectYear === "all" ? "所有" : filter.projectYear,
    状态: filter.status === "all" ? "所有" : filter.status,
    BOD分类: filter.bodCategory === "all" ? "所有" : filter.bodCategory,
    预算: filter.budgetRange === "all" ? "所有" : filter.budgetRange
  })
  console.log("结果项目数量:", result.length)
  result.forEach(project => {
    console.log(`  - ${project.name} (${project.projectid}) - ${project.status} - $${project.budget}`)
  })
})

console.log("\n4. 测试搜索和年份组合:")
const searchYearFilters = [
  { search: "网站", status: "all", bodCategory: "all", projectYear: "2024", budgetRange: "all" },
  { search: "项目", status: "all", bodCategory: "all", projectYear: "2023", budgetRange: "all" }
]

searchYearFilters.forEach((filter, index) => {
  const result = filterProjects(mockProjects, filter)
  console.log(`\n搜索+年份筛选 ${index + 1}:`)
  console.log("搜索词:", filter.search)
  console.log("年份:", filter.projectYear === "all" ? "所有" : filter.projectYear)
  console.log("结果项目数量:", result.length)
  result.forEach(project => {
    console.log(`  - ${project.name} (${project.projectid})`)
  })
})

console.log("\n=== 测试完成 ===") 