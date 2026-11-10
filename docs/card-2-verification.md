# Card 2 — images and companion detail

## Changed areas

- Shared image rendering in active views and cards: local avatar/cover fallback for missing, blocked or failed sources. Home retains its four local covers from Card 1; the existing game directory uses a local fallback with the game title shown by the card. The profile album renders stored images or an empty state, not generated sample photos.
- The companion detail uses emerald surfaces and sand/gold accents, with no purple styling. Order and review actions retain their existing behavior.
- Settings avatar picker → authenticated signing → upload → authenticated commit → saved user profile. The directory refreshes after a successful change; detail and session read the same user avatar.

## API and risk review

- `POST /api/uploads/signed` and `POST /api/uploads/commit` accept `purpose: "avatar"`. The commit returns `{ avatarUrl }`; the session/user response exposes the current avatar. Other upload purposes retain their existing contract.
- Avatar keys are scoped to the authenticated account. Commit does not accept a URL from the caller, verifies the object and image type/size, and saves only after verification. Local PUT is authenticated, local serving exposes only the committed avatar, and neither local route is enabled in production.
- For production, configure the existing S3 provider and HTTPS `S3_PUBLIC_BASE_URL`, allow browser PUT with `Content-Type` and `If-None-Match` in bucket CORS, and permit server-side object metadata and range reads. S3 signed avatar PUTs are create-only. Local tests do not exercise a live S3 bucket.
- Assets: new `client/public/default-cover.svg`; reused `default-companion.svg` and the local homepage art. No new external image provider. Dormant demo constants are not part of the active screens.

## Reproduction

1. Start the disposable development server with JSON storage; never point this acceptance test at production.
2. Run `pnpm lint`, `pnpm test`, and `pnpm build`.
3. Set `CARD2_ISOLATED=true` and run `pnpm exec playwright test tests/e2e/avatar-resilience.spec.ts`. It registers a test companion, blocks external resources, checks the default avatar, uploads a local JPEG from Settings, verifies the live card/detail, and blocks the avatar URL to exercise the fallback.
4. Restart the same development server without clearing storage. Run the same spec with `CARD2_RESTART_CHECK=true` to verify the updated avatar still renders.

No payment, chat, image storage migration, game catalog renaming, deployment, or later card work is included.
