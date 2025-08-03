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
  projectid?: string // 项目户口，从 reference 改为 projectid
  category?: string
  sequenceNumber?: number // 排列序号，用于存储到Firebase
  createdByUid: string // Track who created the transaction
}

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

// 移除所有 sampleData，因为数据将从 Firebase 获取
