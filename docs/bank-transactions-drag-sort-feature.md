# 银行交易拖拽排序功能实现

## 功能概述

为银行交易模块添加了拖拽排序功能，允许用户通过点击"编辑排序"按钮进入排序模式，然后通过拖拽来调整交易记录的顺序，并保存到数据库中。

## 主要特性

### 1. 编辑排序模式
- **编辑排序按钮**: 点击"编辑排序"按钮进入排序模式
- **拖拽排序**: 在排序模式下，每行交易记录左侧显示拖拽手柄（GripVertical图标）
- **退出编辑**: 可以随时点击"退出编辑"按钮退出排序模式
- **拖拽时显示半透明效果**

### 2. 排序管理
- **保存排序**: 将调整后的顺序保存到数据库的 `order` 字段，保存后自动退出编辑模式
- **重置排序**: 恢复到原始排序状态，重置后自动退出编辑模式
- **自动排序**: 加载时按 `order` 字段排序，如果没有则按日期排序

### 3. 批量操作
- **批量编辑**: 选择多个交易后可以批量更新项目户口和收支分类
- **批量删除**: 选择多个交易后可以批量删除，带有确认对话框和警告提示
- **选择管理**: 支持全选/取消全选，显示选中数量

### 4. 用户界面
- **编辑模式提示**: 只在编辑模式下显示拖拽功能的使用说明
- **排序控制按钮**: 编辑模式下显示"保存排序"、"重置排序"和"退出编辑"按钮
- **拖拽手柄**: 只在编辑模式下显示拖拽手柄，提供良好的视觉反馈
- **简化的操作菜单**: 移除了复制按钮，只保留编辑和删除功能
- **批量操作按钮**: 选中交易后显示批量编辑和批量删除按钮

## 技术实现

### 1. 组件结构
```typescript
// 可排序行组件
function SortableTransactionRow({ 
  transaction, 
  runningBalance, 
  onSelect, 
  onEdit, 
  onDelete, 
  hasPermission,
  isSelected,
  formatDate,
  getProjectCategory,
  isSortEditMode
})
```

### 2. 编辑模式状态
```typescript
const [isSortEditMode, setIsSortEditMode] = React.useState(false)
const [isBatchEditOpen, setIsBatchEditOpen] = React.useState(false)
const [isBatchDeleteOpen, setIsBatchDeleteOpen] = React.useState(false)
```

### 3. 拖拽配置
```typescript
// 拖拽传感器
const sensors = useSensors(
  useSensor(PointerSensor),
  useSensor(KeyboardSensor, {
    coordinateGetter: sortableKeyboardCoordinates,
  })
)

// 只在编辑模式下启用拖拽
const {
  attributes,
  listeners,
  setNodeRef,
  transform,
  transition,
  isDragging,
} = useSortable({ 
  id: transaction.id!,
  disabled: !isSortEditMode
})
```

### 4. 拖拽处理
```typescript
// 拖拽结束处理
const handleDragEnd = (event: DragEndEvent) => {
  const { active, over } = event
  if (active.id !== over?.id) {
    setSortedTransactions((items) => {
      const oldIndex = items.findIndex((item) => item.id === active.id)
      const newIndex = items.findIndex((item) => item.id === over?.id)
      return arrayMove(items, oldIndex, newIndex)
    })
  }
}
```

### 5. 批量删除处理
```typescript
// 批量删除处理
const handleBatchDelete = async () => {
  if (!currentUser || selectedTransactions.size === 0) return

  try {
    let deletedCount = 0
    for (const transactionId of selectedTransactions) {
      await deleteDocument("transactions", transactionId)
      deletedCount++
    }

    await fetchTransactions()
    setSelectedTransactions(new Set())
    setIsBatchDeleteOpen(false)
    
    toast({
      title: "成功",
      description: `已批量删除 ${deletedCount} 笔交易`
    })
  } catch (err: any) {
    setError("批量删除失败: " + err.message)
    console.error("Error batch deleting transactions:", err)
  }
}
```

### 6. 数据持久化
```typescript
// 保存排序顺序
const handleSaveOrder = async () => {
  for (let i = 0; i < sortedTransactions.length; i++) {
    const transaction = sortedTransactions[i]
    if (transaction.id) {
      await updateDocument("transactions", transaction.id, { order: i })
    }
  }
  await fetchTransactions()
  setIsSortEditMode(false) // 保存后退出编辑模式
}
```

## 文件修改

### 主要文件
- `components/modules/bank-transactions.tsx` - 主要实现文件

### 新增功能
1. **导入拖拽库**
   - `@dnd-kit/core`
   - `@dnd-kit/sortable`
   - `@dnd-kit/utilities`

2. **新增组件**
   - `SortableTransactionRow` - 可拖拽的交易行组件

3. **新增状态**
   - `sortedTransactions` - 排序后的交易列表
   - `isSortEditMode` - 编辑排序模式状态
   - `isBatchDeleteOpen` - 批量删除对话框状态

4. **新增功能**
   - 编辑排序模式切换
   - 拖拽传感器配置
   - 拖拽结束处理
   - 保存排序功能
   - 重置排序功能
   - 退出编辑功能
   - 批量删除功能
   - 批量删除确认对话框

### 移除功能
1. **移除复制按钮**
   - 从列表视图的下拉菜单中移除复制选项
   - 从分组视图的下拉菜单中移除复制选项
   - 简化用户操作界面，减少不必要的功能

## 使用说明

### 1. 进入编辑模式
1. 在银行交易列表页面，点击"编辑排序"按钮
2. 系统进入排序编辑模式，显示拖拽提示信息
3. 每行交易记录左侧会显示拖拽手柄

### 2. 拖拽排序
1. 在编辑模式下，每行左侧都有拖拽手柄（垂直点图标）
2. 点击并拖拽手柄可以移动交易记录
3. 拖拽时会显示半透明效果
4. 释放鼠标完成排序

### 3. 保存排序
1. 调整完顺序后，点击"保存排序"按钮
2. 系统会将新的顺序保存到数据库
3. 保存成功后会显示提示信息并自动退出编辑模式

### 4. 重置排序
1. 点击"重置排序"按钮可以恢复到原始顺序
2. 重置后会显示提示信息并自动退出编辑模式

### 5. 退出编辑
1. 点击"退出编辑"按钮可以随时退出排序模式
2. 退出编辑不会保存任何更改

### 6. 批量操作
1. **选择交易**: 使用复选框选择要操作的交易
2. **批量编辑**: 点击"批量编辑"按钮，可以批量更新项目户口和收支分类
3. **批量删除**: 点击"批量删除"按钮，会弹出确认对话框
4. **确认删除**: 在确认对话框中点击"确认删除"执行批量删除操作

### 7. 交易操作
1. 点击每行右侧的"•••"按钮打开操作菜单
2. 选择"编辑"来修改交易信息
3. 选择"删除"来删除交易记录
4. 复制功能已被移除，简化了操作界面

## 权限控制

- 编辑排序功能对所有用户开放
- 保存排序功能需要相应权限
- 重置排序功能对所有用户开放
- 批量删除功能需要相应权限

## 兼容性

- 支持鼠标拖拽
- 支持键盘操作（Tab键导航，空格键激活拖拽）
- 支持触摸设备拖拽

## 性能优化

- 使用 `useCallback` 优化函数性能
- 拖拽时使用 CSS transform 而不是改变 DOM 结构
- 批量更新数据库操作
- 只在编辑模式下启用拖拽功能，减少不必要的计算

## 测试

创建了测试脚本 `scripts/test-drag-sort.js` 来验证排序逻辑的正确性。
创建了测试脚本 `scripts/test-remove-copy.js` 来验证复制按钮移除功能。
创建了测试脚本 `scripts/test-batch-delete.js` 来验证批量删除功能。

## 注意事项

1. 排序功能只在列表视图中可用
2. 分组视图不支持拖拽排序
3. 排序会影响累计余额的计算顺序
4. 建议在保存排序前确认顺序正确
5. 编辑模式下会显示拖拽提示信息
6. 保存或重置操作后会自动退出编辑模式
7. 复制功能已被移除，简化了用户界面
8. 批量删除操作无法撤销，请谨慎操作
9. 批量删除前会显示确认对话框和警告信息

## 未来改进

1. 支持多选拖拽
2. 添加拖拽动画效果
3. 支持拖拽到不同分组
4. 添加排序历史记录
5. 支持导入/导出排序配置
6. 添加键盘快捷键支持
7. 支持批量操作的撤销功能
8. 添加批量操作的进度显示 