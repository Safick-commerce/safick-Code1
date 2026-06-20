-- =============================================================================
-- Product videos must be readable without login (For You feed + browser test)
-- =============================================================================
-- Symptom: video_url works in SQL but browser / app show "access denied".
-- Fix: public bucket + SELECT policy for anon/authenticated.
--
-- video_url in products must use the PUBLIC object path, e.g.:
--   https://<project>.supabase.co/storage/v1/object/public/products/<user-id>/clip.mp4
-- NOT /object/authenticated/... (requires auth header)
-- =============================================================================

update storage.buckets
set public = true
where id = 'products';

drop policy if exists "products_storage_select" on storage.objects;
create policy "products_storage_select"
  on storage.objects
  for select
  to public
  using (bucket_id = 'products');

-- Optional: dedicated videos bucket (if you prefer separate from images)
insert into storage.buckets (id, name, public)
values ('videos', 'videos', true)
on conflict (id) do update set public = excluded.public;

drop policy if exists "videos_storage_select" on storage.objects;
create policy "videos_storage_select"
  on storage.objects
  for select
  to public
  using (bucket_id = 'videos');
