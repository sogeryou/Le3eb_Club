# Card 8 Original Frontend Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restore all 48 original purple frontend routes and connect existing real APIs without changing Card 1–7 business behavior.

**Architecture:** Original archive JSX is the presentation baseline under the existing AppProvider. Current authentication and businessApi remain authoritative. Separate original view/form state from domain data; unsupported domains render empty states, never fixtures or simulated writes.

**Tech Stack:** React 19, TypeScript, Motion, Tailwind/Vite, existing REST APIs and polling, pnpm 9.15.0, Vitest, Playwright/Chrome.

## Global Constraints

- Base main 8e589eb0c1a98ef87857bdc8d0ea21d9db717c0c; one PR, no merge.
- Source reference /tmp/le3eb-card8-original.JkXYnH/src (extracted from user ZIP).
- Restore all 48 original routes, #0f071a theme, source-layout fidelity, en/ar and RTL.
- No green/sand/gold redesign remnants, fake names/posts/reviews/orders, fixed online numbers, picsum/Unsplash external images in client.
- Do not modify admin/, shared/, backend/, auth logic, money policy, explicit seed scripts, or existing45tests to accommodate UI changes.
- Game counts/approved companions/packages/balances/order states/message history/reviews/moderation come only from real endpoints.
- Default $1=100 coins is read from the server's existing policy/package data, not a frontend exchange constant.
- Unsupported domains retain original routes/navigation with genuine empty states and non-fabricated capability feedback.
- Local tests use disposable data only; existing data must not be overwritten.

---

### Task 1: Original presentation restoration and authoritative API bridge

**Files:** client/App.tsx, client/app/*, client/views/*, client/components/*, client/index.css, client/types/*, client/services/*, client/router/*, client/constants.ts; remove superseded mock/legacy and redesign files only after verifying unused imports. Do not change backend/admin/shared/auth behavior.

**Interfaces:** consume existing useApp(), businessApi, AuthModal and useI18n(); expose original 48 route keys and a presentation-to-business bridge. Data contracts remain those in businessApi.ts and shared/types.ts.

- [ ] Inspect original and existing domain state; inventory original routes and initializers. Create a 48-row source→restored-route inventory in docs/testing/card8-page-inventory.md.
- [ ] Add a regression-check command outside Vitest's existing45test discovery to assert original48routes, banned-source absence and pristine protected directories; run against baseline and record expected failures before implementation.
- [ ] Restore original JSX/components using apply_patch, with a source-provenance mapping. Keep existing domain state and auth/admin entry points authoritative; extend client route union for missing pages.
- [ ] Replace archive imports/initializers for fake domain content with real data or empty arrays. Preserve original form/dialog controls but replace simulated writes with real APIs or explicit unavailable feedback.
- [ ] Map GET /api/games and approved companion APIs into source view models; fetch detail/reviews, use safe uploaded images/local fallbacks. Public discovery handles loading/error/retry/empty without fixture fallback.
- [ ] Wire source controls for recharge/order/chat/reviews/application to existing APIs, keep quote policy snapshots and status-dependent actions. Chat polls REST with cleanup and account isolation.
- [ ] Keep original headers/navigation/typography/card geometry/transitions. Remove obsolete redesigned discovery CSS and source fake/legacy paths rather than leave forbidden dead code.
- [ ] Run pnpm lint, pnpm test, pnpm validate, pnpm build; fix only frontend regressions. Run static guard and record output. Commit the independently testable frontend deliverable.
- [ ] Write task1-report.md with source mapping, actual test results, known gaps and changed files. Review scope and code quality before Task2.

### Task 2: Browser acceptance, bilingual fidelity and focused repair

**Files:** scripts/card8-acceptance.mjs and docs/testing/card8/* evidence; frontend files only for discovered defects.

**Interfaces:** consume restored production UI, existing explicit local seed, real backend APIs, Chrome. Script launches isolated storage, seed accounts and browser contexts. Never import mock server.

- [ ] Create disposable acceptance checkout from completed Task1 source excluding backend/data; seed only this copy; launch backend on dedicated port with sandbox provider and cron disabled.
- [ ] Through visible UI register/login buyer, recharge $1 and verify100coins via API, create order, log in player and accept/start/complete, review as buyer. Verify charge/diamond settlement and all statuses in persisted server state.
- [ ] Send chat from buyer and reply as player in separate contexts; verify polling receives actual messages and third-account isolation still holds.
- [ ] As buyer2 submit companion application, inspect pending UI, use unchanged admin UI to approve, then verify public listing and detail appear.
- [ ] Capture each requested main page in en and ar (separate captures for list/chat and wallet/recharge), including required empty states and settings/application steps. Check screenshots for clipping, RTL, broken images and fidelity to archive, not just text presence.
- [ ] Fix discovered frontend issues and rerun affected flows; retain real failure logs before fixes when relevant.
- [ ] Rerun original45tests and all requested checks, static source guard and protected-directory diff. Commit complete acceptance evidence and report.

### Task 3: Whole-branch review and one PR

**Files:** docs/testing/card8/verification.md and PR metadata only after reviewed fixes.

- [ ] Review entire branch against original48route inventory, source fidelity, API authority, user constraints and actual screenshot/flow evidence. Resolve critical/important findings and rerun focused checks.
- [ ] Publish exact verified git tree to codex/card-8-original-frontend; compare tree SHA and parent chain to tested local revision.
- [ ] Create one PR against main with actual logs, bilingual screenshot artifacts and honest limitations. Stop without merging or starting another card.
