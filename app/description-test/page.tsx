"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { FileText, Plus, Upload, Download, Info } from "lucide-react"
import type { Account } from "@/lib/data"

export default function DescriptionTestPage() {
  const [accounts, setAccounts] = useState<Account[]>([
    {
      id: '1',
      code: '1001',
      name: '现金',
      type: 'Asset',
      balance: 10000,
      financialStatement: 'Balance Sheet',
      description: '用于日常现金收支的账户，包括现金和银行存款',
      parent: ''
    },
    {
      id: '2',
      code: '1002',
      name: '银行存款',
      type: 'Asset',
      balance: 50000,
      financialStatement: 'Balance Sheet',
      description: '在银行的各种存款账户，包括活期和定期存款',
      parent: ''
    },
    {
      id: '3',
      code: '2001',
      name: '应付账款',
      type: 'Liability',
      balance: -15000,
      financialStatement: 'Balance Sheet',
      description: '对供应商的欠款，通常在30-60天内支付',
      parent: ''
    },
    {
      id: '4',
      code: '3001',
      name: '实收资本',
      type: 'Equity',
      balance: 100000,
      financialStatement: 'Balance Sheet',
      description: '股东投入的资本，是公司的主要资金来源',
      parent: ''
    },
    {
      id: '5',
      code: '4001',
      name: '销售收入',
      type: 'Revenue',
      balance: 0,
      financialStatement: 'Income Statement',
      description: '', // 无描述账户
      parent: ''
    }
  ])

  const [importData, setImportData] = useState(`1001,Asset,现金,Balance Sheet,用于日常现金收支
1002,Asset,银行存款,Balance Sheet,在银行的各种存款账户
2001,Liability,应付账款,Balance Sheet,对供应商的欠款
3001,Equity,实收资本,Balance Sheet,股东投入的资本
4001,Revenue,销售收入,Income Statement,主营业务收入`)

  const [testResults, setTestResults] = useState<string[]>([])

  // 测试描述字段功能
  const runDescriptionTests = () => {
    const results: string[] = []
    
    // 测试1: 验证账户数据结构
    const hasDescriptionField = accounts.every(account => 'description' in account)
    results.push(`✅ 账户数据结构包含描述字段: ${hasDescriptionField ? '通过' : '失败'}`)
    
    // 测试2: 验证有描述的账户
    const accountsWithDescription = accounts.filter(account => account.description && account.description.trim().length > 0)
    results.push(`✅ 有描述的账户数量: ${accountsWithDescription.length}/${accounts.length}`)
    
    // 测试3: 验证无描述的账户
    const accountsWithoutDescription = accounts.filter(account => !account.description || account.description.trim().length === 0)
    results.push(`✅ 无描述的账户数量: ${accountsWithoutDescription.length}/${accounts.length}`)
    
    // 测试4: 验证描述内容
    const validDescriptions = accounts.filter(account => 
      account.description && account.description.length > 0 && account.description.length <= 500
    )
    results.push(`✅ 有效描述账户数量: ${validDescriptions.length}/${accounts.length}`)
    
    setTestResults(results)
  }

  // 模拟导入功能
  const simulateImport = () => {
    const lines = importData.trim().split('\n')
    const importedAccounts: Account[] = []
    
    lines.forEach((line, index) => {
      const fields = line.split(',').map(field => field.trim())
      const [code, type, name, financialStatement = '', description = ''] = fields
      
      if (code && name && type) {
        importedAccounts.push({
          id: `imported-${index + 1}`,
          code,
          name,
          type: type as any,
          balance: 0,
          financialStatement: financialStatement || (() => {
            const balanceSheetTypes = ['Asset', 'Liability', 'Equity']
            return balanceSheetTypes.includes(type) ? 'Balance Sheet' : 'Income Statement'
          })(),
          description,
          parent: ''
        })
      }
    })
    
    setAccounts(prev => [...prev, ...importedAccounts])
    setTestResults(prev => [...prev, `✅ 成功导入 ${importedAccounts.length} 个账户`])
  }

  // 模拟导出功能
  const simulateExport = () => {
    const exportData = accounts.map(account => ({
      '账户代码': account.code,
      '账户名称': account.name,
      '账户类型': account.type,
      '当前余额': account.balance,
      '描述': account.description || ''
    }))
    
    console.log('导出数据:', exportData)
    setTestResults(prev => [...prev, `✅ 成功导出 ${accounts.length} 个账户数据`])
  }

  // 获取账户类型颜色
  const getAccountTypeColor = (type: string) => {
    switch (type) {
      case "Asset":
        return "bg-blue-100 text-blue-800 border-blue-200"
      case "Liability":
        return "bg-red-100 text-red-800 border-red-200"
      case "Equity":
        return "bg-purple-100 text-purple-800 border-purple-200"
      case "Revenue":
        return "bg-green-100 text-green-800 border-green-200"
      case "Expense":
        return "bg-orange-100 text-orange-800 border-orange-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2">账户描述功能测试</h1>
        <p className="text-muted-foreground">
          测试账户图表和导入功能中的描述字段
        </p>
      </div>

      {/* 功能说明 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="h-5 w-5" />
            功能说明
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 border rounded-lg">
              <h4 className="font-medium mb-2">📝 表单功能</h4>
              <p className="text-sm text-muted-foreground">
                账户创建和编辑表单支持描述字段，可选填写
              </p>
            </div>
            <div className="p-4 border rounded-lg">
              <h4 className="font-medium mb-2">📥 导入功能</h4>
              <p className="text-sm text-muted-foreground">
                支持从粘贴数据中解析描述字段，格式：代码,类型,名称,财务报表,描述
              </p>
            </div>
            <div className="p-4 border rounded-lg">
              <h4 className="font-medium mb-2">📤 导出功能</h4>
              <p className="text-sm text-muted-foreground">
                导出数据包含描述字段，支持CSV、Excel、PDF格式
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 测试控制 */}
      <Card>
        <CardHeader>
          <CardTitle>测试控制</CardTitle>
          <CardDescription>运行各种测试来验证描述功能</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Button onClick={runDescriptionTests} className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              运行描述功能测试
            </Button>
            <Button onClick={simulateImport} variant="outline" className="flex items-center gap-2">
              <Upload className="h-4 w-4" />
              模拟导入
            </Button>
            <Button onClick={simulateExport} variant="outline" className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              模拟导出
            </Button>
          </div>
          
          {testResults.length > 0 && (
            <Alert>
              <AlertDescription>
                <div className="space-y-1">
                  {testResults.map((result, index) => (
                    <div key={index} className="text-sm">{result}</div>
                  ))}
                </div>
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* 账户列表 */}
      <Card>
        <CardHeader>
          <CardTitle>账户列表（包含描述）</CardTitle>
          <CardDescription>
            显示所有账户及其描述信息
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {accounts.map((account) => (
              <div key={account.id} className="p-4 border rounded-lg">
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm">{account.code}</span>
                      <span className="font-medium">{account.name}</span>
                      <Badge className={getAccountTypeColor(account.type)}>
                        {account.type}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        ${account.balance.toLocaleString()}
                      </span>
                    </div>
                    {account.description && (
                      <div className="text-sm text-muted-foreground">
                        📝 {account.description}
                      </div>
                    )}
                    {!account.description && (
                      <div className="text-sm text-gray-400 italic">
                        📝 无描述
                      </div>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {account.financialStatement}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 导入测试 */}
      <Card>
        <CardHeader>
          <CardTitle>导入测试数据</CardTitle>
          <CardDescription>
            粘贴包含描述字段的账户数据来测试导入功能
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="importData">测试数据</Label>
            <Textarea
              id="importData"
              value={importData}
              onChange={(e) => setImportData(e.target.value)}
              placeholder="粘贴账户数据，格式：代码,类型,名称,财务报表,描述"
              className="min-h-[120px] font-mono text-sm"
            />
            <p className="text-xs text-muted-foreground mt-2">
              格式：账户代码,账户类型,账户名称,财务报表分类,描述
            </p>
          </div>
          <Button onClick={simulateImport} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            添加到账户列表
          </Button>
        </CardContent>
      </Card>

      {/* 统计信息 */}
      <Card>
        <CardHeader>
          <CardTitle>统计信息</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold">{accounts.length}</div>
              <div className="text-sm text-muted-foreground">总账户数</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {accounts.filter(a => a.description && a.description.trim().length > 0).length}
              </div>
              <div className="text-sm text-muted-foreground">有描述账户</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-600">
                {accounts.filter(a => !a.description || a.description.trim().length === 0).length}
              </div>
              <div className="text-sm text-muted-foreground">无描述账户</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {Math.round((accounts.filter(a => a.description && a.description.trim().length > 0).length / accounts.length) * 100)}%
              </div>
              <div className="text-sm text-muted-foreground">描述覆盖率</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 