-- =============================================================================
-- Gaggle: create-or-join flocks with invite codes
-- Run AFTER supabase_security_migration.sql and supabase_photos_migration.sql.
-- What it does:
--   1. Gives every flock a 6-character invite code (e.g. K7Q2MX)
--   2. Locks flocks so you can only see your OWN flock (no public list)
--   3. Adds two sign-up functions: create a new flock, or join one by code
--   4. Removes the old flock_previews function (it listed every flock)
-- =============================================================================

-- ── 1. Invite codes ─────────────────────────────────────────────────────────
-- No 0/O or 1/I/L so codes are easy to read out loud.
create or replace function public.gen_invite_code()
returns text
language plpgsql volatile
set search_path = ''
as $$
declare
  chars text := 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  code  text;
begin
  loop
    code := '';
    for i in 1..6 loop
      code := code || substr(chars, 1 + floor(random() * length(chars))::int, 1);
    end loop;
    exit when not exists (select 1 from public.flocks where invite_code = code);
  end loop;
  return code;
end
$$;

revoke execute on function public.gen_invite_code() from public, anon, authenticated;

alter table public.flocks add column if not exists invite_code text;

update public.flocks
set invite_code = public.gen_invite_code()
where invite_code is null;

alter table public.flocks alter column invite_code set default public.gen_invite_code();
alter table public.flocks alter column invite_code set not null;

create unique index if not exists flocks_invite_code_key on public.flocks(invite_code);


-- ── 2. Only see your own flock ──────────────────────────────────────────────
drop policy if exists "flocks readable by signed-in users" on public.flocks;
drop policy if exists "flocks read own" on public.flocks;

create policy "flocks read own"
  on public.flocks for select to authenticated
  using (id = public.my_flock_id());


-- ── 3. Sign-up functions ────────────────────────────────────────────────────
-- Each one runs as a single step: checks, then creates the profile (and flock).
-- security definer = runs with the function owner's rights, so it can create
-- a flock the caller isn't a member of yet. The checks inside keep it safe.

create or replace function public.create_profile_new_flock(
  p_username    text,
  p_avatar_id   text,
  p_role        text,
  p_flock_name  text,
  p_flock_emoji text
)
returns json
language plpgsql security definer
set search_path = ''
as $$
declare
  v_flock public.flocks;
  v_user  public.users;
begin
  if auth.uid() is null then
    raise exception 'You need to be signed in.';
  end if;
  if exists (select 1 from public.users where auth_id = auth.uid()) then
    raise exception 'This account already has a profile.';
  end if;
  if exists (select 1 from public.users where lower(username) = lower(trim(p_username))) then
    raise exception 'That username is already taken.';
  end if;
  if coalesce(trim(p_flock_name), '') = '' or length(trim(p_flock_name)) > 40 then
    raise exception 'Flock name must be 1–40 characters.';
  end if;

  insert into public.flocks (name, emoji, description)
  values (trim(p_flock_name), coalesce(nullif(trim(p_flock_emoji), ''), '🪿'), '')
  returning * into v_flock;

  insert into public.users (auth_id, username, avatar_id, role, flock_id)
  values (auth.uid(), trim(p_username), p_avatar_id, p_role, v_flock.id)
  returning * into v_user;

  return json_build_object(
    'user',  row_to_json(v_user)::jsonb - 'password_hash',
    'flock', row_to_json(v_flock)
  );
end
$$;

create or replace function public.create_profile_join_flock(
  p_username    text,
  p_avatar_id   text,
  p_role        text,
  p_invite_code text
)
returns json
language plpgsql security definer
set search_path = ''
as $$
declare
  v_flock public.flocks;
  v_user  public.users;
begin
  if auth.uid() is null then
    raise exception 'You need to be signed in.';
  end if;
  if exists (select 1 from public.users where auth_id = auth.uid()) then
    raise exception 'This account already has a profile.';
  end if;
  if exists (select 1 from public.users where lower(username) = lower(trim(p_username))) then
    raise exception 'That username is already taken.';
  end if;

  select * into v_flock
  from public.flocks
  where invite_code = upper(trim(p_invite_code));

  if not found then
    raise exception 'No flock has that invite code — double-check it.';
  end if;

  insert into public.users (auth_id, username, avatar_id, role, flock_id)
  values (auth.uid(), trim(p_username), p_avatar_id, p_role, v_flock.id)
  returning * into v_user;

  return json_build_object(
    'user',  row_to_json(v_user)::jsonb - 'password_hash',
    'flock', row_to_json(v_flock)
  );
end
$$;

revoke execute on function public.create_profile_new_flock(text, text, text, text, text) from public, anon;
revoke execute on function public.create_profile_join_flock(text, text, text, text)     from public, anon;
grant  execute on function public.create_profile_new_flock(text, text, text, text, text) to authenticated;
grant  execute on function public.create_profile_join_flock(text, text, text, text)     to authenticated;


-- ── 4. Remove the public flock list ─────────────────────────────────────────
drop function if exists public.flock_previews();
