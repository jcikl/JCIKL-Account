"use client"

import * as React from "react"
import { Plus, Save, Trash2, Edit, Search, Filter, Clipboard } from "lucide-react"
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
import { Switch } from "@/components/ui/switch"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import {
  getCategories,
  addCategory,
  updateCategory,
  deleteCategory,
  checkCategoryCodeExists,
  getCategoryStats,
  type Category,
} from "@/lib/firebase-utils"
import { useAuth } from "@/components/auth/auth-context"
import { UserRoles, RoleLevels } from "@/lib/data"
import { CategoryPasteImportDialog } from "./category-paste-import-dialog"

export function CategoryManagement() {
  const { currentUser, hasPermission } = useAuth()
  const [categories, setCategories] = React.useState<Category[]>([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [stats, setStats] = React.useState({
    totalCategories: 0,
    incomeCategories: 0,
    expenseCategories: 0,
    activeCategories: 0,
    inactiveCategories: 0,
  })

  // 对话框状态
  const [isNewCategoryOpen, setIsNewCategoryOpen] = React.useState(false)
  const [isEditCategoryOpen, setIsEditCategoryOpen] = React.useState(false)
  const [isPasteImportOpen, setIsPasteImportOpen] = React.useState(false)
  const [editingCategory, setEditingCategory] = React.useState<Category | null>(null)

  // 表单状态
  const [newCategory, setNewCategory] = React.useState({
    code: "",
    name: "",
    type: "Expense" as Category["type"],
    description: "",
    isActive: true,
  })

  // 筛选和搜索状态
  const [filterType, setFilterType] = React.useState<Category["type"] | "All">("All")
  const [filterStatus, setFilterStatus] = React.useState<"All" | "Active" | "Inactive">("All")
  const [searchTerm, setSearchTerm] = React.useState("")

  const fetchCategories = React.useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const fetchedCategories = await getCategories()
      setCategories(fetchedCategories)
      
      const categoryStats = await getCategoryStats()
      setStats(categoryStats)
    } catch (err: any) {
      setError("无法加载分类数据: " + err.message)
      console.error("Error fetching categories:", err)
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    fetchCategories()
  }, [fetchCategories])

  // 过滤和搜索分类
  const filteredCategories = React.useMemo(() => {
    let filtered = categories

    // 按类型过滤
    if (filterType !== "All") {
      filtered = filtered.filter(category => category.type === filterType)
    }

    // 按状态过滤
    if (filterStatus !== "All") {
      filtered = filtered.filter(category => 
        filterStatus === "Active" ? category.isActive : !category.isActive
      )
    }

    // 按搜索词过滤
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase()
      filtered = filtered.filter(category =>
        category.code.toLowerCase().includes(searchLower) ||
        category.name.toLowerCase().includes(searchLower) ||
        (category.description && category.description.toLowerCase().includes(searchLower))
      )
    }

    return filtered
  }, [categories, filterType, filterStatus, searchTerm])

  const resetNewCategoryForm = () => {
    setNewCategory({
      code: "",
      name: "",
      type: "Expense",
      description: "",
      isActive: true,
    })
  }

  const handleAddCategory = async () => {
    try {
      // 检查分类代码是否已存在
      const existingCategories = categories.filter(c => c.code === newCategory.code)
      if (existingCategories.length > 0) {
        alert("分类代码已存在，请使用不同的代码。")
        return
      }

      await addCategory({
        code: newCategory.code,
        name: newCategory.name,
        type: newCategory.type,
        description: newCategory.description,
        isActive: newCategory.isActive,
        createdByUid: currentUser?.uid || "",
      })

      await fetchCategories()
      setIsNewCategoryOpen(false)
      resetNewCategoryForm()
    } catch (err: any) {
      setError("添加分类失败: " + err.message)
      console.error("Error adding category:", err)
    }
  }

  const handleEditCategory = (category: Category) => {
    setEditingCategory(category)
    setIsEditCategoryOpen(true)
  }

  const handleUpdateCategory = async () => {
    if (!editingCategory) return

    try {
      // 检查分类代码是否已存在（排除当前编辑的分类）
      const existingCategories = categories.filter(c => c.code === editingCategory.code && c.id !== editingCategory.id)
      if (existingCategories.length > 0) {
        alert("分类代码已存在，请使用不同的代码。")
        return
      }

      await updateCategory(editingCategory.id!, {
        code: editingCategory.code,
        name: editingCategory.name,
        type: editingCategory.type,
        description: editingCategory.description,
        isActive: editingCategory.isActive,
      })

      await fetchCategories()
      setEditingCategory(null)
      setIsEditCategoryOpen(false)
    } catch (err: any) {
      setError("更新分类失败: " + err.message)
      console.error("Error updating category:", err)
    }
  }

  const handleDeleteCategory = async (id: string) => {
    if (!confirm("您确定要删除此分类吗？此操作不可逆。")) return

    try {
      await deleteCategory(id)
      await fetchCategories()
    } catch (err: any) {
      setError("删除分类失败: " + err.message)
      console.error("Error deleting category:", err)
    }
  }

  const handleToggleCategoryStatus = async (category: Category) => {
    if (!category.id) return

    try {
      await updateCategory(category.id, { isActive: !category.isActive })
      await fetchCategories()
    } catch (err: any) {
      setError("更新分类状态失败: " + err.message)
      console.error("Error toggling category status:", err)
    }
  }

  // 处理分类导入
  const handleImportCategories = async (importedCategories: Array<{
    code: string
    name: string
    type: "Income" | "Expense"
    description?: string
    isActive: boolean
    isValid: boolean
    errors: string[]
    isUpdate?: boolean
  }>) => {
    try {
      let importedCount = 0
      let updatedCount = 0

      for (const category of importedCategories) {
        if (category.isUpdate) {
          // 更新现有分类
          const existingCategory = categories.find(c => c.code === category.code)
          if (existingCategory && existingCategory.id) {
            await updateCategory(existingCategory.id, {
              name: category.name,
              type: category.type,
              description: category.description,
              isActive: category.isActive,
            })
            updatedCount++
          }
        } else {
          // 添加新分类
          await addCategory({
            code: category.code,
            name: category.name,
            type: category.type,
            description: category.description,
            isActive: category.isActive,
            createdByUid: currentUser?.uid || "",
          })
          importedCount++
        }
      }

      await fetchCategories()
      setError(null)
    } catch (err: any) {
      setError("导入分类失败: " + err.message)
      console.error("Error importing categories:", err)
    }
  }

  if (loading) {
    return <div className="p-6 text-center">加载分类数据...</div>
  }

  if (error) {
    return <div className="p-6 text-center text-red-500">{error}</div>
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">收支分类管理</h1>
          <p className="text-muted-foreground">管理收入和支出分类，用于交易分类和报表分析。</p>
        </div>
        <div className="flex gap-2">
          {hasPermission(RoleLevels[UserRoles.VICE_PRESIDENT]) && (
            <Button
              variant="outline"
              onClick={() => setIsPasteImportOpen(true)}
            >
              <Clipboard className="h-4 w-4 mr-2" />
              粘贴导入
            </Button>
          )}
          {hasPermission(RoleLevels[UserRoles.VICE_PRESIDENT]) && (
            <Dialog open={isNewCategoryOpen} onOpenChange={setIsNewCategoryOpen}>
              <DialogTrigger asChild>
                <Button onClick={resetNewCategoryForm}>
                  <Plus className="h-4 w-4 mr-2" />
                  添加分类
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>添加新分类</DialogTitle>
                  <DialogDescription>创建新的收入或支出分类</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="category-code">分类代码</Label>
                      <Input
                        id="category-code"
                        placeholder="EXP001"
                        value={newCategory.code}
                        onChange={(e) => setNewCategory({ ...newCategory, code: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="category-type">分类类型</Label>
                      <Select
                        value={newCategory.type}
                        onValueChange={(value: Category["type"]) => setNewCategory({ ...newCategory, type: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Income">收入</SelectItem>
                          <SelectItem value="Expense">支出</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="category-name">分类名称</Label>
                    <Input
                      id="category-name"
                      placeholder="办公用品"
                      value={newCategory.name}
                      onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="category-description">分类描述</Label>
                    <Textarea
                      id="category-description"
                      placeholder="分类的详细描述..."
                      value={newCategory.description}
                      onChange={(e) => setNewCategory({ ...newCategory, description: e.target.value })}
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="category-active"
                      checked={newCategory.isActive}
                      onCheckedChange={(checked) => setNewCategory({ ...newCategory, isActive: checked })}
                    />
                    <Label htmlFor="category-active">启用分类</Label>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setIsNewCategoryOpen(false)}>
                      取消
                    </Button>
                    <Button onClick={handleAddCategory} disabled={!newCategory.code || !newCategory.name}>
                      <Save className="h-4 w-4 mr-2" />
                      添加分类
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{stats.totalCategories}</div>
            <p className="text-xs text-muted-foreground">总分类数</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">{stats.incomeCategories}</div>
            <p className="text-xs text-muted-foreground">收入分类</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-red-600">{stats.expenseCategories}</div>
            <p className="text-xs text-muted-foreground">支出分类</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-blue-600">{stats.activeCategories}</div>
            <p className="text-xs text-muted-foreground">启用分类</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-gray-600">{stats.inactiveCategories}</div>
            <p className="text-xs text-muted-foreground">禁用分类</p>
          </CardContent>
        </Card>
      </div>

      {/* 筛选和搜索 */}
      <Card>
        <CardHeader>
          <CardTitle>筛选和搜索</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Label htmlFor="search">搜索</Label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="搜索分类代码、名称或描述..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="filter-type">分类类型</Label>
              <Select value={filterType} onValueChange={(value) => setFilterType(value as Category["type"] | "All")}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">全部类型</SelectItem>
                  <SelectItem value="Income">收入</SelectItem>
                  <SelectItem value="Expense">支出</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="filter-status">状态</Label>
              <Select value={filterStatus} onValueChange={(value) => setFilterStatus(value as "All" | "Active" | "Inactive")}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">全部状态</SelectItem>
                  <SelectItem value="Active">启用</SelectItem>
                  <SelectItem value="Inactive">禁用</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 分类列表 */}
      <Card>
        <CardHeader>
          <CardTitle>分类列表</CardTitle>
          <CardDescription>管理所有收入和支出分类</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>分类代码</TableHead>
                <TableHead>分类名称</TableHead>
                <TableHead>类型</TableHead>
                <TableHead>描述</TableHead>
                <TableHead>状态</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCategories.map((category) => (
                <TableRow key={category.id}>
                  <TableCell className="font-mono">{category.code}</TableCell>
                  <TableCell className="font-medium">{category.name}</TableCell>
                  <TableCell>
                    <Badge variant={category.type === "Income" ? "default" : "secondary"}>
                      {category.type === "Income" ? "收入" : "支出"}
                    </Badge>
                  </TableCell>
                  <TableCell className="max-w-[200px] truncate">
                    {category.description || "-"}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={category.isActive}
                        onCheckedChange={() => handleToggleCategoryStatus(category)}
                        disabled={!hasPermission(RoleLevels[UserRoles.VICE_PRESIDENT])}
                      />
                      <Badge variant={category.isActive ? "default" : "secondary"}>
                        {category.isActive ? "启用" : "禁用"}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    {hasPermission(RoleLevels[UserRoles.VICE_PRESIDENT]) && (
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditCategory(category)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => category.id && handleDeleteCategory(category.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {filteredCategories.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              没有找到匹配的分类
            </div>
          )}
        </CardContent>
      </Card>

      {/* 编辑分类对话框 */}
      {editingCategory && (
        <Dialog open={isEditCategoryOpen} onOpenChange={setIsEditCategoryOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>编辑分类</DialogTitle>
              <DialogDescription>修改分类信息</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-category-code">分类代码</Label>
                  <Input
                    id="edit-category-code"
                    value={editingCategory.code}
                    onChange={(e) => setEditingCategory({ ...editingCategory, code: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-category-type">分类类型</Label>
                  <Select
                    value={editingCategory.type}
                    onValueChange={(value: Category["type"]) => setEditingCategory({ ...editingCategory, type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Income">收入</SelectItem>
                      <SelectItem value="Expense">支出</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label htmlFor="edit-category-name">分类名称</Label>
                <Input
                  id="edit-category-name"
                  value={editingCategory.name}
                  onChange={(e) => setEditingCategory({ ...editingCategory, name: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="edit-category-description">分类描述</Label>
                <Textarea
                  id="edit-category-description"
                  value={editingCategory.description || ""}
                  onChange={(e) => setEditingCategory({ ...editingCategory, description: e.target.value })}
                />
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="edit-category-active"
                  checked={editingCategory.isActive}
                  onCheckedChange={(checked) => setEditingCategory({ ...editingCategory, isActive: checked })}
                />
                <Label htmlFor="edit-category-active">启用分类</Label>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsEditCategoryOpen(false)}>
                  取消
                </Button>
                <Button onClick={handleUpdateCategory} disabled={!editingCategory.code || !editingCategory.name}>
                  <Save className="h-4 w-4 mr-2" />
                  保存更改
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Category Paste Import Dialog */}
      <CategoryPasteImportDialog
        open={isPasteImportOpen}
        onOpenChange={setIsPasteImportOpen}
        existingCategories={categories}
        onImport={handleImportCategories}
      />
    </div>
  )
} 