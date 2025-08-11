const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://localhost:3000';
const SCREENSHOT_DIR = path.join(__dirname, '../screenshot-album/accounting-dashboard-optimized');
const MODULES = [
  { name: 'Dashboard', title: '仪表板概览' },
  { name: 'Bank Transactions', title: '银行流水' },
  { name: 'Project Accounts', title: '项目账户' },
  { name: 'Journal Entries', title: '分录管理' },
  { name: 'Trial Balance', title: '试算平衡表' },
  { name: 'Profit & Loss', title: '损益表' },
  { name: 'Balance Sheet', title: '资产负债表' },
  { name: 'General Ledger', title: '总账' },
  { name: 'Account Settings', title: '账户设置' },
  { name: 'Merchandise Management', title: '商品管理' },
  { name: 'Membership Fee Management', title: '会费管理' },
  { name: 'Operation Expense Management', title: '运营费用管理' },
];

(async () => {
  if (!fs.existsSync(SCREENSHOT_DIR)) {
    fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
  }
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto(`${BASE_URL}/`);

  // 登录（如有登录表单）
  if (await page.locator('input[type="email"]').count() > 0) {
    await page.fill('input[type="email"]', 'admin@jcikl.com');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(2000);
  }

  for (const { name: moduleName, title: mainTitle } of MODULES) {
    // 检查当前模块是否已激活（aria-current="page"或aria-disabled="true"）
    const navSelector = `nav >> text=${moduleName}`;
    const navEl = page.locator(navSelector);
    let isActive = false;
    if (await navEl.count() > 0) {
      const ariaCurrent = await navEl.getAttribute('aria-current');
      const ariaDisabled = await navEl.getAttribute('aria-disabled');
      isActive = ariaCurrent === 'page' || ariaDisabled === 'true';
      if (!isActive) {
        await navEl.click();
        // 等待主内容区标题出现
        if (mainTitle) {
          await page.waitForSelector(`text=${mainTitle}`, { timeout: 10000 });
        } else {
          await page.waitForTimeout(2000);
        }
      }
    }
    // 如果已激活，也等待主内容区标题
    if (mainTitle) {
      await page.waitForSelector(`text=${mainTitle}`, { timeout: 10000 });
    } else {
      await page.waitForTimeout(1000);
    }
    // 截图
    const fileName = `${moduleName.replace(/\s+/g, '_').toLowerCase()}.jpg`;
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, fileName), type: 'jpeg', quality: 90, fullPage: true });
  }

  await browser.close();
  console.log('所有模块截图已完成，保存在', SCREENSHOT_DIR);
})();
