"use client"

import * as React from "react"
import { usePagination, PaginationParams } from "@/lib/pagination-utils"
import { 
  getTransactionsWithOffsetPagination,
  getAccountsWithOffsetPagination,
  getProjectsWithOffsetPagination,
  getCategoriesWithOffsetPagination
} from "@/lib/firebase-utils"
import type { Transaction, Account, Project, Category } from "@/lib/data"

// 分页数据Hook的通用接口
interface UsePaginatedDataOptions<T> {
  initialPageSize?: number
  autoLoad?: boolean
  filters?: Record<string, any>
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

interface UsePaginatedDataReturn<T> {
  data: T[]
  loading: boolean
  error: string | null
  pagination: ReturnType<typeof usePagination>
  refresh: () => Promise<void>
  loadData: (params?: Partial<PaginationParams>) => Promise<void>
}

// 分页交易数据Hook
export function usePaginatedTransactions(options: UsePaginatedDataOptions<Transaction> = {}): UsePaginatedDataReturn<Transaction> {
  const [data, setData] = React.useState<Transaction[]>([])
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  
  const pagination = usePagination(options.initialPageSize || 50)
  
  const loadData = React.useCallback(async (params?: Partial<PaginationParams>) => {
    setLoading(true)
    setError(null)
    
    try {
      const paginationParams = params || pagination.getPaginationParams()
      const result = await getTransactionsWithOffsetPagination({
        page: paginationParams.page || 1,
        pageSize: paginationParams.pageSize || 50,
        sortBy: paginationParams.sortBy || options.sortBy || 'date',
        sortOrder: paginationParams.sortOrder || options.sortOrder || 'desc',
        filters: {
          ...options.filters,
          ...paginationParams.filters
        }
      })
      
      setData(result.data)
      pagination.updatePagination({
        page: result.pagination.page,
        pageSize: result.pagination.pageSize,
        total: result.pagination.total,
        totalPages: result.pagination.totalPages
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载数据失败')
      console.error('加载分页交易数据失败:', err)
    } finally {
      setLoading(false)
    }
  }, [pagination, options.filters, options.sortBy, options.sortOrder])
  
  const refresh = React.useCallback(async () => {
    await loadData()
  }, [loadData])
  
  // 自动加载数据
  React.useEffect(() => {
    if (options.autoLoad !== false) {
      loadData()
    }
  }, [loadData, options.autoLoad])
  
  // 当分页参数变化时重新加载数据
  React.useEffect(() => {
    if (options.autoLoad !== false) {
      loadData()
    }
  }, [pagination.pagination.page, pagination.pagination.pageSize, pagination.sortBy, pagination.sortOrder, loadData, options.autoLoad])
  
  return {
    data,
    loading,
    error,
    pagination,
    refresh,
    loadData
  }
}

// 分页账户数据Hook
export function usePaginatedAccounts(options: UsePaginatedDataOptions<Account> = {}): UsePaginatedDataReturn<Account> {
  const [data, setData] = React.useState<Account[]>([])
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  
  const pagination = usePagination(options.initialPageSize || 50)
  
  const loadData = React.useCallback(async (params?: Partial<PaginationParams>) => {
    setLoading(true)
    setError(null)
    
    try {
      const paginationParams = params || pagination.getPaginationParams()
      const result = await getAccountsWithOffsetPagination({
        page: paginationParams.page || 1,
        pageSize: paginationParams.pageSize || 50,
        sortBy: paginationParams.sortBy || options.sortBy || 'code',
        sortOrder: paginationParams.sortOrder || options.sortOrder || 'asc',
        filters: {
          ...options.filters,
          ...paginationParams.filters
        }
      })
      
      setData(result.data)
      pagination.updatePagination({
        page: result.pagination.page,
        pageSize: result.pagination.pageSize,
        total: result.pagination.total,
        totalPages: result.pagination.totalPages
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载数据失败')
      console.error('加载分页账户数据失败:', err)
    } finally {
      setLoading(false)
    }
  }, [pagination, options.filters, options.sortBy, options.sortOrder])
  
  const refresh = React.useCallback(async () => {
    await loadData()
  }, [loadData])
  
  React.useEffect(() => {
    if (options.autoLoad !== false) {
      loadData()
    }
  }, [loadData, options.autoLoad])
  
  React.useEffect(() => {
    if (options.autoLoad !== false) {
      loadData()
    }
  }, [pagination.pagination.page, pagination.pagination.pageSize, pagination.sortBy, pagination.sortOrder, loadData, options.autoLoad])
  
  return {
    data,
    loading,
    error,
    pagination,
    refresh,
    loadData
  }
}

// 分页项目数据Hook
export function usePaginatedProjects(options: UsePaginatedDataOptions<Project> = {}): UsePaginatedDataReturn<Project> {
  const [data, setData] = React.useState<Project[]>([])
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  
  const pagination = usePagination(options.initialPageSize || 50)
  
  const loadData = React.useCallback(async (params?: Partial<PaginationParams>) => {
    setLoading(true)
    setError(null)
    
    try {
      const paginationParams = params || pagination.getPaginationParams()
      const result = await getProjectsWithOffsetPagination({
        page: paginationParams.page || 1,
        pageSize: paginationParams.pageSize || 50,
        sortBy: paginationParams.sortBy || options.sortBy || 'name',
        sortOrder: paginationParams.sortOrder || options.sortOrder || 'asc',
        filters: {
          ...options.filters,
          ...paginationParams.filters
        }
      })
      
      setData(result.data)
      pagination.updatePagination({
        page: result.pagination.page,
        pageSize: result.pagination.pageSize,
        total: result.pagination.total,
        totalPages: result.pagination.totalPages
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载数据失败')
      console.error('加载分页项目数据失败:', err)
    } finally {
      setLoading(false)
    }
  }, [pagination, options.filters, options.sortBy, options.sortOrder])
  
  const refresh = React.useCallback(async () => {
    await loadData()
  }, [loadData])
  
  React.useEffect(() => {
    if (options.autoLoad !== false) {
      loadData()
    }
  }, [loadData, options.autoLoad])
  
  React.useEffect(() => {
    if (options.autoLoad !== false) {
      loadData()
    }
  }, [pagination.pagination.page, pagination.pagination.pageSize, pagination.sortBy, pagination.sortOrder, loadData, options.autoLoad])
  
  return {
    data,
    loading,
    error,
    pagination,
    refresh,
    loadData
  }
}

// 分页分类数据Hook
export function usePaginatedCategories(options: UsePaginatedDataOptions<Category> = {}): UsePaginatedDataReturn<Category> {
  const [data, setData] = React.useState<Category[]>([])
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  
  const pagination = usePagination(options.initialPageSize || 50)
  
  const loadData = React.useCallback(async (params?: Partial<PaginationParams>) => {
    setLoading(true)
    setError(null)
    
    try {
      const paginationParams = params || pagination.getPaginationParams()
      const result = await getCategoriesWithOffsetPagination({
        page: paginationParams.page || 1,
        pageSize: paginationParams.pageSize || 50,
        sortBy: paginationParams.sortBy || options.sortBy || 'name',
        sortOrder: paginationParams.sortOrder || options.sortOrder || 'asc',
        filters: {
          ...options.filters,
          ...paginationParams.filters
        }
      })
      
      setData(result.data)
      pagination.updatePagination({
        page: result.pagination.page,
        pageSize: result.pagination.pageSize,
        total: result.pagination.total,
        totalPages: result.pagination.totalPages
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载数据失败')
      console.error('加载分页分类数据失败:', err)
    } finally {
      setLoading(false)
    }
  }, [pagination, options.filters, options.sortBy, options.sortOrder])
  
  const refresh = React.useCallback(async () => {
    await loadData()
  }, [loadData])
  
  React.useEffect(() => {
    if (options.autoLoad !== false) {
      loadData()
    }
  }, [loadData, options.autoLoad])
  
  React.useEffect(() => {
    if (options.autoLoad !== false) {
      loadData()
    }
  }, [pagination.pagination.page, pagination.pagination.pageSize, pagination.sortBy, pagination.sortOrder, loadData, options.autoLoad])
  
  return {
    data,
    loading,
    error,
    pagination,
    refresh,
    loadData
  }
}

// 虚拟滚动数据Hook
interface UseVirtualDataOptions<T> {
  itemHeight?: number
  containerHeight?: number
  overscan?: number
  onLoadMore?: () => Promise<void>
  hasMore?: boolean
}

interface UseVirtualDataReturn<T> {
  virtualizer: any
  items: T[]
  containerRef: React.RefObject<HTMLDivElement | null>
  totalSize: number
  virtualItems: any[]
}

export function useVirtualData<T>(
  data: T[],
  options: UseVirtualDataOptions<T> = {}
): UseVirtualDataReturn<T> {
  const {
    itemHeight = 50,
    containerHeight = 400,
    overscan = 5
  } = options
  
  const containerRef = React.useRef<HTMLDivElement>(null)
  
  const virtualizer = React.useMemo(() => {
    if (typeof window === 'undefined') return null
    
    const { useVirtualizer } = require('@tanstack/react-virtual')
    return useVirtualizer({
      count: data.length,
      getScrollElement: () => containerRef.current,
      estimateSize: () => itemHeight,
      overscan,
    })
  }, [data.length, itemHeight, overscan])
  
  return {
    virtualizer,
    items: data,
    containerRef,
    totalSize: virtualizer?.getTotalSize() || 0,
    virtualItems: virtualizer?.getVirtualItems() || []
  }
} 