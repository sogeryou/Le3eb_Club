import { describe, expect, it } from 'vitest';
import { computeWithdraw } from '../../backend/policy/money.js';

describe('regression: withdraw payout', () => {
  it('keeps the agreed 150 diamonds/USD quote without the old 5% platform fee', () => {
    const { payoutUsd } = computeWithdraw(3000);
    expect(payoutUsd).toBe(20);
    expect(payoutUsd).toBeGreaterThan(0);
  });
});
