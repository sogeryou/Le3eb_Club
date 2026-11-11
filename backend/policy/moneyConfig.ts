import { createHash } from 'node:crypto';
import { Decimal } from 'decimal.js';
import { z } from 'zod';
import type { RechargePackage } from '../../shared/types.js';
import type { MoneyPolicySnapshot, RechargeQuote } from '../../shared/money.js';

const Config = z.object({
  coinsPerUsd: z.number().int().positive().max(1_000_000).default(100),
  diamondsPerUsd: z.number().int().positive().max(1_000_000).default(150),
  orderDiamondsPerCoin: z.number().int().positive().max(10_000).default(1),
  withdrawMinUsd: z.number().finite().positive().max(1_000_000).default(20),
  withdrawStepUsd: z.number().finite().positive().max(1_000_000).default(0.02),
  withdrawPlatformFeeRate: z.number().finite().min(0).lt(1).default(0),
  exchangeDiamonds: z.number().int().positive().max(1_000_000).default(100),
  exchangeCoins: z.number().int().positive().max(1_000_000).default(80),
  rechargeAmountsUsd: z.array(z.number().int().positive().max(1_000_000)).min(1).max(20).default([1, 5, 10, 20, 50, 100]),
  sandboxChannelFeeUsd: z.number().finite().nonnegative().max(1_000_000).default(0),
  rechargePackageTolerance: z.number().finite().min(0).max(0.01).default(0.01),
  maxDailyRechargeUsd: z.number().int().positive().max(10_000_000).default(500),
  maxWithdrawDiamonds: z.number().int().positive().max(Number.MAX_SAFE_INTEGER).default(250_000),
}).strict();

export function makeMoneyConfig(input: unknown = {}) {
  const value = Config.parse(input);
  if (new Set(value.rechargeAmountsUsd).size !== value.rechargeAmountsUsd.length) throw new Error('Duplicate recharge amounts');
  if (new Decimal(value.withdrawMinUsd).decimalPlaces() > 2 || new Decimal(value.withdrawStepUsd).decimalPlaces() > 2 ||
      !new Decimal(value.withdrawMinUsd).div(value.withdrawStepUsd).isInteger() ||
      !new Decimal(value.withdrawStepUsd).times(value.diamondsPerUsd).isInteger() ||
      new Decimal(value.withdrawMinUsd).times(value.diamondsPerUsd).gt(value.maxWithdrawDiamonds)) {
    throw new Error('Withdrawal limits and step must produce integer diamonds');
  }
  if (new Decimal(value.sandboxChannelFeeUsd).decimalPlaces() > 6 ||
      value.rechargeAmountsUsd.some(amount => amount <= value.sandboxChannelFeeUsd)) {
    throw new Error('Sandbox channel fee must be precise and below each recharge amount');
  }
  const policyId = 'money-v1-' + createHash('sha256').update(JSON.stringify(value)).digest('hex').slice(0, 20);
  return Object.freeze({ ...value, rechargeAmountsUsd: Object.freeze(value.rechargeAmountsUsd), policyId });
}

export type MoneyConfig = ReturnType<typeof makeMoneyConfig>;
export const moneyConfig = makeMoneyConfig(process.env.MONEY_POLICY_JSON === undefined ? {} : JSON.parse(process.env.MONEY_POLICY_JSON));

export function moneySnapshot(config: MoneyConfig): MoneyPolicySnapshot {
  const { policyId, coinsPerUsd, diamondsPerUsd, orderDiamondsPerCoin, withdrawMinUsd, withdrawStepUsd,
    withdrawPlatformFeeRate, exchangeDiamonds, exchangeCoins } = config;
  return Object.freeze({ policyId, coinsPerUsd, diamondsPerUsd, orderDiamondsPerCoin, withdrawMinUsd,
    withdrawStepUsd, withdrawPlatformFeeRate, exchangeDiamonds, exchangeCoins });
}

export function quoteRecharge(config: MoneyConfig, amount: number): RechargeQuote {
  if (!config.rechargeAmountsUsd.includes(amount)) throw new Error('Unknown recharge amount');
  const gross = new Decimal(amount).times(config.coinsPerUsd);
  const net = new Decimal(amount).minus(config.sandboxChannelFeeUsd).times(config.coinsPerUsd).floor();
  if (!gross.isInteger() || !gross.lte(Number.MAX_SAFE_INTEGER) || !net.isInteger() || !net.lte(Number.MAX_SAFE_INTEGER) || net.lte(0)) throw new Error('Invalid recharge quote');
  return { amount, grossCoins: gross.toNumber(), channelFeeUsd: config.sandboxChannelFeeUsd,
    coins: net.toNumber(), bonus: 0, moneyPolicy: moneySnapshot(config) };
}

export function buildRechargePackages(config: MoneyConfig): RechargePackage[] {
  return config.rechargeAmountsUsd.map(amount => ({
    id: `usd_${amount}`, amount, coins: new Decimal(amount).times(config.coinsPerUsd).toNumber(), bonus: 0,
  }));
}

export function validatePackages(packages: RechargePackage[], config: MoneyConfig) {
  if (!packages.length || new Set(packages.map(p => p.id)).size !== packages.length) throw new Error('Recharge packages are empty or duplicated');
  for (const pkg of packages) {
    const expected = new Decimal(pkg.amount).times(config.coinsPerUsd);
    if (!pkg.id || !Number.isSafeInteger(pkg.amount) || pkg.amount <= 0 ||
        !Number.isSafeInteger(pkg.coins) || pkg.coins <= 0 || (pkg.bonus ?? 0) !== 0 ||
        !config.rechargeAmountsUsd.includes(pkg.amount) ||
        expected.minus(pkg.coins).abs().div(expected).gt(config.rechargePackageTolerance)) {
      throw new Error(`Recharge package ${pkg.id} does not match configured policy`);
    }
    quoteRecharge(config, pkg.amount);
  }
}
