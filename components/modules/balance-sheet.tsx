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

export function BalanceSheet() {
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
      console.error("Error fetching accounts for balance sheet:", err)
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    fetchAccounts()
  }, [fetchAccounts])

  const assets = accounts.filter((account) => account.type === "Asset")
  const liabilities = accounts.filter((account) => account.type === "Liability")
  const equity = accounts.filter((account) => account.type === "Equity")

  const totalAssets = assets.reduce((sum, account) => sum + account.balance, 0)
  const totalLiabilities = liabilities.reduce((sum, account) => sum + account.balance, 0)
  const totalEquity = equity.reduce((sum, account) => sum + account.balance, 0)

  const isBalanced = Math.abs(totalAssets - (totalLiabilities + totalEquity)) < 0.01

  if (loading) {
    return <div className="p-6 text-center">加载资产负债表...</div>
  }

  if (error) {
    return <div className="p-6 text-center text-red-500">{error}</div>
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">资产负债表</h1>
          <p className="text-muted-foreground">查看您公司的财务状况和净资产。</p>
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
              <CardTitle>资产负债表</CardTitle>
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
          <div className="grid gap-6 md:grid-cols-2">
            {/* Assets */}
            <div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead colSpan={2} className="bg-muted/50 font-bold">
                      资产
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {assets.map((account) => (
                    <TableRow key={account.id}>
                      <TableCell>{account.name}</TableCell>
                      <TableCell className="text-right font-mono">${account.balance.toLocaleString()}</TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="border-t-2 font-bold">
                    <TableCell>总资产</TableCell>
                    <TableCell className="text-right font-mono">${totalAssets.toLocaleString()}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>

            {/* Liabilities & Equity */}
            <div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead colSpan={2} className="bg-muted/50 font-bold">
                      负债与权益
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {/* Liabilities */}
                  <TableRow className="bg-muted/25">
                    <TableCell className="font-medium">负债</TableCell>
                    <TableCell></TableCell>
                  </TableRow>
                  {liabilities.map((account) => (
                    <TableRow key={account.id}>
                      <TableCell className="pl-4">{account.name}</TableCell>
                      <TableCell className="text-right font-mono">${account.balance.toLocaleString()}</TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="border-t font-medium">
                    <TableCell className="pl-4">总负债</TableCell>
                    <TableCell className="text-right font-mono">${totalLiabilities.toLocaleString()}</TableCell>
                  </TableRow>

                  {/* Equity */}
                  <TableRow className="bg-muted/25">
                    <TableCell className="font-medium">权益</TableCell>
                    <TableCell></TableCell>
                  </TableRow>
                  {equity.map((account) => (
                    <TableRow key={account.id}>
                      <TableCell className="pl-4">{account.name}</TableCell>
                      <TableCell className="text-right font-mono">${account.balance.toLocaleString()}</TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="border-t font-medium">
                    <TableCell className="pl-4">总权益</TableCell>
                    <TableCell className="text-right font-mono">${totalEquity.toLocaleString()}</TableCell>
                  </TableRow>
                  <TableRow className="border-t-2 font-bold">
                    <TableCell>总负债与权益</TableCell>
                    <TableCell className="text-right font-mono">
                      ${(totalLiabilities + totalEquity).toLocaleString()}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </div>

          <div className="mt-6 p-4 bg-muted rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium">资产负债表状态</h3>
                <p className="text-sm text-muted-foreground">
                  {isBalanced ? "✓ 资产负债表已平衡" : "⚠ 资产负债表未平衡"}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm">
                  差额:{" "}
                  <span className={`font-medium ${isBalanced ? "text-green-600" : "text-red-600"}`}>
                    ${Math.abs(totalAssets - (totalLiabilities + totalEquity)).toLocaleString()}
                  </span>
                </p>
                <p className="text-xs text-muted-foreground">资产必须等于负债 + 权益</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
