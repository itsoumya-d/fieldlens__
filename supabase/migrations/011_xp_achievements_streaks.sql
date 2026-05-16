-- ── User XP & Streak Tracking ────────────────────────────────────────────────
create table if not exists public.user_xp (
  user_id       uuid primary key references auth.users(id) on delete cascade,
  total_xp      integer not null default 0,
  level         integer not null default 1,
  streak_days   integer not null default 0,
  longest_streak integer not null default 0,
  last_active_date date,
  updated_at    timestamptz not null default now()
);
alter table public.user_xp enable row level security;
create policy "user_xp_self" on public.user_xp for all using (user_id = auth.uid());

-- ── Achievement Definitions ──────────────────────────────────────────────────
create table if not exists public.achievements (
  key         text primary key,
  title       text not null,
  description text not null,
  icon        text not null default 'trophy',
  color       text not null default '#E8711A',
  xp_reward   integer not null default 50,
  threshold   integer not null default 1  -- # of events required to unlock
);
alter table public.achievements enable row level security;
create policy "achievements_read" on public.achievements for select using (true);

-- ── User Achievements (unlocked) ─────────────────────────────────────────────
create table if not exists public.user_achievements (
  user_id         uuid not null references auth.users(id) on delete cascade,
  achievement_key text not null references public.achievements(key) on delete cascade,
  unlocked_at     timestamptz not null default now(),
  primary key (user_id, achievement_key)
);
alter table public.user_achievements enable row level security;
create policy "user_achievements_self" on public.user_achievements for all using (user_id = auth.uid());

-- ── Seed achievement definitions ─────────────────────────────────────────────
insert into public.achievements (key, title, description, icon, color, xp_reward, threshold) values
  ('first_analysis',  'First Look',       'Complete your first AI analysis',                 'eye',              '#2D8A4E', 25,  1),
  ('ten_analyses',    'Sharp Eye',        'Complete 10 AI analyses',                          'scan',             '#E8711A', 100, 10),
  ('fifty_analyses',  'Pro Inspector',    'Complete 50 AI analyses',                          'shield-checkmark', '#E8711A', 250, 50),
  ('first_correct',   'Clean Work',       'Get a "Correct" result on your first try',         'checkmark-circle', '#2D8A4E', 50,  1),
  ('streak_3',        'On a Roll',        'Maintain a 3-day activity streak',                 'flame',            '#F9A825', 75,  3),
  ('streak_7',        'Week Warrior',     'Maintain a 7-day activity streak',                 'flame',            '#E8711A', 150, 7),
  ('streak_30',       'Unstoppable',      'Maintain a 30-day activity streak',                'flame',            '#D32F2F', 500, 30),
  ('guide_complete',  'Student',          'Complete your first task guide',                   'book',             '#1976D2', 50,  1),
  ('ten_guides',      'Journeyman',       'Complete 10 task guides',                          'school',           '#1976D2', 200, 10),
  ('first_error',     'Error Hunter',     'Catch your first code violation with AI',          'bug',              '#D32F2F', 50,  1),
  ('ten_errors',      'Code Inspector',   'Catch 10 code violations with AI',                 'shield',           '#D32F2F', 200, 10),
  ('hours_10',        'Dedicated',        'Log 10 hours of tracked work time',               'time',             '#1976D2', 100, 10),
  ('hours_100',       'Craftsman',        'Log 100 hours of tracked work time',              'medal',            '#E8711A', 500, 100),
  ('all_trades',      'Versatile',        'Perform analyses in 3+ different trade categories','layers',           '#9C27B0', 200, 3),
  ('bookmark_5',      'Knowledge Seeker', 'Bookmark 5 or more task guides',                  'bookmark',         '#6A8CB0', 50,  5)
on conflict (key) do nothing;

-- ── Helper: update streak & award XP ─────────────────────────────────────────
create or replace function public.record_daily_activity(p_user_id uuid)
returns void language plpgsql security definer as $$
declare
  v_today       date := current_date;
  v_yesterday   date := current_date - interval '1 day';
  v_last_active date;
  v_streak      integer;
  v_longest     integer;
begin
  select last_active_date, streak_days, longest_streak
    into v_last_active, v_streak, v_longest
    from public.user_xp
   where user_id = p_user_id;

  if not found then
    insert into public.user_xp (user_id, streak_days, longest_streak, last_active_date)
    values (p_user_id, 1, 1, v_today);
    return;
  end if;

  -- Already recorded today
  if v_last_active = v_today then return; end if;

  -- Consecutive day → extend streak
  if v_last_active = v_yesterday then
    v_streak := v_streak + 1;
  else
    v_streak := 1;  -- reset
  end if;

  v_longest := greatest(v_longest, v_streak);

  update public.user_xp
     set streak_days = v_streak,
         longest_streak = v_longest,
         last_active_date = v_today,
         updated_at = now()
   where user_id = p_user_id;
end;
$$;

-- ── Helper: add XP ────────────────────────────────────────────────────────────
create or replace function public.add_user_xp(p_user_id uuid, p_xp integer)
returns void language plpgsql security definer as $$
declare
  v_total  integer;
  v_level  integer;
begin
  insert into public.user_xp (user_id, total_xp, level) values (p_user_id, p_xp, 1)
  on conflict (user_id) do update set total_xp = user_xp.total_xp + p_xp, updated_at = now()
  returning total_xp into v_total;

  -- Level = floor(sqrt(total_xp / 50)) + 1 (capped at 50)
  v_level := least(50, floor(sqrt(v_total::float / 50))::integer + 1);
  update public.user_xp set level = v_level where user_id = p_user_id;
end;
$$;
