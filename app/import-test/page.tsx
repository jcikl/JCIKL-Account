"use client"

import * as React from "react"
import { AccountChartOptimized } from "@/components/modules/account-chart-optimized"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Clipboard, Database, CheckCircle, AlertCircle } from "lucide-react"
import type { Account } from "@/lib/data"

export default function ImportTestPage() {
  const [importHistory, setImportHistory] = React.useState<Array<{
    timestamp: string
    count: number
    success: boolean
    message: string
  }>>([])

  const handleImport = (importedAccounts: Array<{
    code: string
    name: string
    type: "Asset" | "Liability" | "Equity" | "Revenue" | "Expense"
    financialStatement: string
  }>) => {
    const timestamp = new Date().toLocaleString()
    const success = importedAccounts.length > 0
    
    setImportHistory(prev => [{
      timestamp,
      count: importedAccounts.length,
      success,
      message: success ? `成功导入 ${importedAccounts.length} 个账户` : "导入失败"
    }, ...prev.slice(0, 9)]) // 保留最近10条记录
    
    console.log('导入历史更新:', importedAccounts)
  }

  const sampleData = `1001,Asset,现金,Balance Sheet
1002,Asset,银行存款,Balance Sheet
2001,Liability,应付账款,Balance Sheet
3001,Equity,实收资本,Balance Sheet
4001,Revenue,主营业务收入,Income Statement
5001,Expense,主营业务成本,Income Statement`

  const copySampleData = async () => {
    try {
      await navigator.clipboard.writeText(sampleData)
      alert('示例数据已复制到剪贴板！')
    } catch (error) {
      console.error('复制失败:', error)
      alert('复制失败，请手动复制示例数据')
    }
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <Clipboard className="h-8 w-8 text-blue-600" />
            <h1 className="text-3xl font-bold">粘贴导入功能测试</h1>
          </div>
          <p className="text-muted-foreground">
            测试账户图表的粘贴导入功能，支持 CSV 格式数据
          </p>
        </div>

        {/* 功能说明 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">粘贴导入</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                从剪贴板粘贴 CSV 格式的账户数据，自动解析并导入
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">数据验证</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                自动验证数据格式，显示有效和无效账户的详细信息
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">实时同步</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                导入的账户数据实时同步到 Firebase 数据库
              </p>
            </CardContent>
          </Card>
        </div>

        {/* 示例数据 */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>示例数据</CardTitle>
            <CardDescription>
              点击下方按钮复制示例数据到剪贴板，然后测试导入功能
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Button onClick={copySampleData} className="flex items-center gap-2">
                <Clipboard className="h-4 w-4" />
                复制示例数据到剪贴板
              </Button>
              
              <div className="bg-gray-100 p-4 rounded-lg">
                <h4 className="font-medium mb-2">示例数据格式：</h4>
                <pre className="text-sm font-mono text-gray-700 whitespace-pre-wrap">
{`账户代码,账户类型,账户名称,财务报表分类
1001,Asset,现金,Balance Sheet
1002,Asset,银行存款,Balance Sheet
2001,Liability,应付账款,Balance Sheet
3001,Equity,实收资本,Balance Sheet
4001,Revenue,主营业务收入,Income Statement
5001,Expense,主营业务成本,Income Statement`}
                </pre>
              </div>
              
              <div className="text-sm text-muted-foreground">
                <p><strong>支持的账户类型：</strong> Asset, Liability, Equity, Revenue, Expense</p>
                <p><strong>财务报表分类：</strong> Balance Sheet, Income Statement（可选，会自动生成）</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 使用步骤 */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>使用步骤</CardTitle>
            <CardDescription>
              按照以下步骤测试粘贴导入功能
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-medium mt-0.5">
                  1
                </div>
                <div>
                  <p className="font-medium">复制示例数据</p>
                  <p className="text-muted-foreground">点击上方的"复制示例数据"按钮</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-medium mt-0.5">
                  2
                </div>
                <div>
                  <p className="font-medium">打开导入对话框</p>
                  <p className="text-muted-foreground">在账户图表中点击"导入"按钮</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-medium mt-0.5">
                  3
                </div>
                <div>
                  <p className="font-medium">粘贴数据</p>
                  <p className="text-muted-foreground">点击"从剪贴板粘贴"按钮或手动粘贴数据</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-medium mt-0.5">
                  4
                </div>
                <div>
                  <p className="font-medium">验证并导入</p>
                  <p className="text-muted-foreground">查看解析结果，确认无误后点击"导入"</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 导入历史 */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>导入历史</CardTitle>
            <CardDescription>
              最近的导入操作记录
            </CardDescription>
          </CardHeader>
          <CardContent>
            {importHistory.length === 0 ? (
              <p className="text-muted-foreground">暂无导入记录</p>
            ) : (
              <div className="space-y-2">
                {importHistory.map((record, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      {record.success ? (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      ) : (
                        <AlertCircle className="h-4 w-4 text-red-600" />
                      )}
                      <div>
                        <p className="font-medium">{record.message}</p>
                        <p className="text-sm text-muted-foreground">{record.timestamp}</p>
                      </div>
                    </div>
                    {record.success && (
                      <Badge variant="outline" className="text-green-600">
                        {record.count} 个账户
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* 账户图表 */}
        <div className="mb-6">
          <Card>
            <CardHeader>
              <CardTitle>账户图表 (支持粘贴导入)</CardTitle>
              <CardDescription>
                点击"导入"按钮测试粘贴导入功能
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AccountChartOptimized 
                enableFirebase={true}
                onAccountsImport={handleImport}
                onAccountSelect={(account) => {
                  console.log('选择账户:', account)
                }}
                onAccountEdit={(account) => {
                  console.log('编辑账户:', account)
                }}
                onAccountDelete={(accountId) => {
                  console.log('删除账户:', accountId)
                }}
                onAccountAdd={() => {
                  console.log('添加账户')
                }}
              />
            </CardContent>
          </Card>
        </div>

        {/* 技术信息 */}
        <Card>
          <CardHeader>
            <CardTitle>技术信息</CardTitle>
            <CardDescription>
              粘贴导入功能的技术细节
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <h4 className="font-medium mb-2">支持的数据格式</h4>
                <ul className="space-y-1 text-muted-foreground">
                  <li>• CSV (逗号分隔)</li>
                  <li>• TSV (制表符分隔)</li>
                  <li>• Excel (CSV格式)</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-medium mb-2">数据验证规则</h4>
                <ul className="space-y-1 text-muted-foreground">
                  <li>• 账户代码：必填，1-10字符</li>
                  <li>• 账户名称：必填，1-100字符</li>
                  <li>• 账户类型：必选有效类型</li>
                  <li>• 财务报表：自动生成</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 