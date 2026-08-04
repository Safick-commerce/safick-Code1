-- =============================================================================
-- Safick — RLS audit & hardening (run manually in Supabase SQL Editor)
-- =============================================================================
-- Matches LIVE schema (followee_id on follows, not seller_id).
-- Idempotent: safe to re-run. Does NOT rename tables or columns.
--
-- Tables audited:
--   profiles, products, conversations, messages, product_views, live_events
--     → already had RLS; policies refreshed below.
--   follows, notifications, addresses, checkouts, orders, order_items, payouts
--     → RLS enabled + policies added.
--
-- Backend Prisma uses DATABASE_URL (service role) and bypasses RLS.
-- These policies protect direct Supabase client access from the mobile app.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- profiles (public read; own-row write)
-- -----------------------------------------------------------------------------
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles_select_public" ON public.profiles;
CREATE POLICY "profiles_select_public"
  ON public.profiles FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
CREATE POLICY "profiles_update_own"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;
CREATE POLICY "profiles_insert_own"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- -----------------------------------------------------------------------------
-- products (public read; seller owns writes)
-- -----------------------------------------------------------------------------
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "products_select_all" ON public.products;
CREATE POLICY "products_select_all"
  ON public.products FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "products_insert_own" ON public.products;
CREATE POLICY "products_insert_own"
  ON public.products FOR INSERT TO authenticated
  WITH CHECK (seller_id = auth.uid());

DROP POLICY IF EXISTS "products_update_own" ON public.products;
CREATE POLICY "products_update_own"
  ON public.products FOR UPDATE TO authenticated
  USING (seller_id = auth.uid())
  WITH CHECK (seller_id = auth.uid());

DROP POLICY IF EXISTS "products_delete_own" ON public.products;
CREATE POLICY "products_delete_own"
  ON public.products FOR DELETE TO authenticated
  USING (seller_id = auth.uid());

-- -----------------------------------------------------------------------------
-- conversations & messages (participants only)
-- -----------------------------------------------------------------------------
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "conversations_select_participant" ON public.conversations;
CREATE POLICY "conversations_select_participant"
  ON public.conversations FOR SELECT
  USING (auth.uid() = buyer_id OR auth.uid() = seller_id);

DROP POLICY IF EXISTS "conversations_insert_buyer" ON public.conversations;
CREATE POLICY "conversations_insert_buyer"
  ON public.conversations FOR INSERT
  WITH CHECK (auth.uid() = buyer_id);

DROP POLICY IF EXISTS "messages_select_participant" ON public.messages;
CREATE POLICY "messages_select_participant"
  ON public.messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id = conversation_id
        AND (c.buyer_id = auth.uid() OR c.seller_id = auth.uid())
    )
  );

DROP POLICY IF EXISTS "messages_insert_participant" ON public.messages;
CREATE POLICY "messages_insert_participant"
  ON public.messages FOR INSERT
  WITH CHECK (
    auth.uid() = sender_id
    AND EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id = conversation_id
        AND (c.buyer_id = auth.uid() OR c.seller_id = auth.uid())
    )
  );

-- -----------------------------------------------------------------------------
-- product_views (insert only; no public select)
-- -----------------------------------------------------------------------------
ALTER TABLE public.product_views ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "product_views_insert_authenticated" ON public.product_views;
CREATE POLICY "product_views_insert_authenticated"
  ON public.product_views FOR INSERT TO authenticated
  WITH CHECK (viewer_id = auth.uid());

DROP POLICY IF EXISTS "product_views_insert_anon_client" ON public.product_views;
CREATE POLICY "product_views_insert_anon_client"
  ON public.product_views FOR INSERT TO anon
  WITH CHECK (viewer_id IS NULL AND client_id IS NOT NULL);

DROP POLICY IF EXISTS "product_views_select_none_public" ON public.product_views;
CREATE POLICY "product_views_select_none_public"
  ON public.product_views FOR SELECT
  USING (false);

-- -----------------------------------------------------------------------------
-- live_events (public read for feed; seller manages own rows)
-- -----------------------------------------------------------------------------
ALTER TABLE public.live_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "live_events_select_public" ON public.live_events;
CREATE POLICY "live_events_select_public"
  ON public.live_events FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "live_events_insert_own" ON public.live_events;
CREATE POLICY "live_events_insert_own"
  ON public.live_events FOR INSERT TO authenticated
  WITH CHECK (seller_id = auth.uid());

DROP POLICY IF EXISTS "live_events_update_own" ON public.live_events;
CREATE POLICY "live_events_update_own"
  ON public.live_events FOR UPDATE TO authenticated
  USING (seller_id = auth.uid())
  WITH CHECK (seller_id = auth.uid());

DROP POLICY IF EXISTS "live_events_delete_own" ON public.live_events;
CREATE POLICY "live_events_delete_own"
  ON public.live_events FOR DELETE TO authenticated
  USING (seller_id = auth.uid());

-- -----------------------------------------------------------------------------
-- follows (live schema: follower_id + followee_id composite PK)
-- -----------------------------------------------------------------------------
ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "follows_select_own" ON public.follows;
CREATE POLICY "follows_select_own"
  ON public.follows FOR SELECT TO authenticated
  USING (follower_id = auth.uid() OR followee_id = auth.uid());

DROP POLICY IF EXISTS "follows_insert_own" ON public.follows;
CREATE POLICY "follows_insert_own"
  ON public.follows FOR INSERT TO authenticated
  WITH CHECK (follower_id = auth.uid());

DROP POLICY IF EXISTS "follows_delete_own" ON public.follows;
CREATE POLICY "follows_delete_own"
  ON public.follows FOR DELETE TO authenticated
  USING (follower_id = auth.uid());

-- -----------------------------------------------------------------------------
-- notifications (recipient only; inserts via backend service role)
-- -----------------------------------------------------------------------------
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "notifications_select_own" ON public.notifications;
CREATE POLICY "notifications_select_own"
  ON public.notifications FOR SELECT TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "notifications_update_own" ON public.notifications;
CREATE POLICY "notifications_update_own"
  ON public.notifications FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- No client INSERT/DELETE — backend creates notifications via service role.

-- -----------------------------------------------------------------------------
-- addresses (buyer owns rows)
-- -----------------------------------------------------------------------------
ALTER TABLE public.addresses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "addresses_select_own" ON public.addresses;
CREATE POLICY "addresses_select_own"
  ON public.addresses FOR SELECT TO authenticated
  USING (buyer_id = auth.uid());

DROP POLICY IF EXISTS "addresses_insert_own" ON public.addresses;
CREATE POLICY "addresses_insert_own"
  ON public.addresses FOR INSERT TO authenticated
  WITH CHECK (buyer_id = auth.uid());

DROP POLICY IF EXISTS "addresses_update_own" ON public.addresses;
CREATE POLICY "addresses_update_own"
  ON public.addresses FOR UPDATE TO authenticated
  USING (buyer_id = auth.uid())
  WITH CHECK (buyer_id = auth.uid());

DROP POLICY IF EXISTS "addresses_delete_own" ON public.addresses;
CREATE POLICY "addresses_delete_own"
  ON public.addresses FOR DELETE TO authenticated
  USING (buyer_id = auth.uid());

-- -----------------------------------------------------------------------------
-- checkouts (buyer owns rows)
-- -----------------------------------------------------------------------------
ALTER TABLE public.checkouts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "checkouts_select_own" ON public.checkouts;
CREATE POLICY "checkouts_select_own"
  ON public.checkouts FOR SELECT TO authenticated
  USING (buyer_id = auth.uid());

DROP POLICY IF EXISTS "checkouts_insert_own" ON public.checkouts;
CREATE POLICY "checkouts_insert_own"
  ON public.checkouts FOR INSERT TO authenticated
  WITH CHECK (buyer_id = auth.uid());

-- Status updates flow through backend webhooks (service role).

-- -----------------------------------------------------------------------------
-- orders (buyer via checkout OR seller on the order)
-- -----------------------------------------------------------------------------
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "orders_select_participant" ON public.orders;
CREATE POLICY "orders_select_participant"
  ON public.orders FOR SELECT TO authenticated
  USING (
    seller_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.checkouts c
      WHERE c.id = checkout_id AND c.buyer_id = auth.uid()
    )
  );

-- Inserts/updates via backend escrow flow (service role).

-- -----------------------------------------------------------------------------
-- order_items (via parent order access)
-- -----------------------------------------------------------------------------
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "order_items_select_participant" ON public.order_items;
CREATE POLICY "order_items_select_participant"
  ON public.order_items FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.orders o
      JOIN public.checkouts c ON c.id = o.checkout_id
      WHERE o.id = order_id
        AND (o.seller_id = auth.uid() OR c.buyer_id = auth.uid())
    )
  );

-- -----------------------------------------------------------------------------
-- payouts (seller sees own payouts)
-- -----------------------------------------------------------------------------
ALTER TABLE public.payouts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "payouts_select_seller" ON public.payouts;
CREATE POLICY "payouts_select_seller"
  ON public.payouts FOR SELECT TO authenticated
  USING (seller_id = auth.uid());

-- =============================================================================
-- Verification (optional)
-- =============================================================================
-- SELECT tablename, rowsecurity
-- FROM pg_tables
-- WHERE schemaname = 'public'
-- ORDER BY tablename;
--
-- SELECT schemaname, tablename, policyname, cmd, qual, with_check
-- FROM pg_policies
-- WHERE schemaname = 'public'
-- ORDER BY tablename, policyname;
-- =============================================================================
