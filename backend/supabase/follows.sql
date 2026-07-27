-- =============================================================================
-- Safick — Seller follows (social graph)
-- =============================================================================
-- Run in Supabase Dashboard → SQL Editor after schema.sql.
-- Idempotent where possible.
-- After apply: npm run db:pull && npm run db:generate  (in backend/)
-- =============================================================================

create table if not exists public.follows (
  follower_id  uuid not null references public.profiles (id) on delete cascade,
  followee_id  uuid not null references public.profiles (id) on delete cascade,
  created_at   timestamptz not null default now(),
  primary key (follower_id, followee_id),
  constraint follows_not_self check (follower_id <> followee_id)
);

comment on table public.follows is
  'Buyer follows seller. Reads/writes for the mobile app go through Express; RLS guards direct Supabase access.';

create index if not exists follows_followee_idx
  on public.follows (followee_id);

create index if not exists follows_follower_idx
  on public.follows (follower_id);

-- -----------------------------------------------------------------------------
-- Row-Level Security
-- -----------------------------------------------------------------------------
alter table public.follows enable row level security;

drop policy if exists "follows_insert_own" on public.follows;
create policy "follows_insert_own"
  on public.follows
  for insert
  to authenticated
  with check (follower_id = auth.uid());

drop policy if exists "follows_delete_own" on public.follows;
create policy "follows_delete_own"
  on public.follows
  for delete
  to authenticated
  using (follower_id = auth.uid());

-- List/count queries go through the backend (Prisma + DATABASE_URL).
drop policy if exists "follows_select_none_public" on public.follows;
create policy "follows_select_none_public"
  on public.follows
  for select
  to authenticated, anon
  using (false);
