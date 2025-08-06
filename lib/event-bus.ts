// lib/event-bus.ts
import type { Transaction, Project, Account, Category, BankAccount, JournalEntry } from './data'

// 事件类型定义
export type EventType = 
  | 'transaction:created'
  | 'transaction:updated'
  | 'transaction:deleted'
  | 'project:created'
  | 'project:updated'
  | 'project:deleted'
  | 'account:created'
  | 'account:updated'
  | 'account:deleted'
  | 'category:created'
  | 'category:updated'
  | 'category:deleted'
  | 'bankAccount:created'
  | 'bankAccount:updated'
  | 'bankAccount:deleted'
  | 'journalEntry:created'
  | 'journalEntry:updated'
  | 'journalEntry:deleted'

// 事件数据接口
export interface EventData {
  'transaction:created': { transaction: Transaction }
  'transaction:updated': { transaction: Transaction, previousData?: Partial<Transaction> }
  'transaction:deleted': { transactionId: string }
  'project:created': { project: Project }
  'project:updated': { project: Project, previousData?: Partial<Project> }
  'project:deleted': { projectId: string }
  'account:created': { account: Account }
  'account:updated': { account: Account, previousData?: Partial<Account> }
  'account:deleted': { accountId: string }
  'category:created': { category: Category }
  'category:updated': { category: Category, previousData?: Partial<Category> }
  'category:deleted': { categoryId: string }
  'bankAccount:created': { bankAccount: BankAccount }
  'bankAccount:updated': { bankAccount: BankAccount, previousData?: Partial<BankAccount> }
  'bankAccount:deleted': { bankAccountId: string }
  'journalEntry:created': { journalEntry: JournalEntry }
  'journalEntry:updated': { journalEntry: JournalEntry, previousData?: Partial<JournalEntry> }
  'journalEntry:deleted': { entryId: string }
}

// 事件监听器类型
export type EventListener<T extends EventType> = (data: EventData[T]) => void | Promise<void>

// 事件总线类
class EventBus {
  private listeners: Map<EventType, Set<EventListener<any>>> = new Map()
  private isProcessing = false
  private eventQueue: Array<{ type: EventType; data: any }> = []

  // 注册事件监听器
  on<T extends EventType>(event: T, listener: EventListener<T>): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set())
    }
    
    this.listeners.get(event)!.add(listener)
    
    // 返回取消监听的函数
    return () => {
      this.listeners.get(event)?.delete(listener)
    }
  }

  // 触发事件
  async emit<T extends EventType>(event: T, data: EventData[T]): Promise<void> {
    if (this.isProcessing) {
      // 如果正在处理事件，加入队列
      this.eventQueue.push({ type: event, data })
      return
    }

    this.isProcessing = true
    
    try {
      const listeners = this.listeners.get(event)
      if (listeners) {
        const promises = Array.from(listeners).map(listener => {
          try {
            return Promise.resolve(listener(data))
          } catch (error) {
            console.error(`Error in event listener for ${event}:`, error)
            return Promise.resolve()
          }
        })
        
        await Promise.all(promises)
      }
    } finally {
      this.isProcessing = false
      
      // 处理队列中的事件
      while (this.eventQueue.length > 0) {
        const queuedEvent = this.eventQueue.shift()!
        await this.emit(queuedEvent.type, queuedEvent.data)
      }
    }
  }

  // 移除所有监听器
  clear(): void {
    this.listeners.clear()
  }

  // 获取监听器数量
  getListenerCount(event: EventType): number {
    return this.listeners.get(event)?.size || 0
  }

  // 获取所有事件类型
  getEventTypes(): EventType[] {
    return Array.from(this.listeners.keys())
  }
}

// 创建全局事件总线实例
export const eventBus = new EventBus()

// 便捷的事件触发函数
export const emitEvent = <T extends EventType>(event: T, data: EventData[T]) => {
  return eventBus.emit(event, data)
}

// 便捷的事件监听函数
export const onEvent = <T extends EventType>(event: T, listener: EventListener<T>) => {
  return eventBus.on(event, listener)
}

// 导出事件总线实例
export default eventBus
