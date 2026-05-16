-- ── Photo Comparisons (before/after) ─────────────────────────────────────────
create table if not exists public.photo_comparisons (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  title           text not null default 'Photo Comparison',
  trade           text not null default 'general',
  before_url      text,
  after_url       text,
  before_analysis jsonb,
  after_analysis  jsonb,
  tags            text[] not null default '{}',
  created_at      timestamptz not null default now()
);
alter table public.photo_comparisons enable row level security;
create policy "photo_comparisons_self" on public.photo_comparisons
  for all using (user_id = auth.uid());

-- ── Work Photos (all captured images) ───────────────────────────────────────
create table if not exists public.work_photos (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  title       text not null,
  photo_url   text,
  trade       text not null default 'general',
  tags        text[] not null default '{}',
  analysis_id uuid references public.ai_analyses(id) on delete set null,
  comparison_id uuid references public.photo_comparisons(id) on delete set null,
  is_before   boolean,
  created_at  timestamptz not null default now()
);
alter table public.work_photos enable row level security;
create policy "work_photos_self" on public.work_photos
  for all using (user_id = auth.uid());
create index on public.work_photos (user_id, created_at desc);
