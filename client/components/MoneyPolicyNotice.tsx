import React from 'react';
import { useMoneyPolicy } from '../hooks/useMoneyPolicy';
import { useI18n } from '../i18n/I18nProvider';

export function MoneyPolicyNotice() {
  const policy = useMoneyPolicy();
  const { locale } = useI18n();
  const ar = locale === 'ar';
  return <aside role="status" className="rounded-xl border border-amber-400/40 p-3 text-sm text-amber-100">
    {policy ? <>
      <p>{policy.rechargeMode === 'sandbox'
        ? (ar ? 'اختبار محلي فقط — لا يتم خصم أموال حقيقية.' : 'Local sandbox only — no real money is charged.')
        : (ar ? 'الشحن الحقيقي غير متاح حالياً.' : 'Real recharge is not available.')}</p>
      <p><bdi>1 USD = {policy.coinsPerUsd}</bdi> {ar ? 'عملة قبل رسوم القناة.' : 'coins before channel fees.'}</p>
      <p>{ar ? 'تُخصم رسوم القناة من العملات المستلمة، ثم يُقرب الرصيد لأسفل.' : 'Channel fees reduce received coins; the final amount is rounded down.'}</p>
    </> : (ar ? 'جارٍ تحميل أسعار التحويل…' : 'Loading exchange policy…')}
  </aside>;
}
