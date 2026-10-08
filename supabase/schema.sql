-- LPU Assignment & Rubric Designer: database schema (Supabase / Postgres).
-- Run once in the Supabase SQL editor of the project you point the app at.
-- Every object is prefixed lpu_ so it can share a project with other apps.

create table if not exists public.lpu_assignments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  course_title text not null,
  topic text not null,
  discipline text not null,
  lane text not null,
  ai_role_level text not null,
  data jsonb not null,
  stress_test jsonb,
  created_at timestamptz not null default now()
);

create index if not exists lpu_assignments_user_created_idx
  on public.lpu_assignments (user_id, created_at desc);

alter table public.lpu_assignments enable row level security;

create policy "lpu owners read their assignments"
  on public.lpu_assignments for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "lpu owners create their assignments"
  on public.lpu_assignments for insert to authenticated
  with check ((select auth.uid()) = user_id);

create policy "lpu owners update their assignments"
  on public.lpu_assignments for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "lpu owners delete their assignments"
  on public.lpu_assignments for delete to authenticated
  using ((select auth.uid()) = user_id);

-- Per-user usage log so the app can cap daily AI spend per account.
create table if not exists public.lpu_usage (
  id bigint generated always as identity primary key,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  kind text not null check (kind in ('generate', 'stress_test')),
  created_at timestamptz not null default now()
);

create index if not exists lpu_usage_user_kind_created_idx
  on public.lpu_usage (user_id, kind, created_at desc);

alter table public.lpu_usage enable row level security;

create policy "lpu users read their usage"
  on public.lpu_usage for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "lpu users log their usage"
  on public.lpu_usage for insert to authenticated
  with check ((select auth.uid()) = user_id);

-- Lets a user clear their own usage records older than 24 hours (records from the last
-- 24 hours stay, because they back the daily limits).
create policy "lpu users clear old usage"
  on public.lpu_usage for delete to authenticated
  using ((select auth.uid()) = user_id and created_at < now() - interval '24 hours');

revoke all on public.lpu_assignments from anon;
revoke all on public.lpu_usage from anon;
