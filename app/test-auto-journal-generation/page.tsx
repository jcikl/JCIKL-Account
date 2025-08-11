"use client"

import React from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { 
  generateJournalEntriesForExistingTransactions,
  getTransactionsBatch,
  getJournalEntries,
  getAccounts
} from "@/lib/firebase-utils"
import { useAuth } from "@/components/auth/auth-context"
import { AlertTriangle, CheckCircle, Loader2, RefreshCw } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export default function TestAutoJournalGenerationPage() {
  const { currentUser, hasPermission } = useAuth()
  const { toast } = useToast()
  
  const [loading, setLoading] = React.useState(false)
  const [stats, setStats] = React.useState({
    totalTransactions: 0,
    totalJournalEntries: 0,
    totalAccounts: 0
  })
  const [result, setResult] = React.useState<{
    processed: number
    successful: number
    failed: number
    errors: string[]
  } | null>(null)

  // 加载统计信息
  const loadStats = React.useCallback(async () => {
    try {
      const [transactions, journalEntries, accounts] = await Promise.all([
        getTransactionsBatch(1000),
        getJournalEntries(),
        getAccounts()
      ])
      
      setStats({
        totalTransactions: transactions.length,
        totalJournalEntries: journalEntries.length,
        totalAccounts: accounts.length
      })
    } catch (error) {
      console.error('Error loading stats:', error)
    }
  }, [])

  React.useEffect(() => {
    loadStats()
  }, [loadStats])

  // 批量生成日记账分录
  const handleGenerateJournalEntries = async () => {
    if (!currentUser) {
      toast({
        title: "权限不足",
        description: "请先登录",
        variant: "destructive"
      })
      return
    }

    setLoading(true)
    setResult(null)

    try {
      const result = await generateJournalEntriesForExistingTransactions(50)
      setResult(result)
      
      if (result.successful > 0) {
        toast({
          title: "生成成功",
          description: `已为 ${result.successful} 笔交易生成日记账分录`
        })
        // 重新加载统计信息
        await loadStats()
      } else {
        toast({
          title: "生成完成",
          description: "没有找到需要生成日记账分录的交易",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Error generating journal entries:', error)
      toast({
        title: "生成失败",
        description: error instanceof Error ? error.message : "未知错误",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  if (!currentUser) {
    return (
      <div className="p-6 text-center">
        <p className="text-muted-foreground">请先登录以使用此功能</p>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">自动日记账分录生成测试</h1>
        <p className="text-muted-foreground">
          测试为现有交易自动生成日记账分录的功能
        </p>
      </div>

      {/* 统计信息卡片 */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">交易记录</CardTitle>
            <Badge variant="outline">{stats.totalTransactions}</Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalTransactions}</div>
            <p className="text-xs text-muted-foreground">
              总交易记录数
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">日记账分录</CardTitle>
            <Badge variant="outline">{stats.totalJournalEntries}</Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalJournalEntries}</div>
            <p className="text-xs text-muted-foreground">
              已有分录数
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">会计账户</CardTitle>
            <Badge variant="outline">{stats.totalAccounts}</Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalAccounts}</div>
            <p className="text-xs text-muted-foreground">
              可用账户数
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 操作区域 */}
      <Card>
        <CardHeader>
          <CardTitle>批量生成日记账分录</CardTitle>
          <CardDescription>
            为现有的交易记录批量生成对应的日记账分录（限制50条）
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              此操作将为没有对应日记账分录的交易自动生成分录。
              生成的分录将基于交易的分类和金额自动匹配相应的会计账户。
            </AlertDescription>
          </Alert>

          <div className="flex gap-2">
            <Button 
              onClick={handleGenerateJournalEntries}
              disabled={loading}
              className="flex items-center gap-2"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle className="h-4 w-4" />
              )}
              {loading ? "生成中..." : "开始生成"}
            </Button>

            <Button 
              variant="outline"
              onClick={loadStats}
              className="flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              刷新统计
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 结果显示 */}
      {result && (
        <Card>
          <CardHeader>
            <CardTitle>生成结果</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="text-center">
                <div className="text-2xl font-bold">{result.processed}</div>
                <p className="text-sm text-muted-foreground">处理的交易</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{result.successful}</div>
                <p className="text-sm text-muted-foreground">成功生成</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">{result.failed}</div>
                <p className="text-sm text-muted-foreground">生成失败</p>
              </div>
            </div>

            {result.errors.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-red-600">错误详情：</h4>
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {result.errors.map((error, index) => (
                    <p key={index} className="text-xs text-red-600 bg-red-50 p-2 rounded">
                      {error}
                    </p>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* 说明文档 */}
      <Card>
        <CardHeader>
          <CardTitle>工作原理说明</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <h4 className="text-sm font-medium">账户映射逻辑：</h4>
            <ul className="text-sm text-muted-foreground space-y-1 ml-4">
              <li>• <strong>支出交易</strong>：借方记入费用账户，贷方记入银行存款账户</li>
              <li>• <strong>收入交易</strong>：借方记入银行存款账户，贷方记入收入账户</li>
              <li>• <strong>账户匹配</strong>：优先根据交易分类匹配对应账户，否则使用默认账户</li>
              <li>• <strong>分录状态</strong>：自动生成的分录状态为"Posted"（已过账）</li>
            </ul>
          </div>

          <div className="space-y-2">
            <h4 className="text-sm font-medium">注意事项：</h4>
            <ul className="text-sm text-muted-foreground space-y-1 ml-4">
              <li>• 确保系统中已有适当的会计账户（银行存款、费用、收入账户）</li>
              <li>• 生成后的分录可以在日记账分录管理页面查看和编辑</li>
              <li>• 此功能不会重复生成已有的分录</li>
              <li>• 建议先在测试环境验证后再在生产环境使用</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
