import { afterAll, beforeAll, expect, it } from 'vitest';
import { isolatedApp } from '../helpers/isolatedApp.js';
import { isAdultBirthDate, isValidNickname } from '../../shared/registration.js';
import { LOCAL_SEED_ACCOUNTS, LOCAL_SEED_PASSWORD } from '../../scripts/seed-local.js';
import { readFileSync } from 'node:fs';
import path from 'node:path';

it('accepts the exact 18th birthday and rejects later or invalid dates', () => {
  const now = new Date('2026-11-22T12:00:00Z');
  expect(isAdultBirthDate('2008-11-22', now)).toBe(true);
  expect(isAdultBirthDate('2008-11-23', now)).toBe(false);
  expect(isAdultBirthDate('2000-02-30', now)).toBe(false);
  expect(isAdultBirthDate('2008-02-29', new Date('2026-02-28T12:00:00Z'))).toBe(false);
});

it('accepts Arabic and English nicknames but rejects unsupported punctuation and lengths', () => {
  for (const nickname of [
    'لاعب-١', 'لَاعِب', 'ﻻﻋﺐ', 'لــاعب', '𞸋𞸀𞸏𞸁', '𝓛𝓪𝓮𝓮𝓫',
    '★لاعب★', '☆لاعب☆', '『لاعب』', '★' + 'a'.repeat(22) + '★', 'Ready Player_2', 'a'.repeat(24),
  ]) expect(isValidNickname(nickname), nickname).toBe(true);
  for (const nickname of [
    'a', 'a'.repeat(25), 'Player🙂', 'Player@2', 'Player__2', '★a★', 'ــ', 'ـَـَ', 'اــ',
    '★لاعب☆', 'لا★عب', '★' + 'a'.repeat(23) + '★', '『』', '『لاعب', '★☆',
    'ل\u200Dاعب', 'لاع\u202Eب', 'لاع\u034Fب', 'لاع\uFE0Fب', '\uFEFFلاعب', 'لاعب\n',
  ]) expect(isValidNickname(nickname), nickname).toBe(false);
});

let app: Awaited<ReturnType<typeof isolatedApp>>;
beforeAll(async () => { app = await isolatedApp(); }, 25000);
afterAll(async () => { if (app) await app.stop(); });

it.each([false, true])('verifies email and completes a locked profile (custom avatar: %s)', async (customAvatar) => {
  const call = async (path: string, method: string, body?: unknown, token?: string) => {
    const headers = token ? { Authorization: 'Bearer ' + token } : {};
    const binary = body instanceof Uint8Array;
    return fetch(app.origin + path, {
      method, headers: { ...headers, 'Content-Type': binary ? 'image/png' : 'application/json' },
      body: body === undefined ? undefined : binary ? Buffer.from(body) : JSON.stringify(body),
    });
  };
  const email = `welcome-test-${customAvatar}@local.le3eb.invalid`;
  const sent = await call('/api/auth/email-code/send', 'POST', { email });
  expect(await sent.json()).toMatchObject({ ok: true, cooldownSec: 60 });
  let code: string | undefined;
  await expect.poll(() => {
    try {
      const logs = readFileSync(path.join(app.root, 'logs/dev.log'), 'utf8');
      const entry = logs.split('\n').find(line => line.includes('auth_email_code') && line.includes(email));
      code = entry && JSON.parse(entry).code;
    } catch { /* logger is asynchronous */ }
    return code;
  }).toMatch(/^\d{6}$/);
  const proof = await call('/api/auth/welcome/email', 'POST', { email, code });
  expect(proof.status).toBe(200);
  const pending = await proof.json();
  expect(pending).toMatchObject({ kind: 'profile' });
  expect(pending.token).toBeUndefined();
  expect(app.state().users.some((user: { email: string }) => user.email === email)).toBe(false);
  expect((await call('/api/auth/session', 'GET', undefined, pending.ticket)).status).toBe(401);
  const profile = { username: '★لَـاعب-١★', gender: 'M', country: 'SA', birthDate: '2000-01-01' };
  expect((await call('/api/auth/welcome/complete', 'POST', profile, pending.ticket)).status).toBe(422);
  const confirmed = { ...profile, genderConfirmed: true, useDefaultAvatar: !customAvatar };
  expect((await call('/api/auth/welcome/complete', 'POST', { ...confirmed, username: 'Invalid@name' }, pending.ticket)).status).toBe(422);
  expect((await call('/api/auth/welcome/complete', 'POST', { ...confirmed, gender: 'U' }, pending.ticket)).status).toBe(422);
  if (customAvatar) {
    expect((await call('/api/auth/welcome/avatar', 'POST', Buffer.from('not an image'), pending.ticket)).status).toBe(422);
    const avatar = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Y9Zl1sAAAAASUVORK5CYII=', 'base64');
    expect((await call('/api/auth/welcome/avatar', 'POST', avatar, pending.ticket)).status).toBe(204);
  }
  const completed = await call('/api/auth/welcome/complete', 'POST', confirmed, pending.ticket);
  expect(completed.status).toBe(201);
  const session = await completed.json();
  expect(session.user).toMatchObject({ username: profile.username, email });
  expect(session.user.avatarUrl).toMatch(customAvatar ? /^\/api\/uploads\/avatar\// : /^\/default-companion\.svg$/);
  expect((await fetch(app.origin + session.user.avatarUrl)).status).toBe(200);
  const admin = await (await call('/api/auth/login', 'POST', {
    email: LOCAL_SEED_ACCOUNTS.find(account => account.role === 'ADMIN')!.email, password: LOCAL_SEED_PASSWORD,
  })).json();
  expect((await call('/api/admin/operations/users/' + session.user.id + '/profile', 'POST',
    { gender: 'F' }, admin.token)).status).toBe(409);
  expect(app.state().users.find((user: { email: string }) => user.email === email).gender).toBe('M');
  expect((await call('/api/auth/session', 'GET', undefined, session.token)).status).toBe(200);
  expect((await call('/api/auth/logout', 'POST', {}, session.token)).status).toBe(200);
  expect((await call('/api/auth/session', 'GET', undefined, session.token)).status).toBe(401);
  expect((await call('/api/auth/welcome/complete', 'POST', confirmed, pending.ticket)).status).toBe(401);
  expect(app.state().users.filter((user: { email: string }) => user.email === email)).toHaveLength(1);
});
