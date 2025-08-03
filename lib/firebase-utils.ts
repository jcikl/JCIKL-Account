// lib/firebase-utils.ts
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, where, getDoc, orderBy, limit, startAfter, onSnapshot } from "firebase/firestore"
import { db } from "./firebase"
import type { Account, JournalEntry, Project, Transaction, UserProfile, Category } from "./data"
import React from "react"

// Generic CRUD operations
export async function getCollection<T>(collectionName: string): Promise<T[]> {
  const q = collection(db, collectionName)
  const querySnapshot = await getDocs(q)
  return querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as T)
}

export async function getDocument<T>(collectionName: string, id: string): Promise<T | null> {
  const docRef = doc(db, collectionName, id)
  const docSnap = await getDoc(docRef)
  if (docSnap.exists()) {
    return { id: docSnap.id, ...docSnap.data() } as T
  }
  return null
}

export async function addDocument<T>(collectionName: string, data: Omit<T, "id">): Promise<string> {
  const docRef = await addDoc(collection(db, collectionName), data)
  return docRef.id
}

export async function updateDocument<T>(
  collectionName: string,
  id: string,
  data: Partial<Omit<T, "id">>,
): Promise<void> {
  const docRef = doc(db, collectionName, id)
  await updateDoc(docRef, data)
}

export async function deleteDocument(collectionName: string, id: string): Promise<void> {
  const docRef = doc(db, collectionName, id)
  await deleteDoc(docRef)
}

// Account-specific operations
export async function checkAccountCodeExists(code: string): Promise<boolean> {
  try {
    // console.log('Checking if account code exists:', code)
    const q = query(collection(db, "accounts"), where("code", "==", code))
    const querySnapshot = await getDocs(q)
    const exists = !querySnapshot.empty
    // console.log(`Account code ${code} exists: ${exists}`)
    return exists
  } catch (error) {
    // console.error('Error checking account code existence:', error)
    throw new Error(`Failed to check account code existence: ${error}`)
  }
}

export async function addAccount(accountData: Omit<Account, "id">): Promise<string> {
  try {
    // console.log('Adding account to Firebase:', accountData)
    
    const docRef = await addDoc(collection(db, "accounts"), {
      ...accountData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    })
    // console.log('Account added successfully with ID:', docRef.id)
    return docRef.id
  } catch (error) {
    // console.error('Error adding account:', error)
    throw new Error(`Failed to add account: ${error}`)
  }
}

export async function updateAccount(id: string, accountData: Partial<Omit<Account, "id">>): Promise<void> {
  try {
    // console.log('Updating account in Firebase:', { id, accountData })
    const docRef = doc(db, "accounts", id)
    await updateDoc(docRef, {
      ...accountData,
      updatedAt: new Date().toISOString()
    })
    // console.log('Account updated successfully')
  } catch (error) {
    // console.error('Error updating account:', error)
    throw new Error(`Failed to update account: ${error}`)
  }
}

export async function deleteAccount(id: string): Promise<void> {
  try {
    // console.log('Deleting account from Firebase:', id)
    const docRef = doc(db, "accounts", id)
    await deleteDoc(docRef)
    // console.log('Account deleted successfully')
  } catch (error) {
    // console.error('Error deleting account:', error)
    throw new Error(`Failed to delete account: ${error}`)
  }
}

export async function getAccountById(id: string): Promise<Account | null> {
  try {
    // console.log('Getting account by ID:', id)
    const docRef = doc(db, "accounts", id)
    const docSnap = await getDoc(docRef)
    if (docSnap.exists()) {
      const account = { id: docSnap.id, ...docSnap.data() } as Account
      // console.log('Account found:', account)
      return account
    }
    // console.log('Account not found')
    return null
  } catch (error) {
    // console.error('Error getting account:', error)
    throw new Error(`Failed to get account: ${error}`)
  }
}

export async function getAccountsByType(type: Account["type"]): Promise<Account[]> {
  try {
    // console.log('Getting accounts by type:', type)
    const q = query(
      collection(db, "accounts"),
      where("type", "==", type),
      orderBy("code", "asc")
    )
    const querySnapshot = await getDocs(q)
    const accounts = querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as Account)
    // console.log(`Found ${accounts.length} accounts of type ${type}`)
    return accounts
  } catch (error) {
    // console.error('Error getting accounts by type:', error)
    throw new Error(`Failed to get accounts by type: ${error}`)
  }
}

export async function getAccountsByFinancialStatement(statement: string): Promise<Account[]> {
  try {
    // console.log('Getting accounts by financial statement:', statement)
    const q = query(
      collection(db, "accounts"),
      where("financialStatement", "==", statement),
      orderBy("code", "asc")
    )
    const querySnapshot = await getDocs(q)
    const accounts = querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as Account)
    // console.log(`Found ${accounts.length} accounts for ${statement}`)
    return accounts
  } catch (error) {
    // console.error('Error getting accounts by financial statement:', error)
    throw new Error(`Failed to get accounts by financial statement: ${error}`)
  }
}

export async function searchAccounts(searchTerm: string): Promise<Account[]> {
  try {
    // console.log('Searching accounts with term:', searchTerm)
    // Note: Firestore doesn't support full-text search natively
    // This is a simple implementation that gets all accounts and filters client-side
    // For production, consider using Algolia or similar search service
    const allAccounts = await getAccounts()
    const filteredAccounts = allAccounts.filter(account => 
      account.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      account.name.toLowerCase().includes(searchTerm.toLowerCase())
    )
    // console.log(`Found ${filteredAccounts.length} accounts matching "${searchTerm}"`)
    return filteredAccounts
  } catch (error) {
    // console.error('Error searching accounts:', error)
    throw new Error(`Failed to search accounts: ${error}`)
  }
}

export async function getAccountsWithPagination(limitCount: number = 50, lastDoc?: any): Promise<{
  accounts: Account[]
  lastDoc: any
  hasMore: boolean
}> {
  try {
    // console.log('Getting accounts with pagination, limit:', limitCount)
    let q = query(
      collection(db, "accounts"),
      orderBy("code", "asc"),
      limit(limitCount)
    )
    
    if (lastDoc) {
      q = query(q, startAfter(lastDoc))
    }
    
    const querySnapshot = await getDocs(q)
    const accounts = querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as Account)
    const newLastDoc = querySnapshot.docs[querySnapshot.docs.length - 1]
    const hasMore = querySnapshot.docs.length === limitCount
    
    // console.log(`Retrieved ${accounts.length} accounts, hasMore: ${hasMore}`)
    return {
      accounts,
      lastDoc: newLastDoc,
      hasMore
    }
  } catch (error) {
    // console.error('Error getting accounts with pagination:', error)
    throw new Error(`Failed to get accounts with pagination: ${error}`)
  }
}

// Specific data fetching functions
export async function getTransactions(): Promise<Transaction[]> {
  try {
    // 按序号排序获取交易，如果没有序号则按日期排序
    const q = query(collection(db, "transactions"), orderBy("sequenceNumber", "asc"))
    const querySnapshot = await getDocs(q)
    const transactions = querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as Transaction)
    
    // 如果所有交易都没有序号，按日期排序
    const hasSequenceNumbers = transactions.some(t => t.sequenceNumber)
    if (!hasSequenceNumbers) {
      const dateQuery = query(collection(db, "transactions"), orderBy("date", "desc"))
      const dateSnapshot = await getDocs(dateQuery)
      return dateSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as Transaction)
    }
    
    return transactions
  } catch (error) {
    // 如果序号排序失败，回退到日期排序
    console.warn('序号排序失败，回退到日期排序:', error)
    const q = query(collection(db, "transactions"), orderBy("date", "desc"))
    const querySnapshot = await getDocs(q)
    return querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as Transaction)
  }
}

export async function getTransactionsByStatus(status: Transaction["status"]): Promise<Transaction[]> {
  try {
    // console.log('Getting transactions by status:', status)
    const q = query(
      collection(db, "transactions"),
      where("status", "==", status),
      orderBy("date", "desc")
    )
    const querySnapshot = await getDocs(q)
    const transactions = querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as Transaction)
    // console.log(`Found ${transactions.length} transactions with status ${status}`)
    return transactions
  } catch (error) {
    // console.error('Error getting transactions by status:', error)
    throw new Error(`Failed to get transactions by status: ${error}`)
  }
}

export async function getTransactionsByCategory(category: string): Promise<Transaction[]> {
  try {
    // console.log('Getting transactions by category:', category)
    const q = query(
      collection(db, "transactions"),
      where("category", "==", category),
      orderBy("date", "desc")
    )
    const querySnapshot = await getDocs(q)
    const transactions = querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as Transaction)
    // console.log(`Found ${transactions.length} transactions for category ${category}`)
    return transactions
  } catch (error) {
    // console.error('Error getting transactions by category:', error)
    throw new Error(`Failed to get transactions by category: ${error}`)
  }
}

export async function getTransactionsByDateRange(startDate: string, endDate: string): Promise<Transaction[]> {
  try {
    // console.log('Getting transactions by date range:', { startDate, endDate })
    const q = query(
      collection(db, "transactions"),
      where("date", ">=", startDate),
      where("date", "<=", endDate),
      orderBy("date", "desc")
    )
    const querySnapshot = await getDocs(q)
    const transactions = querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as Transaction)
    // console.log(`Found ${transactions.length} transactions in date range`)
    return transactions
  } catch (error) {
    // console.error('Error getting transactions by date range:', error)
    throw new Error(`Failed to get transactions by date range: ${error}`)
  }
}

export async function searchTransactions(searchTerm: string): Promise<Transaction[]> {
  try {
    // console.log('Searching transactions:', searchTerm)
    const q = query(collection(db, "transactions"), orderBy("date", "desc"))
    const querySnapshot = await getDocs(q)
    const transactions = querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as Transaction)
    
    // Client-side search for better performance
    const filtered = transactions.filter(transaction =>
      transaction.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (transaction.description2 && transaction.description2.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (transaction.projectid && transaction.projectid.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (transaction.category && transaction.category.toLowerCase().includes(searchTerm.toLowerCase()))
    )
    
    // console.log(`Found ${filtered.length} transactions matching search term`)
    return filtered
  } catch (error) {
    // console.error('Error searching transactions:', error)
    throw new Error(`Failed to search transactions: ${error}`)
  }
}

export async function getTransactionStats(): Promise<{
  totalTransactions: number
  completedTransactions: number
  pendingTransactions: number
  draftTransactions: number
  totalExpenses: number
  totalIncome: number
  netAmount: number
}> {
  try {
    // console.log('Getting transaction statistics')
    const transactions = await getTransactions()
    
    const stats = {
      totalTransactions: transactions.length,
      completedTransactions: transactions.filter(t => t.status === "Completed").length,
      pendingTransactions: transactions.filter(t => t.status === "Pending").length,
      draftTransactions: transactions.filter(t => t.status === "Draft").length,
      totalExpenses: transactions.reduce((sum, t) => sum + t.expense, 0),
      totalIncome: transactions.reduce((sum, t) => sum + t.income, 0),
      netAmount: 0
    }
    
    stats.netAmount = stats.totalIncome - stats.totalExpenses
    
    // console.log('Transaction statistics:', stats)
    return stats
  } catch (error) {
    // console.error('Error getting transaction statistics:', error)
    throw new Error(`Failed to get transaction statistics: ${error}`)
  }
}

export async function getAccounts(): Promise<Account[]> {
  try {
    // console.log('Getting all accounts from Firebase')
    const q = query(collection(db, "accounts"), orderBy("code", "asc"))
    const querySnapshot = await getDocs(q)
    const accounts = querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as Account)
    // console.log(`Retrieved ${accounts.length} accounts from Firebase`)
    return accounts
  } catch (error) {
    console.error('Error getting accounts:', error)
    throw new Error(`Failed to get accounts: ${error}`)
  }
}

export async function getProjects(): Promise<Project[]> {
  return getCollection<Project>("projects")
}

// 添加项目相关的CRUD操作
export async function addProject(projectData: Omit<Project, "id">): Promise<string> {
  try {
    // console.log('Adding project to Firebase:', projectData)
    
    // 过滤掉 undefined 值，避免 Firebase 错误
    const cleanProjectData = Object.fromEntries(
      Object.entries(projectData).filter(([_, value]) => value !== undefined)
    )
    
    const docRef = await addDoc(collection(db, "projects"), {
      ...cleanProjectData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    })
    // console.log('Project added successfully with ID:', docRef.id)
    return docRef.id
  } catch (error) {
    console.error('Error adding project:', error)
    throw new Error(`Failed to add project: ${error}`)
  }
}

export async function updateProject(id: string, projectData: Partial<Omit<Project, "id">>): Promise<void> {
  try {
    // console.log('Updating project in Firebase:', { id, projectData })
    
    // 过滤掉 undefined 值，避免 Firebase 错误
    const cleanProjectData = Object.fromEntries(
      Object.entries(projectData).filter(([_, value]) => value !== undefined)
    )
    
    const docRef = doc(db, "projects", id)
    await updateDoc(docRef, {
      ...cleanProjectData,
      updatedAt: new Date().toISOString()
    })
    // console.log('Project updated successfully')
  } catch (error) {
    console.error('Error updating project:', error)
    throw new Error(`Failed to update project: ${error}`)
  }
}

export async function deleteProject(id: string): Promise<void> {
  try {
    // console.log('Deleting project from Firebase:', id)
    const docRef = doc(db, "projects", id)
    await deleteDoc(docRef)
    // console.log('Project deleted successfully')
  } catch (error) {
    console.error('Error deleting project:', error)
    throw new Error(`Failed to delete project: ${error}`)
  }
}

export async function getProjectById(id: string): Promise<Project | null> {
  try {
    // console.log('Getting project by ID:', id)
    const docRef = doc(db, "projects", id)
    const docSnap = await getDoc(docRef)
    if (docSnap.exists()) {
      const project = { id: docSnap.id, ...docSnap.data() } as Project
      // console.log('Project found:', project)
      return project
    }
    // console.log('Project not found')
    return null
  } catch (error) {
    console.error('Error getting project:', error)
    throw new Error(`Failed to get project: ${error}`)
  }
}

export async function getProjectsByStatus(status: Project["status"]): Promise<Project[]> {
  try {
    // console.log('Getting projects by status:', status)
    const q = query(
      collection(db, "projects"),
      where("status", "==", status),
      orderBy("startDate", "desc")
    )
    const querySnapshot = await getDocs(q)
    const projects = querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as Project)
    // console.log(`Found ${projects.length} projects with status ${status}`)
    return projects
  } catch (error) {
    console.error('Error getting projects by status:', error)
    throw new Error(`Failed to get projects by status: ${error}`)
  }
}

export async function getProjectsByUser(uid: string): Promise<Project[]> {
  try {
    // console.log('Getting projects by user:', uid)
    const q = query(
      collection(db, "projects"),
      where("assignedToUid", "==", uid),
      orderBy("startDate", "desc")
    )
    const querySnapshot = await getDocs(q)
    const projects = querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as Project)
    // console.log(`Found ${projects.length} projects assigned to user ${uid}`)
    return projects
  } catch (error) {
    console.error('Error getting projects by user:', error)
    throw new Error(`Failed to get projects by user: ${error}`)
  }
}

export async function searchProjects(searchTerm: string): Promise<Project[]> {
  try {
    // console.log('Searching projects with term:', searchTerm)
    const allProjects = await getProjects()
    const filteredProjects = allProjects.filter(project => 
      project.projectid.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.name.toLowerCase().includes(searchTerm.toLowerCase())
    )
    // console.log(`Found ${filteredProjects.length} projects matching "${searchTerm}"`)
    return filteredProjects
  } catch (error) {
    console.error('Error searching projects:', error)
    throw new Error(`Failed to search projects: ${error}`)
  }
}

export async function getJournalEntries(): Promise<JournalEntry[]> {
  return getCollection<JournalEntry>("journalEntries")
}

export async function getUsers(): Promise<UserProfile[]> {
  return getCollection<UserProfile>("users")
}

export async function getUserByUid(uid: string): Promise<UserProfile | null> {
  const q = query(collection(db, "users"), where("uid", "==", uid))
  const querySnapshot = await getDocs(q)
  if (!querySnapshot.empty) {
    return {
      id: querySnapshot.docs[0].id,
      ...querySnapshot.docs[0].data(),
    } as UserProfile
  }
  return null
}

// 新增：按BOD分类获取项目
export async function getProjectsByBOD(bodCategory: string): Promise<Project[]> {
  try {
    // console.log('Getting projects by BOD category:', bodCategory)
    const q = query(
      collection(db, "projects"),
      where("bodCategory", "==", bodCategory),
      orderBy("startDate", "desc")
    )
    const querySnapshot = await getDocs(q)
    const projects = querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as Project)
    // console.log(`Found ${projects.length} projects in BOD category ${bodCategory}`)
    return projects
  } catch (error) {
    console.error('Error getting projects by BOD category:', error)
    throw new Error(`Failed to get projects by BOD category: ${error}`)
  }
}

// 新增：检查项目代码是否存在
export async function checkProjectCodeExists(code: string): Promise<boolean> {
  try {
    // console.log('Checking if project code exists:', code)
    const q = query(collection(db, "projects"), where("projectid", "==", code))
    const querySnapshot = await getDocs(q)
    const exists = !querySnapshot.empty
    // console.log(`Project code ${code} exists: ${exists}`)
    return exists
  } catch (error) {
    console.error('Error checking project code existence:', error)
    throw new Error(`Failed to check project code existence: ${error}`)
  }
}

// 新增：获取项目统计信息
export async function getProjectStats(): Promise<{
  totalProjects: number
  activeProjects: number
  completedProjects: number
  onHoldProjects: number
  totalBudget: number
  totalSpent: number
  totalRemaining: number
}> {
  try {
    // console.log('Getting project statistics')
    const projects = await getProjects()
    
    // 计算每个项目的已花费金额
    const projectsWithSpent = await Promise.all(
      projects.map(async (project) => {
        const spent = await getProjectSpentAmount(project.id!)
        return { ...project, spent }
      })
    )
    
    const stats = {
      totalProjects: projects.length,
      activeProjects: projects.filter(p => p.status === "Active").length,
      completedProjects: projects.filter(p => p.status === "Completed").length,
      onHoldProjects: projects.filter(p => p.status === "On Hold").length,
      totalBudget: projects.reduce((sum, p) => sum + p.budget, 0),
      totalSpent: projectsWithSpent.reduce((sum, p) => sum + p.spent, 0),
      totalRemaining: projects.reduce((sum, p) => sum + p.remaining, 0)
    }
    
    // console.log('Project statistics:', stats)
    return stats
  } catch (error) {
    console.error('Error getting project statistics:', error)
    throw new Error(`Failed to get project statistics: ${error}`)
  }
}

// 新增：计算项目的已花费金额
export async function getProjectSpentAmount(projectId: string): Promise<number> {
  try {
    //console.log('Calculating spent amount for project:', projectId)
    
    // 获取项目信息
    const project = await getProjectById(projectId)
    if (!project) {
      // console.log('Project not found:', projectId)
      return 0
    }
    
    // 获取所有交易记录
    const allTransactions = await getTransactions()
    
    // 根据projectid匹配银行交易记录
    const projectTransactions = allTransactions.filter(transaction => {
      // 1. 精确匹配：检查交易的项目户口是否匹配项目的projectid
      const exactMatch = transaction.projectid === project.projectid
      
      // 2. 项目名称匹配：检查交易projectid是否包含项目名称
      const nameMatch = transaction.projectid && 
                       transaction.projectid.toLowerCase().includes(project.name.toLowerCase())
      
      // 3. 项目代码匹配：检查交易projectid是否包含项目代码的关键部分
      const codeMatch = transaction.projectid && 
                       project.projectid && 
                       transaction.projectid.toLowerCase().includes(project.projectid.toLowerCase().split('_').pop() || '')
      
      return exactMatch || nameMatch || codeMatch
    })
    
    // 计算总支出
    const totalSpent = projectTransactions.reduce((sum, transaction) => sum + transaction.expense, 0)
    
    // console.log(`Project ${project.name} spent amount: $${totalSpent}`)
    return totalSpent
  } catch (error) {
    console.error('Error calculating project spent amount:', error)
    throw new Error(`Failed to calculate project spent amount: ${error}`)
  }
}

// 新增：获取项目分页数据
export async function getProjectsWithPagination(
  limitCount: number = 20, 
  lastDoc?: any,
  filters?: {
    status?: string
    bodCategory?: string
    searchTerm?: string
  }
): Promise<{
  projects: Project[]
  lastDoc: any
  hasMore: boolean
}> {
  try {
    // console.log('Getting projects with pagination:', { limitCount, filters })
    
    let q = query(collection(db, "projects"), orderBy("startDate", "desc"), limit(limitCount))
    
    // 应用筛选条件
    if (filters?.status && filters.status !== "all") {
      q = query(q, where("status", "==", filters.status))
    }
    
    if (filters?.bodCategory && filters.bodCategory !== "all") {
      q = query(q, where("bodCategory", "==", filters.bodCategory))
    }
    
    if (lastDoc) {
      q = query(q, startAfter(lastDoc))
    }
    
    const querySnapshot = await getDocs(q)
    const projects = querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as Project)
    
    const hasMore = querySnapshot.docs.length === limitCount
    const newLastDoc = hasMore ? querySnapshot.docs[querySnapshot.docs.length - 1] : null
    
    // console.log(`Retrieved ${projects.length} projects, hasMore: ${hasMore}`)
    
    return {
      projects,
      lastDoc: newLastDoc,
      hasMore
    }
  } catch (error) {
    console.error('Error getting projects with pagination:', error)
    throw new Error(`Failed to get projects with pagination: ${error}`)
  }
}

// Category-related operations
export async function getCategories(): Promise<Category[]> {
  try {
    // console.log('Getting all categories from Firebase')
    const q = query(collection(db, "categories"), orderBy("code"))
    const querySnapshot = await getDocs(q)
    const categories = querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as Category)
    // console.log(`Retrieved ${categories.length} categories`)
    return categories
  } catch (error) {
    console.error('Error getting categories:', error)
    throw new Error(`Failed to get categories: ${error}`)
  }
}

export async function addCategory(categoryData: Omit<Category, "id">): Promise<string> {
  try {
    // console.log('Adding category to Firebase:', categoryData)
    
    const docRef = await addDoc(collection(db, "categories"), {
      ...categoryData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    })
    // console.log('Category added successfully with ID:', docRef.id)
    return docRef.id
  } catch (error) {
    console.error('Error adding category:', error)
    throw new Error(`Failed to add category: ${error}`)
  }
}

export async function updateCategory(id: string, categoryData: Partial<Omit<Category, "id">>): Promise<void> {
  try {
    // console.log('Updating category in Firebase:', { id, categoryData })
    const docRef = doc(db, "categories", id)
    await updateDoc(docRef, {
      ...categoryData,
      updatedAt: new Date().toISOString()
    })
    // console.log('Category updated successfully')
  } catch (error) {
    console.error('Error updating category:', error)
    throw new Error(`Failed to update category: ${error}`)
  }
}

export async function deleteCategory(id: string): Promise<void> {
  try {
    // console.log('Deleting category from Firebase:', id)
    const docRef = doc(db, "categories", id)
    await deleteDoc(docRef)
    // console.log('Category deleted successfully')
  } catch (error) {
    console.error('Error deleting category:', error)
    throw new Error(`Failed to delete category: ${error}`)
  }
}

export async function checkCategoryCodeExists(code: string): Promise<boolean> {
  try {
    // console.log('Checking if category code exists:', code)
    const q = query(collection(db, "categories"), where("code", "==", code))
    const querySnapshot = await getDocs(q)
    const exists = !querySnapshot.empty
    // console.log(`Category code ${code} exists: ${exists}`)
    return exists
  } catch (error) {
    console.error('Error checking category code existence:', error)
    throw new Error(`Failed to check category code existence: ${error}`)
  }
}

export async function getCategoryStats(): Promise<{
  totalCategories: number
  incomeCategories: number
  expenseCategories: number
  activeCategories: number
  inactiveCategories: number
}> {
  try {
    // console.log('Getting category statistics')
    const categories = await getCategories()
    
    const stats = {
      totalCategories: categories.length,
      incomeCategories: categories.filter(cat => cat.type === "Income").length,
      expenseCategories: categories.filter(cat => cat.type === "Expense").length,
      activeCategories: categories.filter(cat => cat.isActive).length,
      inactiveCategories: categories.filter(cat => !cat.isActive).length,
    }
    
    // console.log('Category statistics:', stats)
    return stats
  } catch (error) {
    console.error('Error getting category statistics:', error)
    throw new Error(`Failed to get category statistics: ${error}`)
  }
}

// 缓存系统
const cache = new Map<string, { data: any; timestamp: number; ttl: number }>()

function getCachedData<T>(key: string): T | null {
  const cached = cache.get(key)
  if (!cached) return null
  
  if (Date.now() - cached.timestamp > cached.ttl) {
    cache.delete(key)
    return null
  }
  
  return cached.data as T
}

function setCachedData<T>(key: string, data: T, ttl: number = 5 * 60 * 1000): void {
  cache.set(key, {
    data,
    timestamp: Date.now(),
    ttl
  })
}

// 优化的分页查询函数
export async function getTransactionsWithPagination(
  limitCount: number = 50, 
  lastDoc?: any,
  filters?: {
    status?: string
    dateRange?: { start: Date; end: Date }
    searchTerm?: string
    projectid?: string
    category?: string
  }
): Promise<{
  transactions: Transaction[]
  lastDoc: any
  hasMore: boolean
}> {
  try {
    const q = query(
      collection(db, "transactions"),
      ...(filters?.status && filters.status !== 'all' ? [where("status", "==", filters.status)] : []),
      ...(filters?.projectid && filters.projectid !== 'all' ? [where("projectid", "==", filters.projectid)] : []),
      ...(filters?.category && filters.category !== 'all' ? [where("category", "==", filters.category)] : []),
      ...(filters?.dateRange ? [
        where("date", ">=", filters.dateRange.start),
        where("date", "<=", filters.dateRange.end)
      ] : []),
      orderBy("date", "desc"),
      limit(limitCount),
      ...(lastDoc ? [startAfter(lastDoc)] : [])
    )
    
    const querySnapshot = await getDocs(q)
    const transactions = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Transaction[]
    
    const lastVisible = querySnapshot.docs[querySnapshot.docs.length - 1]
    
    return {
      transactions,
      lastDoc: lastVisible,
      hasMore: querySnapshot.docs.length === limitCount
    }
  } catch (error) {
    console.error('Error fetching transactions with pagination:', error)
    throw error
  }
}

// 优化的批量获取函数
export async function getTransactionsBatch(
  batchSize: number = 100,
  filters?: {
    status?: string
    dateRange?: { start: Date; end: Date }
  }
): Promise<Transaction[]> {
  const cacheKey = `transactions_batch_${JSON.stringify(filters)}_${batchSize}`
  const cached = getCachedData<Transaction[]>(cacheKey)
  if (cached) return cached
  
  try {
    const q = query(
      collection(db, "transactions"),
      ...(filters?.status && filters.status !== 'all' ? [where("status", "==", filters.status)] : []),
      ...(filters?.dateRange ? [
        where("date", ">=", filters.dateRange.start),
        where("date", "<=", filters.dateRange.end)
      ] : []),
      orderBy("date", "desc"),
      limit(batchSize)
    )
    
    const querySnapshot = await getDocs(q)
    const transactions = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Transaction[]
    
    setCachedData(cacheKey, transactions, 2 * 60 * 1000) // 2分钟缓存
    return transactions
  } catch (error) {
    console.error('Error fetching transactions batch:', error)
    throw error
  }
}

// 优化的项目花费金额计算（并行处理）
export async function getProjectsSpentAmounts(projectIds: string[]): Promise<Record<string, number>> {
  const cacheKey = `projects_spent_${projectIds.sort().join('_')}`
  const cached = getCachedData<Record<string, number>>(cacheKey)
  if (cached) return cached
  
  try {
    // 并行计算所有项目的花费金额
    const spentPromises = projectIds.map(async (projectId) => {
      try {
        const spent = await getProjectSpentAmount(projectId)
        return { [projectId]: spent }
      } catch (error) {
        console.error(`Error calculating spent amount for project ${projectId}:`, error)
        return { [projectId]: 0 }
      }
    })
    
    const spentResults = await Promise.all(spentPromises)
    const combinedSpentAmounts = spentResults.reduce((acc, curr) => ({ ...acc, ...curr }), {})
    
    setCachedData(cacheKey, combinedSpentAmounts, 5 * 60 * 1000) // 5分钟缓存
    return combinedSpentAmounts
  } catch (error) {
    console.error('Error calculating projects spent amounts:', error)
    throw error
  }
}

// 实时监听函数
export function useTransactionsRealtime(
  filters?: {
    status?: string
    dateRange?: { start: Date; end: Date }
  }
) {
  const [transactions, setTransactions] = React.useState<Transaction[]>([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    const q = query(
      collection(db, "transactions"),
      orderBy("date", "desc"),
      ...(filters?.status && filters.status !== 'all' ? [where("status", "==", filters.status)] : []),
      ...(filters?.dateRange ? [
        where("date", ">=", filters.dateRange.start),
        where("date", "<=", filters.dateRange.end)
      ] : [])
    )
    
    const unsubscribe = onSnapshot(q, 
      (querySnapshot) => {
        const fetchedTransactions = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Transaction[]
        setTransactions(fetchedTransactions)
        setLoading(false)
      },
      (error) => {
        console.error('Error listening to transactions:', error)
        setError(error.message)
        setLoading(false)
      }
    )

    return () => unsubscribe()
  }, [filters?.status, filters?.dateRange?.start, filters?.dateRange?.end])

  return { transactions, loading, error }
}

// 清理缓存函数
export function clearCache(pattern?: string): void {
  if (pattern) {
    for (const key of cache.keys()) {
      if (key.includes(pattern)) {
        cache.delete(key)
      }
    }
  } else {
    cache.clear()
  }
}

// 获取缓存统计
export function getCacheStats(): { size: number; keys: string[] } {
  return {
    size: cache.size,
    keys: Array.from(cache.keys())
  }
}

// 序号相关的函数
export async function getNextSequenceNumber(): Promise<number> {
  try {
    const q = query(collection(db, "transactions"), orderBy("sequenceNumber", "desc"), limit(1))
    const querySnapshot = await getDocs(q)
    
    if (querySnapshot.empty) {
      return 1
    }
    
    const lastTransaction = querySnapshot.docs[0].data() as Transaction
    return (lastTransaction.sequenceNumber || 0) + 1
  } catch (error) {
    console.error('Error getting next sequence number:', error)
    // 如果出错，返回当前时间戳作为序号
    return Date.now()
  }
}

export async function updateTransactionSequence(transactionId: string, newSequenceNumber: number): Promise<void> {
  try {
    await updateDocument("transactions", transactionId, { sequenceNumber: newSequenceNumber })
  } catch (error) {
    console.error('Error updating transaction sequence:', error)
    throw new Error(`Failed to update transaction sequence: ${error}`)
  }
}

export async function reorderTransactions(transactionIds: string[]): Promise<void> {
  try {
    // 批量更新序号
    const updatePromises = transactionIds.map((id, index) => 
      updateDocument("transactions", id, { sequenceNumber: index + 1 })
    )
    
    await Promise.all(updatePromises)
  } catch (error) {
    console.error('Error reordering transactions:', error)
    throw new Error(`Failed to reorder transactions: ${error}`)
  }
}

export async function addTransactionWithSequence(transactionData: Omit<Transaction, "id" | "sequenceNumber">): Promise<string> {
  try {
    const nextSequenceNumber = await getNextSequenceNumber()
    const transactionWithSequence = {
      ...transactionData,
      sequenceNumber: nextSequenceNumber
    }
    
    return await addDocument("transactions", transactionWithSequence)
  } catch (error) {
    console.error('Error adding transaction with sequence:', error)
    throw new Error(`Failed to add transaction with sequence: ${error}`)
  }
}
