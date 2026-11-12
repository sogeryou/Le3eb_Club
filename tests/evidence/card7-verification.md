# Card 7 verification — 2026-11-12

## Verdict: partial acceptance / not ready to merge

PR #6 was merged into main first (c33396a717a745f0a1cb6d0118e2637717405e40).
This change adds only tests, explicit local seed tooling and documentation.
No backend, client, shared domain code, configuration, dependency or stored business data is changed.

Environment: macOS ARM64, Node v24.22.1, pnpm 9.15.0 (repository-pinned version).
The existing GitHub workflow targets Node 22 / Ubuntu; its commands were reproduced locally,
but this report is not evidence that hosted CI has passed.

## Acceptance matrix

| Requirement | Observed result |
| --- | --- |
| Register / login / wrong password | PASS, real HTTP requests |
| Sandbox credit / replay | PASS, configured $1 package, sandbox-ok receipt, duplicate credit prevented |
| CREATED → ACCEPTED → IN_SERVICE → COMPLETED | PASS |
| Complete before accept | PASS, 409 without debit |
| Coin debit equals diamond credit | PASS, 21 coins / 21 diamonds |
| Repeat completion | PASS, 409, buyer and companion balances unchanged |
| Review publication / duplicate / wrong author | PASS |
| Pending / reject with reason / resubmit / approve / edit | PASS |
| Third-account chat read / write / receipt | PASS, 403 |
| Explicit local seed | PASS, one admin, two buyers, three approved companions with distinct real games, zero balances |
| Seed production / missing confirmation / external storage refusal | PASS |
| Seed existing file preservation | PASS, exclusive creation; original bytes unchanged |
| README fresh clone / pinned install / seed / dev / homepage | PASS, fresh disposable clone, localhost:4327, headless Chrome |
| Startup without seed, ALLOW_DEMO_SEED=false | PASS, no users or companions |
| Startup without seed, flag absent | FAIL — pre-existing automatic demo buyer |
| Intentional +1 coin debit mutation | PASS — regression assertion fails as required, only in disposable copy |

## Test results and limits

- `pnpm lint`: exit 0.
- `pnpm test`: runner reports 17 files / 45 passed; this means **44 ordinary passes plus 1 explicitly expected historical failure**, not 45 product acceptance passes.
- `pnpm run test:unit`: 11 files / 28 passed.
- `pnpm run test:integration`: 6 files / 17 reported passed, including the same 1 expected failure.
- `pnpm validate`: configured money policy and 11 golden cases passed.
- `pnpm build`: exit 0; existing >500 kB bundle warning remains.
- `CARD7_SHOW_KNOWN_FAILURE=1 pnpm exec vitest run tests/integration/startup-seed-isolation.spec.ts`: exit 1, 1 failed / 1 passed.
- Mutation proof: internal run fails 1 case / passes 6; wrapper exits 0 only when the intended charge assertion detects the fault.

No real funds, production APIs, external messages or user data were touched.
Each HTTP test server copies source into a temporary directory excluding backend/data.
Only synthetic local accounts are used. The seed script is never invoked by application startup.

## Pre-existing defect — requires separate business-code authorization

Location: backend/server.ts:223–246 (ensureDemoBusinessUser).

Steps: launch an empty disposable checkout in development/test mode without ALLOW_DEMO_SEED
and without running the seed command. Expected: no users and no injected balance.
Actual: demo_user / demo@le3eb.club is created with a 120-coin wallet.

The README workaround explicitly sets ALLOW_DEMO_SEED=false and clears admin bootstrap variables.
The test exposes the raw failure with CARD7_SHOW_KNOWN_FAILURE=1.
Setup, state-shape checks, unrelated user/companion assertions and cleanup are outside
the expected-failure boundary, so unrelated failures are not accepted.

This card does not fix the defect because its scope excludes business code.
Keep the PR draft until that scope conflict is resolved. No claim of complete Card 7 acceptance.

## Independent review

A read-only reviewer flagged the expected-failure boundary, missing post-repeat diamond
assertion and recharge id documentation. All three were addressed before the final test runs.

## Screenshot

A full-page screenshot was captured from the fresh README setup in headless Chrome:
local delivery path /tmp/le3eb-card1.rjureB/card7-home-local.png.
It shows the unchanged Arabic RTL emerald/sand homepage and three explicitly LOCAL seed listings.
The screenshot is a local handoff artifact, not a remote-hosted CI artifact.

## Captured command output

The following blocks are actual local output (not fabricated CI logs).

### lint

```text
> le3eb_club@1.0.0 lint /private/tmp/le3eb-card1.rjureB/repo
> tsc --noEmit
```

### all-tests

```text
> le3eb_club@1.0.0 test /private/tmp/le3eb-card1.rjureB/repo
> vitest run


 RUN  v2.1.9 /private/tmp/le3eb-card1.rjureB/repo

 ✓ tests/unit/public-companions.spec.ts (2 tests) 7ms
 ✓ tests/unit/game-directory.spec.ts (3 tests) 3ms
 ✓ tests/unit/configurable-money.spec.ts (5 tests) 6ms
 ✓ tests/integration/real-recharge-closed.spec.ts (4 tests) 68ms
 ✓ tests/unit/avatar-upload.spec.ts (2 tests) 3ms
 ✓ tests/golden/m6/golden-all.spec.ts (4 tests) 4ms
 ✓ tests/unit/money.spec.ts (3 tests) 4ms
 ✓ tests/golden/m6/golden.spec.ts (1 test) 1ms
 ✓ tests/golden/m5/golden.spec.ts (1 test) 3ms
 ✓ tests/golden/m5/golden-all.spec.ts (5 tests) 5ms
 ✓ tests/integration/payment-sandbox.spec.ts (1 test) 1ms
 ✓ tests/regression/withdraw-payout-formula.spec.ts (1 test) 4ms
 ✓ tests/regression/companion-pricing-band.spec.ts (1 test) 6ms
 ✓ tests/integration/local-seed.spec.ts (2 tests) 943ms
   ✓ explicit local seed safety > creates six labeled local accounts and never overwrites existing data 938ms
 ✓ tests/integration/money-config-startup.spec.ts (1 test) 1251ms
   ✓ money policy startup guard > refuses startup on malformed money config before opening a port 1250ms
 ✓ tests/integration/startup-seed-isolation.spec.ts (2 tests) 4283ms
   ✓ starts without seed accounts when the documented local flag is explicitly false 2251ms
 ✓ tests/integration/core-journey.spec.ts (7 tests) 5687ms
   ✓ card 7: isolated core journey > logs in all six labeled seed accounts and lists the three local companions 899ms
   ✓ card 7: isolated core journey > registers and authenticates a real user; wrong password is rejected 395ms

 Test Files  17 passed (17)
      Tests  45 passed (45)
   Start at  11:28:27
   Duration  6.03s (transform 374ms, setup 0ms, collect 1.13s, tests 12.28s, environment 2ms, prepare 990ms)
```

### unit

```text
> le3eb_club@1.0.0 test:unit /private/tmp/le3eb-card1.rjureB/repo
> vitest run tests/unit tests/golden tests/regression


 RUN  v2.1.9 /private/tmp/le3eb-card1.rjureB/repo

 ✓ tests/golden/m6/golden.spec.ts (1 test) 2ms
 ✓ tests/golden/m6/golden-all.spec.ts (4 tests) 4ms
 ✓ tests/unit/public-companions.spec.ts (2 tests) 2ms
 ✓ tests/unit/avatar-upload.spec.ts (2 tests) 4ms
 ✓ tests/unit/game-directory.spec.ts (3 tests) 2ms
 ✓ tests/unit/money.spec.ts (3 tests) 6ms
 ✓ tests/unit/configurable-money.spec.ts (5 tests) 5ms
 ✓ tests/regression/companion-pricing-band.spec.ts (1 test) 1ms
 ✓ tests/regression/withdraw-payout-formula.spec.ts (1 test) 1ms
 ✓ tests/golden/m5/golden-all.spec.ts (5 tests) 3ms
 ✓ tests/golden/m5/golden.spec.ts (1 test) 2ms

 Test Files  11 passed (11)
      Tests  28 passed (28)
   Start at  11:25:35
   Duration  629ms (transform 206ms, setup 0ms, collect 452ms, tests 33ms, environment 1ms, prepare 855ms)
```

### integration

```text
> le3eb_club@1.0.0 test:integration /private/tmp/le3eb-card1.rjureB/repo
> vitest run tests/integration


 RUN  v2.1.9 /private/tmp/le3eb-card1.rjureB/repo

 ✓ tests/integration/payment-sandbox.spec.ts (1 test) 1ms
 ✓ tests/integration/real-recharge-closed.spec.ts (4 tests) 53ms
 ✓ tests/integration/local-seed.spec.ts (2 tests) 746ms
   ✓ explicit local seed safety > creates six labeled local accounts and never overwrites existing data 743ms
 ✓ tests/integration/money-config-startup.spec.ts (1 test) 949ms
   ✓ money policy startup guard > refuses startup on malformed money config before opening a port 948ms
 ✓ tests/integration/startup-seed-isolation.spec.ts (2 tests) 2596ms
   ✓ starts without seed accounts when the documented local flag is explicitly false 1428ms
 ✓ tests/integration/core-journey.spec.ts (7 tests) 4100ms
   ✓ card 7: isolated core journey > logs in all six labeled seed accounts and lists the three local companions 803ms
   ✓ card 7: isolated core journey > registers and authenticates a real user; wrong password is rejected 373ms

 Test Files  6 passed (6)
      Tests  17 passed (17)
   Start at  11:28:55
   Duration  4.41s (transform 163ms, setup 0ms, collect 432ms, tests 8.45s, environment 1ms, prepare 336ms)
```

### validate

```text
> le3eb_club@1.0.0 validate /private/tmp/le3eb-card1.rjureB/repo
> tsx scripts/validate-money.ts && node scripts/validate-alg.mjs

validate-money: configured packages and policy passed money-v1-9ae384162951baaf7341

 RUN  v2.1.9 /private/tmp/le3eb-card1.rjureB/repo

 ✓ tests/golden/m6/golden.spec.ts (1 test) 3ms
 ✓ tests/golden/m6/golden-all.spec.ts (4 tests) 10ms
 ✓ tests/golden/m5/golden.spec.ts (1 test) 2ms
 ✓ tests/golden/m5/golden-all.spec.ts (5 tests) 3ms

 Test Files  4 passed (4)
      Tests  11 passed (11)
   Start at  11:27:33
   Duration  619ms (transform 170ms, setup 0ms, collect 387ms, tests 20ms, environment 1ms, prepare 524ms)
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
✓ built in 2.55s
```

### mutation

```text
RUN  v2.1.9 /private/tmp/le3eb-card1.rjureB/repo

 ❯ tests/integration/core-journey.spec.ts (7 tests | 1 failed) 5507ms
   ✓ card 7: isolated core journey > logs in all six labeled seed accounts and lists the three local companions 857ms
   ✓ card 7: isolated core journey > registers and authenticates a real user; wrong password is rejected 571ms
   × card 7: isolated core journey > rejects state skipping and settles matching buyer coins / companion diamonds exactly once 15ms
     → buyer charge must equal the order total: expected 78 to be 79 // Object.is equality

 Test Files  1 failed (1)
      Tests  1 failed | 6 passed (7)
   Start at  11:27:34
   Duration  6.28s (transform 106ms, setup 0ms, collect 127ms, tests 5.51s, environment 0ms, prepare 126ms)

⎯⎯⎯⎯⎯⎯⎯ Failed Tests 1 ⎯⎯⎯⎯⎯⎯⎯

 FAIL  tests/integration/core-journey.spec.ts > card 7: isolated core journey > rejects state skipping and settles matching buyer coins / companion diamonds exactly once
AssertionError: buyer charge must equal the order total: expected 78 to be 79 // Object.is equality

- Expected
+ Received

- 79
+ 78

 ❯ tests/integration/core-journey.spec.ts:72:72
     70|     }
     71|     // Mutation proof deliberately changes the isolated server's charg…
     72|     expect(await balance(), 'buyer charge must equal the order total')…
       |                                                                        ^
     73|     const detail = (await call('GET', '/api/admin/operations/users/loc…
     74|     expect(detail.diamondWallet.balance).toBe(21);

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[1/1]⎯

PASS: intentional +1 coin defect was caught. Only a disposable test copy was changed; checkout business code is unchanged.
```

### known-failure

```text
RUN  v2.1.9 /private/tmp/le3eb-card1.rjureB/repo

 ❯ tests/integration/startup-seed-isolation.spec.ts (2 tests | 1 failed) 2426ms
   ✓ starts without seed accounts when the documented local flag is explicitly false 1462ms
   × existing unset-demo-flag behavior > KNOWN DEFECT (expected failure): normal startup must not auto-create a demo buyer when the flag is absent 3ms
     → unset ALLOW_DEMO_SEED must not create demo_user: expected 1 to be +0 // Object.is equality

⎯⎯⎯⎯⎯⎯⎯ Failed Tests 1 ⎯⎯⎯⎯⎯⎯⎯

 FAIL  tests/integration/startup-seed-isolation.spec.ts > existing unset-demo-flag behavior > KNOWN DEFECT (expected failure): normal startup must not auto-create a demo buyer when the flag is absent
AssertionError: unset ALLOW_DEMO_SEED must not create demo_user: expected 1 to be +0 // Object.is equality

- Expected
+ Received

- 0
+ 1

 ❯ tests/integration/startup-seed-isolation.spec.ts:34:74
     32|   // shape checks and teardown remain ordinary failures in the hooks a…
     33|   historicalDefect('KNOWN DEFECT (expected failure): normal startup mu…
     34|     expect(userCount, 'unset ALLOW_DEMO_SEED must not create demo_user…
       |                                                                          ^
     35|   });
     36| });

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[1/1]⎯

 Test Files  1 failed (1)
      Tests  1 failed | 1 passed (2)
   Start at  11:28:30
   Duration  3.18s (transform 71ms, setup 0ms, collect 68ms, tests 2.43s, environment 0ms, prepare 252ms)
```

### install

```text
Recreating /private/tmp/le3eb-card7-readme.hxvJ9G/repo/node_modules
Lockfile is up to date, resolution step is skipped
Progress: resolved 1, reused 0, downloaded 0, added 0
Packages: +547
++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
Progress: resolved 547, reused 547, downloaded 0, added 128
Progress: resolved 547, reused 547, downloaded 0, added 546
Progress: resolved 547, reused 547, downloaded 0, added 547, done

dependencies:
+ @aws-sdk/client-s3 3.1049.0
+ @aws-sdk/s3-request-presigner 3.1049.0
+ @fingerprintjs/fingerprintjs 4.6.2
+ @prisma/client 5.22.0
+ @sentry/node 8.55.2
+ @sentry/react 8.55.2
+ @tailwindcss/vite 4.2.4
+ @vitejs/plugin-react 5.2.0
+ argon2 0.41.1
+ cors 2.8.6
+ decimal.js 10.6.0
+ dompurify 3.4.5
+ express 4.22.1
+ express-rate-limit 7.5.1
+ helmet 8.1.0
+ ioredis 5.10.1
+ isomorphic-dompurify 2.36.0
+ jsonwebtoken 9.0.3
+ lucide-react 0.546.0
+ motion 12.38.0
+ node-cron 3.0.3
+ pino 9.14.0
+ pino-http 10.5.0
+ pino-pretty 11.3.0
+ prom-client 15.1.3
+ react 19.2.5
+ react-dom 19.2.5
+ uuid 11.1.1
+ vite 6.4.2
+ zod 3.25.76
+ zustand 5.0.13

devDependencies:
+ @playwright/test 1.60.0
+ @types/cors 2.8.19
+ @types/dompurify 3.2.0
+ @types/express 4.17.25
+ @types/jsonwebtoken 9.0.10
+ @types/node 22.19.17
+ @types/node-cron 3.0.11
+ @types/supertest 6.0.3
+ @types/uuid 10.0.0
+ @vitest/coverage-v8 2.1.9
+ autoprefixer 10.5.0
+ prisma 5.22.0
+ rimraf 6.1.3
+ supertest 7.2.2
+ tailwindcss 4.2.4
+ tsx 4.21.0
+ typescript 5.8.3
+ vitest 2.1.9

Done in 5s
```
