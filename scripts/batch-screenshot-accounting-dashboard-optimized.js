const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const SCREENSHOT_DIR = path.join(__dirname, '../screenshot-album/accounting-dashboard-optimized');

const steps = [
  { action: async (page) => {}, name: 'dashboard' },
  { action: async (page) => await page.getByRole('button', { name: 'Bank Transactions' }).click(), name: 'bank-transactions' },
  { action: async (page) => await page.getByRole('tab', { name: 'Project Account' }).click(), name: 'project-account' },
  { action: async (page) => await page.getByRole('button', { name: '展开筛选' }).click(), name: 'expand-filter' },
  { action: async (page) => await page.getByRole('button', { name: 'Journal Entries' }).click(), name: 'journal-entries' },
  { action: async (page) => await page.getByRole('button', { name: 'Project Accounts' }).click(), name: 'project-accounts' },
  { action: async (page) => await page.getByRole('tab', { name: 'BOD统计' }).click(), name: 'bod-stats' },
  { action: async (page) => await page.getByRole('tab', { name: '预算分析' }).click(), name: 'budget-analysis' },
  { action: async (page) => await page.getByRole('tab', { name: '预算vs实际' }).click(), name: 'budget-vs-actual' },
  { action: async (page) => await page.getByRole('tab', { name: '时间线' }).click(), name: 'timeline' },
  { action: async (page) => await page.getByRole('button', { name: '粘贴导入' }).click(), name: 'paste-import' },
  { action: async (page) => await page.getByRole('button', { name: 'Close' }).click(), name: 'close-paste-import' },
  { action: async (page) => await page.getByRole('button', { name: '导入项目' }).click(), name: 'import-project' },
  { action: async (page) => await page.getByRole('button', { name: 'Close' }).click(), name: 'close-import-project' },
  { action: async (page) => await page.getByRole('button', { name: '新项目' }).click(), name: 'new-project' },
  { action: async (page) => await page.locator('.fixed.inset-0').click(), name: 'close-new-project' },
  { action: async (page) => await page.getByRole('tab', { name: '账户图表' }).click(), name: 'account-chart' },
  { action: async (page) => await page.getByRole('tab', { name: '账户摘要' }).click(), name: 'account-summary' },
  { action: async (page) => await page.getByRole('tab', { name: '全局设置' }).click(), name: 'global-settings' },
  { action: async (page) => await page.getByRole('tab', { name: '项目账户' }).click(), name: 'project-account-tab' },
  { action: async (page) => await page.getByRole('tab', { name: '会员管理' }).click(), name: 'member-management' },
  { action: async (page) => await page.getByRole('tab', { name: '运作管理' }).click(), name: 'operation-management' },
  { action: async (page) => await page.getByRole('button', { name: '高级筛选' }).click(), name: 'advanced-filter' },
  { action: async (page) => await page.getByRole('button', { name: 'Trial Balance' }).click(), name: 'trial-balance' },
  { action: async (page) => await page.getByRole('button', { name: 'Profit & Loss' }).click(), name: 'profit-loss' },
  { action: async (page) => await page.getByRole('button', { name: 'Balance Sheet' }).click(), name: 'balance-sheet' },
  { action: async (page) => await page.getByRole('button', { name: 'Merchandise Management' }).click(), name: 'merchandise-management' },
  { action: async (page) => await page.getByRole('button', { name: 'Membership Fee Management' }).click(), name: 'membership-fee-management' },
  { action: async (page) => await page.getByRole('tab', { name: '缴费记录' }).click(), name: 'payment-records' },
  { action: async (page) => await page.getByRole('tab', { name: '自动提醒' }).click(), name: 'auto-reminder' },
  { action: async (page) => await page.getByRole('button', { name: 'Operation Expense Management' }).click(), name: 'operation-expense-management' },
  { action: async (page) => await page.getByRole('tab', { name: 'GL设置' }).click(), name: 'gl-settings' },
  { action: async (page) => await page.getByRole('button', { name: 'Account Settings' }).click(), name: 'account-settings' },
  { action: async (page) => await page.getByRole('tab', { name: '收支分类' }).click(), name: 'category-management' },
  { action: async (page) => await page.getByRole('tab', { name: '链接管理' }).click(), name: 'link-management' },
  { action: async (page) => await page.getByRole('tab', { name: '公司设置' }).click(), name: 'company-settings' },
  { action: async (page) => await page.getByRole('tab', { name: '偏好设置' }).click(), name: 'preference-settings' },
  { action: async (page) => await page.getByRole('tab', { name: '用户管理' }).click(), name: 'user-management' },
];

(async () => {
  if (!fs.existsSync(SCREENSHOT_DIR)) {
    fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
  }
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto('http://localhost:3000/');

  // 登录
  await page.getByRole('textbox', { name: '邮箱' }).fill('admin@jcikl.com');
  await page.getByRole('textbox', { name: '密码' }).fill('admin123');
  await page.getByRole('button', { name: '登录' }).click();
  await page.waitForTimeout(2000);

  for (const step of steps) {
    try {
      await step.action(page);
      await page.waitForTimeout(800);
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, `${step.name}.jpg`), type: 'jpeg', quality: 90 });
      console.log('已截图:', step.name);
    } catch (e) {
      console.error('步骤失败:', step.name, e);
    }
  }

  await browser.close();
  console.log('批量截图已完成，保存在', SCREENSHOT_DIR);
})();
