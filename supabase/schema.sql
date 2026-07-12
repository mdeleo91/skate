-- Skate cloud sync: one row per user holding the whole app state as JSON.
-- Run this once in your Supabase project: Dashboard → SQL Editor → paste → Run.
--
-- Row Level Security means the public anon key shipped in the app can only
-- ever read/write the signed-in user's own row.

create table if not exists public.skate_state (
  user_id uuid primary key references auth.users (id) on delete cascade,
  data jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.skate_state enable row level security;

drop policy if exists "Users manage their own state" on public.skate_state;
create policy "Users manage their own state"
  on public.skate_state
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
