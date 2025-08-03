// lib/firebase-utils.ts
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, where, getDoc, orderBy, limit, startAfter } from "firebase/firestore"
import { db } from "./firebase"
import type { Account, JournalEntry, Project, Transaction, UserProfile, Category } from "./data"

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
    console.log('Checking if account code exists:', code)
    const q = query(collection(db, "accounts"), where("code", "==", code))
    const querySnapshot = await getDocs(q)
    const exists = !querySnapshot.empty
    console.log(`Account code ${code} exists: ${exists}`)
    return exists
  } catch (error) {
    console.error('Error checking account code existence:', error)
    throw new Error(`Failed to check account code existence: ${error}`)
  }
}

export async function addAccount(accountData: Omit<Account, "id">): Promise<string> {
  try {
    console.log('Adding account to Firebase:', accountData)
    
    const docRef = await addDoc(collection(db, "accounts"), {
      ...accountData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    })
    console.log('Account added successfully with ID:', docRef.id)
    return docRef.id
  } catch (error) {
    console.error('Error adding account:', error)
    throw new Error(`Failed to add account: ${error}`)
  }
}

export async function updateAccount(id: string, accountData: Partial<Omit<Account, "id">>): Promise<void> {
  try {
    console.log('Updating account in Firebase:', { id, accountData })
    const docRef = doc(db, "accounts", id)
    await updateDoc(docRef, {
      ...accountData,
      updatedAt: new Date().toISOString()
    })
    console.log('Account updated successfully')
  } catch (error) {
    console.error('Error updating account:', error)
    throw new Error(`Failed to update account: ${error}`)
  }
}

export async function deleteAccount(id: string): Promise<void> {
  try {
    console.log('Deleting account from Firebase:', id)
    const docRef = doc(db, "accounts", id)
    await deleteDoc(docRef)
    console.log('Account deleted successfully')
  } catch (error) {
    console.error('Error deleting account:', error)
    throw new Error(`Failed to delete account: ${error}`)
  }
}

export async function getAccountById(id: string): Promise<Account | null> {
  try {
    console.log('Getting account by ID:', id)
    const docRef = doc(db, "accounts", id)
    const docSnap = await getDoc(docRef)
    if (docSnap.exists()) {
      const account = { id: docSnap.id, ...docSnap.data() } as Account
      console.log('Account found:', account)
      return account
    }
    console.log('Account not found')
    return null
  } catch (error) {
    console.error('Error getting account:', error)
    throw new Error(`Failed to get account: ${error}`)
  }
}

export async function getAccountsByType(type: Account["type"]): Promise<Account[]> {
  try {
    console.log('Getting accounts by type:', type)
    const q = query(
      collection(db, "accounts"),
      where("type", "==", type),
      orderBy("code", "asc")
    )
    const querySnapshot = await getDocs(q)
    const accounts = querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as Account)
    console.log(`Found ${accounts.length} accounts of type ${type}`)
    return accounts
  } catch (error) {
    console.error('Error getting accounts by type:', error)
    throw new Error(`Failed to get accounts by type: ${error}`)
  }
}

export async function getAccountsByFinancialStatement(statement: string): Promise<Account[]> {
  try {
    console.log('Getting accounts by financial statement:', statement)
    const q = query(
      collection(db, "accounts"),
      where("financialStatement", "==", statement),
      orderBy("code", "asc")
    )
    const querySnapshot = await getDocs(q)
    const accounts = querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as Account)
    console.log(`Found ${accounts.length} accounts for ${statement}`)
    return accounts
  } catch (error) {
    console.error('Error getting accounts by financial statement:', error)
    throw new Error(`Failed to get accounts by financial statement: ${error}`)
  }
}

export async function searchAccounts(searchTerm: string): Promise<Account[]> {
  try {
    console.log('Searching accounts with term:', searchTerm)
    // Note: Firestore doesn't support full-text search natively
    // This is a simple implementation that gets all accounts and filters client-side
    // For production, consider using Algolia or similar search service
    const allAccounts = await getAccounts()
    const filteredAccounts = allAccounts.filter(account => 
      account.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      account.name.toLowerCase().includes(searchTerm.toLowerCase())
    )
    console.log(`Found ${filteredAccounts.length} accounts matching "${searchTerm}"`)
    return filteredAccounts
  } catch (error) {
    console.error('Error searching accounts:', error)
    throw new Error(`Failed to search accounts: ${error}`)
  }
}

export async function getAccountsWithPagination(limitCount: number = 50, lastDoc?: any): Promise<{
  accounts: Account[]
  lastDoc: any
  hasMore: boolean
}> {
  try {
    console.log('Getting accounts with pagination, limit:', limitCount)
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
    
    console.log(`Retrieved ${accounts.length} accounts, hasMore: ${hasMore}`)
    return {
      accounts,
      lastDoc: newLastDoc,
      hasMore
    }
  } catch (error) {
    console.error('Error getting accounts with pagination:', error)
    throw new Error(`Failed to get accounts with pagination: ${error}`)
  }
}

// Specific data fetching functions
export async function getTransactions(): Promise<Transaction[]> {
  return getCollection<Transaction>("transactions")
}

export async function getTransactionsByStatus(status: Transaction["status"]): Promise<Transaction[]> {
  try {
    console.log('Getting transactions by status:', status)
    const q = query(
      collection(db, "transactions"),
      where("status", "==", status),
      orderBy("date", "desc")
    )
    const querySnapshot = await getDocs(q)
    const transactions = querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as Transaction)
    console.log(`Found ${transactions.length} transactions with status ${status}`)
    return transactions
  } catch (error) {
    console.error('Error getting transactions by status:', error)
    throw new Error(`Failed to get transactions by status: ${error}`)
  }
}

export async function getTransactionsByCategory(category: string): Promise<Transaction[]> {
  try {
    console.log('Getting transactions by category:', category)
    const q = query(
      collection(db, "transactions"),
      where("category", "==", category),
      orderBy("date", "desc")
    )
    const querySnapshot = await getDocs(q)
    const transactions = querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as Transaction)
    console.log(`Found ${transactions.length} transactions for category ${category}`)
    return transactions
  } catch (error) {
    console.error('Error getting transactions by category:', error)
    throw new Error(`Failed to get transactions by category: ${error}`)
  }
}

export async function getTransactionsByDateRange(startDate: string, endDate: string): Promise<Transaction[]> {
  try {
    console.log('Getting transactions by date range:', { startDate, endDate })
    const q = query(
      collection(db, "transactions"),
      where("date", ">=", startDate),
      where("date", "<=", endDate),
      orderBy("date", "desc")
    )
    const querySnapshot = await getDocs(q)
    const transactions = querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as Transaction)
    console.log(`Found ${transactions.length} transactions in date range`)
    return transactions
  } catch (error) {
    console.error('Error getting transactions by date range:', error)
    throw new Error(`Failed to get transactions by date range: ${error}`)
  }
}

export async function searchTransactions(searchTerm: string): Promise<Transaction[]> {
  try {
    console.log('Searching transactions:', searchTerm)
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
    
    console.log(`Found ${filtered.length} transactions matching search term`)
    return filtered
  } catch (error) {
    console.error('Error searching transactions:', error)
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
    console.log('Getting transaction statistics')
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
    
    console.log('Transaction statistics:', stats)
    return stats
  } catch (error) {
    console.error('Error getting transaction statistics:', error)
    throw new Error(`Failed to get transaction statistics: ${error}`)
  }
}

export async function getAccounts(): Promise<Account[]> {
  try {
    console.log('Getting all accounts from Firebase')
    const q = query(collection(db, "accounts"), orderBy("code", "asc"))
    const querySnapshot = await getDocs(q)
    const accounts = querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as Account)
    console.log(`Retrieved ${accounts.length} accounts from Firebase`)
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
    console.log('Adding project to Firebase:', projectData)
    
    // 过滤掉 undefined 值，避免 Firebase 错误
    const cleanProjectData = Object.fromEntries(
      Object.entries(projectData).filter(([_, value]) => value !== undefined)
    )
    
    const docRef = await addDoc(collection(db, "projects"), {
      ...cleanProjectData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    })
    console.log('Project added successfully with ID:', docRef.id)
    return docRef.id
  } catch (error) {
    console.error('Error adding project:', error)
    throw new Error(`Failed to add project: ${error}`)
  }
}

export async function updateProject(id: string, projectData: Partial<Omit<Project, "id">>): Promise<void> {
  try {
    console.log('Updating project in Firebase:', { id, projectData })
    
    // 过滤掉 undefined 值，避免 Firebase 错误
    const cleanProjectData = Object.fromEntries(
      Object.entries(projectData).filter(([_, value]) => value !== undefined)
    )
    
    const docRef = doc(db, "projects", id)
    await updateDoc(docRef, {
      ...cleanProjectData,
      updatedAt: new Date().toISOString()
    })
    console.log('Project updated successfully')
  } catch (error) {
    console.error('Error updating project:', error)
    throw new Error(`Failed to update project: ${error}`)
  }
}

export async function deleteProject(id: string): Promise<void> {
  try {
    console.log('Deleting project from Firebase:', id)
    const docRef = doc(db, "projects", id)
    await deleteDoc(docRef)
    console.log('Project deleted successfully')
  } catch (error) {
    console.error('Error deleting project:', error)
    throw new Error(`Failed to delete project: ${error}`)
  }
}

export async function getProjectById(id: string): Promise<Project | null> {
  try {
    console.log('Getting project by ID:', id)
    const docRef = doc(db, "projects", id)
    const docSnap = await getDoc(docRef)
    if (docSnap.exists()) {
      const project = { id: docSnap.id, ...docSnap.data() } as Project
      console.log('Project found:', project)
      return project
    }
    console.log('Project not found')
    return null
  } catch (error) {
    console.error('Error getting project:', error)
    throw new Error(`Failed to get project: ${error}`)
  }
}

export async function getProjectsByStatus(status: Project["status"]): Promise<Project[]> {
  try {
    console.log('Getting projects by status:', status)
    const q = query(
      collection(db, "projects"),
      where("status", "==", status),
      orderBy("startDate", "desc")
    )
    const querySnapshot = await getDocs(q)
    const projects = querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as Project)
    console.log(`Found ${projects.length} projects with status ${status}`)
    return projects
  } catch (error) {
    console.error('Error getting projects by status:', error)
    throw new Error(`Failed to get projects by status: ${error}`)
  }
}

export async function getProjectsByUser(uid: string): Promise<Project[]> {
  try {
    console.log('Getting projects by user:', uid)
    const q = query(
      collection(db, "projects"),
      where("assignedToUid", "==", uid),
      orderBy("startDate", "desc")
    )
    const querySnapshot = await getDocs(q)
    const projects = querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as Project)
    console.log(`Found ${projects.length} projects assigned to user ${uid}`)
    return projects
  } catch (error) {
    console.error('Error getting projects by user:', error)
    throw new Error(`Failed to get projects by user: ${error}`)
  }
}

export async function searchProjects(searchTerm: string): Promise<Project[]> {
  try {
    console.log('Searching projects with term:', searchTerm)
    const allProjects = await getProjects()
    const filteredProjects = allProjects.filter(project => 
      project.projectid.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.name.toLowerCase().includes(searchTerm.toLowerCase())
    )
    console.log(`Found ${filteredProjects.length} projects matching "${searchTerm}"`)
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
    console.log('Getting projects by BOD category:', bodCategory)
    const q = query(
      collection(db, "projects"),
      where("bodCategory", "==", bodCategory),
      orderBy("startDate", "desc")
    )
    const querySnapshot = await getDocs(q)
    const projects = querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as Project)
    console.log(`Found ${projects.length} projects in BOD category ${bodCategory}`)
    return projects
  } catch (error) {
    console.error('Error getting projects by BOD category:', error)
    throw new Error(`Failed to get projects by BOD category: ${error}`)
  }
}

// 新增：检查项目代码是否存在
export async function checkProjectCodeExists(code: string): Promise<boolean> {
  try {
    console.log('Checking if project code exists:', code)
    const q = query(collection(db, "projects"), where("projectid", "==", code))
    const querySnapshot = await getDocs(q)
    const exists = !querySnapshot.empty
    console.log(`Project code ${code} exists: ${exists}`)
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
    console.log('Getting project statistics')
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
    
    console.log('Project statistics:', stats)
    return stats
  } catch (error) {
    console.error('Error getting project statistics:', error)
    throw new Error(`Failed to get project statistics: ${error}`)
  }
}

// 新增：计算项目的已花费金额
export async function getProjectSpentAmount(projectId: string): Promise<number> {
  try {
    console.log('Calculating spent amount for project:', projectId)
    
    // 获取项目信息
    const project = await getProjectById(projectId)
    if (!project) {
      console.log('Project not found:', projectId)
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
    
    console.log(`Project ${project.name} spent amount: $${totalSpent}`)
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
    console.log('Getting projects with pagination:', { limitCount, filters })
    
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
    
    console.log(`Retrieved ${projects.length} projects, hasMore: ${hasMore}`)
    
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
    console.log('Getting all categories from Firebase')
    const q = query(collection(db, "categories"), orderBy("code"))
    const querySnapshot = await getDocs(q)
    const categories = querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as Category)
    console.log(`Retrieved ${categories.length} categories`)
    return categories
  } catch (error) {
    console.error('Error getting categories:', error)
    throw new Error(`Failed to get categories: ${error}`)
  }
}

export async function addCategory(categoryData: Omit<Category, "id">): Promise<string> {
  try {
    console.log('Adding category to Firebase:', categoryData)
    
    const docRef = await addDoc(collection(db, "categories"), {
      ...categoryData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    })
    console.log('Category added successfully with ID:', docRef.id)
    return docRef.id
  } catch (error) {
    console.error('Error adding category:', error)
    throw new Error(`Failed to add category: ${error}`)
  }
}

export async function updateCategory(id: string, categoryData: Partial<Omit<Category, "id">>): Promise<void> {
  try {
    console.log('Updating category in Firebase:', { id, categoryData })
    const docRef = doc(db, "categories", id)
    await updateDoc(docRef, {
      ...categoryData,
      updatedAt: new Date().toISOString()
    })
    console.log('Category updated successfully')
  } catch (error) {
    console.error('Error updating category:', error)
    throw new Error(`Failed to update category: ${error}`)
  }
}

export async function deleteCategory(id: string): Promise<void> {
  try {
    console.log('Deleting category from Firebase:', id)
    const docRef = doc(db, "categories", id)
    await deleteDoc(docRef)
    console.log('Category deleted successfully')
  } catch (error) {
    console.error('Error deleting category:', error)
    throw new Error(`Failed to delete category: ${error}`)
  }
}

export async function checkCategoryCodeExists(code: string): Promise<boolean> {
  try {
    console.log('Checking if category code exists:', code)
    const q = query(collection(db, "categories"), where("code", "==", code))
    const querySnapshot = await getDocs(q)
    const exists = !querySnapshot.empty
    console.log(`Category code ${code} exists: ${exists}`)
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
    console.log('Getting category statistics')
    const categories = await getCategories()
    
    const stats = {
      totalCategories: categories.length,
      incomeCategories: categories.filter(cat => cat.type === "Income").length,
      expenseCategories: categories.filter(cat => cat.type === "Expense").length,
      activeCategories: categories.filter(cat => cat.isActive).length,
      inactiveCategories: categories.filter(cat => !cat.isActive).length,
    }
    
    console.log('Category statistics:', stats)
    return stats
  } catch (error) {
    console.error('Error getting category statistics:', error)
    throw new Error(`Failed to get category statistics: ${error}`)
  }
}
