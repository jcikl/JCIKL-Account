// scripts/test-account-project-mapping.js
// 测试账户和项目数据的分类显示

const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs } = require('firebase/firestore');

// Firebase配置
const firebaseConfig = {
  // 这里需要您的Firebase配置
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

// 初始化Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function testAccountProjectMapping() {
  try {
    console.log('=== 测试账户和项目数据分类 ===\n');

    // 获取账户数据
    console.log('1. 获取账户数据...');
    const accountsSnapshot = await getDocs(collection(db, 'accounts'));
    const accounts = [];
    accountsSnapshot.forEach(doc => {
      accounts.push({ id: doc.id, ...doc.data() });
    });

    // 按类型分组账户
    const accountGroups = {};
    accounts.forEach(account => {
      const type = account.type;
      if (!accountGroups[type]) {
        accountGroups[type] = [];
      }
      accountGroups[type].push(account);
    });

    console.log('账户分类结果:');
    Object.entries(accountGroups).forEach(([type, typeAccounts]) => {
      console.log(`\n${type}:`);
      typeAccounts.forEach(account => {
        console.log(`  ${account.code} - ${account.name}`);
      });
    });

    // 获取项目数据
    console.log('\n\n2. 获取项目数据...');
    const projectsSnapshot = await getDocs(collection(db, 'projects'));
    const projects = [];
    projectsSnapshot.forEach(doc => {
      projects.push({ id: doc.id, ...doc.data() });
    });

    // 按BOD分类分组项目
    const projectGroups = {};
    projects.forEach(project => {
      const category = project.bodCategory || '其他';
      if (!projectGroups[category]) {
        projectGroups[category] = [];
      }
      projectGroups[category].push(project);
    });

    console.log('项目分类结果:');
    Object.entries(projectGroups).forEach(([category, categoryProjects]) => {
      console.log(`\n${category}:`);
      categoryProjects.forEach(project => {
        console.log(`  ${project.name} (${project.projectid})`);
      });
    });

    console.log('\n\n=== 测试完成 ===');
    console.log(`总共 ${accounts.length} 个账户，${projects.length} 个项目`);

  } catch (error) {
    console.error('测试失败:', error);
  }
}

// 运行测试
testAccountProjectMapping(); 