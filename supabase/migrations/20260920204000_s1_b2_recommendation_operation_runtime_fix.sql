-- B2 correction: ordered-set percentile_cont must be computed as a grouped aggregate.
create or replace function private.velora_beauty_recommendation_operation()
returns jsonb
language plpgsql
security definer
set search_path = public, private, pg_catalog
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_profile public.beauty_profiles;
  v_input jsonb;
  v_avoidance jsonb;
  v_fingerprint text;
  v_catalog_revision text;
  v_ruleset_version text := 'beauty-rules.v1';
  v_cached_run_id uuid;
  v_rate_count integer;
  v_candidates jsonb;
  v_run_id uuid;
  v_item_count integer;
begin
  if v_user_id is null then
    raise exception using errcode = '42501', message = 'AUTH_REQUIRED';
  end if;

  select *
  into v_profile
  from public.beauty_profiles
  where user_id = v_user_id;

  if not found
     or v_profile.quiz_version <> 'beauty-quiz.v1'
     or nullif(btrim(v_profile.goal), '') is null
     or nullif(btrim(v_profile.concern), '') is null
  then
    return jsonb_build_object(
      'contract_version', 'beauty-recommendation.v1',
      'status', 'incomplete',
      'run', null,
      'recommendations', '[]'::jsonb,
      'next_action', 'complete_passport'
    );
  end if;

  v_avoidance := coalesce(v_profile.avoidance_preferences, '{}'::jsonb);

  v_input := jsonb_build_object(
    'schema_version', 'beauty-passport.v1',
    'quiz_version', private.beauty_norm_text(v_profile.quiz_version),
    'market_scope', 'EG',
    'currency_code', 'EGP',
    'goal', private.beauty_norm_text(v_profile.goal),
    'concern', private.beauty_norm_text(v_profile.concern),
    'texture_preference', nullif(private.beauty_norm_text(v_profile.texture_preference), ''),
    'effect_preference', nullif(private.beauty_norm_text(v_profile.effect_preference), ''),
    'avoidance_preferences', jsonb_build_object(
      'ingredients',
      coalesce(
        (
          select jsonb_agg(x.value order by private.beauty_norm_text(x.value))
          from jsonb_array_elements_text(coalesce(v_avoidance->'ingredients','[]'::jsonb)) x(value)
        ),
        '[]'::jsonb
      ),
      'tags',
      coalesce(
        (
          select jsonb_agg(x.value order by private.beauty_norm_text(x.value))
          from jsonb_array_elements_text(coalesce(v_avoidance->'tags','[]'::jsonb)) x(value)
        ),
        '[]'::jsonb
      )
    ),
    'shopping_priority', nullif(private.beauty_norm_text(v_profile.shopping_priority), '')
  );

  v_fingerprint := encode(extensions.digest(v_input::text, 'sha256'), 'hex');

  perform pg_advisory_xact_lock(hashtext(v_user_id::text)::bigint);

  v_catalog_revision := private.beauty_catalog_revision_token();

  select r.id
  into v_cached_run_id
  from public.beauty_recommendation_runs r
  where r.user_id = v_user_id
    and r.input_fingerprint = v_fingerprint
    and r.ruleset_version = v_ruleset_version
    and r.catalog_revision = v_catalog_revision
    and r.created_at >= now() - interval '24 hours'
  order by r.created_at desc
  limit 1;

  if v_cached_run_id is not null then
    return private.beauty_build_run_response(v_cached_run_id, true);
  end if;

  delete from private.beauty_recommendation_rate_events
  where user_id = v_user_id
    and created_at < now() - interval '10 minutes';

  select count(*)
  into v_rate_count
  from private.beauty_recommendation_rate_events
  where user_id = v_user_id
    and created_at >= now() - interval '10 minutes';

  if v_rate_count >= 5 then
    return jsonb_build_object(
      'contract_version', 'beauty-recommendation.v1',
      'status', 'rate_limited',
      'run', null,
      'recommendations', '[]'::jsonb,
      'next_action', 'retry_later'
    );
  end if;

  insert into private.beauty_recommendation_rate_events(user_id)
  values (v_user_id);

  with eligible as (
    select
      p.id,
      p.name,
      p.brand,
      p.price,
      p.currency_code,
      p.images,
      p.category,
      p.subcategory,
      p.stock,
      p.skin_types,
      p.concerns,
      p.tags,
      p.benefits,
      p.ingredients,
      v.id as variant_id,
      v.name as variant_name,
      v.price as variant_price,
      v.attributes as variant_attributes,
      coalesce(v.price, p.price) as unit_price,
      bp.goal,
      bp.concern,
      bp.texture_preference,
      bp.effect_preference,
      bp.shopping_priority,
      bp.avoidance_preferences
    from public.products p
    cross join lateral (
      select
        bp.goal,
        bp.concern,
        bp.texture_preference,
        bp.effect_preference,
        bp.shopping_priority,
        bp.avoidance_preferences
      from public.beauty_profiles bp
      where bp.user_id = v_user_id
      limit 1
    ) bp
    left join lateral (
      select pv.id, pv.name, pv.price, pv.attributes
      from public.product_variants pv
      where pv.product_id = p.id
        and pv.is_active
        and pv.stock_quantity > 0
      order by pv.price nulls last, pv.id
      limit 1
    ) v on true
    where p.status = 'approved'
      and p.currency_code = 'EGP'
      and private.beauty_norm_text(p.category) = 'beauty'
      and (coalesce(p.stock, 0) > 0 or v.id is not null)
      and not exists (
        select 1
        from jsonb_array_elements_text(coalesce(bp.avoidance_preferences->'ingredients','[]'::jsonb)) a(value)
        where private.beauty_match_array(a.value, p.ingredients)
      )
      and not exists (
        select 1
        from jsonb_array_elements_text(coalesce(bp.avoidance_preferences->'tags','[]'::jsonb)) a(value)
        where private.beauty_match_array(a.value, p.tags)
      )
  ),
  median_cte as (
    select percentile_cont(0.5) within group (order by unit_price) as median_price
    from eligible
  ),
  priced as (
    select e.*, m.median_price
    from eligible e
    cross join median_cte m
  ),
  scored as (
    select
      priced.*,
      (
        case when private.beauty_match_array(goal, tags)
                   or private.beauty_match_array(goal, benefits)
             then 30 else 0 end
        +
        case when private.beauty_match_scalar(goal, category)
                   or private.beauty_match_scalar(goal, subcategory)
             then 10 else 0 end
        +
        case when private.beauty_match_array(concern, concerns)
             then 20 else 0 end
        +
        case when private.beauty_match_array(concern, benefits)
                   or private.beauty_match_array(concern, tags)
             then 5 else 0 end
        +
        case when private.beauty_match_object(texture_preference, variant_attributes)
             then 8 else 0 end
        +
        case when private.beauty_match_array(texture_preference, tags)
                   or private.beauty_match_scalar(texture_preference, subcategory)
             then 7 else 0 end
        +
        case when private.beauty_match_object(effect_preference, variant_attributes)
             then 7 else 0 end
        +
        case when private.beauty_match_array(effect_preference, benefits)
                   or private.beauty_match_array(effect_preference, tags)
             then 3 else 0 end
        +
        case
          when shopping_priority = 'value' and unit_price <= median_price then 5
          when shopping_priority = 'premium' and unit_price >= median_price then 5
          when shopping_priority = 'balanced'
               and unit_price between median_price * 0.75 and median_price * 1.25 then 5
          else 0
        end
        + 5
      )::numeric(8,3) as score,
      array_remove(array[
        case when private.beauty_match_array(goal, tags)
                   or private.beauty_match_array(goal, benefits)
                   or private.beauty_match_scalar(goal, category)
                   or private.beauty_match_scalar(goal, subcategory)
             then 'goal_match'::text end,
        case when private.beauty_match_array(concern, concerns)
                   or private.beauty_match_array(concern, benefits)
                   or private.beauty_match_array(concern, tags)
             then 'concern_match'::text end,
        case when private.beauty_match_object(texture_preference, variant_attributes)
                   or private.beauty_match_array(texture_preference, tags)
                   or private.beauty_match_scalar(texture_preference, subcategory)
             then 'texture_match'::text end,
        case when private.beauty_match_object(effect_preference, variant_attributes)
                   or private.beauty_match_array(effect_preference, benefits)
                   or private.beauty_match_array(effect_preference, tags)
             then 'effect_match'::text end,
        case when shopping_priority in ('value','premium','balanced')
             then 'preference_match'::text end,
        'availability_match'::text
      ], null::text) as reason_codes
    from priced
  ),
  best_per_product as (
    select *,
      row_number() over (
        partition by id
        order by score desc, variant_id nulls last, variant_id
      ) as product_rank
    from scored
  ),
  top_results as (
    select *
    from best_per_product
    where product_rank = 1
    order by score desc, id
    limit 5
  ),
  numbered_results as (
    select *,
      row_number() over (order by score desc, id) as result_position
    from top_results
  )
  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'product_id', id,
        'product_variant_id', variant_id,
        'position', result_position,
        'score', score,
        'reason_codes', reason_codes
      )
      order by score desc, id
    ),
    '[]'::jsonb
  )
  into v_candidates
  from numbered_results;

  if jsonb_array_length(v_candidates) = 0 then
    return jsonb_build_object(
      'contract_version', 'beauty-recommendation.v1',
      'status', 'no_matches',
      'run', null,
      'recommendations', '[]'::jsonb,
      'next_action', 'none'
    );
  end if;

  insert into public.beauty_recommendation_runs (
    user_id,
    ruleset_version,
    catalog_revision,
    input_snapshot,
    input_fingerprint
  )
  values (
    v_user_id,
    v_ruleset_version,
    v_catalog_revision,
    v_input,
    v_fingerprint
  )
  returning id into v_run_id;

  insert into public.beauty_recommendation_items (
    run_id,
    product_id,
    product_variant_id,
    position,
    score,
    reason_codes
  )
  select
    v_run_id,
    x.product_id,
    x.product_variant_id,
    x.position::smallint,
    x.score::numeric(8,3),
    x.reason_codes
  from jsonb_to_recordset(v_candidates) as x(
    product_id uuid,
    product_variant_id uuid,
    position integer,
    score numeric,
    reason_codes text[]
  );

  get diagnostics v_item_count = row_count;

  if v_item_count = 0 then
    delete from public.beauty_recommendation_runs
    where id = v_run_id;

    return jsonb_build_object(
      'contract_version', 'beauty-recommendation.v1',
      'status', 'no_matches',
      'run', null,
      'recommendations', '[]'::jsonb,
      'next_action', 'none'
    );
  end if;

  return private.beauty_build_run_response(v_run_id, false);
end;
$$;
