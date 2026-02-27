const path = require('path');
const { chromium } = require('playwright-core');
const { parseDashboardTimetable, findTodaySchedule, getCountdownStatus } = require('./timetable');

const PROFILE_DIR = path.resolve(__dirname, '../../mytgs-next-spike/.probe-profile');
const DASHBOARD_URL = 'https://mytgs.fireflycloud.net.au/dashboard';

async function launchContext(headless = true) {
  const base = { headless, viewport: { width: 1360, height: 900 } };
  try {
    return await chromium.launchPersistentContext(PROFILE_DIR, { ...base, channel: 'msedge' });
  } catch {
    try {
      return await chromium.launchPersistentContext(PROFILE_DIR, { ...base, channel: 'chrome' });
    } catch {
      return await chromium.launchPersistentContext(PROFILE_DIR, base);
    }
  }
}

async function fetchDashboardData() {
  const context = await launchContext(true);
  try {
    const page = context.pages()[0] || (await context.newPage());
    await page.goto(DASHBOARD_URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(1500);
    const finalUrl = page.url();
    const title = await page.title();
    const html = await page.content();

    const dayBlocks = parseDashboardTimetable(html);
    const todaySchedule = findTodaySchedule(dayBlocks, new Date());
    const status = getCountdownStatus(todaySchedule, new Date());

    return {
      ok: /dashboard/i.test(finalUrl) && /Dashboard/i.test(title),
      finalUrl,
      title,
      dayBlocks,
      todaySchedule,
      status,
      fetchedAt: new Date().toISOString(),
    };
  } finally {
    await context.close();
  }
}

async function openInteractiveLoginWindow() {
  const context = await launchContext(false);
  const page = context.pages()[0] || (await context.newPage());
  await page.goto(DASHBOARD_URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
  // keep window open for user; return context to allow caller to close later
  return context;
}

module.exports = {
  fetchDashboardData,
  openInteractiveLoginWindow,
};
