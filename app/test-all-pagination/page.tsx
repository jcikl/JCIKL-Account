import { JournalEntriesOptimized } from "@/components/modules/journal-entries-optimized"
import { ProjectAccountsOptimized } from "@/components/modules/project-accounts-optimized"

import { BankTransactions } from "@/components/modules/bank-transactions"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function TestAllPaginationPage() {
  return (
    <div className="min-h-screen bg-background p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">分页功能测试</h1>
        <p className="text-muted-foreground">测试所有页面的分页功能</p>
      </div>
      
      <Tabs defaultValue="bank" className="space-y-4">
        <TabsList>
          <TabsTrigger value="bank">银行交易</TabsTrigger>
          <TabsTrigger value="journal">日记账分录</TabsTrigger>
          <TabsTrigger value="projects">项目账户</TabsTrigger>

        </TabsList>
        
        <TabsContent value="bank" className="space-y-4">
          <BankTransactions />
        </TabsContent>
        
        <TabsContent value="journal" className="space-y-4">
          <JournalEntriesOptimized />
        </TabsContent>
        
        <TabsContent value="projects" className="space-y-4">
          <ProjectAccountsOptimized />
        </TabsContent>
        

      </Tabs>
    </div>
  )
} 