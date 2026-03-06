-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Users table (extends Supabase auth.users)
create table public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  full_name text,
  avatar_url text,
  trade text check (trade in ('plumbing', 'electrical', 'hvac', 'carpentry', 'other')),
  experience_level text check (experience_level in ('apprentice', 'journeyman', 'master')),
  subscription_tier text default 'free' check (subscription_tier in ('free', 'pro', 'master')),
  daily_analysis_count integer default 0,
  daily_analysis_reset_at timestamptz default now(),
  current_streak integer default 0,
  longest_streak integer default 0,
  onboarding_completed_at timestamptz,
  created_at timestamptz default now()
);

-- Task guides
create table public.task_guides (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  category text not null,
  trade text not null,
  difficulty text check (difficulty in ('beginner', 'intermediate', 'advanced')),
  estimated_minutes integer,
  step_count integer,
  is_premium boolean default false,
  thumbnail_url text,
  created_at timestamptz default now()
);

-- Task steps
create table public.task_steps (
  id uuid primary key default uuid_generate_v4(),
  task_id uuid references public.task_guides(id) on delete cascade,
  step_number integer not null,
  title text not null,
  instructions text not null,
  image_url text,
  tools text[] default '{}',
  estimated_minutes integer default 5,
  tips text[] default '{}',
  common_mistakes text[] default '{}',
  code_reference text
);

-- Task sessions (user's progress through a guide)
create table public.task_sessions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade,
  task_id uuid references public.task_guides(id),
  current_step integer default 1,
  completed boolean default false,
  ai_checks_performed integer default 0,
  errors_caught integer default 0,
  photos_taken integer default 0,
  started_at timestamptz default now(),
  completed_at timestamptz,
  duration_minutes integer
);

-- AI analyses
create table public.ai_analyses (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade,
  session_id uuid references public.task_sessions(id),
  task_id uuid references public.task_guides(id),
  step_number integer,
  result text check (result in ('correct', 'warning', 'error', 'unclear')),
  message text,
  image_url text,
  created_at timestamptz default now()
);

-- Photos
create table public.session_photos (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade,
  session_id uuid references public.task_sessions(id),
  step_number integer,
  image_url text not null,
  note text,
  analysis_result text,
  created_at timestamptz default now()
);

-- Bookmarks
create table public.bookmarks (
  user_id uuid references auth.users(id) on delete cascade,
  task_id uuid references public.task_guides(id) on delete cascade,
  created_at timestamptz default now(),
  primary key (user_id, task_id)
);

-- Row Level Security
alter table public.profiles enable row level security;
alter table public.task_sessions enable row level security;
alter table public.ai_analyses enable row level security;
alter table public.session_photos enable row level security;
alter table public.bookmarks enable row level security;

create policy "Users can view own profile" on public.profiles for select using (auth.uid() = id);
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);
create policy "Users can view own sessions" on public.task_sessions for all using (auth.uid() = user_id);
create policy "Users can view own analyses" on public.ai_analyses for all using (auth.uid() = user_id);
create policy "Users can view own photos" on public.session_photos for all using (auth.uid() = user_id);
create policy "Users can manage own bookmarks" on public.bookmarks for all using (auth.uid() = user_id);
create policy "Task guides are public" on public.task_guides for select using (true);
create policy "Task steps are public" on public.task_steps for select using (true);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
