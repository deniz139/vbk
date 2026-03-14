-- ============================================================
-- Zirve Snack Gamification — Supabase Schema
-- Supabase Dashboard > SQL Editor'de çalıştır
-- ============================================================

-- Standlar
create table stations (
  id           text primary key,          -- 'tost', 'kahve' vs.
  name         text not null,
  description  text,
  active       boolean default true,
  created_at   timestamptz default now()
);

-- Sorular
create table questions (
  id           uuid primary key default gen_random_uuid(),
  station_id   text references stations(id) on delete cascade,
  text         text not null,
  options      jsonb not null,            -- ["A","B","C","D"]
  correct_index int not null,             -- 0-3
  points       int default 20,
  active       boolean default true,
  created_at   timestamptz default now()
);

-- Katılımcılar
create table players (
  id           uuid primary key default gen_random_uuid(),
  name         text not null,
  email        text,
  total_points int default 0,
  created_at   timestamptz default now()
);

-- Cevaplar (her QR okutma = 1 kayıt)
create table answers (
  id           uuid primary key default gen_random_uuid(),
  player_id    uuid references players(id) on delete cascade,
  question_id  uuid references questions(id) on delete cascade,
  station_id   text references stations(id),
  chosen_index int not null,
  is_correct   boolean not null,
  points_earned int default 0,
  answered_at  timestamptz default now(),
  unique (player_id, question_id)         -- aynı soruyu iki kez cevaplamamak için
);

-- ============================================================
-- Realtime: leaderboard canlı güncellensin
-- ============================================================
alter publication supabase_realtime add table players;
alter publication supabase_realtime add table answers;

-- ============================================================
-- RLS (Row Level Security) — basit açık politika, gerekirse kısıtla
-- ============================================================
alter table stations  enable row level security;
alter table questions enable row level security;
alter table players   enable row level security;
alter table answers   enable row level security;

create policy "public read stations"  on stations  for select using (true);
create policy "public read questions" on questions for select using (true);
create policy "public read players"   on players   for select using (true);
create policy "public read answers"   on answers   for select using (true);

create policy "insert players"  on players  for insert with check (true);
create policy "update players"  on players  for update using (true);
create policy "insert answers"  on answers  for insert with check (true);

-- Admin write (service_role key kullan, anon key değil)
create policy "admin write stations"  on stations  for all using (auth.role() = 'service_role');
create policy "admin write questions" on questions for all using (auth.role() = 'service_role');

-- ============================================================
-- Demo veri
-- ============================================================
insert into stations (id, name, description, active) values
  ('tost',     'Süslü Tost Standı',  'Kahvaltılık lezzetler', true),
  ('kunefe',   'Künefe Noktası',     'Tatlı durakları',       true),
  ('smoothie', 'Smoothie Bar',       'Sağlıklı içecekler',    true),
  ('kahve',    'Kahve Durağı',       'Filtre & espresso',     false);

insert into questions (station_id, text, options, correct_index, points) values
  ('tost',     'Bu yıl zirvenin ana teması nedir?',
   '["Yapay Zeka & Gelecek","Sürdürülebilirlik","Fintech","Siber Güvenlik"]', 0, 20),
  ('kunefe',   'Kaç farklı ülkeden konuşmacı var bu zirvede?',
   '["12","7","15","20"]', 0, 20),
  ('smoothie', 'Networking oturumu kaçta başlıyor?',
   '["17:30","16:00","18:00","15:30"]', 0, 10),
  ('kahve',    'Zirvenin kaçıncı yıldönümü bu etkinlik?',
   '["5.","3.","7.","10."]', 0, 10);
