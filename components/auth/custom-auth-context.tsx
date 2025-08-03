// components/auth/custom-auth-context.tsx
"use client"

import * as React from "react"
import { customAuth, CustomAuthUser } from "@/lib/custom-auth"
import { type UserProfile, UserRoles, RoleLevels } from "@/lib/data"

interface CustomAuthContextType {
  currentUser: UserProfile | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  signup: (email: string, password: string, displayName: string, role: UserProfile["role"]) => Promise<void>
  logout: () => Promise<void>
  isAuthenticated: boolean
  userRole: UserProfile["role"] | null
  userLevel: number | null
  hasPermission: (requiredLevel: number) => boolean
}

const CustomAuthContext = React.createContext<CustomAuthContextType | undefined>(undefined)

export function CustomAuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = React.useState<UserProfile | null>(null)
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    // 监听自定义认证状态变化
    const unsubscribe = customAuth.onAuthStateChanged((user: CustomAuthUser | null) => {
      if (user) {
        // 转换为 UserProfile 格式
        const profile: UserProfile = {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          role: user.role,
          createdAt: user.createdAt,
          lastLogin: user.lastLogin,
        }
        setCurrentUser(profile)
      } else {
        setCurrentUser(null)
      }
      setLoading(false)
    })

    return unsubscribe
  }, [])

  const login = async (email: string, password: string) => {
    try {
      await customAuth.signInWithEmailAndPassword(email, password)
    } catch (error: any) {
      console.error('登录失败:', error)
      throw new Error(error.message || '登录失败')
    }
  }

  const signup = async (email: string, password: string, displayName: string, role: UserProfile["role"]) => {
    try {
      await customAuth.createUserWithEmailAndPassword(email, password, displayName, role)
    } catch (error: any) {
      console.error('注册失败:', error)
      throw new Error(error.message || '注册失败')
    }
  }

  const logout = async () => {
    try {
      await customAuth.signOut()
    } catch (error: any) {
      console.error('登出失败:', error)
      throw new Error(error.message || '登出失败')
    }
  }

  const isAuthenticated = !!currentUser
  const userRole = currentUser?.role || null
  const userLevel = userRole ? RoleLevels[userRole] : null

  const hasPermission = (requiredLevel: number) => {
    if (!userLevel) return false
    return userLevel <= requiredLevel
  }

  const value = {
    currentUser,
    loading,
    login,
    signup,
    logout,
    isAuthenticated,
    userRole,
    userLevel,
    hasPermission,
  }

  return <CustomAuthContext.Provider value={value}>{children}</CustomAuthContext.Provider>
}

export function useCustomAuth() {
  const context = React.useContext(CustomAuthContext)
  if (context === undefined) {
    throw new Error("useCustomAuth must be used within a CustomAuthProvider")
  }
  return context
} 