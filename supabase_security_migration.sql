-- =============================================================================
-- Gaggle: security migration
-- Run in Supabase → SQL Editor, top to bottom, ONCE.
-- What it does:
--   1. Links public.users to Supabase Auth (auth_id column)
--   2. Gives places a flock_id so access can be scoped per flock
--   3. Adds helper functions (with fixed search_path — fixes the
--      "function_search_path_mutable" advisor warning)
--   4. Turns on Row Level Security everywhere + replaces all old policies
--      (fixes "rls_disabled_in_public" / "policy exists but RLS disabled")
--   5. Makes the leaderboard views security_invoker
--      (fixes "security_definer_view")
-- =============================================================================

-- ── 1. Link users to auth.users ─────────────────────────────────────────────
alter table public.users
  add column if not exists auth_id uuid unique references auth.users(id) on delete cascade;

-- password_hash is no longer used by the app; let new rows omit it.
alter table public.users alter column password_hash drop not null;


-- ── 2. places.flock_id (same type as flocks.id, whatever that is) ───────────
do $$
declare t text;
begin
  select format_type(atttypid, atttypmod) into t
  from pg_attribute
  where attrelid = 'public.flocks'::regclass and attname = 'id';

  execute format(
    'alter table public.places add column if not exists flock_id %s references public.flocks(id)',
    t
  );
end $$;

-- Backfill from the creator…
update public.places p
set flock_id = u.flock_id
from public.users u
where p.flock_id is null
  and u.id = p.created_by_goose_id;

-- …then from anyone tagged at the place.
update public.places p
set flock_id = u.flock_id
from public.place_people pp
join public.users u on u.id = pp.goose_id
where p.flock_id is null
  and pp.place_id = p.id;

-- Places that still have no flock_id (old "geese"-era rows) will be hidden.
-- See them with:  select * from public.places where flock_id is null;


-- ── 2b. Make sure place_people.place_id → places.id FK exists ───────────────
-- (the app now does `select('*, place_people(goose_id)')`, which needs it)
delete from public.place_people pp
where not exists (select 1 from public.places p where p.id = pp.place_id);

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.place_people'::regclass
      and confrelid = 'public.places'::regclass
      and contype = 'f'
  ) then
    alter table public.place_people
      add constraint place_people_place_id_fkey
      foreign key (place_id) references public.places(id) on delete cascade;
  end if;
end $$;


-- ── 3. Helper functions ─────────────────────────────────────────────────────
-- security definer so policies on users don't recurse; search_path pinned.

create or replace function public.my_flock_id()
returns public.flocks.id%type
language sql stable security definer
set search_path = ''
as $$
  select flock_id from public.users where auth_id = auth.uid()
$$;

create or replace function public.my_user_id()
returns public.users.id%type
language sql stable security definer
set search_path = ''
as $$
  select id from public.users where auth_id = auth.uid()
$$;

revoke execute on function public.my_flock_id() from public, anon;
revoke execute on function public.my_user_id()  from public, anon;
grant  execute on function public.my_flock_id() to authenticated;
grant  execute on function public.my_user_id()  to authenticated;

-- Sign-up needs these BEFORE the person has an account, without exposing
-- the users table to anonymous visitors.

create or replace function public.username_available(p_username text)
returns boolean
language sql stable security definer
set search_path = ''
as $$
  select not exists (
    select 1 from public.users
    where lower(username) = lower(trim(p_username))
  )
$$;

create or replace function public.flock_previews()
returns json
language sql stable security definer
set search_path = ''
as $$
  select coalesce(json_agg(row_to_json(f) order by f.name), '[]'::json)
  from (
    select
      fl.id, fl.name, fl.emoji, fl.description,
      (select count(*) from public.users u where u.flock_id = fl.id) as member_count,
      (select coalesce(json_agg(x.avatar_id), '[]'::json)
         from (select avatar_id from public.users u
               where u.flock_id = fl.id limit 4) x) as avatar_ids
    from public.flocks fl
  ) f
$$;

revoke execute on function public.username_available(text) from public;
revoke execute on function public.flock_previews()          from public;
grant  execute on function public.username_available(text) to anon, authenticated;
grant  execute on function public.flock_previews()          to anon, authenticated;


-- ── 4. Row Level Security ───────────────────────────────────────────────────
alter table public.users        enable row level security;
alter table public.flocks       enable row level security;
alter table public.places       enable row level security;
alter table public.place_people enable row level security;
alter table public.geese        enable row level security;  -- legacy; no policies = locked

-- Drop EVERY existing policy on these tables (old "allow all" policies would
-- otherwise OR together with the new ones and keep everything open).
do $$
declare r record;
begin
  for r in
    select policyname, tablename from pg_policies
    where schemaname = 'public'
      and tablename in ('users', 'flocks', 'places', 'place_people', 'geese')
  loop
    execute format('drop policy %I on public.%I', r.policyname, r.tablename);
  end loop;
end $$;

-- flocks: signed-in users can read flock info
create policy "flocks readable by signed-in users"
  on public.flocks for select to authenticated
  using (true);

-- users: see yourself + your flockmates; only create/edit your own row
create policy "users read own flock"
  on public.users for select to authenticated
  using (auth_id = auth.uid() or flock_id = public.my_flock_id());

create policy "users insert self"
  on public.users for insert to authenticated
  with check (auth_id = auth.uid());

create policy "users update self"
  on public.users for update to authenticated
  using (auth_id = auth.uid())
  with check (auth_id = auth.uid());

-- places: everything scoped to your flock
create policy "places read own flock"
  on public.places for select to authenticated
  using (flock_id = public.my_flock_id());

create policy "places insert own flock"
  on public.places for insert to authenticated
  with check (flock_id = public.my_flock_id());

create policy "places update own flock"
  on public.places for update to authenticated
  using (flock_id = public.my_flock_id())
  with check (flock_id = public.my_flock_id());

-- Any flockmate can delete (matches current UI). Stricter option:
--   using (created_by_goose_id = public.my_user_id())
create policy "places delete own flock"
  on public.places for delete to authenticated
  using (flock_id = public.my_flock_id());

-- place_people: only for places in your flock, only tagging your flockmates
create policy "place_people read own flock"
  on public.place_people for select to authenticated
  using (exists (
    select 1 from public.places p
    where p.id = place_id and p.flock_id = public.my_flock_id()
  ));

create policy "place_people insert own flock"
  on public.place_people for insert to authenticated
  with check (
    exists (select 1 from public.places p
            where p.id = place_id and p.flock_id = public.my_flock_id())
    and exists (select 1 from public.users u
                where u.id = goose_id and u.flock_id = public.my_flock_id())
  );

create policy "place_people delete own flock"
  on public.place_people for delete to authenticated
  using (exists (
    select 1 from public.places p
    where p.id = place_id and p.flock_id = public.my_flock_id()
  ));


-- ── 5. Views run with the caller's permissions (respect RLS) ────────────────
alter view if exists public.flock_leaderboard set (security_invoker = true);
alter view if exists public.goose_leaderboard set (security_invoker = true);


-- =============================================================================
-- AFTER RUNNING: link existing accounts (one block per person)
-- 1. Dashboard → Authentication → Users → Add user → "Create new user"
--    email:    <username lowercase>@gaggle.local    (same as the app builds)
--    password: their new password, check "Auto confirm user"
-- 2. Then run, per person:
--
--   update public.users
--   set auth_id = (select id from auth.users where email = 'rajni@gaggle.local')
--   where lower(username) = 'rajni';
--
-- 3. Once everyone is linked, delete the old hashes for good:
--
--   alter table public.users drop column password_hash;
-- =============================================================================
