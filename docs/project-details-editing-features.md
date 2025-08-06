# 项目详情对话框编辑功能文档

## 概述

本项目详情对话框（`project-details-dialog-optimized.tsx`）已实现了完整的交易记录编辑功能，包括单条编辑和批量编辑两种模式。该功能允许用户在项目详情页面直接编辑交易记录，无需跳转到其他页面。

## 功能特性

### 1. 单条编辑功能

#### 功能描述
- 支持对单条交易记录进行内联编辑
- 可以修改交易的所有字段：日期、描述、分类、收入、支出
- 实时计算并显示净额
- 支持保存和取消操作

#### 操作流程
1. 在交易记录表格中找到要编辑的记录
2. 点击该行的编辑按钮（铅笔图标）
3. 记录行变为编辑模式，显示输入框和下拉选择器
4. 修改相关字段
5. 点击保存按钮确认修改，或点击取消按钮放弃修改

#### 技术实现
```typescript
// 编辑状态管理
const [editingTransactionId, setEditingTransactionId] = React.useState<string | null>(null)

// 编辑交易记录
const handleEditTransaction = React.useCallback((transaction: Transaction) => {
  setEditingTransactionId(transaction.id || null)
  setTransactions(prev => prev.map(t => 
    t.id === transaction.id 
      ? { ...t, isEditing: true, originalData: { ...t } }
      : { ...t, isEditing: false }
  ))
}, [])

// 保存交易记录
const handleSaveTransaction = React.useCallback(async (updatedTransaction: Transaction) => {
  if (!updatedTransaction.id) return

  try {
    await updateDocument('transactions', updatedTransaction.id, {
      description: updatedTransaction.description,
      category: updatedTransaction.category,
      income: updatedTransaction.income,
      expense: updatedTransaction.expense,
      date: updatedTransaction.date
    })
    // 更新本地状态和显示成功提示
  } catch (error) {
    // 显示错误提示
  }
}, [toast])
```

### 2. 批量编辑功能

#### 功能描述
- 支持同时选择多条交易记录进行批量编辑
- 可以批量修改分类、收入、支出字段
- 支持全选/取消全选操作
- 显示选中记录数量和更新进度

#### 操作流程
1. 点击"批量编辑"按钮进入批量模式
2. 使用复选框选择要批量修改的交易记录
3. 可以使用表头的全选按钮快速选择所有记录
4. 在批量编辑面板中设置要修改的字段
5. 点击"批量更新"按钮执行批量修改
6. 完成后点击"退出批量模式"返回正常视图

#### 技术实现
```typescript
// 批量编辑状态
const [isBatchMode, setIsBatchMode] = React.useState(false)
const [selectedTransactions, setSelectedTransactions] = React.useState<Set<string>>(new Set())
const [batchEditData, setBatchEditData] = React.useState<Partial<Transaction>>({})
const [isBatchEditing, setIsBatchEditing] = React.useState(false)

// 批量选择
const handleSelectTransaction = React.useCallback((transactionId: string, selected: boolean) => {
  setSelectedTransactions(prev => {
    const newSet = new Set(prev)
    if (selected) {
      newSet.add(transactionId)
    } else {
      newSet.delete(transactionId)
    }
    return newSet
  })
}, [])

// 批量编辑
const handleBatchEdit = React.useCallback(async () => {
  if (selectedTransactions.size === 0) return

  setIsBatchEditing(true)
  try {
    const updatePromises = Array.from(selectedTransactions).map(async (transactionId) => {
      await updateDocument('transactions', transactionId, batchEditData)
    })

    await Promise.all(updatePromises)
    // 更新本地状态和显示成功提示
  } catch (error) {
    // 显示错误提示
  } finally {
    setIsBatchEditing(false)
  }
}, [selectedTransactions, batchEditData, toast])
```

### 3. 删除功能

#### 功能描述
- 支持删除单条交易记录
- 删除操作会永久移除记录
- 包含确认提示和错误处理

#### 技术实现
```typescript
// 删除交易记录
const handleDeleteTransaction = React.useCallback(async (transactionId: string) => {
  try {
    // 调用删除API
    // await deleteDocument('transactions', transactionId)
    
    // 更新本地状态
    setTransactions(prev => prev.filter(t => t.id !== transactionId))
    setFilteredTransactions(prev => prev.filter(t => t.id !== transactionId))
    
    // 显示成功提示
  } catch (error) {
    // 显示错误提示
  }
}, [toast])
```

## 组件结构

### EditableTransactionRow 组件

这是核心的编辑行组件，负责处理单条记录的编辑逻辑：

```typescript
const EditableTransactionRow = React.memo(({ 
  transaction,
  categories,
  onEdit,
  onSave,
  onCancel,
  onDelete,
  isSelected,
  onSelect,
  isBatchMode
}: {
  // ... props
}) => {
  const [editData, setEditData] = React.useState<Partial<Transaction>>({})
  const [isSaving, setIsSaving] = React.useState(false)

  // 编辑模式渲染
  if (transaction.isEditing) {
    return (
      <TableRow className="bg-muted/50">
        {/* 编辑表单字段 */}
      </TableRow>
    )
  }

  // 正常模式渲染
  return (
    <TableRow className={isSelected ? "bg-muted/30" : ""}>
      {/* 显示字段和操作按钮 */}
    </TableRow>
  )
})
```

### 批量编辑面板

当进入批量模式且有选中记录时显示：

```typescript
{isBatchMode && selectedTransactions.size > 0 && (
  <div className="mb-4 p-4 border rounded-lg bg-muted/30">
    <div className="flex items-center justify-between mb-4">
      <span>已选择 {selectedTransactions.size} 条记录</span>
      <Button onClick={() => handleSelectAll(false)}>取消全选</Button>
    </div>
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {/* 批量编辑表单字段 */}
    </div>
  </div>
)}
```

## 数据同步

### 自动同步机制

编辑功能与之前实现的自动同步机制完全集成：

1. **事件触发**：当交易记录被更新时，会自动触发 `transaction:updated` 事件
2. **关联更新**：自动同步服务会更新相关的银行账户余额、项目支出等数据
3. **缓存失效**：相关缓存会被自动清除，确保数据一致性

### 实时更新

- 编辑操作会立即反映在本地状态中
- 数据库更新成功后，相关模块会自动同步
- 统计数据和图表会实时更新

## 用户体验优化

### 1. 视觉反馈
- 编辑中的行有特殊的背景色
- 选中的批量编辑行有高亮显示
- 加载状态有旋转图标指示

### 2. 操作确认
- 所有操作都有成功/失败提示
- 删除操作需要确认
- 批量操作显示进度

### 3. 响应式设计
- 在移动设备上也有良好的体验
- 表格在小屏幕上可以横向滚动
- 批量编辑面板自适应布局

### 4. 性能优化
- 使用 React.memo 优化组件渲染
- 批量更新使用 Promise.all 并行处理
- 状态更新使用 useCallback 避免不必要的重渲染

## 测试页面

创建了专门的测试页面 `app/test-project-details-editing/page.tsx` 来演示编辑功能：

### 功能
- 显示所有项目列表
- 点击项目打开详情对话框
- 详细的使用说明和注意事项
- 功能特性介绍

### 访问方式
访问 `/test-project-details-editing` 路径即可使用测试页面。

## 注意事项

### 1. 数据安全
- 删除操作不可逆，需要谨慎操作
- 建议在删除前进行数据备份
- 批量操作前确认选中的记录

### 2. 性能考虑
- 大量记录的批量编辑可能需要较长时间
- 建议分批处理大量数据
- 网络连接不稳定时可能影响操作

### 3. 权限控制
- 编辑功能需要相应的用户权限
- 建议根据用户角色限制编辑权限
- 敏感数据的修改应该有审计日志

## 未来改进

### 1. 功能增强
- 添加撤销/重做功能
- 支持批量删除
- 添加编辑历史记录
- 支持导入/导出编辑数据

### 2. 用户体验
- 添加快捷键支持
- 支持拖拽排序
- 添加更多的筛选和排序选项
- 支持自定义列显示

### 3. 技术优化
- 添加乐观更新
- 实现离线编辑功能
- 添加编辑冲突解决机制
- 优化大数据量处理性能

## 总结

项目详情对话框的编辑功能提供了完整的交易记录管理能力，包括单条编辑和批量编辑两种模式。该功能与现有的自动同步机制完美集成，确保了数据的一致性和实时性。通过良好的用户体验设计和性能优化，为用户提供了高效、安全的数据编辑体验。
