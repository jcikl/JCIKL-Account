// scripts/test-category-management.js
// 测试收支分类管理功能

const { initializeApp } = require('firebase/app');
const { 
  getFirestore, 
  collection, 
  addDoc, 
  getDocs, 
  updateDoc, 
  deleteDoc, 
  doc, 
  query, 
  where, 
  orderBy 
} = require('firebase/firestore');

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

// 测试数据
const testCategories = [
  {
    code: "INC001",
    name: "会员费收入",
    type: "Income",
    description: "来自会员的年度会费收入",
    isActive: true,
    createdByUid: "test-user-1",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    code: "EXP001",
    name: "办公用品",
    type: "Expense",
    description: "日常办公用品和文具支出",
    isActive: true,
    createdByUid: "test-user-1",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    code: "EXP002",
    name: "差旅费",
    type: "Expense",
    description: "员工出差和商务旅行费用",
    isActive: true,
    createdByUid: "test-user-1",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    code: "INC002",
    name: "活动收入",
    type: "Income",
    description: "各类活动和培训的收入",
    isActive: true,
    createdByUid: "test-user-1",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    code: "EXP003",
    name: "设备维护",
    type: "Expense",
    description: "IT设备和办公设备的维护费用",
    isActive: false,
    createdByUid: "test-user-1",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

async function testCategoryCRUD() {
  console.log('🧪 开始测试收支分类CRUD操作...\n');

  try {
    // 1. 测试创建分类
    console.log('📝 测试创建分类...');
    const createdCategories = [];
    
    for (const categoryData of testCategories) {
      try {
        const docRef = await addDoc(collection(db, "categories"), categoryData);
        createdCategories.push({ id: docRef.id, ...categoryData });
        console.log(`✅ 成功创建分类: ${categoryData.code} - ${categoryData.name}`);
      } catch (error) {
        console.error(`❌ 创建分类失败 ${categoryData.code}:`, error.message);
      }
    }

    // 2. 测试查询所有分类
    console.log('\n📋 测试查询所有分类...');
    const allCategoriesQuery = query(collection(db, "categories"), orderBy("code"));
    const allCategoriesSnapshot = await getDocs(allCategoriesQuery);
    const allCategories = allCategoriesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    console.log(`✅ 查询到 ${allCategories.length} 个分类`);

    // 3. 测试按类型查询
    console.log('\n🔍 测试按类型查询...');
    const incomeQuery = query(
      collection(db, "categories"), 
      where("type", "==", "Income"),
      where("isActive", "==", true)
    );
    const incomeSnapshot = await getDocs(incomeQuery);
    const incomeCategories = incomeSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    console.log(`✅ 查询到 ${incomeCategories.length} 个收入分类`);

    const expenseQuery = query(
      collection(db, "categories"), 
      where("type", "==", "Expense"),
      where("isActive", "==", true)
    );
    const expenseSnapshot = await getDocs(expenseQuery);
    const expenseCategories = expenseSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    console.log(`✅ 查询到 ${expenseCategories.length} 个支出分类`);

    // 4. 测试更新分类
    console.log('\n✏️ 测试更新分类...');
    if (createdCategories.length > 0) {
      const categoryToUpdate = createdCategories[0];
      const updateData = {
        name: `${categoryToUpdate.name} (已更新)`,
        description: `${categoryToUpdate.description} - 更新时间: ${new Date().toLocaleString()}`,
        updatedAt: new Date().toISOString()
      };
      
      await updateDoc(doc(db, "categories", categoryToUpdate.id), updateData);
      console.log(`✅ 成功更新分类: ${categoryToUpdate.code}`);
    }

    // 5. 测试统计功能
    console.log('\n📊 测试统计功能...');
    const stats = {
      totalCategories: allCategories.length,
      incomeCategories: allCategories.filter(c => c.type === "Income").length,
      expenseCategories: allCategories.filter(c => c.type === "Expense").length,
      activeCategories: allCategories.filter(c => c.isActive).length,
      inactiveCategories: allCategories.filter(c => !c.isActive).length
    };
    
    console.log('📈 分类统计:');
    console.log(`   - 总分类数: ${stats.totalCategories}`);
    console.log(`   - 收入分类: ${stats.incomeCategories}`);
    console.log(`   - 支出分类: ${stats.expenseCategories}`);
    console.log(`   - 启用分类: ${stats.activeCategories}`);
    console.log(`   - 禁用分类: ${stats.inactiveCategories}`);

    // 6. 测试搜索功能（模拟）
    console.log('\n🔎 测试搜索功能...');
    const searchTerm = "办公";
    const searchResults = allCategories.filter(category => 
      category.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (category.description && category.description.toLowerCase().includes(searchTerm.toLowerCase()))
    );
    console.log(`✅ 搜索 "${searchTerm}" 找到 ${searchResults.length} 个结果`);

    // 7. 测试删除分类
    console.log('\n🗑️ 测试删除分类...');
    if (createdCategories.length > 0) {
      const categoryToDelete = createdCategories[createdCategories.length - 1];
      await deleteDoc(doc(db, "categories", categoryToDelete.id));
      console.log(`✅ 成功删除分类: ${categoryToDelete.code}`);
    }

    // 8. 验证删除结果
    console.log('\n✅ 验证删除结果...');
    const remainingCategoriesQuery = query(collection(db, "categories"), orderBy("code"));
    const remainingSnapshot = await getDocs(remainingCategoriesQuery);
    const remainingCategories = remainingSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    console.log(`✅ 删除后剩余 ${remainingCategories.length} 个分类`);

    console.log('\n🎉 所有测试完成！');

  } catch (error) {
    console.error('❌ 测试过程中发生错误:', error);
  }
}

// 运行测试
if (require.main === module) {
  testCategoryCRUD()
    .then(() => {
      console.log('\n✨ 测试脚本执行完成');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 测试脚本执行失败:', error);
      process.exit(1);
    });
}

module.exports = { testCategoryCRUD }; 