import { mkdtempSync, existsSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { seedLocal, LOCAL_SEED_PASSWORD } from '../../scripts/seed-local.js';
import { verifyPassword } from '../../backend/auth/password.js';

describe('explicit local seed safety', () => {
  it('requires all local switches and refuses production or external data services', async () => {
    const root = mkdtempSync(path.join(tmpdir(), 'le3eb-seed-test-'));
    const target = path.join(root, 'storage.json');
    try {
      for (const env of [
        {}, { NODE_ENV: 'production', LE3EB_LOCAL_SEED: '1' },
        { NODE_ENV: 'development', LE3EB_LOCAL_SEED: '1', DATABASE_URL: 'postgresql://invalid.local/test' },
      ]) {
        await expect(seedLocal(target, env, true)).rejects.toThrow('Local seed refused');
        expect(existsSync(target)).toBe(false);
      }
      await expect(seedLocal(target, { NODE_ENV: 'test', LE3EB_LOCAL_SEED: '1' }, false)).rejects.toThrow();
    } finally { rmSync(root, { recursive: true, force: true }); }
  });
  it('creates six labeled local accounts and never overwrites existing data', async () => {
    const root = mkdtempSync(path.join(tmpdir(), 'le3eb-seed-test-'));
    const target = path.join(root, 'storage.json');
    const env = { NODE_ENV: 'test', LE3EB_LOCAL_SEED: '1' };
    try {
      await seedLocal(target, env, true);
      const bytes = readFileSync(target, 'utf8');
      const state = JSON.parse(bytes);
      expect(state.localSeedOnly).toBe(true);
      expect(state.users.filter((u: { role: string }) => u.role === 'ADMIN')).toHaveLength(1);
      expect(state.users.filter((u: { role: string }) => u.role === 'USER')).toHaveLength(2);
      expect(state.companions).toHaveLength(3);
      expect(new Set(state.companions.map((c: { gameName: string }) => c.gameName)).size).toBe(3);
      expect(state.companions.every((c: { status: string }) => c.status === 'APPROVED')).toBe(true);
      expect(Object.values<{ balance: number }>(state.wallets).every(wallet => wallet.balance === 0)).toBe(true);
      expect(Object.values<{ balance: number }>(state.diamondWallets).every(wallet => wallet.balance === 0)).toBe(true);
      expect(bytes).not.toContain(LOCAL_SEED_PASSWORD);
      expect((await verifyPassword(LOCAL_SEED_PASSWORD, state.users[0].passwordHash)).valid).toBe(true);
      await expect(seedLocal(target, env, true)).rejects.toThrow();
      expect(readFileSync(target, 'utf8')).toBe(bytes);
      writeFileSync(target, '{"historical":true}');
      await expect(seedLocal(target, env, true)).rejects.toThrow();
      expect(readFileSync(target, 'utf8')).toBe('{"historical":true}');
    } finally { rmSync(root, { recursive: true, force: true }); }
  });
});
