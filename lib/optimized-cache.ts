// lib/optimized-cache.ts
import React from "react"
import type { Transaction, Project, Account, Category } from "./data"

// 缓存项接口
interface CacheItem<T> {
  data: T
  timestamp: number
  ttl: number
  accessCount: number
  lastAccessed: number
}

// 缓存统计
interface CacheStats {
  hits: number
  misses: number
  size: number
  keys: string[]
  memoryUsage: number
}

// 预加载配置
interface PreloadConfig {
  enabled: boolean
  maxConcurrent: number
  priority: 'high' | 'medium' | 'low'
}

class OptimizedCache {
  private cache = new Map<string, CacheItem<any>>()
  private stats: CacheStats = {
    hits: 0,
    misses: 0,
    size: 0,
    keys: [],
    memoryUsage: 0
  }
  private maxSize = 100 // 最大缓存项数
  private defaultTTL = 5 * 60 * 1000 // 默认5分钟
  private preloadQueue: Array<() => Promise<void>> = []
  private isProcessingQueue = false

  // 获取缓存数据
  get<T>(key: string): T | null {
    const item = this.cache.get(key)
    
    if (!item) {
      this.stats.misses++
      return null
    }

    // 检查是否过期
    if (Date.now() - item.timestamp > item.ttl) {
      this.cache.delete(key)
      this.stats.misses++
      this.updateStats()
      return null
    }

    // 更新访问统计
    item.accessCount++
    item.lastAccessed = Date.now()
    this.stats.hits++
    
    return item.data
  }

  // 设置缓存数据
  set<T>(key: string, data: T, ttl: number = this.defaultTTL): void {
    // 如果缓存已满，删除最少访问的项
    if (this.cache.size >= this.maxSize) {
      this.evictLeastUsed()
    }

    const item: CacheItem<T> = {
      data,
      timestamp: Date.now(),
      ttl,
      accessCount: 0,
      lastAccessed: Date.now()
    }

    this.cache.set(key, item)
    this.updateStats()
  }

  // 删除缓存项
  delete(key: string): boolean {
    const deleted = this.cache.delete(key)
    if (deleted) {
      this.updateStats()
    }
    return deleted
  }

  // 清空缓存
  clear(): void {
    this.cache.clear()
    this.updateStats()
  }

  // 获取缓存统计
  getStats(): CacheStats {
    return { ...this.stats }
  }

  // 获取缓存命中率
  getHitRate(): number {
    const total = this.stats.hits + this.stats.misses
    return total > 0 ? this.stats.hits / total : 0
  }

  // 预加载数据
  async preload<T>(
    key: string,
    fetcher: () => Promise<T>,
    priority: 'high' | 'medium' | 'low' = 'medium'
  ): Promise<void> {
    const preloadTask = async () => {
      try {
        const data = await fetcher()
        this.set(key, data)
        console.log(`预加载完成: ${key}`)
      } catch (error) {
        console.error(`预加载失败: ${key}`, error)
      }
    }

    // 高优先级任务立即执行
    if (priority === 'high') {
      await preloadTask()
    } else {
      // 其他优先级任务加入队列
      this.preloadQueue.push(preloadTask)
      this.processQueue()
    }
  }

  // 处理预加载队列
  private async processQueue(): Promise<void> {
    if (this.isProcessingQueue || this.preloadQueue.length === 0) {
      return
    }

    this.isProcessingQueue = true
    
    while (this.preloadQueue.length > 0) {
      const task = this.preloadQueue.shift()
      if (task) {
        await task()
        // 添加延迟避免过度请求
        await new Promise(resolve => setTimeout(resolve, 100))
      }
    }

    this.isProcessingQueue = false
  }

  // 删除最少使用的缓存项
  private evictLeastUsed(): void {
    let leastUsedKey: string | null = null
    let minAccessCount = Infinity
    let oldestAccess = Infinity

    for (const [key, item] of this.cache.entries()) {
      if (item.accessCount < minAccessCount || 
          (item.accessCount === minAccessCount && item.lastAccessed < oldestAccess)) {
        leastUsedKey = key
        minAccessCount = item.accessCount
        oldestAccess = item.lastAccessed
      }
    }

    if (leastUsedKey) {
      this.cache.delete(leastUsedKey)
    }
  }

  // 更新统计信息
  private updateStats(): void {
    this.stats.size = this.cache.size
    this.stats.keys = Array.from(this.cache.keys())
    this.stats.memoryUsage = this.estimateMemoryUsage()
  }

  // 估算内存使用量
  private estimateMemoryUsage(): number {
    let totalSize = 0
    for (const [key, item] of this.cache.entries()) {
      totalSize += JSON.stringify(key).length
      totalSize += JSON.stringify(item.data).length
    }
    return totalSize
  }

  // 清理过期缓存
  cleanup(): void {
    const now = Date.now()
    for (const [key, item] of this.cache.entries()) {
      if (now - item.timestamp > item.ttl) {
        this.cache.delete(key)
      }
    }
    this.updateStats()
  }
}

// 创建全局缓存实例
export const globalCache = new OptimizedCache()

// 定期清理过期缓存
setInterval(() => {
  globalCache.cleanup()
}, 60000) // 每分钟清理一次

// 缓存键生成器
export const cacheKeys = {
  transactions: (options?: { limit?: number; filters?: any }) => {
    if (!options) return 'transactions'
    const { limit, filters } = options
    if (!filters) return `transactions:${limit || 'default'}`
    
    // 创建稳定的过滤器字符串
    const filterKeys = Object.keys(filters || {}).sort()
    const filterStr = filterKeys.map(key => {
      const value = filters[key]
      if (value === undefined || value === null) return ''
      if (typeof value === 'object') {
        return `${key}:${JSON.stringify(value)}`
      }
      return `${key}:${value}`
    }).filter(Boolean).join('|')
    
    return `transactions:${limit || 'default'}:${filterStr}`
  },
  projects: (filters?: any) => {
    if (!filters) return 'projects'
    
    // 创建稳定的过滤器字符串
    const filterKeys = Object.keys(filters || {}).sort()
    const filterStr = filterKeys.map(key => {
      const value = filters[key]
      if (value === undefined || value === null) return ''
      if (typeof value === 'object') {
        return `${key}:${JSON.stringify(value)}`
      }
      return `${key}:${value}`
    }).filter(Boolean).join('|')
    
    return `projects:${filterStr}`
  },
  accounts: (filters?: any) => {
    if (!filters) return 'accounts'
    
    // 创建稳定的过滤器字符串
    const filterKeys = Object.keys(filters || {}).sort()
    const filterStr = filterKeys.map(key => {
      const value = filters[key]
      if (value === undefined || value === null) return ''
      if (typeof value === 'object') {
        return `${key}:${JSON.stringify(value)}`
      }
      return `${key}:${value}`
    }).filter(Boolean).join('|')
    
    return `accounts:${filterStr}`
  },
  categories: () => 'categories',
  projectSpentAmounts: (projectIds: string[]) => {
    return `project-spent-amounts:${projectIds.sort().join(',')}`
  },
  transactionStats: () => 'transaction-stats',
  projectStats: () => 'project-stats',
  users: () => 'users',
}

// 优化的数据获取Hook
export function useCachedData<T>(
  key: string,
  fetcher: () => Promise<T>,
  options: {
    ttl?: number
    preload?: boolean
    priority?: 'high' | 'medium' | 'low'
  } = {}
) {
  const [data, setData] = React.useState<T | null>(null)
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  
  // 使用 useRef 来存储 fetcher 函数，避免无限循环
  const fetcherRef = React.useRef(fetcher)
  fetcherRef.current = fetcher

  // 解构 options 以避免对象引用变化
  const { ttl, preload, priority } = options

  // 使用 ref 来跟踪是否正在获取数据，防止重复请求
  const isFetchingRef = React.useRef(false)
  
  // 使用 ref 来跟踪组件是否已挂载，防止在卸载后设置状态
  const isMountedRef = React.useRef(true)

  // 清理函数
  React.useEffect(() => {
    isMountedRef.current = true
    return () => {
      isMountedRef.current = false
    }
  }, [])

  const fetchData = React.useCallback(async () => {
    // 防止重复请求
    if (isFetchingRef.current) {
      return
    }

    // 检查组件是否已挂载
    if (!isMountedRef.current) {
      return
    }

    setLoading(true)
    setError(null)
    isFetchingRef.current = true

    try {
      // 先尝试从缓存获取
      const cached = globalCache.get<T>(key)
      if (cached) {
        if (isMountedRef.current) {
          setData(cached)
          setLoading(false)
        }
        isFetchingRef.current = false
        return
      }

      // 缓存未命中，从服务器获取
      const result = await fetcherRef.current()
      
      // 检查组件是否仍然挂载
      if (isMountedRef.current) {
        globalCache.set(key, result, ttl)
        setData(result)
        setLoading(false)
      }
    } catch (err: any) {
      if (isMountedRef.current) {
        setError(err.message)
        setLoading(false)
      }
      console.error(`获取数据失败: ${key}`, err)
    } finally {
      isFetchingRef.current = false
    }
  }, [key, ttl])

  // 预加载数据
  React.useEffect(() => {
    if (preload) {
      globalCache.preload(key, fetcherRef.current, priority)
    }
  }, [key, preload, priority])

  // 初始加载 - 只在 key 或 ttl 变化时重新获取
  React.useEffect(() => {
    fetchData()
  }, [fetchData])

  return { data, loading, error, refetch: fetchData }
}

// 批量预加载Hook
export function useBatchPreload(
  preloadConfigs: Array<{
    key: string
    fetcher: () => Promise<any>
    priority?: 'high' | 'medium' | 'low'
  }>
) {
  const [progress, setProgress] = React.useState(0)
  const [completed, setCompleted] = React.useState<string[]>([])

  const startPreload = React.useCallback(async () => {
    setProgress(0)
    setCompleted([])

    const total = preloadConfigs.length
    let completedCount = 0

    for (const config of preloadConfigs) {
      try {
        await globalCache.preload(config.key, config.fetcher, config.priority)
        completedCount++
        setProgress(completedCount / total)
        setCompleted(prev => [...prev, config.key])
      } catch (error) {
        console.error(`预加载失败: ${config.key}`, error)
      }
    }
  }, [preloadConfigs])

  return { progress, completed, startPreload }
}

// 性能监控Hook
export function useCachePerformance() {
  const [stats, setStats] = React.useState(globalCache.getStats())

  React.useEffect(() => {
    const interval = setInterval(() => {
      setStats(globalCache.getStats())
    }, 5000) // 每5秒更新一次

    return () => clearInterval(interval)
  }, [])

  return stats
} 