import express from 'express';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { AppContext } from '../app/context.js';
import { DevObjectStore, S3ObjectStore, resolveObjectStore, validateUploadMime } from '../storage/objectStore.js';
import { loadEnv } from '../config/env.js';
import { AVATAR_MAX_BYTES, avatarKey, imageMime, isAvatarMime, isOwnedAvatarKey, matchesAvatarMime } from '../storage/avatarUpload.js';

const avatarDirectory = fileURLToPath(new URL('../data/avatars/', import.meta.url));
const localAvatarUrl = (key: string) => '/api/uploads/avatar/' + key.split('/').map(encodeURIComponent).join('/');
const localEnabled = () => loadEnv().NODE_ENV !== 'production' && resolveObjectStore() instanceof DevObjectStore;

export function registerUploadRoutes(app: express.Application, ctx: AppContext) {
  app.post('/api/uploads/signed', ctx.authMiddleware, async (req, res) => {
    if (req.body?.purpose === 'avatar') {
      const userId = (req as any).authUserId as string;
      const mime = req.body?.mime;
      if (!isAvatarMime(mime)) return ctx.sendError(res, 400, 'UPLOAD_MIME_INVALID', 'Use JPEG, PNG or WebP');
      try {
        const store = resolveObjectStore();
        if (!localEnabled() && (!(store instanceof S3ObjectStore) || !loadEnv().S3_PUBLIC_BASE_URL)) {
          return ctx.sendError(res, 503, 'AVATAR_STORAGE_UNAVAILABLE', 'Avatar storage is not configured');
        }
        const key = avatarKey(userId, mime);
        const signed = store instanceof S3ObjectStore
          ? await store.presignPut(key, mime, AVATAR_MAX_BYTES, true)
          : await store.presignPut(key, mime, AVATAR_MAX_BYTES);
        return res.json({ ...signed, fields: {} });
      } catch {
        return ctx.sendError(res, 503, 'AVATAR_STORAGE_UNAVAILABLE', 'Avatar storage is unavailable');
      }
    }
    const kind = req.body?.kind === 'video' ? 'video' : 'image';
    const mime = String(req.body?.mime || (kind === 'video' ? 'video/mp4' : 'image/jpeg'));
    const check = validateUploadMime(mime, kind);
    if (!check.ok) return ctx.sendError(res, 400, 'UPLOAD_MIME_INVALID', 'MIME not allowed');
    const key = `uploads/${(req as any).authUserId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const store = resolveObjectStore();
    const signed = await store.presignPut(key, mime, check.maxBytes);
    res.json({ ...signed, fields: {}, maxBytes: check.maxBytes });
  });

  app.put('/api/uploads/dev-put', ctx.authMiddleware, express.raw({ type: ['image/jpeg', 'image/png', 'image/webp'], limit: AVATAR_MAX_BYTES }), async (req, res) => {
    if (!localEnabled()) return res.sendStatus(404);
    const userId = (req as any).authUserId as string;
    const key = String(req.query.key ?? '');
    if (!isOwnedAvatarKey(key, userId)) return res.sendStatus(403);
    if (!Buffer.isBuffer(req.body) || !matchesAvatarMime(key, imageMime(req.body)) || imageMime(req.body) !== req.get('Content-Type')) {
      return res.sendStatus(415);
    }
    try {
      const target = path.join(avatarDirectory, key);
      await mkdir(path.dirname(target), { recursive: true });
      await writeFile(target, req.body, { flag: 'wx' });
      return res.sendStatus(204);
    } catch {
      return res.sendStatus(409);
    }
  });

  app.get('/api/uploads/avatar/uploads/:owner/avatars/:file', async (req, res) => {
    if (!localEnabled()) return res.sendStatus(404);
    const { owner, file } = req.params;
    const key = `uploads/${owner}/avatars/${file}`;
    if (!isOwnedAvatarKey(key, owner) || ctx.getUserById(owner)?.avatarUrl !== localAvatarUrl(key)) return res.sendStatus(404);
    try {
      const bytes = await readFile(path.join(avatarDirectory, key));
      const mime = imageMime(bytes);
      if (!matchesAvatarMime(key, mime)) return res.sendStatus(404);
      return res.set('X-Content-Type-Options', 'nosniff').type(mime).send(bytes);
    } catch {
      return res.sendStatus(404);
    }
  });

  app.post('/api/uploads/commit', ctx.authMiddleware, async (req, res) => {
    if (req.body?.purpose === 'avatar') {
      const userId = (req as any).authUserId as string;
      const key = String(req.body?.key ?? '');
      const user = ctx.getUserById(userId);
      if (!user || !isOwnedAvatarKey(key, userId)) return ctx.sendError(res, 403, 'UPLOAD_FORBIDDEN', 'Upload does not belong to this account');
      let avatarUrl: string | null = null;
      try {
        const store = resolveObjectStore();
        if (store instanceof S3ObjectStore) avatarUrl = await store.verifiedAvatarUrl(key);
        else if (localEnabled()) {
          const bytes = await readFile(path.join(avatarDirectory, key));
          if (bytes.length <= AVATAR_MAX_BYTES && matchesAvatarMime(key, imageMime(bytes))) avatarUrl = localAvatarUrl(key);
        }
      } catch { /* unverified upload must not change the profile */ }
      if (!avatarUrl) return ctx.sendError(res, 422, 'AVATAR_UPLOAD_UNVERIFIED', 'Upload a valid image before saving');
      const previousAvatarUrl = user.avatarUrl;
      user.avatarUrl = avatarUrl;
      try {
        ctx.persistState();
      } catch {
        user.avatarUrl = previousAvatarUrl;
        return ctx.sendError(res, 503, 'AVATAR_PROFILE_SAVE_FAILED', 'Avatar could not be saved');
      }
      return res.status(201).json({ avatarUrl });
    }
    res.status(201).json({
      id: `asset_${Math.random().toString(36).slice(2, 9)}`,
      key: req.body?.key,
      status: 'PENDING',
      ownerId: (req as any).authUserId,
    });
  });
}
