import { Decimal } from 'decimal.js';
import { moneyConfig, validatePackages } from './moneyConfig.js';

Decimal.set({ precision: 28, rounding: Decimal.ROUND_HALF_UP });

export const MONEY_POLICY = Object.freeze({
  COINS_PER_USD: moneyConfig.coinsPerUsd,
  DIAMONDS_PER_USD: moneyConfig.diamondsPerUsd,
  WITHDRAW_FEE_RATE: moneyConfig.withdrawPlatformFeeRate,
  MIN_WITHDRAW_DIAMONDS: new Decimal(moneyConfig.withdrawMinUsd).times(moneyConfig.diamondsPerUsd).toNumber(),
  MAX_WITHDRAW_DIAMONDS: moneyConfig.maxWithdrawDiamonds,
  MAX_DAILY_RECHARGE_USD: moneyConfig.maxDailyRechargeUsd,
  RECHARGE_PACKAGE_TOLERANCE: moneyConfig.rechargePackageTolerance,
});

export function round2(value: Decimal.Value): number {
  return Number(new Decimal(value).toDecimalPlaces(2, Decimal.ROUND_HALF_UP));
}

/** Quote only: actual chain fees and the withdrawal workflow are not implemented by this function. */
export function computeWithdraw(diamondAmount: number) {
  let reason: string | undefined;
  if (!Number.isSafeInteger(diamondAmount) || diamondAmount <= 0) reason = 'WITHDRAW_AMOUNT_INVALID';
  else if (diamondAmount < MONEY_POLICY.MIN_WITHDRAW_DIAMONDS) reason = 'WITHDRAW_BELOW_MIN';
  else if (diamondAmount > MONEY_POLICY.MAX_WITHDRAW_DIAMONDS) reason = 'WITHDRAW_ABOVE_MAX';
  else if (!new Decimal(diamondAmount).div(moneyConfig.diamondsPerUsd).div(moneyConfig.withdrawStepUsd).isInteger()) reason = 'WITHDRAW_STEP_INVALID';
  const gross = Number.isFinite(diamondAmount) ? new Decimal(diamondAmount).div(moneyConfig.diamondsPerUsd) : new Decimal(0);
  const fee = gross.times(moneyConfig.withdrawPlatformFeeRate);
  return { diamondAmount, grossUsd: round2(gross), feeUsd: round2(fee), payoutUsd: round2(gross.minus(fee)),
    withinLimits: !reason, reason, chainFeePending: true };
}

export function validateRechargePackage(pkg: { id: string; amount: number; coins: number; bonus?: number }) {
  const expectedCoins = new Decimal(pkg.amount).times(moneyConfig.coinsPerUsd).toNumber();
  const actualCoins = pkg.coins + (pkg.bonus ?? 0);
  const deviation = expectedCoins > 0 ? Math.abs(actualCoins - expectedCoins) / expectedCoins : Infinity;
  try {
    validatePackages([pkg], moneyConfig);
    return { ok: true as const, expectedCoins, actualCoins, deviation };
  } catch {
    return { ok: false as const, expectedCoins, actualCoins, deviation, reason: `package ${pkg.id} deviation` };
  }
}
