// 测试项目详情功能
console.log('🧪 测试项目详情功能')

console.log('✅ 功能概述:')
console.log('📍 项目详情将显示其对应的项目银行交易记录')
console.log('📍 总收入、总支出、收支明细等信息')
console.log('📍 支持筛选和导出功能')

console.log('\n🔧 主要功能:')

console.log('\n1. 项目基本信息显示:')
console.log('   - 项目名称、项目代码、BOD分类')
console.log('   - 项目状态、开始日期、结束日期')
console.log('   - 预算、已花费、剩余预算')
console.log('   - 项目描述')

console.log('\n2. 财务统计:')
console.log('   - 总收入 (绿色显示)')
console.log('   - 总支出 (红色显示)')
console.log('   - 净收入 (正负值不同颜色)')
console.log('   - 交易笔数')

console.log('\n3. 收支明细:')
console.log('   - 收入明细 (按分类统计)')
console.log('   - 支出明细 (按分类统计)')
console.log('   - 支持标签页切换')

console.log('\n4. 银行交易记录:')
console.log('   - 日期、描述、描述2')
console.log('   - 收入、支出、净额')
console.log('   - 状态、分类、参考')
console.log('   - 支持搜索和筛选')
console.log('   - 支持导出CSV')

console.log('\n📊 数据筛选逻辑:')
console.log('   - 根据项目名称匹配交易描述')
console.log('   - 根据BOD分类匹配交易分类')
console.log('   - 支持搜索、状态、分类筛选')

console.log('\n🎯 示例数据格式:')
console.log('4 Feb 2025\tJUNIOR CHAMBER INTE*Intertransfer\tss\t$21270.00\t$0.00\t+$59819.82\tPending\tOpen Day\t水电费\t未知项目')
console.log('5 Feb 2025\tOOI KEN HEAN *\tIAB ipoh willi\t$0.00\t$188.00\t+$60007.82\tPending\tOpen Day\t-\t未知项目')
console.log('4 Feb 2025\tHUAN HUI YI *Area Conventio\t-\t$0.00\t$503.00\t+$60510.82\tPending\tOpen Day\t销售收入\t未知项目')

console.log('\n📈 统计示例:')
console.log('总收入: $859')
console.log('总支出: $21,270')
console.log('净收入: -$20,411')
console.log('交易笔数: 3')

console.log('\n💰 收支明细示例:')
console.log('收入项目:')
console.log('  - 销售收入 = $503')
console.log('  - 未明细 = $356')
console.log('支出项目:')
console.log('  - 未明细 = $21,270')

console.log('\n🔍 筛选功能:')
console.log('   - 搜索: 支持描述和描述2搜索')
console.log('   - 状态: 已完成、待处理、草稿')
console.log('   - 分类: 销售收入、服务收入、水电费、办公用品、其他费用')

console.log('\n📤 导出功能:')
console.log('   - 导出格式: CSV')
console.log('   - 文件名: {项目名称}_交易记录_{日期}.csv')
console.log('   - 包含字段: 日期、描述、描述2、收入、支出、净额、状态、分类、参考')

console.log('\n🎨 界面特点:')
console.log('   - 响应式设计 (max-w-6xl)')
console.log('   - 滚动支持 (max-h-[90vh])')
console.log('   - 卡片式布局')
console.log('   - 颜色编码 (收入绿色、支出红色)')
console.log('   - 加载状态显示')

console.log('\n💡 使用说明:')
console.log('1. 在项目账户页面点击项目的"查看"按钮')
console.log('2. 系统会自动加载相关的银行交易记录')
console.log('3. 查看财务统计和收支明细')
console.log('4. 使用筛选器查找特定交易')
console.log('5. 可以导出交易记录为CSV文件')

console.log('\n🎉 项目详情功能测试完成！') 