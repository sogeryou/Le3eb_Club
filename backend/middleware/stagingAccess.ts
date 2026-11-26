import crypto from 'node:crypto';
import type { RequestHandler } from 'express';

const TTL = 12 * 3600_000;
const equal = (a: string, b: string) => crypto.timingSafeEqual(crypto.createHash('sha256').update(a).digest(), crypto.createHash('sha256').update(b).digest());
const sign = (value: string, secret: string) => crypto.createHmac('sha256', secret).update('laeeb-staging:' + value).digest('hex');
export function stagingCredentialsValid(header: string | undefined, secret: string): boolean {
  if (!header?.startsWith('Basic ')) return false;
  return equal(Buffer.from(header.slice(6), 'base64').toString('utf8'), `tester:${secret}`);
}
export function createStagingSession(secret: string, now = Date.now()): string {
  const payload = `${now + TTL}.${crypto.randomBytes(16).toString('hex')}`;
  return `${payload}.${sign(payload, secret)}`;
}
export function stagingSessionValid(cookie: string | undefined, secret: string, now = Date.now()): boolean {
  if (!cookie || !/^\d+\.[a-f0-9]{32}\.[a-f0-9]{64}$/.test(cookie)) return false;
  const [expiry, nonce, signature] = cookie.split('.');
  return Number(expiry) > now && Number(expiry) <= now + TTL && equal(signature, sign(`${expiry}.${nonce}`, secret));
}
export function stagingAccess(secret: string): RequestHandler {
  return (req, res, next) => {
    if (req.method === 'GET' && req.path === '/healthz') return next();
    const cookie = req.headers.cookie?.split(';').map(x => x.trim()).find(x => x.startsWith('laeeb_stage='))?.slice('laeeb_stage='.length);
    res.set('Cache-Control', 'private, no-store');
    if (stagingSessionValid(cookie, secret)) return next();
    if (stagingCredentialsValid(req.get('Authorization'), secret)) {
      res.cookie('laeeb_stage', createStagingSession(secret), { httpOnly: true, secure: true, sameSite: 'lax', maxAge: TTL, path: '/' });
      return next();
    }
    res.set('WWW-Authenticate', 'Basic realm="Laeeb Private Staging", charset="UTF-8"');
    return res.status(401).send('Private Laeeb test site. Sign in to continue.');
  };
}

/** Startup-only acceptance check over loopback; never prints credentials or cookies. */
export async function verifyStagingAccess(origin: string, secret: string, request = fetch): Promise<void> {
  const get = (path: string, headers?: Record<string, string>) => request(origin + path, { headers, redirect: 'manual', signal: AbortSignal.timeout(8000) });
  const requireCheck = (condition: unknown) => { if (!condition) throw new Error('Staging access verification failed'); };
  const homepage = await get('/');
  requireCheck(homepage.status === 401 && homepage.headers.get('www-authenticate')?.startsWith('Basic '));
  const gatedApi = await get('/ready');
  requireCheck(gatedApi.status === 401);
  const health = await get('/healthz');
  requireCheck(health.status === 200);
  const authenticated = await get('/', { Authorization: 'Basic ' + Buffer.from(`tester:${secret}`).toString('base64') });
  requireCheck(authenticated.status === 200);
  const setCookie = authenticated.headers.get('set-cookie') ?? '';
  requireCheck(/\bSecure\b/i.test(setCookie) && /\bHttpOnly\b/i.test(setCookie) && /\bSameSite=Lax\b/i.test(setCookie));
  const cookie = setCookie.split(';')[0];
  requireCheck(cookie.startsWith('laeeb_stage='));
  const ready = await get('/ready', { Cookie: cookie });
  requireCheck(ready.status === 200);
  const status = await ready.json() as { ok?: boolean; redis?: boolean };
  requireCheck(status.ok === true && status.redis === true);
}
