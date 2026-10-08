-- LPU Assignment & Rubric Designer: organiser access and a shared daily cap.
-- All objects are prefixed lpu_. No email addresses are stored in this file: add organisers
-- afterwards (Supabase > Table Editor > lpu_organisers > Insert row).

-- ---------------------------------------------------------------------------
-- Organisers: people allowed to see anonymised, app-wide summaries.
-- RLS is on with no policies, so the table is invisible through the public API.
-- ---------------------------------------------------------------------------
create table if not exists public.lpu_organisers (
  email text primary key check (email = lower(email)),
  added_at timestamptz not null default now()
);
alter table public.lpu_organisers enable row level security;
revoke all on public.lpu_organisers from anon, authenticated;

create index if not exists lpu_usage_kind_created_idx
  on public.lpu_usage (kind, created_at desc);

-- True only for a signed-in user whose CONFIRMED email is listed in lpu_organisers.
create or replace function public.lpu_is_organiser()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from auth.users u
    join public.lpu_organisers o on o.email = lower(u.email)
    where u.id = auth.uid() and u.email_confirmed_at is not null
  );
$$;
revoke all on function public.lpu_is_organiser() from public, anon;
grant execute on function public.lpu_is_organiser() to authenticated;

-- Anonymised, app-wide summary for the organiser page. Refuses everyone else.
create or replace function public.lpu_organiser_stats()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  result jsonb;
begin
  if not public.lpu_is_organiser() then
    raise exception 'not_organiser' using errcode = '42501';
  end if;

  select jsonb_build_object(
    'generated_at', now(),

    'totals', (
      select jsonb_build_object(
        'assignments', count(*),
        'participants', count(distinct user_id),
        'stress_tests', count(*) filter (where stress_test is not null),
        'first_day', min((created_at at time zone 'Asia/Kolkata')::date),
        'last_day', max((created_at at time zone 'Asia/Kolkata')::date))
      from public.lpu_assignments),

    'last_24h', (
      select jsonb_build_object(
        'generate', count(*) filter (where kind = 'generate'),
        'stress_test', count(*) filter (where kind = 'stress_test'),
        'people', count(distinct user_id))
      from public.lpu_usage
      where created_at > now() - interval '24 hours'),

    'by_day', (
      select coalesce(jsonb_agg(jsonb_build_object('day', day, 'kind', kind, 'requests', requests, 'people', people)
                                order by day desc, kind), '[]'::jsonb)
      from (
        select (created_at at time zone 'Asia/Kolkata')::date as day, kind,
               count(*) as requests, count(distinct user_id) as people
        from public.lpu_usage
        where created_at > now() - interval '30 days'
        group by 1, 2) t),

    'by_discipline', (
      select coalesce(jsonb_agg(jsonb_build_object('discipline', discipline, 'assignments', n) order by n desc, discipline), '[]'::jsonb)
      from (select discipline, count(*) as n from public.lpu_assignments group by discipline) t),

    'lane_level', (
      select coalesce(jsonb_agg(jsonb_build_object('lane', lane, 'level', ai_role_level, 'assignments', n) order by lane, ai_role_level), '[]'::jsonb)
      from (select lane, ai_role_level, count(*) as n from public.lpu_assignments group by lane, ai_role_level) t),

    'miller', (
      select coalesce(jsonb_agg(jsonb_build_object('tier', tier, 'assignments', n) order by n desc, tier), '[]'::jsonb)
      from (select data->'whatThisAssesses'->>'millerTier' as tier, count(*) as n
            from public.lpu_assignments group by 1) t),

    'oral', (
      select coalesce(jsonb_agg(jsonb_build_object('plan', plan, 'assignments', n) order by n desc, plan), '[]'::jsonb)
      from (select data->'designDeclaration'->>'oralVerification' as plan, count(*) as n
            from public.lpu_assignments group by 1) t),

    'stress_overall', (
      select coalesce(jsonb_agg(jsonb_build_object('band', band, 'assignments', n, 'average_score', avg_score) order by avg_score desc), '[]'::jsonb)
      from (select stress_test->>'overallLevel' as band, count(*) as n,
                   round(avg((stress_test->>'overallScorePercent')::numeric), 1) as avg_score
            from public.lpu_assignments where stress_test is not null group by 1) t),

    'stress_by_level', (
      select coalesce(jsonb_agg(jsonb_build_object('level', ai_role_level, 'stress_tests', n, 'average_score', avg_score) order by ai_role_level), '[]'::jsonb)
      from (select ai_role_level, count(*) as n,
                   round(avg((stress_test->>'overallScorePercent')::numeric), 1) as avg_score
            from public.lpu_assignments where stress_test is not null group by 1) t),

    'families', (
      select coalesce(jsonb_agg(jsonb_build_object('family', family, 'scored', scored, 'substitutable', subs,
                                                   'percent', round(100.0 * subs / scored, 0))
                                order by subs::numeric / scored desc, family), '[]'::jsonb)
      from (
        select f.family,
               count(*) as scored,
               count(*) filter (where s.level in ('Proficient', 'Outstanding')) as subs
        from (
          select a.id, c->>'criterionName' as criterion, c->>'level' as level
          from public.lpu_assignments a
          cross join lateral jsonb_array_elements(a.stress_test->'criterionScores') c
          where a.stress_test is not null) s
        join (
          select a.id, r->>'name' as criterion, r->>'family' as family
          from public.lpu_assignments a
          cross join lateral jsonb_array_elements(a.data->'rubric') r) f
          on f.id = s.id and lower(trim(f.criterion)) = lower(trim(s.criterion))
        group by f.family) t
      where scored > 0),

    'health', (
      select jsonb_build_object(
        'total', count(*),
        'lane_b_missing_disclosure', count(*) filter (where lane like 'Lane B%' and ai_role_level not like 'Level 1%' and disclosure is not true),
        'lane_a_with_ai_level', count(*) filter (where lane like 'Lane A%' and ai_role_level not like 'Level 1%'),
        'lane_b_with_level_1', count(*) filter (where lane like 'Lane B%' and ai_role_level like 'Level 1%'),
        'rubric_weights_not_100', count(*) filter (where abs(weight_sum - 100) > 1),
        'no_judgement_criterion', count(*) filter (where not has_judgement))
      from (
        select lane, ai_role_level,
               (data->'aiUse'->>'disclosureRequired')::boolean as disclosure,
               coalesce((select sum((r->>'weightPercent')::numeric) from jsonb_array_elements(data->'rubric') r), 0) as weight_sum,
               exists (select 1 from jsonb_array_elements(data->'rubric') r where r->>'family' = 'Evaluative judgement') as has_judgement
        from public.lpu_assignments) h),

    'participants', (
      select coalesce(jsonb_agg(jsonb_build_object('code', code, 'assignments', n, 'stress_tests', st,
                                                   'first', first_at, 'last', last_at) order by n desc, code), '[]'::jsonb)
      from (
        select substr(md5(user_id::text), 1, 6) as code, count(*) as n,
               count(*) filter (where stress_test is not null) as st,
               min(created_at at time zone 'Asia/Kolkata') as first_at,
               max(created_at at time zone 'Asia/Kolkata') as last_at
        from public.lpu_assignments group by user_id order by n desc limit 100) t)
  ) into result;

  return result;
end;
$$;
revoke all on function public.lpu_organiser_stats() from public, anon;
grant execute on function public.lpu_organiser_stats() to authenticated;

-- ---------------------------------------------------------------------------
-- Daily limits, per person AND for the whole app, checked and recorded in one step.
-- The caller supplies the limits; a user calling this directly can only add records
-- to their own usage log, which only makes their own allowance smaller.
-- ---------------------------------------------------------------------------
create or replace function public.lpu_reserve_usage(p_kind text, p_user_limit integer, p_global_limit integer)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid := auth.uid();
  n_user integer;
  n_all integer;
begin
  if uid is null then
    return jsonb_build_object('ok', false, 'reason', 'not_signed_in');
  end if;
  if p_kind not in ('generate', 'stress_test') then
    return jsonb_build_object('ok', false, 'reason', 'bad_kind');
  end if;

  -- One reservation at a time per kind, so the shared count cannot be raced.
  perform pg_advisory_xact_lock(hashtext('lpu_usage_' || p_kind));

  select count(*) into n_user from public.lpu_usage
   where user_id = uid and kind = p_kind and created_at > now() - interval '24 hours';
  if n_user >= p_user_limit then
    return jsonb_build_object('ok', false, 'reason', 'user_limit', 'limit', p_user_limit);
  end if;

  select count(*) into n_all from public.lpu_usage
   where kind = p_kind and created_at > now() - interval '24 hours';
  if n_all >= p_global_limit then
    return jsonb_build_object('ok', false, 'reason', 'global_limit', 'limit', p_global_limit);
  end if;

  insert into public.lpu_usage (user_id, kind) values (uid, p_kind);
  return jsonb_build_object('ok', true);
end;
$$;
revoke all on function public.lpu_reserve_usage(text, integer, integer) from public, anon;
grant execute on function public.lpu_reserve_usage(text, integer, integer) to authenticated;
