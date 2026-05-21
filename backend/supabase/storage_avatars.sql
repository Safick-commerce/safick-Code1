-- =============================================================================
-- Supabase Storage — `avatars` bucket + RLS for profile media (avatar + cover)
-- =============================================================================
-- Run in Dashboard → SQL Editor after `schema.sql` (or anytime; idempotent).
--
-- Option A — run this whole file.
-- Option B — create bucket UI-only: Storage → New bucket → name `avatars` →
--            Public bucket ON, then run only the POLICY section below.
-- =============================================================================

-- Public bucket so getPublicUrl() works with <Image source={{ uri }} />.
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do update set public = excluded.public;

-- Policies on storage.objects ------------------------------------------------
drop policy if exists "avatars_select_public" on storage.objects;
create policy "avatars_select_public"
  on storage.objects for select
  using (bucket_id = 'avatars');

drop policy if exists "avatars_insert_own_folder" on storage.objects;
create policy "avatars_insert_own_folder"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "avatars_update_own_folder" on storage.objects;
create policy "avatars_update_own_folder"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "avatars_delete_own_folder" on storage.objects;
create policy "avatars_delete_own_folder"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
