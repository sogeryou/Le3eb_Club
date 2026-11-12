import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { isolatedApp } from '../helpers/isolatedApp.js';
import { LOCAL_SEED_ACCOUNTS, LOCAL_SEED_PASSWORD } from '../../scripts/seed-local.js';

describe.sequential('card 7: isolated core journey', () => {
  let app: Awaited<ReturnType<typeof isolatedApp>>;
  let admin: string, buyer: string, player: string, third: string, orderId: string;
  const call = async (method: string, path: string, token?: string, data?: object) => {
    const response = await fetch(app.origin + path, {
      method, headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      ...(data ? { body: JSON.stringify(data) } : {}),
    });
    return { status: response.status, body: await response.json() };
  };
  const login = async (email: string) => {
    const result = await call('POST', '/api/auth/login', undefined, { email, password: LOCAL_SEED_PASSWORD });
    expect(result.status).toBe(200);
    return result.body.token as string;
  };
  const balance = async () => (await call('GET', '/api/wallet/balance', buyer)).body.balance;
  beforeAll(async () => {
    app = await isolatedApp();
    admin = await login('admin@local.le3eb.invalid');
    buyer = await login('buyer1@local.le3eb.invalid');
    player = await login('pubg@local.le3eb.invalid');
    third = await login('buyer2@local.le3eb.invalid');
  }, 30_000);
  afterAll(async () => { if (app) await app.stop(); }, 10_000);

  it('logs in all six labeled seed accounts and lists the three local companions', async () => {
    for (const account of LOCAL_SEED_ACCOUNTS) expect(await login(account.email)).toBeTruthy();
    const listed = (await call('GET', '/api/companions')).body;
    expect(listed).toHaveLength(3);
    expect(listed.every((row: { displayName: string }) => row.displayName.startsWith('[LOCAL]'))).toBe(true);
  });

  it('registers and authenticates a real user; wrong password is rejected', async () => {
    const data = { email: 'registered@local.le3eb.invalid', username: 'Regression account', password: 'Local-Registration-Only!' };
    expect((await call('POST', '/api/auth/register', undefined, data)).status).toBe(201);
    expect((await call('POST', '/api/auth/login', undefined, data)).status).toBe(200);
    expect((await call('POST', '/api/auth/login', undefined, { ...data, password: 'incorrect-password' })).status).toBe(401);
  });

  it('credits exactly the configured sandbox amount and never credits twice', async () => {
    expect(await balance()).toBe(0);
    const policy = (await call('GET', '/api/money/policy')).body;
    const packages = (await call('GET', '/api/recharge/packages')).body;
    const pkg = packages.find((p: { amount: number }) => p.amount === 1);
    const created = await call('POST', '/api/recharge/create', buyer, { packageId: pkg.id, paymentMethod: 'GOOGLE_PAY', policyId: policy.policyId });
    expect(created.status).toBe(200);
    const input = { orderId: created.body.id, transactionId: 'local-regression-payment', receipt: 'sandbox-ok', status: 'SUCCESS' };
    const verified = await call('POST', '/api/recharge/verify', buyer, input);
    expect(verified.body).toMatchObject({ status: 'SUCCESS', coins: pkg.coins });
    expect(await balance()).toBe(pkg.coins);
    expect((await call('POST', '/api/recharge/verify', buyer, input)).body.alreadyProcessed).toBe(true);
    expect(await balance()).toBe(pkg.coins);
  });

  it('rejects state skipping and settles matching buyer coins / companion diamonds exactly once', async () => {
    const created = await call('POST', '/api/orders', buyer, { companionId: 'local_cp_pubg', quantity: 3 });
    expect(created.status).toBe(201);
    orderId = created.body.id;
    expect(created.body).toMatchObject({ status: 'CREATED', totalPrice: 21, settlementDiamonds: 21 });
    expect((await call('POST', `/api/orders/${orderId}/complete`, player)).status).toBe(409);
    expect(await balance()).toBe(100);
    for (const [action, status] of [['accept', 'ACCEPTED'], ['start', 'IN_SERVICE'], ['complete', 'COMPLETED']]) {
      const result = await call('POST', `/api/orders/${orderId}/${action}`, player);
      expect(result.status).toBe(200);
      expect(result.body.status).toBe(status);
    }
    // Mutation proof deliberately changes the isolated server's charge to +1; this assertion must fail.
    expect(await balance(), 'buyer charge must equal the order total').toBe(79);
    const detail = (await call('GET', '/api/admin/operations/users/local_player_pubg', admin)).body;
    expect(detail.diamondWallet.balance).toBe(21);
    expect((await call('POST', `/api/orders/${orderId}/complete`, player)).status).toBe(409);
    expect(await balance()).toBe(79);
    expect((await call('GET', '/api/admin/operations/users/local_player_pubg', admin)).body.diamondWallet.balance).toBe(21);
  });

  it('publishes the buyer review and rejects a duplicate or another author', async () => {
    const review = { orderId, rating: 5, content: 'Verified local regression review' };
    expect((await call('POST', '/api/reviews', third, review)).status).toBe(403);
    expect((await call('POST', '/api/reviews', buyer, review)).status).toBe(201);
    expect((await call('POST', '/api/reviews', buyer, review)).status).toBe(409);
    const detail = (await call('GET', '/api/companions/local_cp_pubg')).body;
    expect(detail.reviews).toEqual(expect.arrayContaining([expect.objectContaining({ rating: 5, content: review.content })]));
  });

  it('requires admin review, shows rejection reasons and returns edits to review', async () => {
    const profile = { gameName: 'Valorant', intro: 'A local review application', hourlyRate: 7 };
    const first = await call('POST', '/api/companions/apply', third, profile);
    expect(first.body.status).toBe('PENDING_REVIEW');
    const id = first.body.id;
    const reviewPath = `/api/admin/companions/${id}/review`;
    expect((await call('POST', reviewPath, third, { action: 'APPROVE' })).status).toBe(403);
    expect((await call('POST', reviewPath, admin, { action: 'REJECT' })).status).toBe(400);
    expect((await call('POST', reviewPath, admin, { action: 'REJECT', reason: 'Add service details' })).status).toBe(200);
    expect((await call('GET', '/api/companions/me', third)).body.rejectionReason).toBe('Add service details');
    expect((await call('POST', '/api/companions/apply', third, { ...profile, intro: 'Revised details' })).body.status).toBe('PENDING_REVIEW');
    expect((await call('POST', reviewPath, admin, { action: 'APPROVE' })).body.status).toBe('APPROVED');
    expect((await call('POST', '/api/companions/apply', third, { ...profile, intro: 'Changed after approval' })).body.status).toBe('PENDING_REVIEW');
    expect((await call('GET', `/api/companions/${id}`)).status).toBe(404);
    expect((await call('POST', '/api/orders', buyer, { companionId: id, quantity: 1 })).status).toBe(409);
  });

  it('reuses direct chat and denies third-account read/write/read-receipt access', async () => {
    const conversation = await call('POST', '/api/conversations', buyer, { companionId: 'local_cp_pubg' });
    expect(conversation.status).toBe(201);
    const id = conversation.body.id;
    const messagesPath = `/api/conversations/${id}/messages`;
    const text = { content: 'Local regression chat' };
    expect((await call('POST', messagesPath, buyer, text)).status).toBe(201);
    expect((await call('GET', messagesPath, player)).body.messages).toEqual(expect.arrayContaining([expect.objectContaining(text)]));
    expect((await call('GET', messagesPath, third)).status).toBe(403);
    expect((await call('POST', messagesPath, third, text)).status).toBe(403);
    expect((await call('POST', `/api/conversations/${id}/read`, third, { through: 1 })).status).toBe(403);
    expect((await call('POST', '/api/conversations', player, { orderId })).body.id).toBe(id);
  });
});
