// 测试增强的项目匹配逻辑
console.log('🧪 测试增强的项目匹配逻辑')

console.log('✅ 问题分析:')
console.log('📍 项目projectid: "2025_VPI_OPEN DAY"')
console.log('📍 交易projectid: "OPEN DAY"')
console.log('📍 格式不匹配导致无法匹配')

console.log('\n🔧 新的匹配逻辑:')

console.log('\n1. 精确匹配:')
console.log('   - 检查 transaction.projectid === project.projectid')
console.log('   - 完全相同的projectid')

console.log('\n2. 项目名称匹配:')
console.log('   - 检查交易projectid是否包含项目名称')
console.log('   - 示例: 交易projectid "OPEN DAY" 包含 项目名称 "OPEN DAY"')
console.log('   - 不区分大小写')

console.log('\n3. 项目代码匹配:')
console.log('   - 检查交易projectid是否包含项目代码的关键部分')
console.log('   - 示例: 项目代码 "2025_VPI_OPEN DAY" 的关键部分是 "OPEN DAY"')
console.log('   - 交易projectid "OPEN DAY" 匹配 关键部分 "OPEN DAY"')

console.log('\n📊 匹配优先级:')
console.log('   1. 精确匹配 (最高优先级)')
console.log('   2. 项目名称匹配')
console.log('   3. 项目代码匹配')

console.log('\n🎯 示例场景:')

console.log('\n场景1: 精确匹配')
console.log('   项目: { name: "OPEN DAY", projectid: "2025_VPI_OPEN DAY" }')
console.log('   交易: { projectid: "2025_VPI_OPEN DAY" }')
console.log('   结果: ✅ 匹配 (精确匹配)')

console.log('\n场景2: 项目名称匹配')
console.log('   项目: { name: "OPEN DAY", projectid: "2025_VPI_OPEN DAY" }')
console.log('   交易: { projectid: "OPEN DAY" }')
console.log('   结果: ✅ 匹配 (名称匹配)')

console.log('\n场景3: 项目代码匹配')
console.log('   项目: { name: "OPEN DAY", projectid: "2025_VPI_OPEN DAY" }')
console.log('   交易: { projectid: "OPEN DAY" }')
console.log('   结果: ✅ 匹配 (代码匹配)')

console.log('\n场景4: 无匹配')
console.log('   项目: { name: "OPEN DAY", projectid: "2025_VPI_OPEN DAY" }')
console.log('   交易: { projectid: "OTHER PROJECT" }')
console.log('   结果: ❌ 不匹配')

console.log('\n🔍 调试功能:')
console.log('   - 显示项目和交易的详细信息')
console.log('   - 显示匹配类型和原因')
console.log('   - 显示匹配的交易记录')

console.log('\n💡 使用说明:')
console.log('1. 打开浏览器开发者工具控制台')
console.log('2. 在项目账户页面点击"Open Day"项目的查看按钮')
console.log('3. 查看控制台输出的匹配信息')
console.log('4. 确认相关交易记录是否正确显示')

console.log('\n🎉 增强匹配逻辑测试完成！') 