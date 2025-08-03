"use client"

import * as React from "react"
import { Download, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { getAccounts, type Account } from "@/lib/firebase-utils"
import { useAuth } from "@/components/auth/auth-context"
import { RoleLevels, UserRoles } from "@/lib/data"

export function TrialBalance() {
  const { hasPermission } = useAuth()
  const [accounts, setAccounts] = React.useState<Account[]>([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [asOfDate, setAsOfDate] = React.useState(new Date().toISOString().split("T")[0])

  const fetchAccounts = React.useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const fetched = await getAccounts()
      setAccounts(fetched)
    } catch (err: any) {
      setError("无法加载账户数据: " + err.message)
      console.error("Error fetching accounts for trial balance:", err)
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    fetchAccounts()
  }, [fetchAccounts])

  // Calculate trial balance totals
  const totalDebits = accounts
    .filter((account) => ["Asset", "Expense"].includes(account.type))
    .reduce((sum, account) => sum + Math.abs(account.balance), 0)

  const totalCredits = accounts
    .filter((account) => ["Liability", "Equity", "Revenue"].includes(account.type))
    .reduce((sum, account) => sum + Math.abs(account.balance), 0)

  const isBalanced = Math.abs(totalDebits - totalCredits) < 0.01

  if (loading) {
    return <div className="p-6 text-center">加载试算平衡表...</div>
  }

  if (error) {
    return <div className="p-6 text-center text-red-500">{error}</div>
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">试算平衡表</h1>
          <p className="text-muted-foreground">验证所有账户的借方总额是否等于贷方总额。</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchAccounts}>
            <RefreshCw className="h-4 w-4 mr-2" />
            刷新
          </Button>
          {hasPermission(RoleLevels[UserRoles.VICE_PRESIDENT]) && ( // Level 2 can export
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              导出PDF
            </Button>
          )}
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>试算平衡表报告</CardTitle>
              <CardDescription>截至 {asOfDate}</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Label htmlFor="asof-date">截至日期:</Label>
              <Input
                id="asof-date"
                type="date"
                value={asOfDate}
                onChange={(e) => setAsOfDate(e.target.value)}
                className="w-[150px]"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>账户代码</TableHead>
                <TableHead>账户名称</TableHead>
                <TableHead>账户类型</TableHead>
                <TableHead className="text-right">借方</TableHead>
                <TableHead className="text-right">贷方</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {accounts.map((account) => {
                const isDebitAccount = ["Asset", "Expense"].includes(account.type)
                const debitAmount = isDebitAccount && account.balance > 0 ? account.balance : 0
                const creditAmount = !isDebitAccount && account.balance > 0 ? account.balance : 0

                return (
                  <TableRow key={account.id}>
                    <TableCell className="font-medium">{account.code}</TableCell>
                    <TableCell>{account.name}</TableCell>
                    <TableCell>
                      <span
                        className={`px-2 py-1 rounded-full text-xs ${
                          account.type === "Asset"
                            ? "bg-blue-100 text-blue-800"
                            : account.type === "Liability"
                              ? "bg-red-100 text-red-800"
                              : account.type === "Equity"
                                ? "bg-purple-100 text-purple-800"
                                : account.type === "Revenue"
                                  ? "bg-green-100 text-green-800"
                                  : "bg-orange-100 text-orange-800"
                        }`}
                      >
                        {account.type}
                      </span>
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {debitAmount > 0 ? `$${debitAmount.toLocaleString()}` : "-"}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {creditAmount > 0 ? `$${creditAmount.toLocaleString()}` : "-"}
                    </TableCell>
                  </TableRow>
                )
              })}
              <TableRow className="border-t-2 font-bold">
                <TableCell colSpan={3}>总计</TableCell>
                <TableCell className="text-right font-mono">${totalDebits.toLocaleString()}</TableCell>
                <TableCell className="text-right font-mono">${totalCredits.toLocaleString()}</TableCell>
              </TableRow>
            </TableBody>
          </Table>

          <div className="mt-6 p-4 bg-muted rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium">试算平衡状态</h3>
                <p className="text-sm text-muted-foreground">
                  {isBalanced ? "✓ 试算平衡表已平衡" : "⚠ 试算平衡表未平衡"}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm">
                  差额:{" "}
                  <span className={`font-medium ${isBalanced ? "text-green-600" : "text-red-600"}`}>
                    ${Math.abs(totalDebits - totalCredits).toLocaleString()}
                  </span>
                </p>
                <p className="text-xs text-muted-foreground">
                  借方总额: ${totalDebits.toLocaleString()} | 贷方总额: ${totalCredits.toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
