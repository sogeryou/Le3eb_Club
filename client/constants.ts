import type { Game, EPal, Post } from '@shared/types';
import { GAME_CATALOG } from '@shared/games';

export const PRODUCT_SEMVER = '1.0.0';
export const GAMES: Game[] = [...GAME_CATALOG];

// Compatibility exports for the unused legacy entrypoint. Never seed public screens.
export const POSTS: Post[] = [];
export const EPALS: EPal[] = [];
