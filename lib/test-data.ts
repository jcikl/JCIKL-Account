// lib/test-data.ts
export const TEST_USERS = {
  admin: {
    email: "admin@jcikl.com",
    password: "admin123",
    displayName: "系统管理员",
    role: "TREASURER" as const,
  },
  user: {
    email: "user@jcikl.com", 
    password: "user123",
    displayName: "测试用户",
    role: "ASSISTANT_VICE_PRESIDENT" as const,
  },
  manager: {
    email: "manager@jcikl.com",
    password: "manager123", 
    displayName: "项目经理",
    role: "VICE_PRESIDENT" as const,
  }
}

export const TEST_CREDENTIALS = {
  valid: {
    email: "test@example.com",
    password: "password123"
  },
  invalid: {
    email: "invalid@example.com", 
    password: "wrongpassword"
  }
} 