import { spawnSync } from 'node:child_process';
import { describe, expect, it } from 'vitest';

describe('money policy startup guard', () => {
  it('refuses startup on malformed money config before opening a port', () => {
    const result = spawnSync(process.execPath, ['--import', 'tsx', 'backend/server.ts'], {
      cwd: process.cwd(),
      env: { ...process.env, MONEY_POLICY_JSON: '{"coinsPerUsd":0}', PORT: '4399' },
      encoding: 'utf8', timeout: 15_000,
    });
    expect(result.status).not.toBe(0);
    expect(result.signal).toBeNull();
    expect(result.stderr).toContain('coinsPerUsd');
    expect(result.stdout).not.toContain('Server running');
  });
});
