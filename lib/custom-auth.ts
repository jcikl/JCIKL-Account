// lib/custom-auth.ts
// 自定义简单认证系统
// 基于邮箱和密码直接查询 Firestore，使用 localStorage 保存登录状态

import { db } from './firebase'
import { collection, query, where, getDocs, doc, setDoc, updateDoc } from 'firebase/firestore'
import { UserProfile, UserRoles } from './data'

// localStorage 键名
const AUTH_STORAGE_KEY = 'jcikl_auth_user'
const AUTH_TIMESTAMP_KEY = 'jcikl_auth_timestamp'

// 认证过期时间（24小时）
const AUTH_EXPIRY_HOURS = 24

export interface CustomAuthUser {
  uid: string
  email: string
  displayName: string
  role: UserRoles
  createdAt: string
  lastLogin: string
}

class CustomAuth {
  private currentUser: CustomAuthUser | null = null
  private listeners: ((user: CustomAuthUser | null) => void)[] = []

  constructor() {
    // 初始化时从 localStorage 恢复用户状态
    this.restoreFromStorage()
  }

  // 从 localStorage 恢复用户状态
  private restoreFromStorage(): void {
    try {
      // 检查是否在浏览器环境中
      if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
        return
      }
      
      const storedUser = localStorage.getItem(AUTH_STORAGE_KEY)
      const timestamp = localStorage.getItem(AUTH_TIMESTAMP_KEY)
      
      if (storedUser && timestamp) {
        const user = JSON.parse(storedUser) as CustomAuthUser
        const loginTime = parseInt(timestamp)
        const now = Date.now()
        
        // 检查是否过期
        if (now - loginTime < AUTH_EXPIRY_HOURS * 60 * 60 * 1000) {
          this.currentUser = user
          this.notifyListeners()
        } else {
          // 清除过期的认证信息
          this.clearStorage()
        }
      }
    } catch (error) {
      console.error('恢复认证状态失败:', error)
      this.clearStorage()
    }
  }

  // 保存到 localStorage
  private saveToStorage(user: CustomAuthUser): void {
    try {
      // 检查是否在浏览器环境中
      if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
        return
      }
      
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user))
      localStorage.setItem(AUTH_TIMESTAMP_KEY, Date.now().toString())
    } catch (error) {
      console.error('保存认证状态失败:', error)
    }
  }

  // 清除 localStorage
  private clearStorage(): void {
    try {
      // 检查是否在浏览器环境中
      if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
        return
      }
      
      localStorage.removeItem(AUTH_STORAGE_KEY)
      localStorage.removeItem(AUTH_TIMESTAMP_KEY)
    } catch (error) {
      console.error('清除认证状态失败:', error)
    }
  }

  // 通知所有监听器
  private notifyListeners(): void {
    this.listeners.forEach(listener => listener(this.currentUser))
  }

  // 简单的密码哈希函数（仅用于演示，生产环境应使用更安全的方法）
  private hashPassword(password: string): string {
    // 简单的哈希实现，实际项目中应使用 bcrypt 等
    let hash = 0
    for (let i = 0; i < password.length; i++) {
      const char = password.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // 转换为32位整数
    }
    return hash.toString()
  }

  // 登录
  async signInWithEmailAndPassword(email: string, password: string): Promise<CustomAuthUser> {
    try {
      // 查询 Firestore 中的用户
      const usersRef = collection(db, 'users')
      const q = query(usersRef, where('email', '==', email))
      const querySnapshot = await getDocs(q)

      if (querySnapshot.empty) {
        throw new Error('用户不存在')
      }

      const userDoc = querySnapshot.docs[0]
      const userData = userDoc.data() as CustomAuthUser

      // 验证密码（这里假设密码哈希存储在 passwordHash 字段）
      const hashedPassword = this.hashPassword(password)
      if (userData.passwordHash !== hashedPassword) {
        throw new Error('密码错误')
      }

      // 更新最后登录时间
      const updatedUser: CustomAuthUser = {
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

      return updatedUser
    } catch (error) {
      console.error('登录失败:', error)
      throw error
    }
  }

  // 注册
  async createUserWithEmailAndPassword(
    email: string, 
    password: string, 
    displayName: string, 
    role: UserRoles
  ): Promise<CustomAuthUser> {
    try {
      // 检查用户是否已存在
      const usersRef = collection(db, 'users')
      const q = query(usersRef, where('email', '==', email))
      const querySnapshot = await getDocs(q)

      if (!querySnapshot.empty) {
        throw new Error('邮箱已被使用')
      }

      // 创建新用户
      const newUser: CustomAuthUser = {
        uid: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        email,
        displayName,
        role,
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString(),
      }

      // 保存到 Firestore（包含密码哈希）
      const userWithPassword = {
        ...newUser,
        passwordHash: this.hashPassword(password)
      }

      await setDoc(doc(db, 'users', newUser.uid), userWithPassword)

      // 设置当前用户（不包含密码哈希）
      this.currentUser = newUser
      this.saveToStorage(newUser)
      this.notifyListeners()

      return newUser
    } catch (error) {
      console.error('注册失败:', error)
      throw error
    }
  }

  // 登出
  async signOut(): Promise<void> {
    this.currentUser = null
    this.clearStorage()
    this.notifyListeners()
  }

  // 获取当前用户
  getCurrentUser(): CustomAuthUser | null {
    return this.currentUser
  }

  // 监听认证状态变化
  onAuthStateChanged(callback: (user: CustomAuthUser | null) => void): () => void {
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
      // 更新登录时间戳
      localStorage.setItem(AUTH_TIMESTAMP_KEY, Date.now().toString())
    }
  }
}

// 创建单例实例
export const customAuth = new CustomAuth() 