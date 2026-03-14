-- FieldLens - Trade skills training and certification tracker
-- Migration: 00001_initial_schema.sql

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ============================================================================
-- PROFILES TABLE
-- ============================================================================
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  full_name text,
  email text,
  avatar_url text,
  trade text,
  onboarding_completed boolean default false,
  onboarding_completed_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.profiles enable row level security;

create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

-- ============================================================================
-- HANDLE NEW USER TRIGGER
-- ============================================================================
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, email, avatar_url)
  values (
    new.id,
    new.raw_user_meta_data->>'full_name',
    new.email,
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================================================
-- TASKS TABLE
-- Training tasks organized by trade and difficulty
-- ============================================================================
create table if not exists public.tasks (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  description text,
  trade text not null,
  difficulty_order integer not null default 0,
  estimated_minutes integer,
  instructions text,
  video_url text,
  created_at timestamptz default now()
);

create index idx_tasks_trade on public.tasks(trade);
create index idx_tasks_difficulty on public.tasks(trade, difficulty_order);

alter table public.tasks enable row level security;

-- Tasks are shared reference data, readable by all authenticated users
create policy "Authenticated users can view tasks"
  on public.tasks for select
  using (auth.role() = 'authenticated');

create policy "Service role can manage tasks"
  on public.tasks for all
  using (auth.role() = 'service_role');

-- ============================================================================
-- PROGRESS ENTRIES TABLE
-- Tracks which tasks a user has completed
-- ============================================================================
create table if not exists public.progress_entries (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users on delete cascade not null,
  task_id uuid references public.tasks on delete cascade not null,
  completed_at timestamptz default now(),
  notes text,
  rating integer check (rating >= 1 and rating <= 5)
);

create index idx_progress_entries_user_id on public.progress_entries(user_id);
create index idx_progress_entries_task_id on public.progress_entries(task_id);
create unique index idx_progress_entries_user_task on public.progress_entries(user_id, task_id);

alter table public.progress_entries enable row level security;

create policy "Users can view own progress"
  on public.progress_entries for select
  using (auth.uid() = user_id);

create policy "Users can insert own progress"
  on public.progress_entries for insert
  with check (auth.uid() = user_id);

create policy "Users can update own progress"
  on public.progress_entries for update
  using (auth.uid() = user_id);

create policy "Users can delete own progress"
  on public.progress_entries for delete
  using (auth.uid() = user_id);

-- ============================================================================
-- CERTIFICATIONS TABLE
-- Certifications earned by completing task milestones
-- ============================================================================
create table if not exists public.certifications (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users on delete cascade not null,
  name text not null,
  trade text not null,
  description text,
  earned_at timestamptz default now(),
  certificate_url text,
  badge_icon text
);

create index idx_certifications_user_id on public.certifications(user_id);

alter table public.certifications enable row level security;

create policy "Users can view own certifications"
  on public.certifications for select
  using (auth.uid() = user_id);

create policy "Users can insert own certifications"
  on public.certifications for insert
  with check (auth.uid() = user_id);

create policy "Service role can manage certifications"
  on public.certifications for all
  using (auth.role() = 'service_role');

-- ============================================================================
-- UPDATED_AT TRIGGER FUNCTION
-- ============================================================================
create or replace function public.update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger update_profiles_updated_at before update on public.profiles
  for each row execute procedure public.update_updated_at_column();
