// 测试拖拽排序功能
function testDragSort() {
  console.log('🧪 测试拖拽排序功能...');
  
  // 模拟交易数据
  const mockTransactions = [
    { id: '1', description: '交易1', order: 0 },
    { id: '2', description: '交易2', order: 1 },
    { id: '3', description: '交易3', order: 2 },
    { id: '4', description: '交易4', order: 3 },
  ];
  
  console.log('📋 原始交易顺序:');
  mockTransactions.forEach(t => console.log(`  ${t.order + 1}. ${t.description}`));
  
  // 模拟拖拽操作：将第3个交易移动到第1个位置
  const draggedItem = mockTransactions[2]; // 交易3
  const targetIndex = 0;
  
  // 移除拖拽的项目
  const remainingItems = mockTransactions.filter(t => t.id !== draggedItem.id);
  
  // 在目标位置插入
  remainingItems.splice(targetIndex, 0, draggedItem);
  
  // 更新order字段
  const reorderedTransactions = remainingItems.map((item, index) => ({
    ...item,
    order: index
  }));
  
  console.log('\n🔄 拖拽后的交易顺序:');
  reorderedTransactions.forEach(t => console.log(`  ${t.order + 1}. ${t.description}`));
  
  // 验证排序逻辑
  const sortedByOrder = [...reorderedTransactions].sort((a, b) => a.order - b.order);
  console.log('\n✅ 按order字段排序验证:');
  sortedByOrder.forEach(t => console.log(`  ${t.order + 1}. ${t.description}`));
  
  console.log('\n🎉 拖拽排序功能测试完成！');
}

// 测试arrayMove函数逻辑
function testArrayMove() {
  console.log('\n🧪 测试arrayMove函数逻辑...');
  
  const items = ['A', 'B', 'C', 'D'];
  console.log('原始数组:', items);
  
  // 模拟将索引2的项目移动到索引0
  const oldIndex = 2;
  const newIndex = 0;
  
  const draggedItem = items[oldIndex];
  const remainingItems = items.filter((_, index) => index !== oldIndex);
  remainingItems.splice(newIndex, 0, draggedItem);
  
  console.log('移动后数组:', remainingItems);
  console.log('✅ arrayMove逻辑测试完成！');
}

// 运行测试
testDragSort();
testArrayMove(); 