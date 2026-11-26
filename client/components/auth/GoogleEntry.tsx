import { useEffect, useRef, useState } from 'react';
import { businessApi } from '../../services/businessApi';

type GoogleIdentity = {
  initialize(options: { client_id: string; nonce: string; callback: (result: { credential: string }) => void }): void;
  renderButton(parent: HTMLElement, options: Record<string, string | number>): void;
};
const identity = () => (window as Window & { google?: { accounts: { id: GoogleIdentity } } }).google?.accounts.id;
let loading: { locale: string; script: HTMLScriptElement; promise: Promise<GoogleIdentity> } | undefined;
function loadGoogle(language: string) {
  const locale = language === 'ar' ? 'ar' : 'en';
  if (loading?.locale === locale) return loading.promise;
  const previous = loading;
  const script = document.createElement('script');
  script.src = `https://accounts.google.com/gsi/client?hl=${locale}`;
  script.async = true;
  // The SDK must be loaded in the chosen language, not the browser's default.
  // Serialize a language change so that two loads cannot race.
  const promise = Promise.resolve(previous?.promise).catch(() => undefined).then(() => {
    previous?.script.remove();
    return new Promise<GoogleIdentity>((resolve, reject) => {
      script.onload = () => { const api = identity(); api ? resolve(api) : reject(); };
      script.onerror = () => reject();
      document.head.append(script);
    });
  }).catch(error => {
    script.remove();
    if (loading?.script === script) loading = undefined;
    throw error;
  });
  loading = { locale, script, promise };
  return promise;
}

export function GoogleEntry({ language, unavailable, onCredential, busy }: {
  language: string; unavailable: string; onCredential: (credential: string, nonce: string) => void; busy: boolean;
}) {
  const host = useRef<HTMLDivElement>(null);
  const submit = useRef(onCredential);
  submit.current = onCredential;
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    let active = true;
    setFailed(false);
    void businessApi.startGoogleAuth().then(async ({ clientId, nonce }) => {
      const api = await loadGoogle(language);
      if (!active || !host.current) return;
      api.initialize({ client_id: clientId, nonce, callback: ({ credential }) => {
        if (active) submit.current(credential, nonce);
      } });
      host.current.replaceChildren();
      api.renderButton(host.current, {
        theme: 'filled_black', size: 'large', shape: 'pill', type: 'standard',
        text: 'continue_with', locale: language, width: Math.min(400, Math.floor(host.current.clientWidth)),
      });
    }).catch(() => { if (active) setFailed(true); });
    return () => { active = false; };
  }, [language]);
  return <div className="wa-google" aria-disabled={busy} inert={busy}>
    <div ref={host} />
    {failed && <p className="wa-muted">{unavailable}</p>}
  </div>;
}
