-- Add last_seen_at for offline presence (Supabase Realtime Presence + client updates).
alter table public.profiles add column if not exists last_seen_at timestamptz;
