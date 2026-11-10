import { expect, test, type Browser } from '@playwright/test';

test.use({ launchOptions: { executablePath: process.env.CARD1_CHROME } });
const password = 'card3-local-test-only';
const run = process.env.CARD3_TEST_TAG || 'default';
const playerEmail = `card3-player-${run}@local.invalid`;
const playerName = `Chat Player ${run}`;
const outbound = 'Hello from the order buyer';
const reply = 'Reply from the approved companion';

async function tab(browser: Browser, origin: string, token: string) {
  const context = await browser.newContext({ viewport: { width: 900, height: 820 } });
  await context.route(/^https?:\/\/(?!127\.0\.0\.1:)/, route => route.abort());
  await context.addInitScript(token => {
    localStorage.setItem('le3eb_locale', 'en');
    localStorage.setItem('business_workbench_token', token);
    sessionStorage.setItem('business_ui_authenticated', '1');
  }, token);
  const page = await context.newPage();
  page.setDefaultTimeout(10_000);
  await page.goto(origin);
  return page;
}

test('approved direct chat, polling, order reuse and restart persistence', async ({ request, browser, baseURL }, info) => {
  test.skip(process.env.CARD3_ISOLATED !== 'true', 'Requires disposable local storage');
  const restart = process.env.CARD3_RESTART_CHECK === 'true';
  const login = async (email: string, password: string) => {
    const response = await request.post('/api/auth/login', { data: { email, password } });
    expect(response.ok()).toBeTruthy();
    return (await response.json()).token as string;
  };
  const auth = (token: string) => ({ Authorization: `Bearer ${token}` });
  const buyer = await login('demo@le3eb.club', 'demo123');
  if (restart) {
    const list = await request.get('/api/conversations', { headers: auth(buyer) });
    const record = (await list.json()).find((r: { peer: { displayName: string } }) => r.peer.displayName === playerName);
    expect(record?.id).toBeTruthy();
    const history = await request.get(`/api/conversations/${record.id}/messages`, { headers: auth(buyer) });
    expect((await history.json()).messages.map((m: { content: string }) => m.content)).toEqual([outbound, reply]);
    const page = await tab(browser, baseURL!, buyer);
    await page.getByRole('button', { name: 'Messages', exact: true }).click();
    await page.getByRole('button', { name: new RegExp(playerName) }).click();
    await expect(page.getByText(reply, { exact: true })).toBeVisible();
    await page.screenshot({ path: info.outputPath('after-restart.png'), animations: 'disabled' });
    return;
  }
  for (const [email, username] of [[playerEmail, playerName], [`card3-third-${run}@local.invalid`, `Chat Third ${run}`]]) {
    expect((await request.post('/api/auth/register', { data: { email, username, password } })).status()).toBe(201);
  }
  const player = await login(playerEmail, password);
  const third = await login(`card3-third-${run}@local.invalid`, password);
  const admin = await login(process.env.ADMIN_EMAIL!, process.env.ADMIN_PASSWORD!);
  const application = await request.post('/api/companions/apply', {
    headers: auth(player), data: { gameName: 'PUBG Mobile', intro: 'Local chat acceptance', hourlyRate: 7 },
  });
  expect(application.status()).toBe(201);
  const { id: companionId } = await application.json();
  const create = (data: object, token = buyer) => request.post('/api/conversations', { headers: auth(token), data });
  const blocked = await create({ companionId });
  expect(blocked.status()).toBe(409);
  expect(await blocked.json()).toMatchObject({ error: { code: 'CHAT_COMPANION_NOT_APPROVED' } });
  expect((await request.post(`/api/admin/companions/${companionId}/review`, {
    headers: auth(admin), data: { action: 'APPROVE' },
  })).ok()).toBeTruthy();

  const buyerPage = await tab(browser, baseURL!, buyer);
  await buyerPage.getByRole('button', { name: new RegExp(playerName) }).click();
  await buyerPage.getByRole('button', { name: 'Chat first' }).click();
  await expect(buyerPage.getByRole('heading', { name: playerName })).toBeVisible();
  const same = await create({ companionId });
  expect(same.status()).toBe(200);
  const { id } = await same.json();
  const path = `/api/conversations/${id}/messages`;
  expect((await request.get(path, { headers: auth(third) })).status()).toBe(403);
  expect((await request.post(path, { headers: auth(third), data: { content: 'denied' } })).status()).toBe(403);
  expect((await request.post(`/api/conversations/${id}/read`, { headers: auth(third), data: { through: 0 } })).status()).toBe(403);

  const input = buyerPage.getByRole('textbox', { name: 'Message' });
  await input.fill(outbound);
  await buyerPage.route(`**${path}`, route => route.request().method() === 'POST' ? route.abort() : route.continue());
  await buyerPage.getByRole('button', { name: 'Send', exact: true }).click();
  await expect(buyerPage.getByRole('alert').filter({ hasText: 'Your draft is kept' })).toBeVisible();
  await expect(input).toHaveValue(outbound);
  await buyerPage.unroute(`**${path}`);
  await buyerPage.getByRole('button', { name: 'Send', exact: true }).click();
  await expect(buyerPage.getByText(outbound, { exact: true })).toBeVisible();
  const list = await request.get('/api/conversations', { headers: auth(player) });
  expect((await list.json()).find((row: { id: string }) => row.id === id)).toMatchObject({ unreadCount: 1 });

  const playerPage = await tab(browser, baseURL!, player);
  await playerPage.getByRole('button', { name: 'Messages', exact: true }).click();
  await playerPage.getByRole('button', { name: /demo_user/ }).click();
  await expect(playerPage.getByText(outbound, { exact: true })).toBeVisible();
  await expect.poll(async () => {
    const response = await request.get('/api/conversations', { headers: auth(player) });
    return (await response.json()).find((row: { id: string }) => row.id === id)?.unreadCount;
  }).toBe(0);
  await playerPage.getByRole('textbox', { name: 'Message' }).fill(reply);
  await playerPage.getByRole('button', { name: 'Send', exact: true }).click();
  await expect(buyerPage.getByText(reply, { exact: true })).toBeVisible({ timeout: 12_000 });
  await buyerPage.screenshot({ path: info.outputPath('buyer-received-reply.png'), animations: 'disabled' });
  await playerPage.screenshot({ path: info.outputPath('companion-replied.png'), animations: 'disabled' });

  const order = await request.post('/api/orders', { headers: auth(buyer), data: { companionId, quantity: 1 } });
  expect(order.status()).toBe(201);
  const { id: orderId } = await order.json();
  expect((await create({ orderId }, third)).status()).toBe(403);
  expect(await (await create({ orderId }, player)).json()).toMatchObject({ id });
  await buyerPage.getByRole('button', { name: 'Back', exact: true }).click();
  await buyerPage.getByRole('button', { name: 'Back', exact: true }).click();
  await buyerPage.getByRole('button', { name: 'Messages', exact: true }).click();
  await buyerPage.getByRole('button', { name: 'Orders', exact: true }).click();
  await buyerPage.getByRole('button', { name: new RegExp(orderId) }).click();
  await buyerPage.getByRole('button', { name: 'Contact other party' }).click();
  await expect(buyerPage.getByText(reply, { exact: true })).toBeVisible();
  await buyerPage.screenshot({ path: info.outputPath('order-reopens-chat.png'), animations: 'disabled' });
  const older = await request.get(`${path}?before=2&limit=1`, { headers: auth(buyer) });
  expect((await older.json()).messages.map((m: { sequence: number }) => m.sequence)).toEqual([1]);
});
