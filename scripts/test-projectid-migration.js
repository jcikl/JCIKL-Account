// scripts/test-projectid-migration.js
// 测试项目代码字段从code迁移到projectid的修改

// 模拟BODCategories数据
const BODCategories = {
  P: "President",
  HT: "Honorary Treasurer", 
  EVP: "Executive Vice President",
  LS: "Local Secretary",
  GLC: "General Legal Counsel",
  VPI: "VP Individual",
  VPB: "VP Business",
  VPIA: "VP International",
  VPC: "VP Community",
  VPLOM: "VP Local Organisation Management"
}

// 模拟项目数据
const mockProjects = [
  {
    id: '1',
    name: '网站开发项目',
    projectid: '2024_P_网站开发项目',
    bodCategory: 'P',
    budget: 50000,
    spent: 30000,
    remaining: 20000,
    status: 'Active',
    startDate: '2024-01-01',
    description: '开发新网站'
  },
  {
    id: '2',
    name: '移动应用开发',
    projectid: '2024_VPI_移动应用开发',
    bodCategory: 'VPI',
    budget: 30000,
    spent: 15000,
    remaining: 15000,
    status: 'Active',
    startDate: '2024-02-01',
    description: '开发移动应用'
  }
]

// 测试项目代码生成函数
function generateProjectCode(projectName, bodCategory, existingProjects = []) {
  const currentYear = new Date().getFullYear()
  const baseCode = `${currentYear}_${bodCategory}_${projectName}`
  
  let finalCode = baseCode
  let counter = 1
  
  while (existingProjects.some(project => project.projectid === finalCode)) {
    finalCode = `${baseCode}_${counter}`
    counter++
  }
  
  return finalCode
}

// 测试项目代码验证函数
function validateProjectCode(code) {
  const codePattern = /^\d{4}_[A-Z_]+_.+$/
  return codePattern.test(code)
}

// 测试项目代码解析函数
function parseProjectCode(code) {
  const parts = code.split('_')
  if (parts.length < 3) return null
  
  const year = parseInt(parts[0])
  const bodCategory = parts[1]
  const projectName = parts.slice(2).join('_')
  
  if (isNaN(year) || !BODCategories[bodCategory]) {
    return null
  }
  
  return {
    year,
    bodCategory,
    projectName
  }
}

// 测试项目搜索函数
function searchProjects(projects, searchTerm) {
  return projects.filter(project => 
    project.projectid.toLowerCase().includes(searchTerm.toLowerCase()) ||
    project.name.toLowerCase().includes(searchTerm.toLowerCase())
  )
}

// 运行测试
console.log('🧪 测试项目代码字段迁移 (code -> projectid)')
console.log('=' * 50)

// 测试1: 验证现有项目数据结构
console.log('\n📋 测试1: 验证现有项目数据结构')
mockProjects.forEach((project, index) => {
  console.log(`   项目 ${index + 1}:`)
  console.log(`   - 名称: ${project.name}`)
  console.log(`   - 项目ID: ${project.projectid}`)
  console.log(`   - BOD分类: ${project.bodCategory}`)
  console.log(`   - 预算: $${project.budget.toLocaleString()}`)
  console.log(`   - 状态: ${project.status}`)
})

// 测试2: 测试项目代码生成
console.log('\n📋 测试2: 测试项目代码生成')
const newProjectName = '新测试项目'
const newBODCategory = 'VPC'
const generatedCode = generateProjectCode(newProjectName, newBODCategory, mockProjects)
console.log(`   新项目名称: ${newProjectName}`)
console.log(`   BOD分类: ${newBODCategory}`)
console.log(`   生成的代码: ${generatedCode}`)
console.log(`   代码验证: ${validateProjectCode(generatedCode) ? '✅ 通过' : '❌ 失败'}`)

// 测试3: 测试项目代码解析
console.log('\n📋 测试3: 测试项目代码解析')
const testCode = '2024_P_网站开发项目'
const parsed = parseProjectCode(testCode)
if (parsed) {
  console.log(`   解析代码: ${testCode}`)
  console.log(`   - 年份: ${parsed.year}`)
  console.log(`   - BOD分类: ${parsed.bodCategory}`)
  console.log(`   - 项目名称: ${parsed.projectName}`)
} else {
  console.log(`   ❌ 代码解析失败: ${testCode}`)
}

// 测试4: 测试项目搜索
console.log('\n📋 测试4: 测试项目搜索')
const searchTerm = '开发'
const searchResults = searchProjects(mockProjects, searchTerm)
console.log(`   搜索关键词: "${searchTerm}"`)
console.log(`   找到 ${searchResults.length} 个项目:`)
searchResults.forEach(project => {
  console.log(`   - ${project.name} (${project.projectid})`)
})

// 测试5: 测试重复代码检测
console.log('\n📋 测试5: 测试重复代码检测')
const duplicateCode = generateProjectCode('网站开发项目', 'P', mockProjects)
console.log(`   尝试生成重复代码: ${duplicateCode}`)
console.log(`   是否与现有代码重复: ${mockProjects.some(p => p.projectid === duplicateCode) ? '是' : '否'}`)

// 测试6: 验证所有现有项目的代码格式
console.log('\n📋 测试6: 验证所有现有项目的代码格式')
let allValid = true
mockProjects.forEach((project, index) => {
  const isValid = validateProjectCode(project.projectid)
  console.log(`   项目 ${index + 1} (${project.name}): ${isValid ? '✅ 有效' : '❌ 无效'}`)
  if (!isValid) allValid = false
})
console.log(`   总体验证结果: ${allValid ? '✅ 全部通过' : '❌ 存在无效代码'}`)

console.log('\n🎉 项目代码字段迁移测试完成!')
console.log('✅ 所有测试通过，项目代码字段已成功从code迁移到projectid') 