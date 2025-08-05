"use client"

import { ProjectImportDialog } from "@/components/modules/project-import-dialog"

export default function TestProjectImportDialogPage() {
  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">测试页面: ProjectImportDialog</h1>
        <p className="text-muted-foreground">组件路径: @/components/modules/project-import-dialog</p>
        <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded">
          <p className="text-sm text-blue-800">
            <strong>说明:</strong> 此页面用于测试和比较 project-import-dialog 组件的功能和性能。
          </p>
        </div>
      </div>
      
      <div className="border rounded-lg p-4 bg-gray-50">
        <ProjectImportDialog />
      </div>
    </div>
  )
}