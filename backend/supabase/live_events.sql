-- Live selling sessions (LiveKit). Run in Supabase SQL Editor after products + profiles exist.

do $$ begin
  create type public.live_event_status as enum ('scheduled', 'live', 'ended');
exception
  when duplicate_object then null;
end $$;

create table if not exists public.live_events (
  id                uuid primary key default gen_random_uuid(),
  seller_id         uuid not null references public.profiles(id) on delete cascade,
  product_id        uuid references public.products(id) on delete set null,
  title             text not null,
  category          text,
  audience          text not null default 'public',
  status            public.live_event_status not null default 'scheduled',
  livekit_room_name text not null unique,
  playback_url      text,
  viewer_count      integer not null default 0,
  started_at        timestamptz,
  ended_at          timestamptz,
  created_at        timestamptz not null default now()
);

create index if not exists live_events_status_started_idx
  on public.live_events (status, started_at desc);

alter table public.live_events enable row level security;

drop policy if exists "live_events_select_public" on public.live_events;
create policy "live_events_select_public"
  on public.live_events for select using (true);

drop policy if exists "live_events_insert_own" on public.live_events;
create policy "live_events_insert_own"
  on public.live_events for insert to authenticated
  with check (seller_id = auth.uid());

drop policy if exists "live_events_update_own" on public.live_events;
create policy "live_events_update_own"
  on public.live_events for update to authenticated
  using (seller_id = auth.uid());
