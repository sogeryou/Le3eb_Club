# Card 1 — live companion discovery

- Contract: public companion list and detail expose approved records and public profile fields only; ratings derive from approved reviews. Cover empty, unapproved and missing-profile cases first.
- Client: share one discovery source across home, search and categories. Fetch detail by the selected ID; show loading, retry and empty states. Use the supplied homepage palette and Arabic-first locale.
- Booking: submit the selected server ID via the existing order endpoint; never manufacture an order on failure. Leave wallet, moderation, review and payment policies unchanged.
- Acceptance: check empty storage, a locally registered companion, moderation visibility, successful booking and rejected unknown ID; capture screenshots and run lint, tests and build before publishing one PR.

## Delivery and verification

- Backend: `backend/domain/publicCompanion.ts`, domain types, and business routes. `GET /api/companions` adds display name, avatar, nullable rating, approved review count and completed order count. `GET /api/companions/:id` returns the public profile, bookable hourly service and approved reviews; unavailable public records return 404. Existing order creation and authorization rules are unchanged.
- Frontend: app discovery state, public API client, home, discovery cards and detail/booking screens. The home game covers and decorative hero illustration come from the supplied design reference; neither the art nor the test account is shipped as a companion record.
- Local checks: `pnpm lint` passed; `pnpm test` passed (18 tests, 9 files); `pnpm build` passed with a Vite chunk-size warning. Targeted Chromium acceptance passed (1 test).
- Reproduce in a disposable checkout with empty JSON storage, a local-only admin, `ALLOW_DEMO_SEED=true` for the buyer, and settlement cron disabled. Set `CARD1_ISOLATED=true`, `E2E_BASE_URL`, and the local admin credentials in the environment; run `pnpm exec playwright test tests/e2e/live-companions.spec.ts`. The test registers a companion, uses the existing admin review actions, verifies an unknown ID cannot be booked, and checks the order returned from the browser flow binds the registered companion ID.
- Risk review: no static companion IDs enter the live booking path. The existing endpoint independently resolves the ID, requires an approved, online companion and applies existing account and balance checks. The confirmation shows the server order ID; it does not claim payment was taken.
- Not included: manual-review workflow changes, site-wide asset migration, chat, payments, wallet, order lifecycle or production deployment. The browser test uses local accounts and no real money. Product and Muse acceptance remain separate.
