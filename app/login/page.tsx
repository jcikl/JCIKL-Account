// app/login/page.tsx
"use client"

import { AuthForm } from "@/components/auth/auth-form"
import { QuickLogin } from "@/components/auth/quick-login"

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-950">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-md mx-auto">
          <AuthForm />
          
          {/* 开发模式快速登录 */}
          <div className="mt-8">
            <QuickLogin />
          </div>
        </div>
      </div>
    </div>
  )
} 