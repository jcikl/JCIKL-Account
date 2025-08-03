// lib/project-utils.ts
// 项目相关工具函数

import { BODCategories, type BODCategory, type Project } from "./data"

/**
 * 生成项目代码
 * 格式: 项目年份_BOD_项目名称
 * 例如: 2024_P_网站开发项目 -> 2024_P_网站开发项目
 */
export function generateProjectCode(
  projectName: string, 
  bodCategory: BODCategory, 
  existingProjects: Project[] = [],
  projectYear?: number
): string {
  const year = projectYear || new Date().getFullYear()
  const baseCode = `${year}_${bodCategory}_${projectName}`
  
  // 检查代码是否已存在
  let finalCode = baseCode
  let counter = 1
  
  while (existingProjects.some(project => project.projectid === finalCode)) {
    finalCode = `${baseCode}_${counter}`
    counter++
  }
  
  return finalCode
}

/**
 * 验证项目代码格式
 */
export function validateProjectCode(code: string): boolean {
  // 格式: 项目年份_BOD_项目名称
  const codePattern = /^\d{4}_[A-Z_]+_.+$/
  return codePattern.test(code)
}

/**
 * 从项目代码中提取信息
 */
export function parseProjectCode(code: string): {
  year: number
  bodCategory: BODCategory | null
  projectName: string
} | null {
  const parts = code.split('_')
  if (parts.length < 3) return null
  
  const year = parseInt(parts[0])
  const bodCategory = parts[1] as BODCategory
  const projectName = parts.slice(2).join('_')
  
  if (isNaN(year) || !BODCategories[bodCategory]) {
    return null
  }
  
  return {
    year,
    bodCategory,
    projectName
  }
}

/**
 * 获取BOD分类的显示名称
 */
export function getBODDisplayName(bodCategory: BODCategory): string {
  return BODCategories[bodCategory]
}

/**
 * 获取所有BOD分类选项
 */
export function getBODOptions(): Array<{ value: BODCategory; label: string }> {
  return Object.entries(BODCategories).map(([key, value]) => ({
    value: key as BODCategory,
    label: `${key} - ${value}`
  }))
}

/**
 * 按BOD分类统计项目
 */
export function getProjectStatsByBOD(projects: Project[]) {
  const stats: Record<BODCategory, {
    count: number
    totalBudget: number
    totalSpent: number
    totalRemaining: number
    activeCount: number
    completedCount: number
    onHoldCount: number
  }> = {} as any

  // 初始化所有BOD分类的统计
  Object.keys(BODCategories).forEach(category => {
    stats[category as BODCategory] = {
      count: 0,
      totalBudget: 0,
      totalSpent: 0,
      totalRemaining: 0,
      activeCount: 0,
      completedCount: 0,
      onHoldCount: 0
    }
  })

  // 统计每个项目
  projects.forEach(project => {
    const category = project.bodCategory
    if (stats[category]) {
      stats[category].count++
      stats[category].totalBudget += project.budget || 0
      // 注意：spent字段已从Project接口中移除，需要通过其他方式获取
      // 这里暂时使用0，实际应该通过getProjectSpentAmount函数获取
      stats[category].totalSpent += 0
      stats[category].totalRemaining += project.remaining || 0
      
      switch (project.status) {
        case "Active":
          stats[category].activeCount++
          break
        case "Completed":
          stats[category].completedCount++
          break
        case "On Hold":
          stats[category].onHoldCount++
          break
      }
    }
  })

  return stats
}

/**
 * 生成项目代码建议
 */
export function suggestProjectCodes(
  projectName: string,
  bodCategory: BODCategory,
  existingProjects: Project[],
  projectYear?: number
): string[] {
  const suggestions: string[] = []
  const year = projectYear || new Date().getFullYear()
  
  // 生成指定年份的建议
  suggestions.push(generateProjectCode(projectName, bodCategory, existingProjects, year))
  
  // 生成下一年份的建议（如果当前接近年底）
  const currentMonth = new Date().getMonth()
  if (currentMonth >= 10) { // 11月或12月
    const nextYear = year + 1
    const nextYearCode = `${nextYear}_${bodCategory}_${projectName}`
    if (!existingProjects.some(project => project.projectid === nextYearCode)) {
      suggestions.push(nextYearCode)
    }
  }
  
  return suggestions
} 