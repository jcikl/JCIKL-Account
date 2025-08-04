"use client"

import * as React from "react"
import { Plus, Save, Trash2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import { getJournalEntries, addDocument, type JournalEntry } from "@/lib/firebase-utils"
import { useOptimizedAccounts } from "@/hooks/use-optimized-data"
import { useAuth } from "@/components/auth/auth-context"
import { RoleLevels, UserRoles } from "@/lib/data"

interface JournalEntryLine {
  account: string
  accountName: string
  debit: number
  credit: number
}

// 优化的分录行组件
const EntryLineRow = React.memo(({
  line, index, accounts, onChange, onRemove, canRemove
}: {
  line: JournalEntryLine
  index: number
  accounts: any[]
  onChange: (index: number, field: keyof JournalEntryLine, value: string | number) => void
  onRemove: (index: number) => void
  canRemove: boolean
}) => {
  return (
    <TableRow>
      <TableCell>
        <Select
          value={line.account}
          onValueChange={(value) => onChange(index, "account", value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="选择账户" />
          </SelectTrigger>
          <SelectContent>
            {accounts.map((account) => (
              <SelectItem key={account.id} value={account.id || account.code}>
                {account.code} - {account.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </TableCell>
      <TableCell>
        <Input
          type="number"
          step="0.01"
          value={line.debit || ""}
          onChange={(e) => onChange(index, "debit", Number.parseFloat(e.target.value) || 0)}
          placeholder="0.00"
        />
      </TableCell>
      <TableCell>
        <Input
          type="number"
          step="0.01"
          value={line.credit || ""}
          onChange={(e) => onChange(index, "credit", Number.parseFloat(e.target.value) || 0)}
          placeholder="0.00"
        />
      </TableCell>
      <TableCell>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onRemove(index)}
          disabled={!canRemove}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </TableCell>
    </TableRow>
  )
}, (prev, next) => prev.line === next.line && prev.canRemove === next.canRemove)

export function JournalEntriesOptimized() {
  const { currentUser, hasPermission } = useAuth()
  const { data: accounts, loading: accountsLoading, error: accountsError } = useOptimizedAccounts()
  const [journalEntries, setJournalEntries] = React.useState<JournalEntry[]>([])
  const [isNewEntryOpen, setIsNewEntryOpen] = React.useState(false)
  const [newEntry, setNewEntry] = React.useState({
    date: new Date().toISOString().split("T")[0],
    reference: "",
    description: "",
  })
  const [entryLines, setEntryLines] = React.useState<JournalEntryLine[]>([
    { account: "", accountName: "", debit: 0, credit: 0 },
    { account: "", accountName: "", debit: 0, credit: 0 },
  ])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  // 优化的数据加载
  const fetchJournalData = React.useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const fetchedEntries = await getJournalEntries()
      setJournalEntries(fetchedEntries)
    } catch (err: any) {
      setError("无法加载日记账数据: " + err.message)
      console.error("Error fetching journal data:", err)
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    fetchJournalData()
  }, [fetchJournalData])

  // 优化的分录行操作
  const addEntryLine = React.useCallback(() => {
    setEntryLines((prev) => [...prev, { account: "", accountName: "", debit: 0, credit: 0 }])
  }, [])

  const removeEntryLine = React.useCallback((index: number) => {
    setEntryLines((prev) => prev.length > 2 ? prev.filter((_, i) => i !== index) : prev)
  }, [])

  const updateEntryLine = React.useCallback((index: number, field: keyof JournalEntryLine, value: string | number) => {
    setEntryLines((prev) => {
      const updated = [...prev]
      if (field === "account" && accounts) {
        const account = accounts.find((acc) => acc.id === value || acc.code === value)
        updated[index] = {
          ...updated[index],
          account: value as string,
          accountName: account?.name || "",
        }
      } else {
        updated[index] = { ...updated[index], [field]: value }
      }
      return updated
    })
  }, [accounts])

  // 优化的合计与校验
  const getTotalDebits = React.useCallback(() => entryLines.reduce((sum, line) => sum + (line.debit || 0), 0), [entryLines])
  const getTotalCredits = React.useCallback(() => entryLines.reduce((sum, line) => sum + (line.credit || 0), 0), [entryLines])
  const isBalanced = React.useCallback(() => getTotalDebits() === getTotalCredits() && getTotalDebits() > 0, [getTotalDebits, getTotalCredits])

  // 优化的保存分录
  const saveJournalEntry = React.useCallback(async () => {
    if (!isBalanced()) {
      alert("日记账分录必须平衡（借方总额 = 贷方总额）")
      return
    }
    if (!currentUser) {
      alert("请先登录以创建日记账分录。")
      return
    }
    const newJournalEntryData: Omit<JournalEntry, "id"> = {
      date: newEntry.date,
      reference: newEntry.reference || `JE-${String(journalEntries.length + 1).padStart(3, "0")}`,
      description: newEntry.description,
      entries: entryLines.filter((line) => line.account && (line.debit > 0 || line.credit > 0)),
      status: "Draft",
      createdByUid: currentUser.uid,
    }
    try {
      await addDocument("journalEntries", newJournalEntryData)
      await fetchJournalData()
      setIsNewEntryOpen(false)
      setNewEntry({ date: new Date().toISOString().split("T")[0], reference: "", description: "" })
      setEntryLines([
        { account: "", accountName: "", debit: 0, credit: 0 },
        { account: "", accountName: "", debit: 0, credit: 0 },
      ])
    } catch (err: any) {
      setError("保存日记账分录失败: " + err.message)
      console.error("Error saving journal entry:", err)
    }
  }, [isBalanced, currentUser, newEntry, entryLines, journalEntries.length, fetchJournalData])

  if (loading || accountsLoading) {
    return <div className="p-6 text-center">加载日记账分录...</div>
  }
  if (error || accountsError) {
    return <div className="p-6 text-center text-red-500">{error || accountsError}</div>
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">日记账分录</h1>
          <p className="text-muted-foreground">创建和管理双分录会计日记账分录。</p>
        </div>
        {hasPermission(RoleLevels[UserRoles.VICE_PRESIDENT]) && (
          <Dialog open={isNewEntryOpen} onOpenChange={setIsNewEntryOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                新日记账分录
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>创建新日记账分录</DialogTitle>
                <DialogDescription>输入您的双分录日记账分录的详细信息。</DialogDescription>
              </DialogHeader>
              <div className="space-y-6">
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="date">日期</Label>
                    <Input
                      id="date"
                      type="date"
                      value={newEntry.date}
                      onChange={(e) => setNewEntry({ ...newEntry, date: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="reference">参考</Label>
                    <Input
                      id="reference"
                      placeholder="JE-001"
                      value={newEntry.reference}
                      onChange={(e) => setNewEntry({ ...newEntry, reference: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>状态</Label>
                    <Select defaultValue="draft">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="draft">草稿</SelectItem>
                        <SelectItem value="posted">已过账</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label htmlFor="description">描述</Label>
                  <Textarea
                    id="description"
                    placeholder="输入日记账分录描述..."
                    value={newEntry.description}
                    onChange={(e) => setNewEntry({ ...newEntry, description: e.target.value })}
                  />
                </div>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium">日记账分录行</h3>
                    <Button variant="outline" size="sm" onClick={addEntryLine}>
                      <Plus className="h-4 w-4 mr-2" />
                      添加行
                    </Button>
                  </div>
                  <div className="border rounded-lg">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>账户</TableHead>
                          <TableHead>借方</TableHead>
                          <TableHead>贷方</TableHead>
                          <TableHead className="w-[50px]"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {entryLines.map((line, index) => (
                          <EntryLineRow
                            key={index}
                            line={line}
                            index={index}
                            accounts={accounts || []}
                            onChange={updateEntryLine}
                            onRemove={removeEntryLine}
                            canRemove={entryLines.length > 2}
                          />
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  <div className="flex justify-between items-center p-4 bg-muted rounded-lg">
                    <div className="space-y-1">
                      <p className="text-sm">
                        借方总额: <span className="font-medium">${getTotalDebits().toFixed(2)}</span>
                      </p>
                      <p className="text-sm">
                        贷方总额: <span className="font-medium">${getTotalCredits().toFixed(2)}</span>
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm">
                        差额: <span className={`font-medium ${isBalanced() ? "text-green-600" : "text-red-600"}`}>${Math.abs(getTotalDebits() - getTotalCredits()).toFixed(2)}</span>
                      </p>
                      <p className="text-xs text-muted-foreground">{isBalanced() ? "✓ 平衡" : "⚠ 不平衡"}</p>
                    </div>
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsNewEntryOpen(false)}>
                    取消
                  </Button>
                  <Button onClick={saveJournalEntry} disabled={!isBalanced()}>
                    <Save className="h-4 w-4 mr-2" />
                    保存分录
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>
      <Card>
        <CardHeader>
          <CardTitle>日记账分录</CardTitle>
          <CardDescription>所有日记账分录，带有双分录会计验证。</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>分录ID</TableHead>
                <TableHead>日期</TableHead>
                <TableHead>参考</TableHead>
                <TableHead>描述</TableHead>
                <TableHead>总金额</TableHead>
                <TableHead>状态</TableHead>
                <TableHead>创建者</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {journalEntries.map((entry) => {
                const totalAmount = entry.entries.reduce((sum, line) => sum + line.debit, 0)
                return (
                  <TableRow key={entry.id}>
                    <TableCell className="font-medium">{entry.id}</TableCell>
                    <TableCell>
                      {typeof entry.date === 'string' 
                        ? entry.date 
                        : entry.date?.seconds 
                          ? new Date(entry.date.seconds * 1000).toLocaleDateString()
                          : 'N/A'
                      }
                    </TableCell>
                    <TableCell>{entry.reference}</TableCell>
                    <TableCell>{entry.description}</TableCell>
                    <TableCell>${totalAmount.toFixed(2)}</TableCell>
                    <TableCell>
                      <Badge variant={entry.status === "Posted" ? "default" : "secondary"}>{entry.status}</Badge>
                    </TableCell>
                    <TableCell>{entry.createdByUid}</TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}