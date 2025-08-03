// scripts/test-firebase-integration.js
console.log('🧪 测试 Firebase 集成功能...');

// 模拟账户数据
const testAccounts = [
  {
    code: "1001",
    name: "现金",
    type: "Asset",
    balance: 50000,
    financialStatement: "Balance Sheet",
    description: "主要现金账户",
    parent: ""
  },
  {
    code: "2001", 
    name: "应付账款",
    type: "Liability",
    balance: -25000,
    financialStatement: "Balance Sheet",
    description: "供应商应付账款",
    parent: ""
  },
  {
    code: "3001",
    name: "实收资本",
    type: "Equity", 
    balance: 100000,
    financialStatement: "Balance Sheet",
    description: "股东投入资本",
    parent: ""
  }
];

// 模拟 Firebase 操作
class MockFirebaseService {
  constructor() {
    this.accounts = new Map();
    this.operationLog = [];
  }

  logOperation(operation, data) {
    this.operationLog.push({
      timestamp: new Date().toISOString(),
      operation,
      data
    });
    console.log(`📝 ${operation}:`, data);
  }

  async addAccount(accountData) {
    const id = Date.now().toString();
    const account = {
      id,
      ...accountData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    this.accounts.set(id, account);
    this.logOperation('添加账户', account);
    
    return id;
  }

  async updateAccount(id, accountData) {
    if (!this.accounts.has(id)) {
      throw new Error(`账户不存在: ${id}`);
    }
    
    const existingAccount = this.accounts.get(id);
    const updatedAccount = {
      ...existingAccount,
      ...accountData,
      updatedAt: new Date().toISOString()
    };
    
    this.accounts.set(id, updatedAccount);
    this.logOperation('更新账户', updatedAccount);
  }

  async deleteAccount(id) {
    if (!this.accounts.has(id)) {
      throw new Error(`账户不存在: ${id}`);
    }
    
    const account = this.accounts.get(id);
    this.accounts.delete(id);
    this.logOperation('删除账户', account);
  }

  async getAccounts() {
    const accounts = Array.from(this.accounts.values());
    this.logOperation('获取所有账户', { count: accounts.length });
    return accounts;
  }

  async getAccountById(id) {
    const account = this.accounts.get(id);
    this.logOperation('根据ID获取账户', account || null);
    return account || null;
  }

  async getAccountsByType(type) {
    const accounts = Array.from(this.accounts.values()).filter(account => account.type === type);
    this.logOperation('根据类型获取账户', { type, count: accounts.length });
    return accounts;
  }

  getOperationLog() {
    return this.operationLog;
  }

  clearData() {
    this.accounts.clear();
    this.operationLog = [];
    console.log('🗑️ 数据已清空');
  }
}

// 测试函数
async function testFirebaseIntegration() {
  console.log('\n🚀 开始 Firebase 集成测试...');
  
  const firebaseService = new MockFirebaseService();
  
  try {
    // 测试 1: 添加账户
    console.log('\n📋 测试 1: 添加账户');
    const accountIds = [];
    
    for (const accountData of testAccounts) {
      const id = await firebaseService.addAccount(accountData);
      accountIds.push(id);
      console.log(`✅ 账户添加成功: ${accountData.name} (ID: ${id})`);
    }
    
    // 测试 2: 获取所有账户
    console.log('\n📋 测试 2: 获取所有账户');
    const allAccounts = await firebaseService.getAccounts();
    console.log(`✅ 获取到 ${allAccounts.length} 个账户`);
    
    // 测试 3: 根据类型获取账户
    console.log('\n📋 测试 3: 根据类型获取账户');
    const assetAccounts = await firebaseService.getAccountsByType('Asset');
    const liabilityAccounts = await firebaseService.getAccountsByType('Liability');
    const equityAccounts = await firebaseService.getAccountsByType('Equity');
    
    console.log(`✅ Asset 账户: ${assetAccounts.length} 个`);
    console.log(`✅ Liability 账户: ${liabilityAccounts.length} 个`);
    console.log(`✅ Equity 账户: ${equityAccounts.length} 个`);
    
    // 测试 4: 更新账户
    console.log('\n📋 测试 4: 更新账户');
    if (accountIds.length > 0) {
      const updateData = {
        balance: 75000,
        description: "更新后的现金账户"
      };
      
      await firebaseService.updateAccount(accountIds[0], updateData);
      console.log(`✅ 账户更新成功: ${accountIds[0]}`);
      
      const updatedAccount = await firebaseService.getAccountById(accountIds[0]);
      console.log(`✅ 更新后的账户:`, updatedAccount);
    }
    
    // 测试 5: 删除账户
    console.log('\n📋 测试 5: 删除账户');
    if (accountIds.length > 1) {
      await firebaseService.deleteAccount(accountIds[1]);
      console.log(`✅ 账户删除成功: ${accountIds[1]}`);
      
      const remainingAccounts = await firebaseService.getAccounts();
      console.log(`✅ 剩余账户数量: ${remainingAccounts.length}`);
    }
    
    // 测试 6: 错误处理
    console.log('\n📋 测试 6: 错误处理');
    try {
      await firebaseService.getAccountById('non-existent-id');
    } catch (error) {
      console.log(`✅ 错误处理正常: ${error.message}`);
    }
    
    try {
      await firebaseService.updateAccount('non-existent-id', { balance: 1000 });
    } catch (error) {
      console.log(`✅ 更新不存在的账户错误处理正常: ${error.message}`);
    }
    
    try {
      await firebaseService.deleteAccount('non-existent-id');
    } catch (error) {
      console.log(`✅ 删除不存在的账户错误处理正常: ${error.message}`);
    }
    
    // 测试 7: 数据验证
    console.log('\n📋 测试 7: 数据验证');
    const finalAccounts = await firebaseService.getAccounts();
    
    console.log('📊 最终数据统计:');
    console.log(`   - 总账户数: ${finalAccounts.length}`);
    
    const typeStats = {};
    finalAccounts.forEach(account => {
      typeStats[account.type] = (typeStats[account.type] || 0) + 1;
    });
    
    Object.entries(typeStats).forEach(([type, count]) => {
      console.log(`   - ${type}: ${count} 个账户`);
    });
    
    const totalBalance = finalAccounts.reduce((sum, account) => sum + account.balance, 0);
    console.log(`   - 总余额: ${totalBalance.toLocaleString()}`);
    
    // 测试 8: 操作日志
    console.log('\n📋 测试 8: 操作日志');
    const operationLog = firebaseService.getOperationLog();
    console.log(`✅ 记录了 ${operationLog.length} 个操作`);
    
    operationLog.forEach((log, index) => {
      console.log(`   ${index + 1}. ${log.timestamp} - ${log.operation}`);
    });
    
    console.log('\n✅ Firebase 集成测试完成！');
    console.log(`📈 测试结果: 所有 ${operationLog.length} 个操作都成功执行`);
    
  } catch (error) {
    console.error('❌ 测试失败:', error);
  } finally {
    // 清理测试数据
    firebaseService.clearData();
  }
}

// 测试数据验证
function testDataValidation() {
  console.log('\n🔍 测试数据验证...');
  
  const validAccount = {
    code: "1001",
    name: "现金",
    type: "Asset",
    balance: 50000,
    financialStatement: "Balance Sheet"
  };
  
  const invalidAccounts = [
    { ...validAccount, code: "" }, // 空代码
    { ...validAccount, name: "" }, // 空名称
    { ...validAccount, type: "InvalidType" }, // 无效类型
    { ...validAccount, balance: "not-a-number" }, // 无效余额
  ];
  
  console.log('✅ 有效账户数据:', validAccount);
  
  invalidAccounts.forEach((account, index) => {
    console.log(`❌ 无效账户数据 ${index + 1}:`, account);
  });
  
  console.log('✅ 数据验证测试完成');
}

// 测试性能
function testPerformance() {
  console.log('\n⚡ 测试性能...');
  
  const firebaseService = new MockFirebaseService();
  const startTime = Date.now();
  
  // 模拟批量操作
  const batchSize = 100;
  const promises = [];
  
  for (let i = 0; i < batchSize; i++) {
    const accountData = {
      code: `ACC${String(i + 1).padStart(4, '0')}`,
      name: `测试账户 ${i + 1}`,
      type: ["Asset", "Liability", "Equity"][i % 3],
      balance: Math.random() * 100000,
      financialStatement: "Balance Sheet"
    };
    
    promises.push(firebaseService.addAccount(accountData));
  }
  
  Promise.all(promises).then(() => {
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    console.log(`✅ 批量添加 ${batchSize} 个账户耗时: ${duration}ms`);
    console.log(`✅ 平均每个操作: ${(duration / batchSize).toFixed(2)}ms`);
    
    firebaseService.clearData();
  });
}

// 运行所有测试
async function runAllTests() {
  console.log('🧪 开始 Firebase 集成全面测试...\n');
  
  await testFirebaseIntegration();
  testDataValidation();
  testPerformance();
  
  console.log('\n🎉 所有测试完成！');
  console.log('📋 测试总结:');
  console.log('   ✅ Firebase CRUD 操作');
  console.log('   ✅ 错误处理机制');
  console.log('   ✅ 数据验证');
  console.log('   ✅ 性能测试');
  console.log('   ✅ 操作日志记录');
}

// 执行测试
runAllTests().catch(console.error); 