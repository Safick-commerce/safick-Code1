# Safick — Developer setup & testing guide

Use this document to clone the repo, install dependencies, connect to Supabase + the local API, and verify that core MVP flows work. Share it with any new teammate so setup steps stay consistent.

**Last updated:** May 2026  
**Repo layout:** monorepo with `frontend/` (Expo app) and `backend/` (Express + Socket.IO + Prisma)

---

## 1. What you are running

| Layer | Tech | Purpose |
|-------|------|---------|
| Mobile app | Expo (React Native) | UI, auth session, most DB reads/writes |
| Auth + DB + Storage | Supabase (cloud) | Login, `profiles`, `products`, file uploads |
| API + real-time | Express on port **4000** | Chat REST + **Socket.IO** (messages, typing) |

**Important:** The app uses **both** Supabase (direct) and the Express API (hybrid):

- **Supabase direct:** sign up, profiles, create listing, search, avatar upload  
- **Express API:** conversations, message history, socket chat  

You **must** run the backend locally (or point to a shared dev server) for chat to work.

---

## 2. Prerequisites

Install these before cloning:

| Tool | Version | Notes |
|------|---------|--------|
| **Git** | any recent | Clone the repository |
| **Node.js** | **20 LTS** or **22 LTS** recommended | Check with `node -v` |
| **npm** | comes with Node | Check with `npm -v` |
| **Expo Go** | latest | On physical phone ([Android](https://play.google.com/store/apps/details?id=host.exp.exponent) / [iOS](https://apps.apple.com/app/expo-go/id982107779)) |
| **Supabase access** | — | Ask team lead for project invite or shared credentials |
| **Code editor** | VS Code / Cursor | Optional but recommended |

**Optional**

- Android Studio / Xcode emulator (Expo can also use physical device — **recommended for chat testing**)
- [Supabase CLI](https://supabase.com/docs/guides/cli) (not required; SQL runs in Dashboard)

**Windows firewall:** Allow Node on **port 4000** when prompted (needed for phone → PC API).

---

## 3. Clone the repository

```bash
git clone <REPO_URL>
cd SAFICK
```

Replace `<REPO_URL>` with the actual Git remote from your team lead.

---

## 4. Supabase project (one-time / shared)

All developers typically share **one dev Supabase project** for MVP. Ask the team lead for:

1. Supabase **project URL**
2. Supabase **anon public key** (safe for mobile app)
3. Database **connection strings** for backend (see below — **service role / DB URL is secret**)

### 4.1 Run SQL scripts (in order)

Open **Supabase Dashboard → SQL Editor → New query**. Run each file from `backend/supabase/` **in this order**: ignore this cause all the sql already exist in the supabase account so i really doudt if you have to run it againd.

| Order | File | What it sets up |
|-------|------|-----------------|
| 1 | `schema.sql` | `profiles`, signup trigger, RLS |
| 2 | `storage_avatars.sql` | `avatars` storage bucket + policies |
| 3 | *(below)* **products table + bucket** | Required for listings + chat FK |
| 4 | `conversations.sql` | `conversations` + `messages` + RLS |

Scripts are **idempotent** where possible — safe to re-run after edits.

#### Products table + storage (if not already in project)

`conversations.sql` references `public.products`. If that table does not exist yet, run:

```sql
-- products table (listings)
create table if not exists public.products (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  description text,
  price       numeric not null,
  image_url   text,
  seller_id   uuid references public.profiles(id) on delete cascade,
  created_at  timestamptz default now()
);

alter table public.products enable row level security;

drop policy if exists "products_select_all" on public.products;
create policy "products_select_all"
  on public.products for select using (true);

drop policy if exists "products_insert_own" on public.products;
create policy "products_insert_own"
  on public.products for insert to authenticated
  with check (seller_id = auth.uid());

drop policy if exists "products_update_own" on public.products;
create policy "products_update_own"
  on public.products for update to authenticated
  using (seller_id = auth.uid());

drop policy if exists "products_delete_own" on public.products;
create policy "products_delete_own"
  on public.products for delete to authenticated
  using (seller_id = auth.uid());

-- products storage bucket
insert into storage.buckets (id, name, public)
values ('products', 'products', true)
on conflict (id) do update set public = excluded.public;

drop policy if exists "products_storage_select" on storage.objects;
create policy "products_storage_select"
  on storage.objects for select using (bucket_id = 'products');

drop policy if exists "products_storage_insert_own" on storage.objects;
create policy "products_storage_insert_own"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'products'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
```

### 4.2 Verify Supabase after SQL

In SQL Editor:

```sql
-- Should return rows without error
select count(*) from public.profiles;
select count(*) from public.products;
select count(*) from public.conversations;
```

Signup trigger check:

```sql
select tgname from pg_trigger where tgrelid = 'auth.users'::regclass;
-- Should include on_auth_user_created
```

--- ignore this its already in the supabase editor 

## 5. Backend setup (`backend/`)

### 5.1 Install dependencies

```bash
cd backend
npm install
```

`postinstall` runs `prisma generate` automatically.

### 5.2 Environment file

```bash
cp .env.example .env
```

Edit `backend/.env` with values from **Supabase Dashboard → Project Settings**:

| Variable | Where to find it |
|----------|------------------|
| `DATABASE_URL` | Database → Connection string → **Transaction pooler** (port 6543) |
| `DIRECT_URL` | Database → **Direct** or Session pooler (for Prisma CLI) |
| `SUPABASE_URL` | Settings → API → Project URL |
| `SUPABASE_ANON_KEY` | Settings → API → anon public |
| `PORT` | `4000` (default) |

**Never commit `.env` or paste production secrets into git.**

Optional fallback if URL + anon key are not set:

- `SUPABASE_JWT_SECRET` — Settings → API → JWT Secret (legacy HS256 verify)

### 5.3 Generate Prisma client

After SQL changes or fresh clone:

```bash
npm run db:generate
```

If schema drifted from Supabase:

```bash
npx prisma db pull
npm run db:generate
```

### 5.4 Start the API

```bash
npm run dev
```

Expected console output:

```
Safick backend running on http://localhost:4000
LAN: use http://<your-pc-ip>:4000 on physical phones
```

### 5.5 Verify backend

On your PC browser:

```
http://localhost:4000/api/health
```

Expected:

```json
{ "status": "ok", "timestamp": "...", "environment": "development" }
```

Run unit tests:

```bash
npm test
```

All tests should pass.

---

## 6. Frontend setup (`frontend/`)

### 6.1 Install dependencies

```bash
cd frontend
npm install
```

### 6.2 Environment file

```bash
cp .env.example .env
```

Edit `frontend/.env`:

```env
EXPO_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJ...your_anon_key...

# REQUIRED for chat — see section 7 for IP rules
EXPO_PUBLIC_API_URL=http://YOUR_PC_WIFI_IP:4000
```

**Rules for `EXPO_PUBLIC_API_URL`:**

| Scenario | Value |
|----------|--------|
| Physical phone (recommended) | `http://192.168.x.x:4000` — your PC **Wi‑Fi IPv4** (`ipconfig` on Windows, `ifconfig` on Mac) |
| Android/iOS emulator on same PC | Often `http://10.0.2.2:4000` (Android) or `http://localhost:4000` (iOS sim) |
| **Do NOT use** | `localhost` on a **physical** phone, VirtualBox IP `192.168.56.x`, or URL without `http://` |

**Restart Expo after any `.env` change** (env is read at bundle time).

### 6.3 Start Expo

```bash
npx expo start
```

- Scan QR code with **Expo Go** on your phone  
- Phone and PC must be on the **same Wi‑Fi network**

---

## 7. Network checklist (most common failure)

Before testing chat, confirm from the **phone browser**:

```
http://YOUR_PC_WIFI_IP:4000/api/health
```

You should see `{"status":"ok",...}`.

If this fails:

1. Backend is not running → start `npm run dev` in `backend/`
2. Wrong IP in `frontend/.env` → fix and restart Expo
3. Windows Firewall blocked Node → allow port 4000
4. Phone on mobile data instead of same Wi‑Fi → join same network

---

## 8. Manual test plan (MVP)

Use **two accounts** on **two devices** (or one phone + emulator) for chat.

### 8.1 Auth & onboarding

| Step | Action | Expected |
|------|--------|----------|
| 1 | Sign up with a **new email** | No “Database error saving new user” |
| 2 | Complete onboarding (name, username, interests) | Lands on home tabs |
| 3 | Check Supabase → Authentication → Users | User exists |
| 4 | Check `public.profiles` | Row with `onboarding_completed = true` |

### 8.2 Create listing (seller)

| Step | Action | Expected |
|------|--------|----------|
| 1 | Log in as **Seller** | — |
| 2 | Create a new product (photo + title + price) | Success alert, no stub/fake save |
| 3 | Supabase → `products` table | New row with `seller_id` |

### 8.3 Discover product (buyer)

| Step | Action | Expected |
|------|--------|----------|
| 1 | Log in as **Buyer** (different account) | — |
| 2 | **Search** for the product title | Product appears (search uses real Supabase data) |
| 3 | Open product details | Listing loads |

> **Note:** Home feed may still show **mock data**. Use **Search** for real listings until feed is wired.

### 8.4 Chat (buyer → seller)

| Step | Action | Expected |
|------|--------|----------|
| 1 | Buyer: Product details → **Message seller** | Chat screen opens (no “Internal server error”) |
| 2 | Buyer: Send a text message | Appears in chat |
| 3 | Seller: Home → **Messages** icon | Conversation listed with buyer name |
| 4 | Seller: Open conversation | Sees buyer’s message |
| 5 | Seller: Reply | Buyer sees reply (may take ~1s; faster if both in chat with socket connected) |
| 6 | Either: Tap **tag icon** → enter price → Send offer | Other user sees “Price offer” card |

### 8.5 Socket / typing (optional)

| Step | Action | Expected |
|------|--------|----------|
| 1 | Both users open the **same chat** | Header shows “Connected” when socket OK |
| 2 | One user types | Other may see typing dots |
| 3 | Send message while both in chat | Near-instant delivery |

---

## 9. Architecture quick reference

```
Mobile app
├── Supabase Auth     → login, session, access_token
├── Supabase DB       → profiles, products, search
├── Supabase Storage  → avatars, product images
└── Express API       → /api/conversations/*
    └── Socket.IO     → join_conversation, send_message, typing
         └── Prisma   → same Postgres as Supabase
```

Backend **does not** replace Supabase for login. It **verifies** the Supabase `access_token` on REST and sockets.

`/api/auth/*` routes exist but return **501** — the app uses Supabase Auth directly.

---

## 10. Key commands cheat sheet

| Task | Command | Where |
|------|---------|--------|
| Install backend deps | `npm install` | `backend/` |
| Run API + Socket.IO | `npm run dev` | `backend/` |
| Backend tests | `npm test` | `backend/` |
| Prisma generate | `npm run db:generate` | `backend/` |
| Install frontend deps | `npm install` | `frontend/` |
| Run Expo | `npx expo start` | `frontend/` |
| Health check | open `/api/health` | browser / phone |

---

## 11. Important files map

| Path | Purpose |
|------|---------|
| `frontend/.env` | Supabase URL/key + API URL for phone |
| `backend/.env` | DB URLs + Supabase verify keys |
| `backend/supabase/schema.sql` | Profiles + auth trigger |
| `backend/supabase/conversations.sql` | Chat tables |
| `backend/src/server.ts` | HTTP + Socket.IO entry |
| `backend/src/routes/conversation.routes.ts` | Chat REST API |
| `backend/src/socket/chat.socket.ts` | Real-time message handlers |
| `frontend/lib/apiFetch.ts` | Authenticated REST to Express |
| `frontend/lib/socket.ts` | Socket.IO client |
| `frontend/app/usermessage.tsx` | Chat UI |
| `frontend/app/messages.tsx` | Inbox list |
| `frontend/utils/productApi.ts` | Create listing (Supabase direct) |
| `frontend/utils/conversationApi.ts` | Chat API client |

---

## 12. Troubleshooting

| Symptom | Likely cause | Fix |
|---------|--------------|-----|
| “Network request failed” on chat | Wrong `EXPO_PUBLIC_API_URL` | Use PC Wi‑Fi IP + `:4000`, restart Expo |
| “Internal server error” opening chat | Backend not running or old code | Restart `npm run dev`, pull latest |
| “Database error saving new user” | `schema.sql` not applied | Run SQL in Supabase |
| Seller sees empty Messages | Old app bundle | Reload app; ensure latest `messages.tsx` |
| Messages slow but work | Normal on dev Wi‑Fi + remote Supabase DB | Both users in chat + same network helps |
| Chat works, typing doesn’t | Socket not connected | Check health URL on phone; reload app |
| Create listing fails on upload | Missing `products` bucket/table | Run products SQL in section 4.1 |
| Prisma P1001 | DB URL / firewall / IPv6 | Use pooler URL from dashboard |

---

## 13. What is real vs mock (current MVP)

| Feature | Data source |
|---------|-------------|
| Auth, onboarding, profiles | Real (Supabase) |
| Create listing, search | Real (Supabase) |
| Chat, inbox, offers | Real (Express + Supabase DB) |
| Home For You feed | Partially **mock** |
| Unbox / live stream | **Mock** (LiveKit not wired) |
| Backend `/api/auth/*` | Not used (501) |

---

## 14. Before opening a PR

1. `npm test` passes in `backend/`
2. Manual smoke: sign up OR login → search product → message seller → receive reply
3. No secrets in git (`.env` stays local)
4. Map work to MVP scope (see `.cursor/rules/mvp-priority-gate.mdc`)

---

## 15. Getting help

1. Read this file and `backend/README.md` / `frontend/README.md`
2. Confirm `/api/health` from phone browser
3. Check backend terminal for Prisma / socket errors
4. Ask team lead for Supabase project access or shared `.env` values (**via secure channel**, not Slack plaintext for DB passwords)

---

## 16. Checklist (printable)

```
[ ] Node 20+ installed
[ ] Repo cloned
[ ] Supabase schema.sql run
[ ] Supabase storage_avatars.sql run
[ ] Products table + bucket SQL run
[ ] Supabase conversations.sql run
[ ] backend/.env filled (DATABASE_URL, SUPABASE_URL, SUPABASE_ANON_KEY)
[ ] backend npm install && npm run dev
[ ] http://localhost:4000/api/health → ok
[ ] backend npm test → pass
[ ] frontend/.env filled (SUPABASE + API URL with PC Wi‑Fi IP)
[ ] frontend npm install && npx expo start
[ ] Phone http://PC_IP:4000/api/health → ok
[ ] Sign up + onboarding works
[ ] Create listing works
[ ] Search finds listing
[ ] Message seller + reply on second account works
```
