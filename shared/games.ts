import type { Game } from './types.js';

/** Canonical directory shared by applications, discovery, filters and backend validation. */
export const GAME_CATALOG: readonly Game[] = Object.freeze([
  { id: 'pubg', name: 'PUBG Mobile', imageUrl: '/game-pubg.jpg', category: 'GAMES', hasRank: true, hasServer: true, hasPlatform: true },
  { id: 'fc', name: 'EA Sports FC / FC Mobile', imageUrl: '/game-fc.jpg', category: 'GAMES', hasPlatform: true },
  { id: 'freefire', name: 'Free Fire', imageUrl: '/game-freefire.jpg', category: 'GAMES', hasRank: true, hasServer: true },
  { id: 'val', name: 'Valorant', imageUrl: '/game-valorant.jpg', category: 'GAMES', hasRank: true, hasMain: true, hasServer: true },
  { id: 'lol', name: 'League of Legends', imageUrl: '/game-lol.svg', category: 'GAMES', hasRank: true, hasMain: true, hasServer: true },
  { id: 'codm', name: 'Call of Duty: Mobile', imageUrl: '/game-codm.svg', category: 'GAMES', hasRank: true, hasServer: true },
  { id: 'roblox', name: 'Roblox', imageUrl: '/game-roblox.svg', category: 'GAMES', hasPlatform: true },
].map(game => Object.freeze(game)) as Game[]);

const key = (value: string) => value.trim().toLowerCase();
const accepted = new Map<string, Game>();
for (const game of GAME_CATALOG) {
  accepted.set(key(game.id), game);
  accepted.set(key(game.name), game);
}
for (const name of ['EA FC', 'EA Sports FC', 'FC Mobile', 'EA FC 24', 'EA FC 25', 'EA FC 26']) accepted.set(key(name), GAME_CATALOG[1]);
const legacy = new Map([['league pro', 'lol'], ['tactical duo', 'val']]);

/** Valid new submissions: canonical IDs/names and actual known title variants only. */
export function findCatalogGame(value: string | null | undefined) {
  return typeof value === 'string' ? accepted.get(key(value)) : undefined;
}

/** Read-only compatibility: ambiguous historic labels stay unresolved for admin review. */
export function resolveStoredGame(value: string | null | undefined) {
  if (typeof value !== 'string') return undefined;
  return findCatalogGame(value) ?? findCatalogGame(legacy.get(key(value)));
}

export function sameGame(left: string | null | undefined, right: string | null | undefined) {
  const a = resolveStoredGame(left);
  const b = resolveStoredGame(right);
  return Boolean(a && b && a.id === b.id);
}
