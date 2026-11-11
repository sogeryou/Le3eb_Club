# Card 3 — direct messages

## Interfaces

| API | Behavior |
| --- | --- |
| `POST /api/conversations` | Create or reuse the canonical two-user conversation from an approved `companionId` or from a real `orderId` belonging to the caller. Unapproved companions return 409, and non-participants cannot use an order to initiate contact. |
| `GET /api/conversations` | Caller-only list with public peer name/avatar, latest message and unread count. |
| `GET /api/conversations/:id/messages` | Participant-only message page: latest by default, older via `before`, polling via `after`, limit capped at 100. |
| `POST /api/conversations/:id/messages` | Participant-only plain text, trimmed, 1–2000 characters. A client retry ID prevents duplicate sends after an ambiguous response. |
| `POST /api/conversations/:id/read` | Advance only the caller's read cursor through the messages received. Never clears the other participant's unread count. |

## Changes and risk review

- Backend: `backend/routes/conversations.ts`, existing JSON state and route registration. No data migration; older storage defaults to an empty conversation collection.
- Client: companion detail, Messages, My orders and order contact entry, API client and chat route. Messages and conversation list use four-second polling; failed sends keep the draft. Order contact reads the real order without changing order state or funds.
- No role bypass for reads, writes or read receipts. Known conversation IDs requested by a third account return 403. Target accounts and order ownership are resolved server-side. No message body is sent to application logs by the chat routes.
- If an approved companion returns to review, starting a conversation from the profile or order is blocked; existing participants can still open their conversation from Messages.

## Verify

1. Run `pnpm lint`, `pnpm test`, `pnpm build`.
2. In a disposable local server, set `CARD3_ISOLATED=true`, a unique short `CARD3_TEST_TAG`, `E2E_BASE_URL` and local admin credentials. Run `pnpm exec playwright test tests/e2e/direct-messages.spec.ts`. The browser test exchanges real messages between two local sessions, simulates a failed send, verifies automatic reply delivery, opens the same conversation from a real order, and exercises access denials and pagination.
3. Stop and restart the same local server without clearing storage. Run the same test with the same tag and `CARD3_RESTART_CHECK=true`. Both message bodies must remain present and render in the browser.

Not included: WebSocket, push notifications, media messages, group chat, read receipt animation, production deployment or later cards.
