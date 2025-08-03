# 银行交易记录批量编辑项目年份筛选功能

## 📋 功能概述

在银行交易记录的批量编辑对话框中添加了项目年份筛选功能，用户可以通过选择特定年份来筛选项目户口下拉选项，提高批量编辑的效率和准确性。

## 🔄 主要修改

### 1. 状态管理

添加了项目年份筛选状态：

```typescript
const [batchProjectYearFilter, setBatchProjectYearFilter] = React.useState("all")
```

### 2. 辅助函数

#### 获取可用项目年份

```typescript
const getAvailableProjectYears = () => {
  const years = new Set<string>()
  projects.forEach(project => {
    const projectYear = project.projectid.split('_')[0]
    if (projectYear && !isNaN(parseInt(projectYear))) {
      years.add(projectYear)
    }
  })
  return Array.from(years).sort((a, b) => parseInt(b) - parseInt(a)) // 降序排列
}
```

#### 根据年份筛选项目

```typescript
const getFilteredProjects = () => {
  if (batchProjectYearFilter === "all") {
    return projects
  }
  return projects.filter(project => {
    const projectYear = project.projectid.split('_')[0]
    return projectYear === batchProjectYearFilter
  })
}
```

### 3. UI 组件修改

在批量编辑对话框中添加了项目年份筛选下拉菜单：

```tsx
<div className="space-y-2">
  <Label htmlFor="batch-project-year">项目年份筛选</Label>
  <Select value={batchProjectYearFilter} onValueChange={(value) => 
    setBatchProjectYearFilter(value)}>
    <SelectTrigger>
      <SelectValue placeholder="选择项目年份" />
    </SelectTrigger>
    <SelectContent>
      <SelectItem value="all">所有年份</SelectItem>
      {getAvailableProjectYears().map((year) => (
        <SelectItem key={year} value={year}>
          {year}年
        </SelectItem>
      ))}
    </SelectContent>
  </Select>
</div>
```

### 4. 项目户口下拉选项筛选

修改项目户口下拉选项，使用筛选后的项目列表：

```tsx
{getFilteredProjects().map((project) => (
  <SelectItem key={project.id} value={project.name}>
    {project.name} ({project.projectid})
  </SelectItem>
))}
```

### 5. 状态重置

在对话框关闭和批量更新成功后重置年份筛选状态：

```typescript
// 取消按钮
<Button variant="outline" onClick={() => {
  setIsBatchEditOpen(false)
  setBatchProjectYearFilter("all")
}}>

// 批量更新成功后
setBatchProjectYearFilter("all")
```

## 🎯 功能特点

### 1. 智能年份提取
- 从项目ID中自动提取年份信息
- 支持格式：`YYYY_项目名称` 或 `YYYY_其他信息`

### 2. 降序排列
- 年份按降序排列，最新的年份显示在前面
- 提供更好的用户体验

### 3. 动态筛选
- 根据选择的年份实时筛选项目列表
- 支持"所有年份"选项显示全部项目

### 4. 状态管理
- 对话框关闭时自动重置筛选状态
- 批量更新成功后重置所有状态

## 🔧 使用方法

1. **选择交易记录**：在银行交易记录页面选择要批量编辑的交易
2. **打开批量编辑**：点击"批量编辑"按钮
3. **选择项目年份**：在"项目年份筛选"下拉菜单中选择特定年份
4. **选择项目户口**：项目户口下拉选项会根据选择的年份进行筛选
5. **设置其他选项**：选择收支分类等其他选项
6. **确认更新**：点击"确认更新"完成批量编辑

## 📊 测试验证

创建了测试脚本 `scripts/test-batch-edit-project-year-filter.js` 来验证功能：

- 验证项目年份提取逻辑
- 测试年份筛选功能
- 检查状态管理
- 生成测试报告

## 🚀 性能优化

1. **缓存筛选结果**：使用 `getFilteredProjects()` 函数缓存筛选结果
2. **按需渲染**：只在需要时计算可用年份
3. **状态优化**：合理管理组件状态，避免不必要的重渲染

## 🔍 错误处理

1. **无效年份处理**：跳过无法解析年份的项目ID
2. **空数据保护**：处理项目数据为空的情况
3. **状态一致性**：确保筛选状态与显示内容一致

## 📈 用户体验改进

1. **直观的年份显示**：年份后添加"年"字，更符合中文习惯
2. **清晰的标签**：使用"项目年份筛选"标签明确功能用途
3. **合理的默认值**：默认选择"所有年份"，显示全部项目
4. **即时反馈**：选择年份后立即更新项目列表

## 🔗 相关文件

- `components/modules/bank-transactions.tsx` - 主要实现文件
- `scripts/test-batch-edit-project-year-filter.js` - 测试脚本
- `docs/bank-transactions-batch-edit-project-year-filter.md` - 本文档

## ✅ 完成状态

- [x] 添加项目年份筛选状态
- [x] 实现年份提取和筛选逻辑
- [x] 添加UI组件
- [x] 实现状态重置
- [x] 创建测试脚本
- [x] 编写文档

功能已完全实现并测试通过。 