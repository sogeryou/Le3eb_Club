import { describe, expect, it } from 'vitest';
import { GAME_CATALOG, resolveStoredGame, findCatalogGame } from '../../shared/games.js';
import { gameDirectory } from '../../backend/domain/gameDirectory.js';
import type { CompanionEntity, UserEntity } from '../../backend/domain/types.js';

describe('shared real game directory', () => {
  it('has only the seven agreed games and local art', () => {
    expect(GAME_CATALOG.map(g => g.name)).toEqual([
      'PUBG Mobile', 'EA Sports FC / FC Mobile', 'Free Fire', 'Valorant',
      'League of Legends', 'Call of Duty: Mobile', 'Roblox',
    ]);
    expect(GAME_CATALOG.every(g => g.imageUrl.startsWith('/'))).toBe(true);
    expect(GAME_CATALOG.some(g => 'onlineCount' in g)).toBe(false);
  });
  it('resolves explicit legacy aliases without guessing generic names', () => {
    expect(resolveStoredGame('League Pro')?.id).toBe('lol');
    expect(resolveStoredGame('Tactical Duo')?.id).toBe('val');
    expect(resolveStoredGame('EA FC')?.id).toBe('fc');
    expect(resolveStoredGame('Battle Royale')).toBeUndefined();
    expect(resolveStoredGame('Open World')).toBeUndefined();
    expect(findCatalogGame('League Pro')).toBeUndefined();
  });
  it('counts only approved, online companions with an existing account', () => {
    const player = (id: string, gameName: string, status = 'APPROVED', availability = 'ONLINE') =>
      ({ id, userId: id, gameName, status, availability }) as CompanionEntity;
    const companions = [
      player('one', 'PUBG Mobile'), player('two', 'PUBG Mobile', 'PENDING_REVIEW'),
      player('three', 'PUBG Mobile', 'APPROVED', 'BUSY'), player('four', 'Tactical Duo'),
      player('five', 'Battle Royale'), player('missing', 'PUBG Mobile'),
    ];
    const users = companions.filter(c => c.id !== 'missing').map(c => ({ id: c.id }) as UserEntity);
    const rows = gameDirectory(companions, users);
    expect(rows.find(g => g.id === 'pubg')?.onlineCompanions).toBe(1);
    expect(rows.find(g => g.id === 'val')?.onlineCompanions).toBe(1);
    expect(rows.find(g => g.id === 'roblox')?.onlineCompanions).toBe(0);
  });
});
