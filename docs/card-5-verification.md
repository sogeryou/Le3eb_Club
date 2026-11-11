# Card 5 — configurable money, amended scope

The user superseded the PDF's 25:1 requirement. The approved scope is centralized configuration, recharge packages, startup validation and new transaction snapshots. No balance conversion, withdrawal/exchange workflow implementation or real-payment launch is included.

## Defaults and old/new packages

| Old amount / coins + bonus | New default amount / gross coins |
| --- | --- |
| 0.99 / 60 | 1 / 100 |
| 4.99 / 300 + 15 | 5 / 500 |
| 9.99 / 600 + 45 | 10 / 1000 |
| 19.99 / 1200 + 120 | 20 / 2000 |
| 49.99 / 3000 + 450 | 50 / 5000 |
| 99.99 / 6000 + 1200 | 100 / 10000 |

All new packages have zero bonus. The amount charged is unchanged by channel fees; the received coins are `floor((paid USD - channel fee USD) × coins/USD)`.

Other configured defaults: 1 spent coin = 1 settled diamond, 150 diamonds/USD withdrawal quote, minimum USD 20, USD 0.02 step, zero platform withdrawal fee, exchange 100 diamonds to 80 coins. Actual chain fees are not quoted or charged by this card. The legacy maximum-diamond risk cap remains unchanged; no new withdrawal is accepted.

## Configuration and snapshots

- `backend/policy/moneyConfig.ts` is the only default monetary configuration. Optional `MONEY_POLICY_JSON` environment overrides are strict, validated on startup and require a restart. Unknown fields, malformed JSON, nonpositive rates, duplicate packages, invalid withdrawal steps and invalid fees fail startup before storage is loaded.
- Package validation uses only the configured tolerance; the old ×30 relaxation is gone. `pnpm validate` imports the same runtime policy instead of duplicating exchange rates in JavaScript.
- `GET /api/money/policy` exposes the active public policy and feature availability. `GET /api/recharge/packages` exposes sandbox quotes derived from it. The frontend sends the displayed policy ID when creating a recharge, so a changed quote produces 409 and requires refresh.
- New recharge records store policy ID, relevant rates, paid USD, gross coins, channel fee and final credited coins. Verification credits the stored number, not the current configuration. Old records without snapshots retain their stored amounts; unfinished records not explicitly marked as sandbox are blocked from sandbox verification and require separate reconciliation.
- New service orders store their monetary policy and settlement diamond amount; final payable coins are rounded down to an integer as previously agreed. Completion uses that snapshot. Legacy orders retain the existing stored total and legacy settlement fallback.
- No historical balance or order conversion is performed. The old validation script was replaced, not retained as an alternative policy source.

Example local sandbox override:

```sh
export MONEY_POLICY_JSON='{"coinsPerUsd":120,"sandboxChannelFeeUsd":0.351}'
```

This is a verification example, not the committed default or a live channel fee schedule. Only the sandbox uses that fee. Real provider fee calculation and verified provider receipts remain a separate task.

## Safety boundaries

- Only non-production `PAYMENT_PROVIDER=sandbox` can create/verify new recharges. Production and placeholder real providers return 503 without crediting. The UI explicitly labels the sandbox rather than claiming a real Apple/Google payment.
- Duplicate verification of a successful order does not credit again; transaction reuse on another order is rejected. Verification locks also prevent concurrent verification/manual-credit overlap in the local single-process backend.
- New withdrawals return 503 pending the reviewed freeze/manual-payout workflow. Exchange remains unavailable. Existing historical withdrawal records and their recorded amounts are not recalculated.
- This does not make the JSON wallet/settlement backend production-ready; real settlement, payout workflow and real channel integration remain excluded.

## Evidence and reproduction

- `pnpm lint`, `pnpm test`, `pnpm build`, `pnpm validate`: passed. Build retains the existing chunk-size warning.
- Default-policy browser/API test: six correct packages, no bonus label, $1 sandbox recharge credits 100 once, an old receipt cannot credit a second order, a 100-coin completed order produces 100 diamonds, withdrawals remain closed.
- Configuration-change test: create a pending $1/100-coin order; stop the server; restart with the example override above; reject its stale policy ID for new purchases, but credit its stored 100 coins unchanged. A new $1 quote receives 77 coins after the explicitly configured test fee. Restore default configuration afterwards.
- Startup test launches the server with an invalid policy and verifies a nonzero exit before port binding. Production/provider guard tests verify the closed endpoints do not mutate historical records or credit wallets.
- In a disposable local server, use `CARD5_ISOLATED=true CARD5_TEST_TAG=<unique-short-tag>` with `tests/e2e/configured-recharge.spec.ts`. Supply local admin credentials and test URL in the environment. Reuse the tag with `CARD5_RESTART_CHECK=true` for the configuration-change phase.

## Rate search

The old runtime 25/25 policy, old 5% withdrawal anchor, old recharge tiers and the duplicated validation script were removed/replaced in money policy, server packages, validation, frontend quote text and tests. The sole old 0.99/60 fixture remains deliberately in `real-recharge-closed.spec.ts` to prove historical data is not changed.
