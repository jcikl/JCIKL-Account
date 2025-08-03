// scripts/diagnose-firebase.js
// 诊断Firebase配置问题

const { initializeApp } = require('firebase/app')
const { getAuth } = require('firebase/auth')

// 测试不同的配置
const configs = [
  {
    name: '当前配置',
    config: {
      apiKey: "AIzaSyA0S70IlVSW8tzBnMHJTONdjd4PDnXpG7c",
      authDomain: "jcikl-account.firebaseapp.com",
      projectId: "jcikl-account",
      storageBucket: "jcikl-account.appspot.com",
      messagingSenderId: "337297956797",
      appId: "1:337297956797:web:7cf09cb5972f5b83afbcd4",
    }
  },
  {
    name: '备用配置1',
    config: {
      apiKey: "AIzaSyA0S70IlVSW8tzBnMHJTONdjd4PDnXpG7c",
      authDomain: "jcikl-account.firebaseapp.com",
      projectId: "jcikl-account",
      storageBucket: "jcikl-account.firebasestorage.app",
      messagingSenderId: "337297956797",
      appId: "1:337297956797:web:7cf09cb5972f5b83afbcd4",
    }
  }
]

async function diagnoseFirebase() {
  console.log('🔍 开始Firebase配置诊断...\n')
  
  for (const { name, config } of configs) {
    console.log(`📋 测试配置: ${name}`)
    console.log('配置详情:', JSON.stringify(config, null, 2))
    
    try {
      // 尝试初始化应用
      const app = initializeApp(config)
      console.log('✅ Firebase应用初始化成功')
      
      // 尝试获取Auth实例
      const auth = getAuth(app)
      console.log('✅ Firebase Auth初始化成功')
      
      console.log('✅ 配置正常\n')
      
    } catch (error) {
      console.error('❌ 配置失败:', error.message)
      console.error('错误代码:', error.code)
      console.log('')
    }
  }
  
  console.log('💡 建议检查项目:')
  console.log('1. 访问 https://console.firebase.google.com/')
  console.log('2. 选择项目: jcikl-account')
  console.log('3. 进入 Authentication > Sign-in method')
  console.log('4. 确保启用了 Email/Password 认证')
  console.log('5. 检查项目设置中的Web应用配置')
}

diagnoseFirebase() 