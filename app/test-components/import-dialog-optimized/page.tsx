"use client"

import { ImportDialogEnhanced } from "@/components/modules/import-dialog-optimized"

export default function TestImportDialogOptimizedPage() {
  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">测试页面: ImportDialogOptimized</h1>
        <p className="text-muted-foreground">组件路径: @/components/modules/import-dialog-optimized</p>
        <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded">
          <p className="text-sm text-blue-800">
            <strong>说明:</strong> 此页面用于测试和比较 import-dialog-optimized 组件的功能和性能。
          </p>
        </div>
      </div>
      
      <div className="border rounded-lg p-4 bg-gray-50">
        <ImportDialogEnhanced />
      </div>
    </div>
  )
}