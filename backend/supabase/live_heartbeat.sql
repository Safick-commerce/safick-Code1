-- Seller heartbeat for zombie live-session cleanup.
-- Run manually in Supabase SQL Editor after live_events exists.

ALTER TABLE public.live_events
  ADD COLUMN IF NOT EXISTS seller_last_heartbeat_at TIMESTAMPTZ;

-- Backfill existing live rows so they are not immediately swept.
UPDATE public.live_events
SET seller_last_heartbeat_at = COALESCE(started_at, created_at, now())
WHERE status = 'live' AND seller_last_heartbeat_at IS NULL;

CREATE INDEX IF NOT EXISTS live_events_live_heartbeat_idx
  ON public.live_events (status, seller_last_heartbeat_at)
  WHERE status = 'live';
