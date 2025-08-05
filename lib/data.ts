// lib/data.ts
// 共享数据和类型定义

export type UserRole =
  | "treasurer"
  | "president"
  | "secretary"
  | "vice_president"
  | "assistant_vice_president"
  | "project_chairman"

export const UserRoles = {
  TREASURER: "treasurer",
  PRESIDENT: "president",
  SECRETARY: "secretary",
  VICE_PRESIDENT: "vice_president",
  ASSISTANT_VICE_PRESIDENT: "assistant_vice_president",
  PROJECT_CHAIRMAN: "project_chairman",
}

export const RoleLevels = {
  [UserRoles.TREASURER]: 1,
  [UserRoles.PRESIDENT]: 1,
  [UserRoles.SECRETARY]: 1,
  [UserRoles.VICE_PRESIDENT]: 2,
  [UserRoles.ASSISTANT_VICE_PRESIDENT]: 3,
  [UserRoles.PROJECT_CHAIRMAN]: 3,
}

export interface UserProfile {
  id?: string // Firestore document ID
  uid: string // Firebase Auth UID
  email: string
  displayName: string
  role: UserRole
  createdAt: string
  lastLogin: string
}

// 收支分类接口
export interface Category {
  id?: string // Firestore document ID
  code: string // 分类代码
  name: string // 分类名称
  type: "Income" | "Expense" // 收入或支出分类
  description?: string // 分类描述
  parentId?: string // 父分类ID，用于层级结构
  isActive: boolean // 是否启用
  createdAt: string
  updatedAt: string
  createdByUid: string // 创建者UID
}

export interface Transaction {
  id?: string // Firestore document ID
  date: string | { seconds: number; nanoseconds: number } // Support both string and Firebase timestamp
  description: string
  description2?: string // 描述2
  expense: number // 支出金额
  income: number // 收入金额
  status: "Completed" | "Pending" | "Draft"
  payer?: string // 付款人
  projectid?: string // 项目户口，从 reference 改为 projectid
  projectName?: string // 项目名称，用于显示和搜索
  category?: string
  sequenceNumber?: number // 排列序号，用于存储到Firebase
  createdByUid: string // Track who created the transaction
  bankAccountId?: string // 新增：关联的银行账户ID
  bankAccountName?: string // 新增：银行账户名称（用于显示）
}

// 银行账户接口
export interface BankAccount {
  id?: string // Firestore document ID
  name: string // 银行账户名称，例如："工商银行主账户"
  accountNumber?: string // 银行账号
  bankName?: string // 银行名称
  balance: number // 账户余额
  currency: string // 货币类型，默认"CNY"
  isActive: boolean // 是否启用
  createdAt: string
  updatedAt: string
  createdByUid: string // 创建者UID
}

// 货币类型定义
export const CURRENCY_TYPES = {
  CNY: "人民币 (CNY)",
  USD: "美元 (USD)",
  EUR: "欧元 (EUR)",
  GBP: "英镑 (GBP)",
  JPY: "日元 (JPY)",
  MYR: "马来西亚林吉特 (MYR)",
  SGD: "新加坡元 (SGD)",
  HKD: "港币 (HKD)",
  KRW: "韩元 (KRW)",
  AUD: "澳元 (AUD)",
  CAD: "加拿大元 (CAD)",
  CHF: "瑞士法郎 (CHF)"
} as const

export type CurrencyType = keyof typeof CURRENCY_TYPES

// 默认银行账户配置
export const DEFAULT_BANK_ACCOUNTS: Omit<BankAccount, "id" | "createdAt" | "updatedAt" | "createdByUid">[] = [
  {
    name: "工商银行主账户",
    bankName: "中国工商银行",
    accountNumber: "6222********1234",
    balance: 0,
    currency: "CNY",
    isActive: true
  },
  {
    name: "建设银行账户",
    bankName: "中国建设银行", 
    accountNumber: "6217********5678",
    balance: 0,
    currency: "CNY",
    isActive: true
  },
  {
    name: "农业银行账户",
    bankName: "中国农业银行",
    accountNumber: "6228********9012", 
    balance: 0,
    currency: "CNY",
    isActive: true
  },
  {
    name: "马来西亚银行账户",
    bankName: "马来西亚银行",
    accountNumber: "1234********5678",
    balance: 0,
    currency: "MYR",
    isActive: true
  }
]

export interface Account {
  id?: string // Firestore document ID
  code: string
  name: string
  type: "Asset" | "Liability" | "Equity" | "Revenue" | "Expense"
  balance: number
  financialStatement?: string // 财务报表分类
  description?: string // 账户描述
  parent?: string
}

// BOD 分类定义
export const BODCategories = {
  P: "President",
  HT: "Honorary Treasurer", 
  EVP: "Executive Vice President",
  LS: "Local Secretary",
  GLC: "General Legal Counsel",
  VPI: "VP Individual",
  VPB: "VP Business",
  VPIA: "VP International",
  VPC: "VP Community",
  VPLOM: "VP Local Organisation Management"
} as const

export type BODCategory = keyof typeof BODCategories

export interface Project {
  id?: string // Firestore document ID
  name: string
  projectid: string
  bodCategory: BODCategory // BOD分类
  budget: number
  remaining: number
  status: "Active" | "Completed" | "On Hold"
  eventDate?: string | { seconds: number; nanoseconds: number } // Support both string and Firebase timestamp
  description?: string // 项目描述
  assignedToUid?: string // Track project chairman
  createdAt?: string // 创建时间
  updatedAt?: string // 更新时间
}

export interface JournalEntry {
  id?: string // Firestore document ID
  date: string
  reference: string
  description: string
  entries: {
    account: string
    accountName: string
    debit: number
    credit: number
  }[]
  status: "Posted" | "Draft"
  createdByUid: string // Track who created the entry
}

// 商品管理相关类型定义
export type MerchandiseType = "independent" | "clothing"
export type ClothingSize = "XS" | "S" | "M" | "L" | "XL" | "XXL"
export type ClothingCut = "Regular" | "Slim" | "Loose" | "Custom"

export interface Merchandise {
  id?: string
  name: string
  sku: string
  type: MerchandiseType
  location: string
  description?: string
  // 衣服特有属性
  clothingSizes?: ClothingSize[]
  clothingCut?: ClothingCut
  // 系统字段
  createdAt: string
  updatedAt: string
  createdByUid: string
}

export interface MerchandiseTransaction {
  id?: string
  merchandiseId: string
  type: "buy" | "sell"
  date: string
  quantity: number
  price: number
  partnerName: string // 供应商或顾客
  bankTransactionId?: string // 绝对匹配银行交易
  // 衣服特有属性
  clothingSize?: ClothingSize
  clothingCut?: ClothingCut
  // 系统字段
  createdAt: string
  updatedAt: string
  createdByUid: string
}

export interface StockCardMovement {
  id?: string
  merchandiseId: string
  date: string
  type: "buy" | "sell" | "adjustment"
  quantity: number
  unitPrice: number
  totalAmount: number
  personName: string // 人名
  category: string // 类别
  warehouseLocation: string // 仓库地点
  reference: string // 参考号
  notes?: string
  // 系统字段
  createdAt: string
  updatedAt: string
  createdByUid: string
}

// 全局GL设置接口
export interface GlobalGLSettings {
  id?: string
  // 商品管理相关设置
  merchandiseAssetAccountId?: string // 商品购入时记入的资产账户
  merchandiseCostAccountId?: string // 商品卖出时成本记入的账户
  merchandiseIncomeAccountId?: string // 商品卖出时收入记入的账户
  
  // 项目账户相关设置
  projectIncomeAccountId?: string // 项目收入记入的账户
  projectExpenseAccountId?: string // 项目支出记入的账户
  projectBudgetAccountId?: string // 项目预算账户
  
  // 会员管理相关设置
  membershipIncomeAccountId?: string // 会员费收入记入的账户
  membershipExpenseAccountId?: string // 会员费支出记入的账户（如有退款等）
  
  // 日常运作费用管理相关设置
  operationExpenseAccountId?: string // 运作费用记入的账户
  
  // 系统字段
  createdAt: string
  updatedAt: string
  createdByUid: string
}

// 移除所有 sampleData，因为数据将从 Firebase 获取

// 会员管理相关类型定义
export type MembershipType = 
  | "new" 
  | "renewal" 
  | "international_new" 
  | "international_renewal" 
  | "alumni_new" 
  | "alumni_renewal" 
  | "senator"

export type MembershipStatus = "active" | "expired" | "pending"

export interface Member {
  id?: string
  name: string
  phone: string
  referrer: string // 介绍人
  birthDate: string
  nationality: string // 国籍，默认马来西亚
  senatorNumber?: string // 参议员号码
  membershipType: MembershipType
  status: MembershipStatus
  membershipYear: number // 会员年度（如2024）
  // 系统字段
  createdAt: string
  updatedAt: string
  createdByUid: string
}

export interface MembershipPayment {
  id?: string
  memberId: string
  amount: number
  paymentDate: string
  membershipYear: number
  bankTransactionId?: string // 与银行交易匹配
  notes?: string
  // 系统字段
  createdAt: string
  updatedAt: string
  createdByUid: string
}

export interface MembershipReminder {
  id?: string
  name: string
  date: string // MM-DD格式
  isActive: boolean
  description?: string
  // 系统字段
  createdAt: string
  updatedAt: string
  createdByUid: string
}



// 日常运作费用管理相关类型定义
export interface OperationExpense {
  id?: string
  purpose: string // 用途
  annotation1?: string // 标注1
  annotation2?: string // 标注2
  glAccountId?: string // General Ledger 父账户
  // 系统字段
  createdAt: string
  updatedAt: string
  createdByUid: string
}


