// hooks/use-optimized-data.ts
import React from 'react'
import { useCachedData, cacheKeys, globalCache } from '@/lib/optimized-cache'
import { 
  getTransactionsBatch, 
  getProjects, 
  getAccounts, 
  getCategories,
  getProjectsSpentAmounts,
  getTransactionStats,
  getProjectStats,
  getUsers
} from '@/lib/firebase-utils'
import type { Transaction, Project, Account, Category } from '@/lib/data'

// 优化的交易数据Hook
export function useOptimizedTransactions(options: {
  limit?: number
  filters?: {
    status?: string
    dateRange?: { start: Date; end: Date }
    searchTerm?: string
    projectid?: string
    category?: string
  }
  preload?: boolean
  priority?: 'high' | 'medium' | 'low'
} = {}) {
  const { limit = 100, filters, preload = false, priority = 'medium' } = options
  
  const key = cacheKeys.transactions({ limit, filters })
  
  return useCachedData(
    key,
    () => getTransactionsBatch(limit, filters),
    {
      ttl: 2 * 60 * 1000, // 2分钟缓存
      preload,
      priority
    }
  )
}

// 优化的项目数据Hook
export function useOptimizedProjects(options: {
  filters?: {
    status?: string
    bodCategory?: string
    searchTerm?: string
  }
  preload?: boolean
  priority?: 'high' | 'medium' | 'low'
} = {}) {
  const { filters, preload = false, priority = 'medium' } = options
  
  const key = cacheKeys.projects(filters)
  
  return useCachedData(
    key,
    () => getProjects(),
    {
      ttl: 5 * 60 * 1000, // 5分钟缓存
      preload,
      priority
    }
  )
}

// 优化的账户数据Hook
export function useOptimizedAccounts(options: {
  filters?: {
    type?: string
    searchTerm?: string
  }
  preload?: boolean
  priority?: 'high' | 'medium' | 'low'
} = {}) {
  const { filters, preload = false, priority = 'medium' } = options
  
  const key = cacheKeys.accounts(filters)
  
  return useCachedData(
    key,
    () => getAccounts(),
    {
      ttl: 10 * 60 * 1000, // 10分钟缓存
      preload,
      priority
    }
  )
}

// 优化的分类数据Hook
export function useOptimizedCategories(options: {
  preload?: boolean
  priority?: 'high' | 'medium' | 'low'
} = {}) {
  const { preload = false, priority = 'medium' } = options
  
  const key = cacheKeys.categories()
  
  return useCachedData(
    key,
    () => getCategories(),
    {
      ttl: 15 * 60 * 1000, // 15分钟缓存
      preload,
      priority
    }
  )
}

// 优化的项目花费金额Hook
export function useOptimizedProjectSpentAmounts(projectIds: string[]) {
  const key = cacheKeys.projectSpentAmounts(projectIds)
  
  return useCachedData(
    key,
    () => getProjectsSpentAmounts(projectIds),
    {
      ttl: 3 * 60 * 1000, // 3分钟缓存
      preload: true,
      priority: 'high'
    }
  )
}

// 优化的交易统计Hook
export function useOptimizedTransactionStats() {
  const key = 'transaction:stats'
  
  return useCachedData(
    key,
    () => getTransactionStats(),
    {
      ttl: 1 * 60 * 1000, // 1分钟缓存
      preload: true,
      priority: 'high'
    }
  )
}

// 优化的项目统计Hook
export function useOptimizedProjectStats() {
  const key = 'project:stats'
  
  return useCachedData(
    key,
    () => getProjectStats(),
    {
      ttl: 2 * 60 * 1000, // 2分钟缓存
      preload: true,
      priority: 'high'
    }
  )
}

// 新增：用户数据优化 hooks
export function useOptimizedUsers() {
  return useCachedData(
    cacheKeys.users(),
    () => getUsers(),
    { ttl: 5 * 60 * 1000, preload: true, priority: 'medium' }
  )
}

// 批量预加载Hook
export function useBatchPreload() {
  const [isPreloading, setIsPreloading] = React.useState(false)
  const [progress, setProgress] = React.useState(0)
  const [completed, setCompleted] = React.useState<string[]>([])

  const preloadCoreData = React.useCallback(async () => {
    setIsPreloading(true)
    setProgress(0)
    setCompleted([])

    const preloadTasks = [
      {
        key: cacheKeys.transactions({ limit: 50 }),
        fetcher: () => getTransactionsBatch(50),
        priority: 'high' as const
      },
      {
        key: cacheKeys.projects(),
        fetcher: () => getProjects(),
        priority: 'high' as const
      },
      {
        key: cacheKeys.accounts(),
        fetcher: () => getAccounts(),
        priority: 'medium' as const
      },
      {
        key: cacheKeys.categories(),
        fetcher: () => getCategories(),
        priority: 'medium' as const
      },
      {
        key: 'transaction:stats',
        fetcher: () => getTransactionStats(),
        priority: 'high' as const
      },
      {
        key: 'project:stats',
        fetcher: () => getProjectStats(),
        priority: 'high' as const
      }
    ]

    let completedCount = 0
    const total = preloadTasks.length

    for (const task of preloadTasks) {
      try {
        await globalCache.preload(task.key, task.fetcher, task.priority)
        completedCount++
        setProgress(completedCount / total)
        setCompleted(prev => [...prev, task.key])
      } catch (error) {
        console.error(`预加载失败: ${task.key}`, error)
      }
    }

    setIsPreloading(false)
  }, [])

  return {
    isPreloading,
    progress,
    completed,
    preloadCoreData
  }
}

// 智能数据预加载Hook
export function useSmartPreload(userRole?: string) {
  const { preloadCoreData } = useBatchPreload()

  const preloadByRole = React.useCallback(async () => {
    if (!userRole) return

    // 根据用户角色预加载相关数据
    switch (userRole) {
      case 'vice_president':
        // 副总裁需要所有数据
        await preloadCoreData()
        break
      case 'assistant_vice_president':
        // 助理副总裁主要需要交易和项目数据
        await Promise.all([
          globalCache.preload(
            cacheKeys.transactions({ limit: 100 }),
            () => getTransactionsBatch(100),
            'high'
          ),
          globalCache.preload(
            cacheKeys.projects(),
            () => getProjects(),
            'high'
          ),
          globalCache.preload(
            'transaction:stats',
            () => getTransactionStats(),
            'high'
          )
        ])
        break
      case 'president':
        // 总裁需要统计数据和概览
        await Promise.all([
          globalCache.preload(
            'transaction:stats',
            () => getTransactionStats(),
            'high'
          ),
          globalCache.preload(
            'project:stats',
            () => getProjectStats(),
            'high'
          ),
          globalCache.preload(
            cacheKeys.projects(),
            () => getProjects(),
            'medium'
          )
        ])
        break
      default:
        // 默认只预加载基础数据
        await globalCache.preload(
          cacheKeys.transactions({ limit: 50 }),
          () => getTransactionsBatch(50),
          'medium'
        )
    }
  }, [userRole, preloadCoreData])

  return { preloadByRole }
}

// 数据同步Hook
export function useDataSync() {
  const [lastSync, setLastSync] = React.useState<Date | null>(null)
  const [isSyncing, setIsSyncing] = React.useState(false)

  const syncData = React.useCallback(async () => {
    setIsSyncing(true)
    try {
      // 清理过期缓存
      globalCache.cleanup()
      
      // 重新获取关键数据
      await Promise.all([
        globalCache.preload(
          cacheKeys.transactions({ limit: 100 }),
          () => getTransactionsBatch(100),
          'high'
        ),
        globalCache.preload(
          cacheKeys.projects(),
          () => getProjects(),
          'high'
        ),
        globalCache.preload(
          'transaction:stats',
          () => getTransactionStats(),
          'high'
        )
      ])
      
      setLastSync(new Date())
    } catch (error) {
      console.error('数据同步失败:', error)
    } finally {
      setIsSyncing(false)
    }
  }, [])

  return {
    lastSync,
    isSyncing,
    syncData
  }
} 