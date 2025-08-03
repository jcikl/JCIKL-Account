"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Upload, Plus } from "lucide-react"
import { useAuth } from "@/components/auth/auth-context"
import { RoleLevels, UserRoles } from "@/lib/data"

export default function TestButtonsPage() {
  const { currentUser, hasPermission } = useAuth()
  const [showImportDialog, setShowImportDialog] = React.useState(false)
  const [saving, setSaving] = React.useState(false)

  const handleAddProject = () => {
    console.log('添加项目按钮被点击')
  }

  // 调试信息
  console.log('TestButtonsPage - 当前用户:', currentUser)
  console.log('TestButtonsPage - 用户角色:', currentUser?.role)
  console.log('TestButtonsPage - 用户级别:', currentUser?.role ? RoleLevels[currentUser.role] : null)
  console.log('TestButtonsPage - 导入权限:', hasPermission(RoleLevels.TREASURER))
  console.log('TestButtonsPage - 添加项目权限:', hasPermission(RoleLevels.VICE_PRESIDENT))

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">按钮显示测试</h1>
          <p className="text-muted-foreground">测试项目账户页面的按钮显示逻辑</p>
        </div>
        <div className="flex items-center space-x-2">
          {hasPermission(RoleLevels.TREASURER) && (
            <Button
              variant="outline"
              onClick={() => setShowImportDialog(true)}
            >
              <Upload className="h-4 w-4 mr-2" />
              导入项目
            </Button>
          )}
          {hasPermission(RoleLevels.VICE_PRESIDENT) && (
            <Button onClick={handleAddProject} disabled={saving}>
              {saving ? (
                <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-current border-t-transparent" />
              ) : (
                <Plus className="h-4 w-4 mr-2" />
              )}
              新项目
            </Button>
          )}
        </div>
      </div>

      {/* 调试信息显示 */}
      <div className="bg-gray-100 p-4 rounded-lg">
        <h2 className="text-lg font-semibold mb-2">调试信息</h2>
        <div className="space-y-1 text-sm">
          <p><strong>当前用户:</strong> {currentUser ? JSON.stringify(currentUser, null, 2) : 'null'}</p>
          <p><strong>用户角色:</strong> {currentUser?.role || 'null'}</p>
          <p><strong>用户级别:</strong> {currentUser?.role ? RoleLevels[currentUser.role] : 'null'}</p>
          <p><strong>导入权限:</strong> {hasPermission(RoleLevels.TREASURER) ? '✅ 有权限' : '❌ 无权限'}</p>
          <p><strong>添加项目权限:</strong> {hasPermission(RoleLevels.VICE_PRESIDENT) ? '✅ 有权限' : '❌ 无权限'}</p>
        </div>
      </div>

      {/* 权限级别说明 */}
      <div className="bg-blue-50 p-4 rounded-lg">
        <h2 className="text-lg font-semibold mb-2">权限级别说明</h2>
        <div className="space-y-1 text-sm">
          <p><strong>TREASURER (级别1):</strong> 可以导入项目、添加项目</p>
          <p><strong>PRESIDENT (级别1):</strong> 可以导入项目、添加项目</p>
          <p><strong>VICE_PRESIDENT (级别2):</strong> 可以导入项目、添加项目</p>
          <p><strong>ASSISTANT_VICE_PRESIDENT (级别3):</strong> 可以导入项目、添加项目</p>
          <p><strong>PROJECT_CHAIRMAN (级别3):</strong> 可以导入项目、添加项目</p>
        </div>
      </div>

      {/* 按钮状态显示 */}
      <div className="bg-green-50 p-4 rounded-lg">
        <h2 className="text-lg font-semibold mb-2">按钮状态</h2>
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <span>导入项目按钮:</span>
            {hasPermission(RoleLevels.TREASURER) ? (
              <span className="text-green-600">✅ 显示</span>
            ) : (
              <span className="text-red-600">❌ 隐藏</span>
            )}
          </div>
          <div className="flex items-center space-x-2">
            <span>新项目按钮:</span>
            {hasPermission(RoleLevels.VICE_PRESIDENT) ? (
              <span className="text-green-600">✅ 显示</span>
            ) : (
              <span className="text-red-600">❌ 隐藏</span>
            )}
          </div>
        </div>
      </div>

      {/* 导入对话框状态 */}
      {showImportDialog && (
        <div className="bg-yellow-50 p-4 rounded-lg">
          <h2 className="text-lg font-semibold mb-2">导入对话框</h2>
          <p>导入对话框已打开</p>
          <Button 
            variant="outline" 
            onClick={() => setShowImportDialog(false)}
            className="mt-2"
          >
            关闭对话框
          </Button>
        </div>
      )}
    </div>
  )
} 