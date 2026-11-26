import express from 'express';
import { randomBytes, randomUUID } from 'node:crypto';
import { z } from 'zod';
import { getCache } from '../cache/redis.js';
import { localVerificationCodeStore, normalizeAuthEmail } from '../auth/emailCode.js';
import { verifyGoogleIdentity } from '../auth/googleIdentity.js';
import { imageMime } from '../storage/avatarUpload.js';
import { storeRegistrationAvatar } from './uploads.js';
import { isDeviceBanned } from './ops.js';
import { DEFAULT_REGISTRATION_AVATAR, REGISTRATION_AVATAR_LIMIT, isAdultBirthDate, isValidNickname, normalizeNickname } from '../../shared/registration.js';
import type { AppContext } from '../app/context.js';

type User = AppContext['users'][number];
type Proof = { id: string; email: string; subject?: string; userId?: string; kind?: 'profile' | 'confirm-google' };
const TTL = 20 * 60;
const token = () => randomBytes(32).toString('base64url');
const proofKey = (ticket: string) => 'welcome:proof:' + ticket;
const bodyEmail = z.string().trim().email().max(254);
const device = z.string().max(128).optional();
const profile = z.object({
  username: z.string().max(128).refine(isValidNickname).transform(normalizeNickname),
  gender: z.enum(['M', 'F']),
  genderConfirmed: z.literal(true),
  useDefaultAvatar: z.boolean(),
  country: z.string().regex(/^[A-Z]{2}$/),
  birthDate: z.string().refine(date => isAdultBirthDate(date)),
  deviceId: device,
});

export function registerWelcomeAuth(app: express.Application, ctx: AppContext, issueSession: (user: User) => Promise<unknown>) {
  const findEmail = (email: string) => ctx.users.find(user => normalizeAuthEmail(user.email) === email);
  const findGoogle = (subject: string) => ctx.users.find(user => user.googleSubject === subject);
  const cache = () => getCache();
  const bad = (res: express.Response, status: number, code: string) => ctx.sendError(res, status, code, code);
  const blocked = (user: User | undefined, deviceId?: string) =>
    isDeviceBanned(ctx.deviceBans, deviceId) || user?.accountStatus === 'FROZEN' || user?.role === 'ADMIN';
  const read = async (key: string): Promise<Proof | null> => {
    const value = await cache().get(key);
    return value ? JSON.parse(value) as Proof : null;
  };
  const ticketFor = (req: express.Request) => /^Bearer ([\w-]{43})$/.exec(req.get('Authorization') ?? '')?.[1] ?? '';
  const saveTicket = async (res: express.Response, proof: Proof, kind: 'profile' | 'confirm-google') => {
    const ticket = token();
    await cache().setex(proofKey(ticket), TTL, JSON.stringify({ ...proof, kind }));
    return res.json({ kind, ticket, email: proof.email });
  };
  const login = async (res: express.Response, user: User, deviceId?: string) => {
    if (blocked(user, deviceId)) return bad(res, 403, 'AUTH_ACCOUNT_UNAVAILABLE');
    user.lastLoginAt = Date.now();
    if (deviceId) user.deviceId = deviceId;
    return res.json({ kind: 'session', session: await issueSession(user) });
  };
  const route = (handler: (req: express.Request, res: express.Response) => Promise<unknown>): express.RequestHandler =>
    (req, res) => { void handler(req, res).catch(() => {
      if (!res.headersSent) bad(res, 503, 'AUTH_UNAVAILABLE');
    }); };
  app.use('/api/auth/welcome', (_req, res, next) => { res.set('Cache-Control', 'no-store'); next(); });
  app.post('/api/auth/welcome/email', route(async (req, res) => {
    const parsed = z.object({ email: bodyEmail, code: z.string().regex(/^\d{6}$/), deviceId: device,
      googleTicket: z.string().regex(/^[\w-]{43}$/).optional() }).safeParse(req.body);
    if (!parsed.success) return bad(res, 422, 'AUTH_FIELDS_INVALID');
    const { code, deviceId, googleTicket } = parsed.data;
    const email = normalizeAuthEmail(parsed.data.email);
    const google = googleTicket ? await read(proofKey(googleTicket)) : null;
    if (googleTicket && (!google?.subject || google.kind !== 'confirm-google' || google.email !== email)) return bad(res, 401, 'AUTH_PROOF_EXPIRED');
    const user = findEmail(email);
    if (blocked(user, deviceId)) return bad(res, 403, 'AUTH_ACCOUNT_UNAVAILABLE');
    if (!localVerificationCodeStore.redeem(email, 'login', code)) return bad(res, 401, 'AUTH_EMAIL_CODE_INVALID');
    if (googleTicket) {
      if (!google || (google.userId && user?.id !== google.userId)) return bad(res, 409, 'AUTH_ACCOUNT_CHANGED');
      await cache().del(proofKey(googleTicket));
      if (user && google.subject) {
        const other = findGoogle(google.subject);
        if ((other && other.id !== user.id) || (user.googleSubject && user.googleSubject !== google.subject)) {
          return bad(res, 409, 'AUTH_GOOGLE_ALREADY_LINKED');
        }
        user.googleSubject = google.subject;
      }
    }
    if (user) {
      user.emailVerifiedAt ||= Date.now();
      return login(res, user, deviceId);
    }
    return saveTicket(res, { id: 'user_' + randomUUID(), email, subject: google?.subject }, 'profile');
  }));
  app.post('/api/auth/welcome/google/start', route(async (_req, res) => {
    const clientId = process.env.GOOGLE_AUTH_CLIENT_ID;
    if (!clientId) return bad(res, 503, 'AUTH_GOOGLE_UNAVAILABLE');
    const nonce = token();
    await cache().setex('welcome:google:' + nonce, 600, '1');
    return res.json({ clientId, nonce });
  }));
  app.post('/api/auth/welcome/google', route(async (req, res) => {
    const clientId = process.env.GOOGLE_AUTH_CLIENT_ID;
    if (!clientId) return bad(res, 503, 'AUTH_GOOGLE_UNAVAILABLE');
    const parsed = z.object({ credential: z.string().min(1).max(16000),
      nonce: z.string().regex(/^[\w-]{43}$/), deviceId: device }).safeParse(req.body);
    if (!parsed.success) return bad(res, 422, 'AUTH_FIELDS_INVALID');
    const { credential, nonce, deviceId } = parsed.data;
    if (!(await cache().get('welcome:google:' + nonce))) return bad(res, 401, 'AUTH_PROOF_EXPIRED');
    const identity = await verifyGoogleIdentity(credential, clientId, nonce).catch(() => null);
    if (!identity || !(await cache().del('welcome:google:' + nonce))) return bad(res, 401, 'AUTH_GOOGLE_INVALID');
    const linked = findGoogle(identity.subject);
    if (linked) return login(res, linked, deviceId);
    const match = findEmail(identity.email);
    if (blocked(match, deviceId)) return bad(res, 403, 'AUTH_ACCOUNT_UNAVAILABLE');
    return saveTicket(res, {
      id: 'user_' + randomUUID(), email: identity.email, subject: identity.subject, userId: match?.id,
    }, match || !identity.authoritativeEmail ? 'confirm-google' : 'profile');
  }));
  app.post('/api/auth/welcome/avatar',
    express.raw({ type: ['image/jpeg', 'image/png', 'image/webp'], limit: REGISTRATION_AVATAR_LIMIT }),
    route(async (req, res) => {
      const ticket = ticketFor(req);
      const proof = ticket && await read(proofKey(ticket));
      if (proof?.kind !== 'profile') return bad(res, 401, 'AUTH_PROOF_EXPIRED');
      if (!Buffer.isBuffer(req.body) || imageMime(req.body) !== req.get('Content-Type')) {
        return bad(res, 422, 'AUTH_AVATAR_INVALID');
      }
      const url = await storeRegistrationAvatar(proof.id, req.body);
      await cache().setex(proofKey(ticket) + ':avatar', TTL, url);
      return res.sendStatus(204);
    }),
  );
  app.post('/api/auth/welcome/complete', route(async (req, res) => {
    const ticket = ticketFor(req);
    const proof = ticket && await read(proofKey(ticket));
    if (!proof || proof.kind !== 'profile') return bad(res, 401, 'AUTH_PROOF_EXPIRED');
    const parsed = profile.safeParse(req.body);
    if (!parsed.success) return bad(res, 422, 'AUTH_PROFILE_INVALID');
    if (blocked(undefined, parsed.data.deviceId)) return bad(res, 403, 'AUTH_ACCOUNT_UNAVAILABLE');
    const avatarUrl = parsed.data.useDefaultAvatar ? DEFAULT_REGISTRATION_AVATAR
      : await cache().get(proofKey(ticket) + ':avatar');
    if (!avatarUrl) return bad(res, 422, 'AUTH_AVATAR_REQUIRED');
    if (!(await cache().del(proofKey(ticket)))) return bad(res, 401, 'AUTH_PROOF_EXPIRED');
    if (findEmail(proof.email) || (proof.subject && findGoogle(proof.subject))) return bad(res, 409, 'AUTH_ACCOUNT_CHANGED');
    const now = Date.now();
    const { username, country, birthDate, gender, deviceId } = parsed.data;
    if (!username) return bad(res, 422, 'AUTH_PROFILE_INVALID');
    const user: User = {
      country, birthDate, gender, deviceId, username, id: proof.id, email: proof.email, avatarUrl, role: 'USER', passwordHash: '',
      googleSubject: proof.subject, createdAt: now, emailVerifiedAt: now, lastLoginAt: now,
      accountStatus: 'ACTIVE', followCount: 0,
    };
    ctx.users.push(user);
    ctx.wallets[user.id] = { userId: user.id, balance: 0, lastUpdated: now };
    try {
      ctx.persistState();
    } catch (error) {
      ctx.users.pop();
      delete ctx.wallets[user.id];
      await cache().setex(proofKey(ticket), TTL, JSON.stringify(proof));
      throw error;
    }
    return res.status(201).json(await issueSession(user));
  }));
}
