import { randomBytes } from 'node:crypto';

const extensions = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' } as const;
export const AVATAR_MAX_BYTES = 5 * 1024 * 1024;
export type AvatarMime = keyof typeof extensions;

export function avatarKey(userId: string, mime: AvatarMime) {
  return `uploads/${userId}/avatars/${randomBytes(16).toString('hex')}.${extensions[mime]}`;
}

export function isOwnedAvatarKey(key: string, userId: string) {
  const prefix = `uploads/${userId}/avatars/`;
  return /^[a-zA-Z0-9_-]+$/.test(userId) && key.startsWith(prefix) &&
    /^[a-f0-9]{32}\.(jpg|png|webp)$/.test(key.slice(prefix.length));
}

export function isAvatarMime(value: unknown): value is AvatarMime {
  return typeof value === 'string' && Object.hasOwn(extensions, value);
}

export function imageMime(bytes: Uint8Array): AvatarMime | null {
  const b = Buffer.from(bytes);
  if (b.subarray(0, 8).equals(Buffer.from('89504e470d0a1a0a', 'hex'))) return 'image/png';
  if (b.length >= 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return 'image/jpeg';
  if (b.length >= 12 && b.toString('ascii', 0, 4) === 'RIFF' && b.toString('ascii', 8, 12) === 'WEBP') return 'image/webp';
  return null;
}

export function matchesAvatarMime(key: string, mime: unknown): mime is AvatarMime {
  return isAvatarMime(mime) && key.endsWith(`.${extensions[mime]}`);
}
