import { expect, test } from '@playwright/test';

test.use({ launchOptions: { executablePath: process.env.CARD1_CHROME } });

test('real catalog, zero/one online companion and explicit legacy resolution', async ({ page, request, browser, baseURL }, info) => {
  test.skip(process.env.CARD6_ISOLATED !== 'true', 'Requires a disposable zero-public-companion fixture');
  page.setDefaultTimeout(10_000);
  const auth = (token: string) => ({ Authorization: `Bearer ${token}` });
  const login = async (email: string, password: string) => {
    const result = await request.post('/api/auth/login', { data: { email, password } });
    expect(result.ok()).toBeTruthy();
    return (await result.json()).token as string;
  };
  const readGames = async () => (await (await request.get('/api/games')).json()) as { id: string; name: string; onlineCompanions: number }[];
  expect(await (await request.get('/api/companions')).json()).toEqual([]);
  const initial = await readGames();
  expect(initial).toHaveLength(7);
  expect(initial.every(game => game.onlineCompanions === 0)).toBe(true);
  await page.route(/^https?:\/\/(?!127\.0\.0\.1:)/, route => route.abort());
  await page.setViewportSize({ width: 1280, height: 1100 });
  await page.goto('/');
  await expect(page.locator('[data-game-id]')).toHaveCount(7);
  await expect(page.getByText('لا يوجد رفقاء لعب هنا حالياً.')).toBeVisible();
  await expect(page.locator('[data-online-count="0"]')).toHaveCount(7);
  await page.screenshot({ path: info.outputPath('zero-companions.png'), animations: 'disabled', fullPage: true });
  await page.locator('[data-game-id="roblox"]').click();
  await expect(page.getByText('لا يوجد رفقاء لعب هنا حالياً.')).toBeVisible();
  await expect(page.getByText(/League Pro|Tactical Duo|Battle Royale|Open World|4\.2k/)).toHaveCount(0);

  const password = 'card6-local-only-password';
  const email = `catalog-${Date.now()}@local.invalid`;
  const username = 'Catalog PUBG Player';
  expect((await request.post('/api/auth/register', { data: { email, password, username } })).status()).toBe(201);
  const token = await login(email, password);
  const admin = await login(process.env.ADMIN_EMAIL!, process.env.ADMIN_PASSWORD!);
  await page.addInitScript(token => {
    localStorage.setItem('le3eb_locale', 'en');
    localStorage.setItem('business_workbench_token', token);
    sessionStorage.setItem('business_ui_authenticated', '1');
  }, token);
  await page.reload();
  await page.getByRole('button', { name: 'Me', exact: true }).click();
  await page.getByRole('button', { name: /Become a Player/i }).click();
  for (const game of initial) await expect(page.getByText(game.name, { exact: true })).toBeVisible();
  await expect(page.getByText(/League Pro|Tactical Duo|Battle Royale|Open World/)).toHaveCount(0);
  await page.screenshot({ path: info.outputPath('application-catalog.png'), animations: 'disabled', fullPage: true });
  const invalid = await request.post('/api/companions/apply', { headers: auth(token), data: { gameName: 'Open World', intro: 'Not supported', hourlyRate: 7 } });
  expect(invalid.status()).toBe(422);
  const applied = await request.post('/api/companions/apply', { headers: auth(token), data: { gameName: 'PUBG Mobile', intro: 'Local catalog verification', hourlyRate: 7 } });
  const companion = await applied.json();
  expect(applied.status()).toBe(201);
  expect((await readGames()).every(game => game.onlineCompanions === 0)).toBe(true);
  expect((await request.post(`/api/admin/companions/${companion.id}/review`, { headers: auth(admin), data: { action: 'APPROVE' } })).ok()).toBeTruthy();
  await page.getByRole('button', { name: 'Back', exact: true }).click();
  await page.getByRole('button', { name: 'Home', exact: true }).click();
  await page.locator('[data-game-id="pubg"]').click();
  await expect(page.getByRole('button', { name: new RegExp(username) })).toBeVisible();
  await expect(page.locator('[data-game-id="pubg"] [data-online-count="1"]')).toBeVisible();
  await page.screenshot({ path: info.outputPath('one-pubg-companion.png'), animations: 'disabled', fullPage: true });
  await page.locator('[data-game-id="fc"]').click();
  await expect(page.getByText('No companions here yet.')).toBeVisible();
  await page.locator('[data-game-id="pubg"]').click();
  const available = (value: string) => request.patch(`/api/companions/${companion.id}/availability`, { headers: auth(token), data: { availability: value } });
  expect((await available('OFFLINE')).ok()).toBeTruthy();
  expect((await readGames()).find(g => g.id === 'pubg')?.onlineCompanions).toBe(0);
  expect((await available('BUSY')).ok()).toBeTruthy();
  expect((await readGames()).find(g => g.id === 'pubg')?.onlineCompanions).toBe(0);
  expect((await available('ONLINE')).ok()).toBeTruthy();

  const legacyId = process.env.CARD6_LEGACY_ID;
  if (legacyId) {
    expect((await request.patch(`/api/admin/companions/${legacyId}/game`, { headers: auth(token), data: { gameId: 'codm' } })).status()).toBe(403);
    expect((await request.post(`/api/admin/companions/${legacyId}/review`, { headers: auth(admin), data: { action: 'APPROVE' } })).status()).toBe(422);
    const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
    try {
      await context.addInitScript(token => {
        localStorage.setItem('le3eb_locale', 'en');
        localStorage.setItem('business_workbench_token', token);
        sessionStorage.setItem('business_ui_authenticated', '1');
      }, admin);
      const reviewer = await context.newPage();
      await reviewer.goto(new URL('/admin', baseURL).href);
      await reviewer.getByRole('button', { name: 'Companion Review', exact: true }).click();
      const row = reviewer.getByRole('row').filter({ hasText: 'Legacy review record' });
      await expect(row.getByText(/旧游戏名待确认/)).toBeVisible();
      await reviewer.screenshot({ path: info.outputPath('legacy-game-review.png'), animations: 'disabled' });
      await row.locator('select[name="gameId"]').selectOption('codm');
      const corrected = reviewer.waitForResponse(r => r.url().endsWith(`/api/admin/companions/${legacyId}/game`) && r.request().method() === 'PATCH');
      await row.getByRole('button', { name: '更正并送审' }).click();
      expect(await (await corrected).json()).toMatchObject({ status: 'PENDING_REVIEW', gameName: 'Call of Duty: Mobile' });
    } finally { await context.close(); }
    expect((await readGames()).find(game => game.id === 'codm')?.onlineCompanions).toBe(0);
  }
});
