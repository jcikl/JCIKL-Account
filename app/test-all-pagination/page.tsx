import { JournalEntries } from "@/components/modules/journal-entries"
import { ProjectAccounts } from "@/components/modules/project-accounts"
import { GeneralLedger } from "@/components/modules/general-ledger"
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
          <TabsTrigger value="ledger">总账</TabsTrigger>
        </TabsList>
        
        <TabsContent value="bank" className="space-y-4">
          <BankTransactions />
        </TabsContent>
        
        <TabsContent value="journal" className="space-y-4">
          <JournalEntries />
        </TabsContent>
        
        <TabsContent value="projects" className="space-y-4">
          <ProjectAccounts />
        </TabsContent>
        
        <TabsContent value="ledger" className="space-y-4">
          <GeneralLedger />
        </TabsContent>
      </Tabs>
    </div>
  )
} 