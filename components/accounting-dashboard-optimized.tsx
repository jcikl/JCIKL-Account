"use client"

import * as React from "react"
import {
  BarChart3,
  Calculator,
  CreditCard,
  FileText,
  FolderOpen,
  Home,
  Scale,
  Settings,
  TrendingUp,
} from "lucide-react"
import { SidebarProvider } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { AppHeader } from "@/components/app-header"
import { useAuth } from "@/components/auth/auth-context"
import { UserRoles, RoleLevels } from "@/lib/data"

// 核心模块 - 预加载（用户最常用的模块）
import { DashboardOverviewOptimized } from "@/components/modules/dashboard-overview-optimized"
import { BankTransactions } from "@/components/modules/bank-transactions"
import { ProjectAccountsOptimized } from "@/components/modules/project-accounts-optimized"

// 次要模块 - 懒加载（不常用的模块）
const JournalEntries = React.lazy(() => import("@/components/modules/journal-entries").then(module => ({ default: module.JournalEntries })))
const TrialBalance = React.lazy(() => import("@/components/modules/trial-balance").then(module => ({ default: module.TrialBalance })))
const ProfitLoss = React.lazy(() => import("@/components/modules/profit-loss").then(module => ({ default: module.ProfitLoss })))
const BalanceSheet = React.lazy(() => import("@/components/modules/balance-sheet").then(module => ({ default: module.BalanceSheet })))
const GeneralLedger = React.lazy(() => import("@/components/modules/general-ledger").then(module => ({ default: module.GeneralLedger })))
const AccountSettingsOptimized = React.lazy(() => import("@/components/modules/account-settings-optimized").then(module => ({ default: module.AccountSettings })))

// 骨架屏组件
const SkeletonLoader = () => (
  <div className="p-6 space-y-4">
    <div className="animate-pulse">
      <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
      <div className="space-y-3">
        <div className="h-4 bg-gray-200 rounded"></div>
        <div className="h-4 bg-gray-200 rounded w-5/6"></div>
        <div className="h-4 bg-gray-200 rounded w-4/6"></div>
      </div>
    </div>
  </div>
)

// 智能预加载策略
const getPreloadedModules = (userRole: string) => {
  switch(userRole) {
    case 'vice_president':
      return ['Dashboard', 'Bank Transactions', 'Project Accounts', 'Journal Entries', 'Trial Balance']
    case 'assistant_vice_president':
      return ['Dashboard', 'Bank Transactions', 'Project Accounts']
    case 'president':
      return ['Dashboard', 'Bank Transactions', 'Project Accounts', 'Profit & Loss', 'Balance Sheet']
    default:
      return ['Dashboard', 'Bank Transactions']
  }
}

// 导航数据配置
const navigationData = {
  main: [
    {
      title: "Dashboard",
      url: "#",
      icon: Home,
      requiredLevel: RoleLevels[UserRoles.ASSISTANT_VICE_PRESIDENT],
      isCore: true, // 标记为核心模块
    },
  ],
  transactions: [
    {
      title: "Bank Transactions",
      url: "#",
      icon: CreditCard,
      requiredLevel: RoleLevels[UserRoles.ASSISTANT_VICE_PRESIDENT],
      isCore: true,
    },
    {
      title: "Journal Entries",
      url: "#",
      icon: FileText,
      requiredLevel: RoleLevels[UserRoles.VICE_PRESIDENT],
      isCore: false,
    },
  ],
  accounts: [
    {
      title: "Project Accounts",
      url: "#",
      icon: FolderOpen,
      requiredLevel: RoleLevels[UserRoles.ASSISTANT_VICE_PRESIDENT],
      isCore: true,
    },
    {
      title: "General Ledger",
      url: "#",
      icon: Calculator,
      requiredLevel: RoleLevels[UserRoles.VICE_PRESIDENT],
      isCore: false,
    },
  ],
  reports: [
    {
      title: "Trial Balance",
      url: "#",
      icon: Scale,
      requiredLevel: RoleLevels[UserRoles.VICE_PRESIDENT],
      isCore: false,
    },
    {
      title: "Profit & Loss",
      url: "#",
      icon: TrendingUp,
      requiredLevel: RoleLevels[UserRoles.VICE_PRESIDENT],
      isCore: false,
    },
    {
      title: "Balance Sheet",
      url: "#",
      icon: BarChart3,
      requiredLevel: RoleLevels[UserRoles.VICE_PRESIDENT],
      isCore: false,
    },
  ],
  settings: [
    {
      title: "Account Settings",
      url: "#",
      icon: Settings,
      requiredLevel: RoleLevels[UserRoles.VICE_PRESIDENT],
      isCore: false,
    },
  ],
}

// 优化的模块渲染组件
const OptimizedModuleRenderer = React.memo(({ 
  moduleName, 
  hasPermission, 
  requiredLevel 
}: { 
  moduleName: string
  hasPermission: (level: number) => boolean
  requiredLevel: number
}) => {
  const [error, setError] = React.useState<string | null>(null)

  // 检查权限
  if (!hasPermission(requiredLevel)) {
    return <div className="p-6 text-center text-muted-foreground">您没有权限访问此页面。</div>
  }

  // 错误处理
  if (error) {
    return (
      <div className="p-6 text-center text-red-600">
        <p>加载模块时出错: {error}</p>
        <button 
          onClick={() => window.location.reload()} 
          className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          重试
        </button>
      </div>
    )
  }

  // 判断是核心模块还是懒加载模块
  const isCoreModule = ["Dashboard", "Bank Transactions", "Project Accounts"].includes(moduleName)

  // 渲染核心模块（预加载）
  if (isCoreModule) {
    switch (moduleName) {
      case "Dashboard":
        return <DashboardOverviewOptimized />
      case "Bank Transactions":
        return <BankTransactions />
      case "Project Accounts":
        return <ProjectAccountsOptimized />
      default:
        return <div className="p-6 text-center text-muted-foreground">模块未找到。</div>
    }
  }

  // 渲染懒加载模块
  let LazyComponent: React.ComponentType | null = null
  
  switch (moduleName) {
    case "Journal Entries":
      LazyComponent = JournalEntries
      break
    case "Trial Balance":
      LazyComponent = TrialBalance
      break
    case "Profit & Loss":
      LazyComponent = ProfitLoss
      break
    case "Balance Sheet":
      LazyComponent = BalanceSheet
      break
    case "General Ledger":
      LazyComponent = GeneralLedger
      break
    case "Account Settings":
      LazyComponent = AccountSettingsOptimized
      break
    default:
      return <div className="p-6 text-center text-muted-foreground">模块未找到。</div>
  }

  if (!LazyComponent) {
    return <div className="p-6 text-center text-muted-foreground">模块未找到。</div>
  }

  return (
    <React.Suspense fallback={<SkeletonLoader />}>
      <ErrorBoundary onError={(error) => setError(error.message)}>
        <LazyComponent />
      </ErrorBoundary>
    </React.Suspense>
  )
})

// 错误边界组件
class ErrorBoundary extends React.Component<
  { children: React.ReactNode; onError: (error: Error) => void },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode; onError: (error: Error) => void }) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error: Error) {
    this.props.onError(error)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-6 text-center text-red-600">
          <p>模块加载失败</p>
        </div>
      )
    }

    return this.props.children
  }
}

// 主仪表板组件
export function AccountingDashboardOptimized() {
  const { currentUser, logout, hasPermission } = useAuth()
  const [currentPage, setCurrentPage] = React.useState("Dashboard")
  const [preloadedModules, setPreloadedModules] = React.useState<string[]>([])

  // 根据用户角色确定预加载模块
  React.useEffect(() => {
    if (currentUser?.role) {
      const modules = getPreloadedModules(currentUser.role)
      setPreloadedModules(modules)
    }
  }, [currentUser?.role])

  // 获取当前页面所需的权限级别
  const getCurrentPageRequiredLevel = () => {
    const allNavItems = [
      ...navigationData.main,
      ...navigationData.transactions,
      ...navigationData.accounts,
      ...navigationData.reports,
      ...navigationData.settings
    ]
    
    const currentNavItem = allNavItems.find(item => item.title === currentPage)
    return currentNavItem?.requiredLevel || RoleLevels[UserRoles.ASSISTANT_VICE_PRESIDENT]
  }

  // 预加载核心模块数据
  React.useEffect(() => {
    if (preloadedModules.includes(currentPage)) {
      // 这里可以添加预加载逻辑，比如预取数据
      console.log(`预加载模块: ${currentPage}`)
    }
  }, [currentPage, preloadedModules])

  return (
    <SidebarProvider>
      <AppSidebar
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        navigationData={navigationData}
        hasPermission={hasPermission}
      />
      <div className="flex-1 flex flex-col">
        <AppHeader currentUser={currentUser} logout={logout} currentPage={currentPage} />
        <main className="flex-1 overflow-auto">
          <OptimizedModuleRenderer
            moduleName={currentPage}
            hasPermission={hasPermission}
            requiredLevel={getCurrentPageRequiredLevel()}
          />
        </main>
      </div>
    </SidebarProvider>
  )
} 