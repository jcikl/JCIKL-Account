// scripts/test-custom-auth.js
// 测试自定义认证系统

const { initializeApp } = require('firebase/app')
const { getFirestore, collection, query, where, getDocs, doc, setDoc, deleteDoc } = require('firebase/firestore')

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
const db = getFirestore(app)

// 简单的密码哈希函数（与前端保持一致）
function hashPassword(password) {
  let hash = 0
  for (let i = 0; i < password.length; i++) {
    const char = password.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash
  }
  return hash.toString()
}

async function testCustomAuth() {
  try {
    console.log('🔍 测试自定义认证系统...')
    
    const testEmail = 'test@jcikl.com'
    const testPassword = 'test123456'
    const testDisplayName = '测试用户'
    const testRole = 'ASSISTANT_VICE_PRESIDENT'
    
    // 1. 测试用户注册
    console.log('📝 测试用户注册...')
    const newUser = {
      uid: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      email: testEmail,
      displayName: testDisplayName,
      role: testRole,
      createdAt: new Date().toISOString(),
      lastLogin: new Date().toISOString(),
      passwordHash: hashPassword(testPassword)
    }
    
    await setDoc(doc(db, 'users', newUser.uid), newUser)
    console.log('✅ 用户注册成功:', newUser.email)
    
    // 2. 测试用户登录
    console.log('🔐 测试用户登录...')
    const usersRef = collection(db, 'users')
    const q = query(usersRef, where('email', '==', testEmail))
    const querySnapshot = await getDocs(q)
    
    if (querySnapshot.empty) {
      throw new Error('用户不存在')
    }
    
    const userDoc = querySnapshot.docs[0]
    const userData = userDoc.data()
    
    // 验证密码
    const hashedPassword = hashPassword(testPassword)
    if (userData.passwordHash !== hashedPassword) {
      throw new Error('密码验证失败')
    }
    
    console.log('✅ 用户登录成功:', userData.email)
    console.log('用户信息:', {
      uid: userData.uid,
      email: userData.email,
      displayName: userData.displayName,
      role: userData.role
    })
    
    // 3. 测试错误密码
    console.log('❌ 测试错误密码...')
    const wrongPassword = 'wrongpassword'
    const wrongHashedPassword = hashPassword(wrongPassword)
    
    if (userData.passwordHash === wrongHashedPassword) {
      throw new Error('密码验证逻辑有误')
    }
    console.log('✅ 错误密码被正确拒绝')
    
    // 4. 测试不存在的用户
    console.log('❌ 测试不存在的用户...')
    const nonExistentQuery = query(usersRef, where('email', '==', 'nonexistent@example.com'))
    const nonExistentSnapshot = await getDocs(nonExistentQuery)
    
    if (!nonExistentSnapshot.empty) {
      throw new Error('不存在的用户查询返回了结果')
    }
    console.log('✅ 不存在的用户被正确识别')
    
    // 5. 清理测试数据
    console.log('🧹 清理测试数据...')
    await deleteDoc(doc(db, 'users', newUser.uid))
    console.log('✅ 测试数据已清理')
    
    console.log('🎉 所有测试通过！自定义认证系统工作正常。')
    
  } catch (error) {
    console.error('❌ 测试失败:', error.message)
    console.error('错误详情:', error)
  }
}

// 运行测试
testCustomAuth() 