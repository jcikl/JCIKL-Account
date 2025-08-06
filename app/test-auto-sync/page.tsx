// app/test-auto-sync/page.tsx
"use client"

import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/components/ui/use-toast'
import { useAuth } from '@/components/auth/auth-context'
import { AutoSyncMonitor } from '@/components/auto-sync-monitor'
import { 
  addDocument, 
  updateDocument, 
  deleteDocument,
  getTransactions,
  getProjects,
  getBankAccounts,
  getCategories
} from '@/lib/firebase-utils'
import { initializeAutoSync } from '@/lib/auto-sync-service'
import { 
  Plus, 
  Edit, 
  Trash2, 
  RefreshCw, 
  Database,
  Activity,
  Zap
} from 'lucide-react'

export default function TestAutoSyncPage() {
  const { currentUser } = useAuth()
  const { toast } = useToast()
  
  // 表单状态
  const [transactionForm, setTransactionForm] = React.useState({
    description: '',
    expense: '',
    income: '',
    projectid: '',
    category: '',
    bankAccountId: ''
  })
  
  const [projectForm, setProjectForm] = React.useState({
    name: '',
    projectid: '',
    budget: ''
  })
  
  const [bankAccountForm, setBankAccountForm] = React.useState({
    name: '',
    balance: ''
  })
  
  const [categoryForm, setCategoryForm] = React.useState({
    name: '',
    code: '',
    type: 'expense'
  })

  // 数据状态
  const [transactions, setTransactions] = React.useState<any[]>([])
  const [projects, setProjects] = React.useState<any[]>([])
  const [bankAccounts, setBankAccounts] = React.useState<any[]>([])
  const [categories, setCategories] = React.useState<any[]>([])
  const [loading, setLoading] = React.useState(false)

  // 初始化自动同步服务
  React.useEffect(() => {
    initializeAutoSync()
  }, [])

  // 加载数据
  const loadData = React.useCallback(async () => {
    setLoading(true)
    try {
      const [transactionsData, projectsData, bankAccountsData, categoriesData] = await Promise.all([
        getTransactions(),
        getProjects(),
        getBankAccounts(),
        getCategories()
      ])
      
      setTransactions(transactionsData)
      setProjects(projectsData)
      setBankAccounts(bankAccountsData)
      setCategories(categoriesData)
    } catch (error) {
      console.error('加载数据失败:', error)
      toast({
        title: "错误",
        description: "加载数据失败",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }, [toast])

  React.useEffect(() => {
    loadData()
  }, [loadData])

  // 添加交易
  const handleAddTransaction = async () => {
    if (!currentUser) return
    
    try {
      const transactionData = {
        date: new Date().toISOString(),
        description: transactionForm.description,
        expense: parseFloat(transactionForm.expense) || 0,
        income: parseFloat(transactionForm.income) || 0,
        status: "Completed" as const,
        projectid: transactionForm.projectid,
        category: transactionForm.category,
        bankAccountId: transactionForm.bankAccountId,
        createdByUid: currentUser.uid
      }

      await addDocument("transactions", transactionData)
      
      toast({
        title: "成功",
        description: "交易已添加，自动同步已触发"
      })
      
      // 重置表单
      setTransactionForm({
        description: '',
        expense: '',
        income: '',
        projectid: '',
        category: '',
        bankAccountId: ''
      })
      
      // 重新加载数据
      await loadData()
    } catch (error) {
      console.error('添加交易失败:', error)
      toast({
        title: "错误",
        description: "添加交易失败",
        variant: "destructive"
      })
    }
  }

  // 添加项目
  const handleAddProject = async () => {
    if (!currentUser) return
    
    try {
      const projectData = {
        name: projectForm.name,
        projectid: projectForm.projectid,
        budget: parseFloat(projectForm.budget) || 0,
        status: "Active" as const,
        createdByUid: currentUser.uid
      }

      await addDocument("projects", projectData)
      
      toast({
        title: "成功",
        description: "项目已添加，自动同步已触发"
      })
      
      // 重置表单
      setProjectForm({
        name: '',
        projectid: '',
        budget: ''
      })
      
      // 重新加载数据
      await loadData()
    } catch (error) {
      console.error('添加项目失败:', error)
      toast({
        title: "错误",
        description: "添加项目失败",
        variant: "destructive"
      })
    }
  }

  // 添加银行账户
  const handleAddBankAccount = async () => {
    if (!currentUser) return
    
    try {
      const bankAccountData = {
        name: bankAccountForm.name,
        balance: parseFloat(bankAccountForm.balance) || 0,
        currency: "USD",
        status: "Active" as const,
        createdByUid: currentUser.uid
      }

      await addDocument("bankAccounts", bankAccountData)
      
      toast({
        title: "成功",
        description: "银行账户已添加，自动同步已触发"
      })
      
      // 重置表单
      setBankAccountForm({
        name: '',
        balance: ''
      })
      
      // 重新加载数据
      await loadData()
    } catch (error) {
      console.error('添加银行账户失败:', error)
      toast({
        title: "错误",
        description: "添加银行账户失败",
        variant: "destructive"
      })
    }
  }

  // 添加分类
  const handleAddCategory = async () => {
    if (!currentUser) return
    
    try {
      const categoryData = {
        name: categoryForm.name,
        code: categoryForm.code,
        type: categoryForm.type as "income" | "expense",
        isActive: true,
        createdByUid: currentUser.uid
      }

      await addDocument("categories", categoryData)
      
      toast({
        title: "成功",
        description: "分类已添加，自动同步已触发"
      })
      
      // 重置表单
      setCategoryForm({
        name: '',
        code: '',
        type: 'expense'
      })
      
      // 重新加载数据
      await loadData()
    } catch (error) {
      console.error('添加分类失败:', error)
      toast({
        title: "错误",
        description: "添加分类失败",
        variant: "destructive"
      })
    }
  }

  // 更新项目名称（测试自动同步）
  const handleUpdateProjectName = async (projectId: string, newName: string) => {
    try {
      await updateDocument("projects", projectId, { name: newName })
      
      toast({
        title: "成功",
        description: "项目名称已更新，相关交易记录将自动同步"
      })
      
      await loadData()
    } catch (error) {
      console.error('更新项目失败:', error)
      toast({
        title: "错误",
        description: "更新项目失败",
        variant: "destructive"
      })
    }
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">自动同步测试</h1>
          <p className="text-muted-foreground">
            测试模块间的自动关联更新功能
          </p>
        </div>
        <Button onClick={loadData} disabled={loading}>
          <RefreshCw className="h-4 w-4 mr-2" />
          刷新数据
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 自动同步监控 */}
        <div className="lg:col-span-2">
          <AutoSyncMonitor />
        </div>

        {/* 添加交易 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              添加交易
            </CardTitle>
            <CardDescription>
              添加新交易记录，测试自动更新银行账户余额和项目花费
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="description">描述</Label>
                <Input
                  id="description"
                  value={transactionForm.description}
                  onChange={(e) => setTransactionForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="交易描述"
                />
              </div>
              <div>
                <Label htmlFor="expense">支出</Label>
                <Input
                  id="expense"
                  type="number"
                  value={transactionForm.expense}
                  onChange={(e) => setTransactionForm(prev => ({ ...prev, expense: e.target.value }))}
                  placeholder="0.00"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="income">收入</Label>
                <Input
                  id="income"
                  type="number"
                  value={transactionForm.income}
                  onChange={(e) => setTransactionForm(prev => ({ ...prev, income: e.target.value }))}
                  placeholder="0.00"
                />
              </div>
              <div>
                <Label htmlFor="projectid">项目</Label>
                <Select value={transactionForm.projectid} onValueChange={(value) => setTransactionForm(prev => ({ ...prev, projectid: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="选择项目" />
                  </SelectTrigger>
                  <SelectContent>
                    {projects.map(project => (
                      <SelectItem key={project.id} value={project.projectid}>
                        {project.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="category">分类</Label>
                <Select value={transactionForm.category} onValueChange={(value) => setTransactionForm(prev => ({ ...prev, category: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="选择分类" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(category => (
                      <SelectItem key={category.id} value={category.code}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="bankAccountId">银行账户</Label>
                <Select value={transactionForm.bankAccountId} onValueChange={(value) => setTransactionForm(prev => ({ ...prev, bankAccountId: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="选择银行账户" />
                  </SelectTrigger>
                  <SelectContent>
                    {bankAccounts.map(account => (
                      <SelectItem key={account.id} value={account.id}>
                        {account.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <Button onClick={handleAddTransaction} className="w-full">
              <Zap className="h-4 w-4 mr-2" />
              添加交易并触发同步
            </Button>
          </CardContent>
        </Card>

        {/* 添加项目 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              添加项目
            </CardTitle>
            <CardDescription>
              添加新项目，测试项目花费金额的自动计算
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="projectName">项目名称</Label>
              <Input
                id="projectName"
                value={projectForm.name}
                onChange={(e) => setProjectForm(prev => ({ ...prev, name: e.target.value }))}
                placeholder="项目名称"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="projectId">项目ID</Label>
                <Input
                  id="projectId"
                  value={projectForm.projectid}
                  onChange={(e) => setProjectForm(prev => ({ ...prev, projectid: e.target.value }))}
                  placeholder="项目ID"
                />
              </div>
              <div>
                <Label htmlFor="budget">预算</Label>
                <Input
                  id="budget"
                  type="number"
                  value={projectForm.budget}
                  onChange={(e) => setProjectForm(prev => ({ ...prev, budget: e.target.value }))}
                  placeholder="0.00"
                />
              </div>
            </div>
            
            <Button onClick={handleAddProject} className="w-full">
              <Zap className="h-4 w-4 mr-2" />
              添加项目并触发同步
            </Button>
          </CardContent>
        </Card>

        {/* 添加银行账户 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              添加银行账户
            </CardTitle>
            <CardDescription>
              添加新银行账户，测试余额的自动计算
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="bankAccountName">账户名称</Label>
              <Input
                id="bankAccountName"
                value={bankAccountForm.name}
                onChange={(e) => setBankAccountForm(prev => ({ ...prev, name: e.target.value }))}
                placeholder="银行账户名称"
              />
            </div>
            
            <div>
              <Label htmlFor="bankAccountBalance">初始余额</Label>
              <Input
                id="bankAccountBalance"
                type="number"
                value={bankAccountForm.balance}
                onChange={(e) => setBankAccountForm(prev => ({ ...prev, balance: e.target.value }))}
                placeholder="0.00"
              />
            </div>
            
            <Button onClick={handleAddBankAccount} className="w-full">
              <Zap className="h-4 w-4 mr-2" />
              添加银行账户并触发同步
            </Button>
          </CardContent>
        </Card>

        {/* 添加分类 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              添加分类
            </CardTitle>
            <CardDescription>
              添加新分类，测试分类统计的自动更新
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="categoryName">分类名称</Label>
                <Input
                  id="categoryName"
                  value={categoryForm.name}
                  onChange={(e) => setCategoryForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="分类名称"
                />
              </div>
              <div>
                <Label htmlFor="categoryCode">分类代码</Label>
                <Input
                  id="categoryCode"
                  value={categoryForm.code}
                  onChange={(e) => setCategoryForm(prev => ({ ...prev, code: e.target.value }))}
                  placeholder="分类代码"
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="categoryType">分类类型</Label>
              <Select value={categoryForm.type} onValueChange={(value) => setCategoryForm(prev => ({ ...prev, type: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="income">收入</SelectItem>
                  <SelectItem value="expense">支出</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <Button onClick={handleAddCategory} className="w-full">
              <Zap className="h-4 w-4 mr-2" />
              添加分类并触发同步
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* 数据展示 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 交易列表 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              交易记录 ({transactions.length})
            </CardTitle>
            <CardDescription>
              查看交易记录，验证自动同步效果
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {transactions.slice(0, 10).map(transaction => (
                <div key={transaction.id} className="p-2 border rounded">
                  <div className="font-medium">{transaction.description}</div>
                  <div className="text-sm text-muted-foreground">
                    收入: ${transaction.income || 0} | 支出: ${transaction.expense || 0}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    项目: {transaction.projectName || '无'} | 分类: {transaction.category || '无'}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* 项目列表 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              项目列表 ({projects.length})
            </CardTitle>
            <CardDescription>
              查看项目信息，验证花费金额的自动计算
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {projects.slice(0, 10).map(project => (
                <div key={project.id} className="p-2 border rounded">
                  <div className="font-medium">{project.name}</div>
                  <div className="text-sm text-muted-foreground">
                    预算: ${project.budget || 0} | 已花费: ${project.spent || 0}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    ID: {project.projectid}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
