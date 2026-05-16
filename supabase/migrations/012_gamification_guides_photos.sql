-- user_xp: gamification XP and streak tracking per user
create table if not exists public.user_xp (
  user_id          uuid primary key references auth.users(id) on delete cascade,
  total_xp         int not null default 0,
  level            int not null default 1,
  streak_days      int not null default 0,
  longest_streak   int not null default 0,
  last_active_date date,
  updated_at       timestamptz not null default now()
);

alter table public.user_xp enable row level security;

create policy "Users can view their own xp"
  on public.user_xp for select using (user_id = auth.uid());

create policy "Users can manage their own xp"
  on public.user_xp for all using (user_id = auth.uid());

create policy "Service role full access on user_xp"
  on public.user_xp for all using (true);

-- achievements: global achievement definitions (seed data)
create table if not exists public.achievements (
  key         text primary key,
  title       text not null,
  description text,
  icon        text not null default 'star',
  color       text not null default '#F59E0B',
  xp_reward   int not null default 50,
  threshold   int not null default 1,
  created_at  timestamptz not null default now()
);

alter table public.achievements enable row level security;

create policy "Anyone can view achievements"
  on public.achievements for select using (true);

create policy "Service role full access on achievements"
  on public.achievements for all using (true);

-- user_achievements: junction of users and unlocked achievements
create table if not exists public.user_achievements (
  user_id         uuid not null references auth.users(id) on delete cascade,
  achievement_key text not null references public.achievements(key) on delete cascade,
  unlocked_at     timestamptz not null default now(),
  primary key (user_id, achievement_key)
);

alter table public.user_achievements enable row level security;

create policy "Users can view their achievements"
  on public.user_achievements for select using (user_id = auth.uid());

create policy "Service role full access on user_achievements"
  on public.user_achievements for all using (true);

create index user_achievements_user_id_idx on public.user_achievements(user_id);

-- certifications: trade certifications earned by users
create table if not exists public.certifications (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  type        text not null,
  issued_by   text,
  earned_at   timestamptz not null default now(),
  expires_at  timestamptz,
  created_at  timestamptz not null default now()
);

alter table public.certifications enable row level security;

create policy "Users can view their certifications"
  on public.certifications for select using (user_id = auth.uid());

create policy "Service role full access on certifications"
  on public.certifications for all using (true);

create index certifications_user_id_idx on public.certifications(user_id);
create index certifications_earned_at_idx on public.certifications(earned_at desc);

-- progress_entries: record of completed tasks per user
create table if not exists public.progress_entries (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  task_id      uuid not null references public.tasks(id) on delete cascade,
  completed_at timestamptz not null default now()
);

alter table public.progress_entries enable row level security;

create policy "Users can view their progress"
  on public.progress_entries for select using (user_id = auth.uid());

create policy "Users can record their progress"
  on public.progress_entries for insert with check (user_id = auth.uid());

create policy "Service role full access on progress_entries"
  on public.progress_entries for all using (true);

create unique index progress_entries_user_task_uidx on public.progress_entries(user_id, task_id);
create index progress_entries_user_id_idx on public.progress_entries(user_id);
create index progress_entries_completed_at_idx on public.progress_entries(completed_at desc);

-- task_guides: step-by-step trade guides with rich content
create table if not exists public.task_guides (
  id                 uuid primary key default gen_random_uuid(),
  title              text not null,
  description        text,
  trade              text not null,
  category           text not null,
  difficulty         text not null default 'beginner',  -- beginner | intermediate | advanced
  estimated_minutes  int not null default 30,
  step_count         int not null default 0,
  is_premium         boolean not null default false,
  steps              jsonb not null default '[]',
  tools_required     text[] not null default '{}',
  materials          text[] not null default '{}',
  code_reference     text,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

alter table public.task_guides enable row level security;

create policy "Anyone can view task guides"
  on public.task_guides for select using (true);

create policy "Service role full access on task_guides"
  on public.task_guides for all using (true);

create index task_guides_trade_idx on public.task_guides(trade);
create index task_guides_category_idx on public.task_guides(category);
create index task_guides_difficulty_idx on public.task_guides(difficulty);

-- guide_bookmarks: user-saved guide bookmarks
create table if not exists public.guide_bookmarks (
  user_id    uuid not null references auth.users(id) on delete cascade,
  guide_id   uuid not null references public.task_guides(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, guide_id)
);

alter table public.guide_bookmarks enable row level security;

create policy "Users can manage their bookmarks"
  on public.guide_bookmarks for all using (user_id = auth.uid());

create index guide_bookmarks_user_id_idx on public.guide_bookmarks(user_id);

-- work_photos: photos captured on the job site
create table if not exists public.work_photos (
  id        uuid primary key default gen_random_uuid(),
  user_id   uuid not null references auth.users(id) on delete cascade,
  title     text not null,
  photo_url text not null,
  trade     text not null default 'general',
  tags      text[] not null default '{}',
  created_at timestamptz not null default now()
);

alter table public.work_photos enable row level security;

create policy "Users can view their work photos"
  on public.work_photos for select using (user_id = auth.uid());

create policy "Users can insert work photos"
  on public.work_photos for insert with check (user_id = auth.uid());

create policy "Service role full access on work_photos"
  on public.work_photos for all using (true);

create index work_photos_user_id_idx on public.work_photos(user_id);
create index work_photos_created_at_idx on public.work_photos(created_at desc);

-- photo_comparisons: before/after photo comparisons
create table if not exists public.photo_comparisons (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  title      text not null,
  trade      text not null default 'general',
  before_url text,
  after_url  text,
  tags       text[] not null default '{}',
  created_at timestamptz not null default now()
);

alter table public.photo_comparisons enable row level security;

create policy "Users can manage their comparisons"
  on public.photo_comparisons for all using (user_id = auth.uid());

create index photo_comparisons_user_id_idx on public.photo_comparisons(user_id);
create index photo_comparisons_created_at_idx on public.photo_comparisons(created_at desc);
