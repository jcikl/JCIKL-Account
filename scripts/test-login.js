// scripts/test-login.js
// 这个脚本用于手动测试Firebase登录功能

const { initializeApp } = require('firebase/app')
const { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword } = require('firebase/auth')

// Firebase配置
const firebaseConfig = {
  apiKey: "AIzaSyA0S70IlVSW8tzBnMHJTONdjd4PDnXpG7c",
  authDomain: "jcikl-account.firebaseapp.com",
  projectId: "jcikl-account",
  storageBucket: "jcikl-account.appspot.com",
  messagingSenderId: "337297956797",
  appId: "1:337297956797:web:7cf09cb5972f5b83afbcd4",
}

// 初始化Firebase
const app = initializeApp(firebaseConfig)
const auth = getAuth(app)

async function testLogin() {
  try {
    console.log('🔍 测试Firebase配置...')
    
    // 测试创建用户
    console.log('📝 尝试创建测试用户...')
    const testEmail = 'test@jcikl.com'
    const testPassword = 'test123456'
    
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, testEmail, testPassword)
      console.log('✅ 用户创建成功:', userCredential.user.email)
    } catch (error) {
      if (error.code === 'auth/email-already-in-use') {
        console.log('ℹ️ 用户已存在，继续测试登录...')
      } else {
        console.log('❌ 创建用户失败:', error.message)
        return
      }
    }
    
    // 测试登录
    console.log('🔐 尝试登录...')
    const loginResult = await signInWithEmailAndPassword(auth, testEmail, testPassword)
    console.log('✅ 登录成功:', loginResult.user.email)
    
    // 测试登出
    console.log('🚪 尝试登出...')
    await auth.signOut()
    console.log('✅ 登出成功')
    
    console.log('🎉 所有测试通过！Firebase配置正常。')
    
  } catch (error) {
    console.error('❌ 测试失败:', error.message)
    console.error('错误代码:', error.code)
    
    if (error.code === 'auth/configuration-not-found') {
      console.log('💡 建议检查:')
      console.log('1. Firebase项目配置是否正确')
      console.log('2. 是否启用了Email/Password认证')
      console.log('3. 网络连接是否正常')
    }
  }
}

// 运行测试
testLogin() 