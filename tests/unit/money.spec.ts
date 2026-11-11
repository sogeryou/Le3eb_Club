import { describe, expect, it } from 'vitest';
import { computeWithdraw, MONEY_POLICY } from '../../backend/policy/money.js';

describe('computeWithdraw', () => {
  it('3000 diamonds => gross 20, zero platform fee; chain fee still pending', () => {
    const q = computeWithdraw(3000);
    expect(q.grossUsd).toBe(20);
    expect(q.feeUsd).toBe(0);
    expect(q.payoutUsd).toBe(20);
    expect(q.chainFeePending).toBe(true);
    expect(q.withinLimits).toBe(true);
  });
  it('requires integer diamonds and the configured USD step', () => {
    expect(computeWithdraw(3001).reason).toBe('WITHDRAW_STEP_INVALID');
    expect(computeWithdraw(3001.5).reason).toBe('WITHDRAW_AMOUNT_INVALID');
    expect(computeWithdraw(3003)).toMatchObject({ grossUsd: 20.02, withinLimits: true });
  });

  it('rejects below min', () => {
    const q = computeWithdraw(MONEY_POLICY.MIN_WITHDRAW_DIAMONDS - 1);
    expect(q.withinLimits).toBe(false);
  });
});
