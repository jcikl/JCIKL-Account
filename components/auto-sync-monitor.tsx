// components/auto-sync-monitor.tsx
import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { 
  Activity, 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  RefreshCw,
  Play,
  Pause,
  Trash2
} from 'lucide-react'
import { getAutoSyncStatus, autoSyncService } from '@/lib/auto-sync-service'
import { eventBus } from '@/lib/event-bus'

interface SyncEvent {
  id: string
  type: string
  timestamp: Date
  status: 'success' | 'error' | 'pending'
  message: string
}

export function AutoSyncMonitor() {
  const [status, setStatus] = React.useState(getAutoSyncStatus())
  const [events, setEvents] = React.useState<SyncEvent[]>([])
  const [isMonitoring, setIsMonitoring] = React.useState(false)
  const [eventCount, setEventCount] = React.useState(0)

  // 更新状态
  const updateStatus = React.useCallback(() => {
    setStatus(getAutoSyncStatus())
  }, [])

  // 添加事件
  const addEvent = React.useCallback((type: string, message: string, status: 'success' | 'error' | 'pending' = 'success') => {
    const newEvent: SyncEvent = {
      id: Date.now().toString(),
      type,
      timestamp: new Date(),
      status,
      message
    }
    
    setEvents(prev => [newEvent, ...prev.slice(0, 9)]) // 保留最近10个事件
    setEventCount(prev => prev + 1)
  }, [])

  // 开始监控
  const startMonitoring = React.useCallback(() => {
    setIsMonitoring(true)
    
    // 监听事件总线
    const unsubscribe = eventBus.on('transaction:created', () => {
      addEvent('交易创建', '检测到新交易创建', 'success')
    })
    
    const unsubscribe2 = eventBus.on('transaction:updated', () => {
      addEvent('交易更新', '检测到交易更新', 'success')
    })
    
    const unsubscribe3 = eventBus.on('project:updated', () => {
      addEvent('项目更新', '检测到项目更新', 'success')
    })
    
    const unsubscribe4 = eventBus.on('bankAccount:updated', () => {
      addEvent('银行账户更新', '检测到银行账户更新', 'success')
    })

    return () => {
      unsubscribe()
      unsubscribe2()
      unsubscribe3()
      unsubscribe4()
    }
  }, [addEvent])

  // 停止监控
  const stopMonitoring = React.useCallback(() => {
    setIsMonitoring(false)
  }, [])

  // 清理事件
  const clearEvents = React.useCallback(() => {
    setEvents([])
    setEventCount(0)
  }, [])

  // 定期更新状态
  React.useEffect(() => {
    const interval = setInterval(updateStatus, 1000)
    return () => clearInterval(interval)
  }, [updateStatus])

  // 监控控制
  React.useEffect(() => {
    let cleanup: (() => void) | undefined
    
    if (isMonitoring) {
      cleanup = startMonitoring()
    }
    
    return () => {
      if (cleanup) cleanup()
    }
  }, [isMonitoring, startMonitoring])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'bg-green-500'
      case 'error': return 'bg-red-500'
      case 'pending': return 'bg-yellow-500'
      default: return 'bg-gray-500'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success': return <CheckCircle className="h-4 w-4" />
      case 'error': return <AlertCircle className="h-4 w-4" />
      case 'pending': return <Clock className="h-4 w-4" />
      default: return <Activity className="h-4 w-4" />
    }
  }

  return (
    <div className="space-y-4">
      {/* 状态卡片 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            自动同步状态
          </CardTitle>
          <CardDescription>
            监控模块间的自动关联更新状态
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold">{status.isInitialized ? '✅' : '❌'}</div>
              <div className="text-sm text-muted-foreground">服务状态</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{status.queueLength}</div>
              <div className="text-sm text-muted-foreground">队列长度</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{status.isProcessing ? '🔄' : '⏸️'}</div>
              <div className="text-sm text-muted-foreground">处理状态</div>
            </div>
          </div>
          
          <Separator />
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Badge variant={status.isInitialized ? "default" : "secondary"}>
                {status.isInitialized ? "已初始化" : "未初始化"}
              </Badge>
              <Badge variant={status.isProcessing ? "default" : "outline"}>
                {status.isProcessing ? "处理中" : "空闲"}
              </Badge>
            </div>
            
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={updateStatus}
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 事件监控卡片 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              事件监控
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline">
                {eventCount} 个事件
              </Badge>
              <Button
                size="sm"
                variant={isMonitoring ? "destructive" : "default"}
                onClick={isMonitoring ? stopMonitoring : startMonitoring}
              >
                {isMonitoring ? (
                  <>
                    <Pause className="h-4 w-4 mr-1" />
                    停止
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4 mr-1" />
                    开始
                  </>
                )}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={clearEvents}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </CardTitle>
          <CardDescription>
            实时监控模块间的事件通讯
          </CardDescription>
        </CardHeader>
        <CardContent>
          {events.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {isMonitoring ? "等待事件..." : "点击开始按钮开始监控"}
            </div>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {events.map((event) => (
                <div
                  key={event.id}
                  className="flex items-center justify-between p-2 rounded-lg border"
                >
                  <div className="flex items-center gap-2">
                    <div className={getStatusColor(event.status)}>
                      {getStatusIcon(event.status)}
                    </div>
                    <div>
                      <div className="font-medium">{event.type}</div>
                      <div className="text-sm text-muted-foreground">
                        {event.message}
                      </div>
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {event.timestamp.toLocaleTimeString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 统计信息卡片 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            同步统计
          </CardTitle>
          <CardDescription>
            自动同步服务的运行统计
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {eventBus.getEventTypes().length}
              </div>
              <div className="text-sm text-muted-foreground">注册事件类型</div>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {eventBus.getEventTypes().reduce((total, type) => 
                  total + eventBus.getListenerCount(type), 0
                )}
              </div>
              <div className="text-sm text-muted-foreground">活跃监听器</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
