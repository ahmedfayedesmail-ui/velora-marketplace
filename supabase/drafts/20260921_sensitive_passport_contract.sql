-- Velora — Deferred Migration: Sensitive Skin Passport Support
-- Date: 2026-09-21
--
-- DO NOT APPLY while Browser Gate is LOCKED.
-- DO NOT place this file under supabase/migrations/ until the Gate opens.
-- Production remains FROZEN.
--
-- Purpose:
-- Add "sensitive" to the accepted v2 Beauty Passport skin_type contract.
--
-- Current failure:
-- velora_save_beauty_passport_v2("sensitive", ...) -> INVALID_SKIN_TYPE
--
-- Design:
-- Keep skin_type as text. Do not coerce sensitive to normal/unknown.
-- Preserve existing auth.uid() ownership and server timestamp behavior.

create or replace function public.velora_save_beauty_passport_v2(
  p_skin_type text,
  p_goal text,
  p_routine_budget text
)
returns public.beauty_profiles
language plpgsql
set search_path = 'public', 'pg_catalog'
as $function$
declare
  v_user_id uuid := (select auth.uid());
  v_skin_type text := lower(nullif(btrim(p_skin_type), ''));
  v_goal text := lower(nullif(btrim(p_goal), ''));
  v_routine_budget text := lower(nullif(btrim(p_routine_budget), ''));
  v_profile public.beauty_profiles;
begin
  if v_user_id is null then
    raise exception using
      errcode = '42501',
      message = 'AUTH_REQUIRED';
  end if;

  if v_skin_type is null
     or v_skin_type not in (
       'oily',
       'dry',
       'combination',
       'normal',
       'sensitive',
       'unknown'
     )
  then
    raise exception using
      errcode = '22023',
      message = 'INVALID_SKIN_TYPE';
  end if;

  if v_goal is null or length(v_goal) > 100 then
    raise exception using
      errcode = '22023',
      message = 'PASSPORT_INCOMPLETE';
  end if;

  if v_routine_budget is null
     or v_routine_budget not in (
       'under_500',
       '500_1000',
       '1000_2000',
       'over_2000',
       'unknown'
     )
  then
    raise exception using
      errcode = '22023',
      message = 'INVALID_ROUTINE_BUDGET';
  end if;

  insert into public.beauty_profiles (
    user_id,
    quiz_version,
    goal,
    skin_type,
    routine_budget,
    updated_at
  )
  values (
    v_user_id,
    'beauty-quiz.v2',
    v_goal,
    v_skin_type,
    v_routine_budget,
    now()
  )
  on conflict (user_id) do update set
    quiz_version = excluded.quiz_version,
    goal = excluded.goal,
    skin_type = excluded.skin_type,
    routine_budget = excluded.routine_budget,
    updated_at = now()
  returning * into v_profile;

  return v_profile;
end;
$function$;

-- Verification checklist (run only after applying to Restore-Test):
-- 1. authenticated call with sensitive succeeds.
-- 2. returned beauty_profiles.skin_type = 'sensitive'.
-- 3. table check constraint accepts 'sensitive'.
-- 4. anonymous call still returns AUTH_REQUIRED.
-- 5. invalid skin_type still returns INVALID_SKIN_TYPE.
-- 6. existing v2 valid values still pass.
-- 7. Production remains untouched.
