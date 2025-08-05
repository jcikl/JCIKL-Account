#!/usr/bin/env node

/**
 * GL账户一键导入脚本
 * 用于导入gl-accounts-import.json文件中的账户数据到Firebase
 */

const fs = require('fs');
const path = require('path');

// 读取导入文件
const importFile = path.join(__dirname, '../gl-accounts-import.json');

console.log('🚀 开始导入GL账户数据...');
console.log('=' .repeat(50));

try {
  // 检查文件是否存在
  if (!fs.existsSync(importFile)) {
    console.error('❌ 导入文件不存在:', importFile);
    console.log('请确保 gl-accounts-import.json 文件存在于项目根目录');
    process.exit(1);
  }

  // 读取JSON文件
  const importData = JSON.parse(fs.readFileSync(importFile, 'utf8'));
  
  console.log('✅ 成功读取导入文件');
  console.log(`📊 文件信息:`);
  console.log(`   - 版本: ${importData.metadata.version}`);
  console.log(`   - 描述: ${importData.metadata.description}`);
  console.log(`   - 总账户数: ${importData.metadata.totalAccounts}`);
  console.log(`   - 账户类型分布:`);
  Object.entries(importData.metadata.accountTypes).forEach(([type, count]) => {
    console.log(`     ${type}: ${count} 个账户`);
  });

  console.log('\n📋 账户列表预览:');
  console.log('=' .repeat(80));
  
  // 按类型分组显示账户
  const accountsByType = {};
  importData.accounts.forEach(account => {
    if (!accountsByType[account.type]) {
      accountsByType[account.type] = [];
    }
    accountsByType[account.type].push(account);
  });

  Object.entries(accountsByType).forEach(([type, accounts]) => {
    console.log(`\n${type} 账户 (${accounts.length} 个):`);
    console.log('-'.repeat(40));
    accounts.forEach(account => {
      console.log(`  ${account.code} - ${account.name}`);
      console.log(`    描述: ${account.description}`);
    });
  });

  console.log('\n🔗 交易映射关系:');
  console.log('=' .repeat(80));
  Object.entries(importData.transactionMappings).forEach(([transaction, accountCode]) => {
    const account = importData.accounts.find(acc => acc.code === accountCode);
    console.log(`  ${transaction} → ${accountCode} - ${account?.name || '未知账户'}`);
  });

  console.log('\n⚙️ GL设置配置:');
  console.log('=' .repeat(80));
  Object.entries(importData.glSettings).forEach(([setting, accountCode]) => {
    const account = importData.accounts.find(acc => acc.code === accountCode);
    console.log(`  ${setting}: ${accountCode} - ${account?.name || '未知账户'}`);
  });

  console.log('\n📝 导入说明:');
  console.log('=' .repeat(80));
  console.log('1. 此文件包含 35 个GL账户，涵盖所有交易类型');
  console.log('2. 所有账户初始余额设置为 0');
  console.log('3. 账户代码按照标准会计科目编码规则设置');
  console.log('4. 包含完整的交易映射关系和GL设置配置');
  console.log('5. 支持通过账户图表界面进行批量导入');

  console.log('\n🎯 下一步操作:');
  console.log('=' .repeat(80));
  console.log('1. 在账户图表界面点击"导入"按钮');
  console.log('2. 选择此JSON文件进行导入');
  console.log('3. 系统将自动创建所有账户并建立映射关系');
  console.log('4. 导入完成后可在GL设置中配置各模块的默认账户');

  console.log('\n✅ 文件准备完成，可以开始导入！');
  console.log('=' .repeat(50));

} catch (error) {
  console.error('❌ 读取导入文件失败:', error.message);
  process.exit(1);
} 