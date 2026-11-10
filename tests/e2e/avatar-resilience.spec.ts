import { expect, test } from '@playwright/test';

test.use({ launchOptions: { executablePath: process.env.CARD1_CHROME } });
const email = 'card2-avatar@local.invalid';
const password = 'card2-local-test-only';
const name = 'Card 2 Avatar Player';

test('avatar upload, fallback and persisted companion image', async ({ page, request }, info) => {
  test.skip(process.env.CARD2_ISOLATED !== 'true', 'Requires a disposable local server');
  const restartCheck = process.env.CARD2_RESTART_CHECK === 'true';
  if (!restartCheck) {
    const registration = await request.post('/api/auth/register', { data: { email, password, username: name } });
    expect(registration.status()).toBe(201);
  }
  const login = await request.post('/api/auth/login', { data: { email, password } });
  expect(login.ok()).toBeTruthy();
  const { token } = await login.json();
  const headers = { Authorization: `Bearer ${token}` };
  if (!restartCheck) {
    const apply = await request.post('/api/companions/apply', {
      headers, data: { gameName: 'PUBG Mobile', intro: 'Local avatar acceptance test', hourlyRate: 7 },
    });
    expect(apply.status()).toBe(201);
    const admin = await request.post('/api/auth/login', { data: { email: process.env.ADMIN_EMAIL, password: process.env.ADMIN_PASSWORD } });
    expect(admin.ok()).toBeTruthy();
    const approved = await request.post(`/api/admin/companions/${(await apply.json()).id}/review`, {
      headers: { Authorization: `Bearer ${(await admin.json()).token}` }, data: { action: 'APPROVE' },
    });
    expect(approved.ok()).toBeTruthy();
    const unsignedCommit = await request.post('/api/uploads/commit', { data: { purpose: 'avatar' } });
    expect(unsignedCommit.status()).toBe(401);
  }

  await page.route(/^https?:\/\/(?!127\.0\.0\.1:)/, route => route.abort());
  await page.addInitScript(value => {
    localStorage.setItem('le3eb_locale', 'en');
    localStorage.setItem('business_workbench_token', value);
    sessionStorage.setItem('business_ui_authenticated', '1');
  }, token);
  await page.setViewportSize({ width: 1280, height: 1080 });
  await page.goto('/');
  const card = page.getByRole('button', { name: new RegExp(name) });
  await expect(card).toBeVisible();
  if (!restartCheck) {
    await expect(card.locator('img')).toHaveAttribute('src', '/default-companion.svg');
    await page.screenshot({ path: info.outputPath('default-avatar.png'), fullPage: true });
    await page.getByRole('button', { name: 'Me', exact: true }).click();
    await page.getByText('Settings', { exact: true }).last().click();
    await page.getByText('Edit Profile', { exact: true }).click();
    await page.getByLabel('Change avatar').setInputFiles('client/public/game-fc.jpg');
    await expect(page.getByText('Avatar saved')).toBeVisible();
    await page.goto('/');
  }
  await expect(card.locator('img')).toHaveAttribute('src', /^\/api\/uploads\/avatar\//);
  await expect.poll(() => card.locator('img').evaluate(img => (img as HTMLImageElement).naturalWidth)).toBeGreaterThan(0);
  const avatarUrl = (await card.locator('img').getAttribute('src'))!;
  await page.screenshot({ path: info.outputPath('uploaded-avatar.png'), fullPage: true });
  await card.click();
  await expect(page.getByRole('heading', { name })).toBeVisible();
  await expect(page.locator('.companion-profile')).toHaveCSS('background-color', 'rgb(7, 56, 42)');
  await expect(page.locator('.companion-profile')).toHaveCSS('opacity', '1');
  await expect(page.locator('.companion-profile img').first()).toHaveAttribute('src', avatarUrl);
  await page.screenshot({ path: info.outputPath('emerald-detail.png'), fullPage: true });
  await page.route(`**${avatarUrl}`, route => route.abort());
  await page.goto('/');
  await expect(card.locator('img')).toHaveAttribute('src', '/default-companion.svg');
  await expect.poll(() => card.locator('img').evaluate(img => (img as HTMLImageElement).naturalWidth)).toBeGreaterThan(0);
});
