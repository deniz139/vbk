-- ============================================================
-- QR Yoklama — Supabase Schema
-- Yeni SQL sekmesinde çalıştır
-- ============================================================

create table sessions (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,              -- 'Sabah Oturumu', 'Öğle', 'Öğleden Sonra'
  date        date default current_date,
  starts_at   text,                       -- '09:00'
  active      boolean default true,
  created_at  timestamptz default now()
);

create table attendance (
  id          uuid primary key default gen_random_uuid(),
  session_id  uuid references sessions(id) on delete cascade,
  player_id   uuid references players(id) on delete set null,
  name        text not null,
  email       text,
  checked_in_at timestamptz default now(),
  unique (session_id, player_id),         -- aynı kişi aynı oturuma iki kez giremez
  unique (session_id, email)              -- email varsa da tekrar engelle
);

-- Realtime
alter publication supabase_realtime add table sessions;
alter publication supabase_realtime add table attendance;

-- RLS
alter table sessions   enable row level security;
alter table attendance enable row level security;

create policy "public read sessions"    on sessions   for select using (true);
create policy "public read attendance"  on attendance for select using (true);
create policy "insert attendance"       on attendance for insert with check (true);
create policy "insert sessions"         on sessions   for insert with check (true);
create policy "update sessions"         on sessions   for update using (true);

-- Demo oturumlar
insert into sessions (name, starts_at) values
  ('Sabah Oturumu',      '09:00'),
  ('Öğle Oturumu',       '13:00'),
  ('Öğleden Sonra',      '15:30');
