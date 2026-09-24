-- Velora S1-D Layers 2-4 foundation:
-- customer memory, automatic current-routine refresh, replenishment signals.
-- Restore-Test / staging only. Production remains frozen.

create or replace function private.velora_beauty_memory()
returns jsonb
language plpgsql
security definer
set search_path to 'public','private','extensions','pg_catalog'
as $function$
declare
  v_uid uuid := (select auth.uid());
  v_profile jsonb;
  v_orders jsonb;
  v_feedback jsonb;
begin
  if v_uid is null then
    raise exception using errcode = '42501', message = 'AUTH_REQUIRED';
  end if;

  select coalesce(to_jsonb(bp), '{}'::jsonb)
    into v_profile
  from public.beauty_profiles bp
  where bp.user_id = v_uid;

  select jsonb_build_object(
    'order_count', count(*),
    'last_order_at', max(created_at),
    'last_order_number', (array_agg(order_number order by created_at desc))[1],
    'recent_products', coalesce((
      select jsonb_agg(x.obj order by x.purchased_at desc)
      from (
        select jsonb_build_object(
          'product_id', oi.product_id,
          'product_name', oi.product_name,
          'quantity', oi.quantity,
          'purchased_at', o.created_at,
          'order_number', o.order_number
        ) as obj,
        o.created_at as purchased_at
        from public.orders o
        join public.order_items oi on oi.order_id = o.id
        where o.customer_id = v_uid
        order by o.created_at desc
        limit 12
      ) x
    ), '[]'::jsonb)
  )
  into v_orders
  from public.orders
  where customer_id = v_uid;

  select jsonb_build_object(
    'feedback_count', count(*),
    'positive_count', count(*) filter (where moderation_status='approved' and rating >= 4 and effect='helpful'),
    'negative_count', count(*) filter (where moderation_status='approved' and (rating <= 2 or effect in ('not_helpful','irritating'))),
    'pending_count', count(*) filter (where moderation_status='pending'),
    'latest_feedback_at', max(created_at) filter (where moderation_status='approved')
  )
  into v_feedback
  from public.beauty_feedback
  where user_id = v_uid;

  return jsonb_build_object(
    'profile', v_profile,
    'orders', v_orders,
    'feedback', v_feedback
  );
end;
$function$;

create or replace function public.velora_get_beauty_memory()
returns jsonb
language plpgsql
security invoker
set search_path to 'public','private','extensions','pg_catalog'
as $function$
begin
  return private.velora_beauty_memory();
end;
$function$;

revoke all on function public.velora_get_beauty_memory() from public;
grant execute on function public.velora_get_beauty_memory() to authenticated;

do $patch$
declare
  v_def text;
begin
  select pg_get_functiondef(p.oid)
    into v_def
  from pg_proc p
  join pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'private'
    and p.proname = 'velora_beauty_routine_operation'
    and p.pronargs = 0
  limit 1;

  if v_def is null then
    raise exception 'ROUTINE_OPERATION_NOT_FOUND';
  end if;

  if position('v_purchase_revision text;' in v_def) = 0 then
    v_def := replace(
      v_def,
      '  v_feedback_revision text;
  v_context jsonb;',
      '  v_feedback_revision text;
  v_purchase_revision text;
  v_context jsonb;'
    );
  end if;

  if position('select coalesce(to_char(max(o.updated_at)' in v_def) = 0 then
    v_def := replace(
      v_def,
      '  v_context := private.velora_beauty_context();',
      '  select coalesce(to_char(max(o.updated_at), ''YYYYMMDDHH24MISSMSOF''), ''none'')
    into v_purchase_revision
  from public.orders o
  where o.customer_id = v_user_id;

  v_context := private.velora_beauty_context();'
    );
  end if;

  v_def := replace(
    v_def,
    '    ''approved_feedback_revision'', v_feedback_revision,
    ''context'', v_context',
    '    ''approved_feedback_revision'', v_feedback_revision,
    ''purchase_revision'', v_purchase_revision,
    ''context'', v_context'
  );

  execute v_def;
end
$patch$;

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
    v_response := private.velora_build_routine_response(v_run.id);
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

revoke all on function public.velora_get_current_beauty_routine() from public;
grant execute on function public.velora_get_current_beauty_routine() to authenticated;

create or replace function public.velora_get_replenishment_signals()
returns jsonb
language plpgsql
security definer
set search_path to 'public','private','pg_catalog'
as $function$
declare
  v_uid uuid := (select auth.uid());
begin
  if v_uid is null then
    raise exception using errcode = '42501', message = 'AUTH_REQUIRED';
  end if;

  return jsonb_build_object(
    'ok', true,
    'signals', coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'product_id', q.product_id,
          'product_name', q.product_name,
          'last_purchased_at', q.last_purchased_at,
          'quantity', q.quantity,
          'expected_interval_days', q.interval_days,
          'next_replenishment_at', q.next_replenishment_at,
          'days_until_due', q.days_until_due,
          'status', q.signal_status
        )
        order by
          case q.signal_status when 'due' then 1 when 'upcoming' then 2 else 3 end,
          q.next_replenishment_at
      )
      from (
        select distinct on (oi.product_id)
          oi.product_id,
          oi.product_name,
          o.created_at as last_purchased_at,
          greatest(coalesce(oi.quantity,1),1) as quantity,
          case
            when lower(coalesce(p.subcategory,'')) = 'cleanser' then 60
            when lower(coalesce(p.subcategory,'')) in ('moisturizer','cream') then 60
            when lower(coalesce(p.subcategory,'')) in ('sunscreen','spf') then 45
            when lower(coalesce(p.subcategory,'')) in ('serum','anti_aging','treatment') then 90
            else 60
          end as interval_days,
          o.created_at +
            (
              case
                when lower(coalesce(p.subcategory,'')) = 'cleanser' then 60
                when lower(coalesce(p.subcategory,'')) in ('moisturizer','cream') then 60
                when lower(coalesce(p.subcategory,'')) in ('sunscreen','spf') then 45
                when lower(coalesce(p.subcategory,'')) in ('serum','anti_aging','treatment') then 90
                else 60
              end
              * greatest(coalesce(oi.quantity,1),1)
            ) * interval '1 day' as next_replenishment_at,
          extract(epoch from (
            (
              o.created_at +
              (
                case
                  when lower(coalesce(p.subcategory,'')) = 'cleanser' then 60
                  when lower(coalesce(p.subcategory,'')) in ('moisturizer','cream') then 60
                  when lower(coalesce(p.subcategory,'')) in ('sunscreen','spf') then 45
                  when lower(coalesce(p.subcategory,'')) in ('serum','anti_aging','treatment') then 90
                  else 60
                end
                * greatest(coalesce(oi.quantity,1),1)
              ) * interval '1 day'
            ) - now()
          )) / 86400 as days_until_due,
          case
            when now() >= (
              o.created_at +
              (
                case
                  when lower(coalesce(p.subcategory,'')) = 'cleanser' then 60
                  when lower(coalesce(p.subcategory,'')) in ('moisturizer','cream') then 60
                  when lower(coalesce(p.subcategory,'')) in ('sunscreen','spf') then 45
                  when lower(coalesce(p.subcategory,'')) in ('serum','anti_aging','treatment') then 90
                  else 60
                end
                * greatest(coalesce(oi.quantity,1),1)
              ) * interval '1 day'
            ) then 'due'
            when now() >= (
              o.created_at +
              (
                (
                  case
                    when lower(coalesce(p.subcategory,'')) = 'cleanser' then 60
                    when lower(coalesce(p.subcategory,'')) in ('moisturizer','cream') then 60
                    when lower(coalesce(p.subcategory,'')) in ('sunscreen','spf') then 45
                    when lower(coalesce(p.subcategory,'')) in ('serum','anti_aging','treatment') then 90
                    else 60
                  end
                  * greatest(coalesce(oi.quantity,1),1)
                ) * 0.75
              ) * interval '1 day'
            ) then 'upcoming'
            else 'not_due'
          end as signal_status
        from public.order_items oi
        join public.orders o on o.id = oi.order_id
        left join public.products p on p.id = oi.product_id
        where o.customer_id = v_uid
          and lower(o.status::text) in ('delivered','completed')
        order by oi.product_id, o.created_at desc
      ) q
    ), '[]'::jsonb)
  );
end;
$function$;

revoke all on function public.velora_get_replenishment_signals() from public;
grant execute on function public.velora_get_replenishment_signals() to authenticated;

