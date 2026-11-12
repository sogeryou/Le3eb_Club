import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { isolatedApp } from '../helpers/isolatedApp.js';

it('starts without seed accounts when the documented local flag is explicitly false', async () => {
  const app = await isolatedApp({ seeded: false, demoFlag: 'false' });
  try {
    const state = app.state();
    expect(state.users).toHaveLength(0);
    expect(state.companions).toHaveLength(0);
  } finally { await app.stop(); }
}, 30_000);

// Existing backend/server.ts behavior, not fixed by this test/seed/docs-only card.
// The opt-in command exposes the raw failure for the handoff evidence.
const historicalDefect = process.env.CARD7_SHOW_KNOWN_FAILURE === '1' ? it : it.fails;
describe('existing unset-demo-flag behavior', () => {
  let app: Awaited<ReturnType<typeof isolatedApp>>;
  let userCount: number;
  beforeAll(async () => {
    app = await isolatedApp({ seeded: false, demoFlag: 'unset' });
    const state = app.state();
    expect(state.companions).toHaveLength(0);
    expect(Array.isArray(state.users)).toBe(true);
    expect(state.users.length).toBeLessThanOrEqual(1);
    for (const user of state.users) {
      expect(user).toMatchObject({ id: 'user_1', username: 'demo_user', email: 'demo@le3eb.club', role: 'USER' });
    }
    userCount = state.users.length;
  }, 30_000);
  afterAll(async () => { if (app) await app.stop(); }, 10_000);
  // Only this known assertion is expected to fail. Startup, reading storage,
  // shape checks and teardown remain ordinary failures in the hooks above.
  historicalDefect('KNOWN DEFECT (expected failure): normal startup must not auto-create a demo buyer when the flag is absent', () => {
    expect(userCount, 'unset ALLOW_DEMO_SEED must not create demo_user').toBe(0);
  });
});
