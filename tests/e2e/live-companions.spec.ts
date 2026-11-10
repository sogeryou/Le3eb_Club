import { expect, test } from '@playwright/test';

test.use({ launchOptions: { executablePath: process.env.CARD1_CHROME } });

test('empty directory, approved real record and server-backed booking', async ({ page, request }, info) => {
  test.skip(process.env.CARD1_ISOLATED !== 'true', 'Requires disposable empty storage and the development buyer seed');
  const adminEmail = process.env.ADMIN_EMAIL!;
  const adminPassword = process.env.ADMIN_PASSWORD!;
  const auth = (token: string) => ({ Authorization: `Bearer ${token}` });
  async function login(email: string, password: string) {
    const response = await request.post('/api/auth/login', { data: { email, password } });
    expect(response.ok()).toBeTruthy();
    return (await response.json()).token as string;
  }

  await page.setViewportSize({ width: 1280, height: 1100 });
  await page.goto('/');
  await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
  await expect(page.getByText('لا يوجد رفقاء لعب هنا حالياً.')).toBeVisible();
  await page.screenshot({ path: info.outputPath('empty-home.png'), fullPage: true });

  const email = `card1-${Date.now()}@local.invalid`;
  const password = 'local-test-only-2026';
  const player = 'Card 1 Test Player';
  const registration = await request.post('/api/auth/register', { data: { email, password, username: player } });
  expect(registration.status()).toBe(201);
  const playerToken = await login(email, password);
  const application = await request.post('/api/companions/apply', {
    headers: auth(playerToken), data: { gameName: 'PUBG Mobile', intro: 'Local acceptance account', hourlyRate: 7 },
  });
  expect(application.status()).toBe(201);
  const { id } = await application.json();
  const admin = await login(adminEmail, adminPassword);
  const review = (action: string) => request.post(`/api/admin/companions/${id}/review`, { headers: auth(admin), data: { action } });
  expect((await review('REJECT')).ok()).toBeTruthy();
  expect((await request.get(`/api/companions/${id}`)).status()).toBe(404);
  await page.reload();
  await expect(page.getByText('لا يوجد رفقاء لعب هنا حالياً.')).toBeVisible();
  expect((await review('APPROVE')).ok()).toBeTruthy();

  const buyer = await login('demo@le3eb.club', 'demo123');
  expect((await request.post('/api/orders', { headers: auth(buyer), data: { companionId: 'demo-fake-id', quantity: 1 } })).status()).toBe(404);
  await page.addInitScript(token => {
    localStorage.setItem('business_workbench_token', token);
    sessionStorage.setItem('business_ui_authenticated', '1');
  }, buyer);
  await page.reload();
  const card = page.getByRole('button', { name: new RegExp(player) });
  await expect(card).toContainText('PUBG Mobile');
  await expect(card).toContainText('رفيق جديد');
  await expect(card).toContainText('7');
  await expect(card.locator('img')).toHaveJSProperty('complete', true);
  expect(await card.locator('img').evaluate(image => (image as HTMLImageElement).naturalWidth)).toBeGreaterThan(0);
  await page.screenshot({ path: info.outputPath('registered-companion-home.png'), fullPage: true });
  await page.getByRole('button', { name: 'English' }).click();
  await expect(page.locator('html')).toHaveAttribute('dir', 'ltr');
  await expect(page.getByText('Lumina_Sky')).toHaveCount(0);
  await page.getByRole('button', { name: 'Valorant' }).click();
  await expect(card).toHaveCount(0);
  await page.getByRole('button', { name: 'PUBG Mobile', exact: true }).click();
  await card.click();
  await expect(page.getByRole('heading', { name: player })).toBeVisible();
  await page.getByRole('button', { name: 'Play', exact: true }).click();
  const created = page.waitForResponse(r => r.url().endsWith('/api/orders') && r.request().method() === 'POST');
  await page.getByRole('button', { name: 'Place order' }).click();
  const order = await created;
  expect(order.status()).toBe(201);
  expect(await order.json()).toMatchObject({ companionId: id, unitPrice: 7, totalPrice: 7 });
  await expect(page.getByText('Order created:', { exact: false })).toBeVisible();
  await page.screenshot({ path: info.outputPath('order-created.png'), fullPage: true });
});
