# Safick — Main backend (`backend/`)

Node.js **Express** API with **Prisma** and **PostgreSQL**. This service is the **only gateway** the mobile app should call: REST today, WebSockets for real-time chat, and later internal calls to `ai-backend/` for ML features.

## What exists today

| Area | Status |
|------|--------|
| Express app, security middleware, rate limit, health | Done |
| Prisma models `User`, `Session` | Done |
| Routes `/api/auth`, `/api/users` (skeleton) | In progress |
| Redis, Socket.IO, S3, products, chat, notifications | Not started |

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
│   │   ├── chat.socket.ts         # join room, send message, typing
│   │   └── presence.socket.ts     # optional: online / last seen
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

**Phase 2+ (when live/analytics ship):**

- **LiveEvent** — sellerId, scheduledAt, status, playback/recording keys if you store VOD.
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

**Definition of done for Phase 1:** buyer can open a product, start a thread, exchange messages with seller, and see real listings from the DB; seller can create listings with images/video URLs.

### Phase 2 — Growth & live

| Workstream | Notes |
|------------|--------|
| Live events API | Schedule, go-live state, viewer counts (depends on streaming provider choice) |
| Analytics | Aggregates for `seller-analytics` screen (views, inquiries) |
| Reviews | After `completed` deal, one review per party rules |
| Moderation hooks | Report queue export or admin-only routes (even if admin UI is manual) |

### Phase 3 — Payments & AI handoff

| Workstream | Notes |
|------------|--------|
| Payments | Orange Money / Mobile Money — only when product/legal ready; webhooks |
| **AI** | Semantic / hybrid search, recommendations: **main backend** proxies to `ai-backend/` (see `../ai-backend/README.md`) |

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
