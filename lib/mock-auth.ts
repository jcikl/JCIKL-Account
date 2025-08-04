// lib/mock-auth.ts
// 模拟认证服务，用于开发和测试

import { UserProfile, UserRoles } from './data'

// localStorage 键名
const MOCK_AUTH_STORAGE_KEY = 'mock_auth_user'
const MOCK_AUTH_TIMESTAMP_KEY = 'mock_auth_timestamp'

// 认证过期时间（24小时）
const AUTH_EXPIRY_HOURS = 24

// 模拟用户数据
const mockUsers: UserProfile[] = [
  {
    uid: 'mock-admin-1',
    email: 'admin@jcikl.com',
    displayName: '系统管理员',
    role: UserRoles.TREASURER,
    createdAt: '2024-01-01T00:00:00.000Z',
    lastLogin: new Date().toISOString(),
  },
  {
    uid: 'mock-user-1',
    email: 'user@jcikl.com',
    displayName: '测试用户',
    role: UserRoles.ASSISTANT_VICE_PRESIDENT,
    createdAt: '2024-01-01T00:00:00.000Z',
    lastLogin: new Date().toISOString(),
  },
  {
    uid: 'mock-manager-1',
    email: 'manager@jcikl.com',
    displayName: '项目经理',
    role: UserRoles.VICE_PRESIDENT,
    createdAt: '2024-01-01T00:00:00.000Z',
    lastLogin: new Date().toISOString(),
  },
]

// 模拟认证状态
let currentUser: UserProfile | null = null
let authListeners: ((user: UserProfile | null) => void)[] = []

// 从 localStorage 恢复用户状态
function restoreFromStorage(): void {
  try {
    // 检查是否在浏览器环境中
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
      return
    }
    
    const storedUser = localStorage.getItem(MOCK_AUTH_STORAGE_KEY)
    const timestamp = localStorage.getItem(MOCK_AUTH_TIMESTAMP_KEY)
    
    if (storedUser && timestamp) {
      const user = JSON.parse(storedUser) as UserProfile
      const loginTime = parseInt(timestamp)
      const now = Date.now()
      
      // 检查是否过期
      if (now - loginTime < AUTH_EXPIRY_HOURS * 60 * 60 * 1000) {
        currentUser = user
        // 通知监听器
        authListeners.forEach(listener => listener(user))
      } else {
        // 清除过期的认证信息
        clearStorage()
      }
    }
  } catch (error) {
    console.error('恢复模拟认证状态失败:', error)
    clearStorage()
  }
}

// 保存到 localStorage
function saveToStorage(user: UserProfile): void {
  try {
    // 检查是否在浏览器环境中
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
      return
    }
    
    localStorage.setItem(MOCK_AUTH_STORAGE_KEY, JSON.stringify(user))
    localStorage.setItem(MOCK_AUTH_TIMESTAMP_KEY, Date.now().toString())
  } catch (error) {
    console.error('保存模拟认证状态失败:', error)
  }
}

// 清除 localStorage
function clearStorage(): void {
  try {
    // 检查是否在浏览器环境中
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
      return
    }
    
    localStorage.removeItem(MOCK_AUTH_STORAGE_KEY)
    localStorage.removeItem(MOCK_AUTH_TIMESTAMP_KEY)
  } catch (error) {
    console.error('清除模拟认证状态失败:', error)
  }
}

// 初始化时恢复状态
restoreFromStorage()

export const mockAuth = {
  // 模拟登录
  signInWithEmailAndPassword: async (email: string, password: string): Promise<{ user: UserProfile }> => {
    const user = mockUsers.find(u => u.email === email)
    
    if (!user) {
      throw new Error('User not found')
    }
    
    // 模拟密码验证（简单匹配）
    const expectedPassword = email.split('@')[0] + '123'
    if (password !== expectedPassword) {
      throw new Error('Wrong password')
    }
    
    // 更新最后登录时间
    user.lastLogin = new Date().toISOString()
    currentUser = user
    
    // 保存到 localStorage
    saveToStorage(user)
    
    // 通知监听器
    authListeners.forEach(listener => listener(user))
    
    return { user }
  },
  
  // 模拟注册
  createUserWithEmailAndPassword: async (email: string, password: string): Promise<{ user: UserProfile }> => {
    // 检查用户是否已存在
    if (mockUsers.find(u => u.email === email)) {
      throw new Error('Email already in use')
    }
    
    // 创建新用户
    const newUser: UserProfile = {
      uid: `mock-user-${Date.now()}`,
      email,
      displayName: email.split('@')[0],
      role: UserRoles.ASSISTANT_VICE_PRESIDENT,
      createdAt: new Date().toISOString(),
      lastLogin: new Date().toISOString(),
    }
    
    mockUsers.push(newUser)
    currentUser = newUser
    
    // 保存到 localStorage
    saveToStorage(newUser)
    
    // 通知监听器
    authListeners.forEach(listener => listener(newUser))
    
    return { user: newUser }
  },
  
  // 模拟登出
  signOut: async (): Promise<void> => {
    currentUser = null
    clearStorage()
    authListeners.forEach(listener => listener(null))
  },
  
  // 模拟认证状态监听
  onAuthStateChanged: (callback: (user: UserProfile | null) => void) => {
    authListeners.push(callback)
    
    // 立即调用一次
    callback(currentUser)
    
    // 返回取消订阅函数
    return () => {
      const index = authListeners.indexOf(callback)
      if (index > -1) {
        authListeners.splice(index, 1)
      }
    }
  },
  
  // 获取当前用户
  getCurrentUser: (): UserProfile | null => {
    return currentUser
  },
  
  // 检查是否已认证
  isAuthenticated: (): boolean => {
    return currentUser !== null
  },
  
  // 检查认证是否过期
  isExpired: (): boolean => {
    try {
      if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
        return true
      }
      
      const timestamp = localStorage.getItem(MOCK_AUTH_TIMESTAMP_KEY)
      if (!timestamp) return true
      
      const loginTime = parseInt(timestamp)
      const now = Date.now()
      return now - loginTime >= AUTH_EXPIRY_HOURS * 60 * 60 * 1000
    } catch (error) {
      return true
    }
  },
  
  // 刷新认证状态
  refreshAuth: (): void => {
    if (this.isExpired()) {
      this.signOut()
    } else {
      // 更新登录时间戳
      if (currentUser) {
        saveToStorage(currentUser)
      }
    }
  }
}

// 测试凭据
export const MOCK_CREDENTIALS = {
  admin: { email: 'admin@jcikl.com', password: 'admin123' },
  user: { email: 'user@jcikl.com', password: 'user123' },
  manager: { email: 'manager@jcikl.com', password: 'manager123' },
} 