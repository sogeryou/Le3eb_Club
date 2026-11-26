# Welcome and passwordless registration implementation

1. Verify registration age boundaries, email proof and required avatar in isolated tests.
2. Add the public entry flow to the audited Card 8 version. Keep the existing admin entry and existing password API for backward compatibility.
3. Exchange a verified email or Google identity for an existing session or a short-lived registration ticket. Restrict tickets to profile completion and avatar upload.
4. Build the approved two-language welcome, verification and profile screens. Land on Discover after authentication.
5. Verify builds, tests and the browser journey. Live mail, Google and production avatar storage need deployment configuration and separate acceptance.

## Test environment setup

- Run the isolated integration tests with `pnpm test`. Run the mobile browser journey with `pnpm test:e2e tests/e2e/welcome-auth.spec.ts` on a machine with Chrome.
- Without a mail provider, local non-production runs use the local mail log. For deployed use, set `RESEND_API_KEY` and `AUTH_EMAIL_FROM` with a verified sender. Production fails closed when those settings are missing.
- Set `GOOGLE_AUTH_CLIENT_ID` from a Google Web OAuth client and allow the actual site origin in Google Cloud. Verify a new Google account, a returning account, and first-time linking to an existing email account using a real deployment.
- Production profile photos need the existing S3 credentials and an HTTPS `S3_PUBLIC_BASE_URL`. Test that newly uploaded photos are visible after account creation.
- The birth date limit uses the UTC calendar day on both browser and server. Browser locale shapes the displayed date. The selected birthday still needs explicit confirmation.

## Acceptance status

- 2026-11-23 (Asia/Manila): The project owner accepted the local welcome, sign-in and registration experience. The accepted scope includes the Arabic nickname hint, gender confirmation, registration without a custom photo, avatar dragging and pinch zoom, and a direct transition to Discover.
- Use the accepted flow as the baseline for staging. Verify real email delivery and resend, new and returning Google accounts, safe linking with an existing account, and persisted avatars after reopening the app.
- Archive the v0.1 login and registration task after those checks pass. Record the staging build, date, reviewer and results in the version tracker.

- 2026-11-26 (Asia/Manila): Independent private staging deployment `eef72531-c5d7-4d7d-8d03-0d428ed10990` succeeded. HTTPS, locked entrance, authorized page, frontend asset, and Redis readiness verified. Real mail, Google login, and persisted avatar acceptance remain open; v0.1 is not locked.

- 2026-11-26: Owner accepted real email registration/login. Google staging client configured and deployment succeeded; Google sign-in initiation verified. Interactive consent and linked account acceptance are pending.

- 2026-11-26: Project owner accepted the multilingual Google button repair and reported no further issues. Railway HTTP records confirm successful Google sign-in confirmation requests (200). Freeze v0.1 login/registration scope at deployment `b0fb02b5-b20a-4dde-a9c8-9942e58c52e4`; separate production-domain, public Google consent and production-storage work from this internal acceptance. Same-email linking outcome and avatar persistence were not individually reproduced online by the assistant.
