import { describe, expect, it } from 'vitest';
import { makeMoneyConfig, buildRechargePackages, quoteRecharge, validatePackages } from '../../backend/policy/moneyConfig.js';

describe('configured monetary policy', () => {
  it('uses the previously agreed defaults, with no bonuses', () => {
    const config = makeMoneyConfig();
    expect(config).toMatchObject({
      coinsPerUsd: 100, diamondsPerUsd: 150, orderDiamondsPerCoin: 1,
      withdrawMinUsd: 20, withdrawStepUsd: 0.02, withdrawPlatformFeeRate: 0,
      exchangeDiamonds: 100, exchangeCoins: 80,
    });
    expect(buildRechargePackages(config).map(p => [p.amount, p.coins, p.bonus])).toEqual([
      [1, 100, 0], [5, 500, 0], [10, 1000, 0], [20, 2000, 0], [50, 5000, 0], [100, 10000, 0],
    ]);
  });
  it('deducts the sandbox channel fee and floors net coins, without changing paid USD', () => {
    const config = makeMoneyConfig({ sandboxChannelFeeUsd: 0.351 });
    expect(quoteRecharge(config, 10)).toMatchObject({
      amount: 10, grossCoins: 1000, channelFeeUsd: 0.351, coins: 964, bonus: 0,
    });
  });
  it('version-stamps quotes and does not mutate older quotes after a config change', () => {
    const first = makeMoneyConfig();
    const before = quoteRecharge(first, 1);
    const second = makeMoneyConfig({ coinsPerUsd: 120 });
    expect(quoteRecharge(second, 1).coins).toBe(120);
    expect(before.coins).toBe(100);
    expect(first.policyId).not.toBe(second.policyId);
    expect(before.moneyPolicy.coinsPerUsd).toBe(100);
  });
  it('rejects invalid or unexpected config instead of silently falling back', () => {
    for (const value of [{ coinsPerUsd: 0 }, { typo: 100 }, { rechargeAmountsUsd: [1, 1] }, { withdrawStepUsd: 0.01 }]) {
      expect(() => makeMoneyConfig(value)).toThrow();
    }
  });
  it('rejects invalid packages and applies only the configured tolerance', () => {
    const config = makeMoneyConfig();
    expect(() => validatePackages([{ id: 'wrong', amount: 1, coins: 120, bonus: 0 }], config)).toThrow();
    expect(() => validatePackages([{ id: 'free', amount: 0, coins: 100, bonus: 0 }], config)).toThrow();
    expect(() => validatePackages([{ id: 'bonus', amount: 1, coins: 100, bonus: 5 }], config)).toThrow();
    expect(() => validatePackages([{ id: 'ok', amount: 1, coins: 100, bonus: 0 }], config)).not.toThrow();
  });
});
