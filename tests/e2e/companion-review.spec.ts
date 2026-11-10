import { expect, test } from '@playwright/test';

test.use({ launchOptions: { executablePath: process.env.CARD1_CHROME } });

test('manual companion review gates discovery and orders', async ({ request, page, browser }, info) => {
  test.skip(process.env.CARD4_ISOLATED !== 'true', 'Requires disposable development storage');
  page.setDefaultTimeout(8_000);
  const data = { email: `review-${Date.now()}@local.invalid`, password: 'local-card4-test-only' };
  const username = `Review test ${Date.now()}`;
  expect((await request.post('/api/auth/register', { data: { ...data, username } })).status()).toBe(201);
  const login = async (credentials: { email: string; password: string }) => {
    const result = await request.post('/api/auth/login', { data: credentials });
    expect(result.ok()).toBeTruthy();
    return { Authorization: `Bearer ${(await result.json()).token}` };
  };
  const headers = await login(data);
  const admin = await login({ email: process.env.ADMIN_EMAIL!, password: process.env.ADMIN_PASSWORD! });
  const buyer = await login({ email: 'demo@le3eb.club', password: 'demo123' });
  const profile = { gameName: 'PUBG Mobile', intro: 'Duo', hourlyRate: 7 };
  const apply = async (intro: string) => {
    const result = await request.post('/api/companions/apply', { headers, data: { ...profile, intro } });
    expect(result.ok()).toBeTruthy();
    const record = await result.json();
    expect(record.status).toBe('PENDING_REVIEW');
    return record.id as string;
  };
  const id = await apply(profile.intro);
  const review = (action: string, reason?: string, auth = admin) => request.post(`/api/admin/companions/${id}/review`, { headers: auth, data: { action, reason } });
  const order = () => request.post('/api/orders', { headers: buyer, data: { companionId: id, quantity: 1 } });
  const mine = async () => (await request.get('/api/companions/me', { headers })).json();
  const listed = async () => ((await (await request.get('/api/companions')).json()) as { id: string }[]).some(p => p.id === id);
  expect(await listed()).toBe(false);
  const queue = await request.get('/api/admin/companions?status=PENDING_REVIEW', { headers: admin });
  expect((await queue.json()).items).toEqual(expect.arrayContaining([expect.objectContaining({ id, displayName: username, hourlyRate: 7 })]));
  expect((await request.get(`/api/companions/${id}`)).status()).toBe(404);
  const unapproved = await order();
  expect(unapproved.status()).toBe(409);
  expect(await unapproved.json()).toMatchObject({ error: { code: 'ORDER_COMPANION_NOT_APPROVED' } });
  expect((await review('APPROVE', undefined, headers)).status()).toBe(403);
  expect((await review('REJECT', '   ')).status()).toBe(400);
  const stale = await request.post(`/api/admin/companions/${id}/review`, { headers: admin, data: { action: 'APPROVE', expectedUpdatedAt: 0 } });
  expect(stale.status()).toBe(409);
  await page.addInitScript(token => {
    localStorage.setItem('le3eb_locale', 'en');
    localStorage.setItem('business_workbench_token', token);
    sessionStorage.setItem('business_ui_authenticated', '1');
  }, headers.Authorization.slice(7));
  await page.goto('/');
  const openApplication = async () => {
    await page.getByRole('button', { name: 'Me', exact: true }).click();
    await page.getByRole('button', { name: /Become a Player/i }).click();
  };
  await openApplication();
  await expect(page.getByRole('heading', { name: 'Application Pending' })).toBeVisible();
  await page.screenshot({ path: info.outputPath('pending-application.png'), animations: 'disabled' });
  const adminContext = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  try {
    await adminContext.addInitScript(token => {
      localStorage.setItem('le3eb_locale', 'en');
      localStorage.setItem('business_workbench_token', token);
      sessionStorage.setItem('business_ui_authenticated', '1');
    }, admin.Authorization.slice(7));
    const adminPage = await adminContext.newPage();
    adminPage.setDefaultTimeout(8_000);
    await adminPage.goto(new URL('/admin', page.url()).href);
    await adminPage.getByRole('button', { name: 'Companion Review', exact: true }).click();
    const row = adminPage.getByRole('row').filter({ hasText: username });
    await expect(row).toBeVisible();
    await adminPage.screenshot({ path: info.outputPath('admin-review-queue.png'), animations: 'disabled' });
    adminPage.once('dialog', dialog => dialog.accept('Introduction needs more detail'));
    const rejected = adminPage.waitForResponse(res => res.url().endsWith(`/api/admin/companions/${id}/review`) && res.request().method() === 'POST');
    await row.getByRole('button', { name: '驳回' }).click();
    expect((await rejected).ok()).toBeTruthy();
  } finally { await adminContext.close(); }
  expect(await mine()).toMatchObject({ status: 'REJECTED', rejectionReason: 'Introduction needs more detail' });
  await page.getByRole('button', { name: 'Refresh status' }).click();
  await expect(page.getByText('Introduction needs more detail')).toBeVisible();
  await page.screenshot({ path: info.outputPath('rejected-application.png'), animations: 'disabled' });
  expect((await order()).status()).toBe(409);
  expect(await apply('Revised introduction')).toBe(id);
  expect((await review('APPROVE')).ok()).toBeTruthy();
  expect(await listed()).toBe(true);
  expect((await order()).status()).toBe(201);
  const unchanged = await request.post('/api/companions/apply', { headers, data: { ...profile, intro: 'Revised introduction' } });
  expect(await unchanged.json()).toMatchObject({ id, status: 'APPROVED' });
  await page.getByRole('button', { name: 'Back', exact: true }).click();
  await page.getByRole('button', { name: 'Home', exact: true }).click();
  await expect(page.getByRole('button', { name: new RegExp(username) })).toBeVisible();
  await page.screenshot({ path: info.outputPath('approved-on-home.png'), animations: 'disabled' });
  await page.getByRole('button', { name: 'Me', exact: true }).click();
  await page.getByRole('button', { name: /Player Profile/i }).click();
  const intro = page.getByRole('textbox', { name: 'Introduction', exact: true });
  await expect(intro).toHaveValue('Revised introduction');
  await intro.fill('Changed after approval');
  await expect(intro).toHaveValue('Changed after approval');
  await page.getByRole('button', { name: 'Save changes' }).click();
  await expect(page.getByText('Profile submitted for review.')).toBeVisible();
  expect(await mine()).toMatchObject({ id, status: 'PENDING_REVIEW', intro: 'Changed after approval' });
  await page.screenshot({ path: info.outputPath('profile-sent-for-review.png'), animations: 'disabled' });
  expect(await listed()).toBe(false);
  expect((await order()).status()).toBe(409);
  const rankings = await request.get('/api/companions/rankings?limit=100');
  expect((await rankings.json()).some((p: { companionId: string }) => p.companionId === id)).toBe(false);
  const audits = await request.get('/api/admin/audit-logs', { headers: admin });
  expect((await audits.json()).items).toEqual(expect.arrayContaining([
    expect.objectContaining({ action: 'COMPANION_REJECT', targetId: id, metadata: { status: 'REJECTED', reason: 'Introduction needs more detail' } }),
    expect.objectContaining({ action: 'COMPANION_APPROVE', targetId: id, metadata: { status: 'APPROVED' } }),
  ]));
});
