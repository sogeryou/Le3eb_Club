import { describe, expect, it } from 'vitest';
import { createStagingSession, stagingSessionValid, stagingCredentialsValid } from '../../backend/middleware/stagingAccess.js';

const secret = 'unit-test-staging-password-not-real';
describe('private staging access', () => {
  it('requires the intended account credentials', () => {
    const header = 'Basic ' + Buffer.from('tester:' + secret).toString('base64');
    expect(stagingCredentialsValid(header, secret)).toBe(true);
    expect(stagingCredentialsValid('Bearer app-token', secret)).toBe(false);
    expect(stagingCredentialsValid(undefined, secret)).toBe(false);
  });
  it('only accepts valid unexpired signed sessions', () => {
    const now = 1000;
    const cookie = createStagingSession(secret, now);
    expect(stagingSessionValid(cookie, secret, now)).toBe(true);
    expect(stagingSessionValid(cookie, 'other-password', now)).toBe(false);
    expect(stagingSessionValid(cookie, secret, now + 13 * 3600_000)).toBe(false);
    expect(stagingSessionValid(undefined, secret, now)).toBe(false);
  });
});

import { verifyStagingAccess } from '../../backend/middleware/stagingAccess.js';
it('fails startup validation if the private homepage is not protected', async () => {
  const unprotected = async () => new Response('page', { status: 200 });
  await expect(verifyStagingAccess('http://127.0.0.1:3000', secret, unprotected)).rejects.toThrow('Staging access verification failed');
});
it('accepts a protected homepage and valid session, including authenticated readiness', async () => {
  const cookie = 'laeeb_stage=' + createStagingSession(secret);
  const request = async (input: RequestInfo | URL, init?: RequestInit) => {
    const path = new URL(String(input)).pathname;
    const headers = new Headers(init?.headers);
    if (path === '/healthz') return new Response('ok');
    if (headers.has('authorization')) return new Response('page', { headers: { 'Set-Cookie': cookie + '; Path=/; Secure; HttpOnly; SameSite=Lax' } });
    if (headers.get('Cookie') === cookie) return new Response(JSON.stringify({ok:true,redis:true}), { status: 200 });
    return new Response('private', { status: 401, headers: { 'WWW-Authenticate': 'Basic realm="Laeeb Private Staging"' } });
  };
  await expect(verifyStagingAccess('http://127.0.0.1:3000', secret, request)).resolves.toBeUndefined();
});
