import { mkdirSync, realpathSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defaultState } from '../backend/state/jsonState.js';
import { ROLE_TEMPLATES } from '../backend/domain/types.js';
import { hashPassword } from '../backend/auth/password.js';
import { GAME_CATALOG } from '../shared/games.js';

export const LOCAL_SEED_PASSWORD = 'Local-Only-Le3eb-2026!';
export const LOCAL_SEED_ACCOUNTS = [
  { id: 'local_admin', email: 'admin@local.le3eb.invalid', username: '[LOCAL] Admin', role: 'ADMIN' },
  { id: 'local_buyer_1', email: 'buyer1@local.le3eb.invalid', username: '[LOCAL] Buyer 1', role: 'USER' },
  { id: 'local_buyer_2', email: 'buyer2@local.le3eb.invalid', username: '[LOCAL] Buyer 2', role: 'USER' },
  { id: 'local_player_pubg', email: 'pubg@local.le3eb.invalid', username: '[LOCAL] PUBG Player', role: 'PLAYER' },
  { id: 'local_player_fc', email: 'fc@local.le3eb.invalid', username: '[LOCAL] FC Player', role: 'PLAYER' },
  { id: 'local_player_ff', email: 'freefire@local.le3eb.invalid', username: '[LOCAL] Free Fire Player', role: 'PLAYER' },
] as const;

/** Explicit local CLI only; atomically creates a new file and never overwrites any data. */
export async function seedLocal(target: string, env: NodeJS.ProcessEnv, confirmed: boolean) {
  if (!confirmed || env.LE3EB_LOCAL_SEED !== '1' || !['development', 'test'].includes(env.NODE_ENV ?? '') ||
      env.DATABASE_URL || env.REDIS_URL || env.S3_BUCKET) {
    throw new Error('Local seed refused: use explicit development/test mode, LE3EB_LOCAL_SEED=1 and --confirm-local; no external data services.');
  }
  const state = Object.assign(defaultState(), { localSeedOnly: true });
  const passwordHash = await hashPassword(LOCAL_SEED_PASSWORD);
  const now = Date.now();
  state.users = LOCAL_SEED_ACCOUNTS.map(account => ({
    ...account, passwordHash, createdAt: now,
    ...(account.role === 'ADMIN' ? { adminRoleTemplate: 'SUPER_ADMIN' as const, permissions: [...ROLE_TEMPLATES.SUPER_ADMIN] } : {}),
  }));
  for (const account of state.users) {
    state.wallets[account.id] = { userId: account.id, balance: 0, lastUpdated: now };
    state.diamondWallets[account.id] = { userId: account.id, balance: 0, lastUpdated: now };
  }
  state.companions = ['pubg', 'fc', 'freefire'].map((id, index) => ({
    id: `local_cp_${id}`, userId: LOCAL_SEED_ACCOUNTS[index + 3].id,
    gameName: GAME_CATALOG.find(game => game.id === id)!.name,
    intro: '[LOCAL DEVELOPMENT DATA] Not a live companion listing.',
    hourlyRate: 7, status: 'APPROVED', availability: 'ONLINE', createdAt: now, updatedAt: now,
  }));
  mkdirSync(path.dirname(target), { recursive: true });
  writeFileSync(target, JSON.stringify(state, null, 2), { flag: 'wx', mode: 0o600 });
}

const invoked = process.argv[1] && realpathSync(process.argv[1]) === realpathSync(fileURLToPath(import.meta.url));
if (invoked) {
  const args = process.argv.slice(2);
  const outputIndex = args.indexOf('--output');
  const target = outputIndex >= 0 ? path.resolve(args[outputIndex + 1] ?? '') :
    fileURLToPath(new URL('../backend/data/storage.json', import.meta.url));
  seedLocal(target, process.env, args.includes('--confirm-local')).then(() => {
    console.log('Local-only seed created. Six labeled accounts, three approved companions, zero balances. Never deploy this file.');
  }).catch(error => {
    console.error(error instanceof Error ? error.message : 'Local seed failed');
    process.exitCode = 1;
  });
}
