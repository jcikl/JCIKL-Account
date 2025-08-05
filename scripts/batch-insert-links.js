const admin = require("firebase-admin");
const serviceAccount = require("./serviceAccountKey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

const links = [
  { title: "第七阶段数据可视化完善测试", path: "/test-bank-transactions-multi-account-advanced-charts", description: "测试多账户银行交易系统的数据可视化功能，包括图表显示、统计分析等", category: "测试" },
  { title: "第六阶段高级功能测试", path: "/test-bank-transactions-multi-account-advanced", description: "多账户银行交易系统高级功能测试", category: "测试" },
  { title: "第五阶段完整功能测试", path: "/test-bank-transactions-multi-account-complete", description: "多账户银行交易系统完整功能测试", category: "测试" },
  { title: "第四阶段增强功能测试", path: "/test-bank-transactions-multi-account-enhanced", description: "多账户银行交易系统增强功能测试", category: "测试" },
  { title: "第三阶段基础功能测试", path: "/test-bank-transactions-multi-account", description: "多账户银行交易系统基础功能测试", category: "测试" },
  { title: "第八阶段导入功能增强测试", path: "/test-bank-transactions-multi-account-import", description: "多账户银行交易系统导入功能增强测试", category: "测试" },
  { title: "多账户银行交易简单测试", path: "/test-multi-account-simple", description: "多账户银行交易简单测试页面", category: "测试" },
  { title: "银行交易编辑功能测试", path: "/test-bank-transactions", description: "银行交易页面的编辑功能测试", category: "测试" },
  { title: "银行交易集成测试", path: "/test-bank-transactions-integrated", description: "银行交易集成测试页面", category: "测试" },
  { title: "银行账户选择器测试", path: "/test-bank-account-selector", description: "银行账户选择器的各种功能测试", category: "账户管理" },
  { title: "银行账户管理", path: "/bank-account-management", description: "银行账户管理页面", category: "账户管理" },
  { title: "项目账户虚拟滚动测试", path: "/project-accounts-virtual", description: "项目账户虚拟滚动测试页面", category: "虚拟滚动" },
  { title: "账户图表虚拟滚动测试", path: "/account-chart-virtual", description: "账户图表虚拟滚动测试页面", category: "虚拟滚动" },
  { title: "银行交易虚拟滚动测试", path: "/bank-transactions-virtual", description: "银行交易虚拟滚动测试页面", category: "虚拟滚动" },
  { title: "性能测试页面", path: "/performance-test", description: "认证持久化性能测试页面", category: "性能测试" },
  { title: "日期筛选性能测试", path: "/date-filter-performance-test", description: "日期筛选性能测试页面", category: "性能测试" },
  { title: "所有页面分页功能测试", path: "/test-all-pagination", description: "所有页面的分页功能测试", category: "分页" },
  { title: "基础分页功能测试", path: "/test-pagination", description: "基础分页功能测试页面", category: "分页" },
  { title: "批量编辑演示", path: "/batch-edit-demo", description: "银行交易记录批量编辑中的项目年份筛选功能演示", category: "功能演示" },
  { title: "增强认证系统演示", path: "/enhanced-auth-demo", description: "增强认证系统演示页面", category: "认证" },
  { title: "分类管理演示", path: "/category-demo", description: "分类管理功能演示页面", category: "功能演示" },
  { title: "交易记录存储演示", path: "/transaction-storage-demo", description: "交易记录存储演示页面", category: "功能演示" },
  { title: "Firebase账户图表演示", path: "/firebase-account-demo", description: "Firebase账户图表集成功能演示", category: "功能演示" },
  { title: "账户图表功能演示", path: "/account-chart-demo", description: "账户图表组件功能演示", category: "功能演示" },
  { title: "按钮显示测试", path: "/test-buttons", description: "项目账户页面的按钮显示逻辑测试", category: "调试" },
  { title: "账户描述功能测试", path: "/description-test", description: "账户描述字段相关功能测试", category: "调试" },
  { title: "粘贴导入功能测试", path: "/import-test", description: "账户图表的粘贴导入功能测试", category: "调试" },
  { title: "简单账户创建测试", path: "/simple-account-test", description: "简单账户创建功能测试", category: "调试" },
  { title: "账户创建调试页面", path: "/debug-account-creation", description: "账户创建调试页面", category: "调试" },
  { title: "账户添加功能测试", path: "/test-account-add", description: "账户添加功能测试页面", category: "调试" },
  { title: "高级筛选功能测试", path: "/test-filter", description: "总账模块的高级筛选功能测试", category: "调试" },
  { title: "自定义认证测试页面", path: "/custom-auth", description: "自定义认证测试页面", category: "认证" }
];

async function batchInsert() {
  const batch = db.batch();
  links.forEach(link => {
    const ref = db.collection("links").doc();
    batch.set(ref, link);
  });
  await batch.commit();
  console.log("批量写入完成！");
}

batchInsert().then(() => process.exit());