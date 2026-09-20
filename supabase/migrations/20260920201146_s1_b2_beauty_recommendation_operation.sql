-- Velora Sprint 1 / B2
-- Canonical Beauty Recommendation Operation
-- Restore-Test/local implementation artifact.
-- Production remains FROZEN.

create schema if not exists private;

create table if not exists private.beauty_catalog_revision (
  scope text primary key,
  revision bigint not null check (revision >= 1),
  updated_at timestamptz not null default now()
);

insert into private.beauty_catalog_revision(scope, revision)
values ('EG-EGP', 1)
on conflict (scope) do nothing;

create table if not exists private.beauty_recommendation_rate_events (
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now()
);

create index if not exists beauty_recommendation_rate_events_user_created_idx
  on private.beauty_recommendation_rate_events(user_id, created_at desc);

alter table private.beauty_catalog_revision enable row level security;
alter table private.beauty_recommendation_rate_events enable row level security;

create or replace function private.beauty_norm_text(p_value text)
returns text
language sql
immutable
as $$
  select lower(trim(coalesce(p_value, '')));
$$;

create or replace function private.beauty_match_array(p_needle text, p_values jsonb)
returns boolean
language sql
immutable
as $$
  select p_needle is not null
     and private.beauty_norm_text(p_needle) <> ''
     and exists (
       select 1
       from jsonb_array_elements_text(coalesce(p_values, '[]'::jsonb)) e(value)
       where private.beauty_norm_text(e.value) = private.beauty_norm_text(p_needle)
     );
$$;

create or replace function private.beauty_match_scalar(p_needle text, p_value text)
returns boolean
language sql
immutable
as $$
  select p_needle is not null
     and private.beauty_norm_text(p_needle) <> ''
     and private.beauty_norm_text(p_value) = private.beauty_norm_text(p_needle);
$$;

create or replace function private.beauty_match_object(p_needle text, p_object jsonb)
returns boolean
language sql
immutable
as $$
  select p_needle is not null
     and private.beauty_norm_text(p_needle) <> ''
     and exists (
       select 1
       from jsonb_each_text(coalesce(p_object, '{}'::jsonb)) e(key, value)
       where private.beauty_norm_text(e.value) = private.beauty_norm_text(p_needle)
     );
$$;

create or replace function private.beauty_catalog_revision_bump()
returns void
language plpgsql
security definer
set search_path = private, pg_catalog
as $$
begin
  update private.beauty_catalog_revision
  set revision = revision + 1,
      updated_at = now()
  where scope = 'EG-EGP';

  if not found then
    insert into private.beauty_catalog_revision(scope, revision, updated_at)
    values ('EG-EGP', 1, now());
  end if;
end;
$$;

create or replace function private.beauty_products_catalog_revision_trigger()
returns trigger
language plpgsql
security definer
set search_path = public, private, pg_catalog
as $$
begin
  if TG_OP in ('INSERT', 'DELETE') then
    perform private.beauty_catalog_revision_bump();
  elsif
    OLD.status is distinct from NEW.status
    or OLD.price is distinct from NEW.price
    or OLD.original_price is distinct from NEW.original_price
    or OLD.stock is distinct from NEW.stock
    or OLD.currency_code is distinct from NEW.currency_code
    or OLD.category is distinct from NEW.category
    or OLD.subcategory is distinct from NEW.subcategory
    or OLD.skin_types is distinct from NEW.skin_types
    or OLD.concerns is distinct from NEW.concerns
    or OLD.tags is distinct from NEW.tags
    or OLD.benefits is distinct from NEW.benefits
    or OLD.ingredients is distinct from NEW.ingredients
    or OLD.name is distinct from NEW.name
    or OLD.brand is distinct from NEW.brand
    or OLD.images is distinct from NEW.images
  then
    perform private.beauty_catalog_revision_bump();
  end if;

  return coalesce(NEW, OLD);
end;
$$;

drop trigger if exists beauty_catalog_revision_products on public.products;
create trigger beauty_catalog_revision_products
after insert or update or delete on public.products
for each row execute function private.beauty_products_catalog_revision_trigger();

create or replace function private.beauty_variants_catalog_revision_trigger()
returns trigger
language plpgsql
security definer
set search_path = public, private, pg_catalog
as $$
begin
  if TG_OP in ('INSERT', 'DELETE') then
    perform private.beauty_catalog_revision_bump();
  elsif
    OLD.product_id is distinct from NEW.product_id
    or OLD.name is distinct from NEW.name
    or OLD.price is distinct from NEW.price
    or OLD.stock_quantity is distinct from NEW.stock_quantity
    or OLD.attributes is distinct from NEW.attributes
    or OLD.is_active is distinct from NEW.is_active
  then
    perform private.beauty_catalog_revision_bump();
  end if;

  return coalesce(NEW, OLD);
end;
$$;

drop trigger if exists beauty_catalog_revision_product_variants on public.product_variants;
create trigger beauty_catalog_revision_product_variants
after insert or update or delete on public.product_variants
for each row execute function private.beauty_variants_catalog_revision_trigger();

create or replace function private.beauty_catalog_revision_token()
returns text
language sql
stable
security definer
set search_path = private, pg_catalog
as $$
  select 'CATALOG_V1:EG-EGP:' || revision::text
  from private.beauty_catalog_revision
  where scope = 'EG-EGP';
$$;

create or replace function private.beauty_build_run_response(
  p_run_id uuid,
  p_from_cache boolean
)
returns jsonb
language sql
stable
security definer
set search_path = public, private, pg_catalog
as $$
  select jsonb_build_object(
    'contract_version', 'beauty-recommendation.v1',
    'status', 'success',
    'run', jsonb_build_object(
      'id', r.id,
      'ruleset_version', r.ruleset_version,
      'catalog_revision', r.catalog_revision,
      'created_at', r.created_at,
      'from_cache', p_from_cache,
      'cache_expires_at', r.created_at + interval '24 hours'
    ),
    'recommendations',
      coalesce(
        jsonb_agg(
          jsonb_build_object(
            'position', i.position,
            'product_id', i.product_id,
            'product_variant_id', i.product_variant_id,
            'score', i.score,
            'reason_codes', i.reason_codes,
            'product', jsonb_build_object(
              'id', p.id,
              'name', p.name,
              'brand', p.brand,
              'price', p.price,
              'currency_code', p.currency_code,
              'image_url',
                case
                  when jsonb_typeof(p.images) = 'array'
                   and jsonb_array_length(p.images) > 0
                  then p.images ->> 0
                  else null
                end
            ),
            'variant',
              case
                when v.id is null then null
                else jsonb_build_object(
                  'id', v.id,
                  'name', v.name,
                  'price', v.price,
                  'attributes', v.attributes
                )
              end
          )
          order by i.position
        ) filter (where i.id is not null),
        '[]'::jsonb
      )
  )
  from public.beauty_recommendation_runs r
  left join public.beauty_recommendation_items i
    on i.run_id = r.id
  left join public.products p
    on p.id = i.product_id
  left join public.product_variants v
    on v.id = i.product_variant_id
  where r.id = p_run_id
  group by r.id, r.ruleset_version, r.catalog_revision, r.created_at;
$$;

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

  v_fingerprint := encode(digest(v_input::text, 'sha256'), 'hex');

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
  priced as (
    select *,
      percentile_cont(0.5) within group (order by unit_price)
        over () as median_price
    from eligible
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
        +
        5
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
  )
  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'product_id', id,
        'product_variant_id', variant_id,
        'position', row_number() over (order by score desc, id),
        'score', score,
        'reason_codes', reason_codes
      )
      order by score desc, id
    ),
    '[]'::jsonb
  )
  into v_candidates
  from top_results;

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

create or replace function public.velora_get_beauty_recommendations()
returns jsonb
language sql
security invoker
set search_path = public, private, pg_catalog
as $$
  select private.velora_beauty_recommendation_operation();
$$;

revoke all on function public.velora_get_beauty_recommendations() from public;
revoke execute on function public.velora_get_beauty_recommendations() from anon;
grant execute on function public.velora_get_beauty_recommendations() to authenticated;

revoke all on function private.velora_beauty_recommendation_operation() from public;
revoke all on function private.beauty_build_run_response(uuid, boolean) from public;
revoke all on function private.beauty_catalog_revision_token() from public;
revoke all on function private.beauty_catalog_revision_bump() from public;
grant execute on function private.velora_beauty_recommendation_operation() to authenticated;
grant execute on function private.beauty_catalog_revision_token() to authenticated;
grant usage on schema private to authenticated;
