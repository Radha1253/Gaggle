-- ─── Run this in your Supabase SQL editor ────────────────────────────────────

-- Flocks table
create table if not exists flocks (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  emoji       text not null default '🪿',
  description text not null default '',
  created_at  timestamptz default now()
);

-- Seed some flocks
insert into flocks (name, emoji, description) values
  ('The Wanderers',  '🌍', 'Exploring far and wide'),
  ('The Nest',       '🪹', 'Home base crew'),
  ('The Honkers',    '📣', 'Loud and proud'),
  ('The Snack Squad','🍔', 'Always hungry, always happy')
on conflict do nothing;

-- Users table (custom auth — NOT Supabase Auth)
create table if not exists users (
  id           uuid primary key default gen_random_uuid(),
  username     text not null unique,
  password_hash text not null,   -- SHA-256 hex, client-side hashed
  avatar_id    text not null default 'a1',
  role         text not null default 'waddler',
  flock_id     uuid references flocks(id),
  created_at   timestamptz default now()
);

-- Enable RLS but allow all for now (tighten later)
alter table flocks enable row level security;
alter table users  enable row level security;

create policy "public read flocks"  on flocks for select using (true);
create policy "public insert users" on users  for insert with check (true);
create policy "public read users"   on users  for select using (true);
