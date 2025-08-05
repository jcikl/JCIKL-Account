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
import { Checkbox } from "@/components/ui/checkbox"
import { getAccounts, addDocument, updateDocument, deleteDocument, getCollection } from "@/lib/firebase-utils"
import type { Account, Member, MembershipPayment, MembershipReminder, MembershipType } from "@/lib/data"
import { useAuth } from "@/components/auth/auth-context"
import { useToast } from "@/hooks/use-toast"

type TabType = "members" | "payments" | "reminders"

// 常用国籍列表
const NATIONALITIES = [
  "马来西亚",
  "新加坡",
  "中国",
  "印尼",
  "泰国",
  "越南",
  "菲律宾",
  "缅甸",
  "柬埔寨",
  "老挝",
  "其他"
]

// 会员费标准
const MEMBERSHIP_FEES = {
  new: 350,
  renewal: 300,
  international_new: 550,
  international_renewal: 500,
  alumni_new: 100,
  alumni_renewal: 50,
  senator: 0
}

// 会员类型显示名称
const MEMBERSHIP_TYPE_NAMES = {
  new: "新会员",
  renewal: "续费会员",
  international_new: "国际新会员",
  international_renewal: "国际续费会员",
  alumni_new: "Alumni新会员",
  alumni_renewal: "Alumni续费会员",
  senator: "参议员"
}

export function MembershipFeeManagement() {
  const { currentUser } = useAuth()
  const { toast } = useToast()
  
  // 状态管理
  const [members, setMembers] = useState<Member[]>([])
  const [payments, setPayments] = useState<MembershipPayment[]>([])
  const [reminders, setReminders] = useState<MembershipReminder[]>([])
  const [accounts, setAccounts] = useState<Account[]>([])

  const [tab, setTab] = useState<TabType>("members")
  const [showMemberDialog, setShowMemberDialog] = useState(false)
  const [showPaymentDialog, setShowPaymentDialog] = useState(false)
  const [showReminderDialog, setShowReminderDialog] = useState(false)
  const [editMember, setEditMember] = useState<Member | null>(null)
  const [editPayment, setEditPayment] = useState<MembershipPayment | null>(null)
  const [editReminder, setEditReminder] = useState<MembershipReminder | null>(null)
  const [memberForm, setMemberForm] = useState({
    name: "",
    phone: "",
    referrer: "",
    birthDate: "",
    nationality: "马来西亚",
    senatorNumber: "",
    membershipType: "new" as MembershipType,
    membershipYear: new Date().getFullYear()
  })
  const [paymentForm, setPaymentForm] = useState({
    memberId: "",
    amount: 0,
    paymentDate: "",
    membershipYear: new Date().getFullYear(),
    bankTransactionId: "",
    notes: ""
  })
  const [reminderForm, setReminderForm] = useState({
    name: "",
    date: "",
    isActive: true,
    description: ""
  })
  const [loading, setLoading] = useState(true)

  // 加载数据
  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      const [membersData, paymentsData, remindersData, accountsData] = await Promise.all([
        getCollection<Member>("members"),
        getCollection<MembershipPayment>("membership_payments"),
        getCollection<MembershipReminder>("membership_reminders"),
        getAccounts()
      ])
      setMembers(membersData)
      setPayments(paymentsData)
      setReminders(remindersData)
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

  // 计算年龄
  const calculateAge = (birthDate: string) => {
    const today = new Date()
    const birth = new Date(birthDate)
    let age = today.getFullYear() - birth.getFullYear()
    const monthDiff = today.getMonth() - birth.getMonth()
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--
    }
    return age
  }

  // 检查年龄是否符合要求（18-40岁）
  const isAgeValid = (birthDate: string) => {
    const age = calculateAge(birthDate)
    return age >= 18 && age <= 40
  }

  // 自动判断会员类型
  const determineMembershipType = (memberData: {
    birthDate: string
    nationality: string
    senatorNumber: string
    membershipYear: number
  }): MembershipType => {
    const age = calculateAge(memberData.birthDate)
    const currentYear = new Date().getFullYear()
    const isNewMember = memberData.membershipYear === currentYear
    const isInternational = memberData.nationality !== "马来西亚"
    const hasSenatorNumber = memberData.senatorNumber.trim() !== ""

    // 参议员优先判断
    if (hasSenatorNumber) {
      return "senator"
    }

    // 国际会员判断
    if (isInternational) {
      return isNewMember ? "international_new" : "international_renewal"
    }

    // Alumni会员判断（年龄超过40岁）
    if (age > 40) {
      return isNewMember ? "alumni_new" : "alumni_renewal"
    }

    // 普通会员判断（年龄18-40岁）
    if (age >= 18 && age <= 40) {
      return isNewMember ? "new" : "renewal"
    }

    // 默认返回新会员
    return "new"
  }

  // 获取会员费
  const getMembershipFee = (type: MembershipType) => {
    return MEMBERSHIP_FEES[type]
  }





  // 会员管理
  const handleAddMember = () => {
    setEditMember(null)
    setMemberForm({
      name: "",
      phone: "",
      referrer: "",
      birthDate: "",
      nationality: "马来西亚",
      senatorNumber: "",
      membershipType: "new",
      membershipYear: new Date().getFullYear()
    })
    setShowMemberDialog(true)
  }

  const handleEditMember = (member: Member) => {
    setEditMember(member)
    setMemberForm({
      name: member.name,
      phone: member.phone,
      referrer: member.referrer,
      birthDate: member.birthDate,
      nationality: member.nationality,
      senatorNumber: member.senatorNumber || "",
      membershipType: member.membershipType,
      membershipYear: member.membershipYear
    })
    setShowMemberDialog(true)
  }

  const handleDeleteMember = async (id: string) => {
    try {
      await deleteDocument("members", id)
      setMembers(members.filter(m => m.id !== id))
      toast({
        title: "成功",
        description: "会员已删除"
      })
    } catch (error) {
      toast({
        title: "错误",
        description: "删除失败",
        variant: "destructive"
      })
    }
  }

  const handleSaveMember = async () => {
    // 自动判断会员类型
    const determinedType = determineMembershipType({
      birthDate: memberForm.birthDate,
      nationality: memberForm.nationality,
      senatorNumber: memberForm.senatorNumber,
      membershipYear: memberForm.membershipYear
    })

    // 检查年龄是否符合要求（对于非参议员和非Alumni会员）
    if (determinedType !== "senator" && determinedType !== "alumni_new" && determinedType !== "alumni_renewal") {
      if (!isAgeValid(memberForm.birthDate)) {
        toast({
          title: "错误",
          description: "普通会员和国际会员年龄必须在18-40岁之间",
          variant: "destructive"
        })
        return
      }
    }

    try {
      const data = {
        ...memberForm,
        membershipType: determinedType, // 使用自动判断的类型
        status: "active" as const,
        createdAt: editMember ? editMember.createdAt : new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdByUid: currentUser?.uid || ""
      }

      if (editMember) {
        await updateDocument("members", editMember.id!, data)
        setMembers(members.map(m => m.id === editMember.id ? { ...editMember, ...data } : m))
      } else {
        const id = await addDocument("members", data)
        setMembers([...members, { ...data, id }])
      }
      setShowMemberDialog(false)
      toast({
        title: "成功",
        description: editMember ? "会员已更新" : "会员已添加"
      })
    } catch (error) {
      toast({
        title: "错误",
        description: "保存失败",
        variant: "destructive"
      })
    }
  }

  // 缴费记录管理
  const handleAddPayment = () => {
    setEditPayment(null)
    setPaymentForm({
      memberId: "",
      amount: 0,
      paymentDate: "",
      membershipYear: new Date().getFullYear(),
      bankTransactionId: "",
      notes: ""
    })
    setShowPaymentDialog(true)
  }

  const handleEditPayment = (payment: MembershipPayment) => {
    setEditPayment(payment)
    setPaymentForm({
      memberId: payment.memberId,
      amount: payment.amount,
      paymentDate: payment.paymentDate,
      membershipYear: payment.membershipYear,
      bankTransactionId: payment.bankTransactionId || "",
      notes: payment.notes || ""
    })
    setShowPaymentDialog(true)
  }

  const handleDeletePayment = async (id: string) => {
    try {
      await deleteDocument("membership_payments", id)
      setPayments(payments.filter(p => p.id !== id))
      toast({
        title: "成功",
        description: "缴费记录已删除"
      })
    } catch (error) {
      toast({
        title: "错误",
        description: "删除失败",
        variant: "destructive"
      })
    }
  }

  const handleSavePayment = async () => {
    try {
      const data = {
        ...paymentForm,
        createdAt: editPayment ? editPayment.createdAt : new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdByUid: currentUser?.uid || ""
      }

      if (editPayment) {
        await updateDocument("membership_payments", editPayment.id!, data)
        setPayments(payments.map(p => p.id === editPayment.id ? { ...editPayment, ...data } : p))
      } else {
        const id = await addDocument("membership_payments", data)
        setPayments([...payments, { ...data, id }])
      }
      setShowPaymentDialog(false)
      toast({
        title: "成功",
        description: editPayment ? "缴费记录已更新" : "缴费记录已添加"
      })
    } catch (error) {
      toast({
        title: "错误",
        description: "保存失败",
        variant: "destructive"
      })
    }
  }

  // 提醒设置管理
  const handleAddReminder = () => {
    setEditReminder(null)
    setReminderForm({
      name: "",
      date: "",
      isActive: true,
      description: ""
    })
    setShowReminderDialog(true)
  }

  const handleEditReminder = (reminder: MembershipReminder) => {
    setEditReminder(reminder)
    setReminderForm({
      name: reminder.name,
      date: reminder.date,
      isActive: reminder.isActive,
      description: reminder.description || ""
    })
    setShowReminderDialog(true)
  }

  const handleDeleteReminder = async (id: string) => {
    try {
      await deleteDocument("membership_reminders", id)
      setReminders(reminders.filter(r => r.id !== id))
      toast({
        title: "成功",
        description: "提醒设置已删除"
      })
    } catch (error) {
      toast({
        title: "错误",
        description: "删除失败",
        variant: "destructive"
      })
    }
  }

  const handleSaveReminder = async () => {
    try {
      const data = {
        ...reminderForm,
        createdAt: editReminder ? editReminder.createdAt : new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdByUid: currentUser?.uid || ""
      }

      if (editReminder) {
        await updateDocument("membership_reminders", editReminder.id!, data)
        setReminders(reminders.map(r => r.id === editReminder.id ? { ...editReminder, ...data } : r))
      } else {
        const id = await addDocument("membership_reminders", data)
        setReminders([...reminders, { ...data, id }])
      }
      setShowReminderDialog(false)
      toast({
        title: "成功",
        description: editReminder ? "提醒设置已更新" : "提醒设置已添加"
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
        <h1 className="text-2xl font-bold">会员费管理</h1>
        <p className="text-gray-600">管理会员信息、缴费记录和自动提醒设置</p>
      </div>

      <Tabs value={tab} onValueChange={(value) => setTab(value as TabType)}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="members">会员列表</TabsTrigger>
          <TabsTrigger value="payments">缴费记录</TabsTrigger>
          <TabsTrigger value="reminders">自动提醒</TabsTrigger>
        </TabsList>

        <TabsContent value="members" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">会员列表</h2>
            <Button onClick={handleAddMember}>新增会员</Button>
          </div>
          
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>姓名</TableHead>
                <TableHead>电话</TableHead>
                <TableHead>介绍人</TableHead>
                <TableHead>国籍</TableHead>
                <TableHead>参议员号码</TableHead>
                <TableHead>年龄</TableHead>
                <TableHead>会员类型</TableHead>
                <TableHead>年费</TableHead>
                <TableHead>会员年度</TableHead>
                <TableHead>状态</TableHead>
                <TableHead>操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {members.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={11} className="text-center text-gray-500">
                    暂无会员数据
                  </TableCell>
                </TableRow>
              ) : (
                members.map(member => {
                  const age = calculateAge(member.birthDate)
                  const isAgeValidForType = member.membershipType === "senator" || 
                    member.membershipType === "alumni_new" || 
                    member.membershipType === "alumni_renewal" || 
                    isAgeValid(member.birthDate)
                  
                  return (
                    <TableRow key={member.id}>
                      <TableCell>{member.name}</TableCell>
                      <TableCell>{member.phone}</TableCell>
                      <TableCell>{member.referrer}</TableCell>
                      <TableCell>{member.nationality}</TableCell>
                      <TableCell>{member.senatorNumber || "-"}</TableCell>
                      <TableCell>
                        <span className={isAgeValidForType ? "text-green-600" : "text-red-600"}>
                          {age}岁
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge variant={
                          member.membershipType === "senator" ? "default" :
                          member.membershipType.includes("international") ? "secondary" :
                          member.membershipType.includes("alumni") ? "outline" :
                          member.membershipType === "renewal" ? "outline" : "destructive"
                        }>
                          {MEMBERSHIP_TYPE_NAMES[member.membershipType]}
                        </Badge>
                      </TableCell>
                      <TableCell>￥{getMembershipFee(member.membershipType)}</TableCell>
                      <TableCell>{member.membershipYear}</TableCell>
                      <TableCell>
                        <Badge variant={
                          member.status === "active" ? "default" :
                          member.status === "expired" ? "destructive" : "outline"
                        }>
                          {member.status === "active" ? "活跃" : member.status === "expired" ? "过期" : "待处理"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button size="sm" variant="outline" onClick={() => handleEditMember(member)}>编辑</Button>
                        <Button size="sm" variant="destructive" onClick={() => handleDeleteMember(member.id!)}>删除</Button>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </TabsContent>

        <TabsContent value="payments" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">缴费记录</h2>
            <Button onClick={handleAddPayment}>新增缴费记录</Button>
          </div>
          
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>会员姓名</TableHead>
                <TableHead>缴费金额</TableHead>
                <TableHead>缴费日期</TableHead>
                <TableHead>会员年度</TableHead>
                <TableHead>银行交易</TableHead>
                <TableHead>备注</TableHead>
                <TableHead>操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-gray-500">
                    暂无缴费记录
                  </TableCell>
                </TableRow>
              ) : (
                payments.map(payment => {
                  const member = members.find(m => m.id === payment.memberId)
                  return (
                    <TableRow key={payment.id}>
                      <TableCell>{member?.name || "未知会员"}</TableCell>
                      <TableCell>￥{payment.amount}</TableCell>
                      <TableCell>{payment.paymentDate}</TableCell>
                      <TableCell>{payment.membershipYear}</TableCell>
                      <TableCell>{payment.bankTransactionId || "未匹配"}</TableCell>
                      <TableCell>{payment.notes || "-"}</TableCell>
                      <TableCell>
                        <Button size="sm" variant="outline" onClick={() => handleEditPayment(payment)}>编辑</Button>
                        <Button size="sm" variant="destructive" onClick={() => handleDeletePayment(payment.id!)}>删除</Button>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </TabsContent>

        <TabsContent value="reminders" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">自动提醒设置</h2>
            <Button onClick={handleAddReminder}>新增提醒</Button>
          </div>
          
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>提醒名称</TableHead>
                <TableHead>提醒日期</TableHead>
                <TableHead>状态</TableHead>
                <TableHead>描述</TableHead>
                <TableHead>操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reminders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-gray-500">
                    暂无提醒设置
                  </TableCell>
                </TableRow>
              ) : (
                reminders.map(reminder => (
                  <TableRow key={reminder.id}>
                    <TableCell>{reminder.name}</TableCell>
                    <TableCell>{reminder.date}</TableCell>
                    <TableCell>
                      <Badge variant={reminder.isActive ? "default" : "outline"}>
                        {reminder.isActive ? "启用" : "禁用"}
                      </Badge>
                    </TableCell>
                    <TableCell>{reminder.description || "-"}</TableCell>
                    <TableCell>
                      <Button size="sm" variant="outline" onClick={() => handleEditReminder(reminder)}>编辑</Button>
                      <Button size="sm" variant="destructive" onClick={() => handleDeleteReminder(reminder.id!)}>删除</Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TabsContent>


      </Tabs>

      {/* 会员编辑弹窗 */}
      <Dialog open={showMemberDialog} onOpenChange={setShowMemberDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editMember ? "编辑会员" : "新增会员"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>姓名</Label>
                <Input value={memberForm.name} onChange={e => setMemberForm(f => ({ ...f, name: e.target.value }))} />
              </div>
              <div>
                <Label>电话</Label>
                <Input value={memberForm.phone} onChange={e => setMemberForm(f => ({ ...f, phone: e.target.value }))} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>介绍人</Label>
                <Input value={memberForm.referrer} onChange={e => setMemberForm(f => ({ ...f, referrer: e.target.value }))} />
              </div>
              <div>
                <Label>生日</Label>
                <Input type="date" value={memberForm.birthDate} onChange={e => setMemberForm(f => ({ ...f, birthDate: e.target.value }))} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>国籍</Label>
                <Select
                  value={memberForm.nationality}
                  onValueChange={v => setMemberForm(f => ({ ...f, nationality: v }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="选择国籍" />
                  </SelectTrigger>
                  <SelectContent>
                    {NATIONALITIES.map(nat => (
                      <SelectItem key={nat} value={nat}>{nat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>参议员号码（可选）</Label>
                <Input value={memberForm.senatorNumber} onChange={e => setMemberForm(f => ({ ...f, senatorNumber: e.target.value }))} />
              </div>
            </div>
            <div>
              <Label>会员年度</Label>
              <Input type="number" value={memberForm.membershipYear} onChange={e => setMemberForm(f => ({ ...f, membershipYear: Number(e.target.value) }))} />
            </div>
            {memberForm.birthDate && (
              <div className="p-3 bg-gray-50 rounded">
                <div className="text-sm">
                  年龄: {calculateAge(memberForm.birthDate)}岁
                  {(() => {
                    const determinedType = determineMembershipType({
                      birthDate: memberForm.birthDate,
                      nationality: memberForm.nationality,
                      senatorNumber: memberForm.senatorNumber,
                      membershipYear: memberForm.membershipYear
                    })
                    const age = calculateAge(memberForm.birthDate)
                    const isAgeValidForType = determinedType === "senator" || 
                      determinedType === "alumni_new" || 
                      determinedType === "alumni_renewal" || 
                      (age >= 18 && age <= 40)
                    
                    return (
                      <div className="mt-2">
                        <div>自动判断会员类型: <Badge variant="outline">{MEMBERSHIP_TYPE_NAMES[determinedType]}</Badge></div>
                        <div>年费: ￥{getMembershipFee(determinedType)}</div>
                        {!isAgeValidForType && !["senator", "alumni_new", "alumni_renewal"].includes(determinedType) && (
                          <span className="text-red-600">⚠️ 普通会员和国际会员年龄必须在18-40岁之间</span>
                        )}
                      </div>
                    )
                  })()}
                </div>
              </div>
            )}
            <Button onClick={handleSaveMember}>保存</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* 缴费记录编辑弹窗 */}
      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editPayment ? "编辑缴费记录" : "新增缴费记录"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>会员</Label>
              <Select value={paymentForm.memberId} onValueChange={v => {
                const member = members.find(m => m.id === v)
                setPaymentForm(f => ({ 
                  ...f, 
                  memberId: v,
                  amount: member ? getMembershipFee(member.membershipType) : 0
                }))
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="选择会员" />
                </SelectTrigger>
                <SelectContent>
                  {members.map(member => (
                    <SelectItem key={member.id} value={member.id!}>
                      {member.name} - {MEMBERSHIP_TYPE_NAMES[member.membershipType]} (￥{getMembershipFee(member.membershipType)})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>缴费金额（自动计算，不可修改）</Label>
                <Input type="number" value={paymentForm.amount} disabled />
              </div>
              <div>
                <Label>缴费日期</Label>
                <Input type="date" value={paymentForm.paymentDate} onChange={e => setPaymentForm(f => ({ ...f, paymentDate: e.target.value }))} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>会员年度</Label>
                <Input type="number" value={paymentForm.membershipYear} onChange={e => setPaymentForm(f => ({ ...f, membershipYear: Number(e.target.value) }))} />
              </div>
              <div>
                <Label>银行交易ID（可选）</Label>
                <Input value={paymentForm.bankTransactionId} onChange={e => setPaymentForm(f => ({ ...f, bankTransactionId: e.target.value }))} />
              </div>
            </div>
            <div>
              <Label>备注</Label>
              <Textarea value={paymentForm.notes} onChange={e => setPaymentForm(f => ({ ...f, notes: e.target.value }))} />
            </div>
            <Button onClick={handleSavePayment}>保存</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* 提醒设置编辑弹窗 */}
      <Dialog open={showReminderDialog} onOpenChange={setShowReminderDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editReminder ? "编辑提醒设置" : "新增提醒设置"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>提醒名称</Label>
              <Input value={reminderForm.name} onChange={e => setReminderForm(f => ({ ...f, name: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>提醒日期 (MM-DD)</Label>
                <Input value={reminderForm.date} onChange={e => setReminderForm(f => ({ ...f, date: e.target.value }))} placeholder="02-01" />
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="isActive" 
                  checked={reminderForm.isActive} 
                  onCheckedChange={(checked) => setReminderForm(f => ({ ...f, isActive: checked as boolean }))}
                />
                <Label htmlFor="isActive">启用提醒</Label>
              </div>
            </div>
            <div>
              <Label>描述</Label>
              <Textarea value={reminderForm.description} onChange={e => setReminderForm(f => ({ ...f, description: e.target.value }))} />
            </div>
            <Button onClick={handleSaveReminder}>保存</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}