import { describe, expect, it } from 'vitest';
import { publicCompanion } from '../../backend/domain/publicCompanion.js';
import type { CompanionEntity, UserEntity } from '../../backend/domain/types.js';

const companion = {
  id: 'cp_real', userId: 'u_real', gameName: 'PUBG Mobile', intro: 'Duo',
  hourlyRate: 7, status: 'APPROVED', availability: 'ONLINE', createdAt: 1, updatedAt: 1,
} satisfies CompanionEntity;
const user = {
  id: 'u_real', username: 'Player', email: 'private@invalid.test',
  passwordHash: 'private', role: 'PLAYER', createdAt: 1,
} satisfies UserEntity;

describe('public companion projection', () => {
  it('uses the account name and does not invent reviews or expose credentials', () => {
    expect(publicCompanion(companion, user, [], [])).toMatchObject({
      id: 'cp_real', displayName: 'Player', avatarUrl: null, rating: null,
      completedOrderCount: 0,
    });
    expect(publicCompanion(companion, user, [], [])).not.toHaveProperty('email');
    expect(publicCompanion(companion, user, [], [])).not.toHaveProperty('passwordHash');
  });

  it('excludes unapproved records and records without an account', () => {
    expect(publicCompanion({ ...companion, status: 'REJECTED' }, user, [], [])).toBeNull();
    expect(publicCompanion(companion, undefined, [], [])).toBeNull();
  });
});
