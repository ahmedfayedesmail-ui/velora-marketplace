-- Velora — Phase C Quiz v2 Passport Save RPC
-- Restore-Test implementation. Production remains frozen.

alter table public.beauty_profiles
  alter column concern drop not null;

alter table public.beauty_profiles
  add constraint beauty_profiles_v2_skin_type_required
  check (
    quiz_version <> 'beauty-quiz.v2'
    or skin_type is not null
  );

alter table public.beauty_profiles
  add constraint beauty_profiles_v2_routine_budget_required
  check (
    quiz_version <> 'beauty-quiz.v2'
    or routine_budget is not null
  );

create or replace function public.velora_save_beauty_passport_v2(
  p_skin_type text,
  p_goal text,
  p_routine_budget text
)
returns public.beauty_profiles
language plpgsql
security invoker
set search_path = public, pg_catalog
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
     or v_skin_type not in ('oily', 'dry', 'combination', 'normal', 'unknown')
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
     or v_routine_budget not in ('under_500', '500_1000', '1000_2000', 'over_2000', 'unknown')
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

revoke execute on function public.velora_save_beauty_passport_v2(text, text, text) from public;
revoke execute on function public.velora_save_beauty_passport_v2(text, text, text) from anon;
grant execute on function public.velora_save_beauty_passport_v2(text, text, text) to authenticated;
