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
import type { 
  Account, 
  Merchandise, 
  MerchandiseTransaction, 
  StockCardMovement, 
  MerchandiseType,
  ClothingSize,
  ClothingCut
} from "@/lib/data"
import { useAuth } from "@/components/auth/auth-context"
import { useToast } from "@/hooks/use-toast"

type TabType = "stock" | "transactions" | "movements"

export function MerchandiseManagement() {
  const { currentUser } = useAuth()
  const { toast } = useToast()
  
  // 状态管理
  const [merchandise, setMerchandise] = useState<Merchandise[]>([])
  const [transactions, setTransactions] = useState<MerchandiseTransaction[]>([])
  const [movements, setMovements] = useState<StockCardMovement[]>([])
  const [accounts, setAccounts] = useState<Account[]>([])

  const [selected, setSelected] = useState<Merchandise | null>(null)
  const [tab, setTab] = useState<TabType>("stock")
  const [showDialog, setShowDialog] = useState(false)
  const [editItem, setEditItem] = useState<Merchandise | null>(null)
  const [form, setForm] = useState({
    name: "",
    sku: "",
    type: "independent" as MerchandiseType,
    location: "",
    description: "",
    clothingSizes: [] as ClothingSize[],
    clothingCut: "Regular" as ClothingCut
  })
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterType, setFilterType] = useState<"all" | "independent" | "clothing">("all")
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set())

  // 加载数据
  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      const [merchandiseData, transactionsData, movementsData, accountsData] = await Promise.all([
        getCollection<Merchandise>("merchandise"),
        getCollection<MerchandiseTransaction>("merchandise_transactions"),
        getCollection<StockCardMovement>("stock_card_movements"),
        getAccounts()
      ])
      setMerchandise(merchandiseData)
      setTransactions(transactionsData)
      setMovements(movementsData)
      setAccounts(accountsData)
      
      // 自动选择第一个商品
      if (merchandiseData.length > 0 && !selected) {
        setSelected(merchandiseData[0])
      }
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

  // 当商品列表变化时，自动选择第一个商品
  useEffect(() => {
    if (merchandise.length > 0 && !selected) {
      setSelected(merchandise[0])
    }
  }, [merchandise, selected])

  // 商品增删改查
  const handleAdd = () => {
    setEditItem(null)
    setForm({
      name: "",
      sku: "",
      type: "independent",
      location: "",
      description: "",
      clothingSizes: [],
      clothingCut: "Regular"
    })
    setShowDialog(true)
  }



  const handleEdit = (item: Merchandise) => {
    setEditItem(item)
    setForm({
      name: item.name,
      sku: item.sku,
      type: item.type,
      location: item.location,
      description: item.description || "",
      clothingSizes: item.clothingSizes || [],
      clothingCut: item.clothingCut || "Regular"
    })
    setShowDialog(true)
  }

  const handleDelete = async (id: string) => {
    try {
      await deleteDocument("merchandise", id)
      setMerchandise(merchandise.filter(m => m.id !== id))
      // 如果删除的是当前选中的商品，自动选择下一个
      if (selected?.id === id) {
        const remaining = merchandise.filter(m => m.id !== id)
        setSelected(remaining.length > 0 ? remaining[0] : null)
      }
      toast({
        title: "成功",
        description: "商品已删除"
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
        await updateDocument("merchandise", editItem.id!, data)
        setMerchandise(merchandise.map(m => m.id === editItem.id ? { ...editItem, ...data } : m))
      } else {
        const id = await addDocument("merchandise", data)
        const newItem = { ...data, id }
        setMerchandise([...merchandise, newItem])
        // 如果是第一个商品，自动选中
        if (merchandise.length === 0) {
          setSelected(newItem)
        }
      }
      setShowDialog(false)
      toast({
        title: "成功",
        description: editItem ? "商品已更新" : "商品已添加"
      })
    } catch (error) {
      toast({
        title: "错误",
        description: "保存失败",
        variant: "destructive"
      })
    }
  }

  // 计算库存
  const getStock = (mid: string) => {
    const buy = transactions.filter(t => t.merchandiseId === mid && t.type === "buy").reduce((a, b) => a + b.quantity, 0)
    const sell = transactions.filter(t => t.merchandiseId === mid && t.type === "sell").reduce((a, b) => a + b.quantity, 0)
    return buy - sell
  }

  // 获取GL账户名称
  const getAccountName = (accountId: string) => {
    const account = accounts.find(a => a.id === accountId)
    return account ? `${account.code} - ${account.name}` : "未设置"
  }



  // 商品详情页tab
  const renderDetail = () => {
    if (!selected) return (
      <div className="p-4 border rounded w-full max-w-4xl bg-white">
        <div className="text-center text-gray-500">
          {loading ? "加载中..." : "暂无商品数据，请先添加商品"}
        </div>
      </div>
    )
    
    return (
      <div className="p-4 border rounded w-full max-w-4xl bg-white">
        <div className="mb-4">
          <h2 className="text-xl font-bold mb-2">{selected.name} - 详情</h2>
          <div className="text-sm text-gray-600">SKU: {selected.sku} | 类型: {selected.type === "independent" ? "独立商品" : "衣服"}</div>
        </div>
        
        <div className="flex gap-4 mb-4">
          <Button variant={tab === "stock" ? "default" : "outline"} onClick={() => setTab("stock")}>库存</Button>
          <Button variant={tab === "transactions" ? "default" : "outline"} onClick={() => setTab("transactions")}>买入/卖出记录</Button>
          <Button variant={tab === "movements" ? "default" : "outline"} onClick={() => setTab("movements")}>Stock Card Movements</Button>
        </div>
        
        {tab === "stock" && (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>库存信息</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>当前库存</Label>
                    <div className="text-2xl font-bold">{getStock(selected.id!)}</div>
                  </div>
                  <div>
                    <Label>库存地点</Label>
                    <div>{selected.location}</div>
                  </div>
                  <div>
                    <Label>商品类型</Label>
                    <Badge>{selected.type === "independent" ? "独立商品" : "衣服"}</Badge>
                  </div>
                  {selected.type === "clothing" && (
                    <>
                      <div>
                        <Label>尺寸</Label>
                        <div>{selected.clothingSizes?.join(", ") || "未设置"}</div>
                      </div>
                      <div>
                        <Label>裁剪</Label>
                        <div>{selected.clothingCut}</div>
                      </div>
                    </>
                  )}
                </div>
                {selected.description && (
                  <div className="mt-4">
                    <Label>描述</Label>
                    <div>{selected.description}</div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {tab === "transactions" && (
          <TransactionTable
            merchandiseId={selected.id!}
            transactions={transactions}
            setTransactions={setTransactions}
            merchandise={selected}
          />
        )}

        {tab === "movements" && (
          <MovementTable
            merchandiseId={selected.id!}
            movements={movements}
            setMovements={setMovements}
          />
        )}


      </div>
    )
  }

  if (loading) {
    return <div className="p-4">加载中...</div>
  }

  // 过滤商品数据
  const filteredMerchandise = merchandise.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.sku.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesFilter = filterType === "all" || item.type === filterType
    return matchesSearch && matchesFilter
  })

  // 分组商品数据
  const groupedMerchandise = filteredMerchandise.reduce((groups, item) => {
    if (item.type === "clothing") {
      // 衣服按名称分组
      const key = item.name
      if (!groups[key]) {
        groups[key] = []
      }
      groups[key].push(item)
    } else {
      // 独立商品单独分组
      if (!groups["独立商品"]) {
        groups["独立商品"] = []
      }
      groups["独立商品"].push(item)
    }
    return groups
  }, {} as Record<string, Merchandise[]>)

  // 获取衣服的库存汇总
  const getClothingStockSummary = (clothingItems: Merchandise[]) => {
    const totalStock = clothingItems.reduce((sum, item) => sum + getStock(item.id!), 0)
    const sizes = clothingItems.map(item => item.clothingSizes || []).flat()
    const uniqueSizes = [...new Set(sizes)]
    return {
      total: totalStock,
      sizes: uniqueSizes,
      cuts: [...new Set(clothingItems.map(item => item.clothingCut).filter(Boolean))]
    }
  }

  // 按尺寸和裁剪排序衣服SKU
  const sortClothingItems = (items: Merchandise[]) => {
    const sizeOrder = { "XS": 1, "S": 2, "M": 3, "L": 4, "XL": 5, "XXL": 6 }
    const cutOrder = { "Regular": 1, "Slim": 2, "Loose": 3, "Custom": 4 }
    
    return items.sort((a, b) => {
      // 首先按裁剪排序
      const cutA = cutOrder[a.clothingCut || "Regular"] || 999
      const cutB = cutOrder[b.clothingCut || "Regular"] || 999
      if (cutA !== cutB) return cutA - cutB
      
      // 然后按尺寸排序
      const sizeA = Math.min(...(a.clothingSizes || []).map(s => sizeOrder[s] || 999))
      const sizeB = Math.min(...(b.clothingSizes || []).map(s => sizeOrder[s] || 999))
      return sizeA - sizeB
    })
  }

  // 获取库存状态颜色
  const getStockStatusColor = (stock: number) => {
    if (stock <= 0) return "text-red-600"
    if (stock <= 5) return "text-orange-600"
    return "text-green-600"
  }

  // 快速添加衣服变体
  const handleQuickAddClothingVariant = async (baseItem: Merchandise) => {
    try {
      const newSku = `${baseItem.sku}-${Date.now()}`
      const newItem: Omit<Merchandise, 'id'> = {
        name: baseItem.name,
        sku: newSku,
        type: "clothing",
        location: baseItem.location,
        description: baseItem.description,
        clothingSizes: [],
        clothingCut: "Regular",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdByUid: currentUser?.uid || ""
      }
      
      const id = await addDocument("merchandise", newItem)
      const newMerchandise = { ...newItem, id }
      setMerchandise([...merchandise, newMerchandise])
      setSelected(newMerchandise)
      
      toast({
        title: "成功",
        description: "已添加衣服变体，请编辑尺寸和裁剪"
      })
    } catch (error) {
      toast({
        title: "错误",
        description: "添加变体失败",
        variant: "destructive"
      })
    }
  }

  // 批量操作
  const handleBatchOperation = async (operation: "delete" | "updateLocation") => {
    if (selectedItems.size === 0) {
      toast({
        title: "提示",
        description: "请先选择要操作的商品"
      })
      return
    }

    try {
      const selectedMerchandise = merchandise.filter(item => selectedItems.has(item.id!))
      
      if (operation === "delete") {
        for (const item of selectedMerchandise) {
          await deleteDocument("merchandise", item.id!)
        }
        setMerchandise(merchandise.filter(item => !selectedItems.has(item.id!)))
        setSelectedItems(new Set())
        toast({
          title: "成功",
          description: `已删除 ${selectedMerchandise.length} 个商品`
        })
      }
    } catch (error) {
      toast({
        title: "错误",
        description: "批量操作失败",
        variant: "destructive"
      })
    }
  }

  // 切换选择状态
  const toggleSelection = (itemId: string) => {
    const newSelected = new Set(selectedItems)
    if (newSelected.has(itemId)) {
      newSelected.delete(itemId)
    } else {
      newSelected.add(itemId)
    }
    setSelectedItems(newSelected)
  }

  // 全选/取消全选
  const toggleSelectAll = () => {
    if (selectedItems.size === filteredMerchandise.length) {
      setSelectedItems(new Set())
    } else {
      setSelectedItems(new Set(filteredMerchandise.map(item => item.id!)))
    }
  }

  return (
    <div className="flex gap-8 p-4">
      {/* 商品列表 */}
      <div className="w-1/3">
        <div className="flex justify-between mb-4">
          <h2 className="font-bold text-lg">商品列表</h2>
          <div className="flex gap-2">
            {selectedItems.size > 0 && (
              <>
                <Button 
                  variant="destructive" 
                  size="sm"
                  onClick={() => handleBatchOperation("delete")}
                >
                  批量删除 ({selectedItems.size})
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setSelectedItems(new Set())}
                >
                  取消选择
                </Button>
              </>
            )}
            <Button onClick={handleAdd}>新增商品</Button>
          </div>
        </div>
        
        {/* 搜索和过滤 */}
        <div className="mb-4 space-y-2">
          <div className="flex gap-2">
            <Input
              placeholder="搜索商品名称或SKU..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1"
            />
            <Select value={filterType} onValueChange={(value) => setFilterType(value as "all" | "independent" | "clothing")}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部</SelectItem>
                <SelectItem value="independent">独立商品</SelectItem>
                <SelectItem value="clothing">衣服</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center justify-between text-sm text-gray-600">
            <div className="flex items-center gap-2">
              {(searchTerm || filterType !== "all") && (
                <>
                  <span>筛选结果: {filteredMerchandise.length} 个商品</span>
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    onClick={() => { setSearchTerm(""); setFilterType("all"); }}
                  >
                    清除筛选
                  </Button>
                </>
              )}
            </div>
            {filteredMerchandise.length > 0 && (
              <div className="flex items-center gap-2">
                <span>已选择: {selectedItems.size} 个</span>
                <Button 
                  size="sm" 
                  variant="ghost" 
                  onClick={toggleSelectAll}
                >
                  {selectedItems.size === filteredMerchandise.length ? "取消全选" : "全选"}
                </Button>
              </div>
            )}
          </div>
        </div>
        
        {/* 分组显示 */}
        <div className="space-y-4">
          {Object.entries(groupedMerchandise).map(([groupName, items]) => (
            <Card key={groupName}>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center justify-between">
                  <span>{groupName}</span>
                  {groupName !== "独立商品" && (
                    <Badge variant="outline" className="text-xs">
                      {items.length} 个SKU
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                {groupName === "独立商品" ? (
                  // 独立商品列表
                  <div className="space-y-2">
                                         {items.map(item => (
                       <div
                         key={item.id}
                         className={`p-2 rounded border cursor-pointer hover:bg-gray-50 ${
                           selected?.id === item.id ? "bg-blue-50 border-blue-200" : "border-gray-200"
                         } ${selectedItems.has(item.id!) ? "ring-2 ring-blue-500" : ""}`}
                         onClick={() => setSelected(item)}
                       >
                         <div className="flex justify-between items-start">
                           <div className="flex items-start gap-2">
                             <input
                               type="checkbox"
                               checked={selectedItems.has(item.id!)}
                               onChange={(e) => { e.stopPropagation(); toggleSelection(item.id!); }}
                               className="mt-1"
                             />
                             <div className="flex-1">
                               <div className="font-medium">{item.name}</div>
                               <div className="text-sm text-gray-600">SKU: {item.sku}</div>
                               <div className="text-sm text-gray-500">库存: {getStock(item.id!)}</div>
                             </div>
                           </div>
                           <div className="flex gap-1">
                             <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); handleEdit(item); }}>编辑</Button>
                             <Button size="sm" variant="destructive" onClick={(e) => { e.stopPropagation(); handleDelete(item.id!); }}>删除</Button>
                           </div>
                         </div>
                       </div>
                     ))}
                  </div>
                ) : (
                  // 衣服分组显示
                  <div className="space-y-3">
                                       {/* 衣服汇总信息 */}
                   <div className="bg-gray-50 p-2 rounded text-sm">
                     <div className="flex justify-between items-center mb-1">
                       <span className="font-medium">库存汇总</span>
                       <span className="text-lg font-bold">{getClothingStockSummary(items).total}</span>
                     </div>
                     <div className="flex gap-2 text-xs">
                       <span>尺寸: {getClothingStockSummary(items).sizes.join(", ") || "未设置"}</span>
                       <span>裁剪: {getClothingStockSummary(items).cuts.join(", ") || "未设置"}</span>
                     </div>
                     <div className="mt-2">
                       <Button 
                         size="sm" 
                         variant="outline" 
                         onClick={() => handleQuickAddClothingVariant(items[0])}
                         className="text-xs"
                       >
                         快速添加变体
                       </Button>
                     </div>
                   </div>
                    
                                         {/* 衣服SKU列表 */}
                     <div className="space-y-2">
                       {sortClothingItems(items).map(item => {
                         const stock = getStock(item.id!)
                         return (
                           <div
                             key={item.id}
                             className={`p-3 rounded border cursor-pointer hover:bg-gray-50 transition-colors ${
                               selected?.id === item.id ? "bg-blue-50 border-blue-200" : "border-gray-200"
                             }`}
                             onClick={() => setSelected(item)}
                           >
                                                        <div className="flex justify-between items-start">
                             <div className="flex items-start gap-2">
                               <input
                                 type="checkbox"
                                 checked={selectedItems.has(item.id!)}
                                 onChange={(e) => { e.stopPropagation(); toggleSelection(item.id!); }}
                                 className="mt-1"
                               />
                               <div className="flex-1">
                                 <div className="flex items-center gap-2 mb-1">
                                   <div className="font-medium">{item.name}</div>
                                   <Badge variant="outline" className="text-xs">
                                     {item.clothingCut || "Regular"}
                                   </Badge>
                                 </div>
                                 <div className="text-sm text-gray-600 mb-2">SKU: {item.sku}</div>
                                 <div className="flex flex-wrap gap-2 text-xs">
                                   <span className={`font-medium ${getStockStatusColor(stock)}`}>
                                     库存: {stock}
                                   </span>
                                   {item.clothingSizes && item.clothingSizes.length > 0 && (
                                     <div className="flex gap-1">
                                       {item.clothingSizes.map(size => (
                                         <Badge key={size} variant="secondary" className="text-xs">
                                           {size}
                                         </Badge>
                                       ))}
                                     </div>
                                   )}
                                 </div>
                               </div>
                             </div>
                             <div className="flex gap-1">
                               <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); handleEdit(item); }}>编辑</Button>
                               <Button size="sm" variant="destructive" onClick={(e) => { e.stopPropagation(); handleDelete(item.id!); }}>删除</Button>
                             </div>
                           </div>
                           </div>
                         )
                       })}
                     </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
        
        {merchandise.length === 0 && (
          <Card>
            <CardContent className="text-center text-gray-500 py-8">
              暂无商品数据
            </CardContent>
          </Card>
        )}
      </div>
      {/* 商品详情 */}
      <div className="flex-1">{renderDetail()}</div>

      {/* 商品编辑弹窗 */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editItem ? "编辑商品" : "新增商品"}</DialogTitle>
          </DialogHeader>

      
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>商品名称</Label>
                <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
              </div>
              <div>
                <Label>SKU</Label>
                <Input value={form.sku} onChange={e => setForm(f => ({ ...f, sku: e.target.value }))} />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>商品类型</Label>
                <Select value={form.type} onValueChange={v => setForm(f => ({ ...f, type: v as MerchandiseType }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="independent">独立商品</SelectItem>
                    <SelectItem value="clothing">衣服</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>库存地点</Label>
                <Input value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} />
              </div>
            </div>

            {form.type === "clothing" && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>裁剪</Label>
                  <Select value={form.clothingCut} onValueChange={v => setForm(f => ({ ...f, clothingCut: v as ClothingCut }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Regular">Regular</SelectItem>
                      <SelectItem value="Slim">Slim</SelectItem>
                      <SelectItem value="Loose">Loose</SelectItem>
                      <SelectItem value="Custom">Custom</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>尺寸</Label>
                  <div className="flex flex-wrap gap-2">
                    {(["XS", "S", "M", "L", "XL", "XXL"] as ClothingSize[]).map(size => (
                      <Button
                        key={size}
                        size="sm"
                        variant={form.clothingSizes.includes(size) ? "default" : "outline"}
                        onClick={() => setForm(f => ({
                          ...f,
                          clothingSizes: f.clothingSizes.includes(size)
                            ? f.clothingSizes.filter(s => s !== size)
                            : [...f.clothingSizes, size]
                        }))}
                      >
                        {size}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            <div>
              <Label>描述</Label>
              <Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
            </div>

            <Button onClick={handleSave}>保存</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// 买入/卖出记录表格及增删改查
function TransactionTable({ 
  merchandiseId, 
  transactions, 
  setTransactions, 
  merchandise 
}: {
  merchandiseId: string
  transactions: MerchandiseTransaction[]
  setTransactions: React.Dispatch<React.SetStateAction<MerchandiseTransaction[]>>
  merchandise: Merchandise
}) {
  const { currentUser } = useAuth()
  const { toast } = useToast()
  const [showDialog, setShowDialog] = useState(false)
  const [editItem, setEditItem] = useState<MerchandiseTransaction | null>(null)
  const [form, setForm] = useState({
    type: "buy" as "buy" | "sell",
    date: "",
    quantity: 1,
    price: 0,
    partnerName: "",
    bankTransactionId: "",
    clothingSize: "M" as ClothingSize,
    clothingCut: "Regular" as ClothingCut
  })

  // 只显示当前商品的交易
  const rows = transactions.filter(t => t.merchandiseId === merchandiseId)

  const handleAdd = () => {
    setEditItem(null)
    setForm({
      type: "buy",
      date: "",
      quantity: 1,
      price: 0,
      partnerName: "",
      bankTransactionId: "",
      clothingSize: "M",
      clothingCut: "Regular"
    })
    setShowDialog(true)
  }

  const handleEdit = (item: MerchandiseTransaction) => {
    setEditItem(item)
    setForm({
      type: item.type,
      date: item.date,
      quantity: item.quantity,
      price: item.price,
      partnerName: item.partnerName,
      bankTransactionId: item.bankTransactionId || "",
      clothingSize: item.clothingSize || "M",
      clothingCut: item.clothingCut || "Regular"
    })
    setShowDialog(true)
  }

  const handleDelete = async (id: string) => {
    try {
      await deleteDocument("merchandise_transactions", id)
      setTransactions(ts => ts.filter(t => t.id !== id))
      toast({
        title: "成功",
        description: "交易记录已删除"
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
        merchandiseId,
        createdAt: editItem ? editItem.createdAt : new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdByUid: currentUser?.uid || ""
      }

      if (editItem) {
        await updateDocument("merchandise_transactions", editItem.id!, data)
        setTransactions(ts => ts.map(t => t.id === editItem.id ? { ...editItem, ...data } : t))
      } else {
        const id = await addDocument("merchandise_transactions", data)
        setTransactions(ts => [...ts, { ...data, id }])
      }
      setShowDialog(false)
      toast({
        title: "成功",
        description: editItem ? "交易记录已更新" : "交易记录已添加"
      })
    } catch (error) {
      toast({
        title: "错误",
        description: "保存失败",
        variant: "destructive"
      })
    }
  }

  return (
    <div>
      <div className="flex justify-between mb-2">
        <h3 className="font-bold">买入/卖出记录</h3>
        <Button onClick={handleAdd}>新增记录</Button>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>类型</TableHead>
            <TableHead>日期</TableHead>
            <TableHead>数量</TableHead>
            <TableHead>单价</TableHead>
            <TableHead>对象</TableHead>
            {merchandise.type === "clothing" && (
              <>
                <TableHead>尺寸</TableHead>
                <TableHead>裁剪</TableHead>
              </>
            )}
            <TableHead>银行交易</TableHead>
            <TableHead>操作</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={merchandise.type === "clothing" ? 8 : 6} className="text-center text-gray-500">
                暂无交易记录
              </TableCell>
            </TableRow>
          ) : (
            rows.map(item => (
              <TableRow key={item.id}>
                <TableCell>
                  <Badge variant={item.type === "buy" ? "default" : "secondary"}>
                    {item.type === "buy" ? "买入" : "卖出"}
                  </Badge>
                </TableCell>
                <TableCell>{item.date}</TableCell>
                <TableCell>{item.quantity}</TableCell>
                <TableCell>￥{item.price}</TableCell>
                <TableCell>{item.partnerName}</TableCell>
                {merchandise.type === "clothing" && (
                  <>
                    <TableCell>{item.clothingSize}</TableCell>
                    <TableCell>{item.clothingCut}</TableCell>
                  </>
                )}
                <TableCell>{item.bankTransactionId || "未匹配"}</TableCell>
                <TableCell>
                  <Button size="sm" variant="outline" onClick={() => handleEdit(item)}>编辑</Button>
                  <Button size="sm" variant="destructive" onClick={() => handleDelete(item.id!)}>删除</Button>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      {/* 记录编辑弹窗 */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editItem ? "编辑记录" : "新增记录"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>类型</Label>
                <Select value={form.type} onValueChange={v => setForm(f => ({ ...f, type: v as "buy" | "sell" }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="buy">买入</SelectItem>
                    <SelectItem value="sell">卖出</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>日期</Label>
                <Input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>数量</Label>
                <Input type="number" value={form.quantity} onChange={e => setForm(f => ({ ...f, quantity: Number(e.target.value) }))} />
              </div>
              <div>
                <Label>单价</Label>
                <Input type="number" value={form.price} onChange={e => setForm(f => ({ ...f, price: Number(e.target.value) }))} />
              </div>
            </div>

            <div>
              <Label>供应商/顾客名称</Label>
              <Input value={form.partnerName} onChange={e => setForm(f => ({ ...f, partnerName: e.target.value }))} />
            </div>

            {merchandise.type === "clothing" && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>尺寸</Label>
                  <Select value={form.clothingSize} onValueChange={v => setForm(f => ({ ...f, clothingSize: v as ClothingSize }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {(["XS", "S", "M", "L", "XL", "XXL"] as ClothingSize[]).map(size => (
                        <SelectItem key={size} value={size}>{size}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>裁剪</Label>
                  <Select value={form.clothingCut} onValueChange={v => setForm(f => ({ ...f, clothingCut: v as ClothingCut }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Regular">Regular</SelectItem>
                      <SelectItem value="Slim">Slim</SelectItem>
                      <SelectItem value="Loose">Loose</SelectItem>
                      <SelectItem value="Custom">Custom</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            <div>
              <Label>银行交易ID（可选）</Label>
              <Input value={form.bankTransactionId} onChange={e => setForm(f => ({ ...f, bankTransactionId: e.target.value }))} />
            </div>

            <Button onClick={handleSave}>保存</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// Stock Card Movement Records
function MovementTable({ 
  merchandiseId, 
  movements, 
  setMovements 
}: {
  merchandiseId: string
  movements: StockCardMovement[]
  setMovements: React.Dispatch<React.SetStateAction<StockCardMovement[]>>
}) {
  const { currentUser } = useAuth()
  const { toast } = useToast()
  const [showDialog, setShowDialog] = useState(false)
  const [editItem, setEditItem] = useState<StockCardMovement | null>(null)
  const [form, setForm] = useState({
    date: "",
    type: "buy" as "buy" | "sell" | "adjustment",
    quantity: 1,
    unitPrice: 0,
    totalAmount: 0,
    personName: "",
    category: "",
    warehouseLocation: "",
    reference: "",
    notes: ""
  })

  // 只显示当前商品的movements
  const rows = movements.filter(m => m.merchandiseId === merchandiseId)

  const handleAdd = () => {
    setEditItem(null)
    setForm({
      date: "",
      type: "buy",
      quantity: 1,
      unitPrice: 0,
      totalAmount: 0,
      personName: "",
      category: "",
      warehouseLocation: "",
      reference: "",
      notes: ""
    })
    setShowDialog(true)
  }

  const handleEdit = (item: StockCardMovement) => {
    setEditItem(item)
    setForm({
      date: item.date,
      type: item.type,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      totalAmount: item.totalAmount,
      personName: item.personName,
      category: item.category,
      warehouseLocation: item.warehouseLocation,
      reference: item.reference,
      notes: item.notes || ""
    })
    setShowDialog(true)
  }

  const handleDelete = async (id: string) => {
    try {
      await deleteDocument("stock_card_movements", id)
      setMovements(ms => ms.filter(m => m.id !== id))
      toast({
        title: "成功",
        description: "Movement记录已删除"
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
        merchandiseId,
        createdAt: editItem ? editItem.createdAt : new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdByUid: currentUser?.uid || ""
      }

      if (editItem) {
        await updateDocument("stock_card_movements", editItem.id!, data)
        setMovements(ms => ms.map(m => m.id === editItem.id ? { ...editItem, ...data } : m))
      } else {
        const id = await addDocument("stock_card_movements", data)
        setMovements(ms => [...ms, { ...data, id }])
      }
      setShowDialog(false)
      toast({
        title: "成功",
        description: editItem ? "Movement记录已更新" : "Movement记录已添加"
      })
    } catch (error) {
      toast({
        title: "错误",
        description: "保存失败",
        variant: "destructive"
      })
    }
  }

  return (
    <div>
      <div className="flex justify-between mb-2">
        <h3 className="font-bold">Stock Card Movement Records</h3>
        <Button onClick={handleAdd}>新增Movement</Button>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>日期</TableHead>
            <TableHead>类型</TableHead>
            <TableHead>数量</TableHead>
            <TableHead>单价</TableHead>
            <TableHead>总金额</TableHead>
            <TableHead>人名</TableHead>
            <TableHead>类别</TableHead>
            <TableHead>仓库地点</TableHead>
            <TableHead>参考号</TableHead>
            <TableHead>操作</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={10} className="text-center text-gray-500">
                暂无Movement记录
              </TableCell>
            </TableRow>
          ) : (
            rows.map(item => (
              <TableRow key={item.id}>
                <TableCell>{item.date}</TableCell>
                <TableCell>
                  <Badge variant={
                    item.type === "buy" ? "default" : 
                    item.type === "sell" ? "secondary" : "outline"
                  }>
                    {item.type === "buy" ? "买入" : item.type === "sell" ? "卖出" : "调整"}
                  </Badge>
                </TableCell>
                <TableCell>{item.quantity}</TableCell>
                <TableCell>￥{item.unitPrice}</TableCell>
                <TableCell>￥{item.totalAmount}</TableCell>
                <TableCell>{item.personName}</TableCell>
                <TableCell>{item.category}</TableCell>
                <TableCell>{item.warehouseLocation}</TableCell>
                <TableCell>{item.reference}</TableCell>
                <TableCell>
                  <Button size="sm" variant="outline" onClick={() => handleEdit(item)}>编辑</Button>
                  <Button size="sm" variant="destructive" onClick={() => handleDelete(item.id!)}>删除</Button>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      {/* Movement编辑弹窗 */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editItem ? "编辑Movement" : "新增Movement"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>日期</Label>
                <Input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
              </div>
              <div>
                <Label>类型</Label>
                <Select value={form.type} onValueChange={v => setForm(f => ({ ...f, type: v as "buy" | "sell" | "adjustment" }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="buy">买入</SelectItem>
                    <SelectItem value="sell">卖出</SelectItem>
                    <SelectItem value="adjustment">调整</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>数量</Label>
                <Input type="number" value={form.quantity} onChange={e => setForm(f => ({ ...f, quantity: Number(e.target.value) }))} />
              </div>
              <div>
                <Label>单价</Label>
                <Input type="number" value={form.unitPrice} onChange={e => setForm(f => ({ ...f, unitPrice: Number(e.target.value) }))} />
              </div>
              <div>
                <Label>总金额</Label>
                <Input type="number" value={form.totalAmount} onChange={e => setForm(f => ({ ...f, totalAmount: Number(e.target.value) }))} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>人名</Label>
                <Input value={form.personName} onChange={e => setForm(f => ({ ...f, personName: e.target.value }))} />
              </div>
              <div>
                <Label>类别</Label>
                <Input value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>仓库地点</Label>
                <Input value={form.warehouseLocation} onChange={e => setForm(f => ({ ...f, warehouseLocation: e.target.value }))} />
              </div>
              <div>
                <Label>参考号</Label>
                <Input value={form.reference} onChange={e => setForm(f => ({ ...f, reference: e.target.value }))} />
              </div>
            </div>

            <div>
              <Label>备注</Label>
              <Textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
            </div>

            <Button onClick={handleSave}>保存</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}