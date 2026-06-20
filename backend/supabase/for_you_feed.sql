-- =============================================================================
-- For You feed — products media + view tracking (MVP)
-- =============================================================================
-- Run in Supabase Dashboard → SQL Editor (idempotent).
-- After apply: npm run db:pull && npm run db:generate  (in backend/)
--
-- Adds:
--   • products.category, video_url, thumbnail_url, media_status
--   • public.product_views (analytics + future ranking)
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Product columns for video feed + interest filtering
-- -----------------------------------------------------------------------------

alter table public.products
  add column if not exists category text;

alter table public.products
  add column if not exists video_url text;

alter table public.products
  add column if not exists thumbnail_url text;

alter table public.products
  add column if not exists media_status text not null default 'ready';

-- Only allow known media_status values (existing rows default to 'ready').
do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'products_media_status_check'
      and conrelid = 'public.products'::regclass
  ) then
    alter table public.products
      add constraint products_media_status_check
      check (media_status in ('uploading', 'ready', 'failed'));
  end if;
end $$;

-- Category labels must match onboarding interests (frontend/data/interestCategories.ts).
do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'products_category_check'
      and conrelid = 'public.products'::regclass
  ) then
    alter table public.products
      add constraint products_category_check
      check (
        category is null
        or category in (
          'Fashion', 'Beauty', 'Electronics', 'Home', 'Food', 'Sports',
          'Accessories', 'Books', 'Gadgets', 'Health', 'Cars', 'Art'
        )
      );
  end if;
end $$;

comment on column public.products.category is
  'Discover / For You interest tag; required for new video listings.';
comment on column public.products.video_url is
  'CDN or storage URL for product video (For You feed).';
comment on column public.products.thumbnail_url is
  'Poster image while video buffers.';
comment on column public.products.media_status is
  'uploading | ready | failed — only ready + video_url appear in For You feed.';

-- Feed queries: ready videos with a category (partial index).
create index if not exists products_for_you_feed_idx
  on public.products (created_at desc)
  where video_url is not null
    and media_status = 'ready';

create index if not exists products_category_idx
  on public.products (category)
  where category is not null;

-- -----------------------------------------------------------------------------
-- 2. Product views (MVP analytics — POST /api/products/:id/view)
-- -----------------------------------------------------------------------------

create table if not exists public.product_views (
  id          uuid primary key default gen_random_uuid(),
  product_id  uuid not null references public.products (id) on delete cascade,
  viewer_id   uuid references public.profiles (id) on delete set null,
  client_id   text,
  created_at  timestamptz not null default now(),
  constraint product_views_viewer_or_client check (
    viewer_id is not null or (client_id is not null and length(trim(client_id)) > 0)
  )
);

comment on table public.product_views is
  'Impression/watch events for For You; dedupe in API layer.';
comment on column public.product_views.client_id is
  'Anonymous device/session id when viewer_id is null (guest feed).';

create index if not exists product_views_product_id_created_at_idx
  on public.product_views (product_id, created_at desc);

create index if not exists product_views_viewer_product_created_at_idx
  on public.product_views (viewer_id, product_id, created_at desc)
  where viewer_id is not null;

create index if not exists product_views_client_product_created_at_idx
  on public.product_views (client_id, product_id, created_at desc)
  where client_id is not null;

-- -----------------------------------------------------------------------------
-- 3. RLS — product_views (products policies unchanged)
-- -----------------------------------------------------------------------------

alter table public.product_views enable row level security;

drop policy if exists "product_views_insert_authenticated" on public.product_views;
create policy "product_views_insert_authenticated"
  on public.product_views
  for insert
  to authenticated
  with check (viewer_id = auth.uid());

drop policy if exists "product_views_insert_anon_client" on public.product_views;
create policy "product_views_insert_anon_client"
  on public.product_views
  for insert
  to anon
  with check (viewer_id is null and client_id is not null);

-- Reads: sellers could see counts later; MVP keeps select to service role / backend only.
drop policy if exists "product_views_select_none_public" on public.product_views;
create policy "product_views_select_none_public"
  on public.product_views
  for select
  to authenticated, anon
  using (false);
