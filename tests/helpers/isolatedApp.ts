import { cpSync, existsSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { createServer } from 'node:net';
import { spawn, spawnSync } from 'node:child_process';

export async function isolatedApp(options: { seeded?: boolean; demoFlag?: 'unset' | 'false' } = {}) {
  const root = mkdtempSync(path.join(tmpdir(), 'le3eb-card7-'));
  const source = process.cwd();
  for (const name of ['backend', 'shared', 'client', 'admin', 'scripts']) {
    cpSync(path.join(source, name), path.join(root, name), {
      recursive: true,
      filter: value => !value.startsWith(path.join(source, 'backend', 'data')),
    });
  }
  for (const name of ['package.json', 'tsconfig.json', 'tsconfig.server.json', 'vite.config.ts']) {
    cpSync(path.join(source, name), path.join(root, name));
  }
  symlinkSync(path.join(source, 'node_modules'), path.join(root, 'node_modules'), 'dir');
  const env: NodeJS.ProcessEnv = { ...process.env, NODE_ENV: 'test', STORAGE_BACKEND: 'json', PAYMENT_PROVIDER: 'sandbox', SETTLEMENT_CRON_DISABLED: 'true', DISABLE_HMR: 'true',
    JWT_SECRET: 'local-card7-only-secret-for-disposable-tests-2026' };
  for (const key of ['DATABASE_URL', 'REDIS_URL', 'ADMIN_EMAIL', 'ADMIN_PASSWORD', 'S3_BUCKET', 'S3_ACCESS_KEY_ID',
    'S3_SECRET_ACCESS_KEY', 'MONEY_POLICY_JSON', 'ALLOW_DEMO_SEED']) delete env[key];
  if (options.demoFlag !== 'unset') env.ALLOW_DEMO_SEED = 'false';
  if (options.seeded !== false) {
    const result = spawnSync(process.execPath, ['--import', 'tsx', 'scripts/seed-local.ts', '--confirm-local'], {
      cwd: root, env: { ...env, LE3EB_LOCAL_SEED: '1' }, encoding: 'utf8', timeout: 20_000,
    });
    if (result.status !== 0) throw new Error('Local seed failed: ' + result.stderr);
  }
  if (process.env.CARD7_MUTATE_CHARGE === '1') {
    const target = path.join(root, 'backend/routes/business.ts');
    const original = readFileSync(target, 'utf8');
    const needle = 'wallet.balance -= order.totalPrice;';
    if (!original.includes(needle)) throw new Error('Mutation anchor changed');
    // Intentional fault in this disposable copy only, never in the checkout.
    writeFileSync(target, original.replace(needle, 'wallet.balance -= order.totalPrice + 1;'));
  }
  const port = await new Promise<number>((resolve, reject) => {
    const probe = createServer();
    probe.on('error', reject);
    // Keep test listeners outside macOS's ephemeral client-port range. Health
    // probes otherwise can claim the just-released port before Express binds it.
    probe.listen(20000 + Math.floor(Math.random() * 20000), '0.0.0.0', () => {
      const address = probe.address();
      const result = typeof address === 'object' && address ? address.port : 0;
      probe.close(() => resolve(result));
    });
  });
  env.PORT = String(port);
  const child = spawn(process.execPath, ['--import', 'tsx', 'backend/server.ts'], { cwd: root, env, stdio: ['ignore', 'pipe', 'pipe'] });
  let log = '';
  child.stdout.on('data', chunk => { log = (log + chunk).slice(-20_000); });
  child.stderr.on('data', chunk => { log = (log + chunk).slice(-20_000); });
  const origin = `http://127.0.0.1:${port}`;
  let ready = false;
  for (let tries = 0; tries < 150; tries++) {
    if (child.exitCode !== null) break;
    try { if ((await fetch(origin + '/healthz')).ok) { ready = true; break; } } catch { /* start pending */ }
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  const stop = async () => {
    if (child.exitCode === null) {
      child.kill('SIGTERM');
      await Promise.race([new Promise(resolve => child.once('exit', resolve)), new Promise(resolve => setTimeout(resolve, 3000))]);
      if (child.exitCode === null) child.kill('SIGKILL');
    }
    if (root.startsWith(path.join(tmpdir(), 'le3eb-card7-'))) rmSync(root, { recursive: true, force: true });
  };
  if (!ready) { await stop(); throw new Error('Disposable app did not start: ' + log); }
  return {
    origin, root, stop, log: () => log,
    state: () => JSON.parse(readFileSync(path.join(root, 'backend/data/storage.json'), 'utf8')),
    hasState: () => existsSync(path.join(root, 'backend/data/storage.json')),
  };
}
