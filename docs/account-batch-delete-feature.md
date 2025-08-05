# 账户批量删除功能文档

## 📋 功能概述

账户批量删除功能允许用户一次性删除多个选中的账户，提高账户管理效率。该功能包含完整的用户界面、确认对话框和安全验证机制。

## 🎯 主要特性

### 1. 批量选择
- **全选/取消全选**: 通过表头复选框快速选择所有显示的账户
- **单个选择**: 通过每行的复选框选择特定账户
- **选择状态显示**: 实时显示已选择的账户数量

### 2. 批量删除按钮
- **条件显示**: 只有在选择账户时才显示批量删除按钮
- **数量显示**: 按钮显示当前选择的账户数量
- **加载状态**: 删除过程中显示加载动画

### 3. 确认对话框
- **详细警告**: 明确说明删除操作的不可逆性
- **账户预览**: 显示将要删除的账户列表（最多显示10个）
- **操作确认**: 提供取消和确认删除按钮

### 4. 安全机制
- **二次确认**: 用户必须明确确认删除操作
- **数据验证**: 确保选中的账户存在且有效
- **错误处理**: 完整的错误处理和用户反馈

## 🔧 技术实现

### 1. Firebase批量操作
```typescript
export async function deleteAccounts(accountIds: string[]): Promise<void> {
  try {
    if (accountIds.length === 0) {
      return
    }
    
    const batch = writeBatch(db)
    
    accountIds.forEach(accountId => {
      const docRef = doc(db, "accounts", accountId)
      batch.delete(docRef)
    })
    
    await batch.commit()
  } catch (error) {
    throw new Error(`Failed to delete accounts: ${error}`)
  }
}
```

### 2. 状态管理
```typescript
const [selectedAccounts, setSelectedAccounts] = React.useState<Set<string>>(new Set())
const [showBatchDeleteDialog, setShowBatchDeleteDialog] = React.useState(false)
```

### 3. 批量删除处理函数
```typescript
const handleBatchDelete = async () => {
  try {
    setSaving(true)
    const accountIdsToDelete = Array.from(selectedAccounts)
    
    if (accountIdsToDelete.length === 0) {
      toast({
        title: "没有选择账户",
        description: "请先选择要删除的账户",
        variant: "destructive",
      })
      return
    }
    
    await deleteAccounts(accountIdsToDelete)
    setSelectedAccounts(new Set())
    setShowBatchDeleteDialog(false)
    
    toast({
      title: "批量删除成功",
      description: `已删除 ${accountIdsToDelete.length} 个账户`,
    })
  } catch (error) {
    toast({
      title: "批量删除失败",
      description: `删除账户时出错: ${error}`,
      variant: "destructive",
    })
  } finally {
    setSaving(false)
  }
}
```

## 🎨 用户界面

### 1. 工具栏按钮
```tsx
{selectedAccounts.size > 0 && (
  <Button 
    variant="destructive" 
    onClick={() => setShowBatchDeleteDialog(true)}
    disabled={saving}
  >
    {saving ? (
      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
    ) : (
      <Trash2 className="h-4 w-4 mr-2" />
    )}
    批量删除 ({selectedAccounts.size})
  </Button>
)}
```

### 2. 确认对话框
```tsx
<Dialog open={showBatchDeleteDialog} onOpenChange={setShowBatchDeleteDialog}>
  <DialogContent className="max-w-md">
    <DialogHeader>
      <DialogTitle>确认批量删除</DialogTitle>
      <DialogDescription>
        您确定要删除选中的 {selectedAccounts.size} 个账户吗？此操作不可撤销。
      </DialogDescription>
    </DialogHeader>
    
    {/* 警告信息 */}
    <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
      <div className="flex items-start space-x-2">
        <Trash2 className="h-5 w-5 text-red-600 mt-0.5" />
        <div>
          <p className="text-sm font-medium text-red-800">警告</p>
          <p className="text-sm text-red-700 mt-1">
            删除账户将永久移除所有相关数据，包括交易记录和余额信息。请确保您已备份重要数据。
          </p>
        </div>
      </div>
    </div>
    
    {/* 账户预览列表 */}
    <div className="max-h-40 overflow-y-auto">
      <p className="text-sm font-medium mb-2">将要删除的账户：</p>
      <div className="space-y-1">
        {Array.from(selectedAccounts).slice(0, 10).map(accountId => {
          const account = accounts.find(a => a.id === accountId)
          return account ? (
            <div key={accountId} className="flex items-center justify-between p-2 bg-gray-50 rounded">
              <div>
                <p className="text-sm font-medium">{account.code} - {account.name}</p>
                <p className="text-xs text-muted-foreground">{account.type}</p>
              </div>
              <span className="text-sm font-mono">${account.balance.toLocaleString()}</span>
            </div>
          ) : null
        })}
      </div>
    </div>
    
    {/* 操作按钮 */}
    <div className="flex justify-end space-x-2">
      <Button variant="outline" onClick={() => setShowBatchDeleteDialog(false)}>
        取消
      </Button>
      <Button 
        variant="destructive" 
        onClick={handleBatchDelete}
        disabled={saving}
      >
        {saving ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            删除中...
          </>
        ) : (
          <>
            <Trash2 className="h-4 w-4 mr-2" />
            确认删除
          </>
        )}
      </Button>
    </div>
  </DialogContent>
</Dialog>
```

## 📁 文件结构

### 核心文件
- `components/modules/account-chart.tsx` - 标准账户图表组件
- `components/modules/account-chart-optimized.tsx` - 优化版账户图表组件
- `lib/firebase-utils.ts` - Firebase批量删除函数

### 测试文件
- `scripts/test-batch-delete-accounts.js` - 批量删除功能测试脚本

## 🧪 测试

### 运行测试
```bash
# 运行批量删除测试
node scripts/test-batch-delete-accounts.js test

# 清理测试数据
node scripts/test-batch-delete-accounts.js cleanup
```

### 测试内容
1. **创建测试账户**: 自动创建5个测试账户
2. **验证创建**: 确认测试账户已成功创建
3. **执行批量删除**: 使用批量删除函数删除所有测试账户
4. **验证删除**: 确认所有测试账户已被删除

## 🔒 安全考虑

### 1. 数据验证
- 验证选中的账户ID是否有效
- 检查账户是否仍然存在
- 防止重复删除

### 2. 权限控制
- 确保用户有删除权限
- 验证账户所有权（如适用）

### 3. 操作确认
- 强制用户确认删除操作
- 显示详细的警告信息
- 提供取消选项

## 📈 性能优化

### 1. 批量操作
- 使用Firebase的writeBatch进行批量删除
- 减少网络请求次数
- 提高删除效率

### 2. 状态管理
- 使用React.useCallback优化函数性能
- 避免不必要的重新渲染
- 优化选择状态更新

### 3. 用户反馈
- 实时显示操作进度
- 提供清晰的错误信息
- 优化加载状态显示

## 🚀 使用指南

### 1. 选择账户
1. 使用表头复选框全选所有账户
2. 或使用每行的复选框选择特定账户
3. 观察工具栏中显示的选中数量

### 2. 执行批量删除
1. 点击"批量删除"按钮
2. 在确认对话框中查看将要删除的账户
3. 仔细阅读警告信息
4. 点击"确认删除"执行删除操作

### 3. 验证结果
1. 查看成功提示消息
2. 确认账户列表已更新
3. 检查选中状态已重置

## 🔄 更新日志

### v1.0.0 (2024-01-XX)
- ✅ 实现基础批量删除功能
- ✅ 添加确认对话框
- ✅ 集成Firebase批量操作
- ✅ 添加完整的错误处理
- ✅ 创建测试脚本
- ✅ 支持标准版和优化版组件

## 📞 支持

如有问题或建议，请联系开发团队或提交Issue。 