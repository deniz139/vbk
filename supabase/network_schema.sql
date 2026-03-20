-- ============================================================
-- Networking Matchmaking — Supabase Schema
-- Yeni SQL sekmesinde çalıştır
-- ============================================================

create table network_profiles (
  id           uuid primary key default gen_random_uuid(),
  player_id    uuid references players(id) on delete set null,
  name         text not null,
  company      text,
  linkedin_url text,
  interests    text[] not null default '{}',  -- ['AI', 'Fintech', 'Startup']
  created_at   timestamptz default now()
);

create table network_matches (
  id           uuid primary key default gen_random_uuid(),
  profile_a_id uuid references network_profiles(id) on delete cascade,
  profile_b_id uuid references network_profiles(id) on delete cascade,
  common_tags  text[] not null default '{}',
  score        int default 0,
  created_at   timestamptz default now(),
  unique (profile_a_id, profile_b_id)
);

-- Realtime
alter publication supabase_realtime add table network_profiles;
alter publication supabase_realtime add table network_matches;

-- RLS
alter table network_profiles enable row level security;
alter table network_matches  enable row level security;

create policy "public read profiles"  on network_profiles for select using (true);
create policy "public read matches"   on network_matches  for select using (true);
create policy "insert profiles"       on network_profiles for insert with check (true);
create policy "insert matches"        on network_matches  for insert with check (true);
create policy "delete matches"        on network_matches  for delete using (true);
