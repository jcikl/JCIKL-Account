"use client"
import { PieChart } from "lucide-react"
import type React from "react"

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar"

interface NavigationItem {
  title: string
  url: string
  icon: React.ElementType
  requiredLevel: number
}

interface NavigationData {
  main: NavigationItem[]
  transactions: NavigationItem[]
  accounts: NavigationItem[]
  reports: NavigationItem[]
  settings: NavigationItem[]
  management?: NavigationItem[]
}

interface AppSidebarProps {
  currentPage: string
  setCurrentPage: (page: string) => void
  navigationData: NavigationData
  hasPermission: (requiredLevel: number) => boolean
}

export function AppSidebar({ currentPage, setCurrentPage, navigationData, hasPermission }: AppSidebarProps) {
  return (
    <Sidebar className="border-r">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" className="data-[state=open]:bg-sidebar-accent">
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <PieChart className="size-4" />
              </div>
              <div className="flex flex-col gap-0.5 leading-none">
                <span className="font-semibold">AccounTech</span>
                <span className="text-xs">Accounting System</span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Overview</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigationData.main.map((item) =>
                hasPermission(item.requiredLevel) ? (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={currentPage === item.title}>
                      <button onClick={() => setCurrentPage(item.title)}>
                        <item.icon className="size-4" />
                        <span>{item.title}</span>
                      </button>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ) : null,
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Transactions</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigationData.transactions.map((item) =>
                hasPermission(item.requiredLevel) ? (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={currentPage === item.title}>
                      <button onClick={() => setCurrentPage(item.title)}>
                        <item.icon className="size-4" />
                        <span>{item.title}</span>
                      </button>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ) : null,
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Accounts</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigationData.accounts.map((item) =>
                hasPermission(item.requiredLevel) ? (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={currentPage === item.title}>
                      <button onClick={() => setCurrentPage(item.title)}>
                        <item.icon className="size-4" />
                        <span>{item.title}</span>
                      </button>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ) : null,
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Reports</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigationData.reports.map((item) =>
                hasPermission(item.requiredLevel) ? (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={currentPage === item.title}>
                      <button onClick={() => setCurrentPage(item.title)}>
                        <item.icon className="size-4" />
                        <span>{item.title}</span>
                      </button>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ) : null,
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Management</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigationData.management?.map((item) =>
                hasPermission(item.requiredLevel) ? (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={currentPage === item.title}>
                      <button onClick={() => setCurrentPage(item.title)}>
                        <item.icon className="size-4" />
                        <span>{item.title}</span>
                      </button>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ) : null,
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Settings</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigationData.settings.map((item) =>
                hasPermission(item.requiredLevel) ? (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={currentPage === item.title}>
                      <button onClick={() => setCurrentPage(item.title)}>
                        <item.icon className="size-4" />
                        <span>{item.title}</span>
                      </button>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ) : null,
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  )
}
