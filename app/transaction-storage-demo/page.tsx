"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/components/auth/auth-context"
import { 
  getBankAccounts, 
  addTransactionWithBankAccount,
  getTransactionsByBankAccount 
} from "@/lib/firebase-utils"
import type { Transaction, BankAccount } from "@/lib/data"

export default function TransactionStorageDemo() {
  const { currentUser } = useAuth()
  const { toast } = useToast()
  
  const [bankAccounts, setBankAccounts] = React.useState<BankAccount[]>([])
  const [selectedBankAccountId, setSelectedBankAccountId] = React.useState<string>("")
  const [transactions, setTransactions] = React.useState<Transaction[]>([])
  
  // 表单数据
  const [formData, setFormData] = React.useState({
    date: new Date().toISOString().split('T')[0],
    description: "",
    expense: "",
    income: "",
    status: "Completed" as "Completed" | "Pending" | "Draft",
    payer: "",
    projectid: "",
    category: ""
  })

  // 加载银行账户
  const loadBankAccounts = React.useCallback(async () => {
    if (!currentUser) return
    
    try {
      const accounts = await getBankAccounts()
      setBankAccounts(accounts)
      
      if (accounts.length > 0) {
        setSelectedBankAccountId(accounts[0].id!)
      }
    } catch (error) {
      console.error("Error loading bank accounts:", error)
      toast({
        title: "加载失败",
        description: "无法加载银行账户",
        variant: "destructive",
      })
    }
  }, [currentUser, toast])

  // 加载指定银行账户的交易
  const loadTransactions = React.useCallback(async (bankAccountId: string) => {
    if (!bankAccountId) return
    
    try {
      const transactions = await getTransactionsByBankAccount(bankAccountId)
      setTransactions(transactions)
    } catch (error) {
      console.error("Error loading transactions:", error)
      toast({
        title: "加载失败",
        description: "无法加载交易记录",
        variant: "destructive",
      })
    }
  }, [toast])

  // 初始化数据
  React.useEffect(() => {
    if (currentUser) {
      loadBankAccounts()
    }
  }, [currentUser, loadBankAccounts])

  // 当选择的银行账户改变时，重新加载交易
  React.useEffect(() => {
    if (selectedBankAccountId) {
      loadTransactions(selectedBankAccountId)
    }
  }, [selectedBankAccountId, loadTransactions])

  // 添加交易记录
  const handleAddTransaction = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!selectedBankAccountId) {
      toast({
        title: "错误",
        description: "请先选择银行账户",
        variant: "destructive",
      })
      return
    }

    try {
      const transactionData: Omit<Transaction, "id" | "sequenceNumber"> = {
        date: formData.date,
        description: formData.description,
        description2: "",
        expense: formData.expense ? parseFloat(formData.expense) : 0,
        income: formData.income ? parseFloat(formData.income) : 0,
        status: formData.status,
        payer: formData.payer,
        projectid: formData.projectid,
        projectName: formData.projectid ? formData.projectid.split('_').pop() || "" : "",
        category: formData.category,
        bankAccountId: selectedBankAccountId,
        bankAccountName: bankAccounts.find(acc => acc.id === selectedBankAccountId)?.name || "",
        createdByUid: currentUser?.uid || ""
      }

      // 使用 addTransactionWithBankAccount 函数将交易存储到指定银行账户
      await addTransactionWithBankAccount(transactionData, selectedBankAccountId)
      
      toast({
        title: "添加成功",
        description: "交易记录已成功存储到指定银行账户",
      })

      // 重新加载交易数据
      await loadTransactions(selectedBankAccountId)
      
      // 重置表单
      setFormData({
        date: new Date().toISOString().split('T')[0],
        description: "",
        expense: "",
        income: "",
        status: "Completed",
        payer: "",
        projectid: "",
        category: ""
      })
    } catch (error) {
      console.error("Error adding transaction:", error)
      toast({
        title: "添加失败",
        description: "无法添加交易记录",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">交易记录存储演示</h1>
        <p className="text-muted-foreground">
          演示如何将交易记录存储到指定的银行账户
        </p>
      </div>

      {/* 银行账户选择 */}
      <Card>
        <CardHeader>
          <CardTitle>选择银行账户</CardTitle>
          <CardDescription>
            选择要将交易记录存储到的银行账户
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Select value={selectedBankAccountId} onValueChange={setSelectedBankAccountId}>
            <SelectTrigger>
              <SelectValue placeholder="选择银行账户" />
            </SelectTrigger>
            <SelectContent>
              {bankAccounts.map((account) => (
                <SelectItem key={account.id} value={account.id!}>
                  {account.name} ({account.currency})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* 添加交易表单 */}
      <Card>
        <CardHeader>
          <CardTitle>添加交易记录</CardTitle>
          <CardDescription>
            填写交易信息，将存储到选定的银行账户
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAddTransaction} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="date">日期</Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="status">状态</Label>
                <Select 
                  value={formData.status} 
                  onValueChange={(value) => 
                    setFormData({ ...formData, status: value as "Completed" | "Pending" | "Draft" })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Completed">已完成</SelectItem>
                    <SelectItem value="Pending">待处理</SelectItem>
                    <SelectItem value="Draft">草稿</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="description">描述</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="交易描述"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="expense">支出金额</Label>
                <Input
                  id="expense"
                  type="number"
                  step="0.01"
                  value={formData.expense}
                  onChange={(e) => setFormData({ ...formData, expense: e.target.value })}
                  placeholder="0.00"
                />
              </div>
              <div>
                <Label htmlFor="income">收入金额</Label>
                <Input
                  id="income"
                  type="number"
                  step="0.01"
                  value={formData.income}
                  onChange={(e) => setFormData({ ...formData, income: e.target.value })}
                  placeholder="0.00"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="payer">付款人</Label>
                <Input
                  id="payer"
                  value={formData.payer}
                  onChange={(e) => setFormData({ ...formData, payer: e.target.value })}
                  placeholder="付款人姓名"
                />
              </div>
              <div>
                <Label htmlFor="projectid">项目ID</Label>
                <Input
                  id="projectid"
                  value={formData.projectid}
                  onChange={(e) => setFormData({ ...formData, projectid: e.target.value })}
                  placeholder="项目ID (如: 2025_P_项目A)"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="category">分类</Label>
              <Input
                id="category"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                placeholder="交易分类"
              />
            </div>

            <Button type="submit" className="w-full">
              添加交易记录
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* 交易记录列表 */}
      <Card>
        <CardHeader>
          <CardTitle>当前银行账户的交易记录</CardTitle>
          <CardDescription>
            显示选定银行账户的所有交易记录
          </CardDescription>
        </CardHeader>
        <CardContent>
          {selectedBankAccountId ? (
            <div className="space-y-4">
              <div className="text-sm text-muted-foreground">
                银行账户: {bankAccounts.find(acc => acc.id === selectedBankAccountId)?.name}
              </div>
              <div className="text-sm text-muted-foreground">
                交易数量: {transactions.length}
              </div>
              <div className="space-y-2">
                {transactions.map((transaction) => (
                  <div key={transaction.id} className="p-3 border rounded-lg">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-medium">{transaction.description}</div>
                        <div className="text-sm text-muted-foreground">
                          {new Date(typeof transaction.date === 'string' ? transaction.date : transaction.date.seconds * 1000).toLocaleDateString()} | {transaction.status}
                        </div>
                        {transaction.payer && (
                          <div className="text-sm text-muted-foreground">
                            付款人: {transaction.payer}
                          </div>
                        )}
                      </div>
                      <div className="text-right">
                        {transaction.expense > 0 && (
                          <div className="text-red-600">-¥{transaction.expense.toFixed(2)}</div>
                        )}
                        {transaction.income > 0 && (
                          <div className="text-green-600">+¥{transaction.income.toFixed(2)}</div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center text-muted-foreground">
              请先选择银行账户
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
} 