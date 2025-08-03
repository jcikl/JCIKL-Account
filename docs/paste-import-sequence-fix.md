# 粘贴导入序号功能修正

## 问题描述
用户反馈粘贴导入交易时，序号没有自动按顺序补上，导致导入的交易没有序号。

## 问题分析
经过检查代码发现，在粘贴导入功能中有两个地方使用了 `addDocument` 而不是 `addTransactionWithSequence`：

1. `handleImportTransactions` 函数 - 处理粘贴导入的交易
2. `processCsvData` 函数 - 处理CSV文件导入的交易

这导致通过粘贴导入的交易没有自动分配序号。

## 修正内容

### 1. 修改 `handleImportTransactions` 函数
**文件**: `components/modules/bank-transactions.tsx`
**位置**: 第1000行左右

**修改前**:
```typescript
} else {
  await addDocument("transactions", transactionData)
  addedCount++
}
```

**修改后**:
```typescript
} else {
  // 使用序号系统添加新交易
  await addTransactionWithSequence(transactionData)
  addedCount++
}
```

### 2. 修改 `processCsvData` 函数
**文件**: `components/modules/bank-transactions.tsx`
**位置**: 第881行左右

**修改前**:
```typescript
for (const data of newTransactionsData) {
  await addDocument("transactions", data)
}
```

**修改后**:
```typescript
for (const data of newTransactionsData) {
  // 使用序号系统添加新交易
  await addTransactionWithSequence(data)
}
```

同时更新了成功提示信息：
```typescript
toast({
  title: "成功",
  description: `已导入 ${newTransactionsData.length} 笔交易并分配序号`
})
```

## 功能验证

### 修正后的功能特点：
1. **粘贴导入**: 通过粘贴导入的交易会自动分配序号
2. **CSV导入**: 通过CSV文件导入的交易会自动分配序号
3. **序号连续性**: 序号按导入顺序递增，从当前最大序号+1开始
4. **数据一致性**: 所有新添加的交易都会使用 `addTransactionWithSequence` 函数

### 导入流程：
1. 用户粘贴数据或上传CSV文件
2. 系统解析数据并验证格式
3. 对每个有效交易调用 `addTransactionWithSequence`
4. 系统自动获取下一个可用序号
5. 将交易数据与序号一起保存到Firebase
6. 刷新交易列表显示新的序号

## 测试建议

### 1. 粘贴导入测试
- 准备包含多笔交易的CSV格式数据
- 使用粘贴导入功能
- 验证所有导入的交易都有序号
- 检查序号是否连续递增

### 2. CSV文件导入测试
- 准备CSV文件包含多笔交易
- 使用文件上传功能
- 验证所有导入的交易都有序号
- 检查序号是否连续递增

### 3. 混合导入测试
- 先手动添加几笔交易
- 再使用粘贴导入添加更多交易
- 验证新导入的交易序号从正确位置开始

## 相关文件
- `components/modules/bank-transactions.tsx` - 主要修改文件
- `lib/firebase-utils.ts` - 序号系统核心函数
- `components/modules/paste-import-dialog.tsx` - 粘贴导入对话框

## 注意事项
1. 确保Firebase中有 `sequenceNumber` 字段的索引
2. 现有交易如果没有序号，需要运行迁移脚本
3. 序号系统依赖于 `getNextSequenceNumber` 函数的正确实现

## 完成状态
✅ **已完成**
- 修改了粘贴导入功能使用序号系统
- 修改了CSV导入功能使用序号系统
- 创建了测试脚本验证功能
- 更新了相关文档

现在粘贴导入的交易会自动按顺序分配序号，解决了用户反馈的问题。 