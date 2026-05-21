# Safick — Main backend (`backend/`)

Node.js **Express** API with **Prisma** and **PostgreSQL**. This service is the **only gateway** the mobile app should call: REST today, WebSockets for real-time chat, and later internal calls to `ai-backend/` for ML features.

## What exists today

| Area | Status |
|------|--------|
| Express app, security middleware, rate limit, health | Done |
| Prisma models `User`, `Session` | Done |
| Routes `/api/auth`, `/api/users` (skeleton) | In progress |
| Supabase `profiles` table + `handle_new_user` trigger (`supabase/schema.sql`) | Done |
| Socket.IO (auth + rooms + typing) | Done |
| Conversations + messages REST + DB persist | Done — run `supabase/conversations.sql`, then `npx prisma db pull` or use schema in repo |
| Redis, S3, products API via Express, notifications | Not started / partial |

## Supabase schema bootstrap

Auth/onboarding currently goes through Supabase (not Prisma). The mobile app
calls `supabase.auth.signUp`, and Supabase fires a trigger on `auth.users`
that mirrors the new user into `public.profiles`. If that trigger is missing
or broken, signup fails with the generic `AuthApiError: Database error saving
new user`.

To apply (or re-apply) the schema:

1. Open the Supabase Dashboard → SQL Editor → New query.
2. Paste the full contents of [`supabase/schema.sql`](./supabase/schema.sql).
3. Click Run. The script is idempotent.
4. Verify the trigger exists: `select tgname from pg_trigger where tgrelid = 'auth.users'::regclass;`
   should include `on_auth_user_created`.

If signup still fails after applying the script, the underlying Postgres
error is logged in Supabase Dashboard → Logs → Auth Logs (Supabase masks it
in the client response for security).

### Auth / onboarding smoke test (manual)

Critical flow — run this before shipping any change that touches auth,
onboarding, or `public.profiles`. (See `.cursor/rules/testing-minimum-bar.mdc`.)

1. In Supabase Dashboard → Authentication → Users, delete any existing test
   user with the email you're about to use (cascades to `profiles`).
2. From the mobile app, sign up with a fresh email through onboarding
   (Step 1 → 4). Pick a username that you know is unused.
3. Expected on Step 1 (NameUsername):
   - Typing a username already present in `profiles` → red X + "already taken".
   - Typing an unused username → green check + "available".
4. Expected after tapping **Finish** on Step 4 (Interests):
   - No error alert.
   - App navigates to `/(tabs)`.
5. Verify profiles in Supabase SQL Editor:
   ```sql
   select id, email, full_name, username, gender, city, interests,
          onboarding_completed
   from public.profiles
   order by created_at desc
   limit 1;
   ```
   All onboarding fields should be populated and `onboarding_completed = true`.

6. **Chat tables:** run [`supabase/conversations.sql`](./supabase/conversations.sql), then `npm run db:generate`.

### Deferred follow-up — automated auth smoke test

**Status:** deferred. **Risk:** schema or trigger regressions in
`public.profiles` only surface through manual signup; a quiet break would
ship to TestFlight unnoticed. **Owner:** unassigned. **Target:** before the
first external beta. **Scope:** Node test (`backend/tests/auth.smoke.ts`)
that uses the Supabase service-role key to (a) create a test user via
`auth.admin.createUser`, (b) assert the matching `profiles` row exists, (c)
write the onboarding fields, (d) read them back, (e) delete the user.

## Target source layout (what to grow into)

Structure below matches how the app is built: **message-to-buy** (chat is core), listings with media, social graph, then ops.

```
backend/
├── prisma/
│   ├── schema.prisma
│   ├── migrations/
│   └── seed.ts                    # optional — create when needed
├── src/
│   ├── config/
│   │   ├── database.ts            # ✓ Prisma client
│   │   ├── env.ts                 # ✓
│   │   ├── redis.ts               # sessions, rate limits, Socket.IO adapter
│   │   └── s3.ts                  # presigned uploads (images / video)
│   ├── middleware/
│   │   ├── auth.ts                # ✓ JWT verification
│   │   ├── validate.ts            # ✓ Zod at boundary
│   │   ├── errorHandler.ts        # ✓
│   │   └── upload.ts              # multipart / proxy to S3 flow (if needed)
│   ├── routes/
│   │   ├── auth.routes.ts         # ✓ extend: refresh, Google, logout
│   │   ├── user.routes.ts         # ✓ extend: profile, onboarding PATCH
│   │   ├── product.routes.ts      # CRUD, seller-only, feed queries
│   │   ├── media.routes.ts        # presigned URL issue / confirm upload
│   │   ├── follow.routes.ts       # follow / unfollow sellers
│   │   ├── wishlist.routes.ts     # sync with frontend WishlistContext
│   │   ├── conversation.routes.ts # list threads, open by product
│   │   ├── message.routes.ts      # history pagination (if not only WS)
│   │   ├── notification.routes.ts # list, mark read
│   │   ├── search.routes.ts       # MVP: Postgres full-text; later proxy AI
│   │   ├── live.routes.ts         # Phase 2: events, schedule, status
│   │   └── internal.routes.ts     # optional: health for workers, AI callbacks
│   ├── controllers/               # thin: parse → service → response
│   ├── services/                  # business logic per domain
│   ├── socket/                    # Socket.IO namespaces / handlers
│   │   ├── index.ts               # attach to HTTP server + Redis adapter
│   │   ├── chat.socket.ts         # join room, send message, typing, live chat
│   │   └── presence.socket.ts     # ping_presence (extend for online status)
│   ├── jobs/                      # optional: BullMQ / cron (thumbnails, cleanup)
│   ├── types/
│   ├── utils/                     # pagination, ids, slug helpers
│   ├── app.ts                     # Express wiring
│   └── server.ts                  # HTTP + Socket.IO bootstrap
├── tests/                         # add as features land (smoke per critical flow)
├── docker-compose.yml             # ✓ Postgres (add Redis when Socket.IO needs it)
├── .env.example
├── package.json
└── tsconfig.json
```

## Prisma / data model — work to schedule

**Already in schema:** `User`, `Session`.

**MVP additions (order matters for dependencies):**

1. **Product** — sellerId, title, description, price (XAF), category, city, media URLs or keys, status, timestamps, indexes for feed (createdAt, category, city).
2. **Follow** — followerId → followeeId (unique pair).
3. **WishlistItem** — userId, productId (unique pair).
4. **Conversation** — buyerId, sellerId, productId (unique triple or “one open thread per buyer–seller–product” rule).
5. **Message** — conversationId, senderId, body, attachments metadata, readAt, createdAt.
6. **Deal** (or fields on `Conversation`) — status enum: e.g. `inquired` → `negotiating` → `agreed` → `delivered` → `completed` (align with product README).
7. **Notification** — userId, type, payload JSON, readAt (push via FCM later).

**Phase 1 (MVP — live selling):**

- **LiveEvent** — sellerId, title, category, status (`scheduled` \| `live` \| `ended`), `livekit_room_name`, `playback_url` (HLS), timestamps, optional viewer count cache.

**Phase 2+ (post-launch):**

- **Review** — tied to completed deal, rating, text, moderator flags.
- **Report** / **Block** — reporter, target, reason.

## Phased delivery (what has to be done)

### Phase 1 — Launch-critical (MVP)

Aligned with Cameroon MVP: real data in the app, chat as the transaction surface, no in-app payments.

| # | Workstream | Outcome |
|---|------------|---------|
| 1 | **Auth hardening** | Google + email flows, JWT access + refresh rotation, logout, `lastActiveAt` updates |
| 2 | **Users / onboarding** | PATCH profile, onboarding fields, avatar via presigned S3 URL |
| 3 | **Media** | S3 (or compatible) presigned PUT; store keys/URLs on User + Product; CDN-friendly URLs in API responses |
| 4 | **Products** | Seller CRUD, public read, feed endpoints: discover / for-you (simple rules first) / following |
| 5 | **Social** | Follow, unfollow, counts on seller profile; wishlist API matching app contexts |
| 6 | **Chat (REST + WS)** | Create/list conversations by product; Socket.IO rooms; persist messages; basic rate limits |
| 7 | **Deal state** | Server-owned transitions on conversation (no trusting client enum alone) |
| 8 | **Search** | PostgreSQL `tsvector` on product title/description/category (good enough for MVP) |
| 9 | **Notifications** | Persist in-app notifications; FCM device registration + send on new message (minimal) |
| 10 | **Frontend integration** | API client in Expo, replace mocks in `feedProducts`, contexts, messages |
| 11 | **Live (Unbox)** | **LiveKit Cloud** tokens + `LiveEvent` CRUD; feed + HLS playback URL; live chat room per session — see `../frontend/docs/PHASE1_LIVE.md` |

**Definition of done for Phase 1:** buyer can open a product, start a thread, exchange messages with seller, and see real listings from the DB; seller can create listings with images/video URLs; **seller can go live and buyer can watch from Unbox with live chat**.

### Phase 2 — Growth

| Workstream | Notes |
|------------|--------|
| Live enhancements | Scheduled events, in-stream shop, clips/VOD library, Live Stream AI |
| Analytics | Aggregates for `seller-analytics` screen (views, inquiries) |
| Reviews | After `completed` deal, one review per party rules |
| Moderation hooks | Report queue export or admin-only routes (even if admin UI is manual) |

### Phase 3 — Payments & AI handoff

| Workstream | Notes |
|------------|--------|
| Payments | Orange Money / Mobile Money — only when product/legal ready; webhooks |
| **AI** | Semantic / hybrid search, recommendations: **main backend** proxies to `ai-backend/` (see `../ai-backend/README.md`) |

## Socket.IO (real-time chat)

No vendor signup. The server shares port **4000** with Express.

1. Set `SUPABASE_URL` + `SUPABASE_ANON_KEY` in `backend/.env` (same as the app).
2. `npm run dev` — logs `Socket.IO: same origin`.
3. App: `EXPO_PUBLIC_API_URL=http://<your-ip>:4000` in `frontend/.env`.
4. Client connects with `auth: { token: session.access_token }`.

| Client emits | Purpose |
|--------------|---------|
| `join_conversation` | `{ conversationId }` |
| `send_message` | `{ conversationId, text, clientId? }` |
| `join_live` / `live_message` | Live room chat |
| `typing` | `{ roomType, roomId, isTyping }` |

| Server emits | Purpose |
|--------------|---------|
| `message` | New DM (also echoed to sender) |
| `live_message` | New live chat line |
| `typing` | Other party typing |

Messages are **broadcast only** until the conversations REST + DB layer lands (see `chat.socket.ts` TODOs).

## Local development

```bash
cp .env.example .env
docker-compose up -d    # PostgreSQL
npm install
npm run db:migrate
npm run dev
```

Health check: `GET /api/health`

## Related docs

- App product context: `../frontend/README.md`
- Cursor backend security expectations: `../.cursor/rules/backend-security-auth.mdc`
