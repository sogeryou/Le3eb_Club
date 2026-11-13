import { chromium } from '@playwright/test';

const origin = process.argv[2] || 'http://127.0.0.1:4348';
const locale = process.argv[3] === 'ar' ? 'ar' : 'en';
const screenshot = process.argv[4];
const browser = await chromium.launch({ channel: 'chrome', headless: true });
try {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  const errors = [];
  const requests = [];
  page.on('pageerror', error => errors.push({ kind: 'page', message: error.message }));
  page.on('console', async message => {
    if (message.type() !== 'error') return;
    const args = await Promise.all(message.args().map(arg => arg.jsonValue().catch(() => null)));
    errors.push({ kind: 'console', message: message.text(), args });
  });
  page.on('response', response => {
    if (response.status() >= 400) requests.push({ status: response.status(), url: response.url() });
  });
  await page.addInitScript(value => localStorage.setItem('le3eb_locale', value), locale);
  await page.goto(origin, { waitUntil: 'networkidle' });
  const brokenImages = await page.locator('img').evaluateAll(elements => elements
    .filter(element => !element.complete || element.naturalWidth === 0)
    .map(element => ({ src: element.src, alt: element.alt })));
  const body = await page.locator('body').innerText();
  if (screenshot) await page.screenshot({ path: screenshot, fullPage: true });
  const report = {
    origin, locale, direction: await page.locator('html').getAttribute('dir'),
    errors, requests, brokenImages, body,
  };
  console.log(JSON.stringify(report, null, 2));
  if (errors.length || brokenImages.length || requests.length || !body.trim()) process.exitCode = 1;
} finally {
  await browser.close();
}
