import express from 'express';
import request from 'supertest';
import { describe, expect, it, vi } from 'vitest';
import { registerFinanceRoutes } from '../../backend/routes/finance.js';
import type { AppContext } from '../../backend/app/context.js';

const mode = vi.hoisted(() => ({ NODE_ENV: 'production', PAYMENT_PROVIDER: 'sandbox' }));
vi.mock('../../backend/config/env.js', () => ({ loadEnv: () => mode }));

describe('real recharge remains closed', () => {
  it('does not reinterpret unmarked historical pending orders as sandbox purchases', async () => {
    mode.NODE_ENV = 'test';
    mode.PAYMENT_PROVIDER = 'sandbox';
    const orders = [{ id: 'old', userId: 'u1', amount: 0.99, coins: 60, status: 'PENDING' }];
    const before = JSON.stringify(orders);
    const credit = vi.fn();
    const save = vi.fn();
    const app = express();
    app.use(express.json());
    registerFinanceRoutes(app, {
      authMiddleware: (req, _res, next) => { (req as any).authUserId = 'u1'; next(); },
      requireAdmin: () => (_req, _res, next) => next(),
      rechargeOrders: orders, rechargePackages: [], persistState: save, addCoins: credit,
      sendError: (res, status, code) => res.status(status).json({ error: { code } }),
    } as unknown as AppContext);
    const response = await request(app).post('/api/recharge/verify').send({ orderId: 'old', transactionId: 'tx-old', status: 'SUCCESS' });
    expect(response.status).toBe(503);
    expect(response.body.error.code).toBe('LEGACY_RECHARGE_REQUIRES_RECONCILIATION');
    expect(JSON.stringify(orders)).toBe(before);
    expect(credit).not.toHaveBeenCalled();
    expect(save).not.toHaveBeenCalled();
  });
  it.each([['production', 'sandbox'], ['test', 'appstore'], ['test', 'play']])(
    'does not mutate money in %s with provider %s', async (environment, provider) => {
      mode.NODE_ENV = environment;
      mode.PAYMENT_PROVIDER = provider;
      const orders = [{ id: 'historical-pending', userId: 'u1', amount: 0.99, coins: 60, status: 'PENDING', sandboxOnly: true }];
      const before = JSON.stringify(orders);
      const save = vi.fn();
      const credit = vi.fn();
      const app = express();
      app.use(express.json());
      registerFinanceRoutes(app, {
        authMiddleware: (req, _res, next) => { (req as any).authUserId = 'u1'; next(); },
        requireAdmin: () => (_req, _res, next) => next(),
        rechargeOrders: orders, rechargePackages: [], persistState: save, addCoins: credit,
        sendError: (res, status, code) => res.status(status).json({ error: { code } }),
      } as unknown as AppContext);
      expect((await request(app).post('/api/recharge/create').send({})).status).toBe(503);
      expect((await request(app).post('/api/recharge/verify').send({ orderId: orders[0].id, transactionId: 'tx1', status: 'SUCCESS' })).status).toBe(503);
      expect((await request(app).post('/api/admin/recharge/manual').send({ orderId: orders[0].id, action: 'APPROVE' })).status).toBe(503);
      expect((await request(app).get('/api/money/policy')).body.rechargeMode).toBe('unavailable');
      expect(JSON.stringify(orders)).toBe(before);
      expect(save).not.toHaveBeenCalled();
      expect(credit).not.toHaveBeenCalled();
    },
  );
});
