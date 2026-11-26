import { createPublicKey, type JsonWebKey } from 'node:crypto';
import jwt from 'jsonwebtoken';
import { z } from 'zod';

const payloadSchema = z.object({
  sub: z.string().min(1).max(255),
  email: z.string().email().max(254),
  email_verified: z.literal(true),
  hd: z.string().optional(),
  exp: z.number(),
  nonce: z.string(),
});
let cachedKeys: { keys: Array<JsonWebKey & { kid: string }>; expires: number } | undefined;

export async function verifyGoogleIdentity(credential: string, audience: string, nonce: string) {
  const header = jwt.decode(credential, { complete: true })?.header;
  if (header?.alg !== 'RS256' || !header.kid) throw new Error('Invalid Google credential');
  if (!cachedKeys || cachedKeys.expires <= Date.now()) {
    const response = await fetch('https://www.googleapis.com/oauth2/v3/certs', {
      signal: AbortSignal.timeout(5000),
    });
    if (!response.ok) throw new Error('Google keys unavailable');
    const body = await response.json() as { keys: Array<JsonWebKey & { kid: string }> };
    const seconds = Number(response.headers.get('cache-control')?.match(/max-age=(\d+)/)?.[1] ?? 60);
    cachedKeys = { keys: body.keys, expires: Date.now() + seconds * 1000 };
  }
  const jwk = cachedKeys.keys.find(key => key.kid === header.kid && key.kty === 'RSA');
  if (!jwk) throw new Error('Unknown Google signing key');
  const payload = payloadSchema.parse(jwt.verify(credential, createPublicKey({ key: jwk, format: 'jwk' }), {
    algorithms: ['RS256'], audience, issuer: ['accounts.google.com', 'https://accounts.google.com'],
  }));
  if (payload.nonce !== nonce) throw new Error('Google sign-in expired');
  return {
    subject: payload.sub,
    email: payload.email.toLowerCase(),
    authoritativeEmail: payload.email.toLowerCase().endsWith('@gmail.com') || Boolean(payload.hd),
  };
}
