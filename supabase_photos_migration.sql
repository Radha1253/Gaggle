-- =============================================================================
-- Gaggle: persistent place photos
-- Run AFTER supabase_security_migration.sql (it uses public.my_flock_id()).
-- Files live at:  place-photos/<flock_id>/<place_id>/<random>-<filename>
-- The first folder is the flock id, which is what the storage policies check.
-- =============================================================================

-- ── 1. Private bucket: images only, 5 MB max per file ───────────────────────
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'place-photos', 'place-photos', false, 5242880,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/heic']
)
on conflict (id) do nothing;


-- ── 2. place_photos table (id types copied from places / users) ─────────────
do $$
declare place_t text; user_t text;
begin
  select format_type(atttypid, atttypmod) into place_t
  from pg_attribute where attrelid = 'public.places'::regclass and attname = 'id';

  select format_type(atttypid, atttypmod) into user_t
  from pg_attribute where attrelid = 'public.users'::regclass and attname = 'id';

  execute format($f$
    create table if not exists public.place_photos (
      id          bigint generated always as identity primary key,
      place_id    %s not null references public.places(id) on delete cascade,
      path        text not null unique,
      file_name   text,
      uploaded_by %s references public.users(id) on delete set null,
      created_at  timestamptz not null default now()
    )
  $f$, place_t, user_t);
end $$;

create index if not exists place_photos_place_id_idx on public.place_photos(place_id);

alter table public.place_photos enable row level security;

create policy "place_photos read own flock"
  on public.place_photos for select to authenticated
  using (exists (
    select 1 from public.places p
    where p.id = place_id and p.flock_id = public.my_flock_id()
  ));

create policy "place_photos insert own flock"
  on public.place_photos for insert to authenticated
  with check (
    uploaded_by = public.my_user_id()
    and exists (select 1 from public.places p
                where p.id = place_id and p.flock_id = public.my_flock_id())
  );

create policy "place_photos delete own flock"
  on public.place_photos for delete to authenticated
  using (exists (
    select 1 from public.places p
    where p.id = place_id and p.flock_id = public.my_flock_id()
  ));


-- ── 3. Storage policies: only touch files under your own flock's folder ─────
create policy "place-photos read own flock"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'place-photos'
    and (storage.foldername(name))[1] = public.my_flock_id()::text
  );

create policy "place-photos upload own flock"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'place-photos'
    and (storage.foldername(name))[1] = public.my_flock_id()::text
  );

create policy "place-photos delete own flock"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'place-photos'
    and (storage.foldername(name))[1] = public.my_flock_id()::text
  );
