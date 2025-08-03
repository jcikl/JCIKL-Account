import * as XLSX from 'xlsx'
import jsPDF from 'jspdf'
import 'jspdf-autotable'
import type { Account } from './data'

export interface ExportOptions {
  format: 'csv' | 'excel' | 'pdf'
  includeStats: boolean
  includeTypeDistribution: boolean
  includeDetails: boolean
  selectedAccountsOnly: boolean
  selectedAccountIds?: Set<string> // 新增：选中的账户ID集合
}

export interface AccountStats {
  totalAccounts: number
  totalBalance: number
  positiveAccounts: number
  negativeAccounts: number
  typeStats: Array<{
    type: string
    count: number
    totalBalance: number
    percentage: number
  }>
}

// 计算账户统计信息
export function calculateAccountStats(accounts: Account[]): AccountStats {
  const totalAccounts = accounts.length
  const totalBalance = accounts.reduce((sum, account) => sum + account.balance, 0)
  const positiveAccounts = accounts.filter(account => account.balance > 0).length
  const negativeAccounts = accounts.filter(account => account.balance < 0).length

  const accountTypes = [...new Set(accounts.map(account => account.type))]
  const typeStats = accountTypes.map(type => {
    const accountsOfType = accounts.filter(account => account.type === type)
    const totalBalanceOfType = accountsOfType.reduce((sum, account) => sum + account.balance, 0)
    return {
      type,
      count: accountsOfType.length,
      totalBalance: totalBalanceOfType,
      percentage: (accountsOfType.length / totalAccounts) * 100
    }
  })

  return {
    totalAccounts,
    totalBalance,
    positiveAccounts,
    negativeAccounts,
    typeStats
  }
}

// 导出为CSV
export function exportToCSV(accounts: Account[], options: ExportOptions): void {
  const dataToExport = options.selectedAccountsOnly && options.selectedAccountIds
    ? accounts.filter(account => options.selectedAccountIds!.has(account.id!))
    : accounts

  const csvData = dataToExport.map(account => ({
    '账户代码': account.code,
    '账户名称': account.name,
    '账户类型': account.type,
    '当前余额': account.balance,
    '状态': account.balance > 0 ? '正余额' : account.balance < 0 ? '负余额' : '零余额',
    '描述': account.description || ''
  }))

  const ws = XLSX.utils.json_to_sheet(csvData)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, '账户数据')
  
  const fileName = `账户数据_${new Date().toISOString().split('T')[0]}.csv`
  XLSX.writeFile(wb, fileName)
}

// 导出为Excel
export function exportToExcel(accounts: Account[], options: ExportOptions): void {
  const dataToExport = options.selectedAccountsOnly && options.selectedAccountIds
    ? accounts.filter(account => options.selectedAccountIds!.has(account.id!))
    : accounts

  const wb = XLSX.utils.book_new()

  // 账户详情工作表
  if (options.includeDetails) {
    const accountData = dataToExport.map(account => ({
      '账户代码': account.code,
      '账户名称': account.name,
      '账户类型': account.type,
      '当前余额': account.balance,
      '状态': account.balance > 0 ? '正余额' : account.balance < 0 ? '负余额' : '零余额',
      '描述': account.description || '',
      '父账户': account.parent || ''
    }))

    const ws = XLSX.utils.json_to_sheet(accountData)
    XLSX.utils.book_append_sheet(wb, ws, '账户详情')
  }

  // 统计信息工作表
  if (options.includeStats) {
    const stats = calculateAccountStats(dataToExport)
    const statsData = [
      { '指标': '总账户数', '数值': stats.totalAccounts },
      { '指标': '总余额', '数值': stats.totalBalance },
      { '指标': '正余额账户数', '数值': stats.positiveAccounts },
      { '指标': '负余额账户数', '数值': stats.negativeAccounts }
    ]

    const ws = XLSX.utils.json_to_sheet(statsData)
    XLSX.utils.book_append_sheet(wb, ws, '统计信息')
  }

  // 类型分布工作表
  if (options.includeTypeDistribution) {
    const stats = calculateAccountStats(dataToExport)
    const typeData = stats.typeStats.map(stat => ({
      '账户类型': stat.type,
      '账户数量': stat.count,
      '总余额': stat.totalBalance,
      '占比(%)': stat.percentage.toFixed(2)
    }))

    const ws = XLSX.utils.json_to_sheet(typeData)
    XLSX.utils.book_append_sheet(wb, ws, '类型分布')
  }

  const fileName = `账户数据_${new Date().toISOString().split('T')[0]}.xlsx`
  XLSX.writeFile(wb, fileName)
}

// 导出为PDF
export function exportToPDF(accounts: Account[], options: ExportOptions): void {
  const dataToExport = options.selectedAccountsOnly && options.selectedAccountIds
    ? accounts.filter(account => options.selectedAccountIds!.has(account.id!))
    : accounts

  const doc = new jsPDF()
  let yPosition = 20

  // 标题
  doc.setFontSize(20)
  doc.text('账户数据报告', 105, yPosition, { align: 'center' })
  yPosition += 20

  // 生成日期
  doc.setFontSize(12)
  doc.text(`生成日期: ${new Date().toLocaleDateString('zh-CN')}`, 20, yPosition)
  yPosition += 15

  // 统计信息
  if (options.includeStats) {
    const stats = calculateAccountStats(dataToExport)
    
    doc.setFontSize(16)
    doc.text('统计概览', 20, yPosition)
    yPosition += 10

    doc.setFontSize(12)
    doc.text(`总账户数: ${stats.totalAccounts}`, 20, yPosition)
    yPosition += 7
    doc.text(`总余额: $${stats.totalBalance.toLocaleString()}`, 20, yPosition)
    yPosition += 7
    doc.text(`正余额账户: ${stats.positiveAccounts}`, 20, yPosition)
    yPosition += 7
    doc.text(`负余额账户: ${stats.negativeAccounts}`, 20, yPosition)
    yPosition += 15
  }

  // 类型分布
  if (options.includeTypeDistribution) {
    const stats = calculateAccountStats(dataToExport)
    
    doc.setFontSize(16)
    doc.text('账户类型分布', 20, yPosition)
    yPosition += 10

    const typeTableData = stats.typeStats.map(stat => [
      stat.type,
      stat.count.toString(),
      `$${stat.totalBalance.toLocaleString()}`,
      `${stat.percentage.toFixed(1)}%`
    ])

    ;(doc as any).autoTable({
      startY: yPosition,
      head: [['账户类型', '账户数量', '总余额', '占比']],
      body: typeTableData,
      theme: 'grid',
      headStyles: { fillColor: [66, 139, 202] }
    })

    yPosition = (doc as any).lastAutoTable.finalY + 10
  }

  // 账户详情
  if (options.includeDetails) {
    doc.setFontSize(16)
    doc.text('账户详情', 20, yPosition)
    yPosition += 10

    const accountTableData = dataToExport.map(account => [
      account.code,
      account.name,
      account.type,
      `$${account.balance.toLocaleString()}`,
      account.balance > 0 ? '正余额' : account.balance < 0 ? '负余额' : '零余额',
      account.description || ''
    ])

    ;(doc as any).autoTable({
      startY: yPosition,
      head: [['账户代码', '账户名称', '账户类型', '当前余额', '状态', '描述']],
      body: accountTableData,
      theme: 'grid',
      headStyles: { fillColor: [66, 139, 202] },
      styles: { fontSize: 8 }
    })
  }

  const fileName = `账户数据_${new Date().toISOString().split('T')[0]}.pdf`
  doc.save(fileName)
}

// 主导出函数
export function exportAccountData(accounts: Account[], options: ExportOptions): void {
  try {
    switch (options.format) {
      case 'csv':
        exportToCSV(accounts, options)
        break
      case 'excel':
        exportToExcel(accounts, options)
        break
      case 'pdf':
        exportToPDF(accounts, options)
        break
      default:
        throw new Error('不支持的导出格式')
    }
  } catch (error) {
    console.error('导出失败:', error)
    throw error
  }
} 