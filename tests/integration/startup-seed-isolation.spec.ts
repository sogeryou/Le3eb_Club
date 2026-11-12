import { expect, it } from 'vitest';
import { isolatedApp } from '../helpers/isolatedApp.js';

it('starts without seed accounts when ALLOW_DEMO_SEED is explicitly false', async () => {
  const app = await isolatedApp({ seeded: false, demoFlag: 'false' });
  try {
    const state = app.state();
    expect(state.users).toHaveLength(0);
    expect(state.companions).toHaveLength(0);
  } finally { await app.stop(); }
}, 30_000);

it('does not create demo accounts or balances on default startup without a seed command', async () => {
  const app = await isolatedApp({ seeded: false, demoFlag: 'unset' });
  try {
    const state = app.state();
    expect(state.users, 'default startup must not create demo_user').toHaveLength(0);
    expect(state.companions).toHaveLength(0);
    expect(state.wallets).toEqual({});
    expect(state.diamondWallets).toEqual({});
  } finally { await app.stop(); }
}, 30_000);
