-- Velora — Deferred Migration: Routine Goal Match includes Product Concerns
-- Date: 2026-09-21
--
-- DO NOT APPLY while Browser Gate is LOCKED.
-- DO NOT place this file under supabase/migrations/ until the Gate opens.
-- Production remains FROZEN.
--
-- Scope:
-- Extend goal_match to consider products.concerns in addition to
-- tags / benefits / subcategory.
--
-- No schema change.
-- No commercial logic.
-- No change to the customer-facing Routine contract.
--
-- Full function replacement intentionally preserves the current Routine
-- operation and changes only the goal_match expressions.

create or replace function private.velora_beauty_routine_operation()
returns jsonb
language plpgsql
security definer
set search_path to 'public', 'private', 'extensions', 'pg_catalog'
as $function$
declare
  v_user_id uuid := (select auth.uid());
  v_profile public.beauty_profiles%rowtype;
  v_input jsonb;
  v_fingerprint text;
  v_catalog_revision text;
  v_budget_limit numeric;
  v_total numeric := 0;
  v_selected_count integer := 0;
  v_required_unavailable integer := 0;
  v_run_id uuid;
  v_selected_product_ids uuid[] := '{}';
  v_slot jsonb;
  v_step_type text;
  v_time_of_day text;
  v_is_optional boolean;
  v_step_order smallint;
  v_best record;
  v_status text;
begin
  if v_user_id is null then
    raise exception using errcode = '42501', message = 'AUTH_REQUIRED';
  end if;

  select *
    into v_profile
  from public.beauty_profiles
  where user_id = v_user_id;

  if not found
     or v_profile.quiz_version <> 'beauty-quiz.v2'
     or v_profile.skin_type is null
     or v_profile.routine_budget is null
     or nullif(btrim(v_profile.goal), '') is null
  then
    raise exception using errcode = '22023', message = 'PASSPORT_INCOMPLETE';
  end if;

  v_budget_limit := private.beauty_routine_budget_limit(v_profile.routine_budget);

  v_input := jsonb_build_object(
    'schema_version', 'beauty-passport.v2',
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
    'shopping_priority', nullif(private.beauty_routine_norm_token(v_profile.shopping_priority), '')
  );

  v_fingerprint := encode(extensions.digest(v_input::text, 'sha256'), 'hex');
  v_catalog_revision := private.beauty_catalog_revision_token();

  perform pg_advisory_xact_lock(hashtext(v_user_id::text)::bigint);

  insert into public.beauty_routine_runs (
    user_id, contract_version, ruleset_version,
    catalog_revision, input_fingerprint, status
  )
  values (
    v_user_id, 'beauty-routine.v1', 'beauty-rules.v2',
    v_catalog_revision, v_fingerprint, 'complete'
  )
  returning id into v_run_id;

  for v_slot in
    select value
    from jsonb_array_elements(
      '[
        {"step_order":1,"time_of_day":"am","step_type":"cleanse","is_optional":false},
        {"step_order":2,"time_of_day":"am","step_type":"treat","is_optional":false},
        {"step_order":3,"time_of_day":"am","step_type":"moisturize","is_optional":false},
        {"step_order":4,"time_of_day":"am","step_type":"protect","is_optional":false},
        {"step_order":5,"time_of_day":"pm","step_type":"cleanse","is_optional":true},
        {"step_order":6,"time_of_day":"pm","step_type":"treat","is_optional":true}
      ]'::jsonb
    )
  loop
    v_step_order := (v_slot->>'step_order')::smallint;
    v_time_of_day := v_slot->>'time_of_day';
    v_step_type := v_slot->>'step_type';
    v_is_optional := (v_slot->>'is_optional')::boolean;

    select
      p.id as product_id,
      pv.id as variant_id,
      coalesce(pv.price, p.price) as unit_price,
      (
        private.beauty_routine_array_has_token(p.tags, v_profile.goal)
        or private.beauty_routine_array_has_token(p.benefits, v_profile.goal)
        or private.beauty_routine_array_has_token(p.concerns, v_profile.goal)
        or private.beauty_routine_norm_token(p.subcategory)
           = private.beauty_routine_norm_token(v_profile.goal)
      ) as goal_match,
      (
        private.beauty_routine_array_has_token(p.concerns, v_profile.concern)
        or private.beauty_routine_array_has_token(p.benefits, v_profile.concern)
        or private.beauty_routine_array_has_token(p.tags, v_profile.concern)
      ) as concern_match,
      (
        private.beauty_routine_norm_token(v_profile.skin_type) <> 'unknown'
        and private.beauty_routine_array_has_token(p.skin_types, v_profile.skin_type)
      ) as skin_type_match,
      array_remove(array[
        case
          when private.beauty_routine_array_has_token(p.tags, v_profile.goal)
            or private.beauty_routine_array_has_token(p.benefits, v_profile.goal)
            or private.beauty_routine_array_has_token(p.concerns, v_profile.goal)
            or private.beauty_routine_norm_token(p.subcategory)
               = private.beauty_routine_norm_token(v_profile.goal)
          then 'goal_match'::text end,
        case
          when private.beauty_routine_array_has_token(p.concerns, v_profile.concern)
            or private.beauty_routine_array_has_token(p.benefits, v_profile.concern)
            or private.beauty_routine_array_has_token(p.tags, v_profile.concern)
          then 'concern_match'::text end,
        case
          when private.beauty_routine_norm_token(v_profile.skin_type) <> 'unknown'
            and private.beauty_routine_array_has_token(p.skin_types, v_profile.skin_type)
          then 'skin_type_match'::text end,
        'step_match'::text,
        'availability_match'::text,
        'budget_fit'::text
      ], null::text) as reason_codes
    into v_best
    from public.products p
    left join lateral (
      select pv.id, pv.price
      from public.product_variants pv
      where pv.product_id = p.id
        and pv.is_active = true
        and pv.stock_quantity > 0
      order by pv.price nulls last, pv.id
      limit 1
    ) pv on true
    where p.status = 'approved'
      and p.currency_code = 'EGP'
      and private.beauty_routine_norm_token(p.category) = 'beauty'
      and (coalesce(p.stock, 0) > 0 or pv.id is not null)
      and private.beauty_routine_step_match(
        v_step_type, p.category, p.subcategory, p.tags, p.benefits
      )
      and coalesce(pv.price, p.price) + v_total <= v_budget_limit
      and not exists (
        select 1
        from jsonb_array_elements_text(
          coalesce(v_profile.avoidance_preferences->'ingredients','[]'::jsonb)
        ) a(value)
        where private.beauty_routine_array_has_token(p.ingredients, a.value)
      )
      and not exists (
        select 1
        from jsonb_array_elements_text(
          coalesce(v_profile.avoidance_preferences->'tags','[]'::jsonb)
        ) a(value)
        where private.beauty_routine_array_has_token(p.tags, a.value)
      )
      and not (p.id = any(v_selected_product_ids))
    order by
      goal_match desc,
      concern_match desc,
      skin_type_match desc,
      unit_price asc,
      p.id asc,
      pv.id asc;

    if found then
      v_selected_count := v_selected_count + 1;
      v_total := v_total + v_best.unit_price;
      v_selected_product_ids := array_append(v_selected_product_ids, v_best.product_id);

      insert into public.beauty_routine_steps (
        routine_run_id, step_order, time_of_day, step_type, is_optional,
        selection_status, product_id, product_variant_id, reason_codes
      )
      values (
        v_run_id, v_step_order, v_time_of_day, v_step_type, v_is_optional,
        'selected', v_best.product_id, v_best.variant_id, v_best.reason_codes
      );
    elsif not v_is_optional then
      v_required_unavailable := v_required_unavailable + 1;

      insert into public.beauty_routine_steps (
        routine_run_id, step_order, time_of_day, step_type, is_optional,
        selection_status, product_id, product_variant_id, reason_codes
      )
      values (
        v_run_id, v_step_order, v_time_of_day, v_step_type, v_is_optional,
        'unavailable', null, null, '{}'
      );
    end if;
  end loop;

  if v_selected_count = 0 then
    delete from public.beauty_routine_runs where id = v_run_id;

    return jsonb_build_object(
      'contract_version', 'beauty-routine.v1',
      'status', 'no_matches',
      'steps', '[]'::jsonb,
      'total_cost', 0,
      'currency', 'EGP'
    );
  end if;

  v_status := case
    when v_required_unavailable > 0 then 'partial'
    else 'complete'
  end;

  update public.beauty_routine_runs
  set status = v_status
  where id = v_run_id;

  return private.beauty_build_routine_response(v_run_id);

exception
  when others then
    if v_run_id is not null then
      delete from public.beauty_routine_runs where id = v_run_id;
    end if;
    raise;
end;
$function$;

-- Post-apply verification:
-- A concern-only product with concerns=['acne'] and no acne tag/benefit/subcategory
-- must receive goal_match when the customer goal is 'acne'.
-- Existing tag/benefit/subcategory matching remains unchanged.
-- Existing ACL/search_path/security behavior remains unchanged.
