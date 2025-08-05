import React, { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { getAccounts, addDocument, updateDocument, deleteDocument, getCollection } from "@/lib/firebase-utils"
import type { Account } from "@/lib/data"
import { useAuth } from "@/components/auth/auth-context"
import { useToast } from "@/hooks/use-toast"

// 日常运作费用类型定义
interface OperationExpense {
  id?: string
  purpose: string // 用途
  label1: string // 标注1
  label2: string // 标注2
  glAccountId?: string // General Ledger父账户
  description?: string // 描述
  isActive: boolean // 是否启用
  // 系统字段
  createdAt: string
  updatedAt: string
  createdByUid: string
}



type TabType = "expenses"

// 初始用途列表
const INITIAL_PURPOSES = [
  "Misc",
  "Indah Water",
  "Electricity Charges",
  "Cukai Taksiran",
  "Management Fee",
  "Audit Fee",
  "Area Dues",
  "National Dues",
  "ZOOM Subscription",
  "JCI KL Flag",
  "JCI Colar Pin",
  "Water Charges",
  "Bereavement Wreath",
  "Member Opening Flower",
  "Printing & Stationeries"
]

export function OperationExpenseManagement() {
  const { currentUser } = useAuth()
  const { toast } = useToast()
  
  // 状态管理
  const [expenses, setExpenses] = useState<OperationExpense[]>([])
  const [accounts, setAccounts] = useState<Account[]>([])

  const [tab, setTab] = useState<TabType>("expenses")
  const [showDialog, setShowDialog] = useState(false)
  const [editItem, setEditItem] = useState<OperationExpense | null>(null)
  const [form, setForm] = useState({
    purpose: "",
    label1: "",
    label2: "",
    glAccountId: "",
    description: "",
    isActive: true
  })
  const [loading, setLoading] = useState(true)

  // 加载数据
  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      const [expensesData, accountsData] = await Promise.all([
        getCollection<OperationExpense>("operation_expenses"),
        getAccounts()
      ])
      setExpenses(expensesData)
      setAccounts(accountsData)
    } catch (error) {
      console.error("Error loading data:", error)
      toast({
        title: "错误",
        description: "加载数据失败",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  // 获取GL账户名称
  const getAccountName = (accountId: string) => {
    const account = accounts.find(a => a.id === accountId)
    return account ? `${account.code} - ${account.name}` : "未设置"
  }



  // 初始化默认用途
  const initializeDefaultPurposes = async () => {
    try {
      const existingPurposes = expenses.map(e => e.purpose)
      const newPurposes = INITIAL_PURPOSES.filter(purpose => !existingPurposes.includes(purpose))
      
      if (newPurposes.length === 0) {
        toast({
          title: "提示",
          description: "所有默认用途已存在"
        })
        return
      }

      const newExpenses = newPurposes.map(purpose => ({
        purpose,
        label1: "",
        label2: "",
        glAccountId: "",
        description: "",
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdByUid: currentUser?.uid || ""
      }))

      for (const expense of newExpenses) {
        const id = await addDocument("operation_expenses", expense)
        setExpenses(prev => [...prev, { ...expense, id }])
      }

      toast({
        title: "成功",
        description: `已添加 ${newExpenses.length} 个默认用途`
      })
    } catch (error) {
      toast({
        title: "错误",
        description: "初始化默认用途失败",
        variant: "destructive"
      })
    }
  }

  // 费用管理
  const handleAdd = () => {
    setEditItem(null)
    setForm({
      purpose: "",
      label1: "",
      label2: "",
      glAccountId: "",
      description: "",
      isActive: true
    })
    setShowDialog(true)
  }

  const handleEdit = (item: OperationExpense) => {
    setEditItem(item)
    setForm({
      purpose: item.purpose,
      label1: item.label1,
      label2: item.label2,
      glAccountId: item.glAccountId || "",
      description: item.description || "",
      isActive: item.isActive
    })
    setShowDialog(true)
  }

  const handleDelete = async (id: string) => {
    try {
      await deleteDocument("operation_expenses", id)
      setExpenses(expenses.filter(e => e.id !== id))
      toast({
        title: "成功",
        description: "费用项目已删除"
      })
    } catch (error) {
      toast({
        title: "错误",
        description: "删除失败",
        variant: "destructive"
      })
    }
  }

  const handleSave = async () => {
    try {
      const data = {
        ...form,
        createdAt: editItem ? editItem.createdAt : new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdByUid: currentUser?.uid || ""
      }

      if (editItem) {
        await updateDocument("operation_expenses", editItem.id!, data)
        setExpenses(expenses.map(e => e.id === editItem.id ? { ...editItem, ...data } : e))
      } else {
        const id = await addDocument("operation_expenses", data)
        setExpenses([...expenses, { ...data, id }])
      }
      setShowDialog(false)
      toast({
        title: "成功",
        description: editItem ? "费用项目已更新" : "费用项目已添加"
      })
    } catch (error) {
      toast({
        title: "错误",
        description: "保存失败",
        variant: "destructive"
      })
    }
  }

  if (loading) {
    return <div className="p-4">加载中...</div>
  }

  return (
    <div className="p-4">
      <div className="mb-4">
        <h1 className="text-2xl font-bold">日常运作费用管理</h1>
        <p className="text-gray-600">管理日常运作费用的用途、标注和GL账户设置</p>
      </div>

      <Tabs value={tab} onValueChange={(value) => setTab(value as TabType)}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="expenses">费用项目</TabsTrigger>
          <TabsTrigger value="settings">GL设置</TabsTrigger>
        </TabsList>

        <TabsContent value="expenses" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">费用项目管理</h2>
            <div className="flex gap-2">
              <Button variant="outline" onClick={initializeDefaultPurposes}>初始化默认用途</Button>
              <Button onClick={handleAdd}>新增费用项目</Button>
            </div>
          </div>
          
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>用途</TableHead>
                <TableHead>标注1</TableHead>
                <TableHead>标注2</TableHead>
                <TableHead>GL账户</TableHead>
                <TableHead>状态</TableHead>
                <TableHead>描述</TableHead>
                <TableHead>操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {expenses.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-gray-500">
                    暂无费用项目数据
                  </TableCell>
                </TableRow>
              ) : (
                expenses.map(expense => (
                  <TableRow key={expense.id}>
                    <TableCell className="font-medium">{expense.purpose}</TableCell>
                    <TableCell>{expense.label1 || "-"}</TableCell>
                    <TableCell>{expense.label2 || "-"}</TableCell>
                    <TableCell>
                      <div className="text-sm text-gray-600">
                        {getAccountName(expense.glAccountId || "")}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={expense.isActive ? "default" : "outline"}>
                        {expense.isActive ? "启用" : "禁用"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="max-w-xs truncate" title={expense.description}>
                        {expense.description || "-"}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Button size="sm" variant="outline" onClick={() => handleEdit(expense)}>编辑</Button>
                      <Button size="sm" variant="destructive" onClick={() => handleDelete(expense.id!)}>删除</Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          {/* 默认用途说明 */}
          <Card>
            <CardHeader>
              <CardTitle>默认用途列表</CardTitle>
              <CardDescription>点击"初始化默认用途"按钮可添加以下预设用途</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-2 text-sm">
                {INITIAL_PURPOSES.map(purpose => (
                  <div key={purpose} className="p-2 bg-gray-50 rounded">
                    {purpose}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>


      </Tabs>

      {/* 费用项目编辑弹窗 */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editItem ? "编辑费用项目" : "新增费用项目"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>用途</Label>
              <Input value={form.purpose} onChange={e => setForm(f => ({ ...f, purpose: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>标注1</Label>
                <Input value={form.label1} onChange={e => setForm(f => ({ ...f, label1: e.target.value }))} />
              </div>
              <div>
                <Label>标注2</Label>
                <Input value={form.label2} onChange={e => setForm(f => ({ ...f, label2: e.target.value }))} />
              </div>
            </div>
            <div>
              <Label>GL父账户</Label>
              <Select value={form.glAccountId} onValueChange={v => setForm(f => ({ ...f, glAccountId: v }))}>
                <SelectTrigger>
                  <SelectValue placeholder="选择GL账户" />
                </SelectTrigger>
                <SelectContent>
                  {accounts.map(account => (
                    <SelectItem key={account.id} value={account.id!}>
                      {account.code} - {account.name} ({account.type})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>描述</Label>
              <Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="isActive"
                checked={form.isActive}
                onChange={e => setForm(f => ({ ...f, isActive: e.target.checked }))}
                className="rounded"
              />
              <Label htmlFor="isActive">启用此费用项目</Label>
            </div>
            <Button onClick={handleSave}>保存</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}