create or replace function public.velora_get_current_beauty_routine()
returns jsonb
language plpgsql
security definer
set search_path to 'public','private','extensions','pg_catalog'
as $function$
declare
  v_uid uuid := (select auth.uid());
  v_run public.beauty_routine_runs%rowtype;
  v_profile public.beauty_profiles%rowtype;
  v_feedback_revision text;
  v_purchase_revision text;
  v_context jsonb;
  v_input jsonb;
  v_expected_fingerprint text;
  v_catalog_revision text;
  v_stale boolean := false;
  v_response jsonb;
begin
  if v_uid is null then
    raise exception using errcode = '42501', message = 'AUTH_REQUIRED';
  end if;

  select * into v_profile
  from public.beauty_profiles
  where user_id = v_uid;

  if not found
     or v_profile.quiz_version <> 'beauty-quiz.v2'
     or v_profile.skin_type is null
     or v_profile.routine_budget is null
     or nullif(btrim(v_profile.goal), '') is null
  then
    return jsonb_build_object(
      'ok', true,
      'status', 'passport_incomplete',
      'routine', null,
      'routines', '[]'::jsonb,
      'steps', '[]'::jsonb,
      'context', null,
      'refreshed', false
    );
  end if;

  select coalesce(to_char(max(bf.created_at), 'YYYYMMDDHH24MISSMSOF'), 'none')
    into v_feedback_revision
  from public.beauty_feedback bf
  where bf.user_id = v_uid
    and bf.moderation_status = 'approved';

  select coalesce(to_char(max(o.updated_at), 'YYYYMMDDHH24MISSMSOF'), 'none')
    into v_purchase_revision
  from public.orders o
  where o.customer_id = v_uid;

  v_context := private.velora_beauty_context();

  v_input := jsonb_build_object(
    'schema_version', 'beauty-passport.v2',
    'context_version', 'beauty-context.v1',
    'quiz_version', private.beauty_routine_norm_token(v_profile.quiz_version),
    'market_scope', 'EG',
    'currency_code', 'EGP',
    'skin_type', private.beauty_routine_norm_token(v_profile.skin_type),
    'goal', private.beauty_routine_norm_token(v_profile.goal),
    'concern', private.beauty_routine_norm_token(v_profile.concern),
    'routine_budget', private.beauty_routine_norm_token(v_profile.routine_budget),
    'texture_preference', nullif(private.beauty_routine_norm_token(v_profile.texture_preference), ''),
    'effect_preference', nullif(private.beauty_routine_norm_token(v_profile.effect_preference), ''),
    'avoidance_preferences', coalesce(v_profile.avoidance_preferences, '{}'::jsonb),
    'shopping_priority', nullif(private.beauty_routine_norm_token(v_profile.shopping_priority), ''),
    'approved_feedback_revision', v_feedback_revision,
    'purchase_revision', v_purchase_revision,
    'context', v_context
  );

  v_expected_fingerprint := encode(extensions.digest(v_input::text, 'sha256'), 'hex');
  v_catalog_revision := private.beauty_catalog_revision_token();

  select * into v_run
  from public.beauty_routine_runs
  where user_id = v_uid
  order by created_at desc
  limit 1;

  if not found
     or v_run.input_fingerprint <> v_expected_fingerprint
     or v_run.catalog_revision <> v_catalog_revision
     or v_run.ruleset_version <> 'beauty-rules.v4'
  then
    v_stale := true;
    v_response := private.velora_beauty_routine_operation();
  else
    v_response := private.beauty_build_routine_response(v_run.id);
  end if;

  select * into v_run
  from public.beauty_routine_runs
  where user_id = v_uid
  order by created_at desc
  limit 1;

  return jsonb_build_object(
    'ok', true,
    'status', coalesce(v_run.status, 'no_routine'),
    'routine', case when v_run.id is null then null else to_jsonb(v_run) end,
    'context', v_context,
    'refreshed', v_stale,
    'routine_response', v_response
  );
end;
$function$;
