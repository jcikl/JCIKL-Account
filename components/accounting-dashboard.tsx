"use client"

import * as React from "react"
import {
  BarChart3,
  Building2,
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
import { DashboardOverview } from "@/components/modules/dashboard-overview"
import { BankTransactions } from "@/components/modules/bank-transactions"
import { ProjectAccounts } from "@/components/modules/project-accounts"
import { JournalEntries } from "@/components/modules/journal-entries"
import { TrialBalance } from "@/components/modules/trial-balance"
import { ProfitLoss } from "@/components/modules/profit-loss"
import { BalanceSheet } from "@/components/modules/balance-sheet"
import { GeneralLedger } from "@/components/modules/general-ledger"
import { AccountSettings } from "@/components/modules/account-settings"
import { BankAccountManagement } from "@/components/modules/bank-account-management"
import { BankTransactionsMultiAccountAdvanced } from "@/components/modules/bank-transactions-multi-account-advanced"
import { useAuth } from "@/components/auth/auth-context"
import { UserRoles, RoleLevels } from "@/lib/data"

// Navigation data (moved here for clarity, will be used by AppSidebar)
const navigationData = {
  main: [
    {
      title: "Dashboard",
      url: "#",
      icon: Home,
      requiredLevel: RoleLevels[UserRoles.ASSISTANT_VICE_PRESIDENT], // Level 3
    },
  ],
  transactions: [
    {
      title: "Bank Transactions",
      url: "#",
      icon: CreditCard,
      requiredLevel: RoleLevels[UserRoles.ASSISTANT_VICE_PRESIDENT], // Level 3
    },
    {
      title: "Journal Entries",
      url: "#",
      icon: FileText,
      requiredLevel: RoleLevels[UserRoles.VICE_PRESIDENT], // Level 2
    },
  ],
  accounts: [
    {
      title: "Bank Account Management",
      url: "#",
      icon: Building2,
      requiredLevel: RoleLevels[UserRoles.ASSISTANT_VICE_PRESIDENT], // Level 3
    },
    {
      title: "Project Accounts",
      url: "#",
      icon: FolderOpen,
      requiredLevel: RoleLevels[UserRoles.ASSISTANT_VICE_PRESIDENT], // Level 3
    },
    {
      title: "General Ledger",
      url: "#",
      icon: Calculator,
      requiredLevel: RoleLevels[UserRoles.VICE_PRESIDENT], // Level 2
    },
  ],
  reports: [
    {
      title: "Trial Balance",
      url: "#",
      icon: Scale,
      requiredLevel: RoleLevels[UserRoles.VICE_PRESIDENT], // Level 2
    },
    {
      title: "Profit & Loss",
      url: "#",
      icon: TrendingUp,
      requiredLevel: RoleLevels[UserRoles.VICE_PRESIDENT], // Level 2
    },
    {
      title: "Balance Sheet",
      url: "#",
      icon: BarChart3,
      requiredLevel: RoleLevels[UserRoles.VICE_PRESIDENT], // Level 2
    },
  ],
  settings: [
    {
      title: "Account Settings",
      url: "#",
      icon: Settings,
      requiredLevel: RoleLevels[UserRoles.VICE_PRESIDENT], // Level 2
    },
  ],
}

export function AccountingDashboard() {
  const { currentUser, logout, hasPermission } = useAuth()
  const [currentPage, setCurrentPage] = React.useState("Dashboard")

  const renderCurrentPage = () => {
    switch (currentPage) {
      case "Dashboard":
        return <DashboardOverview />
      case "Bank Transactions":
        return hasPermission(RoleLevels[UserRoles.ASSISTANT_VICE_PRESIDENT]) ? <BankTransactionsMultiAccountAdvanced /> : <NoPermissionPage />
      case "Bank Account Management":
        return hasPermission(RoleLevels[UserRoles.ASSISTANT_VICE_PRESIDENT]) ? <BankAccountManagement /> : <NoPermissionPage />
      case "Project Accounts":
        return <ProjectAccounts />
      case "Journal Entries":
        return hasPermission(RoleLevels[UserRoles.VICE_PRESIDENT]) ? <JournalEntries /> : <NoPermissionPage />
      case "Trial Balance":
        return hasPermission(RoleLevels[UserRoles.VICE_PRESIDENT]) ? <TrialBalance /> : <NoPermissionPage />
      case "Profit & Loss":
        return hasPermission(RoleLevels[UserRoles.VICE_PRESIDENT]) ? <ProfitLoss /> : <NoPermissionPage />
      case "Balance Sheet":
        return hasPermission(RoleLevels[UserRoles.VICE_PRESIDENT]) ? <BalanceSheet /> : <NoPermissionPage />
      case "General Ledger":
        return hasPermission(RoleLevels[UserRoles.VICE_PRESIDENT]) ? <GeneralLedger /> : <NoPermissionPage />
      case "Account Settings":
        return hasPermission(RoleLevels[UserRoles.VICE_PRESIDENT]) ? <AccountSettings /> : <NoPermissionPage />
      default:
        return <DashboardOverview />
    }
  }

  // Placeholder for no permission page
  const NoPermissionPage = () => <div className="p-6 text-center text-muted-foreground">您没有权限访问此页面。</div>

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
        <main className="flex-1 overflow-auto">{renderCurrentPage()}</main>
      </div>
    </SidebarProvider>
  )
}
