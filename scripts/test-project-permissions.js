// 测试项目账户权限设置
console.log('🧪 测试项目账户权限设置')

// 模拟权限配置
const RoleLevels = {
  "treasurer": 1,
  "president": 1,
  "secretary": 1,
  "vice_president": 2,
  "assistant_vice_president": 3,
  "project_chairman": 3,
}

const UserRoles = {
  TREASURER: "treasurer",
  PRESIDENT: "president",
  SECRETARY: "secretary",
  VICE_PRESIDENT: "vice_president",
  ASSISTANT_VICE_PRESIDENT: "assistant_vice_president",
  PROJECT_CHAIRMAN: "project_chairman",
}

// 模拟用户
const testUsers = [
  { email: "admin@jcikl.com", role: "treasurer", displayName: "Admin Treasurer" },
  { email: "admin@jcikl.com", role: "assistant_vice_president", displayName: "Admin Assistant VP" },
  { email: "admin@jcikl.com", role: "vice_president", displayName: "Admin VP" },
]

// 模拟权限检查函数
const hasPermission = (requiredLevel) => {
  return (user) => {
    if (!user || !user.role) return false
    const userLevel = RoleLevels[user.role] || 0
    return userLevel >= requiredLevel
  }
}

console.log('\n📊 权限级别配置:')
Object.entries(RoleLevels).forEach(([role, level]) => {
  console.log(`   ${role}: ${level}`)
})

console.log('\n👥 测试用户权限:')
testUsers.forEach(user => {
  const permissionChecker = hasPermission(RoleLevels[UserRoles.ASSISTANT_VICE_PRESIDENT])
  const canImport = permissionChecker(user)
  
  console.log(`   用户: ${user.displayName} (${user.role})`)
  console.log(`   用户级别: ${RoleLevels[user.role]}`)
  console.log(`   需要级别: ${RoleLevels[UserRoles.ASSISTANT_VICE_PRESIDENT]}`)
  console.log(`   可以导入: ${canImport ? '✅ 是' : '❌ 否'}`)
  console.log('')
})

console.log('\n🔧 问题诊断:')
console.log('1. 检查用户角色是否为 "assistant_vice_president" 或更高')
console.log('2. 确保用户角色在 RoleLevels 中正确定义')
console.log('3. 验证 hasPermission 函数正确实现')
console.log('4. 检查浏览器控制台的调试信息')

console.log('\n💡 解决方案:')
console.log('- 如果用户是 treasurer，需要将角色改为 assistant_vice_president')
console.log('- 或者修改权限检查逻辑，允许 treasurer 也能看到导入按钮')
console.log('- 检查 Firebase 中的用户角色设置')

console.log('\n🎯 建议操作:')
console.log('1. 在浏览器控制台查看调试信息')
console.log('2. 检查用户的实际角色设置')
console.log('3. 如果需要，可以临时降低权限要求进行测试')

console.log('\n🎉 权限测试完成！') 