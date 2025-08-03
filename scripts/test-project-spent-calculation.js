// scripts/test-project-spent-calculation.js
// 测试项目已花费金额的计算功能

const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, doc, getDoc } = require('firebase/firestore');

// Firebase 配置
const firebaseConfig = {
  apiKey: "AIzaSyBXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef123456"
};

// 初始化 Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// 模拟 getProjectSpentAmount 函数
async function getProjectSpentAmount(projectId) {
  try {
    console.log('🔍 计算项目已花费金额:', projectId);
    
    // 获取项目信息
    const projectDoc = await getDoc(doc(db, "projects", projectId));
    if (!projectDoc.exists()) {
      console.log('❌ 项目不存在:', projectId);
      return 0;
    }
    
    const project = { id: projectDoc.id, ...projectDoc.data() };
    console.log('📋 项目信息:', {
      name: project.name,
      projectid: project.projectid
    });
    
    // 获取所有交易记录
    const transactionsSnapshot = await getDocs(collection(db, "transactions"));
    const allTransactions = transactionsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    console.log(`📊 总交易记录数: ${allTransactions.length}`);
    
    // 根据projectid匹配银行交易记录
    const projectTransactions = allTransactions.filter(transaction => {
      // 1. 精确匹配：检查交易的项目户口是否匹配项目的projectid
      const exactMatch = transaction.projectid === project.projectid;
      
      // 2. 项目名称匹配：检查交易projectid是否包含项目名称
      const nameMatch = transaction.projectid && 
                       transaction.projectid.toLowerCase().includes(project.name.toLowerCase());
      
      // 3. 项目代码匹配：检查交易projectid是否包含项目代码的关键部分
      const codeMatch = transaction.projectid && 
                       project.projectid && 
                       transaction.projectid.toLowerCase().includes(project.projectid.toLowerCase().split('_').pop() || '');
      
      const isMatch = exactMatch || nameMatch || codeMatch;
      
      if (isMatch) {
        console.log(`✅ 匹配到交易: ${transaction.description}`, {
          projectName: project.name,
          projectId: project.projectid,
          transactionProjectId: transaction.projectid,
          transactionDescription: transaction.description,
          transactionAmount: `收入: $${transaction.income}, 支出: $${transaction.expense}`,
          matchType: exactMatch ? '精确匹配' : nameMatch ? '名称匹配' : '代码匹配'
        });
      }
      
      return isMatch;
    });
    
    console.log(`📈 匹配结果: 找到 ${projectTransactions.length} 笔相关交易`);
    
    // 计算总支出
    const totalSpent = projectTransactions.reduce((sum, transaction) => sum + transaction.expense, 0);
    
    console.log(`💰 项目 ${project.name} 已花费金额: $${totalSpent.toFixed(2)}`);
    return totalSpent;
  } catch (error) {
    console.error('❌ 计算项目已花费金额时出错:', error);
    throw new Error(`Failed to calculate project spent amount: ${error}`);
  }
}

// 测试函数
async function testProjectSpentCalculation() {
  try {
    console.log('🚀 开始测试项目已花费金额计算功能...\n');
    
    // 获取所有项目
    const projectsSnapshot = await getDocs(collection(db, "projects"));
    const projects = projectsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    console.log(`📋 找到 ${projects.length} 个项目\n`);
    
    // 测试每个项目的已花费金额计算
    for (const project of projects.slice(0, 3)) { // 只测试前3个项目
      console.log(`\n🔍 测试项目: ${project.name} (ID: ${project.id})`);
      console.log(`📊 项目代码: ${project.projectid}`);
      console.log(`💰 存储的已花费: $${project.spent || 0}`);
      
      try {
        const calculatedSpent = await getProjectSpentAmount(project.id);
        console.log(`✅ 计算得出的已花费: $${calculatedSpent.toFixed(2)}`);
        
        if (project.spent !== undefined) {
          const difference = Math.abs(calculatedSpent - project.spent);
          console.log(`📊 差异: $${difference.toFixed(2)}`);
          
          if (difference < 0.01) {
            console.log('✅ 计算结果与存储值一致');
          } else {
            console.log('⚠️  计算结果与存储值不一致');
          }
        }
      } catch (error) {
        console.error(`❌ 计算项目 ${project.name} 已花费金额失败:`, error);
      }
      
      console.log('─'.repeat(50));
    }
    
    console.log('\n🎉 测试完成！');
    
  } catch (error) {
    console.error('❌ 测试失败:', error);
  }
}

// 运行测试
if (require.main === module) {
  testProjectSpentCalculation()
    .then(() => {
      console.log('✅ 测试脚本执行完成');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ 测试脚本执行失败:', error);
      process.exit(1);
    });
}

module.exports = {
  getProjectSpentAmount,
  testProjectSpentCalculation
}; 