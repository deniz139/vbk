-- ============================================================
-- Prompt Battle — Supabase Schema
-- Supabase SQL Editor'de çalıştır. Tekrar çalıştırılabilir:
-- yeni projede tabloları kurar, mevcut projede eksikleri tamamlar.
-- ============================================================

-- Turlar
create table if not exists battle_rounds (
  id                  uuid primary key default gen_random_uuid(),
  task                text not null,              -- "Bu ürün için slogan yaz"
  status              text default 'collecting',  -- collecting | presenting | finished
  selected_prompt_ids uuid[] default '{}',        -- sunumda gösterilecek promptlar (sıralı)
  current_display_idx int default 0,              -- büyük ekranda gösterilen prompt
  winner_id           uuid,                       -- kazanan prompt
  created_at          timestamptz default now()
);

-- Eski şemadan gelen projeler için eksik kolonlar
alter table battle_rounds add column if not exists selected_prompt_ids uuid[] default '{}';
alter table battle_rounds add column if not exists current_display_idx int default 0;

-- Gelen promptlar
create table if not exists battle_prompts (
  id           uuid primary key default gen_random_uuid(),
  round_id     uuid references battle_rounds(id) on delete cascade,
  player_name  text not null,
  player_id    uuid,
  prompt_text  text not null,
  output_text  text,                              -- admin'in girdiği AI çıktısı
  votes        int default 0,
  submitted_at timestamptz default now()
);

-- Realtime (zaten ekliyse atla)
do $$
begin
  if not exists (select 1 from pg_publication_tables
                 where pubname = 'supabase_realtime' and tablename = 'battle_rounds') then
    alter publication supabase_realtime add table battle_rounds;
  end if;
  if not exists (select 1 from pg_publication_tables
                 where pubname = 'supabase_realtime' and tablename = 'battle_prompts') then
    alter publication supabase_realtime add table battle_prompts;
  end if;
end $$;

-- RLS
alter table battle_rounds  enable row level security;
alter table battle_prompts enable row level security;

drop policy if exists "public read rounds"  on battle_rounds;
drop policy if exists "insert rounds"       on battle_rounds;
drop policy if exists "update rounds"       on battle_rounds;
drop policy if exists "public read prompts" on battle_prompts;
drop policy if exists "insert prompts"      on battle_prompts;
drop policy if exists "update prompts"      on battle_prompts;
drop policy if exists "delete prompts"      on battle_prompts;

create policy "public read rounds"  on battle_rounds  for select using (true);
create policy "insert rounds"       on battle_rounds  for insert with check (true);
create policy "update rounds"       on battle_rounds  for update using (true);
create policy "public read prompts" on battle_prompts for select using (true);
create policy "insert prompts"      on battle_prompts for insert with check (true);
create policy "update prompts"      on battle_prompts for update using (true);
create policy "delete prompts"      on battle_prompts for delete using (true);  -- admin 🗑 butonu için
