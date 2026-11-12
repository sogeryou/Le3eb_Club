# Card 7 verification — demo opt-in patch, 2026-11-12

## Verdict: fixed / acceptance passed

The automatic demo-seed defect is fixed. All 45 tests are ordinary passing tests:
**0 expected failures, 0 skipped tests, 0 failed tests**.
PR #6 remains merged; this patch updates existing PR #7, without merging it.

Environment: macOS ARM64, Node v24.22.1, pnpm 9.15.0 (repository-pinned version).
All existing CI commands were rerun locally. Hosted CI uses Node 22 / Ubuntu;
local results are not a claim that hosted CI has passed.

## Patch scope

Only the four requested files changed relative to PR #7's initial revision cf88b36:
- backend/server.ts: the demo guard now requires ALLOW_DEMO_SEED === 'true', and still rejects production.
- tests/integration/startup-seed-isolation.spec.ts: two ordinary startup tests, no expected-failure mechanism or auxiliary failure switch.
- README.md: demo opt-in documentation replaces the previous workaround.
- tests/evidence/card7-verification.md: this report and fresh command output.

ensureAdminSeed, currency policy, chat, game catalog, explicit seed scripts and the
test helper are unchanged. No real funds, production APIs, external messages or
user records were read or modified.

## Acceptance matrix

| Requirement | Observed result |
| --- | --- |
| Register / login / wrong password | PASS, real HTTP requests |
| Sandbox credit / replay | PASS, configured package and sandbox-ok receipt, duplicate credit prevented |
| CREATED → ACCEPTED → IN_SERVICE → COMPLETED | PASS |
| Complete before accept | PASS, 409 without debit |
| Coin debit equals diamond credit | PASS, 21 coins / 21 diamonds |
| Repeat completion | PASS, 409, both balances unchanged |
| Review publication / duplicate / wrong author | PASS |
| Pending / reject with reason / resubmit / approve / edit | PASS |
| Third-account chat read / write / receipt | PASS, 403 |
| Explicit local seed safety and labeled accounts | PASS, existing tests unchanged |
| Fresh storage, default startup without seed | PASS: 0 users, 0 companions, empty coin and diamond wallets |
| Fresh storage, ALLOW_DEMO_SEED=false | PASS: 0 users, 0 companions, empty wallets |
| Fresh storage, ALLOW_DEMO_SEED=true | PASS: demo_user / demo@le3eb.club, 120 coins, 0 companions |
| Production guard | Unchanged: IS_PRODUCTION short-circuits demo creation even when true |
| Existing administrator bootstrap | Unchanged; no administrator environment variables supplied in these checks |

The three flag checks launched separate actual backend processes, each from a fresh
temporary copy excluding backend/data. No seed command was run. Startup was confirmed
through /healthz and persisted storage was inspected before each server was stopped
and its disposable directory removed. The explicit-true case is a separate executed
startup check, not an extra suite test; the suite count remains exactly 45.

## Red → green evidence

Before changing business code, the expected-failure wrapper was removed and the
ordinary default-startup assertion failed: expected 0 users, received 1.
After the one-line guard change, the same file passed 2/2 and the full suite passed 45/45.
The pre-fix failure output is retained below only as historical regression proof,
not as a remaining acceptance failure.

## Command results

| Command | Result |
| --- | --- |
| pnpm lint | exit 0 |
| pnpm test | exit 0, 17 files / 45 passed, no expected failures |
| pnpm run test:unit | exit 0, 11 files / 28 passed |
| pnpm run test:integration | exit 0, 6 files / 17 passed |
| pnpm validate | exit 0, configured policy and 11 golden cases passed |
| pnpm build | exit 0; existing >500 kB bundle warning remains |
| pnpm exec vitest run tests/integration/startup-seed-isolation.spec.ts | exit 0, 2 passed |
| Three fresh-storage flag checks | exit 0, all 3 assertions passed |

The prior Card 7 install-from-fresh-clone and unchanged homepage screenshot were
already executed before this server-only patch. No new frontend work is included.
Screenshot local handoff artifact: /tmp/le3eb-card1.rjureB/card7-home-local.png.

## Captured post-fix command output

These are actual outputs captured after the patch.

### lint

```text
> le3eb_club@1.0.0 lint /private/tmp/le3eb-card1.rjureB/repo
> tsc --noEmit
```

### test

```text
> le3eb_club@1.0.0 test /private/tmp/le3eb-card1.rjureB/repo
> vitest run


 RUN  v2.1.9 /private/tmp/le3eb-card1.rjureB/repo

 ✓ tests/unit/money.spec.ts (3 tests) 6ms
 ✓ tests/unit/public-companions.spec.ts (2 tests) 2ms
 ✓ tests/unit/configurable-money.spec.ts (5 tests) 10ms
 ✓ tests/unit/game-directory.spec.ts (3 tests) 11ms
 ✓ tests/integration/real-recharge-closed.spec.ts (4 tests) 74ms
 ✓ tests/unit/avatar-upload.spec.ts (2 tests) 4ms
 ✓ tests/golden/m6/golden-all.spec.ts (4 tests) 3ms
 ✓ tests/golden/m6/golden.spec.ts (1 test) 2ms
 ✓ tests/golden/m5/golden-all.spec.ts (5 tests) 4ms
 ✓ tests/golden/m5/golden.spec.ts (1 test) 1ms
 ✓ tests/integration/payment-sandbox.spec.ts (1 test) 7ms
 ✓ tests/regression/withdraw-payout-formula.spec.ts (1 test) 2ms
 ✓ tests/regression/companion-pricing-band.spec.ts (1 test) 1ms
 ✓ tests/integration/local-seed.spec.ts (2 tests) 1637ms
   ✓ explicit local seed safety > creates six labeled local accounts and never overwrites existing data 1633ms
 ✓ tests/integration/money-config-startup.spec.ts (1 test) 2297ms
   ✓ money policy startup guard > refuses startup on malformed money config before opening a port 2296ms
 ✓ tests/integration/startup-seed-isolation.spec.ts (2 tests) 11192ms
   ✓ starts without seed accounts when ALLOW_DEMO_SEED is explicitly false 4510ms
   ✓ does not create demo accounts or balances on default startup without a seed command 6682ms
 ✓ tests/integration/core-journey.spec.ts (7 tests) 13180ms
   ✓ card 7: isolated core journey > logs in all six labeled seed accounts and lists the three local companions 3070ms
   ✓ card 7: isolated core journey > registers and authenticates a real user; wrong password is rejected 485ms

 Test Files  17 passed (17)
      Tests  45 passed (45)
   Start at  11:48:58
   Duration  13.92s (transform 467ms, setup 0ms, collect 1.79s, tests 28.43s, environment 2ms, prepare 1.56s)
```

### unit

```text
> le3eb_club@1.0.0 test:unit /private/tmp/le3eb-card1.rjureB/repo
> vitest run tests/unit tests/golden tests/regression


 RUN  v2.1.9 /private/tmp/le3eb-card1.rjureB/repo

 ✓ tests/unit/public-companions.spec.ts (2 tests) 2ms
 ✓ tests/unit/configurable-money.spec.ts (5 tests) 33ms
 ✓ tests/unit/game-directory.spec.ts (3 tests) 2ms
 ✓ tests/unit/money.spec.ts (3 tests) 3ms
 ✓ tests/unit/avatar-upload.spec.ts (2 tests) 2ms
 ✓ tests/golden/m6/golden-all.spec.ts (4 tests) 4ms
 ✓ tests/golden/m6/golden.spec.ts (1 test) 13ms
 ✓ tests/golden/m5/golden-all.spec.ts (5 tests) 2ms
 ✓ tests/regression/withdraw-payout-formula.spec.ts (1 test) 1ms
 ✓ tests/regression/companion-pricing-band.spec.ts (1 test) 3ms
 ✓ tests/golden/m5/golden.spec.ts (1 test) 18ms

 Test Files  11 passed (11)
      Tests  28 passed (28)
   Start at  11:49:00
   Duration  1.23s (transform 401ms, setup 0ms, collect 1.20s, tests 83ms, environment 3ms, prepare 1.65s)
```

### integration

```text
> le3eb_club@1.0.0 test:integration /private/tmp/le3eb-card1.rjureB/repo
> vitest run tests/integration


 RUN  v2.1.9 /private/tmp/le3eb-card1.rjureB/repo

 ✓ tests/integration/payment-sandbox.spec.ts (1 test) 3ms
 ✓ tests/integration/real-recharge-closed.spec.ts (4 tests) 57ms
 ✓ tests/integration/local-seed.spec.ts (2 tests) 2612ms
   ✓ explicit local seed safety > creates six labeled local accounts and never overwrites existing data 2609ms
 ✓ tests/integration/money-config-startup.spec.ts (1 test) 3451ms
   ✓ money policy startup guard > refuses startup on malformed money config before opening a port 3445ms
 ✓ tests/integration/startup-seed-isolation.spec.ts (2 tests) 9696ms
   ✓ starts without seed accounts when ALLOW_DEMO_SEED is explicitly false 7907ms
   ✓ does not create demo accounts or balances on default startup without a seed command 1786ms
 ✓ tests/integration/core-journey.spec.ts (7 tests) 10581ms
   ✓ card 7: isolated core journey > logs in all six labeled seed accounts and lists the three local companions 1094ms
   ✓ card 7: isolated core journey > registers and authenticates a real user; wrong password is rejected 400ms

 Test Files  6 passed (6)
      Tests  17 passed (17)
   Start at  11:49:02
   Duration  11.38s (transform 402ms, setup 0ms, collect 1.34s, tests 26.40s, environment 4ms, prepare 808ms)
```

### validate

```text
> le3eb_club@1.0.0 validate /private/tmp/le3eb-card1.rjureB/repo
> tsx scripts/validate-money.ts && node scripts/validate-alg.mjs

validate-money: configured packages and policy passed money-v1-9ae384162951baaf7341

 RUN  v2.1.9 /private/tmp/le3eb-card1.rjureB/repo

 ✓ tests/golden/m6/golden-all.spec.ts (4 tests) 4ms
 ✓ tests/golden/m6/golden.spec.ts (1 test) 16ms
 ✓ tests/golden/m5/golden-all.spec.ts (5 tests) 4ms
 ✓ tests/golden/m5/golden.spec.ts (1 test) 5ms

 Test Files  4 passed (4)
      Tests  11 passed (11)
   Start at  11:49:07
   Duration  2.57s (transform 191ms, setup 0ms, collect 2.73s, tests 29ms, environment 2ms, prepare 923ms)
```

### build

```text
> le3eb_club@1.0.0 build /private/tmp/le3eb-card1.rjureB/repo
> vite build && tsc -p tsconfig.server.json

vite v6.4.2 building for production...
transforming...
✓ 2146 modules transformed.
rendering chunks...
computing gzip size...
dist/index.html                   0.40 kB │ gzip:   0.27 kB
dist/assets/index-BnlZOiiw.css   72.66 kB │ gzip:  12.03 kB
dist/assets/index-BL-TQ2je.js   844.43 kB │ gzip: 207.77 kB

(!) Some chunks are larger than 500 kB after minification. Consider:
- Using dynamic import() to code-split the application
- Use build.rollupOptions.output.manualChunks to improve chunking: https://rollupjs.org/configuration-options/#output-manualchunks
- Adjust chunk size limit for this warning via build.chunkSizeWarningLimit.
✓ built in 6.99s
```

### startup

```text
RUN  v2.1.9 /private/tmp/le3eb-card1.rjureB/repo

 ✓ tests/integration/startup-seed-isolation.spec.ts (2 tests) 2913ms
   ✓ starts without seed accounts when ALLOW_DEMO_SEED is explicitly false 1682ms
   ✓ does not create demo accounts or balances on default startup without a seed command 1231ms

 Test Files  1 passed (1)
      Tests  2 passed (2)
   Start at  11:48:43
   Duration  3.23s (transform 28ms, setup 0ms, collect 22ms, tests 2.91s, environment 0ms, prepare 43ms)
```

### flags

```text
PASS {"ALLOW_DEMO_SEED":"(unset)","users":0,"companions":0,"demo":null,"coins":0}
PASS {"ALLOW_DEMO_SEED":"true","users":1,"companions":0,"demo":"demo_user","coins":120}
PASS {"ALLOW_DEMO_SEED":"false","users":0,"companions":0,"demo":null,"coins":0}
```

## Historical pre-fix red run (ordinary test)

```text
RUN  v2.1.9 /private/tmp/le3eb-card1.rjureB/repo

 ❯ tests/integration/startup-seed-isolation.spec.ts (2 tests | 1 failed) 2820ms
   ✓ starts without seed accounts when ALLOW_DEMO_SEED is explicitly false 1810ms
   × does not create demo accounts or balances on default startup without a seed command 1009ms
     → default startup must not create demo_user: expected [ { id: 'user_1', …(9) } ] to have a length of +0 but got 1

⎯⎯⎯⎯⎯⎯⎯ Failed Tests 1 ⎯⎯⎯⎯⎯⎯⎯

 FAIL  tests/integration/startup-seed-isolation.spec.ts > does not create demo accounts or balances on default startup without a seed command
AssertionError: default startup must not create demo_user: expected [ { id: 'user_1', …(9) } ] to have a length of +0 but got 1

- Expected
+ Received

- 0
+ 1

 ❯ tests/integration/startup-seed-isolation.spec.ts:17:70
     15|   try {
     16|     const state = app.state();
     17|     expect(state.users, 'default startup must not create demo_user').t…
       |                                                                      ^
     18|     expect(state.companions).toHaveLength(0);
     19|     expect(state.wallets).toEqual({});

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[1/1]⎯

 Test Files  1 failed (1)
      Tests  1 failed | 1 passed (2)
   Start at  11:48:12
   Duration  3.30s (transform 61ms, setup 0ms, collect 46ms, tests 2.82s, environment 0ms, prepare 169ms)
```
