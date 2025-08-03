import React from "react"
import { BankTransactionsOptimized } from "@/components/modules/bank-transactions-optimized"
import { DashboardOverviewOptimized } from "@/components/modules/dashboard-overview-optimized"
import { PerformanceMonitorComponent } from "@/lib/performance-monitor"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function PerformanceTestPage() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2">性能优化测试页面</h1>
        <p className="text-muted-foreground">
          测试优化后的组件性能和数据加载速度
        </p>
      </div>

      <Tabs defaultValue="dashboard" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="dashboard">仪表板优化</TabsTrigger>
          <TabsTrigger value="transactions">交易记录优化</TabsTrigger>
        </TabsList>
        
        <TabsContent value="dashboard" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>优化说明</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="list-disc list-inside space-y-2 text-sm">
                <li>并行数据加载：同时加载交易和项目数据</li>
                <li>缓存优化：使用内存缓存减少重复请求</li>
                <li>组件优化：使用React.memo减少不必要的重渲染</li>
                <li>计算优化：使用useMemo缓存计算结果</li>
                <li>数据限制：只显示最近30天的交易和活跃项目</li>
              </ul>
            </CardContent>
          </Card>
          
          <DashboardOverviewOptimized />
        </TabsContent>
        
        <TabsContent value="transactions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>优化说明</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="list-disc list-inside space-y-2 text-sm">
                <li>分页加载：每次只加载50条记录，支持加载更多</li>
                <li>过滤优化：使用useMemo缓存过滤结果</li>
                <li>组件优化：交易行组件使用React.memo</li>
                <li>状态优化：使用useCallback优化事件处理函数</li>
                <li>缓存管理：提供缓存清理功能</li>
              </ul>
            </CardContent>
          </Card>
          
          <BankTransactionsOptimized />
        </TabsContent>
      </Tabs>

      {/* 性能监控组件 */}
      <PerformanceMonitorComponent />
    </div>
  )
} 