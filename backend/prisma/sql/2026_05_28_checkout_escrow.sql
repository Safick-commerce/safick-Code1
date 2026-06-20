-- =============================================================================
-- 2026-05-28  Checkout / Orders / Escrow tables (Phase 1 of MVP escrow)
-- =============================================================================
-- Creates the tables referenced by backend/src/services/{address,order,payout}.service.ts
-- Idempotent: safe to re-run. Uses IF NOT EXISTS everywhere.
-- Apply with:   npx prisma db execute --schema prisma/schema.prisma --file prisma/sql/2026_05_28_checkout_escrow.sql
-- =============================================================================

-- pgcrypto for gen_random_uuid(); already enabled on Supabase but be defensive.
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- -----------------------------------------------------------------------------
-- profiles: seller payout destination columns
-- -----------------------------------------------------------------------------
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS payout_momo_number   TEXT,
  ADD COLUMN IF NOT EXISTS payout_momo_operator TEXT,
  ADD COLUMN IF NOT EXISTS payout_bank_account  JSONB;

-- -----------------------------------------------------------------------------
-- addresses
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.addresses (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id       UUID NOT NULL,
  recipient_name TEXT NOT NULL,
  phone          TEXT NOT NULL,
  city           TEXT NOT NULL,
  neighborhood   TEXT NOT NULL,
  landmark       TEXT,
  notes          TEXT,
  is_default     BOOLEAN NOT NULL DEFAULT FALSE,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT addresses_buyer_id_fkey
    FOREIGN KEY (buyer_id) REFERENCES public.profiles(id) ON DELETE CASCADE ON UPDATE NO ACTION
);

CREATE INDEX IF NOT EXISTS addresses_buyer_idx         ON public.addresses(buyer_id);
CREATE INDEX IF NOT EXISTS addresses_buyer_default_idx ON public.addresses(buyer_id, is_default);

-- -----------------------------------------------------------------------------
-- checkouts
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.checkouts (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id             UUID NOT NULL,
  address_id           UUID NOT NULL,
  payment_method       TEXT NOT NULL,
  payer_phone          TEXT,
  total_xaf            NUMERIC(12, 0) NOT NULL,
  maviance_service_id  TEXT,
  maviance_ptn         TEXT UNIQUE,
  maviance_payment_ref TEXT NOT NULL UNIQUE,
  status               TEXT NOT NULL DEFAULT 'pending_payment',
  failure_reason       TEXT,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  paid_at              TIMESTAMPTZ,
  CONSTRAINT checkouts_buyer_id_fkey
    FOREIGN KEY (buyer_id) REFERENCES public.profiles(id) ON DELETE CASCADE ON UPDATE NO ACTION,
  CONSTRAINT checkouts_address_id_fkey
    FOREIGN KEY (address_id) REFERENCES public.addresses(id) ON DELETE RESTRICT ON UPDATE NO ACTION
);

CREATE INDEX IF NOT EXISTS checkouts_buyer_status_idx   ON public.checkouts(buyer_id, status);
CREATE INDEX IF NOT EXISTS checkouts_status_created_idx ON public.checkouts(status, created_at);

-- -----------------------------------------------------------------------------
-- orders
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.orders (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  checkout_id     UUID NOT NULL,
  seller_id       UUID NOT NULL,
  subtotal_xaf    NUMERIC(12, 0) NOT NULL,
  status          TEXT NOT NULL DEFAULT 'pending_payment',
  conversation_id UUID,
  auto_release_at TIMESTAMPTZ,
  completed_at    TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT orders_checkout_id_fkey
    FOREIGN KEY (checkout_id) REFERENCES public.checkouts(id) ON DELETE CASCADE ON UPDATE NO ACTION,
  CONSTRAINT orders_seller_id_fkey
    FOREIGN KEY (seller_id) REFERENCES public.profiles(id) ON DELETE RESTRICT ON UPDATE NO ACTION,
  CONSTRAINT orders_conversation_id_fkey
    FOREIGN KEY (conversation_id) REFERENCES public.conversations(id) ON DELETE SET NULL ON UPDATE NO ACTION
);

CREATE INDEX IF NOT EXISTS orders_checkout_idx        ON public.orders(checkout_id);
CREATE INDEX IF NOT EXISTS orders_seller_status_idx   ON public.orders(seller_id, status);
CREATE INDEX IF NOT EXISTS orders_status_release_idx  ON public.orders(status, auto_release_at);

-- -----------------------------------------------------------------------------
-- order_items
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.order_items (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id           UUID NOT NULL,
  product_id         UUID NOT NULL,
  quantity           INTEGER NOT NULL DEFAULT 1,
  unit_price_xaf     NUMERIC(12, 0) NOT NULL,
  title_snapshot     TEXT NOT NULL,
  image_url_snapshot TEXT,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT order_items_order_id_fkey
    FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE CASCADE ON UPDATE NO ACTION,
  CONSTRAINT order_items_product_id_fkey
    FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE RESTRICT ON UPDATE NO ACTION
);

CREATE INDEX IF NOT EXISTS order_items_order_idx   ON public.order_items(order_id);
CREATE INDEX IF NOT EXISTS order_items_product_idx ON public.order_items(product_id);

-- -----------------------------------------------------------------------------
-- payouts
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.payouts (
  id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id                  UUID NOT NULL,
  seller_id                 UUID NOT NULL,
  amount_xaf                NUMERIC(12, 0) NOT NULL,
  destination               JSONB NOT NULL,
  maviance_disbursement_ref TEXT NOT NULL UNIQUE,
  maviance_ptn              TEXT,
  maviance_service_id       TEXT,
  status                    TEXT NOT NULL DEFAULT 'queued',
  failure_reason            TEXT,
  retry_count               INTEGER NOT NULL DEFAULT 0,
  created_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  paid_at                   TIMESTAMPTZ,
  CONSTRAINT payouts_order_id_fkey
    FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE CASCADE ON UPDATE NO ACTION,
  CONSTRAINT payouts_seller_id_fkey
    FOREIGN KEY (seller_id) REFERENCES public.profiles(id) ON DELETE RESTRICT ON UPDATE NO ACTION
);

CREATE INDEX IF NOT EXISTS payouts_order_idx         ON public.payouts(order_id);
CREATE INDEX IF NOT EXISTS payouts_seller_status_idx ON public.payouts(seller_id, status);
CREATE INDEX IF NOT EXISTS payouts_failed_retry_idx  ON public.payouts(status, retry_count);

-- -----------------------------------------------------------------------------
-- messages: link order cards back to their order
-- (message_type column already exists in the live DB; only order_id is new.)
-- -----------------------------------------------------------------------------
ALTER TABLE public.messages
  ADD COLUMN IF NOT EXISTS order_id UUID;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.table_constraints
    WHERE table_schema = 'public'
      AND table_name = 'messages'
      AND constraint_name = 'messages_order_id_fkey'
  ) THEN
    ALTER TABLE public.messages
      ADD CONSTRAINT messages_order_id_fkey
      FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE SET NULL ON UPDATE NO ACTION;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS messages_order_idx ON public.messages(order_id);
