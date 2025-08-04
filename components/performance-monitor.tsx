// components/performance-monitor.tsx
import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { 
  Activity, 
  Clock, 
  Database, 
  Memory, 
  Network, 
  RefreshCw,
  TrendingUp,
  TrendingDown,
  AlertTriangle
} from 'lucide-react'
import { useCachePerformance, globalCache } from '@/lib/optimized-cache'

// 性能指标接口
interface PerformanceMetrics {
  loadTime: number
  renderTime: number
  memoryUsage: number
  cacheHitRate: number
  networkRequests: number
  errors: number
}

// 用户体验指标
interface UXMetrics {
  timeToInteractive: number
  firstContentfulPaint: number
  largestContentfulPaint: number
  cumulativeLayoutShift: number
}

export function PerformanceMonitor() {
  const [isVisible, setIsVisible] = React.useState(false)
  const [metrics, setMetrics] = React.useState<PerformanceMetrics>({
    loadTime: 0,
    renderTime: 0,
    memoryUsage: 0,
    cacheHitRate: 0,
    networkRequests: 0,
    errors: 0
  })
  const [uxMetrics, setUxMetrics] = React.useState<UXMetrics>({
    timeToInteractive: 0,
    firstContentfulPaint: 0,
    largestContentfulPaint: 0,
    cumulativeLayoutShift: 0
  })
  const [isMonitoring, setIsMonitoring] = React.useState(false)
  const cacheStats = useCachePerformance()

  // 性能监控
  const startMonitoring = React.useCallback(() => {
    setIsMonitoring(true)
    
    // 监控页面加载性能
    if ('performance' in window) {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'navigation') {
            const navEntry = entry as PerformanceNavigationTiming
            setMetrics(prev => ({
              ...prev,
              loadTime: navEntry.loadEventEnd - navEntry.loadEventStart,
              renderTime: navEntry.domContentLoadedEventEnd - navEntry.domContentLoadedEventStart
            }))
          }
        }
      })
      
      observer.observe({ entryTypes: ['navigation'] })
    }

    // 监控内存使用
    if ('memory' in performance) {
      const updateMemoryUsage = () => {
        const memory = (performance as any).memory
        setMetrics(prev => ({
          ...prev,
          memoryUsage: memory.usedJSHeapSize / memory.jsHeapSizeLimit
        }))
      }
      
      const interval = setInterval(updateMemoryUsage, 5000)
      return () => clearInterval(interval)
    }
  }, [])

  // 监控用户体验指标
  React.useEffect(() => {
    if (!isMonitoring) return

    // First Contentful Paint
    if ('PerformanceObserver' in window) {
      const paintObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.name === 'first-contentful-paint') {
            setUxMetrics(prev => ({
              ...prev,
              firstContentfulPaint: entry.startTime
            }))
          }
        }
      })
      
      paintObserver.observe({ entryTypes: ['paint'] })
    }

    // Largest Contentful Paint
    if ('PerformanceObserver' in window) {
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries()
        const lastEntry = entries[entries.length - 1]
        setUxMetrics(prev => ({
          ...prev,
          largestContentfulPaint: lastEntry.startTime
        }))
      })
      
      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] })
    }

    // Cumulative Layout Shift
    if ('PerformanceObserver' in window) {
      let clsValue = 0
      const clsObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (!(entry as any).hadRecentInput) {
            clsValue += (entry as any).value
          }
        }
        setUxMetrics(prev => ({
          ...prev,
          cumulativeLayoutShift: clsValue
        }))
      })
      
      clsObserver.observe({ entryTypes: ['layout-shift'] })
    }
  }, [isMonitoring])

  // 获取性能等级
  const getPerformanceGrade = (metric: number, thresholds: { good: number; needsImprovement: number }) => {
    if (metric <= thresholds.good) return { grade: 'A', color: 'text-green-600', bg: 'bg-green-100' }
    if (metric <= thresholds.needsImprovement) return { grade: 'B', color: 'text-yellow-600', bg: 'bg-yellow-100' }
    return { grade: 'C', color: 'text-red-600', bg: 'bg-red-100' }
  }

  // 性能指标卡片
  const MetricCard = ({ 
    title, 
    value, 
    unit, 
    icon: Icon, 
    trend, 
    thresholds 
  }: {
    title: string
    value: number
    unit: string
    icon: React.ComponentType<{ className?: string }>
    trend?: 'up' | 'down' | 'stable'
    thresholds?: { good: number; needsImprovement: number }
  }) => {
    const grade = thresholds ? getPerformanceGrade(value, thresholds) : null
    
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
          <Icon className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="text-2xl font-bold">
              {value.toFixed(2)}{unit}
            </div>
            {grade && (
              <Badge className={`${grade.bg} ${grade.color}`}>
                {grade.grade}
              </Badge>
            )}
          </div>
          {trend && (
            <div className="flex items-center text-xs text-muted-foreground mt-1">
              {trend === 'up' && <TrendingUp className="h-3 w-3 mr-1 text-green-600" />}
              {trend === 'down' && <TrendingDown className="h-3 w-3 mr-1 text-red-600" />}
              {trend === 'stable' && <Activity className="h-3 w-3 mr-1 text-blue-600" />}
              {trend === 'up' ? '改善' : trend === 'down' ? '下降' : '稳定'}
            </div>
          )}
        </CardContent>
      </Card>
    )
  }

  // 缓存统计卡片
  const CacheStatsCard = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          缓存统计
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-muted-foreground">命中率</p>
            <p className="text-2xl font-bold">
              {(cacheStats.hits / (cacheStats.hits + cacheStats.misses) * 100).toFixed(1)}%
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">缓存项</p>
            <p className="text-2xl font-bold">{cacheStats.size}</p>
          </div>
        </div>
        <div>
          <p className="text-sm text-muted-foreground mb-2">内存使用</p>
          <Progress value={(cacheStats.memoryUsage / 1024 / 1024) * 100} className="h-2" />
          <p className="text-xs text-muted-foreground mt-1">
            {(cacheStats.memoryUsage / 1024 / 1024).toFixed(2)} MB
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            size="sm" 
            variant="outline"
            onClick={() => globalCache.clear()}
          >
            清空缓存
          </Button>
          <Button 
            size="sm" 
            variant="outline"
            onClick={() => globalCache.cleanup()}
          >
            清理过期
          </Button>
        </div>
      </CardContent>
    </Card>
  )

  // 用户体验指标卡片
  const UXMetricsCard = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          用户体验指标
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <MetricCard
            title="首次内容绘制"
            value={uxMetrics.firstContentfulPaint}
            unit="ms"
            icon={Clock}
            thresholds={{ good: 1800, needsImprovement: 3000 }}
          />
          <MetricCard
            title="最大内容绘制"
            value={uxMetrics.largestContentfulPaint}
            unit="ms"
            icon={TrendingUp}
            thresholds={{ good: 2500, needsImprovement: 4000 }}
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <MetricCard
            title="累积布局偏移"
            value={uxMetrics.cumulativeLayoutShift}
            unit=""
            icon={AlertTriangle}
            thresholds={{ good: 0.1, needsImprovement: 0.25 }}
          />
          <MetricCard
            title="可交互时间"
            value={uxMetrics.timeToInteractive}
            unit="ms"
            icon={Activity}
            thresholds={{ good: 3800, needsImprovement: 7300 }}
          />
        </div>
      </CardContent>
    </Card>
  )

  if (!isVisible) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Button
          onClick={() => setIsVisible(true)}
          size="sm"
          variant="outline"
          className="shadow-lg"
        >
          <Activity className="h-4 w-4 mr-2" />
          性能监控
        </Button>
      </div>
    )
  }

  return (
    <div className="fixed inset-4 z-50 bg-background/95 backdrop-blur-sm border rounded-lg shadow-2xl overflow-auto">
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">性能监控面板</h2>
          <div className="flex gap-2">
            <Button
              onClick={startMonitoring}
              disabled={isMonitoring}
              size="sm"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              {isMonitoring ? '监控中...' : '开始监控'}
            </Button>
            <Button
              onClick={() => setIsVisible(false)}
              size="sm"
              variant="outline"
            >
              关闭
            </Button>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <MetricCard
            title="页面加载时间"
            value={metrics.loadTime}
            unit="ms"
            icon={Clock}
            thresholds={{ good: 2000, needsImprovement: 4000 }}
          />
          <MetricCard
            title="渲染时间"
            value={metrics.renderTime}
            unit="ms"
            icon={Activity}
            thresholds={{ good: 1000, needsImprovement: 2000 }}
          />
          <MetricCard
            title="内存使用率"
            value={metrics.memoryUsage * 100}
            unit="%"
            icon={Memory}
            thresholds={{ good: 70, needsImprovement: 90 }}
          />
          <MetricCard
            title="网络请求数"
            value={metrics.networkRequests}
            unit=""
            icon={Network}
          />
          <MetricCard
            title="错误数量"
            value={metrics.errors}
            unit=""
            icon={AlertTriangle}
          />
          <MetricCard
            title="缓存命中率"
            value={cacheStats.hits / (cacheStats.hits + cacheStats.misses) * 100}
            unit="%"
            icon={Database}
          />
        </div>

        <div className="grid gap-6 mt-6 md:grid-cols-2">
          <CacheStatsCard />
          <UXMetricsCard />
        </div>
      </div>
    </div>
  )
} 