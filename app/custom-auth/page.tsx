// app/custom-auth/page.tsx
"use client"

import { CustomAuthProvider } from "@/components/auth/custom-auth-context"
import { CustomAuthForm } from "@/components/auth/custom-auth-form"

export default function CustomAuthPage() {
  return (
    <CustomAuthProvider>
      <CustomAuthForm />
    </CustomAuthProvider>
  )
} 