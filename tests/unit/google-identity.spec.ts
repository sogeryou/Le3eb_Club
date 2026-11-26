import { generateKeyPairSync } from 'node:crypto';
import jwt from 'jsonwebtoken';
import { afterEach, expect, it, vi } from 'vitest';
import { verifyGoogleIdentity } from '../../backend/auth/googleIdentity';

afterEach(() => vi.unstubAllGlobals());
it('checks Google signature, audience, expiration, email verification and the login nonce', async () => {
  const { privateKey, publicKey } = generateKeyPairSync('rsa', { modulusLength: 2048 });
  const key = { ...publicKey.export({ format: 'jwk' }), kid: 'test-google-key' };
  vi.stubGlobal('fetch', vi.fn(async () => Response.json({ keys: [key] })));
  const credential = (claims: Record<string, unknown> = {}, expiresIn = 60) => jwt.sign({
    sub: 'test-user', email: 'player@gmail.com', email_verified: true, nonce: 'login-challenge', ...claims,
  }, privateKey, {
    algorithm: 'RS256', keyid: key.kid, audience: 'test-client',
    issuer: 'https://accounts.google.com', expiresIn,
  });
  await expect(verifyGoogleIdentity(credential(), 'test-client', 'login-challenge')).resolves.toEqual({
    subject: 'test-user', email: 'player@gmail.com', authoritativeEmail: true,
  });
  await expect(verifyGoogleIdentity(credential(), 'another-client', 'login-challenge')).rejects.toThrow();
  await expect(verifyGoogleIdentity(credential(), 'test-client', 'another-challenge')).rejects.toThrow();
  await expect(verifyGoogleIdentity(credential({ email_verified: false }), 'test-client', 'login-challenge')).rejects.toThrow();
  await expect(verifyGoogleIdentity(credential({}, -1), 'test-client', 'login-challenge')).rejects.toThrow();
});
