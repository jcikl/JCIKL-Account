// components/auth/enhanced-auth-context.tsx
"use client"

import React from "react"
import { enhancedAuth, EnhancedAuthUser, AuthResult } from "@/lib/enhanced-auth"
import { UserRoles } from "@/lib/data"

interface EnhancedAuthContextType {
  currentUser: EnhancedAuthUser | null
  loading: boolean
  login: (email: string, password: string) => Promise<AuthResult>
  signup: (email: string, password: string, displayName: string, role: UserRoles, useFirebaseAuth?: boolean) => Promise<AuthResult>
  logout: () => Promise<void>
  isAuthenticated: boolean
  userRole: UserRoles | null
  userLevel: number | null
  hasPermission: (requiredLevel: number) => boolean
  updateUserProfile: (updates: Partial<Pick<EnhancedAuthUser, 'displayName' | 'role'>>) => Promise<void>
  changePassword: (newPassword: string) => Promise<void>
  getUserStats: () => Promise<{
    totalUsers: number
    firebaseUsers: number
    customUsers: number
    activeUsers: number
  }>
}

const RoleLevels: Record<UserRoles, number> = {
  [UserRoles.TREASURER]: 5,
  [UserRoles.PRESIDENT]: 4,
  [UserRoles.SECRETARY]: 3,
  [UserRoles.VICE_PRESIDENT]: 2,
  [UserRoles.ASSISTANT_VICE_PRESIDENT]: 1,
  [UserRoles.PROJECT_CHAIRMAN]: 1,
}

const EnhancedAuthContext = React.createContext<EnhancedAuthContextType | undefined>(undefined)

export function EnhancedAuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = React.useState<EnhancedAuthUser | null>(null)
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    // 监听增强认证状态变化
    const unsubscribe = enhancedAuth.onAuthStateChanged((user: EnhancedAuthUser | null) => {
      setCurrentUser(user)
      setLoading(false)
    })

    return unsubscribe
  }, [])

  const login = async (email: string, password: string): Promise<AuthResult> => {
    try {
      setLoading(true)
      const result = await enhancedAuth.signInWithEmailAndPassword(email, password)
      return result
    } catch (error: any) {
      console.error('登录失败:', error)
      throw new Error(error.message || '登录失败')
    } finally {
      setLoading(false)
    }
  }

  const signup = async (
    email: string, 
    password: string, 
    displayName: string, 
    role: UserRoles,
    useFirebaseAuth: boolean = true
  ): Promise<AuthResult> => {
    try {
      setLoading(true)
      const result = await enhancedAuth.createUserWithEmailAndPassword(
        email, 
        password, 
        displayName, 
        role,
        useFirebaseAuth
      )
      return result
    } catch (error: any) {
      console.error('注册失败:', error)
      throw new Error(error.message || '注册失败')
    } finally {
      setLoading(false)
    }
  }

  const logout = async (): Promise<void> => {
    try {
      setLoading(true)
      await enhancedAuth.signOut()
    } catch (error: any) {
      console.error('登出失败:', error)
      throw new Error(error.message || '登出失败')
    } finally {
      setLoading(false)
    }
  }

  const updateUserProfile = async (updates: Partial<Pick<EnhancedAuthUser, 'displayName' | 'role'>>): Promise<void> => {
    try {
      await enhancedAuth.updateUserProfile(updates)
    } catch (error: any) {
      console.error('更新用户资料失败:', error)
      throw new Error(error.message || '更新用户资料失败')
    }
  }

  const changePassword = async (newPassword: string): Promise<void> => {
    try {
      await enhancedAuth.changePassword(newPassword)
    } catch (error: any) {
      console.error('更改密码失败:', error)
      throw new Error(error.message || '更改密码失败')
    }
  }

  const getUserStats = async () => {
    try {
      return await enhancedAuth.getUserStats()
    } catch (error: any) {
      console.error('获取用户统计信息失败:', error)
      throw new Error(error.message || '获取用户统计信息失败')
    }
  }

  const isAuthenticated = !!currentUser
  const userRole = currentUser?.role || null
  const userLevel = userRole ? RoleLevels[userRole] : null

  const hasPermission = (requiredLevel: number) =>
    userLevel !== null && userLevel >= requiredLevel

  const value: EnhancedAuthContextType = {
    currentUser,
    loading,
    login,
    signup,
    logout,
    isAuthenticated,
    userRole,
    userLevel,
    hasPermission,
    updateUserProfile,
    changePassword,
    getUserStats,
  }

  return (
    <EnhancedAuthContext.Provider value={value}>
      {children}
    </EnhancedAuthContext.Provider>
  )
}

export function useEnhancedAuth(): EnhancedAuthContextType {
  const context = React.useContext(EnhancedAuthContext)
  if (context === undefined) {
    throw new Error("useEnhancedAuth must be used within an EnhancedAuthProvider")
  }
  return context
} 