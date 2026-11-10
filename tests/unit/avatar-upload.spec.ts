import { describe, expect, it } from 'vitest';
import { isOwnedAvatarKey, imageMime } from '../../backend/storage/avatarUpload.js';

describe('avatar uploads', () => {
  it('accepts only the authenticated owner and a generated avatar key', () => {
    expect(isOwnedAvatarKey('uploads/u_1/avatars/0123456789abcdef0123456789abcdef.png', 'u_1')).toBe(true);
    expect(isOwnedAvatarKey('uploads/u_10/avatars/0123456789abcdef0123456789abcdef.png', 'u_1')).toBe(false);
    expect(isOwnedAvatarKey('uploads/u_1/avatars/../private.png', 'u_1')).toBe(false);
    expect(isOwnedAvatarKey('uploads/u_1/avatars/0123456789abcdef0123456789abcdef.svg', 'u_1')).toBe(false);
  });
  it('rejects unsupported image bytes even when named png', () => {
    expect(imageMime(Buffer.from('89504e470d0a1a0a', 'hex'))).toBe('image/png');
    expect(imageMime(Buffer.from('<svg></svg>'))).toBeNull();
  });
});
