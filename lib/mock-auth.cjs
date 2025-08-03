// lib/mock-auth.cjs
// 模拟认证服务，用于开发和测试

// 模拟用户数据
const mockUsers = [
  {
    uid: 'mock-admin-1',
    email: 'admin@jcikl.com',
    displayName: '系统管理员',
    role: 'TREASURER',
    createdAt: '2024-01-01T00:00:00.000Z',
    lastLogin: new Date().toISOString(),
  },
  {
    uid: 'mock-user-1',
    email: 'user@jcikl.com',
    displayName: '测试用户',
    role: 'ASSISTANT_VICE_PRESIDENT',
    createdAt: '2024-01-01T00:00:00.000Z',
    lastLogin: new Date().toISOString(),
  },
  {
    uid: 'mock-manager-1',
    email: 'manager@jcikl.com',
    displayName: '项目经理',
    role: 'VICE_PRESIDENT',
    createdAt: '2024-01-01T00:00:00.000Z',
    lastLogin: new Date().toISOString(),
  },
]

// 模拟认证状态
let currentUser = null
let authListeners = []

const mockAuth = {
  // 模拟登录
  signInWithEmailAndPassword: async (email, password) => {
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
    
    // 通知监听器
    authListeners.forEach(listener => listener(user))
    
    return { user }
  },
  
  // 模拟注册
  createUserWithEmailAndPassword: async (email, password) => {
    // 检查用户是否已存在
    if (mockUsers.find(u => u.email === email)) {
      throw new Error('Email already in use')
    }
    
    // 创建新用户
    const newUser = {
      uid: `mock-user-${Date.now()}`,
      email,
      displayName: email.split('@')[0],
      role: 'ASSISTANT_VICE_PRESIDENT',
      createdAt: new Date().toISOString(),
      lastLogin: new Date().toISOString(),
    }
    
    mockUsers.push(newUser)
    currentUser = newUser
    
    // 通知监听器
    authListeners.forEach(listener => listener(newUser))
    
    return { user: newUser }
  },
  
  // 模拟登出
  signOut: async () => {
    currentUser = null
    authListeners.forEach(listener => listener(null))
  },
  
  // 模拟认证状态监听
  onAuthStateChanged: (callback) => {
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
  getCurrentUser: () => {
    return currentUser
  },
  
  // 重置模拟状态
  reset: () => {
    currentUser = null
    authListeners = []
  }
}

// 测试凭据
const MOCK_CREDENTIALS = {
  admin: { email: 'admin@jcikl.com', password: 'admin123' },
  user: { email: 'user@jcikl.com', password: 'user123' },
  manager: { email: 'manager@jcikl.com', password: 'manager123' },
}

module.exports = { mockAuth, MOCK_CREDENTIALS } 