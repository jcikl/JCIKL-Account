"use client"

import React from "react"
import { BankTransactionsOptimized } from "@/components/modules/bank-transactions-optimized"
import { DashboardOverviewOptimized } from "@/components/modules/dashboard-overview-optimized"
import { PerformanceMonitorComponent } from "@/lib/performance-monitor"
import { OptimizedPerformanceMonitorComponent } from "@/lib/performance-monitor-optimized"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"

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
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="dashboard">仪表板优化</TabsTrigger>
          <TabsTrigger value="transactions">交易记录优化</TabsTrigger>
          <TabsTrigger value="console-test">Console性能测试</TabsTrigger>
          <TabsTrigger value="monitor-compare">监控对比</TabsTrigger>
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

        <TabsContent value="console-test" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Console性能影响测试</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">测试目的：</h3>
                  <p className="text-sm text-muted-foreground">
                    验证console.log对JavaScript执行性能的影响，并提供优化建议。
                  </p>
                </div>
                
                <div>
                  <h3 className="font-semibold mb-2">测试方法：</h3>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    <li>执行相同的计算任务（100万次随机数累加）</li>
                    <li>一组包含5个console.log输出</li>
                    <li>一组不包含任何console输出</li>
                    <li>比较两组操作的执行时间</li>
                  </ul>
                </div>

                <div className="flex justify-center">
                  <Button 
                    onClick={() => window.open('/console-performance-test', '_blank')}
                    className="px-6 py-2"
                  >
                    开始Console性能测试
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Console优化建议</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">1. 使用构建工具移除console</h4>
                  <div className="bg-gray-100 p-3 rounded text-sm font-mono">
                    <div>// webpack配置示例</div>
                    <div>new TerserPlugin({</div>
                    <div>  terserOptions: {</div>
                    <div>    compress: {</div>
                    <div>      drop_console: true</div>
                    <div>    }</div>
                    <div>  }</div>
                    <div>})</div>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-semibold mb-2">2. 条件性console输出</h4>
                  <div className="bg-gray-100 p-3 rounded text-sm font-mono">
                    <div>if (process.env.NODE_ENV === 'development') {'{'}</div>
                    <div>  console.log('Debug info');</div>
                    <div>{'}'}</div>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-semibold mb-2">3. 使用专门的日志库</h4>
                  <div className="bg-gray-100 p-3 rounded text-sm font-mono">
                    <div>import { logger } from './logger';</div>
                    <div>logger.debug('Debug info');</div>
                    <div>logger.info('Info message');</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="monitor-compare" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>性能监控对比</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-semibold mb-2 flex items-center gap-2">
                      <Badge variant="destructive">原始版</Badge>
                      性能监控
                    </h4>
                    <ul className="list-disc list-inside space-y-1 text-sm">
                      <li>包含console.log输出</li>
                      <li>开发和生产环境都有日志</li>
                      <li>可能影响性能</li>
                      <li>便于调试</li>
                    </ul>
                  </div>
                  
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-semibold mb-2 flex items-center gap-2">
                      <Badge variant="default">优化版</Badge>
                      性能监控
                    </h4>
                    <ul className="list-disc list-inside space-y-1 text-sm">
                      <li>条件性console输出</li>
                      <li>只在开发环境输出日志</li>
                      <li>减少性能影响</li>
                      <li>生产环境更高效</li>
                    </ul>
                  </div>
                </div>

                <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-semibold mb-2">对比说明：</h4>
                  <p className="text-sm">
                    优化版性能监控通过条件性console输出减少了不必要的日志输出，
                    在生产环境中可以显著提升性能。两个监控组件会同时显示在页面右下角，
                    可以对比它们的性能差异。
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* 原始性能监控组件 */}
      <PerformanceMonitorComponent />
      
      {/* 优化版性能监控组件 */}
      <OptimizedPerformanceMonitorComponent />
    </div>
  )
} 