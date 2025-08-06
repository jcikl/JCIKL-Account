"use client"

import * as React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { DashboardOverviewOptimized } from "@/components/modules/dashboard-overview-optimized"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, Info } from "lucide-react"

export default function TestDashboardProjectFilterPage() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">仪表板项目筛选功能测试</h1>
          <p className="text-muted-foreground mt-2">
            测试仪表板中的项目下拉筛选功能，包括按BOD分组的项目选择器
          </p>
        </div>
      </div>

      {/* 功能说明 */}
      <Card>
        <CardHeader>
          <CardTitle>功能说明</CardTitle>
          <CardDescription>
            仪表板项目筛选功能包含以下特性：
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-lg mb-2">筛选器功能</h3>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                <li>年份筛选：按项目年份进行筛选</li>
                <li>BOD分类筛选：按BOD分类进行筛选</li>
                <li>项目状态筛选：按项目状态进行筛选</li>
                <li>项目选择筛选：按具体项目进行筛选（新增）</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-lg mb-2">项目下拉筛选器特性</h3>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                <li>按BOD分类进行分组显示</li>
                <li>BOD分类按固定顺序排列：P → VPI → VPE → VPM → VPPR → SAA → T → S</li>
                <li>每个BOD分类下有分组标题显示</li>
                <li>项目按名称字母顺序排列</li>
                <li>支持选择"所有项目"或具体项目</li>
                <li>与其他筛选器组合使用</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-lg mb-2">筛选逻辑</h3>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                <li>所有筛选器可以同时使用</li>
                <li>筛选条件为"与"关系，即同时满足所有条件</li>
                <li>支持一键重置所有筛选条件</li>
                <li>筛选结果实时更新统计数据和图表</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 使用说明 */}
      <Card>
        <CardHeader>
          <CardTitle>使用说明</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">测试项目筛选功能：</h4>
              <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
                <li>在筛选控制面板中找到"选择项目"下拉框</li>
                <li>点击下拉框查看按BOD分组的项目列表</li>
                <li>观察BOD分类的分组标题和项目排列</li>
                <li>选择一个具体项目，观察筛选结果</li>
                <li>尝试与其他筛选器组合使用</li>
                <li>点击"重置筛选"按钮恢复默认状态</li>
              </ol>
            </div>
            <div>
              <h4 className="font-medium mb-2">BOD分类说明：</h4>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                <li><strong>P</strong> - 主席 (President)</li>
                <li><strong>VPI</strong> - 副主席 (Vice President Internal)</li>
                <li><strong>VPE</strong> - 副主席 (Vice President Education)</li>
                <li><strong>VPM</strong> - 副主席 (Vice President Membership)</li>
                <li><strong>VPPR</strong> - 副主席 (Vice President Public Relations)</li>
                <li><strong>SAA</strong> - 秘书 (Sergeant at Arms)</li>
                <li><strong>T</strong> - 财务 (Treasurer)</li>
                <li><strong>S</strong> - 秘书 (Secretary)</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-2">注意事项：</h4>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                <li>项目筛选器会实时更新统计数据和图表</li>
                <li>选择具体项目时，只会显示该项目的相关数据</li>
                <li>可以与其他筛选器组合使用，实现精确筛选</li>
                <li>重置筛选会恢复所有筛选器到默认状态</li>
                <li>筛选结果会影响项目统计卡片和详细统计表格</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 功能特性展示 */}
      <Card>
        <CardHeader>
          <CardTitle>功能特性展示</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="font-medium">BOD分组</span>
              </div>
              <p className="text-sm text-muted-foreground">
                项目按BOD分类进行分组显示，便于快速定位和管理
              </p>
            </div>
            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="font-medium">智能排序</span>
              </div>
              <p className="text-sm text-muted-foreground">
                BOD分类按固定顺序排列，项目按名称字母顺序排列
              </p>
            </div>
            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="font-medium">组合筛选</span>
              </div>
              <p className="text-sm text-muted-foreground">
                支持与其他筛选器组合使用，实现精确的数据筛选
              </p>
            </div>
            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="font-medium">实时更新</span>
              </div>
              <p className="text-sm text-muted-foreground">
                筛选结果实时更新统计数据和图表，提供即时反馈
              </p>
            </div>
            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="font-medium">一键重置</span>
              </div>
              <p className="text-sm text-muted-foreground">
                支持一键重置所有筛选条件，快速恢复默认状态
              </p>
            </div>
            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="font-medium">用户友好</span>
              </div>
              <p className="text-sm text-muted-foreground">
                直观的分组标题和清晰的选项布局，提升用户体验
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 仪表板组件 */}
      <Card>
        <CardHeader>
          <CardTitle>仪表板组件</CardTitle>
          <CardDescription>
            下方是完整的仪表板组件，包含项目筛选功能
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="p-4 border rounded-lg bg-gray-50/50">
            <div className="flex items-center gap-2 mb-4">
              <Info className="h-4 w-4 text-blue-600" />
              <span className="text-sm text-blue-600">
                请在下方的仪表板中测试项目筛选功能
              </span>
            </div>
            <DashboardOverviewOptimized />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
