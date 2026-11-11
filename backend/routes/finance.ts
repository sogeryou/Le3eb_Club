import type express from 'express';
import type { RechargeOrder } from '../../shared/types.js';
import type { AppContext } from '../app/context.js';
import { getPaymentVerifier, verifyPaymentIdempotent } from '../payments/verifier.js';
import type { ModerationReport } from '../domain/types.js';
import { loadEnv } from '../config/env.js';
import { moneyConfig, moneySnapshot, quoteRecharge } from '../policy/moneyConfig.js';

export function registerFinanceRoutes(app: express.Application, ctx: AppContext) {
  const sandboxEnabled = () => loadEnv().NODE_ENV !== 'production' && loadEnv().PAYMENT_PROVIDER === 'sandbox';
  const verificationLocks = new Set<string>();
  const {
    authMiddleware,
    requireAdmin,
    rechargePackages,
    rechargeOrders,
    dailyRechargeLimits,
    maxDailyRecharge,
    walletTransactions,
    diamondWallets,
    withdrawalRequests,
    moderationReports,
    persistState,
    sendError,
    getUserById,
    getBanError,
    getWallet,
    addCoins,
    adjustDiamondDelta,
    appendAuditLog,
    createRiskEvent,
  } = ctx;

  app.get('/api/recharge/packages', (_req, res) => {
    res.json(rechargePackages.map(pkg => ({ ...pkg, ...quoteRecharge(moneyConfig, pkg.amount), sandboxOnly: true })));
  });

  app.get('/api/money/policy', (_req, res) => {
    res.json({ ...moneySnapshot(moneyConfig), rechargeMode: sandboxEnabled() ? 'sandbox' : 'unavailable',
      withdrawalsEnabled: false, exchangeEnabled: false });
  });

  app.post('/api/recharge/create', authMiddleware, (req, res) => {
    if (!sandboxEnabled()) return sendError(res, 503, 'REAL_RECHARGE_UNAVAILABLE', 'Real payment integration is not available');
    const authUserId = (req as any).authUserId as string;
    const { userId: requestedUserId, packageId, paymentMethod } = req.body;
    const userId = authUserId;
    if (requestedUserId && requestedUserId !== authUserId) {
      return sendError(res, 403, 'RECHARGE_USER_MISMATCH', 'User mismatch');
    }
    const pkg = rechargePackages.find(p => p.id === packageId);

    if (!pkg) return sendError(res, 400, 'RECHARGE_PACKAGE_INVALID', 'Invalid package');
    if (req.body?.policyId !== moneyConfig.policyId) return sendError(res, 409, 'RECHARGE_QUOTE_EXPIRED', 'Refresh the recharge quote');
    if (paymentMethod !== 'GOOGLE_PAY' && paymentMethod !== 'APPLE_PAY') return sendError(res, 400, 'RECHARGE_METHOD_INVALID', 'Invalid payment method');
    const quote = quoteRecharge(moneyConfig, pkg.amount);
    const ru = getUserById(userId);
    if (!ru) return sendError(res, 404, 'RECHARGE_USER_NOT_FOUND', 'User not found');
    const rban = getBanError(ru, 'RECHARGE');
    if (rban) return sendError(res, 403, 'RECHARGE_ACTION_BLOCKED', rban);

    const today = new Date().setHours(0, 0, 0, 0);
    if (!dailyRechargeLimits[userId] || dailyRechargeLimits[userId].lastReset !== today) {
      dailyRechargeLimits[userId] = { amount: 0, lastReset: today };
      persistState();
    }

    if (dailyRechargeLimits[userId].amount + pkg.amount > maxDailyRecharge) {
      return sendError(res, 403, 'RECHARGE_DAILY_LIMIT_EXCEEDED', 'Daily recharge limit exceeded', { riskFlag: true });
    }

    const order: RechargeOrder = {
      id: `order_${Math.random().toString(36).substr(2, 9)}`,
      userId,
      packageId,
      ...quote,
      sandboxOnly: true,
      paymentMethod,
      status: 'PENDING',
      timestamp: Date.now()
    };

    rechargeOrders.push(order);
    persistState();
    res.json(order);
  });

  app.post('/api/recharge/verify', authMiddleware, async (req, res) => {
    const authUserId = (req as any).authUserId as string;
    const { orderId, transactionId, status } = req.body;
    const order = rechargeOrders.find(o => o.id === orderId);

    if (!order) return sendError(res, 404, 'RECHARGE_ORDER_NOT_FOUND', 'Order not found');
    if (order.userId !== authUserId) return sendError(res, 403, 'RECHARGE_VERIFY_FORBIDDEN', 'Forbidden');

    if (order.status === 'SUCCESS') {
      return res.json({ status: 'SUCCESS', alreadyProcessed: true });
    }

    if (!sandboxEnabled()) return sendError(res, 503, 'REAL_RECHARGE_UNAVAILABLE', 'Real payment integration is not available');
    if (order.sandboxOnly !== true) return sendError(res, 503, 'LEGACY_RECHARGE_REQUIRES_RECONCILIATION', 'Legacy recharge records require a separately reviewed reconciliation process');
    if (!['SUCCESS', 'FAILED'].includes(status) || typeof transactionId !== 'string' || !transactionId.trim() || transactionId.length > 128) {
      return sendError(res, 400, 'RECHARGE_VERIFICATION_INVALID', 'Invalid transaction or status');
    }
    if (order.status !== 'PENDING') return sendError(res, 409, 'RECHARGE_ORDER_CLOSED', 'Recharge order is not pending');
    if (rechargeOrders.some(o => o.id !== order.id && o.transactionId === transactionId && ['SUCCESS', 'REFUNDED'].includes(o.status))) {
      return sendError(res, 409, 'RECHARGE_TRANSACTION_USED', 'Transaction already credited');
    }
    if (verificationLocks.has(order.id) || verificationLocks.has(transactionId)) return sendError(res, 409, 'RECHARGE_VERIFICATION_BUSY', 'Verification already in progress');
    verificationLocks.add(order.id);
    verificationLocks.add(transactionId);
    try {

    order.transactionId = transactionId;

    if (status === 'SUCCESS') {
      const verifier = getPaymentVerifier();
      const receipt = String(req.body?.receipt || 'sandbox-ok');
      const verified = await verifyPaymentIdempotent(verifier, {
        receipt,
        productId: order.packageId,
        transactionId: String(transactionId || order.id),
      });
      if (!verified.valid || verified.revoked || verified.transactionId !== transactionId) {
        return sendError(res, 402, 'PAYMENT_NOT_VERIFIED', 'Payment verification failed');
      }
      const recentOrders = rechargeOrders.filter(o =>
        o.userId === order.userId &&
        o.status === 'SUCCESS' &&
        o.timestamp > Date.now() - 5 * 60 * 1000
      );

      if (recentOrders.length > 3) {
        order.status = 'PENDING';
        order.riskFlag = true;
        order.riskReason = 'High frequency recharge';
        createRiskEvent('HIGH_FREQUENCY_RECHARGE', order.id, 'HIGH', 'Recharge held due to high frequency in short window');
        persistState();
        return res.json({ status: 'PENDING', message: 'Order held for review' });
      }

      order.status = 'SUCCESS';
      addCoins(order.userId, order.coins, order.id, `Recharge: ${order.amount} USD`);

      const today = new Date().setHours(0, 0, 0, 0);
      if (dailyRechargeLimits[order.userId]) {
        dailyRechargeLimits[order.userId].amount += order.amount;
      }
      persistState();

      res.json({ status: 'SUCCESS', coins: order.coins });
    } else {
      order.status = 'FAILED';
      persistState();
      res.json({ status: 'FAILED' });
    }
    } finally {
      verificationLocks.delete(order.id);
      verificationLocks.delete(transactionId);
    }
  });

  app.get('/api/wallet/balance', authMiddleware, (req, res) => {
    const userId = (req as any).authUserId as string;
    res.json(getWallet(userId));
  });

  app.get('/api/wallet/transactions', authMiddleware, (req, res) => {
    const userId = (req as any).authUserId as string;
    const txs = walletTransactions.filter(t => t.userId === userId);
    res.json(txs);
  });

  app.post('/api/wallet/withdraw-requests', authMiddleware, (req, res) => {
    return sendError(res, 503, 'WITHDRAWAL_WORKFLOW_UNAVAILABLE', 'Withdrawals are not enabled until the reviewed payout workflow is implemented');
  });

  app.post('/api/moderation/reports', authMiddleware, (req, res) => {
    const reporterUserId = (req as any).authUserId as string;
    const { targetType, targetId, reason } = req.body || {};
    if (!targetType || !targetId || !reason) {
      return sendError(res, 400, 'REPORT_FIELDS_REQUIRED', 'targetType, targetId, reason required');
    }
    if (!['USER', 'ORDER', 'COMPANION'].includes(targetType)) {
      return sendError(res, 400, 'REPORT_TARGET_TYPE_INVALID', 'Invalid targetType');
    }
    const rep: ModerationReport = {
      id: `rep_${Math.random().toString(36).slice(2, 10)}`,
      reporterUserId,
      targetType,
      targetId: String(targetId),
      reason: String(reason),
      status: 'PENDING',
      createdAt: Date.now()
    };
    moderationReports.unshift(rep);
    persistState();
    res.status(201).json(rep);
  });

  app.post('/api/admin/recharge/manual', authMiddleware, requireAdmin('RECHARGE_MANUAL'), (req, res) => {
    const { orderId, action } = req.body;
    const order = rechargeOrders.find(o => o.id === orderId);

    if (!order) return sendError(res, 404, 'RECHARGE_ORDER_NOT_FOUND', 'Order not found');
    if (order.sandboxOnly && !sandboxEnabled()) return sendError(res, 503, 'REAL_RECHARGE_UNAVAILABLE', 'Sandbox orders cannot be credited outside the sandbox');
    if (verificationLocks.has(order.id)) return sendError(res, 409, 'RECHARGE_VERIFICATION_BUSY', 'Verification already in progress');
    if (order.status !== 'PENDING') return sendError(res, 400, 'RECHARGE_ORDER_STATE_INVALID', 'Order not in pending state');

    if (action !== 'APPROVE' && action !== 'REJECT') return sendError(res, 400, 'RECHARGE_ACTION_INVALID', 'Use APPROVE or REJECT');
    if (action === 'APPROVE') {
      order.status = 'SUCCESS';
      addCoins(order.userId, order.coins, order.id, `Manual Credit by Admin ${(req as any).authUserId}`);
      appendAuditLog((req as any).authUserId, 'RECHARGE_APPROVE', 'recharge', order.id, { status: order.status });
      persistState();
      res.json({ status: 'SUCCESS' });
    } else {
      order.status = 'FAILED';
      appendAuditLog((req as any).authUserId, 'RECHARGE_REJECT', 'recharge', order.id, { status: order.status });
      persistState();
      res.json({ status: 'FAILED' });
    }
  });

  app.post('/api/recharge/chargeback', authMiddleware, requireAdmin('RECHARGE_MANUAL'), (req, res) => {
    const { transactionId } = req.body;
    const order = rechargeOrders.find(o => o.transactionId === transactionId);

    if (!order || order.status !== 'SUCCESS') {
      return sendError(res, 404, 'RECHARGE_SUCCESS_ORDER_NOT_FOUND', 'Successful order with this transaction ID not found');
    }

    order.status = 'REFUNDED';
    const wallet = getWallet(order.userId);

    wallet.balance -= order.coins;
    wallet.lastUpdated = Date.now();

    walletTransactions.unshift({
      id: `tx_cb_${Math.random().toString(36).substr(2, 9)}`,
      userId: order.userId,
      type: 'REFUND',
      amount: -order.coins,
      balanceAfter: wallet.balance,
      referenceId: order.id,
      timestamp: Date.now(),
      description: `Chargeback for Transaction ${transactionId}`
    });
    appendAuditLog((req as any).authUserId, 'RECHARGE_CHARGEBACK', 'recharge', order.id, { transactionId });
    persistState();

    if (wallet.balance < 0) {
      createRiskEvent('NEGATIVE_BALANCE', order.id, 'HIGH', `Negative wallet balance after chargeback: ${wallet.balance}`);
      console.log(`User ${order.userId} account frozen due to negative balance after chargeback`);
    }

    res.json({ status: 'REFUNDED', currentBalance: wallet.balance });
  });
}
