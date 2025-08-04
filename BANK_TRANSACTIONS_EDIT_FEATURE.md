# 银行交易编辑功能 - 项目年份筛选和排序

## 功能概述

在银行交易页面的编辑交易功能中，新增了项目年份下拉筛选功能，并且所有项目下拉列表都按项目代码进行排序，用于更有效地寻找和选择项目。

## 新增功能

### 1. 项目年份筛选下拉框
- 位置：编辑交易表单中的项目选择区域
- 功能：根据项目ID中的年份信息筛选项目列表
- 选项：显示所有可用的项目年份，按降序排列

### 2. 智能年份设置
- 编辑现有交易时，系统会自动根据当前交易的项目设置相应的年份筛选
- 新增交易时，年份筛选默认为"所有年份"

### 3. 项目列表动态筛选
- 根据选择的年份，动态筛选项目户口下拉列表
- 只显示选定年份的项目，提高选择效率

### 4. 项目代码排序
- 所有项目下拉列表都按项目代码进行智能排序
- 排序规则：首先按年份降序排列，然后按项目代码升序排列
- 提高项目查找效率，特别是在项目数量较多时

### 5. 项目显示格式优化
- 所有项目下拉列表显示格式改为：`项目代码 - 项目名称`
- 项目代码在前，便于快速识别和查找
- 保持项目名称显示，确保用户了解项目内容

### 6. BOD分类分组显示
- 所有项目下拉列表按BOD（Board of Directors）分类进行分组
- 分组标题显示BOD分类名称（如：President、Honorary Treasurer等）
- 每个分组内的项目按年份和代码排序
- 提供更清晰的项目组织结构，便于快速定位
- 银行交易页面的项目户口筛选下拉框也使用相同的分组方式
- 筛选下拉框仅显示项目名称，按BOD分组和projectid排序

## 技术实现

### 新增状态变量
```typescript
const [editFormProjectYearFilter, setEditFormProjectYearFilter] = React.useState("all")
```

### 新增函数
```typescript
// 根据年份筛选项目（用于编辑交易表单）
const getEditFormFilteredProjects = () => {
  let filteredProjects = projects
  
  if (editFormProjectYearFilter !== "all") {
    filteredProjects = projects.filter(project => {
      const projectYear = project.projectid.split('_')[0]
      return projectYear === editFormProjectYearFilter
    })
  }
  
  // 按项目代码排序
  return filteredProjects.sort((a, b) => {
    // 首先按年份排序（降序）
    const yearA = a.projectid.split('_')[0]
    const yearB = b.projectid.split('_')[0]
    if (yearA !== yearB) {
      return parseInt(yearB) - parseInt(yearA)
    }
    
    // 然后按项目代码排序（升序）
    return a.projectid.localeCompare(b.projectid)
  })
}
```

### 表单布局调整
- 将项目选择区域从3列布局调整为4列布局
- 新增项目年份筛选字段

### 排序逻辑
- 统一的排序规则：首先按年份降序排列，然后按项目代码升序排列
- 应用于所有项目下拉列表：编辑交易表单、批量编辑对话框、项目账户页面等
- 使用 `localeCompare` 方法确保字符串排序的准确性

### 分组逻辑
- 按BOD分类对项目进行分组
- 分组标题使用BOD分类的英文名称
- 每个分组内的项目保持原有的排序规则
- 分组结构：BOD分类 → 项目列表（按年份和代码排序）
- 适用于编辑表单、批量编辑对话框和筛选下拉框

## 使用方法

1. 点击任意交易的编辑按钮
2. 在编辑表单中，可以看到新增的"项目年份"下拉框
3. 选择特定年份后，项目户口下拉列表会自动筛选显示该年份的项目
4. 选择"所有年份"可以查看所有项目
5. 所有项目列表都按项目代码智能排序，便于快速查找
6. 项目显示格式为"项目代码 - 项目名称"，便于快速识别
7. 项目按BOD分类分组显示，提供更清晰的组织结构
8. 银行交易页面的项目户口筛选下拉框也使用BOD分组显示
9. 筛选下拉框仅显示项目名称，按BOD分组和projectid排序
10. 筛选下拉框中的项目按BOD分类分组，每个分类下按projectid排序，只显示项目名称部分

## 排序规则

- **年份排序**：按年份降序排列（最新年份在前）
- **代码排序**：同一年份内按项目代码升序排列
- **示例排序**：
  - 2025_P_项目A
  - 2025_HT_项目B
  - 2024_P_项目A
  - 2024_HT_项目B

## 显示格式

- **格式**：`项目代码 - 项目名称`
- **示例显示**：
  - 2025_P_项目A - 2025年主席项目A
  - 2025_HT_项目B - 2025年财务项目B
  - 2024_P_项目A - 2024年主席项目A
  - 2024_HT_项目B - 2024年财务项目B

## 分组显示

- **分组结构**：按BOD分类分组显示
- **示例分组**：
  ```
  President
  2025_P_项目A - 2025年主席项目A
  2024_P_项目A - 2024年主席项目A

  Honorary Treasurer
  2025_HT_项目B - 2025年财务项目B
  2024_HT_项目B - 2024年财务项目B

  Executive Vice President
  2025_EVP_项目B - 2025年执行副主席项目B
  2025_EVP_项目C - 2025年执行副主席项目C
  2024_EVP_项目C - 2024年执行副主席项目C
  ```

## 筛选下拉框显示

- **显示格式**：仅显示项目名称，按BOD分组和projectid排序
- **功能**：从项目ID中提取项目名称部分，按BOD分类分组显示
- **示例显示**：
  ```
  President
  项目A
  项目B

  Honorary Treasurer
  项目C
  项目D

  Executive Vice President
  项目E
  项目F
  项目G
  ```
- **实现逻辑**：从项目ID（如"2025_P_项目A"）中提取项目名称部分（"项目A"），按BOD分类分组，每个分类内按projectid排序

## 测试页面

访问 `/test-bank-transactions` 页面可以测试这个新功能。

## 兼容性

- 完全向后兼容，不影响现有功能
- 自动处理项目ID格式，支持各种年份格式
- 表单重置时会自动重置年份筛选 