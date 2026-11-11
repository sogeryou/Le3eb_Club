import { GAME_CATALOG, resolveStoredGame } from '../../shared/games.js';
import type { CompanionEntity, UserEntity } from './types.js';

export function gameDirectory(companions: CompanionEntity[], users: UserEntity[]) {
  const accounts = new Set(users.map(user => user.id));
  const counts = new Map<string, number>();
  for (const companion of companions) {
    if (companion.status !== 'APPROVED' || companion.availability !== 'ONLINE' || !accounts.has(companion.userId)) continue;
    const game = resolveStoredGame(companion.gameName);
    if (game) counts.set(game.id, (counts.get(game.id) ?? 0) + 1);
  }
  return GAME_CATALOG.map(game => ({ ...game, onlineCompanions: counts.get(game.id) ?? 0 }));
}
