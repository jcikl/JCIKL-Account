// 测试权限修复
console.log('🧪 测试权限修复')

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
  ASSISTANT_VICE_PRESIDENT: "assistant_vice_president",
}

// 模拟权限检查函数
const hasPermission = (requiredLevel) => {
  return (user) => {
    if (!user || !user.role) return false
    const userLevel = RoleLevels[user.role] || 0
    return userLevel >= requiredLevel
  }
}

// 测试用户
const testUser = { email: "admin@jcikl.com", role: "treasurer", displayName: "Admin Treasurer" }

console.log('\n👤 测试用户信息:')
console.log(`   邮箱: ${testUser.email}`)
console.log(`   角色: ${testUser.role}`)
console.log(`   级别: ${RoleLevels[testUser.role]}`)

console.log('\n🔍 权限检查结果:')
const treasurerPermission = hasPermission(RoleLevels.TREASURER)(testUser)
const assistantVPPermission = hasPermission(RoleLevels[UserRoles.ASSISTANT_VICE_PRESIDENT])(testUser)
const combinedPermission = treasurerPermission || assistantVPPermission

console.log(`   TREASURER 权限: ${treasurerPermission ? '✅ 是' : '❌ 否'}`)
console.log(`   ASSISTANT_VICE_PRESIDENT 权限: ${assistantVPPermission ? '✅ 是' : '❌ 否'}`)
console.log(`   组合权限检查: ${combinedPermission ? '✅ 是' : '❌ 否'}`)

console.log('\n🎯 修复结果:')
if (combinedPermission) {
  console.log('✅ 权限修复成功！treasurer 用户现在可以看到粘贴导入按钮')
} else {
  console.log('❌ 权限修复失败，需要进一步检查')
}

console.log('\n💡 说明:')
console.log('- 原来的权限要求: 只有 assistant_vice_president 或更高权限')
console.log('- 修复后的权限要求: assistant_vice_president 或 treasurer 权限')
console.log('- 这样 treasurer 用户也能看到粘贴导入按钮了')

console.log('\n🎉 权限修复测试完成！') 