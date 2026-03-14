-- AI analyses storage for GPT-4o Vision results
create table if not exists public.ai_analyses (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade,
  context text not null default 'general',
  analysis_json jsonb not null default '{}',
  created_at timestamptz default now()
);

alter table public.ai_analyses enable row level security;

create policy "Users can view own analyses"
  on public.ai_analyses for select
  using (auth.uid() = user_id);

create policy "Service role can insert analyses"
  on public.ai_analyses for insert
  with check (true);

create index ai_analyses_user_id_idx on public.ai_analyses(user_id);
create index ai_analyses_created_at_idx on public.ai_analyses(created_at desc);
