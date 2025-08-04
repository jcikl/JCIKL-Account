import * as React from "react"

// 分页工具函数
export interface PaginationState {
  page: number
  pageSize: number
  total: number
  totalPages: number
}

export interface PaginationParams {
  page: number
  pageSize: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  filters?: Record<string, any>
}

export interface PaginatedResponse<T> {
  data: T[]
  pagination: PaginationState
}

// 计算分页信息
export function calculatePagination(
  total: number,
  page: number,
  pageSize: number
): PaginationState {
  const totalPages = Math.ceil(total / pageSize)
  return {
    page: Math.max(1, Math.min(page, totalPages)),
    pageSize,
    total,
    totalPages: Math.max(1, totalPages)
  }
}

// 生成分页参数
export function generatePaginationParams(
  page: number,
  pageSize: number,
  sortBy?: string,
  sortOrder?: 'asc' | 'desc',
  filters?: Record<string, any>
): PaginationParams {
  return {
    page: Math.max(1, page),
    pageSize: Math.max(1, Math.min(pageSize, 1000)), // 限制最大页面大小
    sortBy,
    sortOrder,
    filters
  }
}

// 验证分页参数
export function validatePaginationParams(params: PaginationParams): boolean {
  return (
    params.page > 0 &&
    params.pageSize > 0 &&
    params.pageSize <= 1000 &&
    (!params.sortOrder || ['asc', 'desc'].includes(params.sortOrder))
  )
}

// 生成分页查询字符串
export function generatePaginationQuery(params: PaginationParams): string {
  const searchParams = new URLSearchParams()
  
  searchParams.set('page', params.page.toString())
  searchParams.set('pageSize', params.pageSize.toString())
  
  if (params.sortBy) {
    searchParams.set('sortBy', params.sortBy)
  }
  
  if (params.sortOrder) {
    searchParams.set('sortOrder', params.sortOrder)
  }
  
  if (params.filters) {
    Object.entries(params.filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        searchParams.set(`filter_${key}`, value.toString())
      }
    })
  }
  
  return searchParams.toString()
}

// 解析分页查询字符串
export function parsePaginationQuery(query: string): PaginationParams {
  const searchParams = new URLSearchParams(query)
  const filters: Record<string, any> = {}
  
  // 解析过滤器
  for (const [key, value] of Array.from(searchParams.entries())) {
    if (key.startsWith('filter_')) {
      const filterKey = key.replace('filter_', '')
      filters[filterKey] = value
    }
  }
  
  return {
    page: parseInt(searchParams.get('page') || '1'),
    pageSize: parseInt(searchParams.get('pageSize') || '20'),
    sortBy: searchParams.get('sortBy') || undefined,
    sortOrder: (searchParams.get('sortOrder') as 'asc' | 'desc') || undefined,
    filters: Object.keys(filters).length > 0 ? filters : undefined
  }
}

// 分页状态管理 Hook
export function usePagination(initialPageSize: number = 20) {
  const [pagination, setPagination] = React.useState<PaginationState>({
    page: 1,
    pageSize: initialPageSize,
    total: 0,
    totalPages: 1
  })

  const [sortBy, setSortBy] = React.useState<string>()
  const [sortOrder, setSortOrder] = React.useState<'asc' | 'desc'>('desc')
  const [filters, setFilters] = React.useState<Record<string, any>>({})

  const updatePagination = React.useCallback((updates: Partial<PaginationState>) => {
    setPagination(prev => {
      const newPagination = { ...prev, ...updates }
      return calculatePagination(newPagination.total, newPagination.page, newPagination.pageSize)
    })
  }, [])

  const goToPage = React.useCallback((page: number) => {
    updatePagination({ page })
  }, [updatePagination])

  const changePageSize = React.useCallback((pageSize: number) => {
    updatePagination({ pageSize, page: 1 })
  }, [updatePagination])

  const updateFilters = React.useCallback((newFilters: Record<string, any>) => {
    setFilters(newFilters)
    updatePagination({ page: 1 }) // 重置到第一页
  }, [updatePagination])

  const clearFilters = React.useCallback(() => {
    setFilters({})
    updatePagination({ page: 1 })
  }, [updatePagination])

  const getPaginationParams = React.useCallback((): PaginationParams => {
    return generatePaginationParams(pagination.page, pagination.pageSize, sortBy, sortOrder, filters)
  }, [pagination.page, pagination.pageSize, sortBy, sortOrder, filters])

  const hasNextPage = pagination.page < pagination.totalPages
  const hasPrevPage = pagination.page > 1

  return {
    pagination,
    sortBy,
    sortOrder,
    filters,
    updatePagination,
    goToPage,
    changePageSize,
    updateFilters,
    clearFilters,
    getPaginationParams,
    hasNextPage,
    hasPrevPage
  }
}

// 分页组件 Props
export interface PaginationProps {
  pagination: PaginationState
  onPageChange: (page: number) => void
  onPageSizeChange: (pageSize: number) => void
  pageSizeOptions?: number[]
  showPageSizeSelector?: boolean
  showTotal?: boolean
  className?: string
}

// 分页组件
export function Pagination({
  pagination,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [20, 50, 100, 200],
  showPageSizeSelector = true,
  showTotal = true,
  className = ""
}: PaginationProps) {
  const { page, pageSize, total, totalPages } = pagination

  const handlePageSizeChange = React.useCallback((event: React.ChangeEvent<HTMLSelectElement>) => {
    onPageSizeChange(parseInt(event.target.value))
  }, [onPageSizeChange])

  const goToFirstPage = React.useCallback(() => {
    if (page > 1) onPageChange(1)
  }, [page, onPageChange])

  const goToPrevPage = React.useCallback(() => {
    if (page > 1) onPageChange(page - 1)
  }, [page, onPageChange])

  const goToNextPage = React.useCallback(() => {
    if (page < totalPages) onPageChange(page + 1)
  }, [page, totalPages, onPageChange])

  const goToLastPage = React.useCallback(() => {
    if (page < totalPages) onPageChange(totalPages)
  }, [page, totalPages, onPageChange])

  if (totalPages <= 1) return null

  return (
    <div className={`flex items-center justify-between ${className}`}>
      <div className="flex items-center space-x-2">
        {showTotal && (
          <span className="text-sm text-muted-foreground">
            共 {total} 条记录
          </span>
        )}
        
        {showPageSizeSelector && (
          <div className="flex items-center space-x-2">
            <span className="text-sm text-muted-foreground">每页</span>
            <select
              value={pageSize}
              onChange={handlePageSizeChange}
              className="border rounded px-2 py-1 text-sm"
            >
              {pageSizeOptions.map(size => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
            <span className="text-sm text-muted-foreground">条</span>
          </div>
        )}
      </div>

      <div className="flex items-center space-x-2">
        <button
          onClick={goToFirstPage}
          disabled={page <= 1}
          className="px-2 py-1 text-sm border rounded disabled:opacity-50 disabled:cursor-not-allowed"
        >
          首页
        </button>
        
        <button
          onClick={goToPrevPage}
          disabled={page <= 1}
          className="px-2 py-1 text-sm border rounded disabled:opacity-50 disabled:cursor-not-allowed"
        >
          上一页
        </button>
        
        <span className="text-sm">
          第 {page} 页，共 {totalPages} 页
        </span>
        
        <button
          onClick={goToNextPage}
          disabled={page >= totalPages}
          className="px-2 py-1 text-sm border rounded disabled:opacity-50 disabled:cursor-not-allowed"
        >
          下一页
        </button>
        
        <button
          onClick={goToLastPage}
          disabled={page >= totalPages}
          className="px-2 py-1 text-sm border rounded disabled:opacity-50 disabled:cursor-not-allowed"
        >
          末页
        </button>
      </div>
    </div>
  )
} 