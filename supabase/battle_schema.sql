-- ============================================================
-- Prompt Battle — Supabase Schema
-- Supabase SQL Editor'de çalıştır
-- ============================================================

-- Turlar (her etkinlikte birden fazla tur olabilir)
create table battle_rounds (
  id           uuid primary key default gen_random_uuid(),
  task         text not null,              -- "Bu ürün için slogan yaz"
  status       text default 'waiting',    -- waiting | collecting | voting | finished
  prompt_a_id  uuid,                       -- seçilen prompt A
  prompt_b_id  uuid,                       -- seçilen prompt B
  winner_id    uuid,                       -- kazanan prompt
  created_at   timestamptz default now()
);

-- Gelen promptlar
create table battle_prompts (
  id           uuid primary key default gen_random_uuid(),
  round_id     uuid references battle_rounds(id) on delete cascade,
  player_name  text not null,
  player_id    uuid,                       -- varsa players tablosuna bağlı
  prompt_text  text not null,
  output_text  text,                       -- Claude'un cevabı
  votes        int default 0,
  submitted_at timestamptz default now()
);

-- Oylar
create table battle_votes (
  id           uuid primary key default gen_random_uuid(),
  round_id     uuid references battle_rounds(id) on delete cascade,
  prompt_id    uuid references battle_prompts(id) on delete cascade,
  voter_name   text,
  voter_ip     text,
  voted_at     timestamptz default now(),
  unique (round_id, voter_ip)              -- aynı IP iki kez oy kullanamaz
);

-- Realtime
alter publication supabase_realtime add table battle_rounds;
alter publication supabase_realtime add table battle_prompts;
alter publication supabase_realtime add table battle_votes;

-- RLS
alter table battle_rounds  enable row level security;
alter table battle_prompts enable row level security;
alter table battle_votes   enable row level security;

create policy "public read rounds"   on battle_rounds  for select using (true);
create policy "public read prompts"  on battle_prompts for select using (true);
create policy "public read votes"    on battle_votes   for select using (true);
create policy "insert prompts"       on battle_prompts for insert with check (true);
create policy "insert votes"         on battle_votes   for insert with check (true);
create policy "update rounds"        on battle_rounds  for update using (true);
create policy "update prompts"       on battle_prompts for update using (true);
create policy "insert rounds"        on battle_rounds  for insert with check (true);
