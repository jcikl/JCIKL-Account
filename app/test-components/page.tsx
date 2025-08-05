"use client"

import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

const components = [
  "account-chart-optimized",
  "account-chart-virtual",
  "account-chart",
  "account-form-dialog-optimized",
  "account-form-dialog",
  "account-settings-optimized",
  "account-settings",
  "account-summary-optimized",
  "account-summary",
  "balance-sheet-optimized",
  "balance-sheet",
  "bank-account-management",
  "bank-account-selector",
  "bank-transactions-charts",
  "bank-transactions-fixed",
  "category-management-optimized",
  "category-management",
  "category-paste-import-dialog",
  "dashboard-overview-optimized",
  "dashboard-overview",
  "export-dialog-optimized",
  "export-dialog",
  "gl-settings-management",
  "import-dialog-enhanced",
  "import-dialog-optimized",
  "import-dialog",
  "journal-entries-optimized",
  "journal-entries",
  "paste-import-dialog",
  "profit-loss-optimized",
  "profit-loss",
  "project-accounts-optimized",
  "project-accounts-virtual",
  "project-accounts",
  "project-details-dialog-optimized",
  "project-details-dialog",
  "project-form-dialog-optimized",
  "project-form-dialog",
  "project-import-dialog",
  "project-paste-import-dialog",
  "transaction-import-dialog-optimized",
  "transaction-import-dialog",
  "trial-balance-optimized",
  "trial-balance"
];

export default function TestComponentsIndexPage() {
  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">组件测试页面索引</h1>
        <p className="text-muted-foreground">
          用于测试和比较不同版本组件的功能和性能
        </p>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {components.map((component, index) => (
          <Link key={component} href={`/test-components/${component}`}>
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardHeader>
                <CardTitle className="text-lg">{component}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  测试 {component} 组件
                </p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}