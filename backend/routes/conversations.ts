import { randomUUID } from 'node:crypto';
import type { Application, Request } from 'express';
import { z } from 'zod';
import type { AppContext } from '../app/context.js';
import type { PersistedState } from '../domain/types.js';
import type { DirectMessage } from '../../shared/directMessages.js';

const Create = z.union([
  z.object({ companionId: z.string().min(1).max(128) }).strict(),
  z.object({ orderId: z.string().min(1).max(128) }).strict(),
]);
const Send = z.object({ content: z.string().trim().min(1).max(2000), clientId: z.string().uuid().optional() }).strict();
const Read = z.object({ through: z.number().int().nonnegative().safe() }).strict();
const Query = z.object({
  before: z.coerce.number().int().positive().safe().optional(),
  after: z.coerce.number().int().nonnegative().safe().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
}).refine(q => q.before === undefined || q.after === undefined);
const actor = (req: Request) => (req as Request & { authUserId: string }).authUserId;
const publicMessage = ({ sequence, senderId, content, createdAt }: DirectMessage): DirectMessage => ({ sequence, senderId, content, createdAt });

export function registerConversationRoutes(app: Application, ctx: AppContext, conversations: PersistedState['conversations']) {
  const { authMiddleware, sendError, getUserById, getBanError, persistState } = ctx;
  type Conversation = (typeof conversations)[number];
  const summary = (c: Conversation, userId: string) => {
    const peerId = c.participants.find(id => id !== userId)!;
    const peer = getUserById(peerId);
    const last = c.messages[c.messages.length - 1];
    return {
      id: c.id,
      peer: { id: peerId, displayName: peer?.username ?? '—', avatarUrl: peer?.avatarUrl ?? null },
      lastMessage: last ? publicMessage(last) : null,
      updatedAt: last?.createdAt ?? c.createdAt,
      unreadCount: c.messages.slice(c.readThrough[userId] ?? 0).filter(m => m.senderId !== userId).length,
    };
  };
  const find = (id: string) => conversations.find(c => c.id === id);
  app.use('/api/conversations', (_req, res, next) => {
    res.set('Cache-Control', 'private, no-store');
    next();
  });
  app.post('/api/conversations', authMiddleware, (req, res) => {
    const userId = actor(req);
    if (getBanError(getUserById(userId), 'PRIVATE_CHAT')) return sendError(res, 403, 'CHAT_ACTION_BLOCKED', 'Chat is unavailable');
    const body = Create.safeParse(req.body);
    if (!body.success) return sendError(res, 400, 'CHAT_TARGET_REQUIRED', 'Provide one companion or order ID');
    let companion;
    let peerId: string;
    if ('orderId' in body.data) {
      const { orderId } = body.data;
      const order = ctx.orders.find(o => o.id === orderId);
      if (!order) return sendError(res, 404, 'ORDER_NOT_FOUND', 'Order not found');
      companion = ctx.companions.find(c => c.id === order.companionId);
      if (order.userId !== userId && companion?.userId !== userId) return sendError(res, 403, 'ORDER_FORBIDDEN', 'Order access denied');
      if (!companion) return sendError(res, 404, 'COMPANION_NOT_FOUND', 'Companion not found');
      peerId = order.userId === userId ? companion.userId : order.userId;
    } else if ('companionId' in body.data) {
      const { companionId } = body.data;
      companion = ctx.companions.find(c => c.id === companionId);
      if (!companion) return sendError(res, 404, 'COMPANION_NOT_FOUND', 'Companion not found');
      peerId = companion.userId;
    } else return sendError(res, 400, 'CHAT_TARGET_REQUIRED', 'Provide one companion or order ID');
    if (peerId === userId) return sendError(res, 400, 'CHAT_SELF_NOT_ALLOWED', 'Cannot message yourself');
    if (!getUserById(peerId)) return sendError(res, 404, 'CHAT_PEER_NOT_FOUND', 'Participant not found');
    if (companion.status !== 'APPROVED') return sendError(res, 409, 'CHAT_COMPANION_NOT_APPROVED', 'Companion is not approved');
    const existing = conversations.find(c => c.participants.includes(userId) && c.participants.includes(peerId));
    if (existing) return res.json(summary(existing, userId));
    const created: Conversation = { id: randomUUID(), participants: [userId, peerId], messages: [], readThrough: {}, createdAt: Date.now() };
    conversations.push(created);
    try { persistState(); } catch {
      conversations.pop();
      return sendError(res, 503, 'CHAT_SAVE_FAILED', 'Could not create conversation');
    }
    return res.status(201).json(summary(created, userId));
  });

  app.get('/api/conversations', authMiddleware, (req, res) => {
    const userId = actor(req);
    res.json(conversations.filter(c => c.participants.includes(userId)).map(c => summary(c, userId))
      .sort((a, b) => b.updatedAt - a.updatedAt || a.id.localeCompare(b.id)));
  });

  app.get('/api/conversations/:id/messages', authMiddleware, (req, res) => {
    const c = find(req.params.id);
    const userId = actor(req);
    if (!c) return sendError(res, 404, 'CHAT_NOT_FOUND', 'Conversation not found');
    if (!c.participants.includes(userId)) return sendError(res, 403, 'CHAT_FORBIDDEN', 'Conversation access denied');
    const q = Query.safeParse(req.query);
    if (!q.success) return sendError(res, 400, 'CHAT_PAGE_INVALID', 'Invalid pagination');
    const { before, after, limit } = q.data;
    const end = Math.min(c.messages.length, before === undefined ? c.messages.length : before - 1);
    const start = after === undefined ? Math.max(0, end - limit) : Math.min(after, c.messages.length);
    const messages = c.messages.slice(start, after === undefined ? end : start + limit);
    res.json({ conversation: summary(c, userId), messages: messages.map(publicMessage), hasOlder: start > 0 });
  });

  app.post('/api/conversations/:id/messages', authMiddleware, (req, res) => {
    const c = find(req.params.id);
    const userId = actor(req);
    if (!c) return sendError(res, 404, 'CHAT_NOT_FOUND', 'Conversation not found');
    if (!c.participants.includes(userId)) return sendError(res, 403, 'CHAT_FORBIDDEN', 'Conversation access denied');
    if (getBanError(getUserById(userId), 'PRIVATE_CHAT')) return sendError(res, 403, 'CHAT_ACTION_BLOCKED', 'Chat is unavailable');
    const body = Send.safeParse(req.body);
    if (!body.success) return sendError(res, 400, 'CHAT_CONTENT_INVALID', 'Send 1–2000 characters of text');
    const { content, clientId } = body.data;
    const previous = clientId && c.messages.find(m => m.senderId === userId && m.clientId === clientId);
    if (previous) {
      if (previous.content !== content) return sendError(res, 409, 'CHAT_RETRY_CONFLICT', 'Retry identifier is already used');
      return res.json(publicMessage(previous));
    }
    const message = { sequence: c.messages.length + 1, senderId: userId, content, createdAt: Date.now(), clientId };
    c.messages.push(message);
    try { persistState(); } catch {
      c.messages.pop();
      return sendError(res, 503, 'CHAT_SAVE_FAILED', 'Could not save message');
    }
    res.status(201).json(publicMessage(message));
  });

  app.post('/api/conversations/:id/read', authMiddleware, (req, res) => {
    const c = find(req.params.id);
    const userId = actor(req);
    if (!c) return sendError(res, 404, 'CHAT_NOT_FOUND', 'Conversation not found');
    if (!c.participants.includes(userId)) return sendError(res, 403, 'CHAT_FORBIDDEN', 'Conversation access denied');
    const body = Read.safeParse(req.body);
    if (!body.success || body.data.through > c.messages.length) return sendError(res, 400, 'CHAT_CURSOR_INVALID', 'Invalid read position');
    const previous = c.readThrough[userId] ?? 0;
    if (body.data.through > previous) {
      c.readThrough[userId] = body.data.through;
      try { persistState(); } catch {
        c.readThrough[userId] = previous;
        return sendError(res, 503, 'CHAT_SAVE_FAILED', 'Could not save read position');
      }
    }
    res.json({ unreadCount: summary(c, userId).unreadCount });
  });
}
