# Card 8 verification

Base: `8e589eb0c1a98ef87857bdc8d0ea21d9db717c0c` (merged Card 7).
Source ZIP SHA-256: `e7c004b3c50a2c93a3012a0e00c66256b52aca71f683038c30780a29429891f5`.

## Result

PASS — original dark-purple presentation and 48 route branches restored; live API integration retained. English/Arabic and RTL screenshots captured in a real browser. Run ID: `mweknt54`. No browser exceptions or broken images in the acceptance run.

All business mutations used the actual backend through UI in isolated temporary storage. Test accounts are explicitly LOCAL development data, not production listings. $1 recharge was the existing clearly labelled sandbox payment, not a real card charge. Production payment-provider activation is not claimed.

- Registered user `user_xxr1cdw`; sandbox recharge: 0 → 100 coins.
- Order `ord_7xp64on`: CREATED → ACCEPTED → IN_SERVICE → COMPLETED. 7 coins charged, 7 diamonds settled under the server policy snapshot.
- Review `rev_2y00b2d` saved and appeared publicly.
- Buyer/player message roundtrip used real REST requests and polling.
- Application `cp_g9nmoko`: PENDING_REVIEW absent from public list → approved through unchanged admin UI → publicly visible.
- Logout/account switching cleared previous wallet, orders, messages and drafts.
- Targeted real-avatar delayed-response regression: failed before fix, passed after; late upload cannot restore a logged-out identity.
- Independent focused re-review: no remaining blockers in reported areas.

## Scope and honest empty states

Backend, admin source, shared catalog/policy, seed scripts and original 45 tests are unchanged. Login/session endpoints and permissions are unchanged; frontend state cleanup and stale-response guards were strengthened.

Community publishing, playlinks, gifts, advanced rankings, levels/tasks, detailed income/customer analytics and other capabilities without existing backend support show empty/unavailable states. They do not fabricate records or successful writes. Only supported application fields are persisted; optional prototype fields explicitly disclose their unavailable status. Unapproved legal copy is not presented as final policy.

## Reproduce

Run the existing backend with isolated development storage and explicitly seed LOCAL accounts if needed. Serve the built frontend with an API proxy. Then:

```sh
pnpm lint
pnpm test
pnpm validate
pnpm build
node scripts/card8/restore-guard.mjs
CARD8_ORIGIN=http://127.0.0.1:4350 node scripts/card8/acceptance.mjs
CARD8_ORIGIN=http://127.0.0.1:4350 node scripts/card8/account-race.mjs
```

Check each script's environment variable declarations before using alternate account credentials. No real funds/data were modified during verification.

## Actual command output

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

 ✓ tests/unit/public-companions.spec.ts (2 tests) 3ms
 ✓ tests/unit/configurable-money.spec.ts (5 tests) 8ms
 ✓ tests/unit/game-directory.spec.ts (3 tests) 2ms
 ✓ tests/unit/money.spec.ts (3 tests) 13ms
 ✓ tests/unit/avatar-upload.spec.ts (2 tests) 2ms
 ✓ tests/integration/real-recharge-closed.spec.ts (4 tests) 135ms
 ✓ tests/golden/m6/golden-all.spec.ts (4 tests) 5ms
 ✓ tests/golden/m6/golden.spec.ts (1 test) 1ms
 ✓ tests/golden/m5/golden-all.spec.ts (5 tests) 4ms
 ✓ tests/golden/m5/golden.spec.ts (1 test) 2ms
 ✓ tests/integration/payment-sandbox.spec.ts (1 test) 3ms
 ✓ tests/regression/companion-pricing-band.spec.ts (1 test) 3ms
 ✓ tests/regression/withdraw-payout-formula.spec.ts (1 test) 1ms
 ✓ tests/integration/local-seed.spec.ts (2 tests) 1352ms
   ✓ explicit local seed safety > creates six labeled local accounts and never overwrites existing data 1349ms
 ✓ tests/integration/money-config-startup.spec.ts (1 test) 1383ms
   ✓ money policy startup guard > refuses startup on malformed money config before opening a port 1382ms
 ✓ tests/integration/startup-seed-isolation.spec.ts (2 tests) 3383ms
   ✓ starts without seed accounts when ALLOW_DEMO_SEED is explicitly false 2003ms
   ✓ does not create demo accounts or balances on default startup without a seed command 1378ms
 ✓ tests/integration/core-journey.spec.ts (7 tests) 4901ms
   ✓ card 7: isolated core journey > logs in all six labeled seed accounts and lists the three local companions 962ms
   ✓ card 7: isolated core journey > registers and authenticates a real user; wrong password is rejected 382ms

 Test Files  17 passed (17)
      Tests  45 passed (45)
   Start at  14:04:21
   Duration  5.43s (transform 390ms, setup 0ms, collect 1.24s, tests 11.20s, environment 2ms, prepare 1.15s)
```

### validate

```text
> le3eb_club@1.0.0 validate /private/tmp/le3eb-card1.rjureB/repo
> tsx scripts/validate-money.ts && node scripts/validate-alg.mjs

validate-money: configured packages and policy passed money-v1-9ae384162951baaf7341

 RUN  v2.1.9 /private/tmp/le3eb-card1.rjureB/repo

 ✓ tests/golden/m6/golden.spec.ts (1 test) 2ms
 ✓ tests/golden/m6/golden-all.spec.ts (4 tests) 4ms
 ✓ tests/golden/m5/golden-all.spec.ts (5 tests) 3ms
 ✓ tests/golden/m5/golden.spec.ts (1 test) 4ms

 Test Files  4 passed (4)
      Tests  11 passed (11)
   Start at  14:04:28
   Duration  486ms (transform 82ms, setup 0ms, collect 234ms, tests 13ms, environment 0ms, prepare 252ms)
```

### build

```text
> le3eb_club@1.0.0 build /private/tmp/le3eb-card1.rjureB/repo
> vite build && tsc -p tsconfig.server.json

vite v6.4.2 building for production...
transforming...
✓ 2116 modules transformed.
rendering chunks...
computing gzip size...
dist/index.html                   0.47 kB │ gzip:   0.31 kB
dist/assets/index-DP__ncS0.css   78.53 kB │ gzip:  12.05 kB
dist/assets/index-zougFbcU.js   816.23 kB │ gzip: 223.74 kB

(!) Some chunks are larger than 500 kB after minification. Consider:
- Using dynamic import() to code-split the application
- Use build.rollupOptions.output.manualChunks to improve chunking: https://rollupjs.org/configuration-options/#output-manualchunks
- Adjust chunk size limit for this warning via build.chunkSizeWarningLimit.
✓ built in 3.38s
```

### account-race-green

```text
PROFILE_DRAFT {"expected":"[LOCAL] Buyer 1","actual":"[LOCAL] Buyer 1"}
PASS delayed live avatar response ignored after logout; authenticated profile draft correct; token remains cleared.
```

### Static restoration guard

```text
Restoration guard passed: 48 original route keys, no banned fixture references, protected paths unchanged.
```

Build exits successfully with a bundle-size warning (816.23 kB JS before gzip). Splitting the restored monolithic prototype is a follow-up optimization, not silently claimed as done.

## Screenshots

All images below are actual restored UI captures. LOCAL accounts and accumulated reviews come from explicit isolated development runs.

| Page | English | العربية / RTL |
| --- | --- | --- |
| Home | [View](screenshots/home-en.jpg) | [عرض](screenshots/home-ar.jpg) |
| Game | [View](screenshots/game-en.jpg) | [عرض](screenshots/game-ar.jpg) |
| Companion | [View](screenshots/profile-en.jpg) | [عرض](screenshots/profile-ar.jpg) |
| Community empty state | [View](screenshots/community-en.jpg) | [عرض](screenshots/community-ar.jpg) |
| Messages | [View](screenshots/messages-en.jpg) | [عرض](screenshots/messages-ar.jpg) |
| Chat | [View](screenshots/chat-en.jpg) | [عرض](screenshots/chat-ar.jpg) |
| Me | [View](screenshots/me-en.jpg) | [عرض](screenshots/me-ar.jpg) |
| Wallet | [View](screenshots/wallet-en.jpg) | [عرض](screenshots/wallet-ar.jpg) |
| Recharge | [View](screenshots/recharge-en.jpg) | [عرض](screenshots/recharge-ar.jpg) |
| Settings | [View](screenshots/settings-en.jpg) | [عرض](screenshots/settings-ar.jpg) |
| Apply 1 | [View](screenshots/application-step1-en.jpg) | [عرض](screenshots/application-step1-ar.jpg) |
| Apply 2 | [View](screenshots/application-step2-en.jpg) | [عرض](screenshots/application-step2-ar.jpg) |
| Apply 3 | [View](screenshots/application-step3-en.jpg) | [عرض](screenshots/application-step3-ar.jpg) |
| Apply 4 | [View](screenshots/application-step4-en.jpg) | [عرض](screenshots/application-step4-ar.jpg) |

[Admin approval](screenshots/admin-review-proof.jpg) · [Public listing after approval](screenshots/approved-companion-public.jpg)

