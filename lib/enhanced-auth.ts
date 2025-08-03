// lib/enhanced-auth.ts
// 增强的认证系统：同时保存到 Firebase Authentication 和 Firestore
// 提供统一的认证接口，支持密码保存到 Firebase

import { db, auth } from './firebase'
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  doc, 
  setDoc, 
  updateDoc,
  getDoc 
} from 'firebase/firestore'
import { 
  createUserWithEmailAndPassword as firebaseCreateUser,
  signInWithEmailAndPassword as firebaseSignIn,
  signOut as firebaseSignOut,
  updateProfile as firebaseUpdateProfile,
  User as FirebaseUser
} from 'firebase/auth'
import { UserProfile, UserRoles } from './data'

// localStorage 键名
const AUTH_STORAGE_KEY = 'jcikl_enhanced_auth_user'
const AUTH_TIMESTAMP_KEY = 'jcikl_enhanced_auth_timestamp'
const AUTH_TYPE_KEY = 'jcikl_enhanced_auth_type'

// 认证过期时间（24小时）
const AUTH_EXPIRY_HOURS = 24

export interface EnhancedAuthUser {
  uid: string
  email: string
  displayName: string
  role: UserRoles
  createdAt: string
  lastLogin: string
  authType: 'firebase' | 'custom' // 认证类型
}

export interface AuthResult {
  user: EnhancedAuthUser
  firebaseUser?: FirebaseUser
}

class EnhancedAuth {
  private currentUser: EnhancedAuthUser | null = null
  private listeners: ((user: EnhancedAuthUser | null) => void)[] = []

  constructor() {
    this.restoreFromStorage()
  }

  // 从 localStorage 恢复用户状态
  private restoreFromStorage(): void {
    try {
      if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
        return
      }
      
      const storedUser = localStorage.getItem(AUTH_STORAGE_KEY)
      const timestamp = localStorage.getItem(AUTH_TIMESTAMP_KEY)
      
      if (storedUser && timestamp) {
        const user = JSON.parse(storedUser) as EnhancedAuthUser
        const loginTime = parseInt(timestamp)
        const now = Date.now()
        
        if (now - loginTime < AUTH_EXPIRY_HOURS * 60 * 60 * 1000) {
          this.currentUser = user
          this.notifyListeners()
        } else {
          this.clearStorage()
        }
      }
    } catch (error) {
      console.error('恢复认证状态失败:', error)
      this.clearStorage()
    }
  }

  // 保存到 localStorage
  private saveToStorage(user: EnhancedAuthUser): void {
    try {
      if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
        return
      }
      
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user))
      localStorage.setItem(AUTH_TIMESTAMP_KEY, Date.now().toString())
      localStorage.setItem(AUTH_TYPE_KEY, user.authType)
    } catch (error) {
      console.error('保存认证状态失败:', error)
    }
  }

  // 清除 localStorage
  private clearStorage(): void {
    try {
      if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
        return
      }
      
      localStorage.removeItem(AUTH_STORAGE_KEY)
      localStorage.removeItem(AUTH_TIMESTAMP_KEY)
      localStorage.removeItem(AUTH_TYPE_KEY)
    } catch (error) {
      console.error('清除认证状态失败:', error)
    }
  }

  // 通知所有监听器
  private notifyListeners(): void {
    this.listeners.forEach(listener => listener(this.currentUser))
  }

  // 简单的密码哈希函数（仅用于演示）
  private hashPassword(password: string): string {
    let hash = 0
    for (let i = 0; i < password.length; i++) {
      const char = password.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash
    }
    return hash.toString()
  }

  // 创建用户到 Firebase Authentication
  private async createFirebaseUser(email: string, password: string, displayName: string): Promise<FirebaseUser> {
    try {
      const userCredential = await firebaseCreateUser(auth, email, password)
      const user = userCredential.user
      
      // 更新用户资料
      await firebaseUpdateProfile(user, {
        displayName: displayName
      })
      
      return user
    } catch (error: any) {
      console.error('Firebase 用户创建失败:', error)
      throw new Error(`Firebase 用户创建失败: ${error.message}`)
    }
  }

  // 保存用户到 Firestore
  private async saveUserToFirestore(userData: EnhancedAuthUser, passwordHash?: string): Promise<void> {
    try {
      const userDoc = {
        ...userData,
        ...(passwordHash && { passwordHash })
      }
      
      await setDoc(doc(db, 'users', userData.uid), userDoc)
      console.log('用户已保存到 Firestore')
    } catch (error: any) {
      console.error('保存用户到 Firestore 失败:', error)
      throw new Error(`保存用户到 Firestore 失败: ${error.message}`)
    }
  }

  // 增强的注册功能
  async createUserWithEmailAndPassword(
    email: string, 
    password: string, 
    displayName: string, 
    role: UserRoles,
    useFirebaseAuth: boolean = true // 是否同时使用 Firebase Authentication
  ): Promise<AuthResult> {
    try {
      console.log('开始用户注册:', { email, displayName, role, useFirebaseAuth })
      
      // 检查用户是否已存在
      const usersRef = collection(db, 'users')
      const q = query(usersRef, where('email', '==', email))
      const querySnapshot = await getDocs(q)

      if (!querySnapshot.empty) {
        throw new Error('邮箱已被使用')
      }

      let firebaseUser: FirebaseUser | undefined
      let uid: string

      if (useFirebaseAuth) {
        // 创建 Firebase Authentication 用户
        firebaseUser = await this.createFirebaseUser(email, password, displayName)
        uid = firebaseUser.uid
        console.log('Firebase Authentication 用户创建成功')
      } else {
        // 使用自定义 UID
        uid = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      }

      // 创建用户对象
      const newUser: EnhancedAuthUser = {
        uid,
        email,
        displayName,
        role,
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString(),
        authType: useFirebaseAuth ? 'firebase' : 'custom'
      }

      // 保存到 Firestore（包含密码哈希）
      const passwordHash = this.hashPassword(password)
      await this.saveUserToFirestore(newUser, passwordHash)

      // 设置当前用户
      this.currentUser = newUser
      this.saveToStorage(newUser)
      this.notifyListeners()

      console.log('用户注册成功:', newUser)
      return { user: newUser, firebaseUser }
    } catch (error: any) {
      console.error('注册失败:', error)
      throw error
    }
  }

  // 增强的登录功能
  async signInWithEmailAndPassword(email: string, password: string): Promise<AuthResult> {
    try {
      console.log('开始用户登录:', { email })
      
      // 查询 Firestore 中的用户
      const usersRef = collection(db, 'users')
      const q = query(usersRef, where('email', '==', email))
      const querySnapshot = await getDocs(q)

      if (querySnapshot.empty) {
        throw new Error('用户不存在')
      }

      const userDoc = querySnapshot.docs[0]
      const userData = userDoc.data() as EnhancedAuthUser & { passwordHash?: string }

      // 验证密码
      const hashedPassword = this.hashPassword(password)
      if (userData.passwordHash && userData.passwordHash !== hashedPassword) {
        throw new Error('密码错误')
      }

      let firebaseUser: FirebaseUser | undefined

      // 如果用户使用 Firebase Authentication，尝试 Firebase 登录
      if (userData.authType === 'firebase') {
        try {
          const userCredential = await firebaseSignIn(auth, email, password)
          firebaseUser = userCredential.user
          console.log('Firebase Authentication 登录成功')
        } catch (firebaseError: any) {
          console.warn('Firebase Authentication 登录失败，使用自定义认证:', firebaseError.message)
          // 如果 Firebase 登录失败，继续使用自定义认证
        }
      }

      // 更新最后登录时间
      const updatedUser: EnhancedAuthUser = {
        ...userData,
        lastLogin: new Date().toISOString()
      }

      // 更新 Firestore
      await updateDoc(doc(db, 'users', userData.uid), {
        lastLogin: updatedUser.lastLogin
      })

      // 设置当前用户
      this.currentUser = updatedUser
      this.saveToStorage(updatedUser)
      this.notifyListeners()

      console.log('用户登录成功:', updatedUser)
      return { user: updatedUser, firebaseUser }
    } catch (error: any) {
      console.error('登录失败:', error)
      throw error
    }
  }

  // 登出
  async signOut(): Promise<void> {
    try {
      // 如果当前用户使用 Firebase Authentication，也登出 Firebase
      if (this.currentUser?.authType === 'firebase') {
        await firebaseSignOut(auth)
        console.log('Firebase Authentication 登出成功')
      }
      
      this.currentUser = null
      this.clearStorage()
      this.notifyListeners()
      console.log('用户登出成功')
    } catch (error: any) {
      console.error('登出失败:', error)
      // 即使 Firebase 登出失败，也要清除本地状态
      this.currentUser = null
      this.clearStorage()
      this.notifyListeners()
    }
  }

  // 获取当前用户
  getCurrentUser(): EnhancedAuthUser | null {
    return this.currentUser
  }

  // 监听认证状态变化
  onAuthStateChanged(callback: (user: EnhancedAuthUser | null) => void): () => void {
    this.listeners.push(callback)
    
    // 立即调用一次
    callback(this.currentUser)
    
    // 返回取消订阅函数
    return () => {
      const index = this.listeners.indexOf(callback)
      if (index > -1) {
        this.listeners.splice(index, 1)
      }
    }
  }

  // 检查是否已认证
  isAuthenticated(): boolean {
    return this.currentUser !== null
  }

  // 检查认证是否过期
  isExpired(): boolean {
    const timestamp = localStorage.getItem(AUTH_TIMESTAMP_KEY)
    if (!timestamp) return true
    
    const loginTime = parseInt(timestamp)
    const now = Date.now()
    return (now - loginTime) >= (AUTH_EXPIRY_HOURS * 60 * 60 * 1000)
  }

  // 刷新认证状态
  refreshAuth(): void {
    if (this.isExpired()) {
      this.signOut()
    } else {
      localStorage.setItem(AUTH_TIMESTAMP_KEY, Date.now().toString())
    }
  }

  // 更新用户资料
  async updateUserProfile(updates: Partial<Pick<EnhancedAuthUser, 'displayName' | 'role'>>): Promise<void> {
    if (!this.currentUser) {
      throw new Error('用户未登录')
    }

    try {
      const updatedUser: EnhancedAuthUser = {
        ...this.currentUser,
        ...updates
      }

      // 更新 Firestore
      await updateDoc(doc(db, 'users', this.currentUser.uid), updates)

      // 如果使用 Firebase Authentication，也更新 Firebase 用户资料
      if (this.currentUser.authType === 'firebase' && updates.displayName) {
        const firebaseUser = auth.currentUser
        if (firebaseUser) {
          await firebaseUpdateProfile(firebaseUser, {
            displayName: updates.displayName
          })
        }
      }

      // 更新当前用户
      this.currentUser = updatedUser
      this.saveToStorage(updatedUser)
      this.notifyListeners()

      console.log('用户资料更新成功')
    } catch (error: any) {
      console.error('更新用户资料失败:', error)
      throw error
    }
  }

  // 更改密码
  async changePassword(newPassword: string): Promise<void> {
    if (!this.currentUser) {
      throw new Error('用户未登录')
    }

    try {
      const newPasswordHash = this.hashPassword(newPassword)
      
      // 更新 Firestore 中的密码哈希
      await updateDoc(doc(db, 'users', this.currentUser.uid), {
        passwordHash: newPasswordHash
      })

      console.log('密码更改成功')
    } catch (error: any) {
      console.error('更改密码失败:', error)
      throw error
    }
  }

  // 获取用户统计信息
  async getUserStats(): Promise<{
    totalUsers: number
    firebaseUsers: number
    customUsers: number
    activeUsers: number
  }> {
    try {
      const usersRef = collection(db, 'users')
      const querySnapshot = await getDocs(usersRef)
      const users = querySnapshot.docs.map(doc => doc.data() as EnhancedAuthUser)

      const stats = {
        totalUsers: users.length,
        firebaseUsers: users.filter(u => u.authType === 'firebase').length,
        customUsers: users.filter(u => u.authType === 'custom').length,
        activeUsers: users.filter(u => {
          const lastLogin = new Date(u.lastLogin)
          const thirtyDaysAgo = new Date()
          thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
          return lastLogin > thirtyDaysAgo
        }).length
      }

      return stats
    } catch (error: any) {
      console.error('获取用户统计信息失败:', error)
      throw error
    }
  }
}

// 创建单例实例
export const enhancedAuth = new EnhancedAuth() 