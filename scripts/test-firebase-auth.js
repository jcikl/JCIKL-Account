// scripts/test-firebase-auth.js
const { initializeApp } = require('firebase/app');
const { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } = require('firebase/auth');

// Firebase 配置
const firebaseConfig = {
  apiKey: "AIzaSyA0S70IlVSW8tzBnMHJTONdjd4PDnXpG7c",
  authDomain: "jcikl-account.firebaseapp.com",
  projectId: "jcikl-account",
  storageBucket: "jcikl-account.appspot.com",
  messagingSenderId: "337297956797",
  appId: "1:337297956797:web:7cf09cb5972f5b83afbcd4",
};

console.log('🔥 开始测试 Firebase Authentication...\n');

async function testFirebaseAuth() {
  try {
    // 初始化 Firebase
    console.log('1. 初始化 Firebase...');
    const app = initializeApp(firebaseConfig);
    const auth = getAuth(app);
    console.log('✅ Firebase 初始化成功\n');

    // 测试用户信息
    const testEmail = `test-${Date.now()}@example.com`;
    const testPassword = 'TestPassword123!';
    const testDisplayName = 'Test User';

    console.log('2. 测试用户注册...');
    console.log(`   邮箱: ${testEmail}`);
    console.log(`   密码: ${testPassword}`);

    // 创建测试用户
    const userCredential = await createUserWithEmailAndPassword(auth, testEmail, testPassword);
    const user = userCredential.user;
    console.log(`✅ 用户注册成功! UID: ${user.uid}\n`);

    // 测试登出
    console.log('3. 测试用户登出...');
    await signOut(auth);
    console.log('✅ 用户登出成功\n');

    // 测试登录
    console.log('4. 测试用户登录...');
    const signInCredential = await signInWithEmailAndPassword(auth, testEmail, testPassword);
    console.log(`✅ 用户登录成功! UID: ${signInCredential.user.uid}\n`);

    // 最终登出
    console.log('5. 最终登出...');
    await signOut(auth);
    console.log('✅ 最终登出成功\n');

    console.log('🎉 所有 Firebase Authentication 测试通过!');
    console.log('\n📋 测试总结:');
    console.log('   ✅ Firebase 初始化');
    console.log('   ✅ 用户注册');
    console.log('   ✅ 用户登录');
    console.log('   ✅ 用户登出');
    console.log('\n🚀 你的 Firebase Authentication 配置正确，可以开始使用了!');

  } catch (error) {
    console.error('❌ Firebase Authentication 测试失败:');
    console.error('   错误代码:', error.code);
    console.error('   错误信息:', error.message);
    
    if (error.code === 'auth/configuration-not-found') {
      console.error('\n💡 解决方案:');
      console.error('   1. 访问 https://console.firebase.google.com/');
      console.error('   2. 选择项目: jcikl-account');
      console.error('   3. 在左侧菜单点击 "Authentication"');
      console.error('   4. 点击 "Get started"');
      console.error('   5. 在 "Sign-in method" 中启用 "Email/Password"');
      console.error('   6. 保存设置');
    } else if (error.code === 'auth/network-request-failed') {
      console.error('\n💡 网络连接问题，请检查:');
      console.error('   1. 网络连接是否正常');
      console.error('   2. 防火墙设置');
      console.error('   3. 代理设置');
    } else if (error.code === 'auth/invalid-api-key') {
      console.error('\n💡 API 密钥问题，请检查:');
      console.error('   1. Firebase 配置中的 API 密钥是否正确');
      console.error('   2. 项目设置中的 API 密钥是否匹配');
    }
  }
}

// 运行测试
testFirebaseAuth(); 