-- =============================================================
--  Sudoku – bảng xếp hạng
--  Chạy toàn bộ file này 1 lần trong Supabase → SQL Editor → Run, SAU ĐÓ chạy anticheat.sql
--  (chạy lại nhiều lần cũng không sao)
-- =============================================================

-- Người chơi: mỗi máy là 1 tài khoản ẩn danh (auth.users), kèm tên hiển thị
create table if not exists public.players (
  id uuid primary key references auth.users (id) on delete cascade,
  name text not null check (char_length(btrim(name)) between 2 and 20),
  created_at timestamptz not null default now()
);

-- Thời gian tốt nhất của mỗi người chơi trên mỗi màn
create table if not exists public.level_scores (
  player_id uuid not null references public.players (id) on delete cascade,
  level_id text not null
    check (level_id ~ '^(easy|medium|hard|expert)-([1-9]|[1-5][0-9]|60)$'),
  time_seconds integer not null check (time_seconds between 10 and 86400),
  mistakes integer not null default 0 check (mistakes between 0 and 100),
  hints integer not null default 0 check (hints between 0 and 3),
  updated_at timestamptz not null default now(),
  primary key (player_id, level_id)
);

create index if not exists level_scores_rank_idx
  on public.level_scores (level_id, time_seconds, updated_at);

-- ---------- Bảo mật (Row Level Security) ----------
alter table public.players enable row level security;
alter table public.level_scores enable row level security;

drop policy if exists "players: ai cũng xem được" on public.players;
create policy "players: ai cũng xem được" on public.players
  for select using (true);

drop policy if exists "players: tự tạo hồ sơ của mình" on public.players;
create policy "players: tự tạo hồ sơ của mình" on public.players
  for insert to authenticated with check ((select auth.uid()) = id);

drop policy if exists "players: tự sửa tên của mình" on public.players;
create policy "players: tự sửa tên của mình" on public.players
  for update to authenticated
  using ((select auth.uid()) = id) with check ((select auth.uid()) = id);

drop policy if exists "scores: ai cũng xem được" on public.level_scores;
create policy "scores: ai cũng xem được" on public.level_scores
  for select using (true);
-- Không có policy insert/update cho level_scores: chỉ ghi qua hàm submit_solution (anticheat.sql).

-- Ghi điểm: chỉ qua hàm submit_solution trong anticheat.sql (máy chủ kiểm tra lời giải + tự tính giờ).

-- ---------- Hạng của tôi trên 1 màn ----------
create or replace function public.level_rank(p_level_id text)
returns table (rank bigint, time_seconds integer, total bigint)
language sql
stable
security invoker
set search_path = public
as $$
  with me as (
    select s.time_seconds, s.updated_at
    from public.level_scores s
    where s.player_id = auth.uid() and s.level_id = p_level_id
  )
  select
    (select count(*) from public.level_scores o
      where o.level_id = p_level_id
        and (o.time_seconds < me.time_seconds
             or (o.time_seconds = me.time_seconds and o.updated_at < me.updated_at))) + 1,
    me.time_seconds,
    (select count(*) from public.level_scores o where o.level_id = p_level_id)
  from me;
$$;

grant execute on function public.level_rank(text) to anon, authenticated;

-- ---------- Bảng xếp hạng tổng ----------
create or replace view public.leaderboard_overall
with (security_invoker = true) as
select
  p.id   as player_id,
  p.name as name,
  count(*)::integer             as levels,
  sum(s.time_seconds)::integer  as total_time
from public.level_scores s
join public.players p on p.id = s.player_id
group by p.id, p.name;

grant select on public.leaderboard_overall to anon, authenticated;
grant select on public.players, public.level_scores to anon, authenticated;
grant insert, update on public.players to authenticated;
