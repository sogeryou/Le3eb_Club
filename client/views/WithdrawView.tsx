import React from 'react';
import { useApp } from '../app/AppContext';
import { useMoneyPolicy } from '../hooks/useMoneyPolicy';

export function WithdrawView() {
  const { handleBack, locale } = useApp();
  const policy = useMoneyPolicy();
  const ar = locale === 'ar';
  return <section className="p-6 space-y-4">
    <button onClick={handleBack}>{ar ? 'رجوع' : 'Back'}</button>
    <h1 className="text-xl font-bold">{ar ? 'السحب' : 'Withdrawals'}</h1>
    <p role="status">{ar ? 'طلبات السحب الجديدة غير متاحة حتى اكتمال مراجعة إجراءات الدفع.' : 'New withdrawals are unavailable until the reviewed payout workflow is complete.'}</p>
    {policy && <>
      <p><bdi>{policy.diamondsPerUsd} diamonds = 1 USD</bdi></p>
      <p><bdi>{policy.withdrawMinUsd} USD</bdi> · <bdi>{policy.withdrawStepUsd} USD</bdi> {ar ? 'لكل خطوة' : 'per step'}</p>
      <p>{ar ? 'تُخصم رسوم الشبكة الفعلية من المبلغ المستلم.' : 'Actual network fees will be deducted from the received amount.'}</p>
    </>}
  </section>;
}
