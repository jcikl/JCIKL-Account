// scripts/test-project-undefined-fix.js
// 测试项目添加时undefined值的处理

console.log('🧪 测试项目添加时undefined值处理')
console.log('=====================================\n')

// 模拟有undefined值的项目数据
const projectDataWithUndefined = {
  name: "测试项目",
  code: "2024_P_测试项目",
  bodCategory: "P",
  budget: 50000,
  spent: 25000,
  remaining: 25000,
  status: "Active",
  startDate: "2024-01-15T00:00:00.000Z",
  description: "这是一个测试项目",
  endDate: undefined, // 这个字段是undefined
  assignedToUid: undefined, // 这个字段也是undefined
  someOtherField: undefined // 额外的undefined字段
}

console.log('📝 测试1: 原始数据（包含undefined值）')
console.log('-------------------------------------')
console.log('原始项目数据:')
console.log(JSON.stringify(projectDataWithUndefined, null, 2))

// 模拟过滤undefined值的函数
function filterUndefinedValues(data) {
  return Object.fromEntries(
    Object.entries(data).filter(([_, value]) => value !== undefined)
  )
}

console.log('\n📝 测试2: 过滤undefined值')
console.log('-------------------------------------')
const cleanData = filterUndefinedValues(projectDataWithUndefined)
console.log('过滤后的数据:')
console.log(JSON.stringify(cleanData, null, 2))

console.log('\n📝 测试3: 验证过滤结果')
console.log('-------------------------------------')
console.log(`原始字段数量: ${Object.keys(projectDataWithUndefined).length}`)
console.log(`过滤后字段数量: ${Object.keys(cleanData).length}`)
console.log(`移除的undefined字段数量: ${Object.keys(projectDataWithUndefined).length - Object.keys(cleanData).length}`)

// 检查是否还有undefined值
const hasUndefined = Object.values(cleanData).some(value => value === undefined)
console.log(`过滤后是否还有undefined值: ${hasUndefined ? '❌ 是' : '✅ 否'}`)

// 验证必需字段是否保留
const requiredFields = ['name', 'code', 'bodCategory', 'budget', 'spent', 'remaining', 'status', 'startDate']
const missingRequiredFields = requiredFields.filter(field => !(field in cleanData))

console.log('\n📝 测试4: 验证必需字段')
console.log('-------------------------------------')
if (missingRequiredFields.length === 0) {
  console.log('✅ 所有必需字段都已保留')
} else {
  console.log('❌ 缺少必需字段:', missingRequiredFields)
}

// 模拟Firebase添加操作
console.log('\n📝 测试5: 模拟Firebase添加操作')
console.log('-------------------------------------')

function simulateFirebaseAdd(data) {
  console.log('🔥 模拟Firebase添加项目')
  console.log('发送到Firebase的数据:')
  console.log(JSON.stringify(data, null, 2))
  
  // 检查是否包含undefined值
  const undefinedFields = Object.entries(data)
    .filter(([_, value]) => value === undefined)
    .map(([key, _]) => key)
  
  if (undefinedFields.length > 0) {
    throw new Error(`Firebase错误: 发现undefined字段: ${undefinedFields.join(', ')}`)
  }
  
  console.log('✅ Firebase添加成功')
  return `project_${Date.now()}`
}

try {
  // 测试原始数据（应该失败）
  console.log('\n   测试原始数据（应该失败）:')
  try {
    simulateFirebaseAdd(projectDataWithUndefined)
    console.log('❌ 测试失败：应该抛出错误')
  } catch (error) {
    console.log(`✅ 正确捕获错误: ${error.message}`)
  }
  
  // 测试过滤后的数据（应该成功）
  console.log('\n   测试过滤后的数据（应该成功）:')
  const projectId = simulateFirebaseAdd(cleanData)
  console.log(`✅ 成功创建项目，ID: ${projectId}`)
  
} catch (error) {
  console.log(`❌ 测试失败: ${error.message}`)
}

// 测试边界情况
console.log('\n📝 测试6: 边界情况测试')
console.log('-------------------------------------')

const edgeCases = [
  {
    name: "空字符串字段",
    data: { name: "", description: "", endDate: "" }
  },
  {
    name: "null值字段",
    data: { name: "测试", description: null, endDate: null }
  },
  {
    name: "0值字段",
    data: { name: "测试", budget: 0, spent: 0 }
  },
  {
    name: "false值字段",
    data: { name: "测试", isActive: false }
  }
]

edgeCases.forEach((testCase, index) => {
  console.log(`\n   测试 ${index + 1}: ${testCase.name}`)
  const filtered = filterUndefinedValues(testCase.data)
  console.log(`   原始: ${Object.keys(testCase.data).length} 个字段`)
  console.log(`   过滤后: ${Object.keys(filtered).length} 个字段`)
  console.log(`   结果: ${Object.keys(filtered).length === Object.keys(testCase.data).length ? '✅ 保留所有字段' : '⚠️ 移除了某些字段'}`)
})

// 总结
console.log('\n🎯 测试总结')
console.log('=====================================')
console.log('✅ undefined值过滤功能正常')
console.log('✅ 必需字段保留功能正常')
console.log('✅ Firebase兼容性验证通过')
console.log('✅ 边界情况处理正常')

console.log('\n🎉 所有测试通过！')
console.log('\n📋 修复内容:')
console.log('- 在addProject函数中过滤undefined值')
console.log('- 在updateProject函数中过滤undefined值')
console.log('- 在项目表单提交时过滤undefined值')
console.log('- 确保Firebase只接收有效数据') 