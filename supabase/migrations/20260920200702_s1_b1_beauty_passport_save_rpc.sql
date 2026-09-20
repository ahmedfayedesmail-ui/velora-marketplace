-- Velora Sprint 1 / B1
-- Beauty Passport persistence save operation
-- Restore-Test/local implementation artifact.
-- Production remains FROZEN.

create or replace function public.velora_save_beauty_profile(
  p_quiz_version text,
  p_goal text,
  p_concern text,
  p_texture_preference text default null,
  p_effect_preference text default null,
  p_avoidance_preferences jsonb default '{}'::jsonb,
  p_shopping_priority text default null
)
returns public.beauty_profiles
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_goal text := nullif(btrim(p_goal), '');
  v_concern text := nullif(btrim(p_concern), '');
  v_texture text := nullif(btrim(p_texture_preference), '');
  v_effect text := nullif(btrim(p_effect_preference), '');
  v_priority text := nullif(btrim(p_shopping_priority), '');
  v_quiz_version text := nullif(btrim(p_quiz_version), '');
  v_avoidance jsonb := coalesce(p_avoidance_preferences, '{}'::jsonb);
  v_key text;
  v_profile public.beauty_profiles;
begin
  if v_user_id is null then
    raise exception using errcode = '42501', message = 'AUTH_REQUIRED';
  end if;

  if v_quiz_version is null or v_quiz_version <> 'beauty-quiz.v1' then
    raise exception using errcode = '22023', message = 'UNSUPPORTED_QUIZ_VERSION';
  end if;

  if v_goal is null or v_concern is null then
    raise exception using errcode = '22023', message = 'PASSPORT_INCOMPLETE';
  end if;

  if jsonb_typeof(v_avoidance) <> 'object' then
    raise exception using errcode = '22023', message = 'INVALID_AVOIDANCE_PREFERENCES';
  end if;

  for v_key in select jsonb_object_keys(v_avoidance)
  loop
    if v_key not in ('ingredients','tags') then
      raise exception using errcode = '22023', message = 'INVALID_AVOIDANCE_PREFERENCES';
    end if;

    if jsonb_typeof(v_avoidance -> v_key) <> 'array'
       or exists (
         select 1
         from jsonb_array_elements(v_avoidance -> v_key) e
         where jsonb_typeof(e) <> 'string'
       )
    then
      raise exception using errcode = '22023', message = 'INVALID_AVOIDANCE_PREFERENCES';
    end if;
  end loop;

  insert into public.beauty_profiles (
    user_id,
    quiz_version,
    goal,
    concern,
    texture_preference,
    effect_preference,
    avoidance_preferences,
    shopping_priority,
    updated_at
  )
  values (
    v_user_id,
    v_quiz_version,
    v_goal,
    v_concern,
    v_texture,
    v_effect,
    v_avoidance,
    v_priority,
    now()
  )
  on conflict (user_id) do update set
    quiz_version = excluded.quiz_version,
    goal = excluded.goal,
    concern = excluded.concern,
    texture_preference = excluded.texture_preference,
    effect_preference = excluded.effect_preference,
    avoidance_preferences = excluded.avoidance_preferences,
    shopping_priority = excluded.shopping_priority,
    updated_at = now()
  returning * into v_profile;

  return v_profile;
end;
$$;

revoke all on function public.velora_save_beauty_profile(text,text,text,text,text,jsonb,text) from public;
revoke execute on function public.velora_save_beauty_profile(text,text,text,text,text,jsonb,text) from anon;
grant execute on function public.velora_save_beauty_profile(text,text,text,text,text,jsonb,text) to authenticated;
