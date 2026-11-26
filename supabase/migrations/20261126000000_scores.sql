-- Scores: written only by the submit-score edge function (service role). No client policies = no direct access.
create table public.scores (
  id bigint generated always as identity primary key,
  day date not null,
  device_id uuid not null,
  score int not null check (score between 0 and 1200),
  answers jsonb not null,            -- [[skill, correct 0|1, ms], ...] x12
  ip_hash text,
  created_at timestamptz not null default now(),
  unique (day, device_id)            -- one daily score per player; makes retries idempotent
);
create index scores_day_idx on public.scores (day);
create index scores_ip_recent_idx on public.scores (ip_hash, created_at);
alter table public.scores enable row level security;

-- Public aggregate per day; the app reads this with the anon key.
create table public.day_stats (
  day date primary key,
  players int not null,
  mean real not null,
  sd real not null,
  skill jsonb not null default '{}',  -- {"turn": {"acc": 0.78, "ms": 3600}, ...}
  updated_at timestamptz not null default now()
);
alter table public.day_stats enable row level security;
create policy "day_stats are public" on public.day_stats for select to anon, authenticated using (true);

create or replace function public.compute_day_stats(d date) returns void
language sql security definer set search_path = public as $$
  insert into day_stats (day, players, mean, sd, skill, updated_at)
  select d, count(*), avg(score), coalesce(stddev_pop(score), 0),
    coalesce((select jsonb_object_agg(sk, jsonb_build_object('acc', acc, 'ms', ms)) from (
      select a->>0 as sk, avg((a->>1)::int) as acc, avg((a->>2)::int) filter (where (a->>1)::int = 1) as ms
      from scores s, jsonb_array_elements(s.answers) a where s.day = d group by 1) x), '{}')
  , now()
  from scores where day = d
  having count(*) > 0
  on conflict (day) do update set players = excluded.players, mean = excluded.mean, sd = excluded.sd, skill = excluded.skill, updated_at = now();
$$;
revoke execute on function public.compute_day_stats(date) from public, anon, authenticated;

-- Refresh today and yesterday every 10 minutes (players span time zones).
create extension if not exists pg_cron;
select cron.schedule('day-stats', '*/10 * * * *', $$ select public.compute_day_stats(current_date); select public.compute_day_stats(current_date - 1); select public.compute_day_stats(current_date + 1); $$);
