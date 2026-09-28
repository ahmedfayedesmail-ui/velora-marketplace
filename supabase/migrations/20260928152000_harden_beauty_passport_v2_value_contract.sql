-- VELORA — Harden Beauty Passport V2 value contract
-- Restore-Test only; Production remains frozen.
--
-- Keep the current three-question V2 contract authoritative.
-- No new columns, questions, or parallel profile engine.
-- Direct Data API writes are constrained to the same canonical tokens
-- accepted by velora_save_beauty_passport_v2.

create or replace function public.velora_save_beauty_passport_v2(
  p_skin_type text,
  p_goal text,
  p_routine_budget text
)
returns public.beauty_profiles
language plpgsql
set search_path to 'public', 'pg_catalog'
as $function$
declare
  v_user_id uuid := (select auth.uid());
  v_skin_type text := lower(nullif(btrim(p_skin_type), ''));
  v_goal text := lower(nullif(btrim(p_goal), ''));
  v_routine_budget text := lower(nullif(btrim(p_routine_budget), ''));
  v_profile public.beauty_profiles;
begin
  if v_user_id is null then
    raise exception using errcode='42501', message='AUTH_REQUIRED';
  end if;

  if v_skin_type is null
     or v_skin_type not in ('oily','dry','combination','normal','sensitive','unknown')
  then
    raise exception using errcode='22023', message='INVALID_SKIN_TYPE';
  end if;

  if v_goal is null
     or v_goal not in ('brightening','hydration','acne','anti-aging','oil')
  then
    raise exception using errcode='22023', message='INVALID_GOAL';
  end if;

  if v_routine_budget is null
     or v_routine_budget not in ('under_500','500_1000','1000_2000','over_2000','unknown')
  then
    raise exception using errcode='22023', message='INVALID_ROUTINE_BUDGET';
  end if;

  insert into public.beauty_profiles (
    user_id, quiz_version, goal, skin_type, routine_budget, updated_at
  )
  values (
    v_user_id, 'beauty-quiz.v2', v_goal, v_skin_type, v_routine_budget, now()
  )
  on conflict (user_id) do update set
    quiz_version=excluded.quiz_version,
    goal=excluded.goal,
    skin_type=excluded.skin_type,
    routine_budget=excluded.routine_budget,
    updated_at=now()
  returning * into v_profile;

  return v_profile;
end;
$function$;

drop policy if exists beauty_profiles_self_insert on public.beauty_profiles;
create policy beauty_profiles_self_insert
on public.beauty_profiles
for insert
to authenticated
with check (
  (select auth.uid()) is not null
  and (select auth.uid())=user_id
  and quiz_version='beauty-quiz.v2'
  and skin_type in ('oily','dry','combination','normal','sensitive','unknown')
  and goal in ('brightening','hydration','acne','anti-aging','oil')
  and routine_budget in ('under_500','500_1000','1000_2000','over_2000','unknown')
);

drop policy if exists beauty_profiles_self_update on public.beauty_profiles;
create policy beauty_profiles_self_update
on public.beauty_profiles
for update
to authenticated
using (
  (select auth.uid()) is not null
  and (select auth.uid())=user_id
)
with check (
  (select auth.uid()) is not null
  and (select auth.uid())=user_id
  and quiz_version='beauty-quiz.v2'
  and skin_type in ('oily','dry','combination','normal','sensitive','unknown')
  and goal in ('brightening','hydration','acne','anti-aging','oil')
  and routine_budget in ('under_500','500_1000','1000_2000','over_2000','unknown')
);
