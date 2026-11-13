import { chromium } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import assert from 'node:assert/strict';

const origin = process.env.CARD8_ORIGIN || 'http://127.0.0.1:4350';
if (!/^http:\/\/(127\.0\.0\.1|localhost):\d+$/.test(origin)) throw new Error('Local acceptance servers only');
const out = process.env.CARD8_EVIDENCE || 'test-results/card8';
mkdirSync(out, { recursive: true });
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const errors = [], proof = [], captures = [];
const runId = Date.now().toString(36);
let activePage;
const pause = page => page.waitForTimeout(400);
async function createPage(desktop = false) {
  const context = await browser.newContext({ viewport: desktop ? { width: 1440, height: 1000 } : { width: 390, height: 844 } });
  const page = await context.newPage();
  page.setDefaultTimeout(12000);
  page.on('pageerror', error => errors.push(error.message));
  page.on('dialog', dialog => dialog.accept());
  await page.goto(origin, { waitUntil: 'networkidle' });
  await language(page, 'en');
  return page;
}
async function language(page, value) {
  await page.evaluate(value => localStorage.setItem('le3eb_locale', value), value);
  await page.reload({ waitUntil: 'networkidle' });
}
async function home(page) { activePage = page; await page.goto(origin, { waitUntil: 'networkidle' }); }
async function nav(page, index) { await page.locator('nav button').nth(index).click(); await pause(page); }
async function get(page, path) {
  return page.evaluate(async path => {
    const response = await fetch(path, { headers: { Authorization: `Bearer ${localStorage.getItem('business_workbench_token')}` } });
    if (!response.ok) throw new Error(`${path}: ${response.status}`);
    return response.json();
  }, path);
}
function record(step, data) { const entry = { step, data }; proof.push(entry); console.log('PASS ' + JSON.stringify(entry)); }
async function capture(page, name) {
  await pause(page);
  const broken = await page.locator('img').evaluateAll(elements => elements.filter(element => !element.complete || element.naturalWidth === 0).map(element => element.src));
  assert.deepEqual(broken, [], `${name}: broken images`);
  await page.screenshot({ path: `${out}/${name}.jpg`, type: 'jpeg', quality: 82, fullPage: true, animations: 'disabled' });
  captures.push(name);
  console.log('SCREENSHOT ' + name);
}
async function authenticate(page, email, password, username) {
  await home(page); await nav(page, 3);
  await page.getByRole('button', { name: 'Login / Sign up', exact: true }).click();
  if (username) {
    await page.getByRole('button', { name: 'No account? Register now', exact: true }).click();
    await page.getByPlaceholder('username', { exact: true }).fill(username);
  }
  await page.locator('input[type="email"]').fill(email);
  await page.locator('input[type="password"]').fill(password);
  await page.getByRole('button', { name: username ? 'Create account' : 'Login', exact: true }).click();
  await page.locator('input[type="password"]').waitFor({ state: 'hidden' });
  await pause(page);
  return get(page, '/api/auth/session');
}
async function mainScreens(page, locale) {
  await language(page, locale);
  assert.equal(await page.locator('html').getAttribute('dir'), locale === 'ar' ? 'rtl' : 'ltr');
  await capture(page, `home-${locale}`);
  await page.getByText('PUBG Mobile', { exact: true }).first().click(); await pause(page);
  await capture(page, `game-${locale}`);
  await page.getByText('[LOCAL] PUBG Player', { exact: true }).first().click(); await pause(page);
  await capture(page, `profile-${locale}`);
  await home(page); await nav(page, 1); await capture(page, `community-${locale}`);
  await home(page); await nav(page, 2);
  await page.getByText('[LOCAL] PUBG Player', { exact: true }).first().waitFor();
  await capture(page, `messages-${locale}`);
  await page.getByText('[LOCAL] PUBG Player', { exact: true }).first().click();
  await page.getByText('Card8 player reply ' + runId, { exact: true }).waitFor();
  await capture(page, `chat-${locale}`);
  await home(page); await nav(page, 3); await capture(page, `me-${locale}`);
  await page.getByRole('button', { name: locale === 'ar' ? 'المحفظة' : 'Wallet', exact: true }).click();
  await page.getByText(locale === 'ar' ? 'شحن العملات' : 'Recharge Coins', { exact: true }).first().waitFor();
  await capture(page, `wallet-${locale}`);
  await page.getByRole('button', { name: locale === 'ar' ? 'شحن العملات' : 'Recharge Coins', exact: true }).click();
  await page.locator('[data-recharge-package]').first().waitFor();
  await capture(page, `recharge-${locale}`);
  await home(page); await nav(page, 3);
  await page.getByRole('button', { name: locale === 'ar' ? 'الإعدادات' : 'Settings', exact: true }).click(); await pause(page);
  await capture(page, `settings-${locale}`);
}
async function application(page, locale, submit) {
  const text = (english, arabic) => locale === 'ar' ? arabic : english;
  await language(page, locale); await nav(page, 3);
  await page.getByRole('button', { name: /Become a Player|انضم كلاعب/ }).click();
  await page.getByRole('button', { name: 'Valorant', exact: true }).waitFor();
  await capture(page, `application-step1-${locale}`);
  await page.getByRole('button', { name: 'Valorant', exact: true }).click();
  await page.getByRole('button', { name: text('Next Step', 'الخطوة التالية'), exact: true }).click();
  await page.locator('textarea').fill('Card8 application ' + runId);
  await page.getByPlaceholder('e.g. Aggressive, Strategic, Chill').fill('Strategic');
  await capture(page, `application-step2-${locale}`);
  await page.getByRole('button', { name: text('Next Step', 'الخطوة التالية'), exact: true }).click(); await pause(page);
  await capture(page, `application-step3-${locale}`);
  await page.getByRole('button', { name: text('Next Step', 'الخطوة التالية'), exact: true }).click();
  await page.getByRole('button', { name: text('Add Service', 'إضافة خدمة'), exact: true }).click();
  await page.getByPlaceholder('e.g. Pro Carry Service').fill('Valorant session');
  await page.getByPlaceholder('Hourly price in coins').fill('7');
  await page.getByRole('button', { name: text('Add Service', 'إضافة خدمة'), exact: true }).click();
  await page.getByRole('button', { name: text('Submit Application', 'إرسال الطلب'), exact: true }).waitFor();
  await capture(page, `application-step4-${locale}`);
  if (submit) {
    await page.getByRole('button', { name: text('Submit Application', 'إرسال الطلب'), exact: true }).click();
    await page.getByText('Application submitted for review.', { exact: true }).waitFor();
    const profile = await get(page, '/api/companions/me');
    assert.equal(profile.status, 'PENDING_REVIEW');
    const listed = await get(page, '/api/companions');
    assert.ok(!listed.some(row => row.id === profile.id));
    record('ui-application-pending-not-public', profile);
    return profile;
  }
}
try {
  const buyer = await createPage(); activePage = buyer;
  const account = await authenticate(buyer, `card8-${runId}@local.le3eb.invalid`, 'Card8-UI-Only-2026!', `Card8 Buyer ${runId}`);
  record('ui-register-login', { id: account.id, username: account.username });
  await buyer.getByRole('button', { name: 'Wallet', exact: true }).click();
  await buyer.locator('[data-recharge-package]').first().click();
  await buyer.waitForFunction(() => !document.body.innerText.includes('Processing Payment'));
  const wallet = await get(buyer, '/api/wallet/balance'); assert.equal(wallet.balance, 100);
  record('ui-recharge-$1-100-coins', wallet);
  await home(buyer); await buyer.getByText('[LOCAL] PUBG Player', { exact: true }).click();
  await buyer.getByRole('button', { name: 'Play', exact: true }).click();
  await buyer.getByRole('button', { name: 'Place order', exact: true }).click();
  await buyer.getByText('Order Details', { exact: true }).waitFor();
  const order = (await get(buyer, '/api/orders')).at(-1); assert.equal(order.status, 'CREATED'); record('ui-order-created', order);
  const player = await createPage(); activePage = player;
  await authenticate(player, 'pubg@local.le3eb.invalid', 'Local-Only-Le3eb-2026!');
  await player.getByRole('button', { name: 'Player Center', exact: true }).click();
  await player.getByRole('button', { name: 'Player Orders', exact: true }).click();
  await player.getByRole('button', { name: 'Details', exact: true }).first().click();
  for (const label of ['Accept Order', 'Start Service', 'Complete Service']) await player.getByRole('button', { name: label, exact: true }).click();
  await player.getByText('Completed', { exact: true }).first().waitFor();
  assert.equal((await get(buyer, '/api/wallet/balance')).balance, 100 - order.totalPrice);
  const finalOrder = (await get(player, '/api/orders')).find(row => row.id === order.id); assert.equal(finalOrder.status, 'COMPLETED');
  record('ui-order-completed', finalOrder);
  await home(buyer); await nav(buyer, 3); await buyer.getByRole('button', { name: 'Purchase History', exact: true }).click();
  await buyer.getByRole('button', { name: 'Rate', exact: true }).first().click();
  await buyer.locator('textarea').fill('Card8 verified UI review ' + runId);
  await buyer.getByRole('button', { name: 'Submit Review', exact: true }).click();
  await buyer.locator('textarea').waitFor({ state: 'hidden' }); record('ui-review', await get(buyer, '/api/reviews'));
  await buyer.getByRole('button', { name: 'Chat', exact: true }).first().click();
  await buyer.locator('form input, form textarea').first().fill('Card8 buyer hello ' + runId);
  await buyer.getByRole('button', { name: 'Send', exact: true }).click();
  await buyer.getByText('Card8 buyer hello ' + runId, { exact: true }).waitFor();
  await player.getByRole('button', { name: 'Contact other party', exact: true }).click();
  await player.locator('form input, form textarea').first().waitFor();
  record('chat-participant-verification', { sender: await get(buyer, '/api/conversations'), receiver: await get(player, '/api/conversations'), receiverUser: await get(player, '/api/auth/session') });
  await player.getByText('Card8 buyer hello ' + runId, { exact: true }).waitFor();
  await player.locator('form input, form textarea').first().fill('Card8 player reply ' + runId);
  await player.getByRole('button', { name: 'Send', exact: true }).click();
  await buyer.getByText('Card8 player reply ' + runId, { exact: true }).waitFor(); record('ui-chat-roundtrip', await get(buyer, '/api/conversations'));
  await mainScreens(buyer, 'en'); await mainScreens(buyer, 'ar');
  const applicant = await createPage(); activePage = applicant;
  const applicantUser = await authenticate(applicant, `card8-apply-${runId}@local.le3eb.invalid`, 'Card8-UI-Only-2026!', `Card8 Applicant ${runId}`);
  const profile = await application(applicant, 'en', true);
  const admin = await createPage(true); activePage = admin;
  await admin.goto(origin + '/admin', { waitUntil: 'networkidle' });
  await admin.locator('input[type="email"]').fill('admin@local.le3eb.invalid');
  await admin.locator('input[type="password"]').fill('Local-Only-Le3eb-2026!');
  await admin.getByRole('button', { name: 'Login', exact: true }).click();
  await admin.getByRole('button', { name: 'Companion Review', exact: true }).click();
  const row = admin.locator('tr').filter({ hasText: applicantUser.username });
  await Promise.all([admin.waitForResponse(response => response.url().endsWith(`/api/admin/companions/${profile.id}/review`) && response.status() === 200), row.getByRole('button', { name: '通过', exact: true }).click()]);
  await row.waitFor({ state: 'hidden' });
  const publicRows = await get(buyer, '/api/companions'); assert.ok(publicRows.some(value => value.id === profile.id)); record('ui-admin-approved-public-listing', profile.id);
  await capture(admin, 'admin-review-proof');
  await applicant.reload({ waitUntil: 'networkidle' });
  await applicant.getByText(applicantUser.username, { exact: true }).first().waitFor();
  assert.equal((await get(applicant, '/api/companions/me')).status, 'APPROVED');
  await capture(applicant, 'approved-companion-public');
  const arApplicant = await createPage(); activePage = arApplicant;
  await authenticate(arApplicant, `card8-ar-${runId}@local.le3eb.invalid`, 'Card8-UI-Only-2026!', `Card8 Arabic ${runId}`);
  await application(arApplicant, 'ar', false);
  await language(buyer, 'en'); await nav(buyer, 3);
  await buyer.getByRole('button', { name: 'Settings', exact: true }).click();
  await buyer.getByRole('button', { name: 'Logout Account', exact: true }).click();
  await buyer.getByText('Search', { exact: true }).first().waitFor();
  assert.equal(await buyer.evaluate(() => localStorage.getItem('business_workbench_token')), null);
  await authenticate(buyer, 'buyer1@local.le3eb.invalid', 'Local-Only-Le3eb-2026!');
  assert.equal((await get(buyer, '/api/wallet/balance')).balance, 0);
  assert.deepEqual(await get(buyer, '/api/orders'), []);
  assert.deepEqual(await get(buyer, '/api/conversations'), []);
  record('logout-and-account-isolation', 'old token cleared; second account has zero balance and no old orders/messages');
  assert.deepEqual(errors, []);
  console.log('ACCEPTANCE COMPLETE ' + JSON.stringify({ runId, proof, screenshots: captures, errors }));
} catch (error) {
  console.error('ACCEPTANCE FAILED', error);
  for (const [index, context] of browser.contexts().entries()) for (const page of context.pages()) {
    console.error(`CONTEXT ${index} ${page.url()} ${(await page.locator('body').innerText()).slice(-1600)}`);
  }
  if (activePage) { console.error((await activePage.locator('body').innerText()).slice(-3000)); await activePage.screenshot({ path: out + '/failure.jpg', fullPage: true }).catch(() => {}); }
  process.exitCode = 1;
} finally { await browser.close(); }
