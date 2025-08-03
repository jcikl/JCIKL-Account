# 简化项目粘贴导入功能总结

## 🎯 功能概述

根据用户需求，项目粘贴导入功能已简化为只接受三个必需字段：**项目名称**、**BOD分类**和**开始日期**。所有数据将以大写字母存储到Firebase。

## 🔧 主要修改

### 1. 数据格式简化

#### 修改前
```csv
项目名称,BOD分类,预算,已支出,剩余金额,状态,开始日期,结束日期,描述,负责人
社区服务项目,P,50000,15000,35000,Active,2024-01-15,,社区服务活动,user1
```

#### 修改后
```csv
项目名称,BOD分类,开始日期
社区服务项目,P,2024-01-15
教育培训项目,HT,2024-02-01
医疗健康项目,EVP,2024-01-20
```

### 2. 字段验证逻辑

#### 项目名称验证
```tsx
// 验证项目名称（转换为大写）
const normalizedName = name ? name.trim().toUpperCase() : ''
if (!normalizedName) {
  errors.push("项目名称不能为空")
}
```

#### BOD分类验证（不区分大小写）
```tsx
// 验证BOD分类（不区分大小写，转换为大写）
const normalizedBODCategory = bodCategory ? bodCategory.trim().toUpperCase() : ''
if (!normalizedBODCategory || !Object.keys(BODCategories).includes(normalizedBODCategory)) {
  errors.push(`无效的BOD分类: ${bodCategory}，有效值: ${Object.keys(BODCategories).join(', ')}`)
}
```

#### 开始日期验证
```tsx
// 验证开始日期
if (!startDate || !isValidDate(startDate)) {
  errors.push(`无效的开始日期: ${startDate}`)
}
```

### 3. 数据存储规则

#### 新项目创建
```tsx
const newProjectData = {
  name: projectData.name.toUpperCase(), // 转换为大写
  code: projectData.code,
  bodCategory: projectData.bodCategory.toUpperCase(), // 转换为大写
  startDate: projectData.startDate,
  budget: 0, // 默认值
  spent: 0, // 默认值
  remaining: 0, // 默认值
  status: "Active" as const, // 默认状态
  description: "", // 默认空描述
  assignedToUid: "" // 默认空负责人
}
```

#### 现有项目更新
```tsx
// 只更新开始日期
const updateData = {
  startDate: projectData.startDate
}
```

### 4. 预览表格简化

#### 修改前
- 显示所有字段：项目名称、BOD分类、预算、已支出、剩余、状态、开始日期

#### 修改后
- 只显示核心字段：项目名称、BOD分类、开始日期、项目代码、操作

## 🎯 支持的BOD分类

| 代码 | 全称 | 说明 |
|------|------|------|
| P | President | 主席 |
| HT | Honorary Treasurer | 荣誉财务主管 |
| EVP | Executive Vice President | 执行副主席 |
| LS | Legal Secretary | 法律秘书 |
| GLC | General Legal Counsel | 总法律顾问 |
| IND_VP | Internal Vice President | 内部副主席 |
| BIZ_VP | Business Vice President | 商业副主席 |
| INT_VP | International Vice President | 国际副主席 |
| COM_VP | Community Vice President | 社区副主席 |
| LOM_VP | Liaison Officer Manager Vice President | 联络官管理副主席 |

## 📊 数据验证规则

### 1. 字段数量验证
- **要求**: 至少3个字段
- **错误信息**: `字段数量不足，需要至少3个字段（项目名称、BOD分类、开始日期），当前只有${fields.length}个`

### 2. 项目名称验证
- **要求**: 不能为空
- **处理**: 自动转换为大写
- **错误信息**: `项目名称不能为空`

### 3. BOD分类验证
- **要求**: 必须是有效的BOD分类代码
- **特点**: 不区分大小写（p、P、ht、HT等都可以）
- **处理**: 自动转换为大写
- **错误信息**: `无效的BOD分类: ${bodCategory}，有效值: ${Object.keys(BODCategories).join(', ')}`

### 4. 开始日期验证
- **要求**: 必须是有效的日期格式
- **支持格式**: YYYY-MM-DD、YYYY/MM/DD等
- **错误信息**: `无效的开始日期: ${startDate}`

### 5. 重复项目检查
- **检查条件**: 项目名称和BOD分类组合
- **比较方式**: 使用大写值进行比较
- **处理**: 如果勾选"更新现有项目"，则更新开始日期；否则报错

## 💾 存储规则

### 1. 数据转换
- **项目名称**: `name.trim().toUpperCase()`
- **BOD分类**: `bodCategory.trim().toUpperCase()`
- **开始日期**: 保持原格式

### 2. 默认值设置
- **预算**: 0
- **已支出**: 0
- **剩余金额**: 0
- **状态**: "Active"
- **描述**: ""
- **负责人**: ""

### 3. 项目代码生成
- **自动生成**: 基于项目名称、BOD分类和现有项目
- **格式**: `年份_BOD_项目名称`
- **示例**: `2024_P_社区服务项目`

## 🎯 使用方法

### 1. 准备数据
```csv
项目名称,BOD分类,开始日期
社区服务项目,P,2024-01-15
教育培训项目,HT,2024-02-01
医疗健康项目,EVP,2024-01-20
```

### 2. 导入步骤
1. 在项目账户页面点击"粘贴导入"按钮
2. 从Excel或其他来源复制项目数据
3. 在对话框中粘贴数据
4. 系统自动解析和验证数据
5. 预览确认数据正确性
6. 点击"导入项目"完成导入

### 3. 注意事项
- 确保数据格式正确（3个字段，逗号分隔）
- BOD分类不区分大小写
- 日期格式建议使用YYYY-MM-DD
- 重复项目需要勾选"更新现有项目"选项

## 🔍 错误处理

### 1. 常见错误
- **字段数量不足**: 检查数据格式，确保有3个字段
- **无效BOD分类**: 检查BOD分类代码是否正确
- **无效日期**: 检查日期格式是否正确
- **项目已存在**: 勾选"更新现有项目"选项

### 2. 错误显示
- 在预览表格中显示错误图标
- 在错误详情区域显示具体错误信息
- 错误行不会包含在导入数据中

## 📈 预览功能

### 1. 预览表格
- **状态**: 显示验证状态（✓ 或 ✗）
- **项目名称**: 显示大写格式的项目名称
- **BOD分类**: 显示大写格式的BOD分类
- **开始日期**: 显示格式化的日期
- **项目代码**: 显示自动生成的代码
- **操作**: 显示更新/新增标识

### 2. 统计信息
- **有效项目数**: 通过验证的项目数量
- **无效项目数**: 未通过验证的项目数量
- **新增项目数**: 新创建的项目数量
- **更新项目数**: 更新的现有项目数量

## 🎉 总结

简化后的项目粘贴导入功能具有以下特点：

1. **简化数据格式**: 只需要3个必需字段
2. **不区分大小写**: BOD分类支持任意大小写
3. **自动大写存储**: 所有数据以大写格式存储
4. **智能验证**: 全面的数据验证和错误提示
5. **灵活更新**: 支持更新现有项目的开始日期
6. **用户友好**: 清晰的预览和错误提示

用户现在可以使用更简单的数据格式快速导入项目，同时确保数据的一致性和准确性。 