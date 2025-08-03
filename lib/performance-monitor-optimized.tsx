// lib/performance-monitor-optimized.tsx
import React from "react"

interface PerformanceMetric {
  name: string
  value: number
  unit: string
  timestamp: number
}

interface PerformanceData {
  metrics: PerformanceMetric[]
  averages: Record<string, number>
  counts: Record<string, number>
}

class OptimizedPerformanceMonitor {
  private metrics: PerformanceMetric[] = []
  private observers: ((data: PerformanceData) => void)[] = []
  private isMonitoring = false
  private debugMode = process.env.NODE_ENV === 'development'

  // 开始监控
  start() {
    if (this.isMonitoring) return
    this.isMonitoring = true
    
    // 监控页面加载性能
    this.monitorPageLoad()
    
    // 监控网络请求
    this.monitorNetworkRequests()
    
    // 监控内存使用
    this.monitorMemoryUsage()
    
    // 监控长任务
    this.monitorLongTasks()
    
    // 只在开发模式下输出console
    if (this.debugMode) {
      // console.log('Performance monitoring started')
    }
  }

  // 停止监控
  stop() {
    this.isMonitoring = false
    if (this.debugMode) {
      // console.log('Performance monitoring stopped')
    }
  }

  // 添加性能指标
  addMetric(name: string, value: number, unit: string = 'ms') {
    const metric: PerformanceMetric = {
      name,
      value,
      unit,
      timestamp: Date.now()
    }
    
    this.metrics.push(metric)
    
    // 保持最近1000个指标
    if (this.metrics.length > 1000) {
      this.metrics = this.metrics.slice(-1000)
    }
    
    this.notifyObservers()
  }

  // 监控页面加载性能
  private monitorPageLoad() {
    if (typeof window === 'undefined') return
    
    window.addEventListener('load', () => {
      setTimeout(() => {
        const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
        
        if (navigation) {
          this.addMetric('DOMContentLoaded', navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart)
          this.addMetric('LoadComplete', navigation.loadEventEnd - navigation.loadEventStart)
          this.addMetric('FirstPaint', performance.getEntriesByName('first-paint')[0]?.startTime || 0)
          this.addMetric('FirstContentfulPaint', performance.getEntriesByName('first-contentful-paint')[0]?.startTime || 0)
        }
      }, 0)
    })
  }

  // 监控网络请求
  private monitorNetworkRequests() {
    if (typeof window === 'undefined') return
    
    const originalFetch = window.fetch
    window.fetch = async (...args) => {
      const startTime = performance.now()
      try {
        const response = await originalFetch(...args)
        const endTime = performance.now()
        this.addMetric('FetchRequest', endTime - startTime)
        return response
      } catch (error) {
        const endTime = performance.now()
        this.addMetric('FetchError', endTime - startTime)
        throw error
      }
    }
  }

  // 监控内存使用
  private monitorMemoryUsage() {
    if (typeof window === 'undefined' || !(performance as any).memory) return
    
    setInterval(() => {
      const memory = (performance as any).memory
      this.addMetric('MemoryUsed', memory.usedJSHeapSize / 1024 / 1024, 'MB')
      this.addMetric('MemoryTotal', memory.totalJSHeapSize / 1024 / 1024, 'MB')
      this.addMetric('MemoryLimit', memory.jsHeapSizeLimit / 1024 / 1024, 'MB')
    }, 5000) // 每5秒监控一次
  }

  // 监控长任务
  private monitorLongTasks() {
    if (typeof window === 'undefined' || !('PerformanceObserver' in window)) return
    
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.duration > 50) { // 超过50ms的任务
          this.addMetric('LongTask', entry.duration)
        }
      }
    })
    
    observer.observe({ entryTypes: ['longtask'] })
  }

  // 监控组件渲染时间
  monitorComponentRender(componentName: string, renderTime: number) {
    this.addMetric(`ComponentRender_${componentName}`, renderTime)
  }

  // 监控数据加载时间
  monitorDataLoad(operationName: string, loadTime: number) {
    this.addMetric(`DataLoad_${operationName}`, loadTime)
  }

  // 监控用户交互响应时间
  monitorInteraction(interactionName: string, responseTime: number) {
    this.addMetric(`Interaction_${interactionName}`, responseTime)
  }

  // 获取性能数据
  getPerformanceData(): PerformanceData {
    const averages: Record<string, number> = {}
    const counts: Record<string, number> = {}
    
    // 按指标名称分组计算平均值
    const groupedMetrics = this.metrics.reduce((acc, metric) => {
      if (!acc[metric.name]) {
        acc[metric.name] = []
      }
      acc[metric.name].push(metric.value)
      return acc
    }, {} as Record<string, number[]>)
    
    // 计算平均值和计数
    Object.entries(groupedMetrics).forEach(([name, values]) => {
      averages[name] = values.reduce((sum, val) => sum + val, 0) / values.length
      counts[name] = values.length
    })
    
    return {
      metrics: [...this.metrics],
      averages,
      counts
    }
  }

  // 获取特定指标的统计数据
  getMetricStats(metricName: string) {
    const metrics = this.metrics.filter(m => m.name === metricName)
    if (metrics.length === 0) return null
    
    const values = metrics.map(m => m.value)
    const avg = values.reduce((sum, val) => sum + val, 0) / values.length
    const min = Math.min(...values)
    const max = Math.max(...values)
    
    return {
      name: metricName,
      count: metrics.length,
      average: avg,
      min,
      max,
      recent: values.slice(-10) // 最近10个值
    }
  }

  // 清理旧数据
  clearOldData(olderThanHours: number = 24) {
    const cutoffTime = Date.now() - (olderThanHours * 60 * 60 * 1000)
    this.metrics = this.metrics.filter(m => m.timestamp > cutoffTime)
  }

  // 添加观察者
  addObserver(callback: (data: PerformanceData) => void) {
    this.observers.push(callback)
  }

  // 移除观察者
  removeObserver(callback: (data: PerformanceData) => void) {
    this.observers = this.observers.filter(obs => obs !== callback)
  }

  // 通知观察者
  private notifyObservers() {
    const data = this.getPerformanceData()
    this.observers.forEach(callback => {
      try {
        callback(data)
      } catch (error) {
        // 只在开发模式下输出错误
        if (this.debugMode) {
          // console.error('Error in performance observer:', error)
        }
      }
    })
  }

  // 导出性能报告
  exportReport(): string {
    const data = this.getPerformanceData()
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        totalMetrics: data.metrics.length,
        uniqueMetrics: Object.keys(data.averages).length,
        monitoringDuration: this.metrics.length > 0 
          ? (Date.now() - this.metrics[0].timestamp) / 1000 / 60 
          : 0 // 分钟
      },
      averages: data.averages,
      recentMetrics: data.metrics.slice(-50) // 最近50个指标
    }
    
    return JSON.stringify(report, null, 2)
  }
}

// 创建全局实例
export const optimizedPerformanceMonitor = new OptimizedPerformanceMonitor()

// React Hook for performance monitoring
export function useOptimizedPerformanceMonitor() {
  React.useEffect(() => {
    optimizedPerformanceMonitor.start()
    return () => {
      optimizedPerformanceMonitor.stop()
    }
  }, [])

  const addMetric = React.useCallback((name: string, value: number, unit?: string) => {
    optimizedPerformanceMonitor.addMetric(name, value, unit)
  }, [])

  const getData = React.useCallback(() => {
    return optimizedPerformanceMonitor.getPerformanceData()
  }, [])

  const getStats = React.useCallback((metricName: string) => {
    return optimizedPerformanceMonitor.getMetricStats(metricName)
  }, [])

  return {
    addMetric,
    getData,
    getStats,
    exportReport: optimizedPerformanceMonitor.exportReport.bind(optimizedPerformanceMonitor)
  }
}

// 优化版性能监控组件
export function OptimizedPerformanceMonitorComponent() {
  const { getData, exportReport } = useOptimizedPerformanceMonitor()
  const [data, setData] = React.useState<PerformanceData | null>(null)
  const [isVisible, setIsVisible] = React.useState(false)

  React.useEffect(() => {
    const interval = setInterval(() => {
      setData(getData())
    }, 5000) // 每5秒更新一次

    return () => clearInterval(interval)
  }, [getData])

  if (!isVisible) {
    return (
      <button
        onClick={() => setIsVisible(true)}
        className="fixed bottom-4 right-4 bg-green-500 text-white p-2 rounded-full shadow-lg"
        title="显示优化版性能监控"
      >
        📈
      </button>
    )
  }

  return (
    <div className="fixed bottom-4 right-4 bg-white border rounded-lg shadow-lg p-4 max-w-sm max-h-96 overflow-auto">
      <div className="flex justify-between items-center mb-2">
        <h3 className="font-bold">优化版性能监控</h3>
        <button
          onClick={() => setIsVisible(false)}
          className="text-gray-500 hover:text-gray-700"
        >
          ✕
        </button>
      </div>
      
      {data && (
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-green-600 font-semibold">优化版</span>
            <span className="text-xs text-gray-500">(减少console输出)</span>
          </div>
          
          <div>总指标数: {data.metrics.length}</div>
          <div>指标类型: {Object.keys(data.averages).length}</div>
          
          {Object.entries(data.averages).slice(0, 5).map(([name, avg]) => (
            <div key={name} className="flex justify-between">
              <span>{name}:</span>
              <span>{avg.toFixed(2)}ms</span>
            </div>
          ))}
          
          <button
            onClick={() => {
              const report = exportReport()
              const blob = new Blob([report], { type: 'application/json' })
              const url = URL.createObjectURL(blob)
              const a = document.createElement('a')
              a.href = url
              a.download = `optimized-performance-report-${new Date().toISOString().split('T')[0]}.json`
              a.click()
              URL.revokeObjectURL(url)
            }}
            className="w-full mt-2 bg-green-500 text-white p-1 rounded text-xs"
          >
            导出报告
          </button>
        </div>
      )}
    </div>
  )
} 