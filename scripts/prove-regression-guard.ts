import { spawnSync } from 'node:child_process';

const result = spawnSync(process.execPath, ['node_modules/vitest/vitest.mjs', 'run', 'tests/integration/core-journey.spec.ts'], {
  cwd: process.cwd(), env: { ...process.env, CARD7_MUTATE_CHARGE: '1' },
  encoding: 'utf8', timeout: 60_000,
});
const output = result.stdout + result.stderr;
process.stdout.write(output);
if (result.status === 0 || result.signal || !output.includes('buyer charge must equal the order total')) {
  console.error('Mutation proof failed: the intended charge assertion did not detect the disposable-copy defect.');
  process.exitCode = 1;
} else {
  console.log('PASS: intentional +1 coin defect was caught. Only a disposable test copy was changed; checkout business code is unchanged.');
}
