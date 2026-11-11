export type MoneyPolicySnapshot = Readonly<{
  policyId: string;
  coinsPerUsd: number;
  diamondsPerUsd: number;
  orderDiamondsPerCoin: number;
  withdrawMinUsd: number;
  withdrawStepUsd: number;
  withdrawPlatformFeeRate: number;
  exchangeDiamonds: number;
  exchangeCoins: number;
}>;

export type RechargeQuote = {
  amount: number;
  grossCoins: number;
  channelFeeUsd: number;
  coins: number;
  bonus: 0;
  moneyPolicy: MoneyPolicySnapshot;
};

export type PublicMoneyPolicy = MoneyPolicySnapshot & {
  rechargeMode: 'sandbox' | 'unavailable';
  withdrawalsEnabled: false;
  exchangeEnabled: false;
};
