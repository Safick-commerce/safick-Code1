-- =============================================================================
-- Safick — Conversations & messages (product-linked chat)
-- =============================================================================
-- Run in Supabase Dashboard → SQL Editor after schema.sql.
-- Idempotent where possible.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- conversations — one thread per buyer + product
-- -----------------------------------------------------------------------------
create table if not exists public.conversations (
  id                uuid primary key default gen_random_uuid(),
  product_id        uuid not null references public.products(id) on delete cascade,
  buyer_id          uuid not null references public.profiles(id) on delete cascade,
  seller_id         uuid not null references public.profiles(id) on delete cascade,
  created_at        timestamptz not null default now(),
  last_message_at   timestamptz,
  constraint conversations_product_buyer_unique unique (product_id, buyer_id),
  constraint conversations_buyer_not_seller check (buyer_id <> seller_id)
);

create index if not exists conversations_buyer_last_message_idx
  on public.conversations (buyer_id, last_message_at desc nulls last);

create index if not exists conversations_seller_last_message_idx
  on public.conversations (seller_id, last_message_at desc nulls last);

-- -----------------------------------------------------------------------------
-- messages
-- -----------------------------------------------------------------------------
create table if not exists public.messages (
  id                uuid primary key default gen_random_uuid(),
  conversation_id   uuid not null references public.conversations(id) on delete cascade,
  sender_id         uuid not null references public.profiles(id) on delete cascade,
  body              text not null,
  message_type      text not null default 'text',
  created_at        timestamptz not null default now(),
  read_at           timestamptz,
  constraint messages_body_not_empty check (char_length(trim(body)) > 0)
);

create index if not exists messages_conversation_created_idx
  on public.messages (conversation_id, created_at desc);

-- -----------------------------------------------------------------------------
-- Row-Level Security (mobile direct access if ever needed)
-- Backend Prisma uses DATABASE_URL and bypasses RLS; policies protect Supabase client.
-- -----------------------------------------------------------------------------
alter table public.conversations enable row level security;
alter table public.messages enable row level security;

drop policy if exists "conversations_select_participant" on public.conversations;
create policy "conversations_select_participant"
  on public.conversations for select
  using (auth.uid() = buyer_id or auth.uid() = seller_id);

drop policy if exists "conversations_insert_buyer" on public.conversations;
create policy "conversations_insert_buyer"
  on public.conversations for insert
  with check (auth.uid() = buyer_id);

drop policy if exists "messages_select_participant" on public.messages;
create policy "messages_select_participant"
  on public.messages for select
  using (
    exists (
      select 1 from public.conversations c
      where c.id = conversation_id
        and (c.buyer_id = auth.uid() or c.seller_id = auth.uid())
    )
  );

drop policy if exists "messages_insert_participant" on public.messages;
create policy "messages_insert_participant"
  on public.messages for insert
  with check (
    auth.uid() = sender_id
    and exists (
      select 1 from public.conversations c
      where c.id = conversation_id
        and (c.buyer_id = auth.uid() or c.seller_id = auth.uid())
    )
  );
