import { expect, test } from '@playwright/test';

test.use({ launchOptions: { executablePath: process.env.CARD1_CHROME } });
const tag = process.env.CARD5_TEST_TAG || 'default';
const email = `money-buyer-${tag}@local.invalid`;
const password = 'card5-local-only-test';

test('configured sandbox credit and immutable historical quotes', async ({ request, page }, info) => {
  test.skip(process.env.CARD5_ISOLATED !== 'true', 'Requires disposable local accounts and storage');
  const restart = process.env.CARD5_RESTART_CHECK === 'true';
  const login = async (email: string, password: string) => {
    const res = await request.post('/api/auth/login', { data: { email, password } });
    expect(res.ok()).toBeTruthy();
    return res.json();
  };
  const auth = (token: string) => ({ Authorization: `Bearer ${token}` });
  if (!restart) expect((await request.post('/api/auth/register', {
    data: { email, password, username: `Money Buyer ${tag}` },
  })).status()).toBe(201);
  const buyer = await login(email, password);
  const admin = await login(process.env.ADMIN_EMAIL!, process.env.ADMIN_PASSWORD!);
  const policy = await (await request.get('/api/money/policy')).json();
  const packages = await (await request.get('/api/recharge/packages')).json();
  const create = (policyId = policy.policyId) => request.post('/api/recharge/create', {
    headers: auth(buyer.token), data: { packageId: 'usd_1', paymentMethod: 'GOOGLE_PAY', policyId, coins: 999999 },
  });
  const verify = (id: string, transactionId: string) => request.post('/api/recharge/verify', {
    headers: auth(buyer.token), data: { orderId: id, transactionId, status: 'SUCCESS', receipt: 'sandbox-ok' },
  });
  const wallet = async () => (await (await request.get('/api/wallet/balance', { headers: auth(buyer.token) })).json()).balance;
  const reports = async () => (await (await request.get(`/api/admin/reports/recharges?userId=${buyer.user.id}&pageSize=100`, { headers: auth(admin.token) })).json()).items;

  if (restart) {
    expect(policy.coinsPerUsd).toBe(120);
    expect(packages.find((p: { id: string }) => p.id === 'usd_1')).toMatchObject({ coins: 77, channelFeeUsd: 0.351 });
    const before = await reports();
    const pending = before.find((r: { status: string }) => r.status === 'PENDING');
    expect(pending).toMatchObject({ coins: 100, channelFeeUsd: 0, moneyPolicy: { coinsPerUsd: 100 } });
    expect((await create(pending.moneyPolicy.policyId)).status()).toBe(409);
    const balance = await wallet();
    expect((await verify(pending.id, `snapshot-${tag}`)).ok()).toBeTruthy();
    expect(await wallet()).toBe(balance + 100);
    const next = await create();
    expect(await next.json()).toMatchObject({ coins: 77, amount: 1, moneyPolicy: { coinsPerUsd: 120 } });
    const after = await reports();
    expect(after.find((r: { id: string }) => r.id === pending.id)).toMatchObject({ coins: 100, moneyPolicy: pending.moneyPolicy });
    return;
  }
  expect(packages.map((p: { amount: number; coins: number }) => [p.amount, p.coins])).toEqual([
    [1, 100], [5, 500], [10, 1000], [20, 2000], [50, 5000], [100, 10000],
  ]);
  expect(await wallet()).toBe(0);
  await page.route(/^https?:\/\/(?!127\.0\.0\.1:)/, route => route.abort());
  await page.addInitScript(token => {
    localStorage.setItem('le3eb_locale', 'en');
    localStorage.setItem('business_workbench_token', token);
    sessionStorage.setItem('business_ui_authenticated', '1');
  }, buyer.token);
  await page.setViewportSize({ width: 1000, height: 1100 });
  await page.goto('/');
  await page.getByRole('button', { name: 'Me', exact: true }).click();
  await page.getByText('Wallet Balance', { exact: true }).click();
  const grid = page.locator('[data-recharge-package]');
  await expect(grid).toHaveCount(6);
  await expect(page.getByText(/Local sandbox only/)).toBeVisible();
  await expect(page.getByText(/BONUS/)).toHaveCount(0);
  await page.screenshot({ path: info.outputPath('configured-packages.png'), animations: 'disabled' });
  const verified = page.waitForResponse(res => res.url().endsWith('/api/recharge/verify') && res.request().method() === 'POST');
  await page.locator('[data-recharge-package="usd_1"]').click();
  const result = await verified;
  expect(await result.json()).toMatchObject({ status: 'SUCCESS', coins: 100 });
  expect(await wallet()).toBe(100);
  const [created] = await reports();
  expect(created).toMatchObject({ amount: 1, grossCoins: 100, channelFeeUsd: 0, coins: 100, sandboxOnly: true, moneyPolicy: { coinsPerUsd: 100 } });
  expect((await verify(created.id, created.transactionId)).ok()).toBeTruthy();
  expect(await wallet()).toBe(100);
  const pendingRes = await create();
  const pending = await pendingRes.json();
  expect(pending.coins).toBe(100);
  expect((await verify(pending.id, created.transactionId)).status()).toBe(409);
  expect(await wallet()).toBe(100);
  expect((await request.post('/api/wallet/withdraw-requests', { headers: auth(buyer.token), data: { diamondAmount: 3000 } })).status()).toBe(503);
  await page.screenshot({ path: info.outputPath('sandbox-credit.png'), animations: 'disabled' });

  const sellerEmail = `money-seller-${tag}@local.invalid`;
  expect((await request.post('/api/auth/register', { data: { email: sellerEmail, password, username: `Money Seller ${tag}` } })).status()).toBe(201);
  const seller = await login(sellerEmail, password);
  const apply = await request.post('/api/companions/apply', {
    headers: auth(seller.token), data: { gameName: 'PUBG Mobile', intro: 'Local sandbox settlement test', hourlyRate: 50 },
  });
  const companion = await apply.json();
  expect((await request.post(`/api/admin/companions/${companion.id}/review`, { headers: auth(admin.token), data: { action: 'APPROVE' } })).ok()).toBeTruthy();
  const ordered = await request.post('/api/orders', { headers: auth(buyer.token), data: { companionId: companion.id, quantity: 2 } });
  expect(ordered.status()).toBe(201);
  const order = await ordered.json();
  expect(order).toMatchObject({ totalPrice: 100, settlementDiamonds: 100, moneyPolicy: { orderDiamondsPerCoin: 1 } });
  for (const action of ['accept', 'start', 'complete']) {
    const res = await request.post(`/api/orders/${order.id}/${action}`, { headers: auth(seller.token) });
    expect(res.ok()).toBeTruthy();
  }
  expect(await wallet()).toBe(0);
  const details = await request.get(`/api/admin/operations/users/${seller.user.id}`, { headers: auth(admin.token) });
  expect((await details.json()).diamondWallet.balance).toBe(100);
});
