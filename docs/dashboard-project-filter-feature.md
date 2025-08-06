# 仪表板项目筛选功能实现文档

## 功能概述

在 `dashboard-overview-optimized` 组件中新增了项目下拉筛选功能，该功能按照 BOD 分类对项目进行分组显示，提供更直观和高效的项目选择体验。

## 功能特性

### 1. BOD分组显示
- 项目按 BOD 分类进行分组显示
- BOD 分类按固定顺序排列：P → VPI → VPE → VPM → VPPR → SAA → T → S
- 每个 BOD 分类下有清晰的分组标题

### 2. 智能排序
- BOD 分类按预设顺序排列
- 每个分类下的项目按名称字母顺序排列
- 提供一致的用户体验

### 3. 组合筛选
- 支持与其他筛选器组合使用
- 筛选条件为"与"关系，同时满足所有条件
- 实时更新统计数据和图表

### 4. 用户友好
- 直观的分组标题显示
- 清晰的选项布局
- 支持一键重置所有筛选条件

## 技术实现

### 1. 状态管理

```typescript
// 项目统计筛选状态 - 新增项目筛选
const [projectStatsFilters, setProjectStatsFilters] = React.useState({
  year: new Date().getFullYear().toString(),
  bodCategory: "all",
  status: "all",
  project: "all" // 新增项目筛选
})
```

### 2. 按BOD分组的项目选项生成

```typescript
// 获取按BOD分组的项目选项
const getProjectsGroupedByBOD = React.useCallback(() => {
  if (!projects) return []
  
  // 按BOD分类分组项目
  const groupedProjects = projects.reduce((acc, project) => {
    const bodCategory = project.bodCategory
    if (!acc[bodCategory]) {
      acc[bodCategory] = []
    }
    acc[bodCategory].push(project)
    return acc
  }, {} as Record<string, Project[]>)
  
  // 转换为选项数组
  const options: Array<{ group: string; projects: Project[] }> = []
  
  // BOD分类顺序
  const bodOrder = ['P', 'VPI', 'VPE', 'VPM', 'VPPR', 'SAA', 'T', 'S']
  
  bodOrder.forEach(bod => {
    if (groupedProjects[bod]) {
      options.push({
        group: bod,
        projects: groupedProjects[bod].sort((a, b) => a.name.localeCompare(b.name))
      })
    }
  })
  
  return options
}, [projects])
```

### 3. 筛选逻辑

```typescript
// 按项目筛选
if (projectStatsFilters.project !== "all") {
  filteredProjects = filteredProjects.filter(project => 
    project.projectid === projectStatsFilters.project
  )
}
```

### 4. UI组件实现

```typescript
<div className="flex-1">
  <Label htmlFor="project-filter" className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1 block">
    选择项目
  </Label>
  <Select 
    value={projectStatsFilters.project} 
    onValueChange={(value) => setProjectStatsFilters(prev => ({ ...prev, project: value }))}
  >
    <SelectTrigger className="h-8 text-xs">
      <SelectValue placeholder="选择项目" />
    </SelectTrigger>
    <SelectContent>
      <SelectItem value="all">所有项目</SelectItem>
      {getProjectsGroupedByBOD().map((group) => (
        <div key={group.group}>
          <div className="px-2 py-1.5 text-xs font-semibold text-gray-500 bg-gray-100 dark:bg-gray-800">
            {group.group === 'P' && '主席 (P)'}
            {group.group === 'VPI' && '副主席 (VPI)'}
            {group.group === 'VPE' && '副主席 (VPE)'}
            {group.group === 'VPM' && '副主席 (VPM)'}
            {group.group === 'VPPR' && '副主席 (VPPR)'}
            {group.group === 'SAA' && '秘书 (SAA)'}
            {group.group === 'T' && '财务 (T)'}
            {group.group === 'S' && '秘书 (S)'}
          </div>
          {group.projects.map((project) => (
            <SelectItem key={project.id} value={project.projectid}>
              {project.name}
            </SelectItem>
          ))}
        </div>
      ))}
    </SelectContent>
  </Select>
</div>
```

## BOD分类说明

| 代码 | 英文名称 | 中文名称 |
|------|----------|----------|
| P | President | 主席 |
| VPI | Vice President Internal | 副主席 |
| VPE | Vice President Education | 副主席 |
| VPM | Vice President Membership | 副主席 |
| VPPR | Vice President Public Relations | 副主席 |
| SAA | Sergeant at Arms | 秘书 |
| T | Treasurer | 财务 |
| S | Secretary | 秘书 |

## 筛选器组合

### 可用筛选器
1. **年份筛选**：按项目年份进行筛选
2. **BOD分类筛选**：按BOD分类进行筛选
3. **项目状态筛选**：按项目状态进行筛选
4. **项目选择筛选**：按具体项目进行筛选（新增）

### 筛选逻辑
- 所有筛选器可以同时使用
- 筛选条件为"与"关系，即同时满足所有条件
- 支持一键重置所有筛选条件
- 筛选结果实时更新统计数据和图表

## 用户体验

### 优势
1. **直观分组**：按BOD分类分组，便于快速定位项目
2. **智能排序**：固定顺序排列，提供一致体验
3. **组合筛选**：支持多条件组合，实现精确筛选
4. **实时反馈**：筛选结果即时更新，提供即时反馈
5. **一键重置**：快速恢复默认状态，操作简便

### 使用流程
1. 在筛选控制面板中找到"选择项目"下拉框
2. 点击下拉框查看按BOD分组的项目列表
3. 观察BOD分类的分组标题和项目排列
4. 选择一个具体项目，观察筛选结果
5. 尝试与其他筛选器组合使用
6. 点击"重置筛选"按钮恢复默认状态

## 测试页面

### 访问路径
访问 `/test-dashboard-project-filter` 路径即可使用测试页面。

### 测试内容
- 项目下拉筛选器的BOD分组显示
- 项目选择和筛选功能
- 与其他筛选器的组合使用
- 重置筛选功能
- 实时数据更新

## 技术细节

### 性能优化
- 使用 `React.useCallback` 缓存函数，避免不必要的重新计算
- 使用 `React.useMemo` 缓存计算结果，提高渲染性能
- 按需加载和渲染，减少初始加载时间

### 类型安全
- 完整的 TypeScript 类型定义
- 严格的类型检查，确保代码质量
- 明确的接口定义，便于维护和扩展

### 响应式设计
- 支持移动端和桌面端
- 自适应布局，适配不同屏幕尺寸
- 一致的用户体验

## 总结

项目下拉筛选功能的实现提供了以下价值：

1. **提升用户体验**：按BOD分组显示，便于快速定位和管理项目
2. **增强筛选能力**：支持精确的项目筛选，提高数据查找效率
3. **保持一致性**：与其他筛选器保持一致的交互模式
4. **易于维护**：清晰的代码结构和完整的类型定义

该功能与现有的仪表板功能完美集成，为用户提供了更强大和直观的项目管理体验。
