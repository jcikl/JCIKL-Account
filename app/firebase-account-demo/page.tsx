"use client"

import * as React from "react"
import { AccountChart } from "@/components/modules/account-chart"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Database, Cloud, CheckCircle, AlertCircle } from "lucide-react"
import type { Account } from "@/lib/data"

export default function FirebaseAccountDemoPage() {
  const [firebaseStatus, setFirebaseStatus] = React.useState<'connected' | 'disconnected' | 'error'>('connected')

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <Database className="h-8 w-8 text-blue-600" />
            <h1 className="text-3xl font-bold">Firebase 账户图表演示</h1>
          </div>
          <p className="text-muted-foreground">
            演示账户图表与 Firebase 的集成功能，包括实时数据存储和同步
          </p>
        </div>

        {/* Firebase 状态指示器 */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Cloud className="h-5 w-5" />
              Firebase 连接状态
            </CardTitle>
            <CardDescription>
              实时监控与 Firebase 的连接状态
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <Badge 
                variant={firebaseStatus === 'connected' ? 'default' : firebaseStatus === 'error' ? 'destructive' : 'secondary'}
                className="flex items-center gap-2"
              >
                {firebaseStatus === 'connected' ? (
                  <>
                    <CheckCircle className="h-4 w-4" />
                    已连接
                  </>
                ) : firebaseStatus === 'error' ? (
                  <>
                    <AlertCircle className="h-4 w-4" />
                    连接错误
                  </>
                ) : (
                  <>
                    <AlertCircle className="h-4 w-4" />
                    未连接
                  </>
                )}
              </Badge>
              <span className="text-sm text-muted-foreground">
                项目: jcikl-account
              </span>
            </div>
          </CardContent>
        </Card>

        {/* 功能说明 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">实时同步</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                所有账户数据实时同步到 Firebase，支持多用户协作
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">数据持久化</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                账户数据安全存储在云端，支持备份和恢复
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">离线支持</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                支持离线操作，网络恢复后自动同步数据
              </p>
            </CardContent>
          </Card>
        </div>

        {/* 使用说明 */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>使用说明</CardTitle>
            <CardDescription>
              了解如何使用 Firebase 集成的账户图表功能
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-medium mt-0.5">
                  1
                </div>
                <div>
                  <p className="font-medium">添加账户</p>
                  <p className="text-muted-foreground">点击"添加账户"按钮创建新账户，数据会自动保存到 Firebase</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-medium mt-0.5">
                  2
                </div>
                <div>
                  <p className="font-medium">编辑账户</p>
                  <p className="text-muted-foreground">点击编辑按钮修改账户信息，更改会实时同步到云端</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-medium mt-0.5">
                  3
                </div>
                <div>
                  <p className="font-medium">删除账户</p>
                  <p className="text-muted-foreground">删除账户时会同时从 Firebase 中移除，操作不可撤销</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-medium mt-0.5">
                  4
                </div>
                <div>
                  <p className="font-medium">数据同步</p>
                  <p className="text-muted-foreground">页面加载时会自动从 Firebase 获取最新数据</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 账户图表组件 */}
        <div className="mb-6">
          <Card>
            <CardHeader>
              <CardTitle>账户图表 (Firebase 集成)</CardTitle>
              <CardDescription>
                所有操作都会实时同步到 Firebase 数据库
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AccountChart 
                enableFirebase={true}
                onAccountSelect={(account) => {
                  console.log('选择账户:', account)
                }}
                onAccountEdit={(account) => {
                  console.log('编辑账户:', account)
                }}
                onAccountDelete={(accountId) => {
                  console.log('删除账户:', accountId)
                }}
                onAccountAdd={() => {
                  console.log('添加账户')
                }}
              />
            </CardContent>
          </Card>
        </div>

        {/* 技术信息 */}
        <Card>
          <CardHeader>
            <CardTitle>技术信息</CardTitle>
            <CardDescription>
              Firebase 集成的技术细节
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <h4 className="font-medium mb-2">Firebase 配置</h4>
                <ul className="space-y-1 text-muted-foreground">
                  <li>• 项目 ID: jcikl-account</li>
                  <li>• 数据库: Firestore</li>
                  <li>• 集合: accounts</li>
                  <li>• 实时同步: 启用</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-medium mb-2">数据操作</h4>
                <ul className="space-y-1 text-muted-foreground">
                  <li>• 创建: addAccount()</li>
                  <li>• 读取: getAccounts()</li>
                  <li>• 更新: updateAccount()</li>
                  <li>• 删除: deleteAccount()</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 