"use client"
import * as React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { BODCategories, BODCategory } from "@/lib/data"

// 模拟数据
const mockProjects: Array<{
  id: string
  name: string
  projectid: string
  bodCategory: BODCategory
}> = [
  { id: "1", name: "2025年主席项目A", projectid: "2025_P_项目A", bodCategory: "P" },
  { id: "2", name: "2025年财务项目B", projectid: "2025_HT_项目B", bodCategory: "HT" },
  { id: "3", name: "2025年执行副主席项目B", projectid: "2025_EVP_项目B", bodCategory: "EVP" },
  { id: "4", name: "2025年执行副主席项目C", projectid: "2025_EVP_项目C", bodCategory: "EVP" },
  { id: "5", name: "2024年主席项目A", projectid: "2024_P_项目A", bodCategory: "P" },
  { id: "6", name: "2024年财务项目B", projectid: "2024_HT_项目B", bodCategory: "HT" },
  { id: "7", name: "2024年执行副主席项目C", projectid: "2024_EVP_项目C", bodCategory: "EVP" },
]

const mockTransactions = [
  { id: "1", description: "交易1", date: "2024-01-15", amount: 1000, projectid: "" },
  { id: "2", description: "交易2", date: "2024-01-16", amount: 2000, projectid: "" },
  { id: "3", description: "交易3", date: "2024-01-17", amount: 1500, projectid: "" },
]

export default function BatchEditDemo() {
  const [selectedTransactions, setSelectedTransactions] = React.useState<Set<string>>(new Set())
  const [isBatchEditOpen, setIsBatchEditOpen] = React.useState(false)
  const [batchProjectYearFilter, setBatchProjectYearFilter] = React.useState("all")
  const [batchFormData, setBatchFormData] = React.useState({
    projectid: "none",
    category: "none"
  })

  // 获取可用的项目年份
  const getAvailableProjectYears = () => {
    const years = new Set<string>()
    mockProjects.forEach(project => {
      const projectYear = project.projectid.split('_')[0]
      if (projectYear && !isNaN(parseInt(projectYear))) {
        years.add(projectYear)
      }
    })
    return Array.from(years).sort((a, b) => parseInt(b) - parseInt(a))
  }

  // 根据年份筛选项目
  const getFilteredProjects = () => {
    let filteredProjects = mockProjects
    
    if (batchProjectYearFilter !== "all") {
      filteredProjects = mockProjects.filter(project => {
        const projectYear = project.projectid.split('_')[0]
        return projectYear === batchProjectYearFilter
      })
    }
    
    // 按项目代码排序
    return filteredProjects.sort((a, b) => {
      // 首先按年份排序（降序）
      const yearA = a.projectid.split('_')[0]
      const yearB = b.projectid.split('_')[0]
      if (yearA !== yearB) {
        return parseInt(yearB) - parseInt(yearA)
      }
      
      // 然后按项目代码排序（升序）
      return a.projectid.localeCompare(b.projectid)
    })
  }

  // 按BOD分类分组项目
  const getGroupedProjects = (projectsToGroup: Array<{
    id: string
    name: string
    projectid: string
    bodCategory: BODCategory
  }>) => {
    const grouped: { [key: string]: Array<{
      id: string
      name: string
      projectid: string
      bodCategory: BODCategory
    }> } = {}
    
    projectsToGroup.forEach(project => {
      const bodCategory = project.bodCategory
      const bodDisplayName = BODCategories[bodCategory]
      
      if (!grouped[bodDisplayName]) {
        grouped[bodDisplayName] = []
      }
      grouped[bodDisplayName].push(project)
    })
    
    return grouped
  }

  const handleSelectTransaction = (transactionId: string) => {
    const newSelected = new Set(selectedTransactions)
    if (newSelected.has(transactionId)) {
      newSelected.delete(transactionId)
    } else {
      newSelected.add(transactionId)
    }
    setSelectedTransactions(newSelected)
  }

  const handleSelectAll = () => {
    if (selectedTransactions.size === mockTransactions.length) {
      setSelectedTransactions(new Set())
    } else {
      setSelectedTransactions(new Set(mockTransactions.map(t => t.id)))
    }
  }

  const handleBatchUpdate = () => {
    console.log("批量更新:", {
      selectedTransactions: Array.from(selectedTransactions),
      batchProjectYearFilter,
      batchFormData
    })
    setIsBatchEditOpen(false)
    setBatchProjectYearFilter("all")
    setBatchFormData({ projectid: "none", category: "none" })
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">批量编辑演示</h1>
        <p className="text-muted-foreground">
          演示银行交易记录批量编辑中的项目年份筛选功能
        </p>
      </div>

      {/* 功能说明 */}
      <Card>
        <CardHeader>
          <CardTitle>功能说明</CardTitle>
          <CardDescription>
            在批量编辑对话框中添加了项目年份筛选功能，用户可以通过选择特定年份来筛选项目户口下拉选项。
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <h3 className="font-semibold">1. 选择交易记录</h3>
              <p className="text-sm text-muted-foreground">
                选择要批量编辑的交易记录
              </p>
            </div>
            <div className="space-y-2">
              <h3 className="font-semibold">2. 选择项目年份</h3>
              <p className="text-sm text-muted-foreground">
                在批量编辑对话框中选择项目年份进行筛选
              </p>
            </div>
            <div className="space-y-2">
              <h3 className="font-semibold">3. 选择项目户口</h3>
              <p className="text-sm text-muted-foreground">
                项目户口下拉选项会根据选择的年份进行筛选
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 交易记录表格 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>交易记录</CardTitle>
              <CardDescription>
                选择要批量编辑的交易记录
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleSelectAll}
              >
                {selectedTransactions.size === mockTransactions.length ? "取消全选" : "全选"}
              </Button>
              <Button
                onClick={() => setIsBatchEditOpen(true)}
                disabled={selectedTransactions.size === 0}
              >
                批量编辑 ({selectedTransactions.size})
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox
                    checked={selectedTransactions.size === mockTransactions.length}
                    onCheckedChange={handleSelectAll}
                  />
                </TableHead>
                <TableHead>描述</TableHead>
                <TableHead>日期</TableHead>
                <TableHead>金额</TableHead>
                <TableHead>项目户口</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockTransactions.map((transaction) => (
                <TableRow key={transaction.id}>
                  <TableCell>
                    <Checkbox
                      checked={selectedTransactions.has(transaction.id)}
                      onCheckedChange={() => handleSelectTransaction(transaction.id)}
                    />
                  </TableCell>
                  <TableCell>{transaction.description}</TableCell>
                  <TableCell>{transaction.date}</TableCell>
                  <TableCell>${transaction.amount}</TableCell>
                  <TableCell>
                    {transaction.projectid ? (
                      <Badge variant="secondary">{transaction.projectid}</Badge>
                    ) : (
                      <span className="text-muted-foreground">无项目</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* 项目年份分布 */}
      <Card>
        <CardHeader>
          <CardTitle>项目年份分布</CardTitle>
          <CardDescription>
            当前系统中的项目按年份分布
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Object.entries(getGroupedProjects(mockProjects)).map(([bodCategory, projects]) => (
              <div key={bodCategory} className="space-y-2">
                <h3 className="font-semibold text-lg border-b pb-2">{bodCategory}</h3>
                <div className="space-y-1 pl-4">
                  {projects.map((project) => (
                    <div key={project.id} className="text-sm text-muted-foreground">
                      {project.name}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 批量编辑对话框 */}
      <Dialog open={isBatchEditOpen} onOpenChange={setIsBatchEditOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>批量编辑交易</DialogTitle>
            <DialogDescription>
              为选中的 {selectedTransactions.size} 笔交易设置项目户口和收支分类
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="batch-project-year">项目年份筛选</Label>
              <Select value={batchProjectYearFilter} onValueChange={(value) => 
                setBatchProjectYearFilter(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="选择项目年份" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">所有年份</SelectItem>
                  {getAvailableProjectYears().map((year) => (
                    <SelectItem key={year} value={year}>
                      {year}年
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="batch-reference">项目户口</Label>
              <Select value={batchFormData.projectid} onValueChange={(value) => 
                setBatchFormData({ ...batchFormData, projectid: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="选择项目户口" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">保持不变</SelectItem>
                  <SelectItem value="empty">无项目</SelectItem>
                  {Object.entries(getGroupedProjects(getFilteredProjects())).map(([bodCategory, projects]) => (
                    <div key={bodCategory}>
                      <div className="px-2 py-1.5 text-sm font-semibold text-muted-foreground bg-muted/50">
                        {bodCategory}
                      </div>
                                              {projects.map((project) => (
                          <SelectItem key={project.id} value={project.projectid} className="ml-4">
                            {project.name}
                          </SelectItem>
                        ))}
                    </div>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="batch-category">收支分类</Label>
              <Select value={batchFormData.category} onValueChange={(value) => 
                setBatchFormData({ ...batchFormData, category: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="选择收支分类" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">保持不变</SelectItem>
                  <SelectItem value="empty">无分类</SelectItem>
                  <SelectItem value="收入">收入</SelectItem>
                  <SelectItem value="支出">支出</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => {
                setIsBatchEditOpen(false)
                setBatchProjectYearFilter("all")
              }}>
                取消
              </Button>
              <Button onClick={handleBatchUpdate}>
                确认更新
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
} 