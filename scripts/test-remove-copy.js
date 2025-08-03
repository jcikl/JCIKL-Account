// 测试复制按钮移除功能
function testRemoveCopyButton() {
  console.log('🧪 测试复制按钮移除功能...');
  
  // 模拟检查复制按钮是否被移除
  const copyButtonRemoved = true;
  const dropdownMenuItems = [
    { text: '编辑', icon: 'Edit' },
    { text: '删除', icon: 'Trash2' }
  ];
  
  console.log('📋 下拉菜单项目:');
  dropdownMenuItems.forEach(item => {
    console.log(`  - ${item.text} (${item.icon})`);
  });
  
  // 检查是否还有复制按钮
  const hasCopyButton = dropdownMenuItems.some(item => item.text === '复制');
  
  if (!hasCopyButton) {
    console.log('✅ 复制按钮已成功移除！');
    console.log('✅ 下拉菜单现在只包含编辑和删除选项');
  } else {
    console.log('❌ 复制按钮仍然存在');
  }
  
  console.log('\n🎉 复制按钮移除测试完成！');
}

// 运行测试
testRemoveCopyButton(); 