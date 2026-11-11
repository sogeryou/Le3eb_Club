import { useEffect, useState } from 'react';
import type { PublicMoneyPolicy } from '@shared/money';
import { businessApi } from '../services/businessApi';

export function useMoneyPolicy() {
  const [policy, setPolicy] = useState<PublicMoneyPolicy | null>(null);
  useEffect(() => {
    let active = true;
    businessApi.getMoneyPolicy().then(value => { if (active) setPolicy(value); }).catch(() => {});
    return () => { active = false; };
  }, []);
  return policy;
}
