// lib/auto-sync-service.ts
import { eventBus, onEvent, type EventType } from './event-bus'
import { globalCache } from './optimized-cache'
import { 
  getTransactionsByBankAccount, 
  getTransactionsByProject, 
  getTransactionsByCategory,
  updateBankAccount,
  updateProject,
  updateCategory,
  getProjectSpentAmount,
  getBankAccountStats,
  getCategoryStats,
  getProjectIdByProjectId
} from './firebase-utils'
import type { Transaction, Project, Account, Category, BankAccount } from './data'

// 自动同步服务类
class AutoSyncService {
  private isInitialized = false
  private syncQueue: Array<() => Promise<void>> = []
  private isProcessingQueue = false

  // 初始化自动同步服务
  initialize(): void {
    if (this.isInitialized) return

    console.log('🚀 初始化自动关联更新服务...')

    // 注册交易相关事件监听器
    this.registerTransactionListeners()
    
    // 注册项目相关事件监听器
    this.registerProjectListeners()
    
    // 注册账户相关事件监听器
    this.registerAccountListeners()
    
    // 注册分类相关事件监听器
    this.registerCategoryListeners()
    
    // 注册银行账户相关事件监听器
    this.registerBankAccountListeners()

    this.isInitialized = true
    console.log('✅ 自动关联更新服务初始化完成')
  }

  // 注册交易事件监听器
  private registerTransactionListeners(): void {
    // 交易创建时
    onEvent('transaction:created', async ({ transaction }) => {
      await this.queueSync(() => this.handleTransactionCreated(transaction))
    })

    // 交易更新时
    onEvent('transaction:updated', async ({ transaction, previousData }) => {
      await this.queueSync(() => this.handleTransactionUpdated(transaction, previousData))
    })

    // 交易删除时
    onEvent('transaction:deleted', async ({ transactionId }) => {
      await this.queueSync(() => this.handleTransactionDeleted(transactionId))
    })
  }

  // 注册项目事件监听器
  private registerProjectListeners(): void {
    // 项目更新时
    onEvent('project:updated', async ({ project, previousData }) => {
      await this.queueSync(() => this.handleProjectUpdated(project, previousData))
    })

    // 项目删除时
    onEvent('project:deleted', async ({ projectId }) => {
      await this.queueSync(() => this.handleProjectDeleted(projectId))
    })
  }

  // 注册账户事件监听器
  private registerAccountListeners(): void {
    // 账户更新时
    onEvent('account:updated', async ({ account, previousData }) => {
      await this.queueSync(() => this.handleAccountUpdated(account, previousData))
    })
  }

  // 注册分类事件监听器
  private registerCategoryListeners(): void {
    // 分类更新时
    onEvent('category:updated', async ({ category, previousData }) => {
      await this.queueSync(() => this.handleCategoryUpdated(category, previousData))
    })
  }

  // 注册银行账户事件监听器
  private registerBankAccountListeners(): void {
    // 银行账户更新时
    onEvent('bankAccount:updated', async ({ bankAccount, previousData }) => {
      await this.queueSync(() => this.handleBankAccountUpdated(bankAccount, previousData))
    })
  }

  // 队列同步任务
  private async queueSync(syncTask: () => Promise<void>): Promise<void> {
    this.syncQueue.push(syncTask)
    
    if (!this.isProcessingQueue) {
      await this.processSyncQueue()
    }
  }

  // 处理同步队列
  private async processSyncQueue(): Promise<void> {
    if (this.isProcessingQueue || this.syncQueue.length === 0) return

    this.isProcessingQueue = true
    
    try {
      while (this.syncQueue.length > 0) {
        const task = this.syncQueue.shift()
        if (task) {
          try {
            await task()
          } catch (error) {
            console.error('同步任务执行失败:', error)
          }
        }
      }
    } finally {
      this.isProcessingQueue = false
    }
  }

  // 处理交易创建
  private async handleTransactionCreated(transaction: Transaction): Promise<void> {
    console.log('🔄 处理交易创建事件:', transaction.id)
    
    const updates: Promise<void>[] = []

    // 更新银行账户余额
    if (transaction.bankAccountId) {
      updates.push(this.updateBankAccountBalance(transaction.bankAccountId))
    }

    // 更新项目花费金额
    if (transaction.projectid) {
      updates.push(this.updateProjectSpentAmount(transaction.projectid))
    }

    // 更新分类统计
    if (transaction.category) {
      updates.push(this.updateCategoryStats(transaction.category))
    }

    // 失效相关缓存
    this.invalidateRelatedCache('transactions', transaction.id!)

    await Promise.all(updates)
    console.log('✅ 交易创建同步完成')
  }

  // 处理交易更新
  private async handleTransactionUpdated(
    transaction: Transaction, 
    previousData?: Partial<Transaction>
  ): Promise<void> {
    console.log('🔄 处理交易更新事件:', transaction.id)
    
    const updates: Promise<void>[] = []

    // 检查银行账户是否变更
    if (previousData?.bankAccountId !== transaction.bankAccountId) {
      if (previousData?.bankAccountId) {
        updates.push(this.updateBankAccountBalance(previousData.bankAccountId))
      }
      if (transaction.bankAccountId) {
        updates.push(this.updateBankAccountBalance(transaction.bankAccountId))
      }
    } else if (transaction.bankAccountId) {
      updates.push(this.updateBankAccountBalance(transaction.bankAccountId))
    }

    // 检查项目是否变更
    if (previousData?.projectid !== transaction.projectid) {
      if (previousData?.projectid) {
        updates.push(this.updateProjectSpentAmount(previousData.projectid))
      }
      if (transaction.projectid) {
        updates.push(this.updateProjectSpentAmount(transaction.projectid))
      }
    } else if (transaction.projectid) {
      updates.push(this.updateProjectSpentAmount(transaction.projectid))
    }

    // 检查分类是否变更
    if (previousData?.category !== transaction.category) {
      if (previousData?.category) {
        updates.push(this.updateCategoryStats(previousData.category))
      }
      if (transaction.category) {
        updates.push(this.updateCategoryStats(transaction.category))
      }
    } else if (transaction.category) {
      updates.push(this.updateCategoryStats(transaction.category))
    }

    // 失效相关缓存
    this.invalidateRelatedCache('transactions', transaction.id!)

    await Promise.all(updates)
    console.log('✅ 交易更新同步完成')
  }

  // 处理交易删除
  private async handleTransactionDeleted(transactionId: string): Promise<void> {
    console.log('🔄 处理交易删除事件:', transactionId)
    
    // 注意：这里需要先获取被删除的交易信息才能更新相关数据
    // 在实际应用中，可能需要从缓存或备份中获取交易信息
    
    // 失效相关缓存
    this.invalidateRelatedCache('transactions', transactionId)
    
    console.log('✅ 交易删除同步完成')
  }

  // 处理项目更新
  private async handleProjectUpdated(
    project: Project, 
    previousData?: Partial<Project>
  ): Promise<void> {
    console.log('🔄 处理项目更新事件:', project.projectid)
    
    // 如果项目名称变更，更新相关交易记录
    if (previousData?.name !== project.name) {
      await this.updateTransactionsProjectName(project.projectid, project.name)
    }

    // 更新项目花费金额
    await this.updateProjectSpentAmount(project.projectid)

    // 失效相关缓存 - 使用Firestore文档ID
    this.invalidateRelatedCache('projects', project.id!)

    console.log('✅ 项目更新同步完成')
  }

  // 处理项目删除
  private async handleProjectDeleted(projectId: string): Promise<void> {
    console.log('🔄 处理项目删除事件:', projectId)
    
    // 清理相关交易记录的项目信息
    await this.clearTransactionsProjectInfo(projectId)

    // 失效相关缓存
    this.invalidateRelatedCache('projects', projectId)

    console.log('✅ 项目删除同步完成')
  }

  // 处理账户更新
  private async handleAccountUpdated(
    account: Account, 
    previousData?: Partial<Account>
  ): Promise<void> {
    console.log('🔄 处理账户更新事件:', account.id)
    
    // 如果账户名称变更，更新相关日记账分录
    if (previousData?.name !== account.name) {
      await this.updateJournalEntriesAccountName(account.id!, account.name)
    }

    // 失效相关缓存
    this.invalidateRelatedCache('accounts', account.id!)

    console.log('✅ 账户更新同步完成')
  }

  // 处理分类更新
  private async handleCategoryUpdated(
    category: Category, 
    previousData?: Partial<Category>
  ): Promise<void> {
    console.log('🔄 处理分类更新事件:', category.id)
    
    // 如果分类名称变更，更新相关交易记录
    if (previousData?.name !== category.name) {
      await this.updateTransactionsCategoryName(category.code, category.name)
    }

    // 更新分类统计
    await this.updateCategoryStats(category.code)

    // 失效相关缓存
    this.invalidateRelatedCache('categories', category.id!)

    console.log('✅ 分类更新同步完成')
  }

  // 处理银行账户更新
  private async handleBankAccountUpdated(
    bankAccount: BankAccount, 
    previousData?: Partial<BankAccount>
  ): Promise<void> {
    console.log('🔄 处理银行账户更新事件:', bankAccount.id)
    
    // 如果银行账户名称变更，更新相关交易记录
    if (previousData?.name !== bankAccount.name) {
      await this.updateTransactionsBankAccountName(bankAccount.id!, bankAccount.name)
    }

    // 更新银行账户余额
    await this.updateBankAccountBalance(bankAccount.id!)

    // 失效相关缓存
    this.invalidateRelatedCache('bankAccounts', bankAccount.id!)

    console.log('✅ 银行账户更新同步完成')
  }

  // 更新银行账户余额
  private async updateBankAccountBalance(bankAccountId: string): Promise<void> {
    try {
      const transactions = await getTransactionsByBankAccount(bankAccountId)
      const totalBalance = transactions.reduce((sum, t) => sum + (t.income || 0) - (t.expense || 0), 0)
      
      await updateBankAccount(bankAccountId, { balance: totalBalance })
      console.log(`💰 银行账户 ${bankAccountId} 余额已更新为: ${totalBalance}`)
    } catch (error) {
      console.error('更新银行账户余额失败:', error)
    }
  }

  // 更新项目花费金额
  private async updateProjectSpentAmount(projectId: string): Promise<void> {
    try {
      // 首先获取项目的Firestore文档ID
      const firestoreId = await getProjectIdByProjectId(projectId)
      if (!firestoreId) {
        console.warn(`⚠️ 找不到项目 ${projectId} 的Firestore文档ID`)
        return
      }
      
      const spentAmount = await getProjectSpentAmount(projectId)
      await updateProject(firestoreId, { spent: spentAmount })
      console.log(`📊 项目 ${projectId} 花费金额已更新为: ${spentAmount}`)
    } catch (error) {
      console.error('更新项目花费金额失败:', error)
    }
  }

  // 更新分类统计
  private async updateCategoryStats(categoryCode: string): Promise<void> {
    try {
      const transactions = await getTransactionsByCategory(categoryCode)
      const stats = {
        totalTransactions: transactions.length,
        totalIncome: transactions.reduce((sum, t) => sum + (t.income || 0), 0),
        totalExpense: transactions.reduce((sum, t) => sum + (t.expense || 0), 0)
      }
      
      await updateCategory(categoryCode, { stats })
      console.log(`📈 分类 ${categoryCode} 统计已更新`)
    } catch (error) {
      console.error('更新分类统计失败:', error)
    }
  }

  // 更新交易记录的项目名称
  private async updateTransactionsProjectName(projectId: string, newName: string): Promise<void> {
    try {
      const { getTransactionsByProject } = await import('./firebase-utils')
      const { writeBatch, doc } = await import('firebase/firestore')
      const { db } = await import('./firebase')
      
      const transactions = await getTransactionsByProject(projectId)
      
      if (transactions.length === 0) {
        console.log(`📝 项目 ${projectId} 没有相关交易记录`)
        return
      }
      
      // 使用批量更新提高性能
      const batch = writeBatch(db)
      transactions.forEach(transaction => {
        const docRef = doc(db, 'transactions', transaction.id!)
        batch.update(docRef, { projectName: newName })
      })
      
      await batch.commit()
      console.log(`🔄 已批量更新 ${transactions.length} 笔交易的项目名称`)
    } catch (error) {
      console.error('更新交易项目名称失败:', error)
    }
  }

  // 更新交易记录的分类名称
  private async updateTransactionsCategoryName(categoryCode: string, newName: string): Promise<void> {
    try {
      const { updateDocument, getTransactionsByCategory } = await import('./firebase-utils')
      const transactions = await getTransactionsByCategory(categoryCode)
      
      const updatePromises = transactions.map(t => 
        updateDocument('transactions', t.id!, { categoryName: newName })
      )
      
      await Promise.all(updatePromises)
      console.log(`🔄 已更新 ${transactions.length} 笔交易的分类名称`)
    } catch (error) {
      console.error('更新交易分类名称失败:', error)
    }
  }

  // 更新交易记录的银行账户名称
  private async updateTransactionsBankAccountName(bankAccountId: string, newName: string): Promise<void> {
    try {
      const { updateDocument, getTransactionsByBankAccount } = await import('./firebase-utils')
      const transactions = await getTransactionsByBankAccount(bankAccountId)
      
      const updatePromises = transactions.map(t => 
        updateDocument('transactions', t.id!, { bankAccountName: newName })
      )
      
      await Promise.all(updatePromises)
      console.log(`🔄 已更新 ${transactions.length} 笔交易的银行账户名称`)
    } catch (error) {
      console.error('更新交易银行账户名称失败:', error)
    }
  }

  // 更新日记账分录的账户名称
  private async updateJournalEntriesAccountName(accountId: string, newName: string): Promise<void> {
    try {
      const { updateDocument, getJournalEntries } = await import('./firebase-utils')
      const journalEntries = await getJournalEntries()
      
      const updatePromises = journalEntries
        .filter(entry => entry.entries.some(e => e.account === accountId))
        .map(entry => {
          const updatedEntries = entry.entries.map(e => 
            e.account === accountId ? { ...e, accountName: newName } : e
          )
          return updateDocument('journalEntries', entry.id!, { entries: updatedEntries })
        })
      
      await Promise.all(updatePromises)
      console.log(`🔄 已更新日记账分录的账户名称`)
    } catch (error) {
      console.error('更新日记账分录账户名称失败:', error)
    }
  }

  // 清理交易记录的项目信息
  private async clearTransactionsProjectInfo(projectId: string): Promise<void> {
    try {
      const { updateDocument, getTransactionsByProject } = await import('./firebase-utils')
      const transactions = await getTransactionsByProject(projectId)
      
      const updatePromises = transactions.map(t => 
        updateDocument('transactions', t.id!, { 
          projectid: '', 
          projectName: '' 
        })
      )
      
      await Promise.all(updatePromises)
      console.log(`🔄 已清理 ${transactions.length} 笔交易的项目信息`)
    } catch (error) {
      console.error('清理交易项目信息失败:', error)
    }
  }

  // 失效相关缓存
  private invalidateRelatedCache(collection: string, id: string): void {
    const relatedKeys = this.getRelatedCacheKeys(collection, id)
    relatedKeys.forEach(key => {
      globalCache.invalidate(key)
      console.log(`🗑️ 失效缓存: ${key}`)
    })
  }

  // 获取相关缓存键
  private getRelatedCacheKeys(collection: string, id: string): string[] {
    const keys: string[] = []
    
    switch (collection) {
      case 'transactions':
        keys.push('transactions', 'transaction:stats', 'project:stats', 'bankAccount:stats')
        break
      case 'projects':
        keys.push('projects', 'project:stats', 'transactions')
        break
      case 'accounts':
        keys.push('accounts', 'journalEntries')
        break
      case 'categories':
        keys.push('categories', 'transaction:stats')
        break
      case 'bankAccounts':
        keys.push('bankAccounts', 'bankAccount:stats', 'transactions')
        break
    }
    
    return keys
  }

  // 获取服务状态
  getStatus(): { isInitialized: boolean; queueLength: number; isProcessing: boolean } {
    return {
      isInitialized: this.isInitialized,
      queueLength: this.syncQueue.length,
      isProcessing: this.isProcessingQueue
    }
  }

  // 清理服务
  cleanup(): void {
    this.syncQueue = []
    this.isProcessingQueue = false
    console.log('🧹 自动同步服务已清理')
  }
}

// 创建全局自动同步服务实例
export const autoSyncService = new AutoSyncService()

// 便捷的初始化函数
export const initializeAutoSync = () => {
  autoSyncService.initialize()
}

// 便捷的状态获取函数
export const getAutoSyncStatus = () => {
  return autoSyncService.getStatus()
}

// 导出服务实例
export default autoSyncService
