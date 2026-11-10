# Card 4 — manual companion review

## State and scope

- New application → `PENDING_REVIEW`. Admin approval → `APPROVED`; rejection → `REJECTED` with a required applicant-visible reason. Reapplying after rejection or changing an approved service's game, introduction or hourly rate returns it to review.
- An unchanged approved application stays approved. Existing approved records are not rewritten. Legacy `PENDING` records are read as pending review and may be reviewed without a migration.
- Only approved companions are public and bookable. Previously created orders retain their existing lifecycle. Account avatar upload remains separate from the companion service application.

## Changed areas and API

- `backend/routes/business.ts` and domain types: authenticated `GET /api/companions/me` returns the caller's application or null, plus status and any rejection reason. Existing apply writes pending; the existing order route returns `409 ORDER_COMPANION_NOT_APPROVED` for a known pending/rejected companion and 404 for unknown IDs.
- `backend/server.ts` and admin workbench/API: default pending queue with submitted game, bio, rate and current avatar. Existing review endpoint validates action/reason, limits reviews to pending applications, checks admin permission, prevents self-review and accepts an expected update timestamp from the UI to reject stale reviews. Approval and rejection use the existing audit chain.
- Client application pages, profile editor and app state read/write real application status. The applicant can refresh the result, see the rejection reason, or resubmit edited data.

## Verify in disposable local storage

- `pnpm lint`, `pnpm test`, `pnpm build`.
- With a local admin and seeded development buyer, run `CARD4_ISOLATED=true pnpm exec playwright test tests/e2e/companion-review.spec.ts`. Supply local admin credentials and the test server URL via environment variables.
- The test verifies the pending queue and public filters, direct booking rejection, ordinary-account review returning 403, blank reason and stale review rejection, admin UI rejection, applicant reason display, successful approval/booking, unchanged approved submission and browser profile edit going back to review.
- Audit sample verified in the test: `COMPANION_REJECT`, target type `COMPANION`, metadata `{"status":"REJECTED","reason":"Introduction needs more detail"}`; successful approval writes `COMPANION_APPROVE` with status `APPROVED`.

No chat, identity verification, image recognition, automatic approval, production data migration, wallet changes, or deployment.
