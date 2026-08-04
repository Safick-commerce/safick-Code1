-- Live selling sessions (LiveKit). Run in Supabase SQL Editor after products + profiles exist.

DO $$ BEGIN
  CREATE TYPE public.live_event_status AS ENUM ('scheduled', 'live', 'ended');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS public.live_events (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id         UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  product_id        UUID REFERENCES public.products(id) ON DELETE SET NULL,
  title             TEXT NOT NULL,
  category          TEXT,
  audience          TEXT NOT NULL DEFAULT 'public',
  status            public.live_event_status NOT NULL DEFAULT 'scheduled',
  livekit_room_name TEXT NOT NULL UNIQUE,
  playback_url      TEXT,
  viewer_count      INTEGER NOT NULL DEFAULT 0,
  started_at        TIMESTAMPTZ,
  ended_at          TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS live_events_status_started_idx
  ON public.live_events (status, started_at DESC);

ALTER TABLE public.live_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "live_events_select_public" ON public.live_events;
CREATE POLICY "live_events_select_public"
  ON public.live_events FOR SELECT USING (true);

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
