"use client"

import React, { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

export default function ConsolePerformanceTestPage() {
  const [results, setResults] = useState<{
    withConsole: number[]
    withoutConsole: number[]
  }>({ withConsole: [], withoutConsole: [] })
  const [isRunning, setIsRunning] = useState(false)
  const [currentTest, setCurrentTest] = useState<string>("")

  // 模拟有console.log的操作
  const operationWithConsole = () => {
    const start = performance.now()
    
    // 模拟一些计算
    let sum = 0
    for (let i = 0; i < 1000000; i++) {
      sum += Math.random()
    }
    
    // 添加多个console.log
    console.log('Processing data...')
    console.log('Current sum:', sum)
    console.log('Iteration count:', 1000000)
    console.log('Random value:', Math.random())
    console.log('Timestamp:', new Date().toISOString())
    
    const end = performance.now()
    return end - start
  }

  // 模拟没有console.log的操作
  const operationWithoutConsole = () => {
    const start = performance.now()
    
    // 模拟一些计算
    let sum = 0
    for (let i = 0; i < 1000000; i++) {
      sum += Math.random()
    }
    
    const end = performance.now()
    return end - start
  }

  // 运行性能测试
  const runPerformanceTest = async () => {
    setIsRunning(true)
    const testResults = { withConsole: [], withoutConsole: [] }
    
    // 运行10次测试
    for (let i = 0; i < 10; i++) {
      setCurrentTest(`测试 ${i + 1}/10 - 有console.log`)
      await new Promise(resolve => setTimeout(resolve, 100)) // 短暂延迟
      testResults.withConsole.push(operationWithConsole())
      
      setCurrentTest(`测试 ${i + 1}/10 - 无console.log`)
      await new Promise(resolve => setTimeout(resolve, 100)) // 短暂延迟
      testResults.withoutConsole.push(operationWithoutConsole())
    }
    
    setResults(testResults)
    setIsRunning(false)
    setCurrentTest("")
  }

  // 计算统计数据
  const calculateStats = (data: number[]) => {
    if (data.length === 0) return null
    
    const avg = data.reduce((sum, val) => sum + val, 0) / data.length
    const min = Math.min(...data)
    const max = Math.max(...data)
    const improvement = data.length > 0 ? ((data[0] - avg) / data[0]) * 100 : 0
    
    return { avg, min, max, improvement }
  }

  const withConsoleStats = calculateStats(results.withConsole)
  const withoutConsoleStats = calculateStats(results.withoutConsole)

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2">Console性能影响测试</h1>
        <p className="text-muted-foreground">
          测试console.log对JavaScript执行性能的影响
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>测试说明</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">测试内容：</h3>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>执行相同的计算任务（100万次随机数累加）</li>
                <li>一组包含5个console.log输出</li>
                <li>一组不包含任何console输出</li>
                <li>比较两组操作的执行时间</li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold mb-2">预期结果：</h3>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>console.log会增加执行时间</li>
                <li>在开发环境中影响更明显</li>
                <li>在生产环境中影响较小</li>
                <li>大量console.log可能显著影响性能</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-center">
        <Button 
          onClick={runPerformanceTest} 
          disabled={isRunning}
          className="px-8 py-3"
        >
          {isRunning ? "测试中..." : "开始性能测试"}
        </Button>
      </div>

      {isRunning && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
              <p className="text-sm text-muted-foreground">{currentTest}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {results.withConsole.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Badge variant="destructive">有Console.log</Badge>
                执行时间统计
              </CardTitle>
            </CardHeader>
            <CardContent>
              {withConsoleStats && (
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>平均时间:</span>
                    <span className="font-mono">{withConsoleStats.avg.toFixed(2)}ms</span>
                  </div>
                  <div className="flex justify-between">
                    <span>最短时间:</span>
                    <span className="font-mono">{withConsoleStats.min.toFixed(2)}ms</span>
                  </div>
                  <div className="flex justify-between">
                    <span>最长时间:</span>
                    <span className="font-mono">{withConsoleStats.max.toFixed(2)}ms</span>
                  </div>
                  <div className="flex justify-between">
                    <span>测试次数:</span>
                    <span>{results.withConsole.length}</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Badge variant="default">无Console.log</Badge>
                执行时间统计
              </CardTitle>
            </CardHeader>
            <CardContent>
              {withoutConsoleStats && (
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>平均时间:</span>
                    <span className="font-mono">{withoutConsoleStats.avg.toFixed(2)}ms</span>
                  </div>
                  <div className="flex justify-between">
                    <span>最短时间:</span>
                    <span className="font-mono">{withoutConsoleStats.min.toFixed(2)}ms</span>
                  </div>
                  <div className="flex justify-between">
                    <span>最长时间:</span>
                    <span className="font-mono">{withoutConsoleStats.max.toFixed(2)}ms</span>
                  </div>
                  <div className="flex justify-between">
                    <span>测试次数:</span>
                    <span>{results.withoutConsole.length}</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {withConsoleStats && withoutConsoleStats && (
        <Card>
          <CardHeader>
            <CardTitle>性能对比分析</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-red-50 rounded-lg">
                  <div className="text-2xl font-bold text-red-600">
                    {withConsoleStats.avg.toFixed(2)}ms
                  </div>
                  <div className="text-sm text-red-600">有Console.log</div>
                </div>
                
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    {withoutConsoleStats.avg.toFixed(2)}ms
                  </div>
                  <div className="text-sm text-green-600">无Console.log</div>
                </div>
                
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">
                    {((withConsoleStats.avg - withoutConsoleStats.avg) / withoutConsoleStats.avg * 100).toFixed(1)}%
                  </div>
                  <div className="text-sm text-blue-600">性能损失</div>
                </div>
              </div>
              
              <div className="mt-4 p-4 bg-yellow-50 rounded-lg">
                <h4 className="font-semibold mb-2">结论和建议：</h4>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  <li>Console.log确实会影响JavaScript执行性能</li>
                  <li>在生产环境中应该移除或禁用console输出</li>
                  <li>可以使用构建工具自动移除console语句</li>
                  <li>开发时可以使用条件性console输出</li>
                  <li>大量console.log可能显著影响用户体验</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>优化建议</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h4 className="font-semibold mb-2">1. 使用构建工具移除console</h4>
              <div className="bg-gray-100 p-3 rounded text-sm font-mono">
                // webpack配置示例<br/>
                new TerserPlugin({<br/>
                &nbsp;&nbsp;terserOptions: {<br/>
                &nbsp;&nbsp;&nbsp;&nbsp;compress: {<br/>
                &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;drop_console: true<br/>
                &nbsp;&nbsp;&nbsp;&nbsp;}<br/>
                &nbsp;&nbsp;}<br/>
                })
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold mb-2">2. 条件性console输出</h4>
              <div className="bg-gray-100 p-3 rounded text-sm font-mono">
                if (process.env.NODE_ENV === 'development') {<br/>
                &nbsp;&nbsp;console.log('Debug info');<br/>
                }
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold mb-2">3. 使用专门的日志库</h4>
              <div className="bg-gray-100 p-3 rounded text-sm font-mono">
                import { logger } from './logger';<br/>
                logger.debug('Debug info');<br/>
                logger.info('Info message');
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 