"use client"
import React, { useState } from "react"
import { getTransactions, updateDocument } from "@/lib/firebase-utils"
import { useAuth } from "@/components/auth/auth-context"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

export default function AssignBankAccountTool() {
  const { currentUser, hasPermission } = useAuth()
  const [bankAccountId, setBankAccountId] = useState("")
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState("")
  const [count, setCount] = useState(0)

  // 查询未分配银行账户的交易数量
  React.useEffect(() => {
    getTransactions().then(transactions => {
      setCount(transactions.filter(t => !t.bankAccountId).length)
    })
  }, [])

  // 仅管理员可见 - 移到所有hooks之后
  if (!currentUser || !hasPermission || !hasPermission(1)) {
    return <div className="p-6 text-red-500">无权限</div>
  }

  const handleAssign = async () => {
    setLoading(true)
    setResult("")
    try {
      const transactions = await getTransactions()
      const toUpdate = transactions.filter(t => !t.bankAccountId)
      let updated = 0
      for (const tx of toUpdate) {
        await updateDocument("transactions", tx.id!, { bankAccountId })
        updated++
      }
      setResult(`成功为 ${updated} 条交易分配银行账户`)
    } catch (err: any) {
      setResult("操作失败: " + err.message)
    }
    setLoading(false)
  }

  return (
    <div className="p-8 max-w-lg mx-auto space-y-4">
      <h1 className="text-2xl font-bold">批量分配银行账户</h1>
      <div>当前未分配银行账户的交易数量：{count}</div>
      <Input
        placeholder="请输入目标银行账户ID"
        value={bankAccountId}
        onChange={e => setBankAccountId(e.target.value)}
      />
      <Button onClick={handleAssign} disabled={loading || !bankAccountId}>
        {loading ? "处理中..." : "一键分配"}
      </Button>
      {result && <div className="mt-4 text-blue-600">{result}</div>}
    </div>
  )
}