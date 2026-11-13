import { useEffect, useRef } from 'react';
import { useApp } from '../app/AppContext';

/** Capture the initiating UI session; late responses must never mutate another account. */
export function useActiveSessionGuard() {
  const { authToken, authUser } = useApp();
  const identity = useRef({ token: authToken, userId: authUser?.id });
  const mounted = useRef(false);
  identity.current = { token: authToken, userId: authUser?.id };
  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);
  return () => {
    const expected = identity.current;
    return () => mounted.current && expected.token === identity.current.token && expected.userId === identity.current.userId;
  };
}
