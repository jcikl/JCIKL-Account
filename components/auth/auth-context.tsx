// components/auth/auth-context.tsx
"use client"

import * as React from "react"
import { onAuthStateChanged, signOut, signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth"
import { auth, db } from "@/lib/firebase"
import { doc, setDoc } from "firebase/firestore"
import { type UserProfile, UserRoles, RoleLevels } from "@/lib/data"
import { getUserByUid } from "@/lib/firebase-utils"
import { mockAuth } from "@/lib/mock-auth"

// 检查是否使用模拟认证
const USE_MOCK_AUTH = process.env.NEXT_PUBLIC_USE_MOCK_AUTH === 'true' || false

interface AuthContextType {
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

const AuthContext = React.createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = React.useState<UserProfile | null>(null)
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    if (USE_MOCK_AUTH) {
      // 使用模拟认证
      const unsubscribe = mockAuth.onAuthStateChanged((user) => {
        setCurrentUser(user)
        setLoading(false)
      })
      return unsubscribe
    } else {
      // 使用真实Firebase认证
      const unsubscribe = onAuthStateChanged(auth, async (user) => {
        if (user) {
          const profile = await getUserByUid(user.uid)
          if (profile) {
            setCurrentUser(profile)
          } else {
            // If user exists in Auth but not in Firestore, something is wrong or it's a new signup
            // For new signups, the signup function should handle adding to Firestore
            setCurrentUser({
              uid: user.uid,
              email: user.email || "",
              displayName: user.displayName || "New User",
              role: UserRoles.ASSISTANT_VICE_PRESIDENT, // Default role for unassigned users
              createdAt: new Date().toISOString(),
              lastLogin: new Date().toISOString(),
            })
          }
        } else {
          setCurrentUser(null)
        }
        setLoading(false)
      })

      return unsubscribe
    }
  }, [])

  const login = async (email: string, password: string) => {
    if (USE_MOCK_AUTH) {
      const result = await mockAuth.signInWithEmailAndPassword(email, password)
      setCurrentUser(result.user)
    } else {
      await signInWithEmailAndPassword(auth, email, password)
    }
  }

  const signup = async (email: string, password: string, displayName: string, role: UserProfile["role"]) => {
    if (USE_MOCK_AUTH) {
      const result = await mockAuth.createUserWithEmailAndPassword(email, password)
      const newUserProfile: UserProfile = {
        ...result.user,
        displayName,
        role,
      }
      setCurrentUser(newUserProfile)
    } else {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password)
      const user = userCredential.user
      const newUserProfile: UserProfile = {
        uid: user.uid,
        email: email,
        displayName: displayName,
        role: role,
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString(),
      }
      await setDoc(doc(db, "users", user.uid), newUserProfile) // Use UID as document ID
      setCurrentUser(newUserProfile)
    }
  }

  const logout = async () => {
    if (USE_MOCK_AUTH) {
      await mockAuth.signOut()
      setCurrentUser(null)
    } else {
      await signOut(auth)
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

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = React.useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
