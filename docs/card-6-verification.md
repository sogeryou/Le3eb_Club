# Card 6 — real game directory

## Shared directory

| ID | Game | Local cover |
| --- | --- | --- |
| pubg | PUBG Mobile | game-pubg.jpg |
| fc | EA Sports FC / FC Mobile | game-fc.jpg |
| freefire | Free Fire | game-freefire.jpg |
| val | Valorant | game-valorant.jpg |
| lol | League of Legends | game-lol.svg |
| codm | Call of Duty: Mobile | game-codm.svg |
| roblox | Roblox | game-roblox.svg |

`shared/games.ts` is the sole catalog. The last three covers are local, named placeholders, not unrelated photos. Existing local art and default image fallbacks are retained. Homepage, application choices, profile editing, discovery filters and backend validation use the shared directory. Application surfaces now use the existing emerald/gold palette; login/registration is unchanged.

## APIs and legacy handling

- `GET /api/games` returns canonical metadata and `onlineCompanions`: approved + ONLINE companions with an existing account, grouped by resolved game. Zero is a real count; if catalog loading fails the frontend omits counts.
- New applications accept only supported catalog titles/IDs or recognized real FC title variants. Public list/detail/rankings expose canonical names; filtering uses exact canonical game identity rather than matching the first word of a title.
- Read-only legacy aliases: League Pro → League of Legends; Tactical Duo → Valorant. These are explicit mappings from the previous directory; stored records and old orders are not rewritten.
- Ambiguous labels such as Battle Royale and Open World are not guessed. The record and its status are retained, but it is excluded from public discovery/counts and cannot receive a new order. The admin pending queue flags it for manual resolution.
- `PATCH /api/admin/companions/:id/game` requires existing COMPANION_REVIEW permission. Admin chooses a canonical game; the record goes back to PENDING_REVIEW and the existing audit chain records the old/new values. Approval is blocked until the game resolves. No automatic data migration.

## Evidence

- Unit tests cover the seven titles, local art, explicit aliases, ambiguous names and approved/ONLINE-only counting.
- Browser/API test verifies seven zero counts with zero public companions, the shared application options, rejection of unsupported new titles, a pending PUBG player not counted, one approved PUBG player counted/found by filtering, empty FC results, OFFLINE/BUSY exclusion, and admin UI resolution of a synthetic old record. A normal account's correction request returns 403.
- The browser fixture deliberately contains one approved but unresolved synthetic record. It is not a public companion and contributes zero to every count. It was created only in disposable local test storage; no production records were read, migrated or overwritten.
- `pnpm lint`, `pnpm test` (34 tests), `pnpm build`, `pnpm validate`: passed. Existing Vite chunk-size warning remains.
- To reproduce, use fresh disposable storage with no public companions, a local admin, and `CARD6_ISOLATED=true` with `tests/e2e/game-directory.spec.ts`. Optional `CARD6_LEGACY_ID` identifies a synthetic unresolved record for the admin UI check.

## Search results and exclusions

- No runtime static online-count strings remain. The old `onlineCount` property was removed, including its unused legacy entrypoint render sites.
- Fake names remain only in the deliberate compatibility map, negative test fixtures and these audit notes; they are not catalog options or public fallback cards.
- Dormant fake EPALS/POSTS exports were emptied; active public screens continue using backend records.
- No game-provider integration, external asset host, money-policy change, chat change, deployment or Card 7 work.
