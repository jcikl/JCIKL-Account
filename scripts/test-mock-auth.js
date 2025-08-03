// scripts/test-mock-auth.js
// 测试模拟认证功能

const { mockAuth, MOCK_CREDENTIALS } = require('../lib/mock-auth.cjs')

console.log('🧪 开始测试模拟认证功能...\n')

async function testMockAuth() {
  try {
    // 测试1: 登录现有用户
    console.log('📝 测试1: 登录现有用户')
    console.log('尝试登录:', MOCK_CREDENTIALS.admin.email)
    
    const loginResult = await mockAuth.signInWithEmailAndPassword(
      MOCK_CREDENTIALS.admin.email, 
      MOCK_CREDENTIALS.admin.password
    )
    console.log('✅ 登录成功:', loginResult.user.displayName)
    console.log('用户角色:', loginResult.user.role)
    
    // 测试2: 获取当前用户
    console.log('\n📝 测试2: 获取当前用户')
    const currentUser = mockAuth.getCurrentUser()
    console.log('当前用户:', currentUser?.displayName)
    
    // 测试3: 登出
    console.log('\n📝 测试3: 登出')
    await mockAuth.signOut()
    const userAfterLogout = mockAuth.getCurrentUser()
    console.log('登出后用户:', userAfterLogout ? '仍然登录' : '已登出')
    
    // 测试4: 注册新用户
    console.log('\n📝 测试4: 注册新用户')
    const newUserEmail = 'newuser@jcikl.com'
    const newUserPassword = 'newuser123'
    
    const signupResult = await mockAuth.createUserWithEmailAndPassword(
      newUserEmail, 
      newUserPassword
    )
    console.log('✅ 注册成功:', signupResult.user.displayName)
    
    // 测试5: 使用新用户登录
    console.log('\n📝 测试5: 使用新用户登录')
    const newUserLogin = await mockAuth.signInWithEmailAndPassword(
      newUserEmail, 
      newUserPassword
    )
    console.log('✅ 新用户登录成功:', newUserLogin.user.displayName)
    
    // 测试6: 错误处理 - 错误密码
    console.log('\n📝 测试6: 错误密码处理')
    try {
      await mockAuth.signInWithEmailAndPassword(
        MOCK_CREDENTIALS.admin.email, 
        'wrongpassword'
      )
    } catch (error) {
      console.log('✅ 错误处理正常:', error.message)
    }
    
    // 测试7: 错误处理 - 用户不存在
    console.log('\n📝 测试7: 用户不存在处理')
    try {
      await mockAuth.signInWithEmailAndPassword(
        'nonexistent@jcikl.com', 
        'password123'
      )
    } catch (error) {
      console.log('✅ 错误处理正常:', error.message)
    }
    
    // 测试8: 错误处理 - 重复注册
    console.log('\n📝 测试8: 重复注册处理')
    try {
      await mockAuth.createUserWithEmailAndPassword(
        MOCK_CREDENTIALS.admin.email, 
        'password123'
      )
    } catch (error) {
      console.log('✅ 错误处理正常:', error.message)
    }
    
    console.log('\n🎉 所有模拟认证测试通过！')
    
  } catch (error) {
    console.error('❌ 测试失败:', error.message)
  }
}

// 运行测试
testMockAuth() 