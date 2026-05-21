-- =============================================================================
-- Safick — Supabase schema bootstrap
-- =============================================================================
-- Run this in the Supabase Dashboard → SQL Editor → New query, then click Run.
-- It is idempotent: safe to re-run after edits. It does NOT drop existing data.
--
-- What this file sets up:
--   1. public.profiles table (mirrors auth.users + onboarding fields)
--   2. updated_at trigger
--   3. handle_new_user trigger on auth.users (creates a profile row on signup)
--   4. Row-Level Security policies the mobile app relies on
--
-- Background:
--   Supabase wraps any error from a database trigger on auth.users as the
--   generic message:  "AuthApiError: Database error saving new user".
--   If the mobile app shows that error during onboarding, the trigger below
--   either does not exist, or an earlier version is failing because a column
--   is missing / NOT NULL without default. Running this script fixes both.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. profiles table
-- -----------------------------------------------------------------------------
create table if not exists public.profiles (
  id                    uuid primary key references auth.users(id) on delete cascade,
  email                 text,
  full_name             text,
  display_name          text,
  username              text,
  bio                   text,
  phone                 text,
  avatar_url            text,
  cover_image_url       text,
  gender                text,
  city                  text,
  interests             text[]      not null default '{}',
  role                  text        not null default 'buyer',
  onboarding_completed  boolean     not null default false,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

-- Backfill any columns that an earlier (partial) setup may have missed.
alter table public.profiles add column if not exists email                text;
alter table public.profiles add column if not exists full_name            text;
alter table public.profiles add column if not exists display_name         text;
alter table public.profiles add column if not exists username             text;
alter table public.profiles add column if not exists bio                  text;
alter table public.profiles add column if not exists phone                text;
alter table public.profiles add column if not exists avatar_url           text;
alter table public.profiles add column if not exists cover_image_url      text;
alter table public.profiles add column if not exists gender               text;
alter table public.profiles add column if not exists city                 text;
alter table public.profiles add column if not exists interests            text[]      not null default '{}';
alter table public.profiles add column if not exists role                 text        not null default 'buyer';
alter table public.profiles add column if not exists onboarding_completed boolean     not null default false;
alter table public.profiles add column if not exists created_at           timestamptz not null default now();
alter table public.profiles add column if not exists updated_at           timestamptz not null default now();

-- Username uniqueness (multiple NULLs are allowed by Postgres semantics).
create unique index if not exists profiles_username_unique
  on public.profiles (username);

-- -----------------------------------------------------------------------------
-- 2. updated_at maintenance
-- -----------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_profiles_set_updated_at on public.profiles;
create trigger trg_profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- 3. handle_new_user — create a profile row when a new auth user appears
-- -----------------------------------------------------------------------------
-- The mobile client passes these keys in `options.data` (raw_user_meta_data):
--   full_name, display_name, username
-- The trigger reads them and inserts into public.profiles.
--
-- SECURITY DEFINER lets it bypass RLS on public.profiles.
-- A duplicate username is handled gracefully so signup itself never fails:
-- the row is inserted without a username, and the client can patch it
-- during onboarding.
-- -----------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  meta              jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  meta_full_name    text  := nullif(trim(meta->>'full_name'),    '');
  meta_display_name text  := nullif(trim(meta->>'display_name'), '');
  meta_username     text  := nullif(trim(meta->>'username'),     '');
begin
  begin
    insert into public.profiles (id, email, full_name, display_name, username)
    values (
      new.id,
      new.email,
      meta_full_name,
      coalesce(meta_display_name, meta_full_name),
      meta_username
    );
  exception
    when unique_violation then
      -- Username collision: insert without it and let onboarding pick a new one.
      insert into public.profiles (id, email, full_name, display_name)
      values (
        new.id,
        new.email,
        meta_full_name,
        coalesce(meta_display_name, meta_full_name)
      )
      on conflict (id) do nothing;
  end;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- -----------------------------------------------------------------------------
-- 4. Row-Level Security
-- -----------------------------------------------------------------------------
alter table public.profiles enable row level security;

-- Read: anyone (including anonymous) can read public profile fields.
-- This is required for username availability checks during signup and for
-- public seller pages. If you want to lock this down later, replace the
-- policy with a more restrictive USING clause.
drop policy if exists "profiles_select_public" on public.profiles;
create policy "profiles_select_public"
  on public.profiles for select
  using (true);

-- Write: a user can only modify their own row.
drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own"
  on public.profiles for insert
  with check (auth.uid() = id);

-- =============================================================================
-- Verification (optional — run after applying)
-- =============================================================================
-- 1. select * from public.profiles limit 5;
-- 2. select tgname from pg_trigger where tgrelid = 'auth.users'::regclass;
--    → should include  on_auth_user_created
-- 3. Sign up from the app. If it still fails, open
--    Supabase Dashboard → Logs → Auth Logs to see the underlying Postgres
--    error (Supabase masks it as "Database error saving new user" for the
--    client, but the real cause is logged here).
-- 4. Profile avatars: after profiles + RLS work, run `storage_avatars.sql` in the
--    same SQL editor to create the `avatars` bucket and storage policies.
-- =============================================================================
